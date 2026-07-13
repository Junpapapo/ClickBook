import { getBuddyState, updateBuddyState, addBuddyXp } from "../buddy-state";
import { VOICE_PRESETS } from "../buddy-constants";
import { showBuddyToast } from "./buddy-toast";
import { t, tForLang } from "../i18n";
import { updateChatState } from "../chat/chat-state";
import { parseMarkdown } from "../buddy-utils";
import { highlightAndAnchorText } from "./sticky-memo";

let activeToolbar: HTMLElement | null = null;
let currentSelectionText = "";
let cachedSelectionRect: DOMRect | null = null;

let activeSpeakBtn: HTMLButtonElement | null = null;

// TTS 음성 정지 헬퍼
function stopSpeech(): void {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  if (activeSpeakBtn) {
    activeSpeakBtn.innerHTML = "🔊";
    activeSpeakBtn.title = "Listen";
    activeSpeakBtn = null;
  }
}

// TTS 음성 토글 재생 헬퍼
function toggleSpeech(text: string, btn: HTMLButtonElement): void {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    showBuddyToast(t("ttsUnavailable" as any));
    return;
  }

  // 재생 중이면서 현재 버튼인 경우 정지
  if (window.speechSynthesis.speaking && activeSpeakBtn === btn) {
    stopSpeech();
    return;
  }

  // 이전 재생 강제 중단
  stopSpeech();

  activeSpeakBtn = btn;
  btn.innerHTML = "⏹️";
  btn.title = "Stop";

  const utterance = new SpeechSynthesisUtterance(text);
  // 한글 판별에 따른 언어 세팅
  const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(text);
  utterance.lang = hasKorean ? "ko-KR" : "en-US";

  // 캐릭터 보이스 톤(Pitch, Rate) 적용
  const buddyId = getBuddyState().config?.buddyId || "owl";
  const voicePreset = VOICE_PRESETS[buddyId];
  if (voicePreset) {
    utterance.pitch = voicePreset.pitch;
    utterance.rate = voicePreset.rate;
  }

  utterance.onend = () => {
    if (activeSpeakBtn === btn) {
      stopSpeech();
    }
  };

  utterance.onerror = () => {
    if (activeSpeakBtn === btn) {
      stopSpeech();
    }
  };

  window.speechSynthesis.speak(utterance);
}

// 질문 프리셋 선택 박스 표시 및 제거 헬퍼
function removePresetSelector(shadow: ShadowRoot): void {
  const existing = shadow.querySelector(".buddy-presets-selector");
  if (existing) {
    existing.remove();
  }
}

function showPresetSelector(
  shadow: ShadowRoot, 
  evt: MouseEvent,
  selectedText: string, 
  presets: string[]
): void {
  removePresetSelector(shadow);

  const state = getBuddyState();
  const currentTheme = (state.config && state.config.theme) || "midnight";

  const selector = document.createElement("div");
  selector.className = `buddy-presets-selector theme-${currentTheme}`;
  selector.style.position = "fixed";
  selector.style.zIndex = "10002";
  selector.style.background = "var(--bg-panel)";
  selector.style.border = "1px solid var(--border-color)";
  selector.style.borderRadius = "8px";
  selector.style.padding = "6px";
  selector.style.width = "200px";
  selector.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.2)";
  selector.style.backdropFilter = "blur(12px)";
  selector.style.webkitBackdropFilter = "blur(12px)";
  selector.style.display = "flex";
  selector.style.flexDirection = "column";
  selector.style.gap = "2px";
  
  if (activeToolbar) {
    const tRect = activeToolbar.getBoundingClientRect();
    let left = tRect.left + tRect.width / 2 - 100;
    let top = tRect.bottom + 6;
    
    if (left + 210 > window.innerWidth) {
      left = window.innerWidth - 210;
    }
    if (left < 10) left = 10;
    
    if (top + 180 > window.innerHeight) {
      top = tRect.top - 160; 
    }

    selector.style.left = `${left}px`;
    selector.style.top = `${top}px`;
  } else {
    selector.style.left = `${evt.clientX - 100}px`;
    selector.style.top = `${evt.clientY + 12}px`;
  }

  const presetItems = presets.map((p) => {
    const escaped = p.replace(/"/g, "&quot;");
    return `
      <div class="preset-select-item" data-val="${escaped}" style="padding: 6px 8px; font-size: 11px; color: var(--text-main); cursor: pointer; border-radius: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; transition: background-color 0.1s ease;">
        💡 ${p}
      </div>
    `;
  }).join("");

  selector.innerHTML = `
    <div style="font-size: 9.5px; font-weight: 700; color: var(--text-sub); padding: 2px 8px 4px; border-bottom: 1px solid var(--border-color); margin-bottom: 4px; user-select: none;">
      AI Question Presets
    </div>
    <div style="max-height: 120px; overflow-y: auto; display: flex; flex-direction: column; gap: 2px;">
      ${presetItems}
      <div class="preset-select-item direct-ask" style="padding: 6px 8px; font-size: 11px; color: var(--accent-color); font-weight: 600; cursor: pointer; border-radius: 4px; border-top: 1px dashed var(--border-color); margin-top: 2px; transition: background-color 0.1s ease;">
        💬 Ask Directly (Default)
      </div>
    </div>
  `;

  shadow.appendChild(selector);

  // 리스너 바인딩
  selector.querySelectorAll(".preset-select-item").forEach((item) => {
    const el = item as HTMLElement;
    el.addEventListener("mouseenter", () => {
      el.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
    });
    el.addEventListener("mouseleave", () => {
      el.style.backgroundColor = "transparent";
    });

    el.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      e.preventDefault(); // 선택 영역이 마우스다운에 의해 초기화되는 것 방지
      
      try {
        const latestState = getBuddyState();
        const targetText = selectedText || currentSelectionText;

        removePresetSelector(shadow);
        removeDragToolbar();

        let promptText = "";
        if (el.classList.contains("direct-ask")) {
          const targetLang = (latestState.config && latestState.config.targetLanguage) || "ko";
          const template = tForLang("askBuddyTemplate", targetLang);
          promptText = `${template}:\n\n"${targetText}"`;
        } else {
          const presetVal = el.getAttribute("data-val") || el.dataset.val || "";
          promptText = `${presetVal}:\n\n"${targetText}"`;
        }

        updateChatState({
          chatInputCache: promptText,
          pendingAutoSend: true
        });
        updateBuddyState({ activePanel: "chat" });
      } catch (err) {
        console.error("[Buddy Presets] Click handler error:", err);
        showBuddyToast("Failed to open chat. Please try again.");
      }
    });
  });

  // 바깥 클릭 시 자동 소멸 (composedPath를 활용해 Shadow DOM 이벤트 리타겟팅 우회)
  const onOutsideClick = (e: MouseEvent) => {
    const path = e.composedPath();
    if (!path.includes(selector)) {
      removePresetSelector(shadow);
      document.removeEventListener("mousedown", onOutsideClick);
    }
  };
  setTimeout(() => {
    document.addEventListener("mousedown", onOutsideClick);
  }, 50);
}

// 대형 학습카드 말풍선(Confirm Bubble) 띄우기
function showResultBubble(
  shadow: ShadowRoot, 
  buddyContainer: HTMLElement, 
  actionType: "translate" | "summary" | "vocab",
  inputText: string
): void {
  // 기존 말풍선 삭제
  const existing = shadow.querySelector("#buddy-confirm-bubble");
  if (existing) existing.remove();

  // 버디 컨테이너에 로딩(오라) 상태 추가
  buddyContainer.classList.add("loading");

  const bubble = document.createElement("div");
  bubble.id = "buddy-confirm-bubble";
  bubble.className = "buddy-confirm-bubble large";

  const state = getBuddyState();
  const currentTheme = (state.config && state.config.theme) || "midnight";
  bubble.classList.add(`theme-${currentTheme}`);

  // 독립된 헤더 박스 생성 (상단 고정용)
  const headerBox = document.createElement("div");
  headerBox.className = "buddy-bubble-header";
  headerBox.style.display = "flex";
  headerBox.style.alignItems = "center";
  headerBox.style.justifyContent = "space-between";
  headerBox.style.marginBottom = "6px";
  headerBox.style.borderBottom = "1px solid var(--border-color)";
  headerBox.style.paddingBottom = "5px";
  headerBox.style.fontSize = "11px";
  headerBox.style.fontWeight = "700";
  headerBox.style.color = "var(--accent-color)";
  headerBox.style.flexShrink = "0";

  // 기본 타이틀 및 귀여운 3점 통통 튀는 로딩 애니메이션
  let titleStr = t("aiAnalyzing" as any);
  if (actionType === "translate") titleStr = t("aiTranslating" as any);
  else if (actionType === "summary") titleStr = t("aiSummarizing" as any);
  else if (actionType === "vocab") titleStr = t("aiVocabAnalyzing" as any);

  headerBox.innerHTML = `
    <span>${titleStr}</span>
    <div class="buddy-loading-dots">
      <div class="buddy-loading-dot"></div>
      <div class="buddy-loading-dot"></div>
      <div class="buddy-loading-dot"></div>
    </div>
  `;

  // 스크롤 내부 박스 생성 (본문 결과만 포함)
  const scrollBox = document.createElement("div");
  scrollBox.className = "buddy-bubble-scroll";
  scrollBox.innerHTML = `
    <div class="skeleton-row" style="width: 90%; margin-top: 4px;"></div>
    <div class="skeleton-row" style="width: 75%;"></div>
    <div class="skeleton-row" style="width: 80%;"></div>
  `;

  // 하단 단추 박스
  const btnRow = document.createElement("div");
  btnRow.className = "buddy-bubble-buttons";

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "buddy-bubble-btn cancel";
  closeBtn.textContent = t("confirmClose" as any);
  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    bubble.classList.remove("show");
    bubble.style.transform = "scale(0.9)";
    buddyContainer.classList.remove("loading");
    // 말풍선 닫힐 때 음성 재생도 즉각 중단
    stopSpeech();
    setTimeout(() => bubble.remove(), 200);
  });

  btnRow.appendChild(closeBtn);
  bubble.appendChild(headerBox);
  bubble.appendChild(scrollBox);
  bubble.appendChild(btnRow);
  shadow.appendChild(bubble);

  // 위치 조정 함수 (실제 렌더링된 물리적 offsetHeight를 사용하여 캐릭터 덮어씀 방지 및 짤림 예방)
  const updatePosition = () => {
    const rect = buddyContainer.getBoundingClientRect();
    const bubbleWidth = 260; // 대형 폭
    
    // 하드코딩 대신 렌더링 완료된 실제 높이 구함 (최초 마운트 시 0이면 150px 폴백)
    const bubbleHeight = bubble.offsetHeight || 150; 
    
    const left = rect.left + rect.width / 2 - bubbleWidth / 2;
    let top = rect.top - bubbleHeight - 14; // 기본값: 머리 위 14px

    // 만약 화면 위쪽 공간이 10px 미만으로 부족하여 클리핑될 위기라면 발 밑으로 쇽 배치 변경
    if (top < 10) {
      top = rect.bottom + 14;
      bubble.classList.add("bubble-bottom-side");
    } else {
      bubble.classList.remove("bubble-bottom-side");
    }

    // 가로축도 화면 밖으로 튀어나가지 않게 Clamp 처리 (최소 8px 여백 보장)
    bubble.style.left = `${Math.max(8, Math.min(left, window.innerWidth - bubbleWidth - 8))}px`;
    bubble.style.top = `${top}px`;
  };

  // 마운트 직후 위치 1차 정렬
  updatePosition();

  requestAnimationFrame(() => {
    bubble.classList.add("show");
  });

  // 스크롤 및 화면 리사이즈 대응
  const handleScrollResize = () => {
    if (bubble.parentNode) {
      updatePosition();
    } else {
      window.removeEventListener("scroll", handleScrollResize);
      window.removeEventListener("resize", handleScrollResize);
    }
  };
  window.addEventListener("scroll", handleScrollResize, { passive: true });
  window.addEventListener("resize", handleScrollResize);

  // 백그라운드 나노 AI 분석 요청 송신
  const targetLang = (state.config && state.config.targetLanguage) || "ko";
  chrome.runtime.sendMessage({
    type: "BUDDY_TRANSLATE",
    text: inputText,
    wordsToTranslate: [],
    srcLang: "en",
    targetLang,
    actionType
  }).then((res: any) => {
    buddyContainer.classList.remove("loading");
    if (!bubble.parentNode) return; // 이미 닫힌 경우 무시

    if (res && res.success) {
      const resultText = res.data.translatedText;
      
      // 번역/요약 성공 경험치 지급 (+5 XP)
      addBuddyXp(5);

      // 헤더 내용 변경 (타이틀 고정, TTS 버튼 및 메모 저장 단추 추가)
      const titleLabel = actionType === "summary" ? t("aiResultSummary" as any) : t("aiResultTranslation" as any);
      headerBox.innerHTML = `
        <span>${titleLabel}</span>
        <div style="display: flex; align-items: center; gap: 8px;">
          <button type="button" class="translate-speak-btn" title="Listen" style="background: transparent; border: none; cursor: pointer; font-size: 12px; padding: 2px 4px; display: flex; align-items: center; justify-content: center; opacity: 0.85; transition: opacity 0.15s ease, transform 0.15s ease;">
            🔊
          </button>
          <button type="button" class="translate-save-memo-btn" title="${t("memoSave" as any)}" style="background: transparent; border: none; cursor: pointer; font-size: 12px; padding: 2px 4px; display: flex; align-items: center; justify-content: center; opacity: 0.85; transition: opacity 0.15s ease, transform 0.15s ease;">
            📝
          </button>
        </div>
      `;

      // 스크롤 본문 내용 (본문만)
      scrollBox.innerHTML = `
        <div style="font-size: 11.5px; line-height: 1.5; white-space: pre-wrap;">${parseMarkdown(resultText)}</div>
      `;

      // TTS 스피커 이벤트 추가
      const speakBtn = headerBox.querySelector(".translate-speak-btn");
      if (speakBtn) {
        speakBtn.addEventListener("mouseenter", () => {
          (speakBtn as HTMLElement).style.opacity = "1";
          (speakBtn as HTMLElement).style.transform = "scale(1.15)";
        });
        speakBtn.addEventListener("mouseleave", () => {
          (speakBtn as HTMLElement).style.opacity = "0.85";
          (speakBtn as HTMLElement).style.transform = "scale(1)";
        });
        speakBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          toggleSpeech(resultText, speakBtn as HTMLButtonElement);
        });
      }

      // 메모장 연동 이벤트 추가 (headerBox 내부에서 버튼 조회)
      const saveBtn = headerBox.querySelector(".translate-save-memo-btn");
      if (saveBtn) {
        // 호버 스타일 동적 추가 (인라인 호버 미지원 방어)
        saveBtn.addEventListener("mouseenter", () => {
          (saveBtn as HTMLElement).style.opacity = "1";
          (saveBtn as HTMLElement).style.transform = "scale(1.15)";
        });
        saveBtn.addEventListener("mouseleave", () => {
          (saveBtn as HTMLElement).style.opacity = "0.85";
          (saveBtn as HTMLElement).style.transform = "scale(1)";
        });

        saveBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const saveBtnEl = saveBtn as HTMLButtonElement;
          saveBtnEl.disabled = true;

          const nowStr = new Date().toLocaleString();
          const tag = actionType === "summary" ? "Summary" : "Translation";
          const memoContent = `[${tag} Result - ${nowStr}]\nOriginal: ${inputText}\nResult:\n${resultText}`;

          chrome.runtime.sendMessage({
            type: "BUDDY_SAVE_MEMO",
            url: window.location.href,
            content: memoContent,
            color: "yellow"
          }).then((memoRes: any) => {
            if (memoRes && memoRes.success) {
              // 메모 저장 성공 경험치 지급 (+10 XP)
              addBuddyXp(10);
              
              const anchoredId = `anchored_${Date.now()}`;
              chrome.runtime.sendMessage({
                type: "BUDDY_SAVE_ANCHORED_MEMO",
                url: window.location.href,
                anchorText: inputText,
                content: memoContent,
                color: "yellow"
              }).then((resAnchor: any) => {
                if (resAnchor && resAnchor.success) {
                  highlightAndAnchorText(shadow, {
                    id: anchoredId,
                    anchorText: inputText,
                    content: memoContent,
                    color: "yellow"
                  });
                }
              }).catch(() => {});

              showBuddyToast(t("memoSaved" as any) || "Memo saved!");
              saveBtnEl.innerHTML = "✅";
              saveBtnEl.style.opacity = "1";
            } else {
              showBuddyToast("Failed to save memo.");
              saveBtnEl.disabled = false;
            }
          }).catch(() => {
            showBuddyToast("Failed to save memo.");
            saveBtnEl.disabled = false;
          });
        });
      }
    } else {
      headerBox.innerHTML = `<span>Error</span>`;
      scrollBox.innerHTML = `
        <div style="color: #ef4444; font-size: 11.5px;">${t("aiErrorGeneral" as any)}<br>${res?.error || ""}</div>
      `;
    }

    // 결과 렌더링 완료 후 늘어난 실제 offsetHeight로 위치 2차 정밀 리포지셔닝 (가림 원천 제거)
    setTimeout(() => {
      updatePosition();
    }, 50);
  }).catch((err) => {
    buddyContainer.classList.remove("loading");
    headerBox.innerHTML = `<span>Error</span>`;
    scrollBox.innerHTML = `
      <div style="color: #ef4444; font-size: 11.5px;">${t("aiErrorNetwork" as any)}</div>
    `;
    updatePosition();
  });
}

// 윈도우 스코프에 전역 TTS 함수 임포트 (onclick 대응)
if (typeof window !== "undefined") {
  (window as any).__buddySpeakText = (text: string) => {
    if (window.speechSynthesis) {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      } else {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(text) ? "ko-KR" : "en-US";
        
        // 보이스 톤 적용
        const buddyId = getBuddyState().config?.buddyId || "owl";
        const voicePreset = VOICE_PRESETS[buddyId];
        if (voicePreset) {
          u.pitch = voicePreset.pitch;
          u.rate = voicePreset.rate;
        }
        
        window.speechSynthesis.speak(u);
      }
    }
  };
}

// 드래그 툴바 제거
function removeDragToolbar(): void {
  if (activeToolbar) {
    activeToolbar.classList.remove("show");
    const t = activeToolbar;
    activeToolbar = null;
    setTimeout(() => t.remove(), 200);
  }
  // 프리셋 선택창도 함께 제거
  const root = document.getElementById("clickbook-buddy-root");
  if (root && root.shadowRoot) {
    removePresetSelector(root.shadowRoot);
  }
  // TTS 재생도 즉각 중단
  stopSpeech();
}

// 마우스 드래그 선택 이벤트 핸들링 초기화
export function initDragActions(shadow: ShadowRoot, buddyContainer: HTMLElement): void {
  const handleMouseUp = (e: MouseEvent) => {
    // 설정에서 드래그 메뉴가 꺼져 있다면 미동작
    const state = getBuddyState();
    if (state.config && state.config.showDragMenu === false) {
      removeDragToolbar();
      return;
    }

    // 래디얼 메뉴나 설정 카드, 말풍선 클릭 시에는 드래그 툴바가 뜨지 않도록 처리
    const path = e.composedPath();
    const insideBuddy = path.some(
      (node) => node instanceof HTMLElement && (
        node.id === "buddy-container" || 
        node.classList.contains("floating-panel") || 
        node.classList.contains("buddy-confirm-bubble")
      )
    );
    if (insideBuddy) return;

    // 선택 영역 텍스트 추출
    const selection = window.getSelection();
    const text = selection ? selection.toString().trim() : "";

    // 드래그가 해제되었거나 빈 텍스트면 제거
    if (!text || text.length < 2) {
      removeDragToolbar();
      return;
    }

    currentSelectionText = text;

    // 이미 열려 있는 툴바가 있다면 제거
    removeDragToolbar();

    // 툴바 엘리먼트 생성
    const toolbar = document.createElement("div");
    toolbar.className = "buddy-drag-toolbar";

    const ttsBtn = document.createElement("button");
    ttsBtn.type = "button";
    ttsBtn.className = "buddy-drag-btn tts";
    ttsBtn.innerHTML = "🔊";
    ttsBtn.title = "Listen";
    ttsBtn.style.display = "inline-flex";
    ttsBtn.style.alignItems = "center";
    ttsBtn.style.justifyContent = "center";
    ttsBtn.style.width = "24px";
    ttsBtn.style.height = "24px";
    ttsBtn.style.padding = "0";
    ttsBtn.style.borderRadius = "50%";
    ttsBtn.style.fontSize = "11px";
    ttsBtn.style.background = "#6366f1";
    ttsBtn.style.color = "white";
    ttsBtn.style.border = "none";
    ttsBtn.style.cursor = "pointer";
    ttsBtn.style.flexShrink = "0";
    ttsBtn.addEventListener("click", (evt) => {
      evt.stopPropagation();
      toggleSpeech(currentSelectionText, ttsBtn);
    });

    const summaryBtn = document.createElement("button");
    summaryBtn.type = "button";
    summaryBtn.className = "buddy-drag-btn summary";
    summaryBtn.textContent = t("dragSummary" as any);
    summaryBtn.addEventListener("click", (evt) => {
      evt.stopPropagation();
      removeDragToolbar();
      showResultBubble(shadow, buddyContainer, "summary", currentSelectionText);
    });

    const transBtn = document.createElement("button");
    transBtn.type = "button";
    transBtn.className = "buddy-drag-btn translate";
    transBtn.textContent = t("dragTranslate" as any);
    transBtn.addEventListener("click", (evt) => {
      evt.stopPropagation();
      removeDragToolbar();
      showResultBubble(shadow, buddyContainer, "translate", currentSelectionText);
    });

    const askBuddyBtn = document.createElement("button");
    askBuddyBtn.type = "button";
    askBuddyBtn.className = "buddy-drag-btn chat";
    askBuddyBtn.textContent = t("dragAskBuddy" as any);
    askBuddyBtn.addEventListener("click", (evt) => {
      evt.stopPropagation();
      
      const state = getBuddyState();
      const presets = (state.config && state.config.aiPromptPresets) || [];

      if (presets.length > 0) {
        showPresetSelector(shadow, evt, currentSelectionText, presets);
      } else {
        removeDragToolbar();
        const targetLang = (state.config && state.config.targetLanguage) || "ko";
        const template = tForLang("askBuddyTemplate", targetLang);
        const promptText = `${template}:\n\n"${currentSelectionText}"`;

        updateChatState({
          chatInputCache: promptText,
          pendingAutoSend: true
        });
        updateBuddyState({ activePanel: "chat" });
      }
    });

    toolbar.appendChild(ttsBtn);
    toolbar.appendChild(summaryBtn);
    toolbar.appendChild(transBtn);
    toolbar.appendChild(askBuddyBtn);
    shadow.appendChild(toolbar);

    activeToolbar = toolbar;

    // 드래그 영역 좌표 가져오기
    try {
      const range = selection!.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      cachedSelectionRect = rect;
      
      const toolbarWidth = 224; // 버튼 추가에 따른 폭 상향
      const toolbarHeight = 30;
      
      let left = rect.left + rect.width / 2 - toolbarWidth / 2;
      let top = rect.top - toolbarHeight - 8; // 선택 영역 위쪽 8px 지점

      if (top < 8) {
        top = rect.bottom + 8;
      }

      toolbar.style.left = `${Math.max(8, Math.min(left, window.innerWidth - toolbarWidth - 8))}px`;
      toolbar.style.top = `${top}px`;
    } catch {
      toolbar.style.left = `${e.clientX - 70}px`;
      toolbar.style.top = `${e.clientY - 38}px`;
    }

    // 트랜지션 애니메이션
    requestAnimationFrame(() => {
      toolbar.classList.add("show");
    });
  };

  const handleMouseDown = (e: MouseEvent) => {
    const path = e.composedPath();
    const isInsideToolbar = activeToolbar && path.includes(activeToolbar);
    const isInsideSelector = path.some(
      (node) => node instanceof Element && node.classList.contains("buddy-presets-selector")
    );

    if (isInsideToolbar || isInsideSelector) {
      return; // 툴바나 프리셋 드롭다운 내부 클릭 시에는 제거하지 않고 유지
    }

    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.toString().trim() === "") {
        removeDragToolbar();
      }
    }, 150);
  };

  document.addEventListener("mouseup", handleMouseUp);
  document.addEventListener("mousedown", handleMouseDown);

  // 클린업 함수를 root에 바인딩
  const root = document.getElementById("clickbook-buddy-root");
  if (root) {
    const oldCleanup = (root as any).__cleanupBuddy;
    (root as any).__cleanupBuddy = () => {
      if (typeof oldCleanup === "function") oldCleanup();
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousedown", handleMouseDown);
      removeDragToolbar();
    };
  }
}
