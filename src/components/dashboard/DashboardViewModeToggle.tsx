
import { LayoutGrid, Layers } from "lucide-react";
import { useLang } from "@/shared/LanguageContext";

export type DashboardViewMode = "modern" | "classic";

interface Props {
  mode: DashboardViewMode;
  onChange: (mode: DashboardViewMode) => void;
}

export default function DashboardViewModeToggle({ mode, onChange }: Props) {
  const { lang } = useLang();

  return (
    <div className="inline-flex items-center bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/60 dark:border-white/10 p-0.5 rounded-xl shadow-2xs select-none">
      <button
        onClick={() => onChange("modern")}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
          mode === "modern"
            ? "bg-indigo-600 text-white shadow-xs"
            : "text-slate-600 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-slate-700/50"
        }`}
        title={lang === "ko" ? "모던 캔버스 뷰 (Cosmos 스타일)" : "Modern Canvas View"}
      >
        <LayoutGrid size={13} />
        <span className="hidden sm:inline">{lang === "ko" ? "모던 캔버스" : "Modern"}</span>
      </button>

      <button
        onClick={() => onChange("classic")}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
          mode === "classic"
            ? "bg-indigo-600 text-white shadow-xs"
            : "text-slate-600 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-slate-700/50"
        }`}
        title={lang === "ko" ? "클래식 관리 뷰 (상세 그리드)" : "Classic Grid View"}
      >
        <Layers size={13} />
        <span className="hidden sm:inline">{lang === "ko" ? "클래식 관리" : "Classic"}</span>
      </button>
    </div>
  );
}
