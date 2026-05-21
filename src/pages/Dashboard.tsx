import { useState, useRef, useEffect } from "react";
import { Check, X, Pencil, Lock, LockOpen, Trash2 } from "lucide-react";
import RecentWidget from "@/components/RecentWidget";
import RankingWidget from "@/components/RankingWidget";
import RecommendWidget from "@/components/RecommendWidget";
import { EditModal } from "@/components/BookmarkEditPanel";
import type { Bookmark, Folder, MemoMap, MessageResponse } from "@/shared/types";
import { useLang } from "@/shared/LanguageContext";
import { useDialog } from "@/shared/useDialog";
import { getLocalizedFolderName, DEFAULT_FOLDER_ID } from "@/shared/categories";
import { isAIAvailable } from "@/shared/categorizer";

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
  onAiLoadingChange?: (loading: boolean) => void;
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

export default function Dashboard({ bookmarks, folders, memos, recentCount, rankingCount, recommendCount, onSelectFolder, onRefresh, searchQuery, onAiLoadingChange }: Props) {
  const { t, lang } = useLang();
  const { showConfirm, DialogEl } = useDialog();
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [aiAvailable, setAiAvailable] = useState(false);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function checkAI() {
      const available = await isAIAvailable();
      setAiAvailable(available);
    }
    checkAI();
  }, []);

  async function handleDelete(id: string) {
    const response = (await chrome.runtime.sendMessage({
      type: "DELETE_BOOKMARK",
      id,
    })) as MessageResponse;
    if (response.success) onRefresh();
  }

  async function handleDeleteFolder(id: string, name: string) {
    const count = countByFolder[id] ?? 0;
    const msg = count > 0
      ? t("folderDeleteWithBookmarks", { n: count })
      : t("folderDeleteConfirm");
    if (!await showConfirm(msg, t("deleteTooltip"), t("cancelBtn"), "warn")) return;
    await chrome.runtime.sendMessage({ type: "DELETE_FOLDER", id });
    onRefresh();
  }

  async function handleToggleLock(id: string) {
    await chrome.runtime.sendMessage({ type: "TOGGLE_FOLDER_LOCK", id });
    onRefresh();
  }

  const countByFolder = bookmarks.reduce<Record<string, number>>((acc, b) => {
    acc[b.folderId] = (acc[b.folderId] ?? 0) + 1;
    return acc;
  }, {});

  function startRename(f: Folder) {
    setRenameValue(f.name);
    setRenamingFolderId(f.id);
    setTimeout(() => renameInputRef.current?.focus(), 30);
  }

  async function commitRename(folderId: string, original: string) {
    const v = renameValue.trim();
    if (v && v !== original) {
      await chrome.runtime.sendMessage({ type: "RENAME_FOLDER", id: folderId, name: v });
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
      
      {/* AI 추천 검색 (검색어 있을 때만) */}
      {aiAvailable && searchQuery && (
        <RecommendWidget keyword={searchQuery} count={recommendCount} onRefresh={onRefresh} onLoadingChange={onAiLoadingChange} />
      )}

      {/* フォルダーサマリー */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-600 font-semibold mb-3">
          {t("folders")}
        </h2>
        <div className="grid grid-cols-4 xl:grid-cols-8 gap-2">
          {rootFolders.map((f) => {
            const count = countByFolder[f.id] ?? 0;
            const isRenaming = renamingFolderId === f.id;
            return (
              <div
                key={f.id}
                className="group relative flex flex-col items-center gap-1.5 p-3 bg-white dark:bg-surface-800 hover:bg-gray-50 dark:hover:bg-surface-700 border border-gray-200 dark:border-surface-700 hover:border-indigo-300 dark:hover:border-indigo-500/30 rounded-xl transition-all shadow-sm dark:shadow-none cursor-pointer select-none"
                onClick={() => { if (!isRenaming) onSelectFolder(f.id); }}
              >
                {!isRenaming && (
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
                <span className="text-lg">
                  {f.icon && !/^[A-Za-z0-9_]+$/.test(f.icon) ? f.icon : (EMOJI_MAP[f.id] ?? "📂")}
                </span>
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
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate w-full text-center">
                      {getLocalizedFolderName(f, lang)}
                    </span>
                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                      {count}
                    </span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>

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
