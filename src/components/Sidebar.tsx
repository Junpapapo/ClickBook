import { useState, useRef, useEffect } from "react";
import {
  Home,
  ChevronRight,
  ChevronDown,
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
} from "lucide-react";
import { buildFolderTree, getLocalizedFolderName } from "@/shared/categories";
import type { FolderTreeNode } from "@/shared/categories";
import type { Bookmark, Folder } from "@/shared/types";
import ChromeBookmarkPanel from "@/components/ChromeBookmarkPanel";
import { isAIAvailable } from "@/shared/categorizer";
import { useDialog } from "@/shared/useDialog";
import { useLang } from "@/shared/LanguageContext";

interface Props {
  bookmarks: Bookmark[];
  folders: Folder[];
  selectedFolderId: string | null;
  onSelect: (id: string | null) => void;
  onRefresh: () => void;
  showChromePanel?: boolean;
  showMemoBoard?: boolean;
  memoCount?: number;
  onSelectMemoBoard?: () => void;
  onSelectGitHubRanking?: () => void;
  maxFolderDepth?: number;
  onAiLoadingChange?: (loading: boolean) => void;
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

const FOLDER_ICONS = [
  "📁","📂","🗂️","💼","📚","📖","📝","📌","🏠",
  "⭐","🔧","🎮","🎨","🎵","🎬","📷","🎯","💡",
  "🔬","📊","🌐","🚀","💻","📱","🔒","🛡️","❤️",
  "💙","💚","🌟","🏷️","🎁","📋","🔑","🌈","⚡",
];

function IconPicker({ onSelect }: { onSelect: (icon: string) => void }) {
  return (
    <div className="absolute left-0 top-full mt-1 z-50 bg-white dark:bg-surface-800 border border-gray-200 dark:border-surface-600 rounded-lg p-1.5 grid grid-cols-9 gap-0.5 shadow-xl">
      {FOLDER_ICONS.map((ic) => (
        <button
          key={ic}
          type="button"
          onClick={() => onSelect(ic)}
          className="text-sm leading-none p-1 rounded hover:bg-gray-100 dark:hover:bg-surface-700 transition-colors"
        >
          {ic}
        </button>
      ))}
    </div>
  );
}

export default function Sidebar({
  bookmarks,
  folders,
  selectedFolderId,
  onSelect,
  onRefresh,
  showChromePanel = false,
  showMemoBoard = false,
  memoCount,
  onSelectMemoBoard,
  onSelectGitHubRanking,
  maxFolderDepth = 3,
  onAiLoadingChange,
}: Props) {
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
  const [organizeResult, setOrganizeResult] = useState<{ movedCount: number; total: number; backupName: string } | null>(null);
  const { showConfirm, DialogEl } = useDialog();
  const { t, lang } = useLang();

  useEffect(() => { onAiLoadingChange?.(isOrganizing); }, [isOrganizing, onAiLoadingChange]);

  useEffect(() => {
    async function checkAI() {
      const available = await isAIAvailable();
      setAiAvailable(available);
    }
    checkAI();
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

  /** フォルダーの深さを返す（トップレベル=1） */
  function getFolderDepth(folderId: string): number {
    let depth = 0;
    let current: string | null = folderId;
    while (current) {
      depth++;
      const f = folders.find((x) => x.id === current);
      current = f?.parentId ?? null;
    }
    return depth;
  }

  /** 자식인지 확인 (순환 방지) */
  function isDescendantOf(targetId: string, folderId: string): boolean {
    let current: string | null = targetId;
    while (current) {
      if (current === folderId) return true;
      const f = folders.find((x) => x.id === current);
      current = f?.parentId ?? null;
    }
    return false;
  }

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
        }) => {
          if (msg.type === "done") {
            clearTimeout(timer);
            if (msg.movedCount !== undefined) {
              setOrganizeResult({
                movedCount: msg.movedCount,
                total: msg.total ?? 0,
                backupName: msg.backupName ?? "",
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
    const parentDepth = creatingUnder && creatingUnder !== false ? getFolderDepth(creatingUnder) : 0;
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
    if (selectedFolderId === id) onSelect(null);
    onRefresh();
  }

  // ── 折り畳み ────────────────────────────────

  async function handleToggle(id: string) {
    await chrome.runtime.sendMessage({ type: "TOGGLE_FOLDER", id });
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

    setDragOverInfo({ id: folderId, position });
  }

  function onDragLeave(e: React.DragEvent) {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
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

  // ── ツリーノード描画 ────────────────────────

  function renderNode(node: FolderTreeNode, depth: number) {
    const f = node.folder;
    const isActive = selectedFolderId === f.id;
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

          {f.icon && !/^[A-Za-z0-9_]+$/.test(f.icon) ? (
            <span className="text-sm leading-none shrink-0">{f.icon}</span>
          ) : (
            <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
          )}

          {isRenaming ? (
            <div className="relative flex items-center gap-1 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => { setRenameIcon(!/^[A-Za-z0-9_]+$/.test(f.icon ?? "") ? (f.icon ?? "📁") : "📁"); setShowPicker(showPicker === "rename" ? null : "rename"); }}
                className="shrink-0 text-sm leading-none hover:bg-gray-100 dark:hover:bg-surface-700 rounded p-0.5 transition-colors"
              >
                {renameIcon || (!/^[A-Za-z0-9_]+$/.test(f.icon ?? "") ? f.icon : "📁") || "📁"}
              </button>
              {showPicker === "rename" && (
                <IconPicker onSelect={(ic) => { setRenameIcon(ic); setShowPicker(null); }} />
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
              className="truncate flex-1 min-w-0"
              onClick={() => onSelect(f.id)}
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

          {/* ロック済みインジケーター（非ホバー時のみ表示） */}
          {f.locked && !isRenaming && (
            <Lock size={10} className="text-amber-500 shrink-0 group-hover:hidden" />
          )}

          {!isRenaming && (
            <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
              {/* 鍵トグル */}
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
              onClick={() => setShowPicker(showPicker === "create" ? null : "create")}
              className="shrink-0 text-sm leading-none hover:bg-gray-100 dark:hover:bg-surface-700 rounded p-0.5 transition-colors"
            >
              {newFolderIcon}
            </button>
            {showPicker === "create" && (
              <IconPicker onSelect={(ic) => { setNewFolderIcon(ic); setShowPicker(null); }} />
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

        {!f.collapsed && node.children.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  }

  // ── メイン描画 ──────────────────────────────

  return (
    <>
      {DialogEl}
      <aside className="w-60 bg-white dark:bg-surface-900 border-r border-gray-200 dark:border-surface-700 flex flex-col shrink-0 overflow-hidden">
      {/* ヘッダー */}
      <div className="px-4 py-4 flex items-center justify-between shrink-0">
        <div
          className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform"
          onClick={() => window.location.reload()}
          title={t("pageTitle")}
        >
          <img src="/icons/icon128.png" alt="" className="w-6 h-6" />
          <span className="text-lg font-bold tracking-tight text-indigo-400">
            ClickBook
          </span>
        </div>
        <span className="text-[10px] text-gray-400 dark:text-gray-700 bg-gray-100 dark:bg-surface-800 rounded-full px-2 py-0.5">
          {bookmarks.length}
        </span>
      </div>

      {/* Chrome ブックマークパネル */}
      {showChromePanel && <ChromeBookmarkPanel onRefresh={onRefresh} />}

      {/* ホーム */}
      <div className="px-1.5 mt-2 mb-1">
        <button
          onClick={() => onSelect(null)}
          className={`
            flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg transition-all duration-150
            ${selectedFolderId === null
              ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 font-medium"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-surface-800"
            }
          `}
        >
          <Home size={15} />
          {t("dashboard")}
        </button>
      </div>

      {/* AI 自動整理 */}
      <div className="px-1.5 mb-2">
        <button
          disabled={!aiAvailable || isOrganizing}
          onClick={handleAIOrganize}
          title={
            !aiAvailable
              ? t("aiNotAvailable")
              : t("aiOrganizeTooltip")
          }
          className={`
            relative flex items-center gap-2.5 w-full px-3 py-2.5 text-sm rounded-lg font-medium
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
        {organizeResult && (
          <div className="mt-1.5 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/50 text-xs">
            <p className="text-emerald-700 dark:text-emerald-400 font-medium">{t("aiOrganizeDone")}</p>
            <p className="text-emerald-600 dark:text-emerald-500 mt-0.5">
              {t("aiResult", { moved: organizeResult.movedCount, total: organizeResult.total })}
            </p>
            <p className="text-emerald-500 dark:text-emerald-600 mt-0.5 truncate" title={organizeResult.backupName}>
              {t("backupPrefix")}{organizeResult.backupName}
            </p>
          </div>
        )}
      </div>

      {/* メモボード */}
      <div className="px-1.5 mb-1">
        <button
          onClick={onSelectMemoBoard}
          className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg transition-all duration-150
            ${showMemoBoard
              ? "bg-amber-400/15 text-amber-600 dark:text-amber-300 font-medium"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-surface-800"
            }`}
        >
          <StickyNote size={15} />
          {t("memoBoard")}
          {(memoCount ?? 0) > 0 && (
            <span className="ml-auto text-[10px] bg-gray-100 dark:bg-surface-700 text-gray-500 rounded-full px-1.5 py-0.5">
              {memoCount}
            </span>
          )}
        </button>
        {/* GitHubランキングボタン追加 */}
        {onSelectGitHubRanking && (
          <button
            onClick={onSelectGitHubRanking}
            className="flex items-center gap-2.5 w-full px-3 py-2 mt-1 text-sm rounded-lg transition-all duration-150 text-gray-600 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            <Trophy size={15} className="shrink-0" />
            {t("githubRanking")}
          </button>
        )}
      </div>

      {/* セクションヘッダー */}
      <div className="px-4 pt-3 pb-1.5 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.15em] text-gray-400 dark:text-gray-600 font-semibold">
          {t("folders")}
        </span>
        <button
          onClick={() => {
            setCreatingUnder(null);
            setNewFolderName("");
          }}
          title={t("addRootFolderTooltip")}
          className="p-0.5 text-gray-600 hover:text-indigo-400 transition-colors"
        >
          <Plus size={13} />
        </button>
      </div>

      {creatingUnder === null && (
        <div className="relative flex items-center gap-1 mx-1.5 mb-1 rounded-lg bg-gray-50 dark:bg-surface-800 px-3 py-1.5">
          <button
            type="button"
            onClick={() => setShowPicker(showPicker === "create" ? null : "create")}
            className="shrink-0 text-sm leading-none hover:bg-gray-100 dark:hover:bg-surface-700 rounded p-0.5 transition-colors"
          >
            {newFolderIcon}
          </button>
          {showPicker === "create" && (
            <IconPicker onSelect={(ic) => { setNewFolderIcon(ic); setShowPicker(null); }} />
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

      {/* フォルダーツリー */}
      <nav className="flex-1 overflow-y-auto py-1 space-y-0.5 bg-gray-50 dark:bg-surface-950 border-t border-gray-200 dark:border-surface-700">
        {tree.map((node) => renderNode(node, 0))}
      </nav>

      {/* フッター */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-surface-700 shrink-0">
        <p className="text-[10px] text-gray-400 dark:text-gray-700 text-center">
          {t("dropToOrganize")}
        </p>
      </div>
    </aside>
    </>
  );
}
