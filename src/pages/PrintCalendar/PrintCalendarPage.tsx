import React from "react";
import type { PrintSettings } from "./PrintSettingsPanel";
import type { TodoTask, Bookmark, BookmarkMemo } from "@/shared/types";

interface Props {
  year: number;
  month: number; // 0-indexed
  settings: PrintSettings;
  tasks: TodoTask[];
  memos: { bookmark: Bookmark | null; memo: BookmarkMemo }[];
  holidayMap: Record<string, string>;
}

// 요일 레이블 (월요일 시작)
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const THEME_STYLES = {
  mono: {
    border: "border-neutral-200",
    textTheme: "text-neutral-700",
    bgTheme: "bg-neutral-50",
    pointText: "text-neutral-900",
    accentBg: "bg-neutral-800 text-white",
    daySat: "text-neutral-500",
    daySun: "text-neutral-500",
    headerBorder: "border-neutral-300",
  },
  blue: {
    border: "border-blue-100",
    textTheme: "text-blue-900",
    bgTheme: "bg-blue-50/20",
    pointText: "text-indigo-600",
    accentBg: "bg-blue-600 text-white",
    daySat: "text-blue-500",
    daySun: "text-red-500",
    headerBorder: "border-blue-200",
  },
  pink: {
    border: "border-rose-100",
    textTheme: "text-rose-900",
    bgTheme: "bg-rose-50/20",
    pointText: "text-rose-500",
    accentBg: "bg-rose-500 text-white",
    daySat: "text-blue-500",
    daySun: "text-rose-500",
    headerBorder: "border-rose-200",
  },
  green: {
    border: "border-emerald-100",
    textTheme: "text-emerald-900",
    bgTheme: "bg-emerald-50/20",
    pointText: "text-emerald-600",
    accentBg: "bg-emerald-600 text-white",
    daySat: "text-blue-500",
    daySun: "text-red-500",
    headerBorder: "border-emerald-200",
  },
  purple: {
    border: "border-purple-100",
    textTheme: "text-purple-900",
    bgTheme: "bg-purple-50/20",
    pointText: "text-purple-600",
    accentBg: "bg-purple-600 text-white",
    daySat: "text-blue-500",
    daySun: "text-red-500",
    headerBorder: "border-purple-200",
  },
  orange: {
    border: "border-orange-100",
    textTheme: "text-orange-900",
    bgTheme: "bg-orange-50/20",
    pointText: "text-orange-600",
    accentBg: "bg-orange-600 text-white",
    daySat: "text-blue-500",
    daySun: "text-red-500",
    headerBorder: "border-orange-200",
  },
  teal: {
    border: "border-teal-100",
    textTheme: "text-teal-900",
    bgTheme: "bg-teal-50/20",
    pointText: "text-teal-600",
    accentBg: "bg-teal-600 text-white",
    daySat: "text-blue-500",
    daySun: "text-red-500",
    headerBorder: "border-teal-200",
  },
  slate: {
    border: "border-slate-200",
    textTheme: "text-slate-800",
    bgTheme: "bg-slate-50",
    pointText: "text-slate-700",
    accentBg: "bg-slate-700 text-white",
    daySat: "text-blue-500",
    daySun: "text-red-500",
    headerBorder: "border-slate-300",
  },
};

const FONT_FAMILIES = {
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  serif: 'Georgia, Cambria, "Times New Roman", Times, serif',
  mono: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
};

const FONT_SIZES = {
  small: "11px",
  medium: "13px",
  large: "15px",
};

// YYYY-MM-DD 날짜 포맷 헬퍼
const formatDateStr = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// 캘린더 그리드 생성 헬퍼 (월요일 시작)
const getCalendarGrid = (year: number, month: number) => {
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon...
  const mondayFirstIndex = (firstDayIndex + 6) % 7; // Convert to Monday-first: 0 = Mon, 6 = Sun

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const grid: { date: Date; isCurrentMonth: boolean }[] = [];

  // Prev month cells
  for (let i = mondayFirstIndex - 1; i >= 0; i--) {
    const prevDate = new Date(year, month - 1, daysInPrevMonth - i);
    grid.push({ date: prevDate, isCurrentMonth: false });
  }

  // Current month cells
  for (let d = 1; d <= daysInMonth; d++) {
    const currDate = new Date(year, month, d);
    grid.push({ date: currDate, isCurrentMonth: true });
  }

  // Next month cells
  const remainingCells = 42 - grid.length;
  for (let d = 1; d <= remainingCells; d++) {
    const nextDate = new Date(year, month + 1, d);
    grid.push({ date: nextDate, isCurrentMonth: false });
  }

  return grid;
};

export default function PrintCalendarPage({
  year,
  month,
  settings,
  tasks,
  memos,
  holidayMap,
}: Props) {
  const gridCells = getCalendarGrid(year, month);
  const theme = THEME_STYLES[settings.theme];
  const fontFamily = FONT_FAMILIES[settings.fontFamily];
  const fontSize = FONT_SIZES[settings.fontSize];

  // 월 레이블 표시
  const monthName = new Date(year, month, 1).toLocaleString("en-US", {
    month: "long",
  });

  return (
    <div
      className={`print-page bg-white text-black px-6 pb-6 pt-9 border shadow-sm relative flex flex-col justify-between select-none mx-auto print:shadow-none print:border-none ${theme.border} ${
        settings.template === "landscape"
          ? "w-[297mm] h-[210mm] rounded-xl" // A4 가로 비율
          : "w-[210mm] h-[297mm] rounded-xl" // A4 세로 비율
      }`}
      style={{
        pageBreakAfter: "always",
        breakAfter: "page",
        fontFamily,
        fontSize,
        paddingTop: `${settings.topPadding}px`,
      }}
    >

      {/* Header (연월 표시) */}
      <div className={`flex items-baseline justify-between mt-2 mb-4 border-b pb-3 ${theme.headerBorder}`}>
        <div>
          <span className={`text-[2.2em] font-extrabold tracking-tight mr-2 ${theme.pointText}`}>
            {monthName}
          </span>
          <span className="text-[1.2em] font-semibold text-neutral-400">{year}</span>
        </div>
        {settings.customTitle && (
          <div className={`text-[1.1em] font-bold ${theme.pointText} max-w-[50%] truncate`}>
            {settings.customTitle}
          </div>
        )}
      </div>

      {/* Grid Container */}
      <div className="flex-1 flex flex-col">
        {/* 요일 헤더 */}
        <div className={`grid grid-cols-7 text-center font-bold text-[0.85em] border-b pb-1 ${theme.border} text-neutral-500`}>
          {WEEKDAYS.map((day, i) => {
            let colorClass = "text-neutral-500";
            if (i === 5) colorClass = theme.daySat; // Sat
            if (i === 6) colorClass = theme.daySun; // Sun
            return (
              <div key={day} className={colorClass}>
                {day}
              </div>
            );
          })}
        </div>

        {/* 날짜 셀들 */}
        <div className="grid grid-cols-7 grid-rows-6 flex-1 mt-1">
          {gridCells.map(({ date, isCurrentMonth }, idx) => {
            const dateStr = formatDateStr(date);
            
            // 공휴일 정보 필터링
            const isPublicHoliday = holidayMap[dateStr];
            const isManualHoliday = tasks.some(
              (t) => (t.type === "holiday" || t.isHoliday) && (t.startDate === dateStr || t.dueDate === dateStr)
            );
            const holidayName = isPublicHoliday || (isManualHoliday ? tasks.find((t) => (t.type === "holiday" || t.isHoliday) && (t.startDate === dateStr || t.dueDate === dateStr))?.content : null);
            const isHoliday = !!holidayName;

            // 요일 색상 판단
            const dayOfWeek = date.getDay(); // 0 = Sun, 6 = Sat
            let dayColorClass = isCurrentMonth ? "text-neutral-800" : "text-neutral-300";
            if (isCurrentMonth) {
              if (dayOfWeek === 6) dayColorClass = theme.daySat; // 토요일
              if (dayOfWeek === 0 || isHoliday) dayColorClass = theme.daySun; // 일요일 또는 공휴일
            }

            // 이 날짜의 일정(Tasks) 필터링
            const dateTasks = settings.showTodos
              ? tasks.filter((t) => {
                  if (t.isHoliday || t.type === "holiday") return false; // 휴일 일정은 제외
                  
                  // 반복일정 확인
                  if (t.recurrence && t.recurrence !== "none") {
                    const anchorDate = new Date(t.startDate || t.dueDate || t.createdAt);
                    anchorDate.setHours(0, 0, 0, 0);
                    const checkDate = new Date(date);
                    checkDate.setHours(0, 0, 0, 0);
                    
                    if (checkDate < anchorDate) return false;
                    
                    if (t.recurrence === "daily") return true;
                    if (t.recurrence === "weekly") return checkDate.getDay() === anchorDate.getDay();
                    if (t.recurrence === "monthly") return checkDate.getDate() === anchorDate.getDate();
                  }

                  // 일반일정 날짜 범위 내인지 확인
                  if (t.startDate && t.dueDate) {
                    const start = new Date(t.startDate);
                    start.setHours(0,0,0,0);
                    const end = new Date(t.dueDate);
                    end.setHours(0,0,0,0);
                    const current = new Date(date);
                    current.setHours(0,0,0,0);
                    return current >= start && current <= end;
                  }
                  
                  return t.dueDate === dateStr || t.startDate === dateStr;
                })
              : [];

            // 이 날짜의 메모(Memos) 필터링
            const dateMemos = settings.showMemos
              ? memos.filter((m) => {
                  if (!m.memo.updatedAt) return false;
                  return formatDateStr(new Date(m.memo.updatedAt)) === dateStr;
                })
              : [];

            return (
              <div
                key={idx}
                className={`border-b border-r p-1.5 flex flex-col justify-between overflow-hidden relative ${theme.border} ${
                  idx % 7 === 0 ? `border-l ${theme.border}` : ""
                } ${idx < 7 ? `border-t ${theme.border}` : ""} ${
                  !isCurrentMonth ? `${theme.bgTheme} print:bg-none text-neutral-300` : ""
                }`}
                style={{ minHeight: "60px" }}
              >
                {/* 날짜 표시 */}
                <div className="flex items-center justify-between">
                  <span className={`text-[0.9em] font-bold ${dayColorClass}`}>
                    {date.getDate()}
                  </span>
                  
                  {/* 공휴일 이름 표시 */}
                  {settings.showHolidays && holidayName && isCurrentMonth && (
                    <span className="text-[0.7em] text-red-500 font-semibold truncate max-w-[70%]" title={holidayName}>
                      {holidayName}
                    </span>
                  )}
                </div>

                {/* 셀 내용 영역 (일정 & 메모 리스트) */}
                <div className="flex-1 flex flex-col justify-start space-y-1 mt-1.5 overflow-hidden">
                  {/* 일정(Todo/Event) 표시 */}
                  {dateTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className={`px-1 py-0.5 rounded text-[0.72em] font-medium truncate flex items-center gap-0.5 border ${
                        task.completed
                          ? "bg-gray-50 border-gray-200 text-gray-400 line-through decoration-gray-300"
                          : task.type === "event"
                          ? "bg-blue-50 border-blue-100 text-blue-700"
                          : "bg-indigo-50 border-indigo-100 text-indigo-700"
                      }`}
                    >
                      <span className="w-1 h-1 rounded-full shrink-0 bg-current" />
                      <span className="truncate">{task.content}</span>
                    </div>
                  ))}
                  
                  {/* 더 많은 일정이 있을 때 표시 */}
                  {dateTasks.length > 3 && (
                    <div className="text-[0.65em] text-neutral-400 font-bold px-1">
                      +{dateTasks.length - 3}
                    </div>
                  )}

                  {/* 메모 표시 */}
                  {dateMemos.slice(0, 2).map(({ memo, bookmark }) => (
                    <div
                      key={memo.bookmarkId}
                      className="px-1 py-0.5 rounded text-[0.68em] bg-amber-50 border border-amber-100 text-amber-800 truncate"
                      title={memo.content}
                    >
                      📝 {memo.content}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer (ClickBook 브랜딩) */}
      <div className={`flex items-center justify-between text-[0.75em] text-neutral-300 border-t pt-2 mt-4 ${theme.border}`}>
        <span>ClickBook Calendar</span>
        <span>Generated with ClickBook AI</span>
      </div>
    </div>
  );
}
