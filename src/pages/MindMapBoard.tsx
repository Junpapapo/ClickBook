import type { Bookmark, Folder } from "@/shared/types";
import { useLang } from "@/shared/LanguageContext";
import { useTheme } from "@/shared/ThemeContext";
import WallpaperBackground from "@/components/dashboard/WallpaperBackground";
import { MindMapPanel } from "./TodoBoard/MindMapPanel";
import { Network } from "lucide-react";

interface Props {
  bookmarks: Bookmark[];
  folders: Folder[];
  memos: Record<string, any>;
  onRefresh: () => void;
}

export default function MindMapBoard({ onRefresh: _onRefresh }: Props) {
  const { lang } = useLang();
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  return (
    <WallpaperBackground isDarkMode={isDarkMode}>
      <div className="max-w-[1440px] w-full mx-auto pb-4 pt-2 sm:pt-4 px-2 sm:px-6 select-none flex flex-col h-[calc(100vh-2rem)] space-y-3">
        {/* ── 타이틀 헤더 ── */}
        <div className="shrink-0 flex items-center justify-between px-1">
          <h1 className="text-xl font-extrabold flex items-center gap-2.5 tracking-tight text-slate-800 dark:text-slate-100">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-purple-600 text-white shadow-sm shadow-purple-500/20">
              <Network size={16} strokeWidth={2.2} />
            </span>
            <span>
              {lang === "ko" ? "마인드맵 보드" : lang === "ja" ? "マインドマップボード" : "Mind Map Board"}
            </span>
          </h1>
        </div>

        {/* ── 마인드맵 캔버스 작업대 ── */}
        <div className="bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-white/10 shadow-figma-lg p-2 sm:p-3 flex-1 flex flex-col min-w-0 overflow-hidden min-h-0">
          <MindMapPanel
            taskId="global_workspace"
            taskTitle={lang === "ko" ? "나의 아이디어 마인드맵" : lang === "ja" ? "マイアイデアマインドマップ" : "My Idea Mind Map"}
            onClose={() => {}}
          />
        </div>
      </div>
    </WallpaperBackground>
  );
}
