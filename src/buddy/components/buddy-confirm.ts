import { getBuddyState } from "../buddy-state";
import { t } from "../i18n";

export function showBubbleConfirm(
  shadow: ShadowRoot, 
  buddyContainer: HTMLElement, 
  message: string, 
  confirmLabel: string,
  onConfirm: () => void
): void {
  // 이미 열린 확인 창이 있다면 제거
  const existing = shadow.querySelector("#buddy-confirm-bubble");
  if (existing) existing.remove();

  const bubble = document.createElement("div");
  bubble.id = "buddy-confirm-bubble";
  bubble.className = "buddy-confirm-bubble";

  const state = getBuddyState();
  const currentTheme = (state.config && state.config.theme) || "midnight";
  bubble.classList.add(`theme-${currentTheme}`);

  const text = document.createElement("p");
  text.className = "buddy-bubble-text";
  text.textContent = message;

  const btnRow = document.createElement("div");
  btnRow.className = "buddy-bubble-buttons";

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "buddy-bubble-btn cancel";
  cancelBtn.textContent = t("confirmCancel");
  cancelBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    bubble.classList.remove("show");
    bubble.style.transform = "scale(0.9)";
    setTimeout(() => bubble.remove(), 200);
  });

  const confirmBtn = document.createElement("button");
  confirmBtn.type = "button";
  confirmBtn.className = "buddy-bubble-btn confirm";
  confirmBtn.textContent = confirmLabel;
  confirmBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    onConfirm();
    bubble.classList.remove("show");
    bubble.style.transform = "scale(0.9)";
    setTimeout(() => bubble.remove(), 200);
  });

  btnRow.appendChild(cancelBtn);
  btnRow.appendChild(confirmBtn);
  bubble.appendChild(text);
  bubble.appendChild(btnRow);
  shadow.appendChild(bubble);

  const updatePosition = () => {
    const rect = buddyContainer.getBoundingClientRect();
    const bubbleWidth = 170;
    const bubbleHeight = bubble.offsetHeight || 65;
    const left = rect.left + rect.width / 2 - bubbleWidth / 2;
    let top = rect.top - bubbleHeight - 12;

    if (top < 10) {
      top = rect.bottom + 12;
      bubble.classList.add("bubble-bottom-side");
    } else {
      bubble.classList.remove("bubble-bottom-side");
    }

    bubble.style.left = `${Math.max(8, Math.min(left, window.innerWidth - bubbleWidth - 8))}px`;
    bubble.style.top = `${top}px`;
  };

  updatePosition();
  setTimeout(() => bubble.classList.add("show"), 10);

  const handleMove = () => {
    if (bubble.parentNode) {
      updatePosition();
    } else {
      window.removeEventListener("resize", handleMove);
      window.removeEventListener("scroll", handleMove);
    }
  };
  window.addEventListener("resize", handleMove);
  window.addEventListener("scroll", handleMove, { passive: true });
}
