import React, { useState, useEffect } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";

interface MemorySaverPanelProps {
  isCollapsed: boolean;
  isMemorySaverCollapsed: boolean;
  onToggleCollapse: () => void;
  t: (key: string, params?: any) => string;
}

export default function MemorySaverPanel({
  isCollapsed,
  isMemorySaverCollapsed,
  onToggleCollapse,
  t,
}: MemorySaverPanelProps) {
  const [suspendedCount, setSuspendedCount] = useState(0);
  const [autoSuspendTime, setAutoSuspendTime] = useState(0);
  const [autoResume, setAutoResume] = useState(false);

  const updateSuspendedCount = () => {
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: "GET_SUSPEND_COUNT" }, (res) => {
        if (res && res.success) {
          const rawData = res.data;
          const count = rawData && typeof rawData === "object" ? (rawData.count || 0) : (rawData || 0);
          setSuspendedCount(count);
        }
      });
    }
  };

  useEffect(() => {
    updateSuspendedCount();
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(["clickbook_auto_suspend_time", "clickbook_auto_resume"], (res) => {
        setAutoSuspendTime(res.clickbook_auto_suspend_time || 0);
        setAutoResume(res.clickbook_auto_resume === true);
      });
    }

    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === "local") {
        if (changes.clickbook_auto_resume) {
          setAutoResume(changes.clickbook_auto_resume.newValue === true);
        }
        if (changes.clickbook_auto_suspend_time) {
          setAutoSuspendTime(changes.clickbook_auto_suspend_time.newValue || 0);
        }
      }
    };

    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener(handleStorageChange);
    }

    const interval = setInterval(updateSuspendedCount, 4000);
    return () => {
      clearInterval(interval);
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      }
    };
  }, []);

  const handleAutoSuspendTimeChange = (time: number) => {
    setAutoSuspendTime(time);
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ clickbook_auto_suspend_time: time });
    }
  };

  const handleAutoResumeChange = (checked: boolean) => {
    setAutoResume(checked);
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ clickbook_auto_resume: checked });
    }
  };

  const handleSuspendAllInactive = () => {
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: "SUSPEND_ALL_INACTIVE" }, (res) => {
        if (res && res.success) {
          updateSuspendedCount();
        }
      });
    }
  };

  const handleUnsuspendAll = () => {
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: "UNSUSPEND_ALL" }, (res) => {
        if (res && res.success) {
          updateSuspendedCount();
        }
      });
    }
  };

  if (isCollapsed) {
    return (
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-surface-700 flex flex-col items-center gap-3">
        {/* Status Icon with tooltip & count badge */}
        <div
          className="relative group/ms flex items-center justify-center w-10 h-10 rounded-xl bg-white/40 dark:bg-surface-900/45 border border-gray-200/50 dark:border-surface-700/50 shadow-sm cursor-help"
          title={t("sleepingTabsCount", { n: suspendedCount })}
        >
          <span className="text-base leading-none">🌙</span>
          {suspendedCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 text-[8px] bg-emerald-500 text-white rounded-full h-4 w-4 flex items-center justify-center font-bold shadow-sm animate-pulse">
              {suspendedCount}
            </span>
          )}
        </div>

        {/* Quick Actions (Vertically stacked icons) */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleSuspendAllInactive}
            className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200/30 dark:border-indigo-800/30 transition-colors cursor-pointer"
            title={t("sleepInactive")}
          >
            <span>💤</span>
          </button>
          <button
            onClick={handleUnsuspendAll}
            className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/30 dark:border-emerald-800/30 transition-colors cursor-pointer"
            title={t("resumeAll")}
          >
            <span>☀️</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-surface-700">
      <div
        onClick={onToggleCollapse}
        className="px-3 pb-1.5 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-surface-800/30 select-none text-[10px] uppercase tracking-[0.15em] text-gray-400 dark:text-gray-600 font-semibold"
      >
        <span>{t("memorySaver")}</span>
        {isMemorySaverCollapsed ? (
          <ChevronRight size={10} className="text-gray-400 dark:text-gray-600" />
        ) : (
          <ChevronDown size={10} className="text-gray-400 dark:text-gray-600" />
        )}
      </div>

      {!isMemorySaverCollapsed && (
        <div className="px-3 pb-2 mt-1">
          <div className="p-3 bg-white/40 dark:bg-surface-900/45 backdrop-blur-md rounded-xl border border-gray-200/50 dark:border-surface-700/50 shadow-sm space-y-3">
            {/* Status & Count */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm leading-none">🌙</span>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {t("sleepingTabsCount", { n: suspendedCount })}
                </span>
              </div>
              <span
                className={`h-2 w-2 rounded-full ${
                  suspendedCount > 0 ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
                }`}
              ></span>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleSuspendAllInactive}
                className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-[10px] font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 transition-colors border border-indigo-200/30 dark:border-indigo-800/30 cursor-pointer"
                title={t("sleepInactive")}
              >
                <span>💤</span>
                <span className="truncate">{t("sleepInactive")}</span>
              </button>
              <button
                onClick={handleUnsuspendAll}
                className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-[10px] font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 transition-colors border border-emerald-200/30 dark:border-emerald-800/30 cursor-pointer"
                title={t("resumeAll")}
              >
                <span>☀️</span>
                <span className="truncate">{t("resumeAll")}</span>
              </button>
            </div>

            {/* Auto Suspend Configuration */}
            <div className="pt-2 border-t border-gray-200/50 dark:border-surface-800/50 flex flex-col gap-2.5">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="auto-suspend-delay"
                  className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 flex items-center justify-between"
                >
                  <span>{t("autoSuspendDelay")}</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                    {autoSuspendTime === 0 ? t("never") : t("minutesCount", { n: autoSuspendTime })}
                  </span>
                </label>
                <select
                  id="auto-suspend-delay"
                  value={autoSuspendTime}
                  onChange={(e) => handleAutoSuspendTimeChange(Number(e.target.value))}
                  className="w-full text-xs bg-gray-50/50 dark:bg-surface-950 border border-gray-200 dark:border-surface-800 rounded-lg px-2.5 py-1.5 text-gray-700 dark:text-gray-300 outline-none focus:border-indigo-500 transition-all cursor-pointer"
                >
                  <option value={0}>{t("never")}</option>
                  <option value={15}>{t("minutesCount", { n: 15 })}</option>
                  <option value={30}>{t("minutesCount", { n: 30 })}</option>
                  <option value={60}>{t("minutesCount", { n: 60 })}</option>
                </select>
              </div>

              {/* Auto Resume Toggle */}
              <label className="flex items-center justify-between cursor-pointer group mt-0.5">
                <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 select-none">
                  {t("autoResumeOnFocus")}
                </span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={autoResume}
                    onChange={(e) => handleAutoResumeChange(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-7 h-4 rounded-full transition-colors duration-200 ${
                      autoResume ? "bg-emerald-500 dark:bg-emerald-600" : "bg-gray-300 dark:bg-surface-700"
                    }`}
                  ></div>
                  <div
                    className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-200 shadow-sm ${
                      autoResume ? "transform translate-x-3" : ""
                    }`}
                  ></div>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
