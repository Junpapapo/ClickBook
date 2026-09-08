export type TodoTheme = "modern" | "sepia" | "sage" | "midnight" | "lavender";

export interface TodoThemeMeta {
  id: TodoTheme;
  name: string;
  dotColor: string;
  columnBgDefault: string;
  columnBorder: string;
  cardBg: string;
  cardBorder: string;
  cardHover: string;
  headerBadgeBg: string;
  headerBtnHover: string;
  addBtnHover: string;
  formBg: string;
}

export const TODO_THEMES: TodoThemeMeta[] = [
  {
    id: "modern",
    name: "Modern",
    dotColor: "bg-indigo-500",
    columnBgDefault: "bg-slate-100/92 dark:bg-slate-900/92 backdrop-blur-2xl",
    columnBorder: "border-slate-200/90 dark:border-slate-800/90",
    cardBg: "bg-white dark:bg-slate-800/95",
    cardBorder: "border-slate-200/85 dark:border-slate-700/80",
    cardHover: "hover:border-indigo-500/80 dark:hover:border-indigo-400/80 hover:shadow-figma-sm",
    headerBadgeBg: "bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold",
    headerBtnHover: "hover:bg-slate-200/60 dark:hover:bg-slate-800/60",
    addBtnHover: "hover:bg-white dark:hover:bg-slate-800/90 hover:shadow-figma-xs hover:border-slate-200/80 dark:hover:border-slate-700/60",
    formBg: "bg-white dark:bg-slate-800 shadow-figma-sm",
  },
  {
    id: "sepia",
    name: "Sepia",
    dotColor: "bg-[#8C6D4F]",
    columnBgDefault: "bg-[#F7F3EB]/92 dark:bg-[#1C1713]/92 backdrop-blur-2xl",
    columnBorder: "border-[#E5DDD2]/90 dark:border-[#332820]/90",
    cardBg: "bg-white dark:bg-[#251F19]/95",
    cardBorder: "border-[#E8DFD3]/90 dark:border-[#3D3229]/80",
    cardHover: "hover:border-[#9E7A5A] hover:shadow-figma-sm",
    headerBadgeBg: "bg-[#EADBCE]/80 dark:bg-[#382C24]/90 text-[#7A5F45] dark:text-[#C7B3A2] font-bold",
    headerBtnHover: "hover:bg-[#EADBCE]/60 dark:hover:bg-[#382C24]/60",
    addBtnHover: "hover:bg-white dark:hover:bg-[#251F19]/90 hover:shadow-figma-xs hover:border-[#E8DFD3]/80 dark:hover:border-[#3D3229]/60",
    formBg: "bg-white dark:bg-[#251F19] shadow-figma-sm",
  },
  {
    id: "sage",
    name: "Sage",
    dotColor: "bg-[#3E6B48]",
    columnBgDefault: "bg-[#F0F5F1]/92 dark:bg-[#121A14]/92 backdrop-blur-2xl",
    columnBorder: "border-[#D0DFD3]/90 dark:border-[#213225]/90",
    cardBg: "bg-white dark:bg-[#1A251D]/95",
    cardBorder: "border-[#D3E2D6]/90 dark:border-[#273B2C]/80",
    cardHover: "hover:border-[#3E7D4E] hover:shadow-figma-sm",
    headerBadgeBg: "bg-[#D5E3D8]/80 dark:bg-[#223627]/90 text-[#3E6B48] dark:text-[#A4C4AB] font-bold",
    headerBtnHover: "hover:bg-[#D5E3D8]/60 dark:hover:bg-[#223627]/60",
    addBtnHover: "hover:bg-white dark:hover:bg-[#1A251D]/90 hover:shadow-figma-xs hover:border-[#D3E2D6]/80 dark:hover:border-[#273B2C]/60",
    formBg: "bg-white dark:bg-[#1A251D] shadow-figma-sm",
  },
  {
    id: "midnight",
    name: "Midnight",
    dotColor: "bg-neutral-800 dark:bg-neutral-200",
    columnBgDefault: "bg-slate-100/92 dark:bg-[#0E0E10]/92 backdrop-blur-2xl",
    columnBorder: "border-slate-300/80 dark:border-neutral-800/90",
    cardBg: "bg-white dark:bg-[#16161A]/95",
    cardBorder: "border-slate-200/90 dark:border-neutral-800/80",
    cardHover: "hover:border-slate-500 dark:hover:border-neutral-500 hover:shadow-figma-sm",
    headerBadgeBg: "bg-slate-200/80 dark:bg-neutral-800 text-slate-800 dark:text-neutral-200 font-bold",
    headerBtnHover: "hover:bg-slate-200/60 dark:hover:bg-neutral-800/60",
    addBtnHover: "hover:bg-white dark:hover:bg-[#16161A]/90 hover:shadow-figma-xs hover:border-slate-200/80 dark:hover:border-neutral-800/60",
    formBg: "bg-white dark:bg-[#16161A] shadow-figma-sm",
  },
  {
    id: "lavender",
    name: "Lavender",
    dotColor: "bg-[#8247B5]",
    columnBgDefault: "bg-[#F7F2FC]/92 dark:bg-[#171120]/92 backdrop-blur-2xl",
    columnBorder: "border-[#E5D7F2]/90 dark:border-[#322346]/90",
    cardBg: "bg-white dark:bg-[#20182C]/95",
    cardBorder: "border-[#E6D9F2]/90 dark:border-[#392950]/80",
    cardHover: "hover:border-[#9663C2] hover:shadow-figma-sm",
    headerBadgeBg: "bg-[#E9DDF5]/80 dark:bg-[#35254A]/90 text-[#7842A8] dark:text-[#CEB4E8] font-bold",
    headerBtnHover: "hover:bg-[#E9DDF5]/60 dark:hover:bg-[#35254A]/60",
    addBtnHover: "hover:bg-white dark:hover:bg-[#20182C]/90 hover:shadow-figma-xs hover:border-[#E6D9F2]/80 dark:hover:border-[#392950]/60",
    formBg: "bg-white dark:bg-[#20182C] shadow-figma-sm",
  },
];

export function getTodoThemeConfig(themeId?: string): TodoThemeMeta {
  return TODO_THEMES.find((t) => t.id === themeId) || TODO_THEMES[0];
}
