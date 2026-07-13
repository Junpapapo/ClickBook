import { t } from "../i18n";
import { getChatState, updateChatState, subscribeChatState } from "./chat-state";
import { formatTime, scrollToBottom } from "./chat-utils";
import type { ChatMessage } from "./chat-types";
import { updateBuddyState } from "../buddy-state";
import { parseMarkdown } from "../buddy-utils";

export function renderChatCard(container: HTMLElement): void {
  // 드래그된 텍스트 감지 (질문 시 Context로 제공)
  let selectedText = window.getSelection()?.toString().trim() || "";

  // 1. 기존 잔상 클리어 및 고정 서브 래퍼 삽입
  container.innerHTML = "";
  const wrapper = document.createElement("div");
  wrapper.className = "buddy-chat-wrap";
  container.appendChild(wrapper);

  wrapper.innerHTML = `
    <!-- 대화 메시지 영역 -->
    <div class="chat-messages-box" id="buddy-chat-messages"></div>

    <!-- 선택된 텍스트 컨텍스트 표시 -->
    ${selectedText ? `
      <div class="chat-drag-context">
        <strong>${t("chatDragContext")}</strong>
        <div class="chat-drag-text-val">${selectedText}</div>
      </div>
    ` : ""}

    <!-- 입력 행 -->
    <div class="chat-input-row">
      <textarea class="buddy-textarea chat-input-field" id="buddy-chat-input" placeholder="${t("chatPlaceholder")}" style="min-height: 48px; max-height: 120px; resize: none; margin-bottom: 0;"></textarea>
      <button type="button" class="buddy-btn chat-send-btn" id="buddy-chat-send" style="height: 48px; padding: 0 16px;">${t("chatSend")}</button>
    </div>
  `;

  const messagesBox = wrapper.querySelector("#buddy-chat-messages") as HTMLDivElement;
  const inputField = wrapper.querySelector("#buddy-chat-input") as HTMLTextAreaElement;
  const sendBtn = wrapper.querySelector("#buddy-chat-send") as HTMLButtonElement;

  const chatState = getChatState();
  inputField.value = chatState.chatInputCache;

  // 2. 패널 상단 공통 헤더에 대화 비우기(🗑️) 버튼 동적 삽입
  const header = container.parentElement?.querySelector(".panel-header") as HTMLElement;
  let clearBtn: HTMLButtonElement | null = null;
  
  if (header) {
    clearBtn = header.querySelector("#buddy-chat-clear") as HTMLButtonElement;
    if (!clearBtn) {
      clearBtn = document.createElement("button");
      clearBtn.type = "button";
      clearBtn.id = "buddy-chat-clear";
      clearBtn.className = "panel-header-action-btn";
      clearBtn.innerHTML = "🗑️";
      clearBtn.title = t("chatClearConfirm"); // i18n
      
      const closeBtn = header.querySelector(".panel-close-btn");
      if (closeBtn) {
        header.insertBefore(clearBtn, closeBtn);
      } else {
        header.appendChild(clearBtn);
      }
    }
  }

  // 타이핑 내용 상태 캐시 동기화
  inputField.addEventListener("input", () => {
    updateChatState({ chatInputCache: inputField.value });
  });

  // 드래그 자동 전송 처리
  if (chatState.pendingAutoSend && chatState.chatInputCache.trim()) {
    updateChatState({ pendingAutoSend: false });
    setTimeout(() => {
      handleSend();
    }, 100);
  }

  // 메시지 렌더링 헬퍼
  const renderMessageList = (messages: ChatMessage[], isGenerating: boolean) => {
    messagesBox.innerHTML = messages.map(msg => {
      const isUser = msg.sender === "user";
      const bubbleClass = isUser ? "user-bubble" : "buddy-bubble";
      const alignClass = isUser ? "msg-user-align" : "msg-buddy-align";
      const timeStr = formatTime(msg.timestamp);
      const htmlContent = isUser ? msg.text : parseMarkdown(msg.text);

      return `
        <div class="chat-message-row ${alignClass}">
          <div class="chat-bubble ${bubbleClass}">
            <div class="bubble-text">${htmlContent}</div>
            <div class="bubble-time">${timeStr}</div>
          </div>
        </div>
      `;
    }).join("");

    // 생각 중 스피너 표시
    if (isGenerating) {
      messagesBox.insertAdjacentHTML("beforeend", `
        <div class="chat-message-row msg-buddy-align">
          <div class="chat-bubble buddy-bubble thinking">
            <div class="thinking-spinner">
              <span></span><span></span><span></span>
            </div>
            <span style="font-size: 11px; margin-left: 6px; color: var(--text-sub);">${t("chatThinking")}</span>
          </div>
        </div>
      `);
    }

    scrollToBottom(messagesBox);
  };

  let lastMessageCount = -1;
  let lastGeneratingState = false;

  // 상태 구독 연동
  const unsubscribe = subscribeChatState((s) => {
    const isMessagesChanged = s.messages.length !== lastMessageCount || s.isGenerating !== lastGeneratingState;
    if (isMessagesChanged) {
      renderMessageList(s.messages, s.isGenerating);
      lastMessageCount = s.messages.length;
      lastGeneratingState = s.isGenerating;
    }
    
    // 로딩 중에는 입력 제어
    inputField.disabled = s.isGenerating;
    sendBtn.disabled = s.isGenerating || !inputField.value.trim();
    if (clearBtn) {
      clearBtn.disabled = s.isGenerating || s.messages.length === 0;
      clearBtn.style.opacity = (s.isGenerating || s.messages.length === 0) ? "0.4" : "1";
      clearBtn.style.cursor = (s.isGenerating || s.messages.length === 0) ? "not-allowed" : "pointer";
    }
  });

  // 전송 처리 함수
  const handleSend = () => {
    const text = inputField.value.trim();
    if (!text) return;

    const currentMessages = getChatState().messages;
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: Date.now()
    };

    // 상태 업데이트: 전송 메시지 추가, 생성 중 마킹, 입력창 초기화
    updateChatState({
      messages: [...currentMessages, userMsg],
      chatInputCache: "",
      isGenerating: true
    });
    inputField.value = "";

    // AI 처리 모션 연동
    updateBuddyState({ actionStatus: "loading" });

    // 전송 후 로컬 문맥 즉시 휘발 (이후의 일반 타이핑 질문이 영향받지 않도록 조치)
    const activeContext = selectedText;
    selectedText = "";
    const contextBadge = wrapper.querySelector(".chat-drag-context");
    if (contextBadge) {
      contextBadge.remove();
    }

    // 백그라운드 AI 통신
    chrome.runtime.sendMessage({
      type: "BUDDY_ASK_AI",
      text,
      context: activeContext
    }).then((res: any) => {
      const stateNow = getChatState();
      if (res && res.success && res.data) {
        const buddyMsg: ChatMessage = {
          id: `buddy-${Date.now()}`,
          sender: "buddy",
          text: res.data.answer,
          timestamp: Date.now()
        };
        updateChatState({
          messages: [...stateNow.messages, buddyMsg],
          isGenerating: false
        });
        updateBuddyState({ actionStatus: "success" });
        setTimeout(() => updateBuddyState({ actionStatus: "idle" }), 1500);
      } else {
        const errText = (res && res.error) ? (res.error === "Timeout" ? t("aiErrorTimeout") : res.error) : t("aiErrorGeneral");
        const errMsg: ChatMessage = {
          id: `buddy-error-${Date.now()}`,
          sender: "buddy",
          text: errText,
          timestamp: Date.now()
        };
        updateChatState({
          messages: [...stateNow.messages, errMsg],
          isGenerating: false
        });
        updateBuddyState({ actionStatus: "error" });
        setTimeout(() => updateBuddyState({ actionStatus: "idle" }), 2000);
      }
    }).catch((err: any) => {
      const stateNow = getChatState();
      const rawError = err.message || String(err);
      const errText = rawError.includes("Timeout") ? t("aiErrorTimeout") : (err.message || t("aiErrorNetwork"));
      const errMsg: ChatMessage = {
        id: `buddy-error-${Date.now()}`,
        sender: "buddy",
        text: errText,
        timestamp: Date.now()
      };
      updateChatState({
        messages: [...stateNow.messages, errMsg],
        isGenerating: false
      });
      updateBuddyState({ actionStatus: "error" });
      setTimeout(() => updateBuddyState({ actionStatus: "idle" }), 2000);
    });
  };

  // 엔터 키 전송 (Shift+Enter는 줄바꿈)
  inputField.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  // 전송 버튼 클릭
  sendBtn.addEventListener("click", handleSend);

  // 헤더 지우기 버튼 이벤트 바인딩
  if (clearBtn) {
    clearBtn.onclick = () => {
      if (getChatState().isGenerating) return;
      updateChatState({ messages: [], chatInputCache: "" });
      inputField.value = "";
      updateBuddyState({ actionStatus: "success" });
      setTimeout(() => updateBuddyState({ actionStatus: "idle" }), 1500);
    };
  }

  // 컴포넌트 언마운트 시 메모리 정리 및 헤더 🗑️ 단추 청소
  const observer = new MutationObserver(() => {
    if (!wrapper.isConnected) {
      unsubscribe();
      const clearIcon = container.parentElement?.querySelector("#buddy-chat-clear");
      if (clearIcon) {
        clearIcon.remove();
      }
      observer.disconnect();
    }
  });
  observer.observe(container.ownerDocument, { childList: true, subtree: true });
}
