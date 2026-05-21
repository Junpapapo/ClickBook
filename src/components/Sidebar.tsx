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
  Book,
  Newspaper,
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
  onSelectWikiRanking?: () => void;
  onSelectHFRanking?: () => void;
  onSelectHNRanking?: () => void;
  maxFolderDepth?: number;
  onAiLoadingChange?: (loading: boolean) => void;
}

const COLOR_DOT: Record<string, string> = {
  yellow: "bg-amber-400",
  blue: "bg-blue-400",
  green: "bg-emerald-400",
  pink: "bg-rose-400",
  purple: "bg-violet-400",
  white: "bg-gray-200 dark:bg-surface-400",
};

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
  onSelectWikiRanking,
  onSelectHFRanking,
  onSelectHNRanking,
  maxFolderDepth = 3,
  onAiLoadingChange,
}: Props) {
  const [creatingUnder, setCreatingUnder] = useState<string | null | false>(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState("");
  const [expandedFolders, setEditExpandedFolders] = useState<Set<string>>(new Set(["root"]));
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [showAIStatus, setShowAIStatus] = useState(false);

  const { showConfirm, DialogEl } = useDialog();
  const { t, lang } = useLang();

  const tree = buildFolderTree(folders);

  useEffect(() => {
    if (selectedFolderId) {
      const path: string[] = [];
      let currId: string | null = selectedFolderId;
      while (currId) {
        path.push(currId);
        const folder = folders.find((f) => f.id === currId);
        currId = folder?.parentId || null;
      }
      setEditExpandedFolders((prev) => {
        const next = new Set(prev);
        path.forEach((id) => next.add(id));
        return next;
      });
    }
  }, [selectedFolderId, folders]);

  const toggleExpand = (id: string) => {
    setEditExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddFolder = async () => {
    if (!newFolderName.trim()) return;
    const parentId = creatingUnder === "root" ? null : (creatingUnder as string);
    await chrome.runtime.sendMessage({ type: "ADD_FOLDER", name: newFolderName.trim(), parentId });
    setNewFolderName("");
    setCreatingUnder(false);
    onRefresh();
  };

  const handleDeleteFolder = async (id: string, name: string) => {
    if (await showConfirm(t("deleteConfirm", { title: name }), t("deleteTooltip"))) {
      await chrome.runtime.sendMessage({ type: "DELETE_FOLDER", id });
      onRefresh();
    }
  };

  const handleRenameFolder = async (id: string) => {
    if (!editFolderName.trim()) return;
    await chrome.runtime.sendMessage({ type: "UPDATE_FOLDER", id, name: editFolderName.trim() });
    setEditingFolderId(null);
    onRefresh();
  };

  const handleAIOrganize = async () => {
    if (!await isAIAvailable()) {
      alert("AI feature is not available in this browser environment.");
      return;
    }
    setIsOrganizing(true);
    onAiLoadingChange?.(true);
    try {
      await chrome.runtime.sendMessage({ type: "ORGANIZE_AI" });
      setShowAIStatus(true);
      setTimeout(() => setShowAIStatus(false), 3000);
    } finally {
      setIsOrganizing(false);
      onAiLoadingChange?.(false);
      onRefresh();
    }
  };

  const renderTree = (nodes: FolderTreeNode[], depth: number) => {
    return nodes.map((node) => {
      const isExpanded = expandedFolders.has(node.id);
      const isSelected = selectedFolderId === node.id;
      const isEditing = editingFolderId === node.id;
      const canCreateSub = depth < maxFolderDepth;

      return (
        <div key={node.id} className="select-none">
          <div
            className={`group flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer transition-all duration-150 ${
              isSelected
                ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-surface-800"
            }`}
            onClick={() => onSelect(node.id)}
          >
            <div
              className="p-0.5 hover:bg-gray-200 dark:hover:bg-surface-700 rounded transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(node.id);
              }}
            >
              {node.children.length > 0 ? (
                isExpanded ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )
              ) : (
                <div className="w-3.5" />
              )}
            </div>

            {isEditing ? (
              <input
                autoFocus
                className="flex-1 bg-white dark:bg-surface-700 border border-indigo-400 rounded px-1.5 py-0.5 text-xs outline-none shadow-inner"
                value={editFolderName}
                onChange={(e) => setEditFolderName(e.target.value)}
                onBlur={() => handleRenameFolder(node.id)}
                onKeyDown={(e) => e.key === "Enter" && handleRenameFolder(node.id)}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="flex-1 truncate text-xs font-medium">
                {getLocalizedFolderName(node, lang)}
                <span className="ml-1.5 text-[10px] opacity-40">
                  ({bookmarks.filter((b) => b.folderId === node.id).length})
                </span>
              </span>
            )}

            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
              {canCreateSub && (
                <button
                  className="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-surface-700 rounded shadow-sm"
                  title={t("addFolderTooltip")}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCreatingUnder(node.id);
                  }}
                >
                  <Plus size={12} />
                </button>
              )}
              <button
                className="p-1 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-white dark:hover:bg-surface-700 rounded shadow-sm"
                title={t("renameTooltip")}
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingFolderId(node.id);
                  setEditFolderName(getLocalizedFolderName(node, lang));
                }}
              >
                <Pencil size={12} />
              </button>
              <button
                className="p-1 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-surface-700 rounded shadow-sm"
                title={t("deleteTooltip")}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteFolder(node.id, getLocalizedFolderName(node, lang));
                }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>

          {isExpanded && node.children.length > 0 && (
            <div className="ml-3 border-l border-gray-150 dark:border-surface-800 mt-0.5">
              {renderTree(node.children, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <>
    {DialogEl}
    <aside className="w-64 border-r border-gray-200 dark:border-surface-700 bg-gray-50/50 dark:bg-surface-900/50 flex flex-col h-full">
      {/* 메인 메뉴 */}
      <div className="p-4 space-y-1 shrink-0">
        <button
          onClick={() => onSelect(null)}
          className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg transition-all duration-150 ${
            !selectedFolderId && !showMemoBoard && !onSelectGitHubRanking
              ? "bg-white dark:bg-surface-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-200 dark:border-surface-700 font-semibold"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-surface-800"
          }`}
        >
          <Home size={16} className="shrink-0" />
          {t("dashboard")}
        </button>

        {onSelectMemoBoard && (
          <button
            onClick={onSelectMemoBoard}
            className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg transition-all duration-150 ${
              showMemoBoard
                ? "bg-white dark:bg-surface-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-200 dark:border-surface-700 font-semibold"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-surface-800"
            }`}
          >
            <div className="relative">
              <StickyNote size={16} className="shrink-0" />
              {memoCount !== undefined && memoCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full border border-white dark:border-surface-900 shadow-sm" />
              )}
            </div>
            {t("memoBoard")}
          </button>
        )}

        <button
          onClick={handleAIOrganize}
          disabled={isOrganizing}
          className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg transition-all duration-150 group overflow-hidden relative ${
            isOrganizing
              ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-400"
              : "text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
          }`}
        >
          {isOrganizing ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Sparkles size={16} className="text-indigo-500 group-hover:scale-110 transition-transform" />
          )}
          <span className="font-medium">{showAIStatus ? t("aiOrganizeDone") : t("aiOrganize")}</span>
          {isOrganizing && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
          )}
        </button>
      </div>

      {/* 폴더 리스트 영역 */}
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5 custom-scrollbar">
        <div className="px-2 pb-1 flex items-center justify-between group">
          <span className="text-[10px] uppercase tracking-[0.15em] text-gray-400 dark:text-gray-600 font-semibold">
            {t("folders")}
          </span>
          <button
            onClick={() => setCreatingUnder("root")}
            className="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-surface-800 rounded opacity-0 group-hover:opacity-100 transition-all"
            title={t("addRootFolderTooltip")}
          >
            <FolderPlus size={13} />
          </button>
        </div>

        {creatingUnder === "root" && (
          <div className="px-2 py-1.5 flex items-center gap-2 animate-in slide-in-from-top-1">
            <input
              autoFocus
              placeholder={t("newFolderPlaceholder")}
              className="flex-1 bg-white dark:bg-surface-800 border border-indigo-300 dark:border-indigo-600 rounded px-2 py-1 text-xs outline-none shadow-sm"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddFolder()}
            />
            <button
              onClick={handleAddFolder}
              className="p-1 bg-indigo-600 text-white rounded hover:bg-indigo-500 shadow-sm"
            >
              <Check size={12} />
            </button>
            <button
              onClick={() => setCreatingUnder(false)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {renderTree(tree, 1)}

        {/* 랭킹 메뉴 (폴더 뷰 밑으로 이동) */}
        <div className="mt-6 pt-4 border-t border-gray-150 dark:border-surface-800 space-y-1 px-2">
          <span className="text-[10px] uppercase tracking-[0.15em] text-gray-400 dark:text-gray-600 font-semibold px-2 mb-1 block">
            Trending
          </span>
          {onSelectGitHubRanking && (
            <button
              onClick={onSelectGitHubRanking}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg transition-all duration-150 text-gray-500 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              <Trophy size={14} className="shrink-0" />
              {t("githubRanking")}
            </button>
          )}
          {onSelectWikiRanking && (
            <button
              onClick={onSelectWikiRanking}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg transition-all duration-150 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10"
            >
              <Book size={14} className="shrink-0" />
              {t("wikiRanking")}
            </button>
          )}
          {onSelectHFRanking && (
            <button
              onClick={onSelectHFRanking}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg transition-all duration-150 text-gray-500 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/10"
            >
              <Sparkles size={14} className="shrink-0" />
              {t("hfRanking")}
            </button>
          )}
          {onSelectHNRanking && (
            <button
              onClick={onSelectHNRanking}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg transition-all duration-150 text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/10"
            >
              <Newspaper size={14} className="shrink-0" />
              {t("hnRanking")}
            </button>
          )}
        </div>
      </div>

      {/* 하단 유틸리티 */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-surface-700 shrink-0">
        <p className="text-[10px] text-gray-400 dark:text-gray-700 text-center">
          {t("dropToOrganize")}
        </p>
      </div>
    </aside>
    </>
  );
}
