import type { TodoTask, MemoColor } from "@/shared/types";

export const TASK_BG_COLORS: Record<string, string> = {
  default: "bg-indigo-50/40 border-indigo-200 dark:bg-[#1C2331] dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-300",
  blue: "bg-blue-50/40 border-blue-200 dark:bg-[#1C2331] dark:border-blue-900/40 text-blue-700 dark:text-blue-300",
  emerald: "bg-emerald-50/40 border-emerald-200 dark:bg-[#1D2A24] dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300",
  amber: "bg-amber-50/40 border-amber-200 dark:bg-[#2D281E] dark:border-amber-900/40 text-amber-700 dark:text-amber-300",
  rose: "bg-rose-50/40 border-rose-200 dark:bg-[#2D1E22] dark:border-rose-900/40 text-rose-700 dark:text-rose-300",
  purple: "bg-purple-50/40 border-purple-200 dark:bg-[#251E2D] dark:border-purple-900/40 text-purple-700 dark:text-purple-300",
};

export const TASK_SOLID_COLORS: Record<string, string> = {
  default: "bg-indigo-600 dark:bg-indigo-500 text-white",
  blue: "bg-blue-600 dark:bg-blue-500 text-white",
  emerald: "bg-emerald-600 dark:bg-emerald-500 text-white",
  amber: "bg-amber-600 dark:bg-amber-500 text-white",
  rose: "bg-rose-600 dark:bg-rose-500 text-white",
  purple: "bg-purple-600 dark:bg-purple-500 text-white",
};

export const MEMO_COLORS: Record<MemoColor, string> = {
  yellow: "bg-amber-50/40 border-amber-200 dark:bg-[#2D281E] dark:border-amber-900/40 text-amber-700 dark:text-amber-300",
  pink: "bg-rose-50/40 border-rose-200 dark:bg-[#2D1E22] dark:border-rose-900/40 text-rose-700 dark:text-rose-300",
  blue: "bg-blue-50/40 border-blue-200 dark:bg-[#1C2331] dark:border-blue-900/40 text-blue-700 dark:text-blue-300",
  green: "bg-emerald-50/40 border-emerald-200 dark:bg-[#1D2A24] dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300",
  purple: "bg-purple-50/40 border-purple-200 dark:bg-[#251E2D] dark:border-purple-900/40 text-purple-700 dark:text-purple-300",
};

export const TASK_CELL_BG_COLORS: Record<string, string> = {
  default: "bg-indigo-50/15 dark:bg-indigo-950/5 border-indigo-200/40 dark:border-indigo-900/20",
  blue: "bg-blue-50/15 dark:bg-blue-950/5 border-blue-200/40 dark:border-blue-900/20",
  emerald: "bg-emerald-50/15 dark:bg-emerald-950/5 border-emerald-200/40 dark:border-emerald-900/20",
  amber: "bg-amber-50/15 dark:bg-amber-950/5 border-amber-200/40 dark:border-amber-900/20",
  rose: "bg-rose-50/15 dark:bg-rose-950/5 border-rose-200/40 dark:border-rose-900/20",
  purple: "bg-purple-50/15 dark:bg-purple-950/5 border-purple-200/40 dark:border-purple-900/20",
};

export const TASK_TEXT_COLORS: Record<string, string> = {
  default: "text-indigo-600 dark:text-indigo-400",
  blue: "text-blue-600 dark:text-blue-400",
  emerald: "text-emerald-600 dark:text-emerald-400",
  amber: "text-amber-600 dark:text-amber-400",
  rose: "text-rose-600 dark:text-rose-400",
  purple: "text-purple-600 dark:text-purple-400",
};

export const REMINDER_OPTIONS = [
  { value: "none", label: "없음" },
  { value: "at_due", label: "기한 정시" },
  { value: "15m_before", label: "15분 전" },
  { value: "1h_before", label: "1시간 전" },
  { value: "3h_before", label: "3시간 전" },
  { value: "1d_before", label: "1일 전" },
];

export const generateTimeOptions = () => {
  const options = [];
  for (let h = 0; h < 24; h++) {
    const hh = String(h).padStart(2, "0");
    options.push(`${hh}:00`);
    options.push(`${hh}:30`);
  }
  return options;
};

export const timeOptions = generateTimeOptions();

export const formatDateStr = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const getCalendarGrid = (year: number, month: number) => {
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon, ...
  const mondayFirstIndex = (firstDayIndex + 6) % 7; // Convert to Monday-first: 0 = Mon, 6 = Sun

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const grid: { date: Date; isCurrentMonth: boolean; key: string }[] = [];

  // Previous month cells
  for (let i = mondayFirstIndex - 1; i >= 0; i--) {
    const prevDate = new Date(year, month - 1, daysInPrevMonth - i);
    grid.push({
      date: prevDate,
      isCurrentMonth: false,
      key: `prev-${daysInPrevMonth - i}`,
    });
  }

  // Current month cells
  for (let d = 1; d <= daysInMonth; d++) {
    const currDate = new Date(year, month, d);
    grid.push({
      date: currDate,
      isCurrentMonth: true,
      key: `curr-${d}`,
    });
  }

  // Next month cells
  const remainingCells = 42 - grid.length;
  for (let d = 1; d <= remainingCells; d++) {
    const nextDate = new Date(year, month + 1, d);
    grid.push({
      date: nextDate,
      isCurrentMonth: false,
      key: `next-${d}`,
    });
  }

  return grid;
};
