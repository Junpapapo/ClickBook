import React, { useState, useRef, useEffect, useMemo, useCallback, memo } from "react";
import {
  Home,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  Plus,
  Trash2,
  Pencil,
  GripVertical,
  FolderPlus,
  Check,
  X,
  Sparkles,
  Loader2,
  Lock,
  LockOpen,
  StickyNote,
  Trophy,
  Book,
  Newspaper,
  ScanSearch,
  Activity,
  ListTodo,
  Tag,
  Tags,
  Map as MapIcon,
  Shield,
  Layers,
  Calendar,
  RefreshCw,
  Copy,
} from "lucide-react";
import { buildFolderTree, getLocalizedFolderName } from "@/shared/categories";
import type { FolderTreeNode } from "@/shared/categories";
import type { Bookmark, Folder, PageId } from "@/shared/types";
import ChromeBookmarkPanel from "@/components/ChromeBookmarkPanel";
import { isAIAvailable } from "@/shared/categorizer";
import { useDialog } from "@/shared/useDialog";
import { useLang } from "@/shared/LanguageContext";
import AICleanerModal from "@/components/AICleanerModal";
import { getRandomQuote } from "@/shared/quotes";
import type { Quote } from "@/shared/quotes";

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
}

const COLOR_DOT: Record<string, string> = {
  blue: "bg-blue-400",
  purple: "bg-purple-400",
  amber: "bg-amber-400",
  rose: "bg-rose-400",
  cyan: "bg-cyan-400",
  green: "bg-green-400",
  sky: "bg-sky-400",
  gray: "bg-gray-400",
  indigo: "bg-indigo-400",
};

import { FolderIcon } from "./DynamicIcon";
import { IconPicker } from "./IconPicker";

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
}: Props) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("clickbook_sidebar_collapsed") === "true";
    }
    return false;
  });

  const [quote, setQuote] = useState<Quote | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setQuote(getRandomQuote());
  }, []);

  const handleRefreshQuote = () => {
    setQuote(getRandomQuote());
  };

  const handleCopyQuote = () => {
    if (!quote) return;
    const textToCopy = `"${quote.text}" — ${quote.author || "Unknown"}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

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

  const [creatingUnder, setCreatingUnder] = useState<string | null | false>(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [dragOverInfo, setDragOverInfo] = useState<{ id: string; position: "before" | "inside" | "after" } | null>(null);
  const dragItemId = useRef<string | null>(null);
  const dragType = useRef<"folder" | "bookmark" | null>(null);
  const [newFolderIcon, setNewFolderIcon] = useState("📁");
  const [renameIcon, setRenameIcon] = useState("📁");
  const [showPicker, setShowPicker] = useState<"create" | "rename" | null>(null);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [aiCleanerOpen, setAiCleanerOpen] = useState(false);
  const [organizeResult, setOrganizeResult] = useState<{
    movedCount: number;
    total: number;
    backupName: string;
    aiSuccessCount?: number;
    aiTotalBatches?: number;
    aiSupported?: boolean;
  } | null>(null);
  const { showConfirm, DialogEl } = useDialog();
  const { t, lang } = useLang();

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

  // ── Memory Saver (Tab Suspender) States & Handlers ──────
  const [suspendedCount, setSuspendedCount] = useState(0);
  const [autoSuspendTime, setAutoSuspendTime] = useState(0);
  const [autoResume, setAutoResume] = useState(false);

  const updateSuspendedCount = () => {
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: "GET_SUSPEND_COUNT" }, (res) => {
        if (res && res.success) {
          setSuspendedCount((res.data as number) || 0);
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

    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
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

  useEffect(() => { onAiLoadingChange?.(isOrganizing); }, [isOrganizing, onAiLoadingChange]);

  useEffect(() => {
    async function checkAI() {
      const available = await isAIAvailable();
      setAiAvailable(available);
    }
    checkAI();

    // 팝업에서 AI 토글 시 실시간 반영
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

  useEffect(() => {
    if (!organizeResult) return;
    const t = setTimeout(() => setOrganizeResult(null), 6000);
    return () => clearTimeout(t);
  }, [organizeResult]);

  const counts = bookmarks.reduce<Record<string, number>>((acc, b) => {
    acc[b.folderId] = (acc[b.folderId] ?? 0) + 1;
    return acc;
  }, {});

  const tree = buildFolderTree(folders, counts);

  const foldersMap = useMemo(() => {
    const map = new Map<string, Folder>();
    folders.forEach((f) => map.set(f.id, f));
    return map;
  }, [folders]);

  /** フォルダーの深さを返す（トップレベル=1） */
  const getFolderDepth = useCallback((folderId: string): number => {
    let depth = 0;
    let current: string | null = folderId;
    const visited = new Set<string>();
    while (current) {
      if (visited.has(current)) {
        break;
      }
      visited.add(current);
      depth++;
      const f = foldersMap.get(current);
      current = f?.parentId ?? null;
    }
    return depth;
  }, [foldersMap]);

  /** 자식인지 확인 (순환 방지) */
  const isDescendantOf = useCallback((targetId: string, folderId: string): boolean => {
    let current: string | null = targetId;
    const visited = new Set<string>();
    while (current) {
      if (visited.has(current)) {
        break;
      }
      visited.add(current);
      if (current === folderId) return true;
      const f = foldersMap.get(current);
      current = f?.parentId ?? null;
    }
    return false;
  }, [foldersMap]);

  // ── AI 자동 정리 ──────────────────────────


  async function handleAIOrganize() {
    const confirmed = await showConfirm(
      t("aiConfirmMsg"),
      t("aiConfirmBtn"),
      "Cancel",
      "info"
    );
    if (!confirmed) return;
    setIsOrganizing(true);
    try {
      await new Promise<void>((resolve) => {
        // 포트를 열면 Service Worker가 슬립하지 않고 작업 완료까지 실행됨
        const port = chrome.runtime.connect({ name: "ai-reorganize" });

        // 5분 안전 타임아웃
        const timer = setTimeout(() => {
          try { port.disconnect(); } catch (_) { /* ignore */ }
          resolve();
        }, 5 * 60 * 1000);

        port.onMessage.addListener((msg: {
          type: string;
          movedCount?: number;
          total?: number;
          backupName?: string;
          aiSuccessCount?: number;
          aiTotalBatches?: number;
          aiSupported?: boolean;
        }) => {
          if (msg.type === "done") {
            clearTimeout(timer);
            if (msg.movedCount !== undefined) {
              setOrganizeResult({
                movedCount: msg.movedCount,
                total: msg.total ?? 0,
                backupName: msg.backupName ?? "",
                aiSuccessCount: msg.aiSuccessCount,
                aiTotalBatches: msg.aiTotalBatches,
                aiSupported: msg.aiSupported,
              });
            }
            onRefresh();
            try { port.disconnect(); } catch (_) { /* ignore */ }
            resolve();
          } else if (msg.type === "error") {
            clearTimeout(timer);
            try { port.disconnect(); } catch (_) { /* ignore */ }
            resolve();
          }
        });

        port.onDisconnect.addListener(() => {
          clearTimeout(timer);
          resolve();
        });
      });
    } finally {
      setIsOrganizing(false);
    }
  }


  // ── フォルダー作成 ───────────────────────────

  async function handleCreateFolder() {
    const name = newFolderName.trim();
    if (!name) return;
    // 深さチェック（creatingUnder が null = ルート作成 = depth 1）
    const parentDepth = typeof creatingUnder === "string" ? getFolderDepth(creatingUnder) : 0;
    if (parentDepth + 1 > maxFolderDepth) {
      await showConfirm(
        t("maxDepthError", { n: maxFolderDepth }),
        "OK",
        "",
        "warn"
      );
      return;
    }
    await chrome.runtime.sendMessage({
      type: "CREATE_FOLDER",
      name,
      parentId: creatingUnder === false ? null : creatingUnder,
      icon: newFolderIcon,
    });
    setCreatingUnder(false);
    setNewFolderName("");
    setNewFolderIcon("📁");
    setShowPicker(null);
    onRefresh();
  }

  // ── フォルダーリネーム ──────────────────────

  async function handleRename() {
    const name = renameValue.trim();
    if (!name || !renamingId) return;
    await chrome.runtime.sendMessage({ type: "RENAME_FOLDER", id: renamingId, name, icon: renameIcon });
    setRenamingId(null);
    setRenameValue("");
    setShowPicker(null);
    onRefresh();
  }

  // ── フォルダー削除 ──────────────────────────

  async function handleDelete(id: string) {
    const count = counts[id] ?? 0;
    const msg = count > 0
      ? t("folderDeleteWithBookmarks", { n: count })
      : t("folderDeleteConfirm");
    if (!await showConfirm(msg, t("deleteTooltip"), t("cancelBtn"), "warn")) return;
    await chrome.runtime.sendMessage({ type: "DELETE_FOLDER", id });
    if (selectedFolderId === id) onNavigate("dashboard");
    onRefresh();
  }

  // ── 折り畳み ────────────────────────────────

  async function handleToggle(id: string) {
    await chrome.runtime.sendMessage({ type: "TOGGLE_FOLDER", id });
    onRefresh();
  }

  async function handleCollapseAll() {
    await chrome.runtime.sendMessage({ type: "COLLAPSE_ALL_FOLDERS" });
    onRefresh();
  }

  async function handleToggleLock(id: string) {
    await chrome.runtime.sendMessage({ type: "TOGGLE_FOLDER_LOCK", id });
    onRefresh();
  }

  // ── Drag & Drop ─────────────────────────────

  function onDragStart(e: React.DragEvent, id: string, type: "folder" | "bookmark") {
    dragItemId.current = id;
    dragType.current = type;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  }

  function onDragOver(e: React.DragEvent, folderId: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;
    
    // Determine target position based on mouse position within the folder element
    let position: "before" | "inside" | "after" = "inside";
    if (y < height * 0.3) position = "before";
    else if (y > height * 0.7) position = "after";

    if (!dragOverInfo || dragOverInfo.id !== folderId || dragOverInfo.position !== position) {
      setDragOverInfo({ id: folderId, position });
    }
  }

  function onDragLeave(e: React.DragEvent) {
    if (e.relatedTarget && e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOverInfo(null);
  }

  async function onDrop(e: React.DragEvent, targetFolderId: string) {
    e.preventDefault();
    const dropInfo = dragOverInfo;
    setDragOverInfo(null);

    // Chrome パネルからの D&D
    const chromeData = e.dataTransfer.getData("application/x-clickbook-chrome-bookmark");
    if (chromeData) {
      try {
        const item = JSON.parse(chromeData) as { url: string; title: string };
        await chrome.runtime.sendMessage({
          type: "BULK_IMPORT_CHROME",
          items: [item],
          folderId: targetFolderId,
        });
      } catch (err) {
        console.warn("Operation failed:", err);
      }
      dragItemId.current = null;
      dragType.current = null;
      onRefresh();
      return;
    }

    // Sidebar内フォルダーD&DはrefからID取得、BookmarkCardはdataTransferから取得
    const id = dragItemId.current ?? e.dataTransfer.getData("text/plain");
    const transferType = e.dataTransfer.getData("application/x-clickbook-type");
    const type = dragType.current ?? (transferType === "bookmark" ? "bookmark" : null);

    dragItemId.current = null;
    dragType.current = null;

    if (!id || !type) return;

    if (type === "bookmark") {
      await chrome.runtime.sendMessage({
        type: "MOVE_BOOKMARK",
        id,
        folderId: targetFolderId,
      });
    } else if (type === "folder" && id !== targetFolderId) {
      // 순환 방지: 자기 자신이나 자신의 자손으로 이동 불가
      if (isDescendantOf(targetFolderId, id)) return;

      let targetParentId: string | null = targetFolderId;
      let targetOrder = 999;

      if (dropInfo && dropInfo.position !== "inside") {
        const targetFolder = folders.find(f => f.id === targetFolderId);
        if (targetFolder) {
          targetParentId = targetFolder.parentId;
          // When inserted before, use the same order (splice pushes the others down).
          // When inserted after, use order + 1.
          targetOrder = dropInfo.position === "before" ? targetFolder.order : targetFolder.order + 1;
        }
      }

      await chrome.runtime.sendMessage({
        type: "MOVE_FOLDER",
        id,
        parentId: targetParentId,
        order: targetOrder,
      });
    }
    onRefresh();
  }

  // ── メイン描画 ──────────────────────────────

  return (
    <>
      {DialogEl}
      <aside className={`relative group/sidebar bg-white dark:bg-surface-900 border-r border-gray-200 dark:border-surface-700 flex flex-col shrink-0 overflow-x-hidden transition-all duration-300 ease-in-out ${isCollapsed ? "w-16" : "w-60"}`}>
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

      {/* Chrome ブックマークパネル */}
      {!isCollapsed && showChromePanel && <ChromeBookmarkPanel onRefresh={onRefresh} />}

      {/* 대시보드 홈 버튼 (로고 바로 아래 단독 배치) */}
      <div className="px-1.5 mt-2 mb-1.5 flex justify-center">
        {isCollapsed ? (
          <button
            onClick={() => onNavigate("dashboard")}
            title={t("dashboard")}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-150 border
              ${activePage === "dashboard"
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
                ${activePage === "dashboard"
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
        className={`px-3 pt-3 pb-1.5 border-t border-gray-200/50 dark:border-surface-800/50 mt-1 flex justify-center
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

      {/* AI 자동 정리 (80:20 split) 및 기타 북마크 도구들 */}
      {isCollapsed ? (
        <div className="flex flex-col items-center gap-2.5 w-full">
          {/* 자동 태깅 */}
          <button
            disabled={!aiAvailable || isOrganizing}
            onClick={onAutoTag}
            title={t("autoTagTooltip") || "자동 태깅"}
            className={`
              relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200
              ${aiAvailable && !isOrganizing
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
            title={!aiAvailable ? t("aiNotAvailable") : t("aiOrganizeTooltip")}
            className={`
              relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200
              ${aiAvailable && !isOrganizing
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
              ${isOrganizing
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
              ${activePage === "tagboard"
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
              ${activePage === "map"
                ? "bg-blue-500 text-white shadow-sm font-semibold"
                : "bg-blue-500/10 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20 font-medium"
              }`}
          >
            <MapIcon size={15} />
          </button>
        </div>
      ) : (
        !isBookmarkCollapsed && (
          <>
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
                {/* Tooltip */}
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 text-[11px] font-medium text-white bg-slate-900/90 dark:bg-surface-950/95 backdrop-blur-sm rounded shadow-md opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 translate-y-1 transition-all duration-150 z-50 whitespace-nowrap border border-white/5">
                  {t("autoTagTooltip") || "자동 태깅"}
                  <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/90 dark:border-t-surface-950/95" />
                </span>
              </button>

              {/* 오른쪽 80%: AI Organize 버튼 */}
              <button
                disabled={!aiAvailable || isOrganizing}
                onClick={handleAIOrganize}
                title={
                  !aiAvailable
                    ? t("aiNotAvailable")
                    : t("aiOrganizeTooltip")
                }
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
                  {isOrganizing ? t("aiOrganizing") : t("aiOrganize")}
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
              const { movedCount, total, backupName, aiSuccessCount, aiTotalBatches, aiSupported } = organizeResult;
              
              let title = t("aiOrganizeDone");
              let desc = t("aiResult", { moved: movedCount, total: total });
              let bgClass = "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/50";
              let textTitleClass = "text-emerald-700 dark:text-emerald-400";
              let textDescClass = "text-emerald-600 dark:text-emerald-500";
              
              if (aiSupported === false) {
                // Local fallback
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
              } else if (aiSuccessCount !== undefined && aiTotalBatches !== undefined && aiTotalBatches > 0) {
                if (aiSuccessCount === 0) {
                  // Complete parser failure
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
                  // Partial success
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
                      {t("backupPrefix")}{backupName}
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
                  <span className={`text-[9px] rounded px-1.5 py-0.5 shrink-0 font-semibold tracking-wide ${
                    aiAvailable
                      ? "bg-white/25 text-white"
                      : "bg-gray-200 dark:bg-surface-700 text-gray-400 dark:text-gray-500"
                  }`}>
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
                  ${activePage === "tagboard"
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
                  ${activePage === "map"
                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20 font-semibold"
                    : "bg-blue-500/10 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20 dark:hover:bg-blue-500/25 font-medium"
                  }`}
              >
                <MapIcon size={13} className="shrink-0" />
                <span className="truncate leading-none font-medium">{t("bookmarkMap") || "Bookmark Map"}</span>
              </button>
            </div>
          </>
        )
      )}

      {/* 📅 TASK Section */}
      <div
        onClick={!isCollapsed ? handleToggleTask : undefined}
        className={`px-3 pt-3 pb-1.5 border-t border-gray-200/50 dark:border-surface-800/50 mt-1 flex justify-center
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
              ${activePage === "memo"
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
            className={`relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-150 relative
              ${activePage === "todo"
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
              ${activePage === "calendar"
                ? "bg-indigo-500 text-white shadow-sm font-semibold"
                : "bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-500/20"
              }`}
          >
            <Calendar size={15} />
          </button>
        </div>
      ) : (
        !isTaskCollapsed && (
          <div className="px-1.5 mb-1.5 flex gap-1.5">
            {/* Memo Board Button */}
            <button
              onClick={() => onNavigate("memo")}
              className={`relative group flex-1 flex items-center justify-center py-2.5 text-sm rounded-lg transition-all duration-150
                ${activePage === "memo"
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
              
              {/* Custom Tooltip */}
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 text-[11px] font-medium text-white bg-slate-900/90 dark:bg-surface-950/95 backdrop-blur-sm rounded shadow-md opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 translate-y-1 transition-all duration-150 z-50 whitespace-nowrap border border-white/5">
                {t("memoBoard") || "Memos"}
                <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/90 dark:border-t-surface-950/95" />
              </span>
            </button>

            {/* TODO Board Button */}
            <button
              onClick={() => onNavigate("todo")}
              className={`relative group flex-1 flex items-center justify-center py-2.5 text-sm rounded-lg transition-all duration-150
                ${activePage === "todo"
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

              {/* Custom Tooltip */}
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 text-[11px] font-medium text-white bg-slate-900/90 dark:bg-surface-950/95 backdrop-blur-sm rounded shadow-md opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 translate-y-1 transition-all duration-150 z-50 whitespace-nowrap border border-white/5">
                {t("todoBoardMenu") || "TODO"}
                <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/90 dark:border-t-surface-950/95" />
              </span>
            </button>

            {/* Calendar Board Button */}
            <button
              onClick={() => onNavigate("calendar")}
              className={`relative group flex-1 flex items-center justify-center py-2.5 text-sm rounded-lg transition-all duration-150
                ${activePage === "calendar"
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 font-semibold"
                  : "bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-500/20 dark:hover:bg-indigo-500/25"
                }`}
            >
              <Calendar size={15} className="shrink-0" />

              {/* Custom Tooltip */}
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 text-[11px] font-medium text-white bg-slate-900/90 dark:bg-surface-950/95 backdrop-blur-sm rounded shadow-md opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 translate-y-1 transition-all duration-150 z-50 whitespace-nowrap border border-white/5">
                {t("calendarMenu") || "Calendar"}
                <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/90 dark:border-t-surface-950/95" />
              </span>
            </button>
          </div>
        )
      )}

      {/* セクションヘッダー */}
      {!isCollapsed && (
        <>
          <div className="px-4 pt-4 pb-2 flex items-center justify-between group">
            <h3 className="text-xs font-bold text-gray-600 dark:text-gray-300 tracking-wider flex-1">
              {t("folders")}
            </h3>
            <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleCollapseAll}
                title={t("collapseAll") || "Collapse All"}
                className="p-1 text-gray-500 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
              >
                <ChevronsUp size={14} />
              </button>
              <button
                onClick={() => {
                  setCreatingUnder(null);
                  setNewFolderName("");
                }}
                title={t("addRootFolderTooltip")}
                className="p-1 text-gray-500 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {creatingUnder === null && (
            <div className="relative flex items-center gap-1 mx-1.5 mb-1 rounded-lg bg-gray-50 dark:bg-surface-800 px-3 py-1.5">
              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => setShowPicker(showPicker === "create" ? null : "create")}
                className="shrink-0 text-sm leading-none hover:bg-gray-100 dark:hover:bg-surface-700 rounded p-0.5 transition-colors"
              >
                <FolderIcon iconName={newFolderIcon} />
              </button>
              {showPicker === "create" && (
                <IconPicker onSelect={(ic) => { setNewFolderIcon(ic); setShowPicker(null); }} onClose={() => setShowPicker(null)} className="left-0" />
              )}
              <input
                autoFocus
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateFolder();
                  if (e.key === "Escape") { setCreatingUnder(false); setShowPicker(null); }
                }}
                placeholder={t("folderNamePlaceholder")}
                className="flex-1 min-w-0 bg-gray-100 dark:bg-surface-700 border border-gray-300 dark:border-surface-600 rounded px-2 py-1 text-xs text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:border-indigo-500"
              />
              <button onClick={handleCreateFolder} className="text-emerald-500 dark:text-emerald-400 hover:text-emerald-400 dark:hover:text-emerald-300">
                <Check size={13} />
              </button>
              <button onClick={() => setCreatingUnder(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <X size={13} />
              </button>
            </div>
          )}
        </>
      )}

      {/* フォルダーツリー */}
      <nav className="flex-1 overflow-y-auto py-1 space-y-0.5 bg-gray-50 dark:bg-surface-950 border-t border-gray-200 dark:border-surface-700">
        {!isCollapsed && tree.map((node) => (
          <SidebarFolderNode
            key={node.folder.id}
            node={node}
            depth={0}
            activePage={activePage}
            selectedFolderId={selectedFolderId}
            renamingId={renamingId}
            setRenamingId={setRenamingId}
            renameValue={renameValue}
            setRenameValue={setRenameValue}
            renameIcon={renameIcon}
            setRenameIcon={setRenameIcon}
            showPicker={showPicker}
            setShowPicker={setShowPicker}
            creatingUnder={creatingUnder}
            setCreatingUnder={setCreatingUnder}
            newFolderName={newFolderName}
            setNewFolderName={setNewFolderName}
            newFolderIcon={newFolderIcon}
            setNewFolderIcon={setNewFolderIcon}
            dragOverInfo={dragOverInfo}
            maxFolderDepth={maxFolderDepth}
            lang={lang}
            t={t}
            onNavigate={onNavigate}
            onRefresh={onRefresh}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            handleToggle={handleToggle}
            handleToggleLock={handleToggleLock}
            handleDelete={handleDelete}
            handleRename={handleRename}
            handleCreateFolder={handleCreateFolder}
            getFolderDepth={getFolderDepth}
          />
        ))}

        {/* Memory Saver (Tab Suspender) Widget */}
        {isCollapsed ? (
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
          ) : (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-surface-700">
            <div
              onClick={handleToggleMemorySaver}
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
                    <span className={`h-2 w-2 rounded-full ${suspendedCount > 0 ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`}></span>
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
                      <label htmlFor="auto-suspend-delay" className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 flex items-center justify-between">
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
                        <div className={`w-7 h-4 rounded-full transition-colors duration-200 ${
                          autoResume ? "bg-emerald-500 dark:bg-emerald-600" : "bg-gray-300 dark:bg-surface-700"
                        }`}></div>
                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-200 shadow-sm ${
                          autoResume ? "transform translate-x-3" : ""
                        }`}></div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Task Control Center 메뉴 */}
        {isCollapsed ? (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-surface-700 flex flex-col items-center w-full">
            <button
              onClick={() => onNavigate("taskcontrol")}
              className={`relative group flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-150 cursor-pointer
                ${activePage === "taskcontrol"
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
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-surface-700 space-y-0.5 px-1.5 pb-2">
            <span className="text-[10px] uppercase tracking-[0.15em] text-gray-400 dark:text-gray-600 font-semibold px-2 mb-1 block">
              Control
            </span>
            <button
              onClick={() => onNavigate("taskcontrol")}
              className={`relative flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg transition-all duration-150 cursor-pointer
                ${activePage === "taskcontrol"
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

        {/* 랭킹 메뉴 */}
        {isCollapsed ? (
          <div className="pt-4 border-t border-gray-200/50 dark:border-surface-700/50 flex flex-col items-center gap-2 w-full pb-4">
            {showGitHubRankingMenu && (
              <button
                onClick={() => onNavigate("github")}
                className={`relative group flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-150 cursor-pointer
                  ${activePage === "github"
                    ? "bg-blue-50/15 text-blue-700 dark:text-blue-300 font-semibold"
                    : "text-gray-600 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  }`}
                title={t("githubRanking")}
              >
                <Trophy size={15} className="shrink-0" />
              </button>
            )}
            {showWikiRankingMenu && (
              <button
                onClick={() => onNavigate("wiki")}
                className={`relative group flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-150 cursor-pointer
                  ${activePage === "wiki"
                    ? "bg-blue-50/15 text-blue-600 dark:text-blue-300 font-semibold"
                    : "text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10"
                  }`}
                title={t("wikiRanking")}
              >
                <Book size={15} className="shrink-0" />
              </button>
            )}
            {showHFRankingMenu && (
              <button
                onClick={() => onNavigate("hf")}
                className={`relative group flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-150 cursor-pointer
                  ${activePage === "hf"
                    ? "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 font-semibold"
                    : "text-gray-600 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/10"
                  }`}
                title={t("hfRanking")}
              >
                <Sparkles size={15} className="shrink-0" />
              </button>
            )}
            {showHNRankingMenu && (
              <button
                onClick={() => onNavigate("hn")}
                className={`relative group flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-150 cursor-pointer
                  ${activePage === "hn"
                    ? "bg-orange-500/15 text-orange-700 dark:text-orange-300 font-semibold"
                    : "text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/10"
                  }`}
                title={t("hnRanking")}
              >
                <Newspaper size={15} className="shrink-0" />
              </button>
            )}
          </div>
        ) : (
          <div className="pt-2 border-t border-gray-200/50 dark:border-surface-700/50">
            <div
              onClick={handleToggleTrending}
              className="px-3 pb-1.5 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-surface-800/30 select-none text-[10px] uppercase tracking-[0.15em] text-gray-400 dark:text-gray-600 font-semibold"
            >
              <span>Trending</span>
              {isTrendingCollapsed ? (
                <ChevronRight size={10} className="text-gray-400 dark:text-gray-600" />
              ) : (
                <ChevronDown size={10} className="text-gray-400 dark:text-gray-600" />
              )}
            </div>

            {!isTrendingCollapsed && (
              <div className="space-y-0.5 px-1.5 pb-4 mt-1">
                {showGitHubRankingMenu && (
                  <button
                    onClick={() => onNavigate("github")}
                    className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg transition-all duration-150 cursor-pointer
                      ${activePage === "github"
                        ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 font-semibold"
                        : "text-gray-600 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      }`}
                  >
                    <Trophy size={15} className="shrink-0" />
                    {t("githubRanking")}
                  </button>
                )}
                {showWikiRankingMenu && (
                  <button
                    onClick={() => onNavigate("wiki")}
                    className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg transition-all duration-150 cursor-pointer
                      ${activePage === "wiki"
                        ? "bg-blue-500/15 text-blue-600 dark:text-blue-300 font-semibold"
                        : "text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10"
                      }`}
                  >
                    <Book size={15} className="shrink-0" />
                    {t("wikiRanking")}
                  </button>
                )}
                {showHFRankingMenu && (
                  <button
                    onClick={() => onNavigate("hf")}
                    className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg transition-all duration-150 cursor-pointer
                      ${activePage === "hf"
                        ? "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 font-semibold"
                        : "text-gray-600 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/10"
                      }`}
                  >
                    <Sparkles size={15} className="shrink-0" />
                    {t("hfRanking")}
                  </button>
                )}
                {showHNRankingMenu && (
                  <button
                    onClick={() => onNavigate("hn")}
                    className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg transition-all duration-150 cursor-pointer
                      ${activePage === "hn"
                        ? "bg-orange-500/15 text-orange-700 dark:text-orange-300 font-semibold"
                        : "text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/10"
                      }`}
                  >
                    <Newspaper size={15} className="shrink-0" />
                    {t("hnRanking")}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

      </nav>

      {/* フッター */}
      {!isCollapsed && quote && (
        <div className="relative group/quote px-3 py-2 border-t border-gray-200 dark:border-surface-700 shrink-0 bg-gray-50/30 dark:bg-surface-800/10 rounded-b-lg transition-colors hover:bg-gray-100/40 dark:hover:bg-surface-800/20">
          {/* Action Buttons (Refresh & Copy) */}
          <div className="absolute right-1 top-1 flex items-center gap-1 opacity-0 group-hover/quote:opacity-100 transition-opacity duration-200">
            <button
              onClick={handleCopyQuote}
              title={lang === "ko" ? "명언 복사" : lang === "ja" ? "名言をコピー" : "Copy Quote"}
              className="p-0.5 rounded bg-white dark:bg-surface-800 shadow-sm border border-gray-200 dark:border-surface-700 text-gray-400 dark:text-gray-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            >
              {copied ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
            </button>
            <button
              onClick={handleRefreshQuote}
              title={lang === "ko" ? "다른 명언 보기" : lang === "ja" ? "他の名言を見る" : "Refresh Quote"}
              className="p-0.5 rounded bg-white dark:bg-surface-800 shadow-sm border border-gray-200 dark:border-surface-700 text-gray-400 dark:text-gray-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            >
              <RefreshCw size={10} />
            </button>
          </div>

          <p className="text-[10px] text-gray-500 dark:text-gray-400 italic text-center font-medium leading-normal pr-5 select-text selection:bg-indigo-500/20">
            "{quote.text}"
          </p>
          {quote.author && (
            <p className="text-[9px] text-gray-400 dark:text-gray-500 text-center mt-0.5 font-semibold select-text selection:bg-indigo-500/20">
              — {quote.author}
            </p>
          )}
        </div>
      )}
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

interface SidebarFolderNodeProps {
  node: FolderTreeNode;
  depth: number;
  activePage: PageId;
  selectedFolderId: string | null;
  renamingId: string | null;
  setRenamingId: (id: string | null) => void;
  renameValue: string;
  setRenameValue: (val: string) => void;
  renameIcon: string;
  setRenameIcon: (val: string) => void;
  showPicker: "create" | "rename" | null;
  setShowPicker: (val: "create" | "rename" | null) => void;
  creatingUnder: string | null | false;
  setCreatingUnder: (val: string | null | false) => void;
  newFolderName: string;
  setNewFolderName: (val: string) => void;
  newFolderIcon: string;
  setNewFolderIcon: (val: string) => void;
  dragOverInfo: { id: string; position: "before" | "inside" | "after" } | null;
  maxFolderDepth: number;
  lang: string;
  t: any;
  onNavigate: (page: PageId, folderId?: string | null) => void;
  onRefresh: () => void;
  onDragStart: (e: React.DragEvent, id: string, type: "folder" | "bookmark") => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  handleToggle: (id: string) => void;
  handleToggleLock: (id: string) => void;
  handleDelete: (id: string) => void;
  handleRename: () => void;
  handleCreateFolder: () => void;
  getFolderDepth: (id: string) => number;
}

const SidebarFolderNode: React.FC<SidebarFolderNodeProps> = memo(({
  node,
  depth,
  activePage,
  selectedFolderId,
  renamingId,
  setRenamingId,
  renameValue,
  setRenameValue,
  renameIcon,
  setRenameIcon,
  showPicker,
  setShowPicker,
  creatingUnder,
  setCreatingUnder,
  newFolderName,
  setNewFolderName,
  newFolderIcon,
  setNewFolderIcon,
  dragOverInfo,
  maxFolderDepth,
  lang,
  t,
  onNavigate,
  onRefresh,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  handleToggle,
  handleToggleLock,
  handleDelete,
  handleRename,
  handleCreateFolder,
  getFolderDepth,
}) => {
  const f = node.folder;
  const isActive = activePage === "folder" && selectedFolderId === f.id;
  const hasChildren = node.children.length > 0;
  const isRenaming = renamingId === f.id;
  const isDragOverInfo = dragOverInfo?.id === f.id ? dragOverInfo : null;
  const dotColor = COLOR_DOT[f.color] ?? "bg-gray-400";

  return (
    <div key={f.id} className="relative">
      {/* Drop "before" indicator */}
      {isDragOverInfo?.position === "before" && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-indigo-500 z-10 mx-2 rounded-full" />
      )}

      <div
        draggable={true}
        onDragStart={(e) => onDragStart(e, f.id, "folder")}
        onDragOver={(e) => onDragOver(e, f.id)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, f.id)}
        onClick={() => {
          onNavigate("folder", f.id);
          if (hasChildren) handleToggle(f.id);
        }}
        className={`
          group flex items-center gap-1.5 pr-2 py-1.5 text-sm cursor-pointer
          transition-all duration-150 rounded-lg mx-1.5
          ${isActive ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-surface-800"}
          ${isDragOverInfo?.position === "inside" ? "ring-2 ring-indigo-500/50 bg-indigo-500/10" : ""}
        `}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <GripVertical
          size={12}
          className="opacity-0 group-hover:opacity-40 shrink-0 cursor-grab"
        />

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) handleToggle(f.id);
          }}
          className="w-4 h-4 flex items-center justify-center shrink-0"
        >
          {hasChildren ? (
            f.collapsed ? (
              <ChevronRight size={13} className="text-gray-400 dark:text-gray-600" />
            ) : (
              <ChevronDown size={13} className="text-gray-400 dark:text-gray-600" />
            )
          ) : (
            <span className="w-[5px] h-[5px] rounded-full block" />
          )}
        </button>

        {!isRenaming && (
          <FolderIcon iconName={f.icon} fallbackColorClass={dotColor} />
        )}

        {isRenaming ? (
          <div className="relative flex items-center gap-1 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => { setRenameIcon(f.icon ?? "📁"); setShowPicker(showPicker === "rename" ? null : "rename"); }}
              className="shrink-0 text-sm leading-none hover:bg-gray-100 dark:hover:bg-surface-700 rounded p-0.5 transition-colors"
            >
              <FolderIcon iconName={renameIcon || f.icon || "📁"} />
            </button>
            {showPicker === "rename" && (
              <IconPicker onSelect={(ic) => { setRenameIcon(ic); setShowPicker(null); }} onClose={() => setShowPicker(null)} className="left-0 -translate-x-1/4" />
            )}
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") { setRenamingId(null); setShowPicker(null); }
              }}
              className="flex-1 min-w-0 bg-gray-100 dark:bg-surface-700 border border-gray-300 dark:border-surface-600 rounded px-1.5 py-0.5 text-xs text-gray-800 dark:text-gray-200 outline-none focus:border-indigo-500"
            />
            <button onClick={handleRename} className="text-emerald-500 dark:text-emerald-400 hover:text-emerald-400 dark:hover:text-emerald-300">
              <Check size={12} />
            </button>
            <button onClick={() => setRenamingId(null)} className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              <X size={12} />
            </button>
          </div>
        ) : (
          <span
            className="truncate flex-1 min-w-0 font-medium text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors"
            onDoubleClick={(e) => {
              if (f.id === "other") return;
              e.stopPropagation();
              setRenamingId(f.id);
              setRenameValue(f.name);
              setRenameIcon(!/^[A-Za-z0-9_]+$/.test(f.icon ?? "") ? (f.icon ?? "📁") : "📁");
            }}
            title={f.id === "other" ? undefined : t("doubleClickRename")}
          >
            {getLocalizedFolderName(f, lang)}
          </span>
        )}

        {!isRenaming && node.bookmarkCount > 0 && (
          <span className="text-[10px] bg-gray-100 dark:bg-surface-700 text-gray-500 rounded-full px-1.5 py-0.5 min-w-[18px] text-center shrink-0">
            {node.bookmarkCount}
          </span>
        )}

        {(f.locked || f.id === "other") && !isRenaming && (
          <Lock size={10} className="text-amber-500 shrink-0 group-hover:hidden" />
        )}

        {f.secure && !isRenaming && (
          <span className="shrink-0 group-hover:hidden" title={t("secureFolderTooltip")}>
            <Shield size={10} className="text-emerald-500 fill-emerald-500/25 animate-pulse" />
          </span>
        )}

        {!isRenaming && (
          <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
            {f.id !== "other" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  chrome.runtime.sendMessage({ type: "TOGGLE_FOLDER_SECURE", id: f.id }).then(() => onRefresh());
                }}
                title={f.secure ? t("secureToggleOff") : t("secureToggleOn")}
                className={`p-0.5 transition-colors ${
                  f.secure
                    ? "text-emerald-500 hover:text-emerald-400"
                    : "text-gray-400 dark:text-gray-600 hover:text-emerald-500 dark:hover:text-emerald-400"
                }`}
              >
                <Shield size={11} className={f.secure ? "fill-current" : ""} />
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                chrome.runtime.sendMessage({ type: "OPEN_FOLDER_AS_TAB_GROUP", folderId: f.id });
              }}
              title={t("openAsTabGroup")}
              className="p-0.5 text-gray-400 dark:text-gray-600 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
            >
              <Layers size={11} />
            </button>

            {f.id !== "other" ? (
              <button
                onClick={(e) => { e.stopPropagation(); handleToggleLock(f.id); }}
                title={f.locked ? t("unlockTooltip") : t("lockTooltip")}
                className={`p-0.5 transition-colors ${
                  f.locked
                    ? "text-amber-500 hover:text-amber-400"
                    : "text-gray-400 dark:text-gray-600 hover:text-amber-500 dark:hover:text-amber-400"
                }`}
              >
                {f.locked ? <Lock size={11} /> : <LockOpen size={11} />}
              </button>
            ) : (
              <div className="p-0.5 text-amber-500 cursor-not-allowed" title={
                lang === "ko" ? "기본 폴더는 이름 변경이나 삭제가 불가능합니다." :
                lang === "ja" ? "デフォルトフォルダーの名前変更や削除はできません。" :
                "Default folders cannot be renamed or deleted."
              }>
                <Lock size={11} />
              </div>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCreatingUnder(f.id);
                setNewFolderName("");
              }}
              title={getFolderDepth(f.id) >= maxFolderDepth ? t("maxDepthTooltip", { n: maxFolderDepth }) : t("addSubfolderTooltip")}
              disabled={getFolderDepth(f.id) >= maxFolderDepth}
              className="p-0.5 text-gray-400 dark:text-gray-600 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <FolderPlus size={12} />
            </button>
            {f.id !== "other" && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setRenamingId(f.id);
                    setRenameValue(f.name);
                  }}
                  title={t("renameTooltip")}
                  className="p-0.5 text-gray-400 dark:text-gray-600 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
                >
                  <Pencil size={11} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(f.id);
                  }}
                  title={t("deleteTooltip")}
                  className="p-0.5 text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  <Trash2 size={11} />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {creatingUnder === f.id && (
        <div
          className="flex items-center gap-1 mx-1.5 my-1 rounded-lg bg-gray-50 dark:bg-surface-800 px-2 py-1.5 relative"
          style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
        >
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => setShowPicker(showPicker === "create" ? null : "create")}
            className="shrink-0 text-sm leading-none hover:bg-gray-100 dark:hover:bg-surface-700 rounded p-0.5 transition-colors"
          >
            <FolderIcon iconName={newFolderIcon} />
          </button>
          {showPicker === "create" && (
            <IconPicker onSelect={(ic) => { setNewFolderIcon(ic); setShowPicker(null); }} onClose={() => setShowPicker(null)} className="left-0 -translate-x-1/4" />
          )}
          <input
            autoFocus
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateFolder();
              if (e.key === "Escape") { setCreatingUnder(false); setShowPicker(null); }
            }}
            placeholder={t("folderNamePlaceholder")}
            className="flex-1 min-w-0 bg-gray-100 dark:bg-surface-700 border border-gray-300 dark:border-surface-600 rounded px-2 py-1 text-xs text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:border-indigo-500"
          />
          <button onClick={handleCreateFolder} className="text-emerald-500 dark:text-emerald-400 hover:text-emerald-400 dark:hover:text-emerald-300">
            <Check size={13} />
          </button>
          <button onClick={() => setCreatingUnder(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <X size={13} />
          </button>
        </div>
      )}

      {/* Drop "after" indicator */}
      {isDragOverInfo?.position === "after" && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 z-10 mx-2 rounded-full" />
      )}

      {!f.collapsed && node.children.map((child) => (
        <SidebarFolderNode
          key={child.folder.id}
          node={child}
          depth={depth + 1}
          activePage={activePage}
          selectedFolderId={selectedFolderId}
          renamingId={renamingId}
          setRenamingId={setRenamingId}
          renameValue={renameValue}
          setRenameValue={setRenameValue}
          renameIcon={renameIcon}
          setRenameIcon={setRenameIcon}
          showPicker={showPicker}
          setShowPicker={setShowPicker}
          creatingUnder={creatingUnder}
          setCreatingUnder={setCreatingUnder}
          newFolderName={newFolderName}
          setNewFolderName={setNewFolderName}
          newFolderIcon={newFolderIcon}
          setNewFolderIcon={setNewFolderIcon}
          dragOverInfo={dragOverInfo}
          maxFolderDepth={maxFolderDepth}
          lang={lang}
          t={t}
          onNavigate={onNavigate}
          onRefresh={onRefresh}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          handleToggle={handleToggle}
          handleToggleLock={handleToggleLock}
          handleDelete={handleDelete}
          handleRename={handleRename}
          handleCreateFolder={handleCreateFolder}
          getFolderDepth={getFolderDepth}
        />
      ))}
    </div>
  );
});


