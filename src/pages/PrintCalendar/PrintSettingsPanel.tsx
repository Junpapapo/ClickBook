import React from "react";
import { Printer, X, Sliders, Calendar, Palette, Type, Eye, CalendarRange, Type as FontIcon } from "lucide-react";

export interface PrintSettings {
  template: "landscape" | "portrait" | "yearly";
  theme: "mono" | "blue" | "pink" | "green" | "purple" | "orange" | "teal" | "slate";
  fontSize: "small" | "medium" | "large";
  fontFamily: "sans" | "serif" | "mono";
  topPadding: number; // 상단 패딩 여백 (px)
  customTitle: string; // 사용자 커스텀 헤더 문구
  startYear: number;
  startMonth: number; // 0-indexed
  endYear: number;
  endMonth: number; // 0-indexed
  showTodos: boolean;
  showMemos: boolean;
  showHolidays: boolean;
}

interface Props {
  settings: PrintSettings;
  onChange: (updater: (prev: PrintSettings) => PrintSettings) => void;
  onPrint: () => void;
  onClose: () => void;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function PrintSettingsPanel({ settings, onChange, onPrint, onClose }: Props) {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

  // 60개월(5개년 * 12개월)의 단일 연월 리스트 생성
  const monthOptions = React.useMemo(() => {
    const list: { value: string; label: string }[] = [];
    years.forEach((y) => {
      MONTH_NAMES.forEach((mName, mIdx) => {
        const mVal = String(mIdx + 1).padStart(2, "0");
        list.push({
          value: `${y}-${mVal}`,
          label: `${mName} ${y}`
        });
      });
    });
    return list;
  }, [years]);

  const handleStartChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [y, m] = e.target.value.split("-").map(Number);
    onChange((prev) => ({ ...prev, startYear: y, startMonth: m - 1 }));
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [y, m] = e.target.value.split("-").map(Number);
    onChange((prev) => ({ ...prev, endYear: y, endMonth: m - 1 }));
  };

  const handleTemplateChange = (template: "landscape" | "portrait" | "yearly") => {
    onChange((prev) => ({ ...prev, template }));
  };

  const handleThemeChange = (theme: "mono" | "blue" | "pink" | "green") => {
    onChange((prev) => ({ ...prev, theme }));
  };

  const handleToggle = (key: keyof Pick<PrintSettings, "showTodos" | "showMemos" | "showHolidays">) => {
    onChange((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // 프리셋 적용 함수
  const applyPreset = (preset: "this_month" | "3_months" | "6_months" | "full_year") => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth(); // 0-indexed

    if (preset === "this_month") {
      onChange((prev) => ({
        ...prev,
        startYear: y,
        startMonth: m,
        endYear: y,
        endMonth: m,
      }));
    } else if (preset === "3_months") {
      const end = new Date(y, m + 2, 1);
      onChange((prev) => ({
        ...prev,
        startYear: y,
        startMonth: m,
        endYear: end.getFullYear(),
        endMonth: end.getMonth(),
      }));
    } else if (preset === "6_months") {
      const end = new Date(y, m + 5, 1);
      onChange((prev) => ({
        ...prev,
        startYear: y,
        startMonth: m,
        endYear: end.getFullYear(),
        endMonth: end.getMonth(),
      }));
    } else if (preset === "full_year") {
      onChange((prev) => ({
        ...prev,
        startYear: y,
        startMonth: 0,
        endYear: y,
        endMonth: 11,
      }));
    }
  };

  const isYearly = settings.template === "yearly";

  const startValue = `${settings.startYear}-${String(settings.startMonth + 1).padStart(2, "0")}`;
  const endValue = `${settings.endYear}-${String(settings.endMonth + 1).padStart(2, "0")}`;

  return (
    <div className="w-80 h-screen bg-white dark:bg-neutral-900 border-r border-gray-200 dark:border-neutral-800 flex flex-col print:hidden select-none shrink-0 shadow-xl z-20">
      {/* Header (영문 고정) */}
      <div className="p-4 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between bg-gray-50 dark:bg-neutral-900/50">
        <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
          <Printer size={18} className="text-indigo-600 dark:text-indigo-400" />
          <span>Print Calendar</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-200 dark:hover:bg-neutral-800 rounded-lg text-gray-500 hover:text-gray-800 dark:hover:text-neutral-200 transition-colors"
          title="Close"
        >
          <X size={18} />
        </button>
      </div>

      {/* Settings Options (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 text-sm">
        {/* 1. Date Range & Presets */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-semibold text-gray-700 dark:text-neutral-300">
            <Calendar size={16} />
            <span>Date Range</span>
          </div>

          {isYearly ? (
            // 년간형인 경우: 단일 연도 선택
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Calendar Year (Full Year)</label>
              <select
                value={settings.startYear}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  onChange((prev) => ({ ...prev, startYear: val, endYear: val }));
                }}
                className="w-full p-2 border border-gray-200 dark:border-neutral-800 rounded bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-neutral-100 font-medium cursor-pointer"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          ) : (
            // 월별 인쇄인 경우: 시작 월 ~ 종료 월 통합 단일 셀렉트
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Start Month</label>
                  <select
                    value={startValue}
                    onChange={handleStartChange}
                    className="w-full p-2 border border-gray-200 dark:border-neutral-800 rounded bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-neutral-100 font-medium cursor-pointer text-xs"
                  >
                    {monthOptions.map((opt) => (
                      <option key={`start-${opt.value}`} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">End Month</label>
                  <select
                    value={endValue}
                    onChange={handleEndChange}
                    className="w-full p-2 border border-gray-200 dark:border-neutral-800 rounded bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-neutral-100 font-medium cursor-pointer text-xs"
                  >
                    {monthOptions.map((opt) => (
                      <option key={`end-${opt.value}`} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                {[
                  { preset: "this_month", label: "This Month" },
                  { preset: "3_months", label: "3 Months" },
                  { preset: "6_months", label: "6 Months" },
                  { preset: "full_year", label: "Full Year" }
                ].map((item) => (
                  <button
                    key={item.preset}
                    onClick={() => applyPreset(item.preset as any)}
                    className="py-1 px-2 text-[11px] font-semibold border border-gray-200 hover:border-indigo-400 dark:border-neutral-800 dark:hover:border-indigo-500 rounded bg-gray-50 hover:bg-indigo-50/20 dark:bg-neutral-800/40 text-gray-600 hover:text-indigo-600 dark:text-neutral-400 dark:hover:text-indigo-400 transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 2. Custom Title Input */}
        <div className="space-y-2">
          <div className="flex items-baseline gap-2 font-semibold text-gray-700 dark:text-neutral-300">
            <FontIcon size={15} />
            <span>Header Caption</span>
          </div>
          <input
            type="text"
            value={settings.customTitle}
            onChange={(e) => onChange((prev) => ({ ...prev, customTitle: e.target.value }))}
            placeholder="e.g. My Schedule"
            className="w-full p-2 border border-gray-200 dark:border-neutral-800 rounded bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-neutral-100 placeholder-gray-400"
          />
        </div>

        {/* 3. Template Selection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-semibold text-gray-700 dark:text-neutral-300">
            <Sliders size={16} />
            <span>Template</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => handleTemplateChange("landscape")}
              className={`py-2 px-1 border rounded-lg flex flex-col items-center justify-between h-20 transition-all ${
                settings.template === "landscape"
                  ? "border-indigo-600 bg-indigo-50/50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/30 dark:text-indigo-400"
                  : "border-gray-200 hover:bg-gray-50 dark:border-neutral-800 dark:hover:bg-neutral-800 text-gray-600 dark:text-neutral-400"
              }`}
            >
              <div className="w-8 h-5 border border-current rounded mt-2" />
              <span className="text-[10px] font-bold mt-1 text-center w-full truncate">Desk (L)</span>
            </button>
            <button
              onClick={() => handleTemplateChange("portrait")}
              className={`py-2 px-1 border rounded-lg flex flex-col items-center justify-between h-20 transition-all ${
                settings.template === "portrait"
                  ? "border-indigo-600 bg-indigo-50/50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/30 dark:text-indigo-400"
                  : "border-gray-200 hover:bg-gray-50 dark:border-neutral-800 dark:hover:bg-neutral-800 text-gray-600 dark:text-neutral-400"
              }`}
            >
              <div className="w-5 h-8 border border-current rounded mt-1" />
              <span className="text-[10px] font-bold mt-1 text-center w-full truncate">Mini (P)</span>
            </button>
            <button
              onClick={() => handleTemplateChange("yearly")}
              className={`py-2 px-1 border rounded-lg flex flex-col items-center justify-between h-20 transition-all ${
                settings.template === "yearly"
                  ? "border-indigo-600 bg-indigo-50/50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/30 dark:text-indigo-400"
                  : "border-gray-200 hover:bg-gray-50 dark:border-neutral-800 dark:hover:bg-neutral-800 text-gray-600 dark:text-neutral-400"
              }`}
            >
              <CalendarRange size={20} className="mt-1" />
              <span className="text-[10px] font-bold mt-1 text-center w-full truncate">Yearly (12M)</span>
            </button>
          </div>
        </div>

        {/* 4. Top Margin Slider */}
        <div className="space-y-2 p-3 bg-gray-50 dark:bg-neutral-800/40 rounded-xl">
          <div className="flex justify-between items-center text-gray-700 dark:text-neutral-300">
            <span className="font-semibold text-xs flex items-center gap-1">
              <Sliders size={13} className="text-gray-500" />
              Top Margin
            </span>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{settings.topPadding}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.topPadding}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              onChange((prev) => ({ ...prev, topPadding: val }));
            }}
            className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-gray-200 dark:bg-neutral-800 rounded-lg appearance-none"
          />
        </div>

        {/* 5. Theme Selection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-semibold text-gray-700 dark:text-neutral-300">
            <Palette size={16} />
            <span>Theme</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {(["mono", "blue", "pink", "green", "purple", "orange", "teal", "slate"] as const).map((color) => (
              <button
                key={color}
                onClick={() => handleThemeChange(color)}
                className={`p-2 border-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
                  settings.theme === color
                    ? "border-indigo-600 scale-105 bg-indigo-50/20 dark:bg-indigo-950/10"
                    : "border-transparent hover:scale-102 hover:bg-gray-50 dark:hover:bg-neutral-800/40"
                }`}
              >
                <div className={`w-6 h-6 rounded-full ${
                  color === "mono" ? "bg-neutral-800 border border-gray-300" :
                  color === "blue" ? "bg-blue-400" :
                  color === "pink" ? "bg-rose-400" :
                  color === "green" ? "bg-emerald-500" :
                  color === "purple" ? "bg-purple-400" :
                  color === "orange" ? "bg-orange-400" :
                  color === "teal" ? "bg-teal-500" :
                  "bg-slate-500"
                }`} />
                <span className="text-[10px] text-gray-500 truncate w-full text-center">
                  {
                    color === "mono" ? "Classic" :
                    color === "blue" ? "Pastel B" :
                    color === "pink" ? "Pastel P" :
                    color === "green" ? "Forest" :
                    color === "purple" ? "Lavender" :
                    color === "orange" ? "Peach" :
                    color === "teal" ? "Mint" :
                    "Slate"
                  }
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 6. Font Styles */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-semibold text-gray-700 dark:text-neutral-300">
            <Type size={16} />
            <span>Font Settings</span>
          </div>
          <div className="space-y-2">
            <div className="flex gap-1 bg-gray-100 dark:bg-neutral-800 p-1 rounded-lg">
              {(["small", "medium", "large"] as const).map((sz) => (
                <button
                  key={sz}
                  onClick={() => onChange((prev) => ({ ...prev, fontSize: sz }))}
                  className={`flex-1 py-1 text-xs rounded-md transition-all ${
                    settings.fontSize === sz
                      ? "bg-white dark:bg-neutral-700 font-semibold shadow-sm text-indigo-600 dark:text-indigo-400"
                      : "text-gray-500 hover:text-gray-800 dark:hover:text-neutral-200"
                  }`}
                >
                  {sz === "small" ? "S" : sz === "medium" ? "M" : "L"}
                </button>
              ))}
            </div>

            <select
              value={settings.fontFamily}
              onChange={(e) => {
                const val = e.target.value as any;
                onChange((prev) => ({ ...prev, fontFamily: val }));
              }}
              className="w-full p-2 border border-gray-200 dark:border-neutral-800 rounded bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-neutral-100"
            >
              <option value="sans">Sans-serif</option>
              <option value="serif">Serif</option>
              <option value="mono">Monospace</option>
            </select>
          </div>
        </div>

        {/* 7. Display Data Options */}
        {!isYearly && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-semibold text-gray-700 dark:text-neutral-300">
              <Eye size={16} />
              <span>Show Data</span>
            </div>
            <div className="space-y-2">
              {[
                { key: "showTodos", label: "Show Tasks" },
                { key: "showMemos", label: "Show Memos" },
                { key: "showHolidays", label: "Show Holidays" },
              ].map((opt) => (
                <label
                  key={opt.key}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800/40 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={settings[opt.key as keyof PrintSettings] as boolean}
                    onChange={() => handleToggle(opt.key as any)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-neutral-700 dark:bg-neutral-800"
                  />
                  <span className="text-gray-700 dark:text-neutral-300">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Print Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-neutral-800 space-y-2 bg-gray-50 dark:bg-neutral-900/50">
        <button
          onClick={onPrint}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold rounded-lg flex items-center justify-center gap-2 shadow transition-colors"
        >
          <Printer size={16} />
          <span>Print</span>
        </button>
      </div>
    </div>
  );
}
