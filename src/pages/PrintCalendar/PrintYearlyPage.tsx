import React from "react";
import type { PrintSettings } from "./PrintSettingsPanel";
import type { TodoTask } from "@/shared/types";

interface Props {
  year: number;
  settings: PrintSettings;
  tasks: TodoTask[];
  holidayMap: Record<string, string>;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const THEME_STYLES = {
  mono: {
    border: "border-neutral-200",
    textTheme: "text-neutral-700",
    bgTheme: "bg-neutral-50",
    pointText: "text-neutral-900",
    daySat: "text-neutral-500",
    daySun: "text-neutral-500",
  },
  blue: {
    border: "border-blue-100",
    textTheme: "text-blue-900",
    bgTheme: "bg-blue-50/30",
    pointText: "text-indigo-600",
    daySat: "text-blue-500",
    daySun: "text-red-500",
  },
  pink: {
    border: "border-rose-100",
    textTheme: "text-rose-900",
    bgTheme: "bg-rose-50/30",
    pointText: "text-rose-500",
    daySat: "text-blue-500",
    daySun: "text-rose-500",
  },
  green: {
    border: "border-emerald-100",
    textTheme: "text-emerald-900",
    bgTheme: "bg-emerald-50/30",
    pointText: "text-emerald-600",
    daySat: "text-blue-500",
    daySun: "text-red-500",
  },
  purple: {
    border: "border-purple-100",
    textTheme: "text-purple-900",
    bgTheme: "bg-purple-50/30",
    pointText: "text-purple-600",
    daySat: "text-blue-500",
    daySun: "text-red-500",
  },
  orange: {
    border: "border-orange-100",
    textTheme: "text-orange-900",
    bgTheme: "bg-orange-50/30",
    pointText: "text-orange-600",
    daySat: "text-blue-500",
    daySun: "text-red-500",
  },
  teal: {
    border: "border-teal-100",
    textTheme: "text-teal-900",
    bgTheme: "bg-teal-50/30",
    pointText: "text-teal-600",
    daySat: "text-blue-500",
    daySun: "text-red-500",
  },
  slate: {
    border: "border-slate-200",
    textTheme: "text-slate-800",
    bgTheme: "bg-slate-50",
    pointText: "text-slate-700",
    daySat: "text-blue-500",
    daySun: "text-red-500",
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
const formatDateStr = (year: number, month: number, day: number) => {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
};

// 미니 달력 그리드 생성 (월요일 시작)
const getMiniCalendarGrid = (year: number, month: number) => {
  const firstDayIndex = new Date(year, month, 1).getDay();
  const mondayFirstIndex = (firstDayIndex + 6) % 7; // 0 = Mon...

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const grid: { dayNum: number | null; isHoliday: boolean }[] = [];

  // 앞쪽 빈 셀
  for (let i = 0; i < mondayFirstIndex; i++) {
    grid.push({ dayNum: null, isHoliday: false });
  }

  // 날짜 추가
  for (let d = 1; d <= daysInMonth; d++) {
    grid.push({ dayNum: d, isHoliday: false });
  }

  // 뒤쪽 빈 셀 채워 6주(42셀) 규격 완성
  const remaining = 42 - grid.length;
  for (let i = 0; i < remaining; i++) {
    grid.push({ dayNum: null, isHoliday: false });
  }

  return grid;
};

export default function PrintYearlyPage({ year, settings, tasks, holidayMap }: Props) {
  const theme = THEME_STYLES[settings.theme];
  const fontFamily = FONT_FAMILIES[settings.fontFamily];
  const fontSize = FONT_SIZES[settings.fontSize];
  const months = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div
      className={`print-page bg-white text-black p-8 border shadow-sm relative flex flex-col justify-between select-none mx-auto print:shadow-none print:border-none ${theme.border} ${
        settings.template === "landscape"
          ? "w-[297mm] h-[210mm] rounded-xl" // A4 가로
          : "w-[210mm] h-[297mm] rounded-xl" // A4 세로
      }`}
      style={{
        pageBreakAfter: "always",
        breakAfter: "page",
        fontFamily,
        fontSize,
        paddingTop: `${settings.topPadding}px`,
      }}
    >
      {/* 년간 타이틀 */}
      <div className="text-center mb-6">
        <h1 className="text-[3.2em] font-black tracking-wider text-neutral-800 dark:text-neutral-900 leading-none">
          {year}
        </h1>
        <p className="text-[0.8em] text-neutral-400 font-semibold tracking-widest uppercase mt-1">
          {settings.customTitle || "Yearly Mini Calendar"}
        </p>
      </div>

      {/* 12개월 그리드 컨테이너 */}
      <div
        className={`flex-1 grid gap-x-6 gap-y-4 ${
          settings.template === "landscape"
            ? "grid-cols-4 grid-rows-3" // 가로일 때 4열 3행
            : "grid-cols-3 grid-rows-4" // 세로일 때 3열 4행
        }`}
      >
        {months.map((mIdx) => {
          const monthLabel = new Date(year, mIdx, 1).toLocaleString("en-US", {
            month: "long",
          });
          const gridCells = getMiniCalendarGrid(year, mIdx);

          return (
            <div
              key={mIdx}
              className={`border p-2 rounded-lg flex flex-col ${theme.border} bg-white`}
            >
              {/* 월 타이틀 */}
              <div
                className={`text-center text-[0.95em] font-extrabold py-0.5 mb-1.5 rounded tracking-wide ${theme.bgTheme} ${theme.pointText}`}
              >
                {monthLabel}
              </div>

              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 text-center font-bold text-[0.6em] text-neutral-400 border-b pb-0.5 mb-1 select-none">
                {WEEKDAYS.map((day, idx) => {
                  let colorClass = "text-neutral-400";
                  if (idx === 5) colorClass = theme.daySat;
                  if (idx === 6) colorClass = theme.daySun;
                  return (
                    <div key={day} className={colorClass}>
                      {day[0]}
                    </div>
                  );
                })}
              </div>

              {/* 일자 그리드 */}
              <div className="grid grid-cols-7 gap-y-0.5 text-center text-[0.7em] font-medium flex-1 content-center">
                {gridCells.map((cell, cIdx) => {
                  if (cell.dayNum === null) {
                    return <div key={cIdx} className="text-transparent">""</div>;
                  }

                  const dateStr = formatDateStr(year, mIdx, cell.dayNum);
                  
                  // 휴일 체크
                  const isPublicHoliday = holidayMap[dateStr];
                  const isManualHoliday = tasks.some(
                    (t) => (t.type === "holiday" || t.isHoliday) && (t.startDate === dateStr || t.dueDate === dateStr)
                  );
                  const isHoliday = !!(isPublicHoliday || isManualHoliday);

                  // 색상 선택
                  const dayOfWeek = (cIdx + 1) % 7; // 월요일 시작이므로 cIdx=5은 토(dayOfWeek=6), cIdx=6은 일(dayOfWeek=0)
                  let dayColorClass = "text-neutral-800";
                  if (dayOfWeek === 6) dayColorClass = theme.daySat;
                  if (dayOfWeek === 0 || isHoliday) dayColorClass = theme.daySun;

                  return (
                    <div
                      key={cIdx}
                      className={`py-0.5 rounded-sm flex items-center justify-center font-semibold ${dayColorClass} ${
                        isHoliday ? "bg-red-50/50 print:bg-none" : ""
                      }`}
                    >
                      {cell.dayNum}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 푸터 */}
      <div className={`flex items-center justify-between text-[0.7em] text-neutral-300 border-t pt-2 mt-4 ${theme.border}`}>
        <span>ClickBook Yearly Calendar</span>
        <span>Generated with ClickBook AI</span>
      </div>
    </div>
  );
}
