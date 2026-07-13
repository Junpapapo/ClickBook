import type { MemoColor } from "@/shared/types";

/**
 * 메모 색상 값을 넘겨받아 해당 도트의 CSS 클래스 배열을 구합니다.
 */
export function getColorDotClasses(color: MemoColor, activeColor: MemoColor): string {
  const isActive = color === activeColor ? "active" : "";
  return `compact-color-dot ${color} ${isActive}`.trim();
}
