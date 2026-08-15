import React from "react";
import { FolderIcon } from "@/components/DynamicIcon";
import { StickyNote } from "lucide-react";
import type { TodoTask, Bookmark, BookmarkMemo } from "@/shared/types";
import { useLang } from "@/shared/LanguageContext";
import {
  TASK_BG_COLORS,
  TASK_CELL_BG_COLORS,
  TASK_TEXT_COLORS,
  MEMO_COLORS,
  formatDateStr,
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
  const { t } = useLang();
  return (
    <>
      {/* Weekday Titles */}
      <div className="grid grid-cols-7 gap-1 mb-1.5 text-center text-[11px] font-semibold text-slate-400 dark:text-slate-500 select-none pb-2 border-b border-slate-100 dark:border-slate-800">
        <div>MON</div>
        <div>TUE</div>
        <div>WED</div>
        <div>THU</div>
        <div>FRI</div>
        <div className="text-blue-500">SAT</div>
        <div className="text-rose-500">SUN</div>
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
              cellBgClass = "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-900/40";
            } else {
              cellBgClass = "bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800/80";
            }
          } else {
            if (manualHoliday) {
              cellBgClass = `${TASK_CELL_BG_COLORS[manualHoliday.color || "rose"] || TASK_CELL_BG_COLORS.default} opacity-40`;
            } else if (holidayName) {
              cellBgClass = "bg-rose-50/15 dark:bg-rose-950/10 border-rose-100/30 dark:border-rose-900/20 opacity-40";
            } else {
              cellBgClass = "bg-slate-100/30 dark:bg-slate-900/30 border-slate-200/40 dark:border-slate-800/40 opacity-40";
            }
          }

          return (
            <div
              key={cell.key}
              onClick={() => setSelectedDate(cell.date)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onTaskDrop(e, cell.date)}
              className={`min-h-[85px] p-2 flex flex-col justify-between rounded-lg border transition-all duration-150 relative cursor-pointer group/cell
                ${cellBgClass}
                ${isTodayCell ? "ring-2 ring-indigo-500/60 bg-indigo-50/20 dark:bg-indigo-950/20" : ""}
                ${
                  isSelected
                    ? "border-indigo-500 dark:border-indigo-500 ring-1 ring-indigo-500/30 bg-indigo-50/30 dark:bg-indigo-950/25"
                    : manualHoliday
                    ? "hover:border-indigo-400/60 hover:opacity-100"
                    : holidayName
                    ? "hover:border-rose-400/60 hover:bg-rose-50/60 dark:hover:bg-rose-950/30"
                    : "hover:border-indigo-400/60 hover:bg-white dark:hover:bg-slate-800/80"
                }
              `}
            >
              {/* Date number */}
              <div className="flex items-center justify-between select-none">
                <div className="flex items-center gap-1 min-w-0">
                  <span
                    className={`text-xs font-semibold ${
                      cell.date.getDay() === 0 || holidayName
                        ? "text-rose-500"
                        : manualHoliday
                        ? TASK_TEXT_COLORS[manualHoliday.color || "rose"] || "text-indigo-600 dark:text-indigo-400"
                        : cell.date.getDay() === 6
                        ? "text-blue-500"
                        : "text-slate-700 dark:text-slate-300"
                    } ${
                      isTodayCell
                        ? "text-white dark:text-white bg-indigo-600 dark:bg-indigo-500 rounded-full h-5 w-5 flex items-center justify-center font-bold text-[11px] shadow-2xs"
                        : ""
                    }`}
                  >
                    {cell.date.getDate()}
                  </span>
                  {displayHolidayName && (
                    <span
                      className={`text-[9.5px] font-medium truncate max-w-[55px] ${
                        manualHoliday ? TASK_TEXT_COLORS[manualHoliday.color || "rose"] : "text-rose-600 dark:text-rose-400"
                      }`}
                      title={displayHolidayName}
                    >
                      {displayHolidayName}
                    </span>
                  )}
                </div>

                {/* Indicators dot */}
                {(dayTasks.length > 0 || dayMemos.length > 0) && (
                  <div className="flex gap-1 items-center">
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
                    className={`text-[9.5px] cursor-grab active:cursor-grabbing font-medium px-1.5 py-0.5 rounded border truncate shadow-2xs transition-all hover:scale-101 flex items-center gap-1
                      ${
                        task.completed
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200/50 line-through font-normal"
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
                    className={`text-[9.5px] font-medium px-1.5 py-0.5 rounded border truncate shadow-2xs transition-all hover:scale-101 flex items-center gap-0.5
                      ${MEMO_COLORS[item.memo.color || "yellow"]}
                    `}
                    title={`[${t("generalMemo")}] ${item.bookmark ? item.bookmark.title : t("generalMemo")}`}
                  >
                    <StickyNote size={9} className="shrink-0" />
                    <span className="truncate">{item.bookmark ? item.bookmark.title : t("generalMemo")}</span>
                  </div>
                ))}

                {dayTasks.length + dayMemos.length > 2 && (
                  <div className="text-[8.5px] font-semibold text-slate-400 dark:text-slate-500 text-right pr-1 select-none">
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
