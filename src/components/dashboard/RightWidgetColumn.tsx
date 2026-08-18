import { useState } from "react";
import { ChevronRight, ChevronLeft, Layout } from "lucide-react";
import type { Bookmark, TodoTask } from "@/shared/types";
import { useLang } from "@/shared/LanguageContext";
import UserProfileWidget from "./widgets/UserProfileWidget";
import WeatherWidget from "./widgets/WeatherWidget";
import UrgentTasksWidget from "./widgets/UrgentTasksWidget";
import TopSitesWidget from "./widgets/TopSitesWidget";

interface Props {
  bookmarks: Bookmark[];
  memoCount: number;
  urgentTasks?: TodoTask[];
  onToggleTask?: (taskId: string) => void;
  onSelectTodoBoard?: () => void;
  onOpenBookmark?: (b: Bookmark) => void;
}

export default function RightWidgetColumn({
  bookmarks,
  memoCount,
  urgentTasks = [],
  onToggleTask,
  onSelectTodoBoard,
  onOpenBookmark,
}: Props) {
  const { lang } = useLang();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("clickbook_dashboard_widget_collapsed") === "true";
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("clickbook_dashboard_widget_collapsed", String(next));
      return next;
    });
  };

  return (
    <div
      className={`relative flex flex-col shrink-0 transition-all duration-300 ease-in-out select-none ${
        isCollapsed ? "w-10" : "w-full lg:w-80 xl:w-[340px]"
      }`}
    >
      {/* ── 접기/펼치기 플로팅 버튼 ── */}
      <div className="flex items-center justify-between mb-3 px-1">
        {!isCollapsed && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
            <Layout size={14} className="text-indigo-500" />
            <span>{lang === "ko" ? "스마트 위젯" : "Smart Widgets"}</span>
          </div>
        )}
        <button
          onClick={toggleCollapse}
          className="p-1.5 rounded-xl bg-white/60 dark:bg-slate-800/60 hover:bg-white/90 dark:hover:bg-slate-700/80 backdrop-blur-md border border-white/60 dark:border-white/10 text-slate-600 dark:text-slate-300 shadow-figma-sm transition-all cursor-pointer ml-auto"
          title={isCollapsed ? (lang === "ko" ? "위젯 패널 펼치기" : "Expand Widgets") : (lang === "ko" ? "위젯 패널 접기" : "Collapse Widgets")}
        >
          {isCollapsed ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      {/* ── 펼쳐진 상태의 위젯 리스트 ── */}
      {!isCollapsed ? (
        <div className="space-y-3.5 animate-in fade-in duration-200 overflow-y-auto max-h-[calc(100vh-140px)] pr-1 custom-scrollbar">
          {/* 1. 사용자 프로필 & Activity Matrix */}
          <UserProfileWidget
            bookmarkCount={bookmarks.length}
            memoCount={memoCount}
            completedTaskCount={urgentTasks.filter((t) => t.completed).length}
          />

          {/* 2. 실시간 날씨 위젯 */}
          <WeatherWidget />

          {/* 3. 오늘의 긴급 할일 위젯 */}
          <UrgentTasksWidget
            tasks={urgentTasks}
            onToggleTask={onToggleTask}
            onSelectTodoBoard={onSelectTodoBoard}
          />

          {/* 4. 자주 가는 탑사이트 랭킹 */}
          <TopSitesWidget
            bookmarks={bookmarks}
            count={5}
            onOpenBookmark={onOpenBookmark}
          />
        </div>
      ) : (
        /* 접힌 상태의 미니멀 아이콘 레일 */
        <div
          onClick={toggleCollapse}
          className="flex-1 flex flex-col items-center gap-4 py-4 bg-white/30 dark:bg-slate-800/30 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-2xl cursor-pointer hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors"
          title={lang === "ko" ? "클릭하여 위젯 패널 펼치기" : "Click to expand"}
        >
          <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
            P
          </div>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 writing-vertical py-2">
            WIDGETS
          </span>
        </div>
      )}
    </div>
  );
}
