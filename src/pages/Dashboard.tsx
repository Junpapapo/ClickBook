import { useState, useRef, useEffect, useMemo } from "react";
import { Check, X, Pencil, Lock, LockOpen, Trash2, Wand2 } from "lucide-react";
import RecentWidget from "@/components/RecentWidget";
import RankingWidget from "@/components/RankingWidget";
import RecommendWidget from "@/components/RecommendWidget";
import CustomSearchArea from "@/components/CustomSearchArea";
import RecentReaderWidget from "@/components/RecentReaderWidget";
import { EditModal } from "@/components/BookmarkEditPanel";
import type { Bookmark, Folder, MemoMap, MessageResponse } from "@/shared/types";
import { useLang } from "@/shared/LanguageContext";
import { useDialog } from "@/shared/useDialog";
import { getLocalizedFolderName, DEFAULT_FOLDER_ID } from "@/shared/categories";
import { FolderIcon } from "@/components/DynamicIcon";
import { sendMsg } from "@/shared/utils";

interface Props {
  bookmarks: Bookmark[];
  folders: Folder[];
  memos: MemoMap;
  onSelectFolder: (id: string) => void;
  onRefresh: () => void;
  recentCount: number;
  rankingCount: number;
  recommendCount: number;
  searchQuery?: string;
  aiSearchQuery?: string;
  onAiLoadingChange?: (loading: boolean) => void;
  customSearchConfigs?: import("@/shared/types").CustomSearchConfig[];
  customPresets?: import("@/shared/types").CustomSearchConfig[];
  onSaveCustomSearchConfigs?: (configs: import("@/shared/types").CustomSearchConfig[], presets?: import("@/shared/types").CustomSearchConfig[]) => void;
}

const EMOJI_MAP: Record<string, string> = {
  technology: "💻",
  design: "🎨",
  business: "💼",
  entertainment: "🎬",
  science: "🔬",
  sports: "🏆",
  travel: "✈️",
  other: "📁",
};

export default function Dashboard({ bookmarks, folders, memos, recentCount, rankingCount, recommendCount, onSelectFolder, onRefresh, searchQuery, aiSearchQuery, onAiLoadingChange, customSearchConfigs = [], customPresets = [], onSaveCustomSearchConfigs }: Props) {
  const { t, lang } = useLang();
  const { showConfirm, DialogEl } = useDialog();
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [aiAvailable, setAiAvailable] = useState(false);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function checkAI() {
      try {
        const result = await chrome.storage.local.get("clickbook_ai_enabled");
        setAiAvailable(result.clickbook_ai_enabled === true);
      } catch (e) {
        setAiAvailable(false);
      }
    }
    checkAI();
  }, []);

  async function handleDelete(id: string) {
    const response = await sendMsg({
      type: "DELETE_BOOKMARK",
      id,
    });
    if (response.success) onRefresh();
  }

  async function handleDeleteFolder(id: string, name: string) {
    const count = countByFolder[id] ?? 0;
    const msg = count > 0
      ? t("folderDeleteWithBookmarks", { n: count })
      : t("folderDeleteConfirm");
    if (!await showConfirm(msg, t("deleteTooltip"), t("cancelBtn"), "warn")) return;
    await sendMsg({ type: "DELETE_FOLDER", id });
    onRefresh();
  }

  async function handleToggleLock(id: string) {
    await sendMsg({ type: "TOGGLE_FOLDER_LOCK", id });
    onRefresh();
  }

  const folderToRoot = useMemo(() => {
    const map: Record<string, string> = {};
    const getRoot = (id: string): string => {
      const f = folders.find(f => f.id === id);
      if (!f) return id; // Fallback
      if (f.parentId === null) return id;
      return getRoot(f.parentId);
    };
    for (const f of folders) {
      map[f.id] = getRoot(f.id);
    }
    return map;
  }, [folders]);

  const countByFolder = useMemo(() => {
    return bookmarks.reduce<Record<string, number>>((acc, b) => {
      const rootId = folderToRoot[b.folderId] || b.folderId;
      acc[rootId] = (acc[rootId] ?? 0) + 1;
      return acc;
    }, {});
  }, [bookmarks, folderToRoot]);

  const subfolderCountByFolder = useMemo(() => {
    return folders.reduce<Record<string, number>>((acc, f) => {
      if (f.parentId !== null) {
        acc[f.parentId] = (acc[f.parentId] ?? 0) + 1;
      }
      return acc;
    }, {});
  }, [folders]);

  function startRename(f: Folder) {
    setRenameValue(f.name);
    setRenamingFolderId(f.id);
    setTimeout(() => renameInputRef.current?.focus(), 30);
  }

  async function commitRename(folderId: string, original: string) {
    const v = renameValue.trim();
    if (v && v !== original) {
      await sendMsg({ type: "RENAME_FOLDER", id: folderId, name: v });
      onRefresh();
    }
    setRenamingFolderId(null);
  }

  // ルートフォルダーのみ表示
  const rootFolders = folders
    .filter((f) => f.parentId === null)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-col gap-8">
      {DialogEl}
      
      {/* AI 추천 검색 (엔터 쳐서 aiSearchQuery 있을 때만) */}
      {aiAvailable && aiSearchQuery && (
        <RecommendWidget keyword={aiSearchQuery} count={recommendCount} onRefresh={onRefresh} onLoadingChange={onAiLoadingChange} />
      )}

      {/* フォルダーサマリー */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-600 font-semibold mb-3">
          {t("folders")}
        </h2>
        <div className="grid grid-cols-4 xl:grid-cols-8 gap-2">
          {rootFolders.map((f) => {
            const count = countByFolder[f.id] ?? 0;
            const subCount = subfolderCountByFolder[f.id] ?? 0;
            const isRenaming = renamingFolderId === f.id;
            return (
              <div
                key={f.id}
                className="group relative flex flex-col items-center gap-1.5 p-3 bg-white dark:bg-surface-800 hover:bg-gray-50 dark:hover:bg-surface-700 border border-gray-200 dark:border-surface-700 hover:border-indigo-300 dark:hover:border-indigo-500/30 rounded-xl transition-all shadow-sm dark:shadow-none cursor-pointer select-none"
                onClick={() => { if (!isRenaming) onSelectFolder(f.id); }}
              >
                {!isRenaming && (
                  f.id === DEFAULT_FOLDER_ID ? (
                    <div
                      className="absolute top-1.5 left-1.5 p-0.5 rounded opacity-100 text-amber-500 cursor-not-allowed"
                      title="기본 폴더는 이름 변경이나 삭제가 불가능합니다."
                    >
                      <Lock size={10} />
                    </div>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleLock(f.id); }}
                      className={`absolute top-1.5 left-1.5 p-0.5 rounded transition-all ${
                        f.locked
                          ? "opacity-100 text-amber-500 hover:text-amber-400"
                          : "opacity-0 group-hover:opacity-100 text-gray-400 dark:text-gray-500 hover:text-amber-500 dark:hover:text-amber-400"
                      }`}
                      title={f.locked ? t("dashboardUnlockTooltip") : t("dashboardLockTooltip")}
                    >
                      {f.locked ? <Lock size={10} /> : <LockOpen size={10} />}
                    </button>
                  )
                )}
                {!isRenaming && (
                  <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={(e) => { e.stopPropagation(); startRename(f); }}
                      className="p-0.5 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all"
                      title={t("dashboardRenameTooltip")}
                    >
                      <Pencil size={10} className="text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400" />
                    </button>

                    {f.id !== DEFAULT_FOLDER_ID && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteFolder(f.id, f.name); }}
                        className="p-0.5 rounded hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all"
                        title={t("deleteTooltip")}
                      >
                        <Trash2 size={10} className="text-gray-400 hover:text-rose-500 dark:hover:text-rose-400" />
                      </button>
                    )}
                  </div>
                )}
                <div className="relative flex justify-center items-center h-8">
                  <FolderIcon 
                    iconName={f.icon || EMOJI_MAP[f.id] || "📂"} 
                    size={22} 
                    className="text-[22px] text-gray-700 dark:text-gray-200" 
                  />
                  {subCount > 0 && (
                    <span className="absolute -top-1 -right-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-[9px] font-bold px-1 py-0.5 rounded-full leading-none shadow-[0_0_2px_rgba(0,0,0,0.1)]">
                      {subCount}
                    </span>
                  )}
                </div>
                {isRenaming ? (
                  <div
                    className="flex flex-col items-center gap-1 w-full"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      ref={renameInputRef}
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitRename(f.id, f.name);
                        if (e.key === "Escape") setRenamingFolderId(null);
                      }}
                      onBlur={() => commitRename(f.id, f.name)}
                      className="w-full text-center text-[11px] bg-transparent border-b border-indigo-500 text-gray-800 dark:text-gray-100 outline-none"
                    />
                    <div className="flex items-center gap-1">
                      <button
                        onMouseDown={(e) => { e.preventDefault(); commitRename(f.id, f.name); }}
                        className="text-emerald-500 hover:text-emerald-400"
                      >
                        <Check size={12} />
                      </button>
                      <button
                        onMouseDown={(e) => { e.preventDefault(); setRenamingFolderId(null); }}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate w-full text-center mt-1">
                      {getLocalizedFolderName(f, lang)}
                    </span>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                      {count}
                    </span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Custom Search */}
      {onSaveCustomSearchConfigs && (
        <section>
          <CustomSearchArea 
            configs={customSearchConfigs} 
            customPresets={customPresets}
            onSaveConfigs={onSaveCustomSearchConfigs} 
          />
        </section>
      )}

      {/* 최근 읽은 사이트 */}
      <RecentReaderWidget bookmarks={bookmarks} />

      {/* 最近追加 */}
      <section>
        <RecentWidget bookmarks={bookmarks} folders={folders} memos={memos} count={recentCount} onDelete={handleDelete} onEdit={setEditingBookmark} onMemoChange={onRefresh} />
      </section>

      {/* ランキング */}
      <section>
        <div className="bg-white dark:bg-surface-800 border border-gray-200 dark:border-surface-700 rounded-xl p-4 shadow-sm dark:shadow-none">
          <RankingWidget bookmarks={bookmarks} count={rankingCount} />
        </div>
      </section>

      {/* ブックマーク編集モーダル */}
      {editingBookmark && (
        <EditModal
          mode="edit"
          bookmark={editingBookmark}
          folders={folders}
          onSaved={() => { setEditingBookmark(null); onRefresh(); }}
          onDeleted={() => { setEditingBookmark(null); onRefresh(); }}
          onClose={() => setEditingBookmark(null)}
        />
      )}
    </div>
  );
}
