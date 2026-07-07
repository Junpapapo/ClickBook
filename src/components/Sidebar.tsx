import React, { useState, useEffect } from "react";
import {
  Home,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  Sparkles,
  Loader2,
  StickyNote,
  ScanSearch,
  Activity,
  ListTodo,
  Tag,
  Tags,
  Map as MapIcon,
  Calendar,
  GitBranch,
  BookOpen,
} from "lucide-react";
import type { Bookmark, Folder, PageId, TaskItem } from "@/shared/types";

import ChromeBookmarkPanel from "@/components/ChromeBookmarkPanel";
import { isAIAvailable } from "@/shared/categorizer";
import { useDialog } from "@/shared/useDialog";
import { useLang } from "@/shared/LanguageContext";
import AICleanerModal from "@/components/AICleanerModal";
import FolderTree from "./Sidebar/FolderTree";
import MemorySaverPanel from "./Sidebar/MemorySaverPanel";
import TrendingPanel from "./Sidebar/TrendingPanel";
import QuotePanel from "./Sidebar/QuotePanel";

interface Props {
  bookmarks: Bookmark[];
  folders: Folder[];
  selectedFolderId: string | null;
  activePage: PageId;
  onNavigate: (page: PageId, folderId?: string | null) => void;
  onRefresh: () => void;
  todoStats?: { overdueCount: number; dueTodayCount: number };
  showChromePanel?: boolean;
  memoCount?: number;
  onAutoTag?: () => void;
  taskCount?: number;
  maxFolderDepth?: number;
  onAiLoadingChange?: (loading: boolean) => void;
  showGitHubRankingMenu?: boolean;
  showWikiRankingMenu?: boolean;
  showHFRankingMenu?: boolean;
  showHNRankingMenu?: boolean;
  tasks?: TaskItem[];
  onAiOrganize?: () => void;
  organizeResult?: {
    movedCount: number;
    total: number;
    backupName: string;
    aiSuccessCount?: number;
    aiTotalBatches?: number;
    aiSupported?: boolean;
  } | null;
}

export default function Sidebar({
  bookmarks,
  folders,
  selectedFolderId,
  activePage,
  onNavigate,
  onRefresh,
  showChromePanel = false,
  memoCount,
  onAutoTag,
  taskCount = 0,
  maxFolderDepth = 3,
  onAiLoadingChange,
  todoStats,
  showGitHubRankingMenu = true,
  showWikiRankingMenu = true,
  showHFRankingMenu = true,
  showHNRankingMenu = true,
  tasks = [],
  onAiOrganize,
  organizeResult = null,
}: Props) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("clickbook_sidebar_collapsed") === "true";
    }
    return false;
  });

  const [isBookmarkCollapsed, setIsBookmarkCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("clickbook_sidebar_bookmark_collapsed") === "true";
    }
    return false;
  });

  const [isTaskCollapsed, setIsTaskCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("clickbook_sidebar_task_collapsed") === "true";
    }
    return false;
  });

  const [isMemorySaverCollapsed, setIsMemorySaverCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("clickbook_sidebar_memorysaver_collapsed") === "true";
    }
    return false;
  });

  const [isTrendingCollapsed, setIsTrendingCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("clickbook_sidebar_trending_collapsed") === "true";
    }
    return false;
  });

  const [folderHeight, setFolderHeight] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("clickbook_sidebar_folder_height");
      return saved ? Number(saved) : 280;
    }
    return 280;
  });

  const handleFolderResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = folderHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const newHeight = Math.max(100, Math.min(700, startHeight + deltaY));
      setFolderHeight(newHeight);
      localStorage.setItem("clickbook_sidebar_folder_height", String(newHeight));
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleToggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem("clickbook_sidebar_collapsed", String(nextState));
  };

  const handleToggleBookmark = () => {
    const nextState = !isBookmarkCollapsed;
    setIsBookmarkCollapsed(nextState);
    localStorage.setItem("clickbook_sidebar_bookmark_collapsed", String(nextState));
  };

  const handleToggleTask = () => {
    const nextState = !isTaskCollapsed;
    setIsTaskCollapsed(nextState);
    localStorage.setItem("clickbook_sidebar_task_collapsed", String(nextState));
  };

  const handleToggleMemorySaver = () => {
    const nextState = !isMemorySaverCollapsed;
    setIsMemorySaverCollapsed(nextState);
    localStorage.setItem("clickbook_sidebar_memorysaver_collapsed", String(nextState));
  };

  const handleToggleTrending = () => {
    const nextState = !isTrendingCollapsed;
    setIsTrendingCollapsed(nextState);
    localStorage.setItem("clickbook_sidebar_trending_collapsed", String(nextState));
  };

  const [aiAvailable, setAiAvailable] = useState(false);
  const [aiCleanerOpen, setAiCleanerOpen] = useState(false);
  const { showConfirm, DialogEl } = useDialog();
  const { t, lang } = useLang();

  const isOrganizing = tasks.some(
    (t) => t.category === "ai-organize" && (t.status === "running" || t.status === "queued")
  );

  const organizeTask = tasks.find(
    (t) => t.category === "ai-organize" && (t.status === "running" || t.status === "queued")
  );
  const organizeProgress = organizeTask ? {
    progress: organizeTask.progress,
    detail: organizeTask.detail || ""
  } : null;

  // ── 모든 영역(Bookmarks, Tasks, Memory Saver, Trending) 일괄 접기/펼치기 ──────
  const isAllCollapsed = isBookmarkCollapsed && isTaskCollapsed && isMemorySaverCollapsed && isTrendingCollapsed;

  const handleToggleAllSections = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !isAllCollapsed;
    setIsBookmarkCollapsed(nextState);
    setIsTaskCollapsed(nextState);
    setIsMemorySaverCollapsed(nextState);
    setIsTrendingCollapsed(nextState);
    localStorage.setItem("clickbook_sidebar_bookmark_collapsed", String(nextState));
    localStorage.setItem("clickbook_sidebar_task_collapsed", String(nextState));
    localStorage.setItem("clickbook_sidebar_memorysaver_collapsed", String(nextState));
    localStorage.setItem("clickbook_sidebar_trending_collapsed", String(nextState));
  };

  useEffect(() => {
    onAiLoadingChange?.(isOrganizing);
  }, [isOrganizing, onAiLoadingChange]);

  useEffect(() => {
    async function checkAI() {
      const available = await isAIAvailable();
      setAiAvailable(available);
    }
    checkAI();

    const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.clickbook_ai_enabled) {
        setAiAvailable(changes.clickbook_ai_enabled.newValue === true);
      }
    };
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener(listener);
    }
    return () => {
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
        chrome.storage.onChanged.removeListener(listener);
      }
    };
  }, []);

  // ── AI 자동 정리 ──────────────────────────
  async function handleAIOrganize() {
    const confirmed = await showConfirm(
      t("aiConfirmMsg"),
      t("aiConfirmBtn"),
      "Cancel",
      "info"
    );
    if (!confirmed) return;
    onAiOrganize?.();
  }

  return (
    <>
      {DialogEl}
      <aside
        className={`relative group/sidebar bg-white dark:bg-surface-900 border-r border-gray-200 dark:border-surface-700 flex flex-col shrink-0 overflow-x-hidden transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-16" : "w-60"
        }`}
      >
        {/* 접기/펼치기 토글 버튼 */}
        <button
          onClick={handleToggleCollapse}
          className="absolute top-1/2 -right-2.5 -translate-y-1/2 w-5 h-16 bg-indigo-500 dark:bg-indigo-600 border border-indigo-600 dark:border-indigo-500 rounded-full flex items-center justify-center shadow-md hover:bg-indigo-600 dark:hover:bg-indigo-700 transition-all opacity-50 group-hover/sidebar:opacity-100 z-50 cursor-pointer text-white"
          title={isCollapsed ? t("expand") : t("collapse")}
        >
          {isCollapsed ? (
            <ChevronRight size={12} className="text-white" />
          ) : (
            <ChevronLeft size={12} className="text-white" />
          )}
        </button>

        {/* ヘッダー */}
        {isCollapsed ? (
          <div className="py-4 flex flex-col items-center justify-center shrink-0 w-full">
            <img
              src="/icons/icon128.png"
              alt=""
              className="w-7 h-7 cursor-pointer active:scale-95 transition-transform"
              onClick={() => {
                setIsCollapsed(false);
                localStorage.setItem("clickbook_sidebar_collapsed", "false");
                onNavigate("dashboard");
              }}
              title={t("pageTitle")}
            />
          </div>
        ) : (
          <div className="px-4 py-4 flex items-center justify-between shrink-0">
            <div
              className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform"
              onClick={() => {
                setIsCollapsed(true);
                localStorage.setItem("clickbook_sidebar_collapsed", "true");
                onNavigate("dashboard");
              }}
              title={t("pageTitle")}
            >
              <img src="/icons/icon128.png" alt="" className="w-6 h-6" />
              <span className="text-lg font-bold tracking-tight text-indigo-500 dark:text-indigo-400 relative flex items-center gap-1">
                <span>ClickBook</span>
                <span className="flex items-center gap-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white border border-indigo-500/30 px-1.5 py-0.5 rounded text-[9px] font-extrabold select-none leading-none mt-[-10px] shadow-sm shadow-indigo-500/20">
                  <Sparkles size={9} className="text-yellow-300 fill-yellow-300 shrink-0" />
                  AI
                </span>
              </span>
            </div>
            <span className="text-[10px] text-gray-400 dark:text-gray-700 bg-gray-100 dark:bg-surface-800 rounded-full px-2 py-0.5">
              {bookmarks.length}
            </span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto min-h-0 flex flex-col pr-1">
          {/* Chrome ブックマークパネル */}
          {!isCollapsed && showChromePanel && (
            <div className="shrink-0">
              <ChromeBookmarkPanel onRefresh={onRefresh} />
            </div>
          )}

        {/* 대시보드 홈 버튼 (로고 바로 아래 단독 배치) */}
        <div className="px-1.5 mt-2 mb-1.5 flex justify-center shrink-0">
          {isCollapsed ? (
            <button
              onClick={() => onNavigate("dashboard")}
              title={t("dashboard")}
              className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-150 border
                ${
                  activePage === "dashboard"
                    ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 font-semibold border-indigo-500/20 dark:border-indigo-500/30"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-surface-800 border-transparent"
                }
              `}
            >
              <Home size={16} />
            </button>
          ) : (
            <div className="relative w-full group/dash">
              <button
                onClick={() => onNavigate("dashboard")}
                className={`w-full flex items-center justify-center gap-2 pl-3 pr-10 py-2.5 text-sm rounded-lg transition-all duration-150 border
                  ${
                    activePage === "dashboard"
                      ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 font-semibold border-indigo-500/20 dark:border-indigo-500/30"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-surface-800 border-transparent"
                  }
                `}
              >
                <Home size={15} className="shrink-0" />
                <span className="truncate leading-none font-medium">{t("dashboard")}</span>
              </button>
              <button
                onClick={handleToggleAllSections}
                title={isAllCollapsed ? t("expandAll") : t("collapseAll")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-surface-700/80 transition-all cursor-pointer"
              >
                {isAllCollapsed ? <ChevronsDown size={13} /> : <ChevronsUp size={13} />}
              </button>
            </div>
          )}
        </div>

        {/* 🔖 BOOKMARK Section */}
        <div
          onClick={!isCollapsed ? handleToggleBookmark : undefined}
          className={`px-3 pt-3 pb-1.5 border-t border-gray-200/50 dark:border-surface-800/50 mt-1 flex justify-center shrink-0
            ${!isCollapsed ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-surface-800/30 select-none" : ""}`}
        >
          {!isCollapsed && (
            <div className="flex items-center justify-between w-full text-[10px] uppercase tracking-[0.15em] text-gray-400 dark:text-gray-600 font-semibold">
              <span>Bookmarks</span>
              {isBookmarkCollapsed ? (
                <ChevronRight size={10} className="text-gray-400 dark:text-gray-600" />
              ) : (
                <ChevronDown size={10} className="text-gray-400 dark:text-gray-600" />
              )}
            </div>
          )}
        </div>

        {/* AI 자동 정리 및 기타 북마크 도구들 */}
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2.5 w-full shrink-0">
            {/* 자동 태깅 */}
            <button
              disabled={!aiAvailable || isOrganizing}
              onClick={onAutoTag}
              title={t("autoTagTooltip") || "자동 태깅"}
              className={`
                relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200
                ${
                  aiAvailable && !isOrganizing
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 shadow-sm cursor-pointer"
                    : "bg-gray-100 dark:bg-surface-800 text-gray-400 dark:text-gray-600 cursor-not-allowed"
                }
              `}
            >
              <Tags size={15} />
            </button>

            {/* 북정리 */}
            <button
              disabled={!aiAvailable || isOrganizing}
              onClick={handleAIOrganize}
              title={!aiAvailable ? t("aiNotAvailable") : isOrganizing ? `${t("aiOrganizing")} ${organizeProgress ? `(${organizeProgress.progress}%)` : ""}` : t("aiOrganizeTooltip")}
              className={`
                relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200
                ${
                  aiAvailable && !isOrganizing
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shadow-sm cursor-pointer"
                    : "bg-gray-100 dark:bg-surface-800 text-gray-400 dark:text-gray-600 cursor-not-allowed"
                }
              `}
            >
              {isOrganizing ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Sparkles size={14} className={aiAvailable ? "text-yellow-300" : ""} />
              )}
            </button>

            {/* 북크리너 */}
            <button
              disabled={isOrganizing}
              onClick={() => setAiCleanerOpen(true)}
              title={t("aiCleanerTooltip")}
              className={`
                relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200
                ${
                  isOrganizing
                    ? "bg-gray-100 dark:bg-surface-800 text-gray-400 dark:text-gray-600 cursor-not-allowed"
                    : aiAvailable
                    ? "bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-500 dark:to-cyan-600 text-white hover:from-teal-500 hover:to-cyan-500 shadow-sm cursor-pointer"
                    : "bg-gray-100 dark:bg-surface-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-surface-700 cursor-pointer"
                }
              `}
            >
              <ScanSearch size={14} />
            </button>

            {/* 태그 클라우드 */}
            <button
              onClick={() => onNavigate("tagboard")}
              title={t("tagBoardMenu") || "Tag Cloud"}
              className={`relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-150
                ${
                  activePage === "tagboard"
                    ? "bg-indigo-50 text-white shadow-sm font-semibold"
                    : "bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-500/20"
                }`}
            >
              <Tag size={15} />
            </button>

            {/* 북맵 */}
            <button
              onClick={() => onNavigate("map")}
              title={t("bookmarkMap") || "Bookmark Map"}
              className={`relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-150
                ${
                  activePage === "map"
                    ? "bg-blue-500 text-white shadow-sm font-semibold"
                    : "bg-blue-500/10 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20 font-medium"
                }`}
            >
              <MapIcon size={15} />
            </button>
          </div>
        ) : (
          !isBookmarkCollapsed && (
            <div className="shrink-0 flex flex-col">
              <div className="px-1.5 mb-2 flex gap-1.5">
                {/* 왼쪽 20%: Auto Tag 아이콘 버튼 */}
                <button
                  disabled={!aiAvailable || isOrganizing}
                  onClick={onAutoTag}
                  title={t("autoTagTooltip") || "자동 태깅 (Auto Tag)"}
                  className={`
                    relative group flex items-center justify-center w-[20%] py-2.5 rounded-lg font-medium
                    transition-all duration-200 overflow-hidden shrink-0
                    ${
                      aiAvailable && !isOrganizing
                        ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 cursor-pointer"
                        : "bg-gray-100 dark:bg-surface-800 text-gray-400 dark:text-gray-600 cursor-not-allowed"
                    }
                  `}
                >
                  <Tags size={14} className={`shrink-0 ${aiAvailable ? "text-white" : ""}`} />
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 text-[11px] font-medium text-white bg-slate-900/90 dark:bg-surface-950/95 backdrop-blur-sm rounded shadow-md opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 translate-y-1 transition-all duration-150 z-50 whitespace-nowrap border border-white/5">
                    {t("autoTagTooltip") || "자동 태깅"}
                    <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/90 dark:border-t-surface-950/95" />
                  </span>
                </button>

                {/* 오른쪽 80%: AI Organize 버튼 */}
                <button
                  disabled={!aiAvailable || isOrganizing}
                  onClick={handleAIOrganize}
                  title={!aiAvailable ? t("aiNotAvailable") : isOrganizing ? `${t("aiOrganizing")} ${organizeProgress ? `(${organizeProgress.progress}%)` : ""}` : t("aiOrganizeTooltip")}
                  className={`
                    relative flex items-center gap-2.5 flex-1 px-3 py-2.5 text-sm rounded-lg font-medium
                    transition-all duration-200 overflow-hidden
                    ${
                      aiAvailable && !isOrganizing
                        ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 cursor-pointer"
                        : "bg-gray-100 dark:bg-surface-800 text-gray-400 dark:text-gray-600 cursor-not-allowed"
                    }
                  `}
                >
                  {isOrganizing ? (
                    <Loader2 size={14} className="animate-spin shrink-0" />
                  ) : (
                    <Sparkles size={14} className={`shrink-0 ${aiAvailable ? "text-yellow-300" : ""}`} />
                  )}
                  <span className="flex-1 text-left truncate">
                    {isOrganizing 
                      ? `${t("aiOrganizing")}${organizeProgress ? ` (${organizeProgress.progress}%)` : ""}`
                      : t("aiOrganize")}
                  </span>
                  {aiAvailable && !isOrganizing && (
                    <span className="text-[9px] bg-white/25 rounded px-1.5 py-0.5 shrink-0 font-semibold tracking-wide">
                      AI
                    </span>
                  )}
                  {!aiAvailable && (
                    <span className="text-[9px] bg-gray-200 dark:bg-surface-700 text-gray-400 dark:text-gray-500 rounded px-1.5 py-0.5 shrink-0">
                      N/A
                    </span>
                  )}
                </button>
              </div>

              {organizeResult && (() => {
                const {
                  movedCount,
                  total,
                  backupName,
                  aiSuccessCount,
                  aiTotalBatches,
                  aiSupported,
                } = organizeResult;

                let title = t("aiOrganizeDone");
                let desc = t("aiResult", { moved: movedCount, total: total });
                let bgClass = "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/50";
                let textTitleClass = "text-emerald-700 dark:text-emerald-400";
                let textDescClass = "text-emerald-600 dark:text-emerald-500";

                if (aiSupported === false) {
                  if (lang === "ko") {
                    title = "✓ 로컬 규칙 정리 완료";
                    desc = `AI 모델을 사용할 수 없어 로컬 도메인 규칙으로 정리했습니다. (${movedCount}개 정리 완료)`;
                  } else if (lang === "ja") {
                    title = "✓ ローカルルール整理完了";
                    desc = `AIモデルが利用できないため、ローカルドメインルールで整理しました. (${movedCount}件整理完了)`;
                  } else {
                    title = "✓ Local Rules Organize Done";
                    desc = `AI model was unavailable. Organized using local domain rules. (${movedCount} sites organized)`;
                  }
                  bgClass = "bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-700/50";
                  textTitleClass = "text-slate-700 dark:text-slate-400";
                  textDescClass = "text-slate-600 dark:text-slate-500";
                } else if (
                  aiSuccessCount !== undefined &&
                  aiTotalBatches !== undefined &&
                  aiTotalBatches > 0
                ) {
                  if (aiSuccessCount === 0) {
                    if (lang === "ko") {
                      title = "⚠ AI 분류 파싱 실패";
                      desc = `AI 응답을 분석할 수 없어 로컬 도메인 규칙으로 대체되었습니다. (${movedCount}개 정리 완료)`;
                    } else if (lang === "ja") {
                      title = "⚠ AI分類解析失敗";
                      desc = `AI応答を解析できなかったため、ローカルルールで整理されました. (${movedCount}件整理完了)`;
                    } else {
                      title = "⚠ AI Parsing Failed";
                      desc = `Failed to parse AI responses. Fell back to local domain rules. (${movedCount} sites organized)`;
                    }
                    bgClass = "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/50";
                    textTitleClass = "text-amber-700 dark:text-amber-400";
                    textDescClass = "text-amber-600 dark:text-amber-500";
                  } else if (aiSuccessCount < aiTotalBatches) {
                    if (lang === "ko") {
                      title = `⚠ AI 정리 (부분 성공: ${aiSuccessCount}/${aiTotalBatches})`;
                      desc = `AI가 일부 배치를 분석했습니다. 실패한 항목은 로컬 규칙으로 대체되었습니다. (${movedCount}개 정리 완료)`;
                    } else if (lang === "ja") {
                      title = `⚠ AI整理（一部成功: ${aiSuccessCount}/${aiTotalBatches}）`;
                      desc = `AI가 일부의 바ッチを解析しました。失敗した部分はローカルルールになりました. (${movedCount}件整理完了)`;
                    } else {
                      title = `⚠ AI Organize (Partial: ${aiSuccessCount}/${aiTotalBatches})`;
                      desc = `AI successfully parsed some batches. Others fell back to domain rules. (${movedCount} sites organized)`;
                    }
                    bgClass = "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/50";
                    textTitleClass = "text-amber-700 dark:text-amber-400";
                    textDescClass = "text-amber-600 dark:text-amber-500";
                  }
                }

                return (
                  <div className="px-1.5 mb-2">
                    <div className={`px-3 py-2 rounded-lg border text-xs w-full overflow-hidden ${bgClass}`}>
                      <p className={`font-medium ${textTitleClass}`}>{title}</p>
                      <p className={`mt-0.5 ${textDescClass}`}>{desc}</p>
                      <p className="text-gray-400 dark:text-gray-500 mt-1 text-[10px] truncate" title={backupName}>
                        {t("backupPrefix")}
                        {backupName}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* 🧹 AI 중복 검사 (북크리너) */}
              <div className="px-1.5 mb-2">
                <button
                  disabled={isOrganizing}
                  onClick={() => setAiCleanerOpen(true)}
                  title={t("aiCleanerTooltip")}
                  className={`
                    relative flex items-center gap-2.5 w-full px-3 py-2.5 text-sm rounded-lg font-medium
                    transition-all duration-200 overflow-hidden
                    ${
                      isOrganizing
                        ? "bg-gray-100 dark:bg-surface-800 text-gray-400 dark:text-gray-600 cursor-not-allowed"
                        : aiAvailable
                        ? "bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-500 dark:to-cyan-600 text-white hover:from-teal-500 hover:to-cyan-500 shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 cursor-pointer"
                        : "bg-gray-100 dark:bg-surface-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-surface-700 cursor-pointer"
                    }
                  `}
                >
                  <ScanSearch size={14} className="shrink-0" />
                  <span className="flex-1 text-left truncate">{t("aiCleanerBtn")}</span>
                  {!isOrganizing && (
                    <span
                      className={`text-[9px] rounded px-1.5 py-0.5 shrink-0 font-semibold tracking-wide ${
                        aiAvailable
                          ? "bg-white/25 text-white"
                          : "bg-gray-200 dark:bg-surface-700 text-gray-400 dark:text-gray-500"
                      }`}
                    >
                      {aiAvailable ? "AI" : "Rule"}
                    </span>
                  )}
                </button>
              </div>

              {/* 태그 클라우드 & 북마크 맵 (50:50 분할 배치) */}
              <div className="px-1.5 mb-2 grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => onNavigate("tagboard")}
                  className={`relative group flex items-center justify-center gap-1.5 px-2 py-2 text-xs rounded-lg transition-all duration-150
                    ${
                      activePage === "tagboard"
                        ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 font-semibold"
                        : "bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-500/20 dark:hover:bg-indigo-500/25"
                    }`}
                >
                  <Tag size={13} className="shrink-0" />
                  <span className="truncate leading-none font-medium">{t("tagBoardMenu") || "Tag Cloud"}</span>
                </button>

                <button
                  onClick={() => onNavigate("map")}
                  className={`relative group flex items-center justify-center gap-1.5 px-2 py-2 text-xs rounded-lg transition-all duration-150
                    ${
                      activePage === "map"
                        ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20 font-semibold"
                        : "bg-blue-500/10 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20 dark:hover:bg-blue-500/25 font-medium"
                    }`}
                >
                  <MapIcon size={13} className="shrink-0" />
                  <span className="truncate leading-none font-medium">{t("bookmarkMap") || "Bookmark Map"}</span>
                </button>
              </div>
            </div>
          )
        )}

        {/* 📅 TASK Section */}
        <div
          onClick={!isCollapsed ? handleToggleTask : undefined}
          className={`px-3 pt-3 pb-1.5 border-t border-gray-200/50 dark:border-surface-800/50 mt-1 flex justify-center shrink-0
            ${!isCollapsed ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-surface-800/30 select-none" : ""}`}
        >
          {!isCollapsed && (
            <div className="flex items-center justify-between w-full text-[10px] uppercase tracking-[0.15em] text-gray-400 dark:text-gray-600 font-semibold">
              <span>Tasks</span>
              {isTaskCollapsed ? (
                <ChevronRight size={10} className="text-gray-400 dark:text-gray-600" />
              ) : (
                <ChevronDown size={10} className="text-gray-400 dark:text-gray-600" />
              )}
            </div>
          )}
        </div>

        {/* Memo, TODO & Calendar Boards (3-column layout) */}
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2.5 w-full">
            {/* Memo Board Button */}
            <button
              onClick={() => onNavigate("memo")}
              title={t("memoBoard") || "Memos"}
              className={`relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-150
                ${
                  activePage === "memo"
                    ? "bg-amber-500 text-white shadow-sm font-semibold"
                    : "bg-amber-500/10 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20"
                }`}
            >
              <StickyNote size={15} />
              {(memoCount ?? 0) > 0 && (
                <span className="absolute -top-1 -right-1 text-[8px] bg-red-500 text-white rounded-full h-4 w-4 flex items-center justify-center font-bold shadow-sm">
                  {memoCount}
                </span>
              )}
            </button>

            {/* TODO Board Button */}
            <button
              onClick={() => onNavigate("todo")}
              title={t("todoBoardMenu") || "TODO"}
              className={`relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-150
                ${
                  activePage === "todo"
                    ? "bg-emerald-500 text-white shadow-sm font-semibold"
                    : "bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20"
                }`}
            >
              <ListTodo size={15} />
              {todoStats && (todoStats.overdueCount > 0 || todoStats.dueTodayCount > 0) && (
                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              )}
            </button>

            {/* Calendar Board Button */}
            <button
              onClick={() => onNavigate("calendar")}
              title={t("calendarMenu") || "Calendar"}
              className={`relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-150
                ${
                  activePage === "calendar"
                    ? "bg-indigo-500 text-white shadow-sm font-semibold"
                    : "bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-500/20"
                }`}
            >
              <Calendar size={15} />
            </button>

            {/* MindMap Board Button */}
            <button
              onClick={() => onNavigate("mindmap")}
              title={t("mindMapBoardMenu") || "Mind Map"}
              className={`relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-150
                ${
                  activePage === "mindmap"
                    ? "bg-purple-500 text-white shadow-sm font-semibold"
                    : "bg-purple-500/10 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400 hover:bg-purple-500/20"
                }`}
            >
              <GitBranch size={15} />
            </button>

            {/* SpringNote Board Button */}
            <button
              onClick={() => onNavigate("springnote")}
              title={t("springNoteBoardMenu") || "Sprint Note"}
              className={`relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-150
                ${
                  activePage === "springnote"
                    ? "bg-indigo-500 text-white shadow-sm font-semibold"
                    : "bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-500/20"
                }`}
            >
              <BookOpen size={15} />
            </button>
          </div>
        ) : (
          !isTaskCollapsed && (
            <div className="px-1.5 mb-1.5 flex gap-1.5 shrink-0">
              {/* Memo Board Button */}
              <button
                onClick={() => onNavigate("memo")}
                className={`relative group flex-1 flex items-center justify-center py-2.5 text-sm rounded-lg transition-all duration-150
                  ${
                    activePage === "memo"
                      ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20 font-semibold"
                      : "bg-amber-500/10 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 dark:hover:bg-amber-500/25"
                  }`}
              >
                <StickyNote size={15} className="shrink-0" />
                {(memoCount ?? 0) > 0 && (
                  <span className="absolute -top-1 -right-1 text-[8px] bg-red-500 text-white rounded-full h-4 w-4 flex items-center justify-center font-bold shadow-sm">
                    {memoCount}
                  </span>
                )}

                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 text-[11px] font-medium text-white bg-slate-900/90 dark:bg-surface-950/95 backdrop-blur-sm rounded shadow-md opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 translate-y-1 transition-all duration-150 z-50 whitespace-nowrap border border-white/5">
                  {t("memoBoard") || "Memos"}
                  <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/90 dark:border-t-surface-950/95" />
                </span>
              </button>

              {/* TODO Board Button */}
              <button
                onClick={() => onNavigate("todo")}
                className={`relative group flex-1 flex items-center justify-center py-2.5 text-sm rounded-lg transition-all duration-150
                  ${
                    activePage === "todo"
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 font-semibold"
                      : "bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 dark:hover:bg-emerald-500/25"
                  }`}
              >
                <ListTodo size={15} className="shrink-0" />
                {todoStats && (todoStats.overdueCount > 0 || todoStats.dueTodayCount > 0) && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}

                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 text-[11px] font-medium text-white bg-slate-900/90 dark:bg-surface-950/95 backdrop-blur-sm rounded shadow-md opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 translate-y-1 transition-all duration-150 z-50 whitespace-nowrap border border-white/5">
                  {t("todoBoardMenu") || "TODO"}
                  <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/90 dark:border-t-surface-950/95" />
                </span>
              </button>

              {/* Calendar Board Button */}
              <button
                onClick={() => onNavigate("calendar")}
                className={`relative group flex-1 flex items-center justify-center py-2.5 text-sm rounded-lg transition-all duration-150
                  ${
                    activePage === "calendar"
                      ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 font-semibold"
                      : "bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-500/20 dark:hover:bg-indigo-500/25"
                  }`}
              >
                <Calendar size={15} className="shrink-0" />

                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 text-[11px] font-medium text-white bg-slate-900/90 dark:bg-surface-950/95 backdrop-blur-sm rounded shadow-md opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 translate-y-1 transition-all duration-150 z-50 whitespace-nowrap border border-white/5">
                  {t("calendarMenu") || "Calendar"}
                  <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/90 dark:border-t-surface-950/95" />
                </span>
              </button>

              {/* MindMap Board Button */}
              <button
                onClick={() => onNavigate("mindmap")}
                className={`relative group flex-1 flex items-center justify-center py-2.5 text-sm rounded-lg transition-all duration-150
                  ${
                    activePage === "mindmap"
                      ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20 font-semibold"
                      : "bg-purple-500/10 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400 hover:bg-purple-500/20 dark:hover:bg-purple-500/25"
                  }`}
              >
                <GitBranch size={15} className="shrink-0" />

                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 text-[11px] font-medium text-white bg-slate-900/90 dark:bg-surface-950/95 backdrop-blur-sm rounded shadow-md opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 translate-y-1 transition-all duration-150 z-50 whitespace-nowrap border border-white/5">
                  {t("mindMapBoardMenu") || "Mind Map"}
                  <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/90 dark:border-t-surface-950/95" />
                </span>
              </button>

              {/* SpringNote Board Button */}
              <button
                onClick={() => onNavigate("springnote")}
                className={`relative group flex-1 flex items-center justify-center py-2.5 text-sm rounded-lg transition-all duration-150
                  ${
                    activePage === "springnote"
                      ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 font-semibold"
                      : "bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-500/20 dark:hover:bg-indigo-500/25"
                  }`}
              >
                <BookOpen size={15} className="shrink-0" />

                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 text-[11px] font-medium text-white bg-slate-900/90 dark:bg-surface-950/95 backdrop-blur-sm rounded shadow-md opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 translate-y-1 transition-all duration-150 z-50 whitespace-nowrap border border-white/5">
                  {t("springNoteBoardMenu") || "Sprint Note"}
                  <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/90 dark:border-t-surface-950/95" />
                </span>
              </button>
            </div>
          )
        )}

        {/* 폴더 트리 섹션 */}
        {!isCollapsed && (
          <div className="flex flex-col shrink-0 min-h-0">
            <div 
              className="flex flex-col overflow-hidden min-h-0"
              style={{ height: `${folderHeight}px` }}
            >
              <FolderTree
                bookmarks={bookmarks}
                folders={folders}
                selectedFolderId={selectedFolderId}
                activePage={activePage}
                onNavigate={onNavigate}
                onRefresh={onRefresh}
                maxFolderDepth={maxFolderDepth}
                t={t}
                lang={lang}
                showConfirm={showConfirm}
              />
            </div>
            {/* 세로 크기 조절 핸들 */}
            <div
              onMouseDown={handleFolderResizeMouseDown}
              className="h-1.5 hover:h-2 bg-transparent hover:bg-indigo-500/20 dark:hover:bg-indigo-500/40 cursor-ns-resize transition-all shrink-0 flex items-center justify-center border-b border-gray-200/50 dark:border-surface-800/50 group"
              title="Drag to resize folders panel"
            >
              <div className="w-8 h-[2px] bg-gray-300 dark:bg-surface-700 rounded-full opacity-40 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        )}

        {/* Memory Saver Panel */}
        <div className="shrink-0">
          <MemorySaverPanel
            isCollapsed={isCollapsed}
            isMemorySaverCollapsed={isMemorySaverCollapsed}
            onToggleCollapse={handleToggleMemorySaver}
            t={t}
          />
        </div>

        {/* Control Center & Task Control */}
        {isCollapsed ? (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-surface-700 flex flex-col items-center w-full shrink-0">
            <button
              onClick={() => onNavigate("taskcontrol")}
              className={`relative group flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-150 cursor-pointer
                ${
                  activePage === "taskcontrol"
                    ? "bg-violet-500/15 text-violet-600 dark:text-violet-300 font-semibold"
                    : "text-gray-600 dark:text-gray-400 hover:text-violet-700 dark:hover:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                }`}
              title={t("taskControlMenu") || "Task Control"}
            >
              <Activity size={15} className="shrink-0" />
              {taskCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                </span>
              )}
            </button>
          </div>
        ) : (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-surface-700 space-y-0.5 px-1.5 pb-2 shrink-0">
            <span className="text-[10px] uppercase tracking-[0.15em] text-gray-400 dark:text-gray-600 font-semibold px-2 mb-1 block">
              Control
            </span>
            <button
              onClick={() => onNavigate("taskcontrol")}
              className={`relative flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg transition-all duration-150 cursor-pointer
                ${
                  activePage === "taskcontrol"
                    ? "bg-violet-500/15 text-violet-600 dark:text-violet-300 font-semibold"
                    : "text-gray-600 dark:text-gray-400 hover:text-violet-700 dark:hover:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                }`}
            >
              <Activity size={15} className="shrink-0" />
              {t("taskControlMenu") || "Task Control"}
              {taskCount > 0 && (
                <span className="ml-auto flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                </span>
              )}
            </button>
          </div>
        )}

        {/* Trending Panel */}
        <div className="shrink-0">
          <TrendingPanel
            isCollapsed={isCollapsed}
            isTrendingCollapsed={isTrendingCollapsed}
            onToggleCollapse={handleToggleTrending}
            activePage={activePage}
            onNavigate={onNavigate}
            showGitHubRankingMenu={showGitHubRankingMenu}
            showWikiRankingMenu={showWikiRankingMenu}
            showHFRankingMenu={showHFRankingMenu}
            showHNRankingMenu={showHNRankingMenu}
            t={t}
          />
        </div>
        </div>

        {/* Quote Panel (Footer) */}
        <QuotePanel isCollapsed={isCollapsed} lang={lang} />
      </aside>

      {/* AI Cleaner Modal */}
      {aiCleanerOpen && (
        <AICleanerModal
          bookmarks={bookmarks}
          folders={folders}
          onClose={() => setAiCleanerOpen(false)}
          onRefresh={onRefresh}
        />
      )}
    </>
  );
}
