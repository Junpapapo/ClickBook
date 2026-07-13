import { t } from "../i18n";
import { getBuddyState, updateBuddyState } from "../buddy-state";
import { SUPPORTED_LANGUAGES } from "../buddy-constants";
import { parseMarkdown } from "../buddy-utils";

export function renderTranslateCard(container: HTMLElement): void {
  // 드래그 선택된 텍스트 감지하여 초기값으로 채움
  const selectedText = window.getSelection()?.toString().trim() || "";

  const sourceOptions = SUPPORTED_LANGUAGES.map(l => `<option value="${l.code}">${l.name}</option>`).join("");
  const targetOptions = SUPPORTED_LANGUAGES.map(l => `<option value="${l.code}">${l.name}</option>`).join("");

  container.innerHTML = `
    <div class="buddy-input-group" style="margin-bottom: 8px;">
      <textarea class="buddy-textarea" id="buddy-trans-input" placeholder="${t("translatePlaceholder")}" style="height: 68px;"></textarea>
    </div>
    
    <div class="buddy-input-group" style="display: flex; gap: 6px; align-items: center; margin-bottom: 8px;">
      <select class="buddy-select" id="buddy-trans-source" style="flex: 1; height: 32px; font-size: 11.5px; padding: 2px 4px; box-sizing: border-box;">
        <option value="auto" selected>Auto Detect</option>
        ${sourceOptions}
      </select>
      <div style="font-size: 12px; color: var(--text-sub); flex-shrink: 0;">&rarr;</div>
      <select class="buddy-select" id="buddy-trans-target" style="flex: 1; height: 32px; font-size: 11.5px; padding: 2px 4px; box-sizing: border-box;">
        ${targetOptions}
      </select>
      <button class="buddy-btn" id="buddy-trans-btn" style="flex-shrink: 0; width: 60px; height: 32px; font-size: 12px; padding: 0; box-sizing: border-box;">${t("translateBtn")}</button>
    </div>

    <div class="buddy-result-box" id="buddy-trans-result" style="display: none;"></div>
    
    <div class="buddy-btn-row" id="buddy-copy-row" style="display: none; margin-top: 8px;">
      <button class="buddy-btn buddy-btn-secondary" id="buddy-trans-copy">${t("translateCopy")}</button>
    </div>
  `;

  const inputArea = container.querySelector("#buddy-trans-input") as HTMLTextAreaElement;
  const sourceSel = container.querySelector("#buddy-trans-source") as HTMLSelectElement;
  const targetSel = container.querySelector("#buddy-trans-target") as HTMLSelectElement;
  const transBtn = container.querySelector("#buddy-trans-btn") as HTMLButtonElement;
  const resultBox = container.querySelector("#buddy-trans-result") as HTMLDivElement;
  const copyRow = container.querySelector("#buddy-copy-row") as HTMLDivElement;
  const copyBtn = container.querySelector("#buddy-trans-copy") as HTMLButtonElement;

  const s = getBuddyState();
  const initialText = selectedText || s.translateInputCache || "";
  inputArea.value = initialText;

  // 타이핑 시 상태 캐시에 실시간 동기화
  inputArea.addEventListener("input", () => {
    updateBuddyState({ translateInputCache: inputArea.value });
  });

  // 이전에 저장된 번역 결과가 있으면 즉시 노출
  if (s.translateResultCache) {
    resultBox.style.display = "block";
    resultBox.innerHTML = parseMarkdown(s.translateResultCache);
    copyRow.style.display = "flex";
  }

  // 사용자 지정 기본 번역 언어를 우선 적용하고, 없으면 브라우저 언어 적용
  if (s.config && s.config.targetLanguage) {
    targetSel.value = s.config.targetLanguage;
  } else {
    const currentLanguage = navigator.language.substring(0, 2);
    const hasLang = SUPPORTED_LANGUAGES.some(l => l.code === currentLanguage);
    targetSel.value = hasLang ? currentLanguage : "ko";
  }

  // 번역 액션
  transBtn.addEventListener("click", async () => {
    const text = inputArea.value.trim();
    if (!text) return;

    resultBox.style.display = "block";
    resultBox.textContent = t("translating");
    copyRow.style.display = "none";
    transBtn.disabled = true;

    // AI 처리 중 애니메이션 구동
    updateBuddyState({ actionStatus: "loading" });

    let srcLang = sourceSel.value;
    if (srcLang === "auto") {
      srcLang = "en";
    }
    const targetLang = targetSel.value;

    chrome.runtime.sendMessage({
      type: "BUDDY_TRANSLATE",
      text,
      srcLang,
      targetLang,
    })
      .then((res: any) => {
        if (res && res.success && res.data) {
          resultBox.style.color = ""; // 정상 텍스트 색상
          resultBox.innerHTML = parseMarkdown(res.data.translatedText);
          copyRow.style.display = "flex";
          updateBuddyState({ translateResultCache: res.data.translatedText, actionStatus: "success" });
          setTimeout(() => updateBuddyState({ actionStatus: "idle" }), 1500);
        } else {
          resultBox.style.color = "#ef4444";
          resultBox.textContent = (res && res.error) ? res.error : t("translateUnavailable");
          updateBuddyState({ actionStatus: "error" });
          setTimeout(() => updateBuddyState({ actionStatus: "idle" }), 2000);
        }
        transBtn.disabled = false;
      })
      .catch((err: any) => {
        resultBox.style.color = "#ef4444";
        resultBox.textContent = err.message || String(err);
        transBtn.disabled = false;
        updateBuddyState({ actionStatus: "error" });
        setTimeout(() => updateBuddyState({ actionStatus: "idle" }), 2000);
      });
  });

  // 복사 기능
  copyBtn.addEventListener("click", () => {
    const textToCopy = getBuddyState().translateResultCache || "";
    if (!textToCopy) return;

    navigator.clipboard.writeText(textToCopy).then(() => {
      const originalText = copyBtn.textContent;
      copyBtn.textContent = t("translateCopied");
      copyBtn.disabled = true;
      setTimeout(() => {
        copyBtn.textContent = originalText;
        copyBtn.disabled = false;
      }, 1500);
    });
  });
}
