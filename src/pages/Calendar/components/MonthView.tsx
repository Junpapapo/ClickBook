import React from "react";
import { FolderIcon } from "@/components/DynamicIcon";
import { StickyNote } from "lucide-react";
import type { TodoTask, Bookmark, BookmarkMemo } from "@/shared/types";
import {
  TASK_BG_COLORS,
  TASK_CELL_BG_COLORS,
  TASK_TEXT_COLORS,
  MEMO_COLORS,
  formatDateStr
} from "../calendar-utils";

interface MonthViewProps {
  gridCells: any[];
  tasksByDate: Record<string, TodoTask[]>;
  memosByDate: Record<string, { bookmark: Bookmark | null; memo: BookmarkMemo }[]>;
  selectedDate: Date | null;
  setSelectedDate: (date: Date) => void;
  holidayMap: Record<string, string>;
  manualHolidays: Record<string, TodoTask>;
  onTaskDrop: (e: React.DragEvent, targetDate: Date) => void;
  onOpenTaskEditor: (task: TodoTask) => void;
  onOpenMemoEditor: (item: { bookmark: Bookmark | null; memo: BookmarkMemo }) => void;
}

export default function MonthView({
  gridCells,
  tasksByDate,
  memosByDate,
  selectedDate,
  setSelectedDate,
  holidayMap,
  manualHolidays,
  onTaskDrop,
  onOpenTaskEditor,
  onOpenMemoEditor,
}: MonthViewProps) {
  return (
    <>
      {/* Weekday Titles */}
      <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-bold text-gray-400 dark:text-gray-500 select-none pb-2 border-b border-gray-100 dark:border-surface-800">
        <div>MON</div>
        <div>TUE</div>
        <div>WED</div>
        <div>THU</div>
        <div>FRI</div>
        <div className="text-blue-500">SAT</div>
        <div className="text-red-500">SUN</div>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1.5 flex-1 min-h-[480px]">
        {gridCells.map((cell) => {
          const dStr = formatDateStr(cell.date);
          const dayTasks = tasksByDate[dStr] || [];
          const dayMemos = memosByDate[dStr] || [];
          const isSelected = selectedDate && formatDateStr(selectedDate) === dStr;
          
          const holidayName = holidayMap[dStr];
          const manualHoliday = manualHolidays[dStr];
          const displayHolidayName = holidayName || (manualHoliday ? manualHoliday.content : undefined);
          const isTodayCell = formatDateStr(new Date()) === dStr;

          let cellBgClass = "";
          if (cell.isCurrentMonth) {
            if (manualHoliday) {
              cellBgClass = TASK_CELL_BG_COLORS[manualHoliday.color || "rose"] || TASK_CELL_BG_COLORS.default;
            } else if (holidayName) {
              cellBgClass = "bg-rose-50/25 dark:bg-rose-950/10 border-rose-150/50 dark:border-rose-900/30";
            } else {
              cellBgClass = "bg-white/40 dark:bg-surface-900/30 border-gray-200/60 dark:border-surface-800/80";
            }
          } else {
            if (manualHoliday) {
              cellBgClass = `${TASK_CELL_BG_COLORS[manualHoliday.color || "rose"] || TASK_CELL_BG_COLORS.default} opacity-45`;
            } else if (holidayName) {
              cellBgClass = "bg-rose-50/10 dark:bg-rose-950/5 border-rose-100/30 dark:border-rose-900/20 opacity-45";
            } else {
              cellBgClass = "bg-gray-100/20 dark:bg-surface-950/10 border-gray-100/50 dark:border-surface-900/20 opacity-45";
            }
          }

          return (
            <div
              key={cell.key}
              onClick={() => setSelectedDate(cell.date)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onTaskDrop(e, cell.date)}
              className={`min-h-[85px] p-2 flex flex-col justify-between rounded-2xl border transition-all duration-150 relative cursor-pointer group/cell
                ${cellBgClass}
                ${isTodayCell ? "ring-2 ring-indigo-500/60 bg-indigo-5/10 dark:bg-indigo-950/10" : ""}
                ${isSelected 
                  ? "border-indigo-500 dark:border-indigo-500/80 shadow-inner bg-indigo-50/5 dark:bg-indigo-950/5 ring-1 ring-indigo-500/20" 
                  : (manualHoliday 
                      ? "hover:border-indigo-400/50 hover:opacity-100" 
                      : (holidayName 
                          ? "hover:border-rose-400/50 hover:bg-rose-50/30 dark:hover:bg-rose-950/15" 
                          : "hover:border-indigo-400/50 hover:bg-white dark:hover:bg-surface-800/40")
                    )
                }
              `}
            >
              {/* Date number */}
              <div className="flex items-center justify-between select-none">
                <div className="flex items-center gap-1 min-w-0">
                  <span className={`text-xs font-bold ${
                    cell.date.getDay() === 0 || holidayName 
                      ? "text-red-500" 
                      : (manualHoliday 
                          ? TASK_TEXT_COLORS[manualHoliday.color || "rose"] || "text-indigo-600 dark:text-indigo-400"
                          : (cell.date.getDay() === 6 ? "text-blue-500" : "text-gray-700 dark:text-gray-300"))
                  } ${isTodayCell ? "text-white bg-indigo-500 rounded-full h-5 w-5 flex items-center justify-center font-black" : ""}`}>
                    {cell.date.getDate()}
                  </span>
                  {displayHolidayName && (
                    <span className={`text-[9px] font-medium truncate max-w-[50px] ${manualHoliday ? TASK_TEXT_COLORS[manualHoliday.color || "rose"] : "text-red-500 dark:text-red-400"}`} title={displayHolidayName}>
                      {displayHolidayName}
                    </span>
                  )}
                </div>
                
                {/* Indicators dot */}
                {(dayTasks.length > 0 || dayMemos.length > 0) && (
                  <div className="flex gap-1">
                    {dayTasks.length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                    {dayMemos.length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                  </div>
                )}
              </div>

              {/* Preview Cards */}
              <div className="flex flex-col gap-1 mt-1.5 overflow-hidden flex-1 max-h-[70px]">
                {dayTasks.slice(0, 2).map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", task.id);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenTaskEditor(task);
                    }}
                    className={`text-[9px] cursor-grab active:cursor-grabbing font-bold px-1.5 py-0.5 rounded border truncate shadow-sm transition-all hover:scale-102 flex items-center gap-1
                      ${task.completed 
                        ? "bg-gray-100 dark:bg-surface-800 text-gray-400 dark:text-gray-500 border-gray-200/50 line-through font-normal" 
                        : TASK_BG_COLORS[task.color || "default"]
                      }
                    `}
                    title={task.content}
                  >
                    {task.icon && <FolderIcon iconName={task.icon} size={10} className="shrink-0" />}
                    <span className="truncate">{task.content}</span>
                  </div>
                ))}

                {dayMemos.slice(0, Math.max(0, 2 - dayTasks.slice(0, 2).length)).map((item) => (
                  <div
                    key={item.memo.bookmarkId}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenMemoEditor(item);
                    }}
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded border truncate shadow-sm transition-all hover:scale-102 flex items-center gap-0.5
                      ${MEMO_COLORS[item.memo.color || "yellow"]}
                    `}
                    title={`[메모] ${item.bookmark ? item.bookmark.title : "일반 메모"}`}
                  >
                    <StickyNote size={8} className="shrink-0" />
                    <span className="truncate">{item.bookmark ? item.bookmark.title : "일반 메모"}</span>
                  </div>
                ))}

                {(dayTasks.length + dayMemos.length) > 2 && (
                  <div className="text-[8px] font-bold text-gray-400 text-right pr-1 select-none">
                    +{dayTasks.length + dayMemos.length - 2}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
