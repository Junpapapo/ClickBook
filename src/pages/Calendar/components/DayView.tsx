import React from "react";
import { FolderIcon } from "@/components/DynamicIcon";
import { StickyNote } from "lucide-react";
import type { TodoTask, Bookmark, BookmarkMemo } from "@/shared/types";
import {
  TASK_BG_COLORS,
  MEMO_COLORS,
  formatDateStr
} from "../calendar-utils";

interface DayViewProps {
  selectedDate: Date | null;
  tasksByDate: Record<string, TodoTask[]>;
  memosByDate: Record<string, { bookmark: Bookmark | null; memo: BookmarkMemo }[]>;
  onTaskHourDrop: (e: React.DragEvent, hourStr: string) => void;
  onOpenTaskEditor: (task: TodoTask) => void;
  onOpenMemoEditor: (item: { bookmark: Bookmark | null; memo: BookmarkMemo }) => void;
}

export default function DayView({
  selectedDate,
  tasksByDate,
  memosByDate,
  onTaskHourDrop,
  onOpenTaskEditor,
  onOpenMemoEditor,
}: DayViewProps) {
  if (!selectedDate) return null;
  const dStr = formatDateStr(selectedDate);
  const dayTasks = tasksByDate[dStr] || [];
  const dayMemos = memosByDate[dStr] || [];

  // All Day: Tasks with no dueTime + Memos
  const allDayTasks = dayTasks.filter((t) => !t.dueTime);
  
  // Hourly Tasks mapping (00:00 to 23:00)
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0") + ":00");

  return (
    <div className="flex flex-col gap-4.5 h-full min-h-[480px] select-none text-xs">
      {/* All Day Banner Row */}
      <div 
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => onTaskHourDrop(e, "")} // Drop to clear dueTime
        className="p-3.5 bg-gray-50/50 dark:bg-surface-800/40 border border-gray-200/50 dark:border-surface-850 rounded-2xl flex flex-col gap-2"
      >
        <div className="font-bold text-[9px] text-gray-400 uppercase tracking-wider">All Day / Memos</div>
        <div className="flex flex-wrap gap-2">
          {allDayTasks.map((task) => {
            const isEvent = task.type === "event";
            return (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", task.id)}
                onClick={(e) => onOpenTaskEditor(task)}
                className={`text-[9px] cursor-grab active:cursor-grabbing font-bold px-2.5 py-1.5 rounded-lg border shadow-sm transition-all hover:scale-102 flex items-center gap-1
                  ${(!isEvent && task.completed)
                    ? "bg-gray-100 dark:bg-surface-800 text-gray-400 dark:text-gray-500 border-gray-200/50 line-through font-normal" 
                    : TASK_BG_COLORS[task.color || "default"]
                  }
                `}
              >
                {task.icon && <FolderIcon iconName={task.icon} size={10} className="shrink-0" />}
                <span className="truncate">{task.content}</span>
              </div>
            );
          })}
          {dayMemos.map((item) => (
            <div
              key={item.memo.bookmarkId}
              onClick={(e) => onOpenMemoEditor(item)}
              className={`text-[9px] font-bold px-2.5 py-1.5 rounded-lg border shadow-sm transition-all hover:scale-102 flex items-center gap-1
                ${MEMO_COLORS[item.memo.color || "yellow"]}
              `}
            >
              <StickyNote size={9} className="shrink-0" />
              <span className="truncate max-w-[120px]">{item.bookmark ? item.bookmark.title : "일반 메모"}</span>
            </div>
          ))}
          {allDayTasks.length === 0 && dayMemos.length === 0 && (
            <span className="text-[9px] text-gray-400 dark:text-gray-500 italic">일정이 없습니다.</span>
          )}
        </div>
      </div>

      {/* Hourly Agenda */}
      <div className="flex-1 overflow-y-auto max-h-[360px] xl:max-h-none divide-y divide-gray-100 dark:divide-surface-800/60 border border-gray-200/50 dark:border-surface-800/60 rounded-2xl bg-white/30 dark:bg-surface-900/10 scrollbar-thin">
        {hours.map((hour) => {
          const hourPrefix = hour.split(":")[0];
          const hourlyTasks = dayTasks.filter((t) => t.dueTime && t.dueTime.startsWith(hourPrefix));

          return (
            <div
              key={hour}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onTaskHourDrop(e, hour)}
              className="flex items-start p-2.5 min-h-[48px] hover:bg-gray-50/30 dark:hover:bg-surface-800/20 transition-colors"
            >
              <div className="w-12 text-[10px] font-bold text-gray-400 tabular-nums self-center">{hour}</div>
              <div className="flex-1 flex flex-wrap gap-1.5">
                {hourlyTasks.map((task) => {
                  const isEvent = task.type === "event";
                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", task.id)}
                      onClick={(e) => onOpenTaskEditor(task)}
                      className={`text-[9px] cursor-grab active:cursor-grabbing font-bold px-2 py-1 rounded-lg border shadow-sm transition-all hover:scale-102 flex items-center gap-1.5
                        ${(!isEvent && task.completed) 
                          ? "bg-gray-100 dark:bg-surface-800 text-gray-400 dark:text-gray-500 border-gray-200/50 line-through font-normal" 
                          : TASK_BG_COLORS[task.color || "default"]
                        }
                      `}
                    >
                      {task.icon && <FolderIcon iconName={task.icon} size={10} className="shrink-0" />}
                      <span className="truncate max-w-[150px]">{task.content}</span>
                      <span className="text-[8px] font-normal opacity-75">{task.dueTime}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
