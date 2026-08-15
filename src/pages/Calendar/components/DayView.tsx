import React from "react";
import { FolderIcon } from "@/components/DynamicIcon";
import { StickyNote } from "lucide-react";
import type { TodoTask, Bookmark, BookmarkMemo } from "@/shared/types";
import { useLang } from "@/shared/LanguageContext";
import {
  TASK_BG_COLORS,
  MEMO_COLORS,
  formatDateStr,
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
  const { t } = useLang();
  if (!selectedDate) return null;
  const dStr = formatDateStr(selectedDate);
  const dayTasks = tasksByDate[dStr] || [];
  const dayMemos = memosByDate[dStr] || [];

  // All Day: Tasks with no dueTime + Memos
  const allDayTasks = dayTasks.filter((t) => !t.dueTime);

  // Hourly Tasks mapping (00:00 to 23:00)
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0") + ":00");

  return (
    <div className="flex flex-col gap-3.5 h-full min-h-[480px] select-none text-xs">
      {/* All Day Banner Row */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => onTaskHourDrop(e, "")} // Drop to clear dueTime
        className="p-3 bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-lg flex flex-col gap-1.5"
      >
        <div className="font-semibold text-[9.5px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          All Day / Memos
        </div>
        <div className="flex flex-wrap gap-1.5">
          {allDayTasks.map((task) => {
            const isEvent = task.type === "event";
            return (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", task.id)}
                onClick={() => onOpenTaskEditor(task)}
                className={`text-[9.5px] cursor-grab active:cursor-grabbing font-medium px-2 py-1 rounded-md border shadow-2xs transition-all hover:scale-101 flex items-center gap-1
                  ${
                    !isEvent && task.completed
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200/50 line-through font-normal"
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
              onClick={() => onOpenMemoEditor(item)}
              className={`text-[9.5px] font-medium px-2 py-1 rounded-md border shadow-2xs transition-all hover:scale-101 flex items-center gap-1
                ${MEMO_COLORS[item.memo.color || "yellow"]}
              `}
            >
              <StickyNote size={9} className="shrink-0" />
              <span className="truncate max-w-[120px]">{item.bookmark ? item.bookmark.title : t("generalMemo")}</span>
            </div>
          ))}
          {allDayTasks.length === 0 && dayMemos.length === 0 && (
            <span className="text-[9px] text-slate-400 dark:text-slate-500 italic">{t("noSchedulesToday")}</span>
          )}
        </div>
      </div>

      {/* Hourly Agenda */}
      <div className="flex-1 overflow-y-auto max-h-[360px] xl:max-h-none divide-y divide-slate-100 dark:divide-slate-800/60 border border-slate-200/80 dark:border-slate-800 rounded-lg bg-white/50 dark:bg-slate-900/30 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
        {hours.map((hour) => {
          const hourPrefix = hour.split(":")[0];
          const hourlyTasks = dayTasks.filter((t) => t.dueTime && t.dueTime.startsWith(hourPrefix));

          return (
            <div
              key={hour}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onTaskHourDrop(e, hour)}
              className="flex items-start p-2 min-h-[44px] hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
            >
              <div className="w-12 text-[10px] font-semibold text-slate-400 dark:text-slate-500 tabular-nums self-center">
                {hour}
              </div>
              <div className="flex-1 flex flex-wrap gap-1.5">
                {hourlyTasks.map((task) => {
                  const isEvent = task.type === "event";
                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", task.id)}
                      onClick={() => onOpenTaskEditor(task)}
                      className={`text-[9.5px] cursor-grab active:cursor-grabbing font-medium px-2 py-1 rounded-md border shadow-2xs transition-all hover:scale-101 flex items-center gap-1.5
                        ${
                          !isEvent && task.completed
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200/50 line-through font-normal"
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
