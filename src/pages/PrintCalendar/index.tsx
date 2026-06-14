import React, { useState, useEffect, useCallback, useMemo } from "react";
import PrintSettingsPanel, { type PrintSettings } from "./PrintSettingsPanel";
import PrintCalendarPage from "./PrintCalendarPage";
import PrintYearlyPage from "./PrintYearlyPage";
import type { Bookmark, BookmarkMemo, TodoBoardData, TodoTask } from "@/shared/types";
import { useLang } from "@/shared/LanguageContext";

interface Props {
  settings?: any; // AppSettings
  bookmarks: Bookmark[];
  memos: Record<string, BookmarkMemo>;
  onRefresh: () => void;
}

// 시작 월과 종료 월 사이의 연/월 리스트 생성 헬퍼
const getMonthRange = (startYear: number, startMonth: number, endYear: number, endMonth: number) => {
  const range: { year: number; month: number }[] = [];
  const start = new Date(startYear, startMonth, 1);
  const end = new Date(endYear, endMonth, 1);

  let temp = new Date(start);
  while (temp <= end) {
    range.push({
      year: temp.getFullYear(),
      month: temp.getMonth(),
    });
    temp.setMonth(temp.getMonth() + 1);
    // 무한 루프 방지용 (최대 60개월만 지원)
    if (range.length > 60) break;
  }
  return range;
};

export default function PrintCalendar({ settings: appSettings, bookmarks, memos, onRefresh }: Props) {
  const { lang } = useLang();
  
  // URL 쿼리 파라미터에서 초기 연월 파싱
  const params = new URLSearchParams(window.location.search);
  const startParam = params.get("start"); // YYYY-MM
  const endParam = params.get("end"); // YYYY-MM

  const today = new Date();
  let initStartYear = today.getFullYear();
  let initStartMonth = today.getMonth();
  let initEndYear = today.getFullYear();
  let initEndMonth = today.getMonth();

  if (startParam) {
    const parts = startParam.split("-");
    if (parts.length === 2) {
      initStartYear = parseInt(parts[0]);
      initStartMonth = parseInt(parts[1]) - 1;
    }
  }

  if (endParam) {
    const parts = endParam.split("-");
    if (parts.length === 2) {
      initEndYear = parseInt(parts[0]);
      initEndMonth = parseInt(parts[1]) - 1;
    }
  } else {
    // 종료 월이 지정 안 되어 있으면 시작 월과 동일하게 설정
    initEndYear = initStartYear;
    initEndMonth = initStartMonth;
  }

  // Print 설정 기본값
  const [printSettings, setPrintSettings] = useState<PrintSettings>({
    template: "landscape",
    theme: "blue",
    fontSize: "medium",
    fontFamily: "sans",
    topPadding: 20,
    customTitle: "",
    startYear: initStartYear,
    startMonth: initStartMonth,
    endYear: initEndYear,
    endMonth: initEndMonth,
    showTodos: true,
    showMemos: true,
    showHolidays: true,
  });

  const [todoBoard, setTodoBoard] = useState<TodoBoardData | null>(null);
  const [holidayMap, setHolidayMap] = useState<Record<string, string>>({});

  // 1. TODO 보드 로드
  const loadTodoBoard = useCallback(async () => {
    try {
      const res = await chrome.runtime.sendMessage({ type: "GET_TODO_BOARD" });
      if (res && res.success && res.data) {
        setTodoBoard(res.data as TodoBoardData);
      }
    } catch (err) {
      console.error("Failed to load todo board for printing:", err);
    }
  }, []);

  useEffect(() => {
    loadTodoBoard();
  }, [loadTodoBoard]);

  // 2. 공휴일 API 로드 & 캐시 (CalendarBoard.tsx 로직 준수)
  const loadHolidays = useCallback(
    async (year: number, countryOpt?: string) => {
      if (countryOpt === "off") {
        setHolidayMap({});
        return;
      }

      let countryCode = "KR"; // default
      if (!countryOpt || countryOpt === "auto") {
        if (lang === "ko") countryCode = "KR";
        else if (lang === "ja") countryCode = "JP";
        else countryCode = "US";
      } else {
        countryCode = countryOpt;
      }

      const cacheKey = `cached_holidays_${year}_${countryCode}`;

      try {
        const stored = await chrome.storage.local.get(cacheKey);
        if (stored[cacheKey]) {
          setHolidayMap((prev) => ({ ...prev, ...stored[cacheKey] }));
          return;
        }

        const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`);
        if (res.ok) {
          const data = (await res.json()) as any[];
          const map: Record<string, string> = {};
          data.forEach((h) => {
            map[h.date] = h.localName || h.name;
          });

          await chrome.storage.local.set({ [cacheKey]: map });
          setHolidayMap((prev) => ({ ...prev, ...map }));
        }
      } catch (err) {
        console.error("Error loading holidays for printing:", err);
      }
    },
    [lang]
  );

  // 인쇄 대상 기간에 포함된 모든 연도의 공휴일 로드
  useEffect(() => {
    const startY = printSettings.startYear;
    const endY = printSettings.endYear;
    
    // 시작년도부터 종료년도까지 순차적으로 로드
    for (let y = startY; y <= endY; y++) {
      loadHolidays(y, appSettings?.holidayCountry);
    }
  }, [printSettings.startYear, printSettings.endYear, appSettings?.holidayCountry, loadHolidays]);

  // 인쇄할 월 리스트 계산
  const monthsToPrint = useMemo(() => {
    // 유효성 체크: 시작일이 종료일보다 늦을 경우 강제로 교정 또는 빈 배열
    const start = new Date(printSettings.startYear, printSettings.startMonth, 1);
    const end = new Date(printSettings.endYear, printSettings.endMonth, 1);
    if (start > end) {
      return [];
    }
    return getMonthRange(
      printSettings.startYear,
      printSettings.startMonth,
      printSettings.endYear,
      printSettings.endMonth
    );
  }, [printSettings.startYear, printSettings.startMonth, printSettings.endYear, printSettings.endMonth]);

  // TODO 일정 리스트 평탄화
  const allTasks = useMemo(() => {
    if (!todoBoard || !todoBoard.tasks) return [];
    return Object.values(todoBoard.tasks);
  }, [todoBoard]);

  // 메모 리스트 평탄화
  const allMemos = useMemo(() => {
    const list: { bookmark: Bookmark | null; memo: BookmarkMemo }[] = [];
    Object.values(memos).forEach((memo) => {
      const bm = bookmarks.find((b) => b.id === memo.bookmarkId) || null;
      list.push({ bookmark: bm, memo });
    });
    return list;
  }, [memos, bookmarks]);

  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    window.close();
  };

  return (
    <div className="flex w-screen h-screen bg-gray-100 dark:bg-neutral-950 overflow-hidden text-gray-900 dark:text-neutral-100 select-none">
      {/* 1. Left Sidebar: Print Settings Panel */}
      <PrintSettingsPanel
        settings={printSettings}
        onChange={setPrintSettings}
        onPrint={handlePrint}
        onClose={handleClose}
      />

      {/* 2. Right Workspace: Calendar Preview List */}
      <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center bg-gray-200 dark:bg-neutral-950 print:p-0 print:bg-white print:overflow-visible">
        {/* 인쇄 옵션 스타일 주입 (인쇄 모드 시 좌우 여백 등을 브라우저 마진 설정과 맞추기 위함) */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body {
                background: white !important;
                color: black !important;
              }
              @page {
                size: ${printSettings.template === "portrait" ? "A4 portrait" : "A4 landscape"};
                margin: 0mm;
              }
              .print-page {
                margin: 0 !important;
                border: none !important;
                border-radius: 0 !important;
                box-shadow: none !important;
                width: 100% !important;
                height: 100vh !important;
                page-break-after: always !important;
                break-after: page !important;
              }
            }
          `
        }} />

        {printSettings.template === "yearly" ? (
          <div className="w-full flex flex-col items-center print:block">
            <PrintYearlyPage
              year={printSettings.startYear}
              settings={printSettings}
              tasks={allTasks}
              holidayMap={holidayMap}
            />
          </div>
        ) : monthsToPrint.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-gray-500">
            <span className="text-sm font-semibold">인쇄 기간 설정이 올바르지 않습니다.</span>
            <span className="text-xs text-gray-400 mt-1">시작 월을 종료 월보다 이전으로 설정해 주세요.</span>
          </div>
        ) : (
          <div className="space-y-8 print:space-y-0 w-full flex flex-col items-center print:w-auto print:block">
            {monthsToPrint.map(({ year, month }) => (
              <PrintCalendarPage
                key={`${year}-${month}`}
                year={year}
                month={month}
                settings={printSettings}
                tasks={allTasks}
                memos={allMemos}
                holidayMap={holidayMap}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
