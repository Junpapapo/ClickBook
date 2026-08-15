import React from "react";
import { Draggable, DraggableProvided } from "@hello-pangea/dnd";
import { GripVertical, CheckCircle2, Circle, Calendar, AlignLeft, CheckSquare, Trash2, BookOpen } from "lucide-react";
import type { TodoTask } from "@/shared/types";
import { FolderIcon } from "@/components/DynamicIcon";
import { checkSpringNoteExists } from "@/utils/springNoteDb";
import { useLang } from "@/shared/LanguageContext";
import type { TFunction, Lang } from "@/shared/i18n";

const TASK_BG_COLORS: Record<string, string> = {
  default: "bg-white dark:bg-slate-800/95 border-slate-200/90 dark:border-slate-700/70",
  blue: "bg-blue-50/50 dark:bg-slate-800/95 border-blue-200/90 dark:border-blue-800/60 border-l-[3px] border-l-blue-500",
  emerald: "bg-emerald-50/50 dark:bg-slate-800/95 border-emerald-200/90 dark:border-emerald-800/60 border-l-[3px] border-l-emerald-500",
  amber: "bg-amber-50/50 dark:bg-slate-800/95 border-amber-200/90 dark:border-amber-800/60 border-l-[3px] border-l-amber-500",
  rose: "bg-rose-50/50 dark:bg-slate-800/95 border-rose-200/90 dark:border-rose-800/60 border-l-[3px] border-l-rose-500",
  purple: "bg-purple-50/50 dark:bg-slate-800/95 border-purple-200/90 dark:border-purple-800/60 border-l-[3px] border-l-purple-500",
};

const formatDateByLang = (dateStr?: string, lang: Lang = "en") => {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  if (lang === "ko") return `${m}월 ${d}일`;
  if (lang === "ja") return `${m}月 ${d}日`;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[m - 1] || m} ${d}`;
};

const formatDateStr = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const getDueBadgeInfo = (task: TodoTask, lang: Lang, t: TFunction) => {
  if (!task.dueDate) return null;

  const todayStr = formatDateStr(new Date());

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = formatDateStr(tomorrow);

  const isCompleted = !!task.completed;
  const isOverdue = !isCompleted && task.dueDate < todayStr;
  const isDueToday = !isCompleted && task.dueDate === todayStr;
  const isDueTomorrow = !isCompleted && task.dueDate === tomorrowStr;

  const dateFormatted = formatDateByLang(task.dueDate, lang);
  const timeFormatted = task.dueTime ? ` ${task.dueTime}` : "";
  const displayLabel = `${dateFormatted}${timeFormatted}`;

  let bgClass = "bg-slate-100 dark:bg-slate-750 text-slate-600 dark:text-slate-300 border-slate-200/70 dark:border-slate-700/60";
  let statusText = "";

  if (isCompleted) {
    bgClass = "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40";
    statusText = t("statusCompleted");
  } else if (isOverdue) {
    bgClass = "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/50 font-semibold";
    statusText = t("statusOverdue");
  } else if (isDueToday) {
    bgClass = "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200/70 dark:border-amber-800/40 font-medium";
    statusText = t("statusToday");
  } else if (isDueTomorrow) {
    bgClass = "bg-amber-50/60 dark:bg-amber-950/20 text-amber-600/90 dark:text-amber-400/90 border-amber-200/50 dark:border-amber-800/30";
    statusText = t("statusTomorrow");
  }

  return {
    label: displayLabel,
    bgClass,
    statusText,
  };
};

interface TodoTaskCardProps {
  task: TodoTask;
  index: number;
  columnId: string;
  onToggleComplete: (taskId: string, e: React.MouseEvent) => void;
  onOpenModal: (task: TodoTask) => void;
  onDeleteTask: (taskId: string, colId: string, e?: React.MouseEvent) => void;
  onOpenSpringNote: (taskId: string, e: React.MouseEvent) => void;
}

export default React.memo(function TodoCard({
  task,
  index,
  columnId,
  onToggleComplete,
  onOpenModal,
  onDeleteTask,
  onOpenSpringNote,
}: TodoTaskCardProps) {
  const { lang, t } = useLang();
  const [hasNote, setHasNote] = React.useState(false);

  React.useEffect(() => {
    checkSpringNoteExists(task.id).then(setHasNote);
  }, [task.id]);

  const cardColorClass = TASK_BG_COLORS[task.color || "default"] || TASK_BG_COLORS.default;

  return (
    <Draggable key={task.id} draggableId={task.id} index={index}>
      {(provided: DraggableProvided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onOpenModal(task)}
          className={`group/task relative ${cardColorClass} p-3 rounded-lg shadow-2xs border
            ${snapshot.isDragging
              ? "shadow-lg ring-2 ring-indigo-500/40 rotate-1 scale-[1.01] z-50 cursor-grabbing bg-white dark:bg-slate-800"
              : "hover:border-indigo-400/70 dark:hover:border-indigo-500/60 hover:shadow-xs cursor-pointer transition-all duration-150"
            }
          `}
        >
          <div className="flex items-start gap-2 relative">
            {/* Drag Handle Indicator */}
            <div className="mt-0.5 -ml-1 shrink-0 text-slate-400 dark:text-slate-500 opacity-0 group-hover/task:opacity-60 hover:!opacity-100 transition-opacity cursor-grab">
              <GripVertical size={13} />
            </div>

            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-start gap-2">
                {/* Complete Toggle Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleComplete(task.id, e);
                  }}
                  className="mt-0.5 text-slate-400 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-400 transition-colors shrink-0"
                >
                  {task.completed ? (
                    <CheckCircle2 size={15} className="text-emerald-500 dark:text-emerald-400 animate-in zoom-in-75 duration-150" />
                  ) : (
                    <Circle size={15} />
                  )}
                </button>

                {/* Task Title */}
                <div
                  className={`text-xs sm:text-[13px] font-medium leading-snug break-words flex items-center gap-1.5 flex-1 min-w-0 ${
                    task.completed ? "text-slate-400 dark:text-slate-500 line-through font-normal" : "text-slate-800 dark:text-slate-100"
                  }`}
                >
                  {task.icon && <FolderIcon iconName={task.icon} size={13} className="shrink-0" />}
                  <span>{task.content}</span>
                </div>
              </div>

              {/* Badges & Meta Info */}
              {(task.description ||
                (task.checklist && task.checklist.length > 0) ||
                (task.progress !== undefined && task.progress > 0) ||
                (task.tags && task.tags.length > 0) ||
                task.dueDate) && (
                <div className="mt-2.5 flex flex-col gap-2">
                  {(task.description || (task.checklist && task.checklist.length > 0) || task.dueDate || hasNote) && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Due Date Badge */}
                      {task.dueDate && (() => {
                        const badge = getDueBadgeInfo(task, lang, t);
                        if (!badge) return null;
                        return (
                          <div className={`h-5 flex items-center gap-1 text-[10.5px] px-1.5 rounded-md border ${badge.bgClass}`}>
                            <Calendar size={11} className="shrink-0" />
                            <span className="truncate max-w-[120px]">{badge.label}</span>
                            {badge.statusText && (
                              <span className="text-[9px] font-semibold uppercase tracking-wider bg-black/5 dark:bg-white/10 px-1 rounded">
                                {badge.statusText}
                              </span>
                            )}
                          </div>
                        );
                      })()}

                      {/* Description Icon */}
                      {task.description && (
                        <div className="h-5 flex items-center text-slate-400 dark:text-slate-500 px-0.5" title="Has description">
                          <AlignLeft size={12} />
                        </div>
                      )}

                      {/* Checklist Badge */}
                      {task.checklist && task.checklist.length > 0 && (
                        <div
                          className={`h-5 flex items-center gap-1 text-[10.5px] font-medium px-1.5 rounded-md border ${
                            task.checklist.every((c) => c.completed)
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40"
                              : "bg-slate-100 dark:bg-slate-750 text-slate-600 dark:text-slate-400 border-slate-200/60 dark:border-slate-700/60"
                          }`}
                        >
                          <CheckSquare size={11} className="shrink-0" />
                          <span>
                            {task.checklist.filter((c) => c.completed).length}/{task.checklist.length}
                          </span>
                        </div>
                      )}

                      {/* Spring Note Badge */}
                      {hasNote && (
                        <div
                          className="h-5 flex items-center gap-1 text-[10.5px] font-medium bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-1.5 rounded-md border border-indigo-200/60 dark:border-indigo-800/40"
                          title={t("springNoteWritten")}
                        >
                          <BookOpen size={11} className="shrink-0" />
                          <span>Note</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tags */}
                  {task.tags && task.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {task.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="h-4.5 px-1.5 bg-slate-100 dark:bg-slate-750 text-slate-600 dark:text-slate-300 text-[10px] font-medium uppercase tracking-wider rounded border border-slate-200/60 dark:border-slate-700/60 flex items-center"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Progress Bar */}
                  {task.progress !== undefined && task.progress > 0 && (
                    <div className="pt-1">
                      <div className="flex justify-between items-center mb-1 text-[9.5px] font-semibold tracking-wider text-slate-400 dark:text-slate-500">
                        <span>PROGRESS</span>
                        <span className="text-indigo-600 dark:text-indigo-400">{task.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700/60 rounded-full h-1 overflow-hidden border border-slate-200/40 dark:border-slate-700/40">
                        <div
                          className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Hover Quick Actions */}
          <div className="absolute top-2 right-2 opacity-0 group-hover/task:opacity-100 transition-opacity duration-150 flex items-center gap-0.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenSpringNote(task.id, e);
              }}
              className="p-1 bg-white/95 dark:bg-slate-700/95 backdrop-blur-xs border border-slate-200 dark:border-slate-600 rounded-md shadow-2xs text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
              title={t("springNoteTooltipShort")}
            >
              <BookOpen size={12} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteTask(task.id, columnId, e);
              }}
              className="p-1 bg-white/95 dark:bg-slate-700/95 backdrop-blur-xs border border-slate-200 dark:border-slate-600 rounded-md shadow-2xs text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              title={t("deleteTooltip")}
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      )}
    </Draggable>
  );
});
