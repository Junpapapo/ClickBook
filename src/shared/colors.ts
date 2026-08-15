import type { MemoColor } from "./types";

// ── メモカラー ────────────────────────────────────────────

/** メモドット（丸インジケーター） */
export const MEMO_DOT: Record<MemoColor, string> = {
  default: "bg-slate-400 dark:bg-slate-600",
  yellow: "bg-yellow-400",
  pink:   "bg-pink-400",
  blue:   "bg-sky-400",
  green:  "bg-emerald-400",
  purple: "bg-purple-400",
};

/** メモカードの背景・ボーダー */
export const MEMO_CARD_BG: Record<MemoColor, string> = {
  default: "bg-white dark:bg-slate-800/95 border-slate-200/90 dark:border-slate-700/70",
  yellow: "bg-amber-50/50 dark:bg-slate-800/95 border-amber-200/80 dark:border-amber-800/50",
  pink:   "bg-rose-50/50   dark:bg-slate-800/95   border-rose-200/80   dark:border-rose-800/50",
  blue:   "bg-sky-50/50    dark:bg-slate-800/95    border-sky-200/80    dark:border-sky-800/50",
  green:  "bg-emerald-50/50 dark:bg-slate-800/95 border-emerald-200/80 dark:border-emerald-800/50",
  purple: "bg-purple-50/50 dark:bg-slate-800/95 border-purple-200/80 dark:border-purple-800/50",
};

/** メモカードのアクセントバー */
export const MEMO_ACCENT: Record<MemoColor, string> = {
  default: "bg-slate-400 dark:bg-slate-500",
  yellow: "bg-amber-400 dark:bg-amber-500",
  pink:   "bg-rose-400   dark:bg-rose-500",
  blue:   "bg-sky-400    dark:bg-sky-500",
  green:  "bg-emerald-400 dark:bg-emerald-500",
  purple: "bg-purple-400 dark:bg-purple-500",
};

/** テキストエリア背景 */
export const MEMO_TEXTAREA_BG: Record<MemoColor, string> = {
  default: "bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800",
  yellow: "bg-amber-50/40 dark:bg-slate-900/60 border border-amber-200/40 dark:border-slate-800",
  pink:   "bg-rose-50/40   dark:bg-slate-900/60 border border-rose-200/40   dark:border-slate-800",
  blue:   "bg-sky-50/40    dark:bg-slate-900/60 border border-sky-200/40    dark:border-slate-800",
  green:  "bg-emerald-50/40 dark:bg-slate-900/60 border border-emerald-200/40 dark:border-slate-800",
  purple: "bg-purple-50/40 dark:bg-slate-900/60 border border-purple-200/40 dark:border-slate-800",
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
