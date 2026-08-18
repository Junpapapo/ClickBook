import { CheckSquare, Square, ArrowRight, Check } from "lucide-react";
import type { TodoTask } from "@/shared/types";
import { useLang } from "@/shared/LanguageContext";

interface Props {
  tasks: TodoTask[];
  onToggleTask?: (taskId: string) => void;
  onSelectTodoBoard?: () => void;
}

export default function UrgentTasksWidget({ tasks, onToggleTask, onSelectTodoBoard }: Props) {
  const { t } = useLang();

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;

  return (
    <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl p-4 shadow-figma-sm select-none">
      {/* ── 헤더 ── */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            {t("tasksTodayTitle")}
          </span>
          {totalCount > 0 && (
            <span className="px-1.5 py-0.2 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[9px] font-bold rounded-full">
              {completedCount}/{totalCount}
            </span>
          )}
        </div>
        {onSelectTodoBoard && (
          <button
            onClick={onSelectTodoBoard}
            className="text-[10.5px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            <span>{t("tasksViewAll")}</span>
            <ArrowRight size={11} />
          </button>
        )}
      </div>

      {/* ── 태스크 리스트 ── */}
      {tasks.length === 0 ? (
        <div className="py-4 text-center">
          <Check size={20} className="mx-auto text-emerald-500 mb-1" />
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            {t("tasksNoUrgent")}
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {tasks.slice(0, 4).map((task) => (
            <div
              key={task.id}
              onClick={() => onToggleTask && onToggleTask(task.id)}
              className="flex items-center gap-2 p-2 rounded-xl bg-white/50 dark:bg-slate-900/40 hover:bg-white/80 dark:hover:bg-slate-900/70 border border-slate-200/40 dark:border-slate-700/40 transition-all cursor-pointer group"
            >
              <div className="text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 shrink-0">
                {task.completed ? (
                  <CheckSquare size={14} className="text-indigo-600 dark:text-indigo-400" />
                ) : (
                  <Square size={14} />
                )}
              </div>
              <span
                className={`text-[11.5px] truncate flex-1 ${
                  task.completed
                    ? "line-through text-slate-400 dark:text-slate-500"
                    : "text-slate-700 dark:text-slate-200 font-medium group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                }`}
              >
                {task.content}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
