import type { MemoColor } from "@/shared/types";
import type { TFunction } from "@/shared/i18n";

export const TASK_BG_COLORS: Record<string, string> = {
  default: "bg-indigo-50/70 border-indigo-200/80 dark:bg-slate-800/90 dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-300",
  blue: "bg-blue-50/70 border-blue-200/80 dark:bg-slate-800/90 dark:border-blue-900/50 text-blue-700 dark:text-blue-300",
  emerald: "bg-emerald-50/70 border-emerald-200/80 dark:bg-slate-800/90 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300",
  amber: "bg-amber-50/70 border-amber-200/80 dark:bg-slate-800/90 dark:border-amber-900/50 text-amber-700 dark:text-amber-300",
  rose: "bg-rose-50/70 border-rose-200/80 dark:bg-slate-800/90 dark:border-rose-900/50 text-rose-700 dark:text-rose-300",
  purple: "bg-purple-50/70 border-purple-200/80 dark:bg-slate-800/90 dark:border-purple-900/50 text-purple-700 dark:text-purple-300",
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
  default: "bg-slate-50 border-slate-200/80 dark:bg-slate-800/90 dark:border-slate-700/60 text-slate-700 dark:text-slate-200",
  yellow: "bg-amber-50/70 border-amber-200/80 dark:bg-slate-800/90 dark:border-amber-900/50 text-amber-700 dark:text-amber-300",
  pink: "bg-rose-50/70 border-rose-200/80 dark:bg-slate-800/90 dark:border-rose-900/50 text-rose-700 dark:text-rose-300",
  blue: "bg-blue-50/70 border-blue-200/80 dark:bg-slate-800/90 dark:border-blue-900/50 text-blue-700 dark:text-blue-300",
  green: "bg-emerald-50/70 border-emerald-200/80 dark:bg-slate-800/90 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300",
  purple: "bg-purple-50/70 border-purple-200/80 dark:bg-slate-800/90 dark:border-purple-900/50 text-purple-700 dark:text-purple-300",
};

export const TASK_CELL_BG_COLORS: Record<string, string> = {
  default: "bg-indigo-50/20 dark:bg-indigo-950/15 border-indigo-200/50 dark:border-indigo-900/30",
  blue: "bg-blue-50/20 dark:bg-blue-950/15 border-blue-200/50 dark:border-blue-900/30",
  emerald: "bg-emerald-50/20 dark:bg-emerald-950/15 border-emerald-200/50 dark:border-emerald-900/30",
  amber: "bg-amber-50/20 dark:bg-amber-950/15 border-amber-200/50 dark:border-amber-900/30",
  rose: "bg-rose-50/20 dark:bg-rose-950/15 border-rose-200/50 dark:border-rose-900/30",
  purple: "bg-purple-50/20 dark:bg-purple-950/15 border-purple-200/50 dark:border-purple-900/30",
};

export const TASK_TEXT_COLORS: Record<string, string> = {
  default: "text-indigo-600 dark:text-indigo-400",
  blue: "text-blue-600 dark:text-blue-400",
  emerald: "text-emerald-600 dark:text-emerald-400",
  amber: "text-amber-600 dark:text-amber-400",
  rose: "text-rose-600 dark:text-rose-400",
  purple: "text-purple-600 dark:text-purple-400",
};

export const getReminderOptions = (t: TFunction) => [
  { value: "none", label: t("reminderNone") },
  { value: "at_due", label: t("reminderAtDue") },
  { value: "15m_before", label: t("reminder15mBefore") },
  { value: "1h_before", label: t("reminder1hBefore") },
  { value: "3h_before", label: t("reminder3hBefore") },
  { value: "1d_before", label: t("reminder1dBefore") },
];

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

export type CalendarTheme = "glass" | "sepia" | "sage" | "midnight" | "lavender";

export interface CalendarThemeMeta {
  id: CalendarTheme;
  name: string;
  nameKo: string;
  dotColor: string;
  panelBg: string;
  panelBorder: string;
  weekdayBorder: string;
  weekdayText: string;
  satHeader: string;
  sunHeader: string;
  cellBgCurrent: string;
  cellBgOther: string;
  cellBorder: string;
  cellHover: string;
  cellSelected: string;
  cellTodayRing: string;
  todayBadge: string;
  detailHeaderBorder: string;
  detailItemBg: string;
}

export const CALENDAR_THEMES: CalendarThemeMeta[] = [
  {
    id: "glass",
    name: "Modern",
    nameKo: "모던",
    dotColor: "bg-indigo-500",
    panelBg: "bg-white/45 dark:bg-slate-950/45 backdrop-blur-xl",
    panelBorder: "border-white/50 dark:border-white/10",
    weekdayBorder: "border-slate-200/50 dark:border-slate-800/50",
    weekdayText: "text-slate-500 dark:text-slate-400",
    satHeader: "text-blue-500",
    sunHeader: "text-rose-500",
    cellBgCurrent: "bg-white/35 dark:bg-slate-800/25",
    cellBgOther: "bg-white/10 dark:bg-slate-900/15 opacity-40",
    cellBorder: "border-slate-200/60 dark:border-slate-800/60",
    cellHover: "hover:border-indigo-400/60 hover:bg-white/60 dark:hover:bg-slate-800/60",
    cellSelected: "border-indigo-500 dark:border-indigo-500 ring-1 ring-indigo-500/30 bg-indigo-50/40 dark:bg-indigo-950/30",
    cellTodayRing: "ring-2 ring-indigo-500/60 bg-indigo-50/30 dark:bg-indigo-950/25",
    todayBadge: "text-white dark:text-white bg-indigo-600 dark:bg-indigo-500",
    detailHeaderBorder: "border-slate-200/50 dark:border-slate-800/50",
    detailItemBg: "bg-white/40 dark:bg-slate-800/30 border-slate-200/50 dark:border-slate-700/40",
  },
  {
    id: "sepia",
    name: "Sepia",
    nameKo: "세피아",
    dotColor: "bg-[#8C6D4F]",
    panelBg: "bg-[#FBF8F2]/50 dark:bg-[#1E1813]/50 backdrop-blur-xl",
    panelBorder: "border-[#EADBCE]/70 dark:border-[#382C24]/70",
    weekdayBorder: "border-[#EADBCE]/60 dark:border-[#382C24]/60",
    weekdayText: "text-[#8C7462] dark:text-[#A89482]",
    satHeader: "text-[#3B6682] dark:text-[#689AB8]",
    sunHeader: "text-[#B34336] dark:text-[#D46559]",
    cellBgCurrent: "bg-[#F5EFE6]/35 dark:bg-[#251F19]/30",
    cellBgOther: "bg-[#ECE5DC]/15 dark:bg-[#1A1511]/15 opacity-45",
    cellBorder: "border-[#E8DFD3]/60 dark:border-[#3D3229]/60",
    cellHover: "hover:border-[#9E7A5A] hover:bg-[#FFFDF9]/60 dark:hover:bg-[#2E261F]/60",
    cellSelected: "border-[#8C6D4F] dark:border-[#A88665] ring-1 ring-[#8C6D4F]/30 bg-[#8C6D4F]/15 dark:bg-[#8C6D4F]/25",
    cellTodayRing: "ring-2 ring-[#8C6D4F] dark:ring-[#A88665] bg-[#8C6D4F]/15 dark:bg-[#8C6D4F]/25",
    todayBadge: "text-[#FFFBF5] bg-[#8C6D4F] dark:bg-[#A88665] shadow-xs",
    detailHeaderBorder: "border-[#EADBCE]/60 dark:border-[#382C24]/60",
    detailItemBg: "bg-[#F5EFE6]/40 dark:bg-[#251F19]/35 border-[#E8DFD3]/60 dark:border-[#3D3229]/60",
  },
  {
    id: "sage",
    name: "Sage",
    nameKo: "세이지",
    dotColor: "bg-[#3E6B48]",
    panelBg: "bg-[#F4F8F5]/50 dark:bg-[#131D16]/50 backdrop-blur-xl",
    panelBorder: "border-[#D5E3D8]/70 dark:border-[#223627]/70",
    weekdayBorder: "border-[#D5E3D8]/60 dark:border-[#223627]/60",
    weekdayText: "text-[#55755B] dark:text-[#88A88F]",
    satHeader: "text-[#2E7275] dark:text-[#529E9F]",
    sunHeader: "text-[#B54A44] dark:text-[#DE6862]",
    cellBgCurrent: "bg-[#EAF1EC]/35 dark:bg-[#1A261E]/30",
    cellBgOther: "bg-[#DFEAE1]/15 dark:bg-[#111A13]/15 opacity-45",
    cellBorder: "border-[#D3E2D6]/60 dark:border-[#273B2C]/60",
    cellHover: "hover:border-[#3E7D4E] hover:bg-[#FAFDFB]/60 dark:hover:bg-[#223327]/60",
    cellSelected: "border-[#3E6B48] dark:border-[#4E855A] ring-1 ring-[#3E6B48]/30 bg-[#3E6B48]/15 dark:bg-[#3E6B48]/25",
    cellTodayRing: "ring-2 ring-[#3E6B48] dark:ring-[#4E855A] bg-[#3E6B48]/15 dark:bg-[#3E6B48]/25",
    todayBadge: "text-white bg-[#3E6B48] dark:bg-[#4E855A] shadow-xs",
    detailHeaderBorder: "border-[#D5E3D8]/60 dark:border-[#223627]/60",
    detailItemBg: "bg-[#EAF1EC]/40 dark:bg-[#1A261E]/35 border-[#D3E2D6]/60 dark:border-[#273B2C]/60",
  },
  {
    id: "midnight",
    name: "Midnight",
    nameKo: "미드나잇",
    dotColor: "bg-neutral-800 dark:bg-neutral-200",
    panelBg: "bg-white/45 dark:bg-[#0B0B0C]/50 backdrop-blur-xl",
    panelBorder: "border-slate-300/60 dark:border-neutral-800/60",
    weekdayBorder: "border-slate-200/50 dark:border-neutral-800/50",
    weekdayText: "text-slate-500 dark:text-neutral-400",
    satHeader: "text-sky-600 dark:text-sky-400",
    sunHeader: "text-rose-600 dark:text-rose-400",
    cellBgCurrent: "bg-white/35 dark:bg-white/[0.04]",
    cellBgOther: "bg-white/10 dark:bg-white/[0.015] opacity-40",
    cellBorder: "border-slate-200/60 dark:border-neutral-800/60",
    cellHover: "hover:border-slate-500 hover:bg-white/60 dark:hover:bg-white/[0.08]",
    cellSelected: "border-slate-900 dark:border-white ring-1 ring-slate-900/20 dark:ring-white/20 bg-slate-100/50 dark:bg-white/10",
    cellTodayRing: "ring-2 ring-slate-800 dark:ring-neutral-200 bg-slate-100/40 dark:bg-white/5",
    todayBadge: "text-white bg-slate-900 dark:text-black dark:bg-white font-bold shadow-xs",
    detailHeaderBorder: "border-slate-200/50 dark:border-neutral-800/50",
    detailItemBg: "bg-white/35 dark:bg-white/[0.04] border-slate-200/60 dark:border-neutral-800/60",
  },
  {
    id: "lavender",
    name: "Lavender",
    nameKo: "라벤더",
    dotColor: "bg-[#8247B5]",
    panelBg: "bg-[#FAF7FD]/50 dark:bg-[#181321]/50 backdrop-blur-xl",
    panelBorder: "border-[#E9DDF5]/70 dark:border-[#35254A]/70",
    weekdayBorder: "border-[#E9DDF5]/60 dark:border-[#35254A]/60",
    weekdayText: "text-[#785994] dark:text-[#A788C4]",
    satHeader: "text-[#5163A8] dark:text-[#7D8EC9]",
    sunHeader: "text-[#BA416E] dark:text-[#E06493]",
    cellBgCurrent: "bg-[#F3EDFA]/35 dark:bg-[#20182D]/30",
    cellBgOther: "bg-[#ECE2F5]/15 dark:bg-[#140F1C]/15 opacity-45",
    cellBorder: "border-[#E6D9F2]/60 dark:border-[#392950]/60",
    cellHover: "hover:border-[#9663C2] hover:bg-[#FDFCFF]/60 dark:hover:bg-[#2A203A]/60",
    cellSelected: "border-[#8247B5] dark:border-[#9B5FD1] ring-1 ring-[#8247B5]/30 bg-[#8247B5]/15 dark:bg-[#8247B5]/25",
    cellTodayRing: "ring-2 ring-[#8247B5] dark:ring-[#9B5FD1] bg-[#8247B5]/15 dark:bg-[#8247B5]/25",
    todayBadge: "text-white bg-[#8247B5] dark:bg-[#9B5FD1] shadow-xs",
    detailHeaderBorder: "border-[#E9DDF5]/60 dark:border-[#35254A]/60",
    detailItemBg: "bg-[#F3EDFA]/40 dark:bg-[#20182D]/35 border-[#E6D9F2]/60 dark:border-[#392950]/60",
  },
];

export function getCalendarThemeConfig(themeId?: string): CalendarThemeMeta {
  return CALENDAR_THEMES.find((t) => t.id === themeId) || CALENDAR_THEMES[0];
}
