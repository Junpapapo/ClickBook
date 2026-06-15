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

interface WeekViewProps {
  tasksByDate: Record<string, TodoTask[]>;
  memosByDate: Record<string, { bookmark: Bookmark | null; memo: BookmarkMemo }[]>;
  selectedDate: Date | null;
  setSelectedDate: (date: Date) => void;
  holidayMap: Record<string, string>;
  manualHolidays: Record<string, TodoTask>;
  getSelectedWeekDays: () => Date[];
  onTaskDrop: (e: React.DragEvent, targetDate: Date) => void;
  onOpenTaskEditor: (task: TodoTask) => void;
  onOpenMemoEditor: (item: { bookmark: Bookmark | null; memo: BookmarkMemo }) => void;
}

export default function WeekView({
  tasksByDate,
  memosByDate,
  selectedDate,
  setSelectedDate,
  holidayMap,
  manualHolidays,
  getSelectedWeekDays,
  onTaskDrop,
  onOpenTaskEditor,
  onOpenMemoEditor,
}: WeekViewProps) {
  const weekDays = getSelectedWeekDays();
  return (
    <div className="grid grid-cols-7 gap-2.5 h-full min-h-[480px] select-none">
      {weekDays.map((day) => {
        const dStr = formatDateStr(day);
        const dayTasks = tasksByDate[dStr] || [];
        const dayMemos = memosByDate[dStr] || [];
        const holidayName = holidayMap[dStr];
        const manualHoliday = manualHolidays[dStr];
        const displayHolidayName = holidayName || (manualHoliday ? manualHoliday.content : undefined);
        const isTodayCell = formatDateStr(new Date()) === dStr;
        const isSelected = selectedDate && formatDateStr(selectedDate) === dStr;
        const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
        const dayName = dayNames[day.getDay()];

        let cellBgClass = "";
        if (isTodayCell) {
          cellBgClass = "ring-2 ring-indigo-500/60 bg-indigo-5/10 dark:bg-indigo-950/10";
        } else if (manualHoliday) {
          cellBgClass = TASK_CELL_BG_COLORS[manualHoliday.color || "rose"] || TASK_CELL_BG_COLORS.default;
        } else if (holidayName) {
          cellBgClass = "bg-rose-50/30 dark:bg-rose-950/15";
        } else {
          cellBgClass = "bg-white/40 dark:bg-surface-900/30";
        }

        let borderClass = "";
        if (isSelected) {
          borderClass = "border-indigo-500 dark:border-indigo-500/80 shadow-sm";
        } else if (manualHoliday) {
          borderClass = "border-indigo-200/60 dark:border-indigo-900/40 hover:border-indigo-400/50";
        } else if (holidayName) {
          borderClass = "border-rose-200/60 dark:border-rose-900/40 hover:border-rose-400/50";
        } else {
          borderClass = "border-gray-200/60 dark:border-surface-800/80 hover:border-indigo-400/50";
        }

        return (
          <div
            key={dStr}
            onClick={() => setSelectedDate(day)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onTaskDrop(e, day)}
            className={`flex flex-col gap-2 p-2 rounded-xl border transition-all h-full min-h-[450px]
              ${cellBgClass}
              ${borderClass}
            `}
          >
            {/* Day Header */}
            <div className="pb-1.5 border-b border-gray-150 dark:border-surface-850 flex flex-col items-center">
              <span className={`text-[9px] font-black tracking-wider ${
                day.getDay() === 0 ? "text-red-500" : day.getDay() === 6 ? "text-blue-500" : "text-gray-400 dark:text-gray-500"
              }`}>
                {dayName}
              </span>
              <span className={`text-xs font-bold mt-0.5 ${
                day.getDay() === 0 || holidayName 
                  ? "text-red-500" 
                  : (manualHoliday 
                      ? TASK_TEXT_COLORS[manualHoliday.color || "rose"] || "text-indigo-600 dark:text-indigo-400"
                      : (day.getDay() === 6 ? "text-blue-500" : "text-gray-700 dark:text-gray-300"))
              }`}>
                {day.getDate()}
              </span>
              {displayHolidayName && (
                <span className={`text-[8px] font-bold mt-0.5 truncate max-w-full ${manualHoliday ? TASK_TEXT_COLORS[manualHoliday.color || "rose"] : "text-red-500 dark:text-red-400"}`} title={displayHolidayName}>
                  {displayHolidayName}
                </span>
              )}
            </div>

            {/* Day Items List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 max-h-[380px] xl:max-h-none scrollbar-thin pr-0.5">
              {dayTasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", task.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenTaskEditor(task);
                  }}
                  className={`text-[9px] cursor-grab active:cursor-grabbing font-bold p-1.5 rounded-lg border shadow-sm transition-all hover:scale-102 flex flex-col gap-0.5
                    ${task.completed 
                      ? "bg-gray-100 dark:bg-surface-800 text-gray-400 dark:text-gray-500 border-gray-200/50 line-through font-normal" 
                      : TASK_BG_COLORS[task.color || "default"]
                    }
                  `}
                >
                  <span className="truncate flex items-center gap-1" title={task.content}>
                    {task.icon && <FolderIcon iconName={task.icon} size={10} className="shrink-0" />}
                    <span className="truncate">{task.content}</span>
                  </span>
                  {task.dueTime && <span className="text-[7px] font-medium opacity-75">{task.dueTime}</span>}
                </div>
              ))}

              {dayMemos.map((item) => (
                <div
                  key={item.memo.bookmarkId}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenMemoEditor(item);
                  }}
                  className={`text-[9px] font-bold p-1.5 rounded-lg border shadow-sm transition-all hover:scale-102 flex flex-col gap-0.5
                    ${MEMO_COLORS[item.memo.color || "yellow"]}
                  `}
                >
                  <div className="flex items-center gap-1">
                    <StickyNote size={8} className="shrink-0" />
                    <span className="truncate" title={item.bookmark ? item.bookmark.title : "일반 메모"}>
                      {item.bookmark ? item.bookmark.title : "일반 메모"}
                    </span>
                  </div>
                </div>
              ))}

              {dayTasks.length === 0 && dayMemos.length === 0 && (
                <div className="text-[8px] text-gray-400 dark:text-gray-600 text-center py-6 italic select-none">
                  No events
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
