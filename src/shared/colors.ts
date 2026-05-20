import type { MemoColor } from "./types";

// ── メモカラー ────────────────────────────────────────────

/** メモドット（丸インジケーター） */
export const MEMO_DOT: Record<MemoColor, string> = {
  yellow: "bg-yellow-400",
  pink:   "bg-pink-400",
  blue:   "bg-sky-400",
  green:  "bg-emerald-400",
  purple: "bg-purple-400",
};

/** メモカードの背景・ボーダー */
export const MEMO_CARD_BG: Record<MemoColor, string> = {
  yellow: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700/40",
  pink:   "bg-pink-50   dark:bg-pink-900/20   border-pink-200   dark:border-pink-700/40",
  blue:   "bg-sky-50    dark:bg-sky-900/20    border-sky-200    dark:border-sky-700/40",
  green:  "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/40",
  purple: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700/40",
};

/** メモカードのアクセントバー */
export const MEMO_ACCENT: Record<MemoColor, string> = {
  yellow: "bg-yellow-300 dark:bg-yellow-500/70",
  pink:   "bg-pink-300   dark:bg-pink-500/70",
  blue:   "bg-sky-300    dark:bg-sky-500/70",
  green:  "bg-emerald-300 dark:bg-emerald-500/70",
  purple: "bg-purple-300 dark:bg-purple-500/70",
};

/** テキストエリア背景 */
export const MEMO_TEXTAREA_BG: Record<MemoColor, string> = {
  yellow: "bg-yellow-100 dark:bg-yellow-900/40",
  pink:   "bg-pink-100   dark:bg-pink-900/40",
  blue:   "bg-sky-100    dark:bg-sky-900/40",
  green:  "bg-emerald-100 dark:bg-emerald-900/40",
  purple: "bg-purple-100 dark:bg-purple-900/40",
};

export const ALL_MEMO_COLORS: MemoColor[] = ["yellow", "pink", "blue", "green", "purple"];

// ── フォルダーカラー ──────────────────────────────────────

/** フォルダーカラー → ドット（背景） */
export const FOLDER_COLOR_DOT: Record<string, string> = {
  blue:   "bg-blue-400",
  purple: "bg-purple-400",
  amber:  "bg-amber-400",
  rose:   "bg-rose-400",
  cyan:   "bg-cyan-400",
  green:  "bg-green-400",
  sky:    "bg-sky-400",
  gray:   "bg-gray-400",
  indigo: "bg-indigo-400",
};

/** フォルダーカラー → テキスト色 */
export const FOLDER_COLOR_TEXT: Record<string, string> = {
  blue:   "text-blue-400",
  purple: "text-purple-400",
  amber:  "text-amber-400",
  rose:   "text-rose-400",
  cyan:   "text-cyan-400",
  green:  "text-green-400",
  sky:    "text-sky-400",
  gray:   "text-gray-400",
  indigo: "text-indigo-400",
};
