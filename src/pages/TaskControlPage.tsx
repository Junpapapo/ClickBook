import { useMemo } from "react";
import {
  Activity,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  X,
  Tag,
  Sparkles,
  ScanSearch,
  RefreshCw,
  FileText,
  Zap,
} from "lucide-react";
import type { TaskItem, TaskCategory } from "@/shared/types";
import { useLang } from "@/shared/LanguageContext";
import { useTheme } from "@/shared/ThemeContext";
import WallpaperBackground from "@/components/dashboard/WallpaperBackground";

interface Props {
  tasks: TaskItem[];
  aiRunningCount: number;
  aiQueuedCount: number;
  onRetry?: (task: TaskItem) => void;
  onDismiss?: (taskId: string) => void;
  onCancel?: (taskId: string) => void;
}

const CATEGORY_META: Record<
  TaskCategory,
  { icon: typeof Activity; iconBg: string; badgeCls: string; badge: string; barColor: string }
> = {
  "ai-organize": {
    icon: Sparkles,
    iconBg: "bg-indigo-600 dark:bg-indigo-500",
    badgeCls: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40",
    badge: "AI 분류",
    barColor: "bg-indigo-600 dark:bg-indigo-500",
  },
  "ai-tag": {
    icon: Tag,
    iconBg: "bg-teal-600 dark:bg-teal-500",
    badgeCls: "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/40",
    badge: "AI 태깅",
    barColor: "bg-teal-600 dark:bg-teal-500",
  },
  "ai-clean": {
    icon: ScanSearch,
    iconBg: "bg-sky-600 dark:bg-sky-500",
    badgeCls: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/40",
    badge: "AI 중복검사",
    barColor: "bg-sky-600 dark:bg-sky-500",
  },
  "chrome-sync": {
    icon: RefreshCw,
    iconBg: "bg-blue-600 dark:bg-blue-500",
    badgeCls: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40",
    badge: "Chrome 동기화",
    barColor: "bg-blue-600 dark:bg-blue-500",
  },
  scrape: {
    icon: FileText,
    iconBg: "bg-amber-600 dark:bg-amber-500",
    badgeCls: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40",
    badge: "콘텐츠 수집",
    barColor: "bg-amber-600 dark:bg-amber-500",
  },
};

function formatElapsed(startedAt?: number): string {
  if (!startedAt) return "";
  const sec = Math.floor((Date.now() - startedAt) / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function TaskCard({
  task,
  onRetry,
  onDismiss,
  onCancel,
}: {
  task: TaskItem;
  onRetry?: (task: TaskItem) => void;
  onDismiss?: (taskId: string) => void;
  onCancel?: (taskId: string) => void;
}) {
  const meta = CATEGORY_META[task.category];
  const Icon = meta.icon;
  const { t } = useLang();

  const statusConfig = {
    queued: {
      bg: "bg-slate-50 dark:bg-slate-800/60",
      border: "border-slate-200/80 dark:border-slate-700/60",
      statusIcon: <Clock size={12} className="text-slate-400" />,
      statusText: t("taskQueued") || "대기 중...",
      statusColor: "text-slate-500 dark:text-slate-400",
    },
    running: {
      bg: "bg-white dark:bg-slate-800/95",
      border: "border-indigo-400 dark:border-indigo-500/60 ring-1 ring-indigo-500/20 shadow-2xs",
      statusIcon: (
        <Loader2 size={12} className="text-indigo-500 animate-spin" />
      ),
      statusText: t("taskRunning") || "진행 중",
      statusColor: "text-indigo-600 dark:text-indigo-400 font-semibold",
    },
    completed: {
      bg: "bg-emerald-50/40 dark:bg-slate-800/80",
      border: "border-emerald-200/70 dark:border-emerald-900/40",
      statusIcon: <CheckCircle2 size={12} className="text-emerald-500" />,
      statusText: t("taskCompleted") || "완료",
      statusColor: "text-emerald-600 dark:text-emerald-400 font-semibold",
    },
    failed: {
      bg: "bg-rose-50/40 dark:bg-slate-800/80",
      border: "border-rose-200/70 dark:border-rose-900/40",
      statusIcon: <XCircle size={12} className="text-rose-500" />,
      statusText: t("taskFailed") || "실패",
      statusColor: "text-rose-600 dark:text-rose-400 font-semibold",
    },
    cancelled: {
      bg: "bg-slate-50 dark:bg-slate-800/60",
      border: "border-slate-200/80 dark:border-slate-700/60",
      statusIcon: <X size={12} className="text-slate-400" />,
      statusText: t("taskCancelled") || "취소됨",
      statusColor: "text-slate-500 dark:text-slate-400",
    },
  };

  const cfg = statusConfig[task.status];

  return (
    <div
      className={`
        relative rounded-xl border p-3.5 transition-all duration-200
        ${cfg.bg} ${cfg.border}
        ${task.status === "completed" ? "opacity-85" : ""}
      `}
    >
      {/* Header row */}
      <div className="flex items-center gap-2.5 mb-2.5">
        <div
          className={`flex items-center justify-center w-7 h-7 rounded-lg ${meta.iconBg} text-white shadow-2xs shrink-0`}
        >
          <Icon size={14} strokeWidth={2.2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[9.5px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${meta.badgeCls}`}
            >
              {meta.badge}
            </span>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
              {task.name}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            {cfg.statusIcon}
            <span className={`text-[10px] ${cfg.statusColor}`}>
              {cfg.statusText}
            </span>
          </div>
        </div>
      </div>

      {/* Progress bar (running/queued) */}
      {(task.status === "running" || task.status === "queued") && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-gray-500 dark:text-gray-400">
              {task.detail || ""}
            </span>
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
              {task.progress}%
            </span>
          </div>
          <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ease-out ${meta.barColor}`}
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Elapsed time (running) */}
      {task.status === "running" && task.startedAt && (
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            ⏱️ {formatElapsed(task.startedAt)}
          </span>
          {onCancel && (
            <button
              onClick={() => onCancel(task.id)}
              className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-lg transition-colors"
            >
              ⏹ {t("taskStop") || "중지"}
            </button>
          )}
        </div>
      )}

      {/* Completed result */}
      {task.status === "completed" && task.result && (
        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
          {task.result.summary}
        </div>
      )}

      {/* Failed: error + retry/dismiss */}
      {task.status === "failed" && (
        <div className="mt-2">
          <p className="text-[11px] text-rose-500 dark:text-rose-400 mb-2 line-clamp-2">
            {task.error}
          </p>
          <div className="flex items-center gap-2 justify-end">
            {onRetry && (
              <button
                onClick={() => onRetry(task)}
                className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-lg transition-colors"
              >
                <RotateCcw size={9} />
                {t("taskRetry") || "재시도"}
              </button>
            )}
            {onDismiss && (
              <button
                onClick={() => onDismiss(task.id)}
                className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold bg-gray-100 dark:bg-surface-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-surface-600 rounded-lg transition-colors"
              >
                <X size={9} />
                {t("taskDismiss") || "닫기"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TaskControlPage({
  tasks,
  aiRunningCount,
  aiQueuedCount,
  onRetry,
  onDismiss,
  onCancel,
}: Props) {
  const { t } = useLang();

  // 정렬: running → queued → failed → completed
  const sortedTasks = useMemo(() => {
    const order: Record<string, number> = {
      running: 0,
      queued: 1,
      failed: 2,
      completed: 3,
      cancelled: 4,
    };
    return [...tasks].sort(
      (a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9)
    );
  }, [tasks]);

  const guardLabel =
    aiRunningCount > 0
      ? aiQueuedCount > 0
        ? `1/1 Running + ${aiQueuedCount} Queued`
        : "1/1 Running"
      : "Idle";

  const guardColor =
    aiRunningCount > 0
      ? aiQueuedCount > 0
        ? "text-rose-500"
        : "text-amber-500"
      : "text-emerald-500";

  const guardDot =
    aiRunningCount > 0
      ? aiQueuedCount > 0
        ? "bg-rose-500"
        : "bg-amber-500"
      : "bg-emerald-500";

  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  return (
    <WallpaperBackground isDarkMode={isDarkMode}>
      <div className="max-w-[1440px] w-full mx-auto pb-6 pt-2 sm:pt-4 px-2 sm:px-6 select-none space-y-4">
        {/* Page Header */}
        <div className="flex items-center gap-3 px-1">
          <div className="flex items-center justify-center w-9 h-9 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-md shadow-violet-500/25">
            <Zap size={17} className="text-yellow-300" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
              {t("taskControlTitle") || "Task Control Center"}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t("taskControlDesc") ||
                "백그라운드 작업을 실시간 모니터링하고 제어합니다"}
            </p>
          </div>
        </div>

        <div className="bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-white/10 shadow-figma-lg p-4 sm:p-5 space-y-4">
          {/* Concurrency Guard Banner */}
          <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className={`w-2 h-2 rounded-full ${guardDot} ${aiRunningCount > 0 ? "animate-pulse" : ""}`} />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                AI Concurrency Guard
              </span>
            </div>
            <span className={`text-[11px] font-bold ${guardColor}`}>
              Limit: 1 · {guardLabel}
            </span>
          </div>

          {/* Task List */}
          {sortedTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Activity
                  size={28}
                  className="text-slate-300 dark:text-slate-600"
                />
              </div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                {t("taskControlEmpty") || "현재 진행 중인 작업이 없습니다"}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs text-center">
                {t("taskControlEmptyHint") ||
                  "AI 정리, 자동 태깅, Chrome 동기화 등의 작업이 여기에 표시됩니다"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onRetry={onRetry}
                  onDismiss={onDismiss}
                  onCancel={onCancel}
                />
              ))}
            </div>
          )}

          {/* Summary Footer */}
          {tasks.length > 0 && (
            <div className="px-4 py-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  {t("taskTotal") || "전체"}: {tasks.length}
                </span>
                <span>
                  {t("taskRunningCount") || "진행 중"}:{" "}
                  {tasks.filter((t) => t.status === "running").length}
                </span>
                <span>
                  {t("taskQueuedCount") || "대기"}:{" "}
                  {tasks.filter((t) => t.status === "queued").length}
                </span>
                <span>
                  {t("taskFailedCount") || "실패"}:{" "}
                  {tasks.filter((t) => t.status === "failed").length}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </WallpaperBackground>
  );
}
