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
    columnBgDefault: "bg-white/45 dark:bg-slate-950/45 backdrop-blur-xl",
    columnBorder: "border-white/50 dark:border-white/10",
    cardBg: "bg-white/65 dark:bg-slate-900/50 backdrop-blur-md",
    cardBorder: "border-slate-200/70 dark:border-slate-800/60",
    cardHover: "hover:border-indigo-400/60 hover:shadow-xs",
    headerBadgeBg: "bg-slate-200/70 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300",
    headerBtnHover: "hover:bg-slate-200/50 dark:hover:bg-slate-800/50",
    addBtnHover: "hover:bg-white/60 dark:hover:bg-slate-800/60 hover:border-slate-200/70 dark:hover:border-slate-700/50",
    formBg: "bg-white/70 dark:bg-slate-900/80 backdrop-blur-md",
  },
  {
    id: "sepia",
    name: "Sepia",
    dotColor: "bg-[#8C6D4F]",
    columnBgDefault: "bg-[#FBF8F2]/50 dark:bg-[#1E1813]/50 backdrop-blur-xl",
    columnBorder: "border-[#EADBCE]/70 dark:border-[#382C24]/70",
    cardBg: "bg-[#F5EFE6]/65 dark:bg-[#251F19]/55 backdrop-blur-md",
    cardBorder: "border-[#E8DFD3]/70 dark:border-[#3D3229]/70",
    cardHover: "hover:border-[#9E7A5A] hover:shadow-xs",
    headerBadgeBg: "bg-[#EADBCE]/70 dark:bg-[#382C24]/80 text-[#7A5F45] dark:text-[#C7B3A2]",
    headerBtnHover: "hover:bg-[#EADBCE]/50 dark:hover:bg-[#382C24]/50",
    addBtnHover: "hover:bg-[#F5EFE6]/60 dark:hover:bg-[#251F19]/60 hover:border-[#E8DFD3]/70 dark:hover:border-[#3D3229]/60",
    formBg: "bg-[#FBF8F2]/75 dark:bg-[#1E1813]/85 backdrop-blur-md",
  },
  {
    id: "sage",
    name: "Sage",
    dotColor: "bg-[#3E6B48]",
    columnBgDefault: "bg-[#F4F8F5]/50 dark:bg-[#131D16]/50 backdrop-blur-xl",
    columnBorder: "border-[#D5E3D8]/70 dark:border-[#223627]/70",
    cardBg: "bg-[#EAF1EC]/65 dark:bg-[#1A261E]/55 backdrop-blur-md",
    cardBorder: "border-[#D3E2D6]/70 dark:border-[#273B2C]/70",
    cardHover: "hover:border-[#3E7D4E] hover:shadow-xs",
    headerBadgeBg: "bg-[#D5E3D8]/70 dark:bg-[#223627]/80 text-[#3E6B48] dark:text-[#A4C4AB]",
    headerBtnHover: "hover:bg-[#D5E3D8]/50 dark:hover:bg-[#223627]/50",
    addBtnHover: "hover:bg-[#EAF1EC]/60 dark:hover:bg-[#1A261E]/60 hover:border-[#D3E2D6]/70 dark:hover:border-[#273B2C]/60",
    formBg: "bg-[#F4F8F5]/75 dark:bg-[#131D16]/85 backdrop-blur-md",
  },
  {
    id: "midnight",
    name: "Midnight",
    dotColor: "bg-neutral-800 dark:bg-neutral-200",
    columnBgDefault: "bg-white/45 dark:bg-[#0B0B0C]/50 backdrop-blur-xl",
    columnBorder: "border-slate-300/60 dark:border-neutral-800/60",
    cardBg: "bg-white/65 dark:bg-white/[0.06] backdrop-blur-md",
    cardBorder: "border-slate-200/70 dark:border-neutral-800/70",
    cardHover: "hover:border-slate-500 dark:hover:border-neutral-500 hover:shadow-xs",
    headerBadgeBg: "bg-slate-200/70 dark:bg-neutral-800/80 text-slate-800 dark:text-neutral-200",
    headerBtnHover: "hover:bg-slate-200/50 dark:hover:bg-neutral-800/50",
    addBtnHover: "hover:bg-white/60 dark:hover:bg-white/[0.08] hover:border-slate-200/70 dark:hover:border-neutral-800/60",
    formBg: "bg-white/75 dark:bg-[#121214]/85 backdrop-blur-md",
  },
  {
    id: "lavender",
    name: "Lavender",
    dotColor: "bg-[#8247B5]",
    columnBgDefault: "bg-[#FAF7FD]/50 dark:bg-[#181321]/50 backdrop-blur-xl",
    columnBorder: "border-[#E9DDF5]/70 dark:border-[#35254A]/70",
    cardBg: "bg-[#F3EDFA]/65 dark:bg-[#20182D]/55 backdrop-blur-md",
    cardBorder: "border-[#E6D9F2]/70 dark:border-[#392950]/70",
    cardHover: "hover:border-[#9663C2] hover:shadow-xs",
    headerBadgeBg: "bg-[#E9DDF5]/70 dark:bg-[#35254A]/80 text-[#7842A8] dark:text-[#CEB4E8]",
    headerBtnHover: "hover:bg-[#E9DDF5]/50 dark:hover:bg-[#35254A]/50",
    addBtnHover: "hover:bg-[#F3EDFA]/60 dark:hover:bg-[#20182D]/60 hover:border-[#E6D9F2]/70 dark:hover:border-[#392950]/60",
    formBg: "bg-[#FAF7FD]/75 dark:bg-[#181321]/85 backdrop-blur-md",
  },
];

export function getTodoThemeConfig(themeId?: string): TodoThemeMeta {
  return TODO_THEMES.find((t) => t.id === themeId) || TODO_THEMES[0];
}
