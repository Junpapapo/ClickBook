import { t } from "../i18n";
import { getVocabState, updateVocabState, subscribeVocabState } from "./vocab-state";
import { parseVocabItem, generateQuiz } from "./vocab-utils";
import { updateBuddyState } from "../buddy-state";
import { showBuddyToast } from "../components/buddy-toast";

function speakText(text: string): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  window.speechSynthesis.speak(utterance);
}

export function renderVocabCard(container: HTMLElement): void {
  // 1. 메모 로딩 시동
  updateVocabState({ isLoading: true, items: [] });

  chrome.runtime.sendMessage({
    type: "BUDDY_GET_ALL_MEMOS"
  }).then((res: any) => {
    if (res && res.success && res.data) {
      const items: any[] = [];
      Object.entries(res.data).forEach(([id, memo]: [string, any]) => {
        const parsed = parseVocabItem(id, memo.content, memo.updatedAt);
        if (parsed) {
          items.push(parsed);
        }
      });
      // 최신순 정렬
      items.sort((a, b) => b.updatedAt - a.updatedAt);
      
      updateVocabState({
        items,
        isLoading: false,
        currentCardIndex: 0,
        showMeaning: false,
        quizQuestion: generateQuiz(items),
        selectedChoice: null,
        isAnswered: false,
        quizScore: 0
      });
    } else {
      updateVocabState({ isLoading: false });
    }
  }).catch(() => {
    updateVocabState({ isLoading: false });
  });

  // TTS 실행 함수
  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    }
  };

  const unsubscribe = subscribeVocabState((s) => {
    if (s.isLoading) {
      container.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 140px; color: var(--text-sub); font-size: 13px;">
          <div class="buddy-loading-dots">
            <span class="buddy-loading-dot"></span>
            <span class="buddy-loading-dot"></span>
            <span class="buddy-loading-dot"></span>
          </div>
          <span style="margin-left: 8px;">${t("memoLoading")}</span>
        </div>
      `;
      return;
    }

    if (s.items.length === 0) {
      container.innerHTML = `
        <div style="padding: 16px 8px; text-align: center; color: var(--text-sub); font-size: 12.5px; line-height: 1.5;">
          ⚠️ ${t("vocabNoData")}
        </div>
      `;
      return;
    }

    // 상단 탭 및 모드 컨테이너 렌더링
    container.innerHTML = `
      <div class="vocab-tabs">
        <button class="vocab-tab-btn ${s.viewMode === "list" ? "active" : ""}" data-mode="list">${t("vocabModeList")}</button>
        <button class="vocab-tab-btn ${s.viewMode === "review" ? "active" : ""}" data-mode="review">${t("vocabModeReview")}</button>
        <button class="vocab-tab-btn ${s.viewMode === "quiz" ? "active" : ""}" data-mode="quiz">${t("vocabModeQuiz")}</button>
      </div>
      <div class="vocab-content-area"></div>
    `;

    const contentArea = container.querySelector(".vocab-content-area") as HTMLDivElement;

    // 모드별 분기 렌더링
    if (s.viewMode === "list") {
      // 1. 목록 모드
      contentArea.innerHTML = `
        <div class="vocab-list-wrapper">
          ${s.items.map(item => `
            <div class="vocab-list-item">
              <div class="vocab-list-left">
                <span class="vocab-list-word">${item.word}</span>
                ${item.pronunciation ? `<span class="vocab-list-pron">${item.pronunciation}</span>` : ""}
              </div>
              <div class="vocab-list-right" style="display: flex; align-items: center; gap: 8px;">
                <span class="vocab-list-mean">${item.meaning}</span>
                <button type="button" class="vocab-speaker-mini" data-word="${item.word}" style="background: transparent; border: none; cursor: pointer; padding: 2px; font-size: 13px;">🔊</button>
                <button type="button" class="vocab-delete-mini" data-id="${item.id}" title="${t("memoDelete")}" style="background: transparent; border: none; cursor: pointer; padding: 2px; font-size: 13px; color: var(--text-sub); transition: color 0.15s ease;">🗑️</button>
              </div>
            </div>
          `).join("")}
        </div>
      `;

      // 리스트 내 스피커 버튼 이벤트
      contentArea.querySelectorAll(".vocab-speaker-mini").forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const word = (btn as HTMLElement).dataset.word || "";
          speakText(word);
        });
      });

      // 리스트 내 개별 단어 삭제 버튼 이벤트
      contentArea.querySelectorAll(".vocab-delete-mini").forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const id = (btn as HTMLElement).dataset.id || "";
          if (!id) {
            console.error("[Vocab Delete] Failed: ID is empty for element:", btn);
            return;
          }

          console.log("[Vocab Delete] Requesting deletion for ID:", id);
          const btnEl = btn as HTMLButtonElement;
          btnEl.disabled = true;

          chrome.runtime.sendMessage({
            type: "BUDDY_DELETE_MEMO",
            url: id
          }).then((res: any) => {
            if (res && res.success) {
              console.log("[Vocab Delete] Successfully deleted ID:", id);
              // 단어 리스트 상태 즉시 갱신
              const nextItems = s.items.filter(x => x.id !== id);
              updateVocabState({ items: nextItems });
              updateBuddyState({ actionStatus: "success" });
              setTimeout(() => updateBuddyState({ actionStatus: "idle" }), 1500);
            } else {
              console.error("[Vocab Delete] Failed from background:", res?.error);
              showBuddyToast("Failed to delete word card.");
              btnEl.disabled = false;
            }
          }).catch((err) => {
            console.error("[Vocab Delete] Send message error:", err);
            showBuddyToast("Error communicating with background service.");
            btnEl.disabled = false;
          });
        });
      });

    } else if (s.viewMode === "review") {
      // 2. 복습 모드 (플래시 카드)
      const currentItem = s.items[s.currentCardIndex];
      if (!currentItem) return;

      contentArea.innerHTML = `
        <div class="vocab-review-card">
          <div class="vocab-card-header">
            <span class="vocab-card-count">${s.currentCardIndex + 1} / ${s.items.length}</span>
            <button class="vocab-card-speaker" data-word="${currentItem.word}">🔊 Listen</button>
          </div>
          <div class="vocab-card-body">
            <div class="vocab-card-front">${currentItem.word}</div>
            ${currentItem.pronunciation ? `<div class="vocab-card-pron">${currentItem.pronunciation}</div>` : ""}
            
            <div class="vocab-card-back ${s.showMeaning ? "show" : ""}">
              <div class="vocab-card-mean">${currentItem.meaning}</div>
              ${currentItem.nuance ? `<div class="vocab-card-nuance">${currentItem.nuance}</div>` : ""}
            </div>
          </div>
          <div class="vocab-card-footer">
            <button class="buddy-btn-secondary" id="vocab-toggle-meaning" style="width: 100%; margin-bottom: 8px;">
              ${s.showMeaning ? t("vocabCardHideMeaning") : t("vocabCardShowMeaning")}
            </button>
            <div style="display: flex; gap: 8px; width: 100%;">
              <button class="buddy-btn-secondary" id="vocab-prev-card" style="flex: 1;" ${s.currentCardIndex === 0 ? "disabled" : ""}>◀</button>
              <button class="buddy-btn" id="vocab-next-card" style="flex: 1;" ${s.currentCardIndex === s.items.length - 1 ? "disabled" : ""}>▶</button>
            </div>
          </div>
        </div>
      `;

      // 이벤트 바인딩
      contentArea.querySelector(".vocab-card-speaker")?.addEventListener("click", () => {
        speakText(currentItem.word);
      });
      contentArea.querySelector("#vocab-toggle-meaning")?.addEventListener("click", () => {
        updateVocabState({ showMeaning: !s.showMeaning });
      });
      contentArea.querySelector("#vocab-prev-card")?.addEventListener("click", () => {
        if (s.currentCardIndex > 0) {
          updateVocabState({ currentCardIndex: s.currentCardIndex - 1, showMeaning: false });
        }
      });
      contentArea.querySelector("#vocab-next-card")?.addEventListener("click", () => {
        if (s.currentCardIndex < s.items.length - 1) {
          updateVocabState({ currentCardIndex: s.currentCardIndex + 1, showMeaning: false });
        }
      });

    } else if (s.viewMode === "quiz") {
      // 3. 퀴즈 모드
      if (!s.quizQuestion) {
        updateVocabState({ quizQuestion: generateQuiz(s.items) });
        return;
      }

      const q = s.quizQuestion;
      const progressLabel = `${t("vocabQuizTitle")} (Score: ${s.quizScore})`;

      let feedbackHtml = "";
      if (s.isAnswered) {
        const isCorrect = s.selectedChoice === q.correctItem.meaning;
        if (isCorrect) {
          feedbackHtml = `<div class="quiz-feedback correct">${t("vocabQuizCorrect")}</div>`;
        } else {
          feedbackHtml = `<div class="quiz-feedback incorrect">${t("vocabQuizIncorrect").replace("{word}", q.correctItem.meaning)}</div>`;
        }
      }

      contentArea.innerHTML = `
        <div class="vocab-quiz-wrapper">
          <div class="vocab-quiz-header">
            <span class="vocab-quiz-score-badge">${progressLabel}</span>
            <button class="vocab-quiz-speaker" data-word="${q.correctItem.word}">🔊</button>
          </div>
          <div class="vocab-quiz-question">${q.correctItem.word}</div>
          
          <div class="vocab-quiz-choices">
            ${q.choices.map((choice) => {
              let btnClass = "vocab-quiz-btn";
              if (s.isAnswered) {
                if (choice === q.correctItem.meaning) {
                  btnClass += " correct";
                } else if (choice === s.selectedChoice) {
                  btnClass += " incorrect";
                } else {
                  btnClass += " disabled";
                }
              }
              return `<button class="${btnClass}" data-choice="${choice}" ${s.isAnswered ? "disabled" : ""}>${choice}</button>`;
            }).join("")}
          </div>

          ${feedbackHtml}

          ${s.isAnswered ? `
            <button class="buddy-btn" id="vocab-quiz-next-btn" style="width: 100%; margin-top: 10px;">
              ${t("vocabQuizNext")}
            </button>
          ` : ""}
        </div>
      `;

      // 퀴즈 소리 재생
      contentArea.querySelector(".vocab-quiz-speaker")?.addEventListener("click", () => {
        speakText(q.correctItem.word);
      });

      // 4지선다 버튼 클릭 바인딩
      contentArea.querySelectorAll(".vocab-quiz-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          if (s.isAnswered) return;
          const choice = (btn as HTMLElement).dataset.choice || "";
          const isCorrect = choice === q.correctItem.meaning;
          updateVocabState({
            selectedChoice: choice,
            isAnswered: true,
            quizScore: isCorrect ? s.quizScore + 10 : s.quizScore
          });
        });
      });

      // 다음 문제 버튼
      contentArea.querySelector("#vocab-quiz-next-btn")?.addEventListener("click", () => {
        updateVocabState({
          quizQuestion: generateQuiz(s.items),
          selectedChoice: null,
          isAnswered: false
        });
      });
    }

    // 탭 전환 이벤트 바인딩
    container.querySelectorAll(".vocab-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const mode = (btn as HTMLElement).dataset.mode as any;
        updateVocabState({ viewMode: mode, showMeaning: false });
      });
    });
  });

  // 언마운트 감시 자원 누수 청소
  const observer = new MutationObserver(() => {
    if (!document.contains(container)) {
      unsubscribe();
      observer.disconnect();
    }
  });
  observer.observe(container.ownerDocument, { childList: true, subtree: true });
}
