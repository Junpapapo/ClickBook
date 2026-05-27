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
  { icon: typeof Activity; gradient: string; badge: string }
> = {
  "ai-organize": {
    icon: Sparkles,
    gradient: "from-violet-600 to-indigo-600",
    badge: "AI 분류",
  },
  "ai-tag": {
    icon: Tag,
    gradient: "from-emerald-600 to-teal-600",
    badge: "AI 태깅",
  },
  "ai-clean": {
    icon: ScanSearch,
    gradient: "from-teal-600 to-cyan-600",
    badge: "AI 중복검사",
  },
  "chrome-sync": {
    icon: RefreshCw,
    gradient: "from-blue-600 to-sky-600",
    badge: "Chrome 동기화",
  },
  scrape: {
    icon: FileText,
    gradient: "from-amber-600 to-orange-600",
    badge: "콘텐츠 수집",
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
      bg: "bg-gray-50 dark:bg-surface-800/50",
      border: "border-gray-200 dark:border-surface-700",
      statusIcon: <Clock size={12} className="text-gray-400" />,
      statusText: t("taskQueued") || "대기 중...",
      statusColor: "text-gray-500",
    },
    running: {
      bg: "bg-white dark:bg-surface-800",
      border: "border-indigo-200/50 dark:border-indigo-700/30",
      statusIcon: (
        <Loader2 size={12} className="text-indigo-500 animate-spin" />
      ),
      statusText: t("taskRunning") || "진행 중",
      statusColor: "text-indigo-600 dark:text-indigo-400",
    },
    completed: {
      bg: "bg-emerald-50/50 dark:bg-emerald-900/10",
      border: "border-emerald-200/50 dark:border-emerald-700/30",
      statusIcon: <CheckCircle2 size={12} className="text-emerald-500" />,
      statusText: t("taskCompleted") || "완료",
      statusColor: "text-emerald-600 dark:text-emerald-400",
    },
    failed: {
      bg: "bg-rose-50/50 dark:bg-rose-900/10",
      border: "border-rose-200/50 dark:border-rose-700/30",
      statusIcon: <XCircle size={12} className="text-rose-500" />,
      statusText: t("taskFailed") || "실패",
      statusColor: "text-rose-600 dark:text-rose-400",
    },
    cancelled: {
      bg: "bg-gray-50 dark:bg-surface-800/50",
      border: "border-gray-200 dark:border-surface-700",
      statusIcon: <X size={12} className="text-gray-400" />,
      statusText: t("taskCancelled") || "취소됨",
      statusColor: "text-gray-500",
    },
  };

  const cfg = statusConfig[task.status];

  return (
    <div
      className={`
        relative rounded-xl border p-4 transition-all duration-300
        ${cfg.bg} ${cfg.border}
        ${task.status === "completed" ? "animate-pulse-once opacity-80" : ""}
      `}
    >
      {/* Header row */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br ${meta.gradient} shadow-lg`}
        >
          <Icon size={14} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-gradient-to-r ${meta.gradient} text-white`}
            >
              {meta.badge}
            </span>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">
              {task.name}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            {cfg.statusIcon}
            <span className={`text-[10px] font-medium ${cfg.statusColor}`}>
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
          <div className="h-1.5 bg-gray-200 dark:bg-surface-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r ${meta.gradient}`}
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

  return (
    <div className="max-w-3xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25">
            <Zap size={18} className="text-yellow-300" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
              {t("taskControlTitle") || "Task Control Center"}
            </h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {t("taskControlDesc") ||
                "백그라운드 작업을 실시간 모니터링하고 제어합니다"}
            </p>
          </div>
        </div>
      </div>

      {/* Concurrency Guard Banner */}
      <div className="flex items-center justify-between px-4 py-3 mb-6 rounded-xl bg-white/80 dark:bg-surface-800/80 backdrop-blur-md border border-gray-200/50 dark:border-surface-700/50 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className={`w-2 h-2 rounded-full ${guardDot} ${aiRunningCount > 0 ? "animate-pulse" : ""}`} />
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
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
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-surface-800 flex items-center justify-center">
            <Activity
              size={28}
              className="text-gray-300 dark:text-gray-600"
            />
          </div>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            {t("taskControlEmpty") || "현재 진행 중인 작업이 없습니다"}
          </p>
          <p className="text-[11px] text-gray-300 dark:text-gray-600 max-w-xs text-center">
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
        <div className="mt-6 px-4 py-3 rounded-xl bg-gray-50/50 dark:bg-surface-800/30 border border-gray-200/30 dark:border-surface-700/30">
          <div className="flex items-center gap-4 text-[10px] text-gray-400 dark:text-gray-500">
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
  );
}
