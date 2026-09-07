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
  CalendarThemeMeta,
  getCalendarThemeConfig,
} from "../calendar-utils";

interface WeekViewProps {
  tasksByDate: Record<string, TodoTask[]>;
  memosByDate: Record<string, { bookmark: Bookmark | null; memo: BookmarkMemo }[]>;
  selectedDate: Date | null;
  setSelectedDate: (date: Date) => void;
  holidayMap: Record<string, string>;
  manualHolidays: Record<string, TodoTask>;
  getSelectedWeekDays: () => Date[];
  themeConfig?: CalendarThemeMeta;
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
  themeConfig,
  onTaskDrop,
  onOpenTaskEditor,
  onOpenMemoEditor,
}: WeekViewProps) {
  const { t } = useLang();
  const cfg = themeConfig || getCalendarThemeConfig();
  const weekDays = getSelectedWeekDays();

  return (
    <div className="grid grid-cols-7 gap-2 h-full min-h-[480px] select-none">
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
          cellBgClass = cfg.cellTodayRing;
        } else if (manualHoliday) {
          cellBgClass = TASK_CELL_BG_COLORS[manualHoliday.color || "rose"] || TASK_CELL_BG_COLORS.default;
        } else if (holidayName) {
          cellBgClass = "bg-rose-50/40 dark:bg-rose-950/20";
        } else {
          cellBgClass = cfg.cellBgCurrent;
        }

        let borderClass = "";
        if (isSelected) {
          borderClass = cfg.cellSelected;
        } else if (manualHoliday) {
          borderClass = "border-indigo-200/70 dark:border-indigo-900/40 hover:border-indigo-400/60";
        } else if (holidayName) {
          borderClass = "border-rose-200/70 dark:border-rose-900/40 hover:border-rose-400/60";
        } else {
          borderClass = `${cfg.cellBorder} ${cfg.cellHover}`;
        }

        return (
          <div
            key={dStr}
            onClick={() => setSelectedDate(day)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onTaskDrop(e, day)}
            className={`flex flex-col gap-2 p-2 rounded-lg border transition-all h-full min-h-[450px]
              ${cellBgClass}
              ${borderClass}
            `}
          >
            {/* Day Header */}
            <div className={`pb-1.5 border-b ${cfg.weekdayBorder} flex flex-col items-center`}>
              <span
                className={`text-[9.5px] font-bold tracking-wider ${
                  day.getDay() === 0 ? cfg.sunHeader : day.getDay() === 6 ? cfg.satHeader : cfg.weekdayText
                }`}
              >
                {dayName}
              </span>
              <span
                className={`text-xs font-semibold mt-0.5 ${
                  day.getDay() === 0 || holidayName
                    ? cfg.sunHeader
                    : manualHoliday
                    ? TASK_TEXT_COLORS[manualHoliday.color || "rose"] || "text-indigo-600 dark:text-indigo-400"
                    : day.getDay() === 6
                    ? cfg.satHeader
                    : "text-slate-700 dark:text-slate-300"
                } ${
                  isTodayCell
                    ? `${cfg.todayBadge} rounded-full h-5 w-5 flex items-center justify-center font-bold text-[11px] shadow-2xs`
                    : ""
                }`}
              >
                {day.getDate()}
              </span>
              {displayHolidayName && (
                <span
                  className={`text-[8.5px] font-medium mt-0.5 truncate max-w-full ${
                    manualHoliday ? TASK_TEXT_COLORS[manualHoliday.color || "rose"] : "text-rose-600 dark:text-rose-400"
                  }`}
                  title={displayHolidayName}
                >
                  {displayHolidayName}
                </span>
              )}
            </div>

            {/* Day Items List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 max-h-[380px] xl:max-h-none scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 pr-0.5">
              {dayTasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", task.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenTaskEditor(task);
                  }}
                  className={`text-[9.5px] cursor-grab active:cursor-grabbing font-medium p-1.5 rounded-md border shadow-2xs transition-all hover:scale-101 flex flex-col gap-0.5
                    ${
                      task.completed
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200/50 line-through font-normal"
                        : TASK_BG_COLORS[task.color || "default"]
                    }
                  `}
                >
                  <span className="truncate flex items-center gap-1" title={task.content}>
                    {task.icon && <FolderIcon iconName={task.icon} size={10} className="shrink-0" />}
                    <span className="truncate">{task.content}</span>
                  </span>
                  {task.dueTime && <span className="text-[7.5px] font-normal opacity-75">{task.dueTime}</span>}
                </div>
              ))}

              {dayMemos.map((item) => (
                <div
                  key={item.memo.bookmarkId}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenMemoEditor(item);
                  }}
                  className={`text-[9.5px] font-medium p-1.5 rounded-md border shadow-2xs transition-all hover:scale-101 flex flex-col gap-0.5
                    ${MEMO_COLORS[item.memo.color || "yellow"]}
                  `}
                >
                  <div className="flex items-center gap-1">
                    <StickyNote size={9} className="shrink-0" />
                    <span className="truncate" title={item.bookmark ? item.bookmark.title : t("generalMemo")}>
                      {item.bookmark ? item.bookmark.title : t("generalMemo")}
                    </span>
                  </div>
                </div>
              ))}

              {dayTasks.length === 0 && dayMemos.length === 0 && (
                <div className="text-[8.5px] text-slate-400 dark:text-slate-600 text-center py-6 italic select-none">
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
