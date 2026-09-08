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
    columnBgDefault: "bg-slate-100/95 dark:bg-[#11151c]/95 backdrop-blur-2xl",
    columnBorder: "border-slate-200/90 dark:border-slate-800/80",
    cardBg: "bg-white dark:bg-[#1d232e]",
    cardBorder: "border-slate-200/85 dark:border-slate-700/80",
    cardHover: "hover:border-indigo-500/80 dark:hover:border-indigo-400 hover:shadow-figma-sm dark:hover:bg-[#232a37]",
    headerBadgeBg: "bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold",
    headerBtnHover: "hover:bg-slate-200/60 dark:hover:bg-slate-800/60",
    addBtnHover: "hover:bg-white dark:hover:bg-[#1d232e] hover:shadow-figma-xs hover:border-slate-200/80 dark:hover:border-slate-700/60 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100",
    formBg: "bg-white dark:bg-[#1d232e] shadow-figma-sm",
  },
  {
    id: "sepia",
    name: "Sepia",
    dotColor: "bg-[#8C6D4F]",
    columnBgDefault: "bg-[#F7F3EB]/95 dark:bg-[#16120e]/95 backdrop-blur-2xl",
    columnBorder: "border-[#E5DDD2]/90 dark:border-[#2f241d]/90",
    cardBg: "bg-white dark:bg-[#251d16]",
    cardBorder: "border-[#E8DFD3]/90 dark:border-[#3d3024]/80",
    cardHover: "hover:border-[#9E7A5A] hover:shadow-figma-sm dark:hover:bg-[#2d231b]",
    headerBadgeBg: "bg-[#EADBCE]/80 dark:bg-[#382C24]/90 text-[#7A5F45] dark:text-[#C7B3A2] font-bold",
    headerBtnHover: "hover:bg-[#EADBCE]/60 dark:hover:bg-[#382C24]/60",
    addBtnHover: "hover:bg-white dark:hover:bg-[#251d16] hover:shadow-figma-xs hover:border-[#E8DFD3]/80 dark:hover:border-[#3d3024]/60 text-slate-500 dark:text-[#C7B3A2]",
    formBg: "bg-white dark:bg-[#251d16] shadow-figma-sm",
  },
  {
    id: "sage",
    name: "Sage",
    dotColor: "bg-[#3E6B48]",
    columnBgDefault: "bg-[#F0F5F1]/95 dark:bg-[#0f1611]/95 backdrop-blur-2xl",
    columnBorder: "border-[#D0DFD3]/90 dark:border-[#1d2c20]/90",
    cardBg: "bg-white dark:bg-[#1a251c]",
    cardBorder: "border-[#D3E2D6]/90 dark:border-[#283b2c]/80",
    cardHover: "hover:border-[#3E7D4E] hover:shadow-figma-sm dark:hover:bg-[#202e23]",
    headerBadgeBg: "bg-[#D5E3D8]/80 dark:bg-[#223627]/90 text-[#3E6B48] dark:text-[#A4C4AB] font-bold",
    headerBtnHover: "hover:bg-[#D5E3D8]/60 dark:hover:bg-[#223627]/60",
    addBtnHover: "hover:bg-white dark:hover:bg-[#1a251c] hover:shadow-figma-xs hover:border-[#D3E2D6]/80 dark:hover:border-[#283b2c]/60 text-slate-500 dark:text-[#A4C4AB]",
    formBg: "bg-white dark:bg-[#1a251c] shadow-figma-sm",
  },
  {
    id: "midnight",
    name: "Midnight",
    dotColor: "bg-neutral-800 dark:bg-neutral-200",
    columnBgDefault: "bg-slate-100/95 dark:bg-[#0c0d0e]/95 backdrop-blur-2xl",
    columnBorder: "border-slate-300/80 dark:border-neutral-800/90",
    cardBg: "bg-white dark:bg-[#1a1c1e]",
    cardBorder: "border-slate-200/90 dark:border-neutral-700/80",
    cardHover: "hover:border-slate-500 dark:hover:border-neutral-400 hover:shadow-figma-sm dark:hover:bg-[#222528]",
    headerBadgeBg: "bg-slate-200/80 dark:bg-neutral-800 text-slate-800 dark:text-neutral-200 font-bold",
    headerBtnHover: "hover:bg-slate-200/60 dark:hover:bg-neutral-800/60",
    addBtnHover: "hover:bg-white dark:hover:bg-[#1a1c1e] hover:shadow-figma-xs hover:border-slate-200/80 dark:hover:border-neutral-700/60 text-slate-500 dark:text-neutral-300",
    formBg: "bg-white dark:bg-[#1a1c1e] shadow-figma-sm",
  },
  {
    id: "lavender",
    name: "Lavender",
    dotColor: "bg-[#8247B5]",
    columnBgDefault: "bg-[#F7F2FC]/95 dark:bg-[#140e1b]/95 backdrop-blur-2xl",
    columnBorder: "border-[#E5D7F2]/90 dark:border-[#2b1c3b]/90",
    cardBg: "bg-white dark:bg-[#22172f]",
    cardBorder: "border-[#E6D9F2]/90 dark:border-[#38264c]/80",
    cardHover: "hover:border-[#9663C2] hover:shadow-figma-sm dark:hover:bg-[#2a1c3a]",
    headerBadgeBg: "bg-[#E9DDF5]/80 dark:bg-[#35254A]/90 text-[#7842A8] dark:text-[#CEB4E8] font-bold",
    headerBtnHover: "hover:bg-[#E9DDF5]/60 dark:hover:bg-[#35254A]/60",
    addBtnHover: "hover:bg-white dark:hover:bg-[#22172f] hover:shadow-figma-xs hover:border-[#E6D9F2]/80 dark:hover:border-[#38264c]/60 text-slate-500 dark:text-[#CEB4E8]",
    formBg: "bg-white dark:bg-[#22172f] shadow-figma-sm",
  },
];

export function getTodoThemeConfig(themeId?: string): TodoThemeMeta {
  return TODO_THEMES.find((t) => t.id === themeId) || TODO_THEMES[0];
}
