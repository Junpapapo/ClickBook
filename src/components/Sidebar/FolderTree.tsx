import React, { useState, useRef, useMemo, useCallback, memo } from "react";
import {
  ChevronRight,
  ChevronDown,
  ChevronsUp,
  Plus,
  Trash2,
  Pencil,
  GripVertical,
  FolderPlus,
  Check,
  X,
  Lock,
  LockOpen,
  Shield,
  Layers,
} from "lucide-react";
import { buildFolderTree, getLocalizedFolderName } from "@/shared/categories";
import type { FolderTreeNode } from "@/shared/categories";
import type { Bookmark, Folder, PageId } from "@/shared/types";
import { FolderIcon } from "../DynamicIcon";
import { IconPicker } from "../IconPicker";

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

interface FolderTreeProps {
  bookmarks: Bookmark[];
  folders: Folder[];
  selectedFolderId: string | null;
  activePage: PageId;
  onNavigate: (page: PageId, folderId?: string | null) => void;
  onRefresh: () => void;
  maxFolderDepth?: number;
  t: (key: string, params?: any) => string;
  lang: string;
  showConfirm: (
    msg: string,
    okLabel?: string,
    cancelLabel?: string,
    type?: "info" | "warn" | "error"
  ) => Promise<boolean>;
}

export default function FolderTree({
  bookmarks,
  folders,
  selectedFolderId,
  activePage,
  onNavigate,
  onRefresh,
  maxFolderDepth = 3,
  t,
  lang,
  showConfirm,
}: FolderTreeProps) {
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

  const counts = useMemo(() => {
    return bookmarks.reduce<Record<string, number>>((acc, b) => {
      acc[b.folderId] = (acc[b.folderId] ?? 0) + 1;
      return acc;
    }, {});
  }, [bookmarks]);

  const tree = useMemo(() => buildFolderTree(folders, counts), [folders, counts]);

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

  // ── フォルダー作成 ───────────────────────────
  async function handleCreateFolder() {
    const name = newFolderName.trim();
    if (!name) return;
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
      if (isDescendantOf(targetFolderId, id)) return;

      let targetParentId: string | null = targetFolderId;
      let targetOrder = 999;

      if (dropInfo && dropInfo.position !== "inside") {
        const targetFolder = folders.find(f => f.id === targetFolderId);
        if (targetFolder) {
          targetParentId = targetFolder.parentId;
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

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between group shrink-0">
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
        <div className="relative flex items-center gap-1 mx-1.5 mb-1 rounded-lg bg-gray-50 dark:bg-surface-800 px-3 py-1.5 shrink-0">
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => setShowPicker(showPicker === "create" ? null : "create")}
            className="shrink-0 text-sm leading-none hover:bg-gray-100 dark:hover:bg-surface-700 rounded p-0.5 transition-colors"
          >
            <FolderIcon iconName={newFolderIcon} />
          </button>
          {showPicker === "create" && (
            <IconPicker
              onSelect={(ic) => {
                setNewFolderIcon(ic);
                setShowPicker(null);
              }}
              onClose={() => setShowPicker(null)}
              className="left-0"
            />
          )}
          <input
            autoFocus
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateFolder();
              if (e.key === "Escape") {
                setCreatingUnder(false);
                setShowPicker(null);
              }
            }}
            placeholder={t("folderNamePlaceholder")}
            className="flex-1 min-w-0 bg-gray-100 dark:bg-surface-700 border border-gray-300 dark:border-surface-600 rounded px-2 py-1 text-xs text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:border-indigo-500"
          />
          <button
            onClick={handleCreateFolder}
            className="text-emerald-500 dark:text-emerald-400 hover:text-emerald-400 dark:hover:text-emerald-300"
          >
            <Check size={13} />
          </button>
          <button
            onClick={() => setCreatingUnder(false)}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* フォルダーツリー */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-1 space-y-0.5 bg-gray-55 dark:bg-surface-950 border-t border-gray-250 dark:border-surface-700 min-h-0 pr-1 sidebar-custom-scroll">
        {tree.map((node) => (
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
      </nav>
    </div>
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

const SidebarFolderNode: React.FC<SidebarFolderNodeProps> = memo(
  ({
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
            ${
              isActive
                ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-surface-800"
            }
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
            <div
              className="relative flex items-center gap-1 flex-1 min-w-0"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => {
                  setRenameIcon(f.icon ?? "📁");
                  setShowPicker(showPicker === "rename" ? null : "rename");
                }}
                className="shrink-0 text-sm leading-none hover:bg-gray-100 dark:hover:bg-surface-700 rounded p-0.5 transition-colors"
              >
                <FolderIcon iconName={renameIcon || f.icon || "📁"} />
              </button>
              {showPicker === "rename" && (
                <IconPicker
                  onSelect={(ic) => {
                    setRenameIcon(ic);
                    setShowPicker(null);
                  }}
                  onClose={() => setShowPicker(null)}
                  className="left-0 -translate-x-1/4"
                />
              )}
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename();
                  if (e.key === "Escape") {
                    setRenamingId(null);
                    setShowPicker(null);
                  }
                }}
                className="flex-1 min-w-0 bg-gray-100 dark:bg-surface-700 border border-gray-300 dark:border-surface-600 rounded px-1.5 py-0.5 text-xs text-gray-800 dark:text-gray-200 outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleRename}
                className="text-emerald-500 dark:text-emerald-400 hover:text-emerald-400 dark:hover:text-emerald-300"
              >
                <Check size={12} />
              </button>
              <button
                onClick={() => setRenamingId(null)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
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
            <span
              className="shrink-0 group-hover:hidden"
              title={t("secureFolderTooltip")}
            >
              <Shield
                size={10}
                className="text-emerald-500 fill-emerald-500/25 animate-pulse"
              />
            </span>
          )}

          {!isRenaming && (
            <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
              {f.id !== "other" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    chrome.runtime
                      .sendMessage({ type: "TOGGLE_FOLDER_SECURE", id: f.id })
                      .then(() => onRefresh());
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
                  chrome.runtime.sendMessage({
                    type: "OPEN_FOLDER_AS_TAB_GROUP",
                    folderId: f.id,
                  });
                }}
                title={t("openAsTabGroup")}
                className="p-0.5 text-gray-400 dark:text-gray-600 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
              >
                <Layers size={11} />
              </button>

              {f.id !== "other" ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleLock(f.id);
                  }}
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
                <div
                  className="p-0.5 text-amber-500 cursor-not-allowed"
                  title={
                    lang === "ko"
                      ? "기본 폴더는 이름 변경이나 삭제가 불가능합니다."
                      : lang === "ja"
                      ? "デフォルトフォルダーの名前変更や削除はできません。"
                      : "Default folders cannot be renamed or deleted."
                  }
                >
                  <Lock size={11} />
                </div>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCreatingUnder(f.id);
                  setNewFolderName("");
                }}
                title={
                  getFolderDepth(f.id) >= maxFolderDepth
                    ? t("maxDepthTooltip", { n: maxFolderDepth })
                    : t("addSubfolderTooltip")
                }
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
              <IconPicker
                onSelect={(ic) => {
                  setNewFolderIcon(ic);
                  setShowPicker(null);
                }}
                onClose={() => setShowPicker(null)}
                className="left-0 -translate-x-1/4"
              />
            )}
            <input
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateFolder();
                if (e.key === "Escape") {
                  setCreatingUnder(false);
                  setShowPicker(null);
                }
              }}
              placeholder={t("folderNamePlaceholder")}
              className="flex-1 min-w-0 bg-gray-100 dark:bg-surface-700 border border-gray-300 dark:border-surface-600 rounded px-2 py-1 text-xs text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleCreateFolder}
              className="text-emerald-500 dark:text-emerald-400 hover:text-emerald-400 dark:hover:text-emerald-300"
            >
              <Check size={13} />
            </button>
            <button
              onClick={() => setCreatingUnder(false)}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* Drop "after" indicator */}
        {isDragOverInfo?.position === "after" && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 z-10 mx-2 rounded-full" />
        )}

        {!f.collapsed &&
          node.children.map((child) => (
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
  }
);
