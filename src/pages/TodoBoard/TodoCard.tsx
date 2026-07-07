import React from "react";
import { Draggable, DraggableProvided } from "@hello-pangea/dnd";
import { GripVertical, CheckCircle2, Circle, Calendar, AlignLeft, CheckSquare, Trash2 } from "lucide-react";
import type { TodoTask } from "@/shared/types";
import { FolderIcon } from "@/components/DynamicIcon";



const TASK_BG_COLORS: Record<string, string> = {
  default: "bg-white dark:bg-[#2C2C2E]",
  blue: "bg-blue-50 dark:bg-[#1C2331]",
  emerald: "bg-emerald-50 dark:bg-[#1D2A24]",
  amber: "bg-amber-50 dark:bg-[#2D281E]",
  rose: "bg-rose-50 dark:bg-[#2D1E22]",
  purple: "bg-purple-50 dark:bg-[#251E2D]",
};

const formatDateKorean = (dateStr?: string) => {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  return `${m}월 ${d}일`;
};

const formatDateStr = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const getDueBadgeInfo = (task: TodoTask) => {
  if (!task.dueDate) return null;

  const todayStr = formatDateStr(new Date());
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = formatDateStr(tomorrow);

  const isCompleted = !!task.completed;
  const isOverdue = !isCompleted && task.dueDate < todayStr;
  const isDueToday = !isCompleted && task.dueDate === todayStr;
  const isDueTomorrow = !isCompleted && task.dueDate === tomorrowStr;

  const dateFormatted = formatDateKorean(task.dueDate);
  const timeFormatted = task.dueTime ? ` ${task.dueTime}` : "";
  const displayLabel = `${dateFormatted}${timeFormatted}`;

  let bgClass = "bg-gray-100 dark:bg-surface-800 text-gray-500 dark:text-gray-400 border-gray-200/50 dark:border-surface-700/50";
  let statusText = "";

  if (isCompleted) {
    bgClass = "bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30";
    statusText = "완료";
  } else if (isOverdue) {
    bgClass = "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30 font-semibold animate-pulse";
    statusText = "지연됨";
  } else if (isDueToday) {
    bgClass = "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30 font-semibold";
    statusText = "오늘";
  } else if (isDueTomorrow) {
    bgClass = "bg-amber-50/60 dark:bg-amber-950/10 text-amber-600/90 dark:text-amber-400/90 border-amber-100/50 dark:border-amber-900/20";
    statusText = "내일";
  }

  return {
    label: displayLabel,
    bgClass,
    statusText
  };
};

interface TodoTaskCardProps {
  task: TodoTask;
  index: number;
  columnId: string;
  onToggleComplete: (taskId: string, e: React.MouseEvent) => void;
  onOpenModal: (task: TodoTask) => void;
  onDeleteTask: (taskId: string, colId: string, e?: React.MouseEvent) => void;
}



export default React.memo(function TodoCard({
  task,
  index,
  columnId,
  onToggleComplete,
  onOpenModal,
  onDeleteTask,
}: TodoTaskCardProps) {
  return (
    <Draggable key={task.id} draggableId={task.id} index={index}>
      {(provided: DraggableProvided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onOpenModal(task)}
          className={`group/task relative ${TASK_BG_COLORS[task.color || "default"]} p-4 rounded-xl shadow-sm mb-3 border border-gray-200/80 dark:border-white/10
            ${snapshot.isDragging ? "shadow-2xl ring-2 ring-indigo-500/50 rotate-3 z-50 cursor-grabbing scale-105" : "hover:border-indigo-400/80 dark:hover:border-indigo-500/60 hover:shadow-md hover:-translate-y-0.5 cursor-pointer dark:hover:brightness-110"}
            transition-all duration-200
          `}
        >
          <div className="flex items-start gap-2 relative">
            <div className="mt-[5px] shrink-0 text-gray-400 dark:text-gray-500 opacity-30 group-hover/task:opacity-100 transition-opacity cursor-grab">
              <GripVertical size={14} />
            </div>

            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-start gap-2.5">
                <button 
                  onClick={(e) => onToggleComplete(task.id, e)}
                  className="mt-[3px] text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors shrink-0"
                >
                  {task.completed ? <CheckCircle2 size={16} className="text-emerald-500 animate-in zoom-in duration-200" /> : <Circle size={16} />}
                </button>
                <div className={`text-[15px] font-medium break-words leading-tight flex items-center gap-1.5 ${task.completed ? "text-gray-400 dark:text-gray-500 line-through" : "text-gray-800 dark:text-gray-100"}`}>
                  {task.icon && <FolderIcon iconName={task.icon} size={14} className="shrink-0" />}
                  <span>{task.content}</span>
                </div>
              </div>

              {(task.description || (task.checklist && task.checklist.length > 0) || (task.progress !== undefined && task.progress > 0) || (task.tags && task.tags.length > 0) || task.dueDate) && (
                <div className="mt-3 flex flex-col gap-2.5">
                  {(task.description || (task.checklist && task.checklist.length > 0) || task.dueDate) && (
                    <div className="flex flex-wrap items-center gap-2">
                      {task.dueDate && (() => {
                        const badge = getDueBadgeInfo(task);
                        if (!badge) return null;
                        return (
                          <div className={`flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-lg border ${badge.bgClass}`}>
                            <Calendar size={12} />
                            <span>{badge.label}</span>
                            {badge.statusText && (
                              <span className="text-[9px] font-bold uppercase tracking-wider bg-black/5 dark:bg-white/10 px-1 rounded">
                                {badge.statusText}
                              </span>
                            )}
                          </div>
                        );
                      })()}

                      {task.description && (
                        <div className="flex items-center text-gray-400 dark:text-gray-500 py-0.5" title="Has description">
                          <AlignLeft size={14} />
                        </div>
                      )}
                      
                      {task.checklist && task.checklist.length > 0 && (
                        <div className={`flex items-center gap-1.5 text-[11px] font-bold ${task.checklist.every(c => c.completed) ? "bg-emerald-100/50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-lg border border-emerald-250/20 dark:border-emerald-800/20" : "bg-gray-100 dark:bg-surface-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-lg border border-gray-200/50 dark:border-surface-700/50"}`}>
                          <CheckSquare size={12} />
                          <span>{task.checklist.filter(c => c.completed).length}/{task.checklist.length}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {task.progress !== undefined && task.progress > 0 && (
                    <div className="mt-0.5">
                      <div className="flex justify-between items-center mb-1 text-[9px] font-bold tracking-wider text-gray-400 dark:text-gray-500">
                        <span>PROGRESS</span>
                        <span className="text-indigo-600 dark:text-indigo-400">{task.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200/50 dark:bg-surface-800 rounded-full h-1.5 overflow-hidden border border-gray-200/20 dark:border-white/5">
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${task.progress}%` }} />
                      </div>
                    </div>
                  )}

                  {task.tags && task.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {task.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider rounded-md border border-indigo-100/30 dark:border-indigo-900/30">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="absolute top-2.5 right-2.5 opacity-0 group-hover/task:opacity-100 transition-opacity flex gap-1">
            <button
              onClick={(e) => onDeleteTask(task.id, columnId, e)}
              className="p-1.5 bg-white/90 dark:bg-[#3A3A3C]/90 backdrop-blur-sm shadow-sm border border-gray-200 dark:border-white/10 rounded-lg text-gray-400 hover:text-red-500 hover:border-red-200 dark:hover:border-red-900/50 transition-colors"
              title="삭제"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      )}
    </Draggable>
  );
});
