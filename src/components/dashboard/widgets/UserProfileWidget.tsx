import { useState, useEffect, useMemo, useRef } from "react";
import { Activity, Pencil, Check, X } from "lucide-react";
import { useLang } from "@/shared/LanguageContext";

interface Props {
  bookmarkCount: number;
  memoCount: number;
  completedTaskCount?: number;
  onNavigate?: (page: string) => void;
}

export default function UserProfileWidget({
  bookmarkCount,
  memoCount,
  completedTaskCount = 0,
  onNavigate,
}: Props) {
  const { t } = useLang();
  const [currentName, setCurrentName] = useState<string>(() => {
    return localStorage.getItem("clickbook_username") || localStorage.getItem("clickbook_user_name") || "Creator";
  });
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 1. chrome.storage.local에서 초기 닉네임 로드
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(["clickbook_username"], (res) => {
        if (res && res.clickbook_username) {
          setCurrentName(res.clickbook_username);
          localStorage.setItem("clickbook_username", res.clickbook_username);
        }
      });

      const storageListener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
        if (changes.clickbook_username) {
          const newName = changes.clickbook_username.newValue || "Creator";
          setCurrentName(newName);
          localStorage.setItem("clickbook_username", newName);
        }
      };
      chrome.storage.onChanged.addListener(storageListener);
      return () => chrome.storage.onChanged.removeListener(storageListener);
    }
  }, []);

  useEffect(() => {
    const handleStorage = () => {
      const name = localStorage.getItem("clickbook_username") || "Creator";
      setCurrentName(name);
    };
    window.addEventListener("CLICKBOOK_USER_NAME_CHANGED", handleStorage);
    return () => window.removeEventListener("CLICKBOOK_USER_NAME_CHANGED", handleStorage);
  }, []);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const handleStartEdit = () => {
    setInputValue(currentName);
    setEditing(true);
  };

  const handleSave = () => {
    const trimmed = inputValue.trim() || "Creator";
    localStorage.setItem("clickbook_username", trimmed);
    localStorage.setItem("clickbook_user_name", trimmed);
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ clickbook_username: trimmed });
    }
    setCurrentName(trimmed);
    setEditing(false);
    window.dispatchEvent(new CustomEvent("CLICKBOOK_USER_NAME_CHANGED", { detail: trimmed }));
  };

  // 최근 14일간의 가상/실제 Activity Matrix (잔디 히트맵 데이터)
  const activityData = useMemo(() => {
    const cells = [];
    for (let i = 0; i < 28; i++) {
      const level = (i * 7 + bookmarkCount + memoCount) % 4;
      cells.push(level);
    }
    return cells;
  }, [bookmarkCount, memoCount]);

  // 잔디 레벨 색상 계산기
  const levelColor = (level: number) => {
    switch (level) {
      case 1:
        return "bg-emerald-200 dark:bg-emerald-950/60";
      case 2:
        return "bg-emerald-400 dark:bg-emerald-800";
      case 3:
        return "bg-emerald-500 dark:bg-emerald-600";
      case 4:
        return "bg-emerald-600 dark:bg-emerald-400";
      default:
        return "bg-slate-200/70 dark:bg-slate-800/80";
    }
  };

  const avatarLetter = (currentName || "Creator").charAt(0).toUpperCase();

  return (
    <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl p-3.5 shadow-figma-sm select-none">
      {/* ── 상단 프로필 헤더 ── */}
      <div className="flex items-center gap-3 mb-3">
        {/* 모던 글래스 그라디언트 아바타 */}
        <div className="relative">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-figma-sm">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-white font-extrabold text-sm">
              {avatarLetter}
            </div>
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800" />
        </div>

        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex items-center gap-1">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") setEditing(false);
                }}
                className="w-24 text-xs font-bold bg-white dark:bg-slate-900 border border-indigo-400 rounded px-1.5 py-0.5 text-slate-800 dark:text-slate-100 outline-none"
              />
              <button onClick={handleSave} className="text-emerald-500 hover:text-emerald-400 p-0.5 cursor-pointer">
                <Check size={13} />
              </button>
              <button onClick={() => setEditing(false)} className="text-slate-400 hover:text-slate-200 p-0.5 cursor-pointer">
                <X size={13} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 group cursor-pointer" onClick={handleStartEdit} title={t("userEditNicknameTooltip")}>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-indigo-500 transition-colors">
                {currentName}
              </h3>
              <Pencil size={10} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </div>
          )}
          <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
            {t("userSmartArchive")}
          </p>
        </div>
      </div>

      {/* ── 3대 지표 통계 바 (클릭 시 해당 페이지로 바로 이동) ── */}
      <div className="grid grid-cols-3 gap-1 py-1.5 border-y border-slate-200/50 dark:border-slate-700/50 mb-3 text-center">
        <div
          onClick={() => onNavigate?.("dashboard")}
          className="p-1 rounded-xl hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 transition-all cursor-pointer group"
          title={t("cmdNavDashboard")}
        >
          <span className="text-[10px] text-slate-400 dark:text-slate-500 block group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {t("userStatBookmarks")}
          </span>
          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {bookmarkCount}
          </span>
        </div>

        <div
          onClick={() => onNavigate?.("memo")}
          className="p-1 rounded-xl hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 transition-all cursor-pointer group"
          title={t("cmdNavMemo")}
        >
          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold block group-hover:underline underline-offset-2 transition-all">
            {t("userStatMemos")}
          </span>
          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {memoCount}
          </span>
        </div>

        <div
          onClick={() => onNavigate?.("todo")}
          className="p-1 rounded-xl hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 transition-all cursor-pointer group"
          title={t("cmdNavTodo")}
        >
          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold block group-hover:underline underline-offset-2 transition-all">
            {t("userStatTasks")}
          </span>
          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {completedTaskCount}
          </span>
        </div>
      </div>

      {/* ── 잔디 Activity Matrix ── */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
            <Activity size={11} className="text-emerald-500" />
            <span>{t("userActivityMatrix")}</span>
          </div>
          <span className="text-[9.5px] font-semibold text-emerald-600 dark:text-emerald-400">
            Active
          </span>
        </div>

        {/* 4줄 x 7열 잔디 매트릭스 그리드 */}
        <div className="grid grid-cols-7 gap-1">
          {activityData.map((level, idx) => (
            <div
              key={idx}
              className={`h-2.5 rounded-[3px] transition-all duration-300 hover:scale-110 ${levelColor(level)}`}
              title={`Activity Score: ${level}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
