let toastTimeout: any = null;

const getToastElement = (): HTMLElement | null => {
  return (window as any).__buddyToastElement || null;
};

const setToastElement = (el: HTMLElement | null) => {
  (window as any).__buddyToastElement = el;
};

// 토스트 피드백 DOM 생성 및 마운트
export function initToast(shadow: ShadowRoot): void {
  const el = document.createElement("div");
  el.className = "buddy-toast";
  shadow.appendChild(el);
  setToastElement(el);
}

// 토스트 메시지 띄우기
export function showBuddyToast(message: string): void {
  const el = getToastElement();
  if (!el) return;

  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }

  el.textContent = message;
  el.classList.add("show");

  toastTimeout = setTimeout(() => {
    const currentEl = getToastElement();
    currentEl?.classList.remove("show");
  }, 2500);
}

export function resetToast(): void {
  setToastElement(null);
  if (toastTimeout) {
    clearTimeout(toastTimeout);
    toastTimeout = null;
  }
}
