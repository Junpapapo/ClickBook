/**
 * 타임스탬프를 HH:MM 형식의 시간 문자열로 변환합니다.
 */
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * 지정된 컨테이너의 스크롤을 맨 아래로 이동시킵니다.
 */
export function scrollToBottom(element: HTMLElement | null): void {
  if (!element) return;
  setTimeout(() => {
    element.scrollTop = element.scrollHeight;
  }, 50);
}
