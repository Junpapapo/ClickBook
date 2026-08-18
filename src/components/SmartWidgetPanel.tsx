import { LayoutGrid } from "lucide-react";
import type { Bookmark, TodoTask } from "@/shared/types";
import { useLang } from "@/shared/LanguageContext";
import UserProfileWidget from "@/components/dashboard/widgets/UserProfileWidget";
import WeatherWidget from "@/components/dashboard/widgets/WeatherWidget";
import UrgentTasksWidget from "@/components/dashboard/widgets/UrgentTasksWidget";
import PatternSaverWidget from "@/components/dashboard/widgets/PatternSaverWidget";

interface Props {
  bookmarks: Bookmark[];
  onClose?: () => void;
  memoCount?: number;
  urgentTasks?: TodoTask[];
  onSelectTodoBoard?: () => void;
  onRefresh?: () => void;
  onNavigate?: (page: string) => void;
}

export default function SmartWidgetPanel({
  bookmarks,
  memoCount = 0,
  urgentTasks = [],
  onSelectTodoBoard,
  onRefresh,
  onNavigate,
}: Props) {
  const { lang } = useLang();

  return (
    <div className="w-80 h-full flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-l border-slate-200/80 dark:border-white/10 select-none overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/80 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <LayoutGrid size={15} />
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
            {lang === "ko" ? "스마트 위젯 패널" : "Smart Widgets"}
          </span>
        </div>
      </div>

      {/* 위젯 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 space-y-3.5">
        {/* 1. 프로필 & 잔디 Activity 매트릭스 */}
        <UserProfileWidget
          bookmarkCount={bookmarks.length}
          memoCount={memoCount}
          completedTaskCount={urgentTasks.filter((t) => t.completed).length}
          onNavigate={onNavigate}
        />

        {/* 2. 실시간 날씨 위젯 */}
        <WeatherWidget />

        {/* 3. 북마크 패턴 저장 위젯 */}
        <PatternSaverWidget onPatternLoad={onRefresh} />

        {/* 4. 오늘의 긴급 할일 위젯 */}
        {urgentTasks.length > 0 && (
          <UrgentTasksWidget
            tasks={urgentTasks}
            onSelectTodoBoard={onSelectTodoBoard}
          />
        )}
      </div>
    </div>
  );
}
