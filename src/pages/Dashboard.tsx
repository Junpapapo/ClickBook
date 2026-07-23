import { useState, useRef, useEffect, useMemo } from "react";
import { Check, X, Pencil, Lock, LockOpen, Trash2, AlertOctagon, Sparkles } from "lucide-react";
import RecentWidget from "@/components/RecentWidget";
import RankingWidget from "@/components/RankingWidget";

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
  todoStats?: { overdueCount: number; dueTodayCount: number };
  urgentTasks?: import("@/shared/types").TodoTask[];
  onSelectTodoBoard?: () => void;
  organizeResult?: {
    movedCount: number;
    total: number;
    backupName: string;
    aiSuccessCount?: number;
    aiTotalBatches?: number;
    aiSupported?: boolean;
  } | null;
  onClearOrganizeResult?: () => void;
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

export default function Dashboard({ bookmarks, folders, memos, recentCount, rankingCount, recommendCount, onSelectFolder, onRefresh, searchQuery: _searchQuery, aiSearchQuery, onAiLoadingChange, customSearchConfigs = [], customPresets = [], onSaveCustomSearchConfigs, todoStats, urgentTasks, onSelectTodoBoard, organizeResult = null, onClearOrganizeResult }: Props) {
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

    const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.clickbook_ai_enabled) {
        setAiAvailable(changes.clickbook_ai_enabled.newValue === true);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  async function handleDelete(id: string) {
    try {
      const response = await sendMsg({
        type: "DELETE_BOOKMARK",
        id,
      }) as MessageResponse;
      if (response && response.success) {
        onRefresh();
      } else {
        alert(response?.error || t("saveFailed") || "Failed to delete bookmark");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting bookmark");
    }
  }

  async function handleDeleteFolder(id: string, _name: string) {
    const count = countByFolder[id] ?? 0;
    const msg = count > 0
      ? t("folderDeleteWithBookmarks", { n: count })
      : t("folderDeleteConfirm");
    if (!await showConfirm(msg, t("deleteTooltip"), t("cancelBtn"), "warn")) return;
    try {
      const response = await sendMsg({ type: "DELETE_FOLDER", id }) as MessageResponse;
      if (response && response.success) {
        onRefresh();
      } else {
        alert(response?.error || t("saveFailed") || "Failed to delete folder");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting folder");
    }
  }

  async function handleToggleLock(id: string) {
    await sendMsg({ type: "TOGGLE_FOLDER_LOCK", id });
    onRefresh();
  }

  const folderToRoot = useMemo(() => {
    const map: Record<string, string> = {};
    for (const f of folders) {
      const visited = new Set<string>();
      let curId = f.id;
      visited.add(curId);
      let cur = f;
      while (cur && cur.parentId !== null) {
        if (visited.has(cur.parentId)) {
          break;
        }
        visited.add(cur.parentId);
        const next = folders.find(p => p.id === cur.parentId);
        if (!next) {
          curId = cur.parentId;
          break;
        }
        cur = next;
        curId = cur.id;
      }
      map[f.id] = curId;
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
    const acc: Record<string, number> = {};
    for (const f of folders) {
      if (f.parentId === null) continue;
      const visited = new Set<string>();
      let parentId: string | null = f.parentId;
      while (parentId !== null) {
        if (visited.has(parentId)) {
          break;
        }
        visited.add(parentId);
        acc[parentId] = (acc[parentId] ?? 0) + 1;
        const parentFolder = folders.find(p => p.id === parentId);
        if (!parentFolder) break;
        parentId = parentFolder.parentId;
      }
    }
    return acc;
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
      
      {/* AI Organize 브리핑 배너 */}
      {organizeResult && (
        <div className="relative overflow-hidden bg-indigo-500/10 dark:bg-indigo-500/25 border border-indigo-500/20 dark:border-indigo-500/30 rounded-2xl p-5 backdrop-blur-md flex items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/30 animate-pulse shrink-0">
              <Sparkles size={24} className="text-white fill-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-base">
                {lang === "ko" ? "AI 북정리 완료 브리핑" : "AI Organize Briefing"}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {lang === "ko" 
                  ? `총 ${organizeResult.total}개의 북마크 중 ${organizeResult.movedCount}개의 위치를 정리했습니다.`
                  : `Organized ${organizeResult.movedCount} out of ${organizeResult.total} bookmarks.`}
              </p>
              <div className="mt-2 flex flex-wrap gap-2 items-center text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                {organizeResult.aiSupported === false ? (
                  <span className="shrink-0 bg-indigo-500/10 dark:bg-indigo-500/25 px-1.5 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider">
                    💡 {lang === "ko" ? "로컬 규칙 적용" : "Local Rules"}
                  </span>
                ) : organizeResult.aiSuccessCount !== undefined && organizeResult.aiTotalBatches !== undefined && organizeResult.aiTotalBatches > 0 ? (
                  <span className="shrink-0 bg-indigo-500/10 dark:bg-indigo-500/25 px-1.5 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider">
                    💡 {lang === "ko" 
                      ? `AI 분석 성공률: ${organizeResult.aiSuccessCount}/${organizeResult.aiTotalBatches} 배치` 
                      : `AI Success: ${organizeResult.aiSuccessCount}/${organizeResult.aiTotalBatches}`}
                  </span>
                ) : null}
                <span className="truncate max-w-[400px] text-gray-550 dark:text-gray-400 text-[11px]">
                  📦 {lang === "ko" ? "백업본:" : "Backup:"} {organizeResult.backupName}
                </span>
              </div>
            </div>
          </div>
          {onClearOrganizeResult && (
            <button
              onClick={onClearOrganizeResult}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-indigo-500/20 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {lang === "ko" ? "확인" : "OK"}
            </button>
          )}
        </div>
      )}

      {/* Urgent TODO Banner */}
      {todoStats && (todoStats.overdueCount > 0 || todoStats.dueTodayCount > 0) && (
        <div className="relative overflow-hidden bg-rose-500/10 dark:bg-rose-500/25 border border-rose-500/20 dark:border-rose-500/30 rounded-2xl p-5 backdrop-blur-md flex items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-500/30 animate-pulse shrink-0">
              <AlertOctagon size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-base">
                {t("todoBannerTitle") || "Action Required on Tasks"}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {t("todoBannerDesc", { count: todoStats.overdueCount + todoStats.dueTodayCount }) || 
                  `You have ${todoStats.overdueCount + todoStats.dueTodayCount} tasks that are due today or overdue.`}
              </p>
              {urgentTasks && urgentTasks.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 items-center text-xs text-rose-600 dark:text-rose-450 font-medium">
                  <span className="shrink-0 bg-rose-500/10 dark:bg-rose-500/25 px-1.5 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider">
                    📍 {t("todoUrgent")}
                  </span>
                  <span className="truncate max-w-[400px]">
                    {(() => {
                      const titles = urgentTasks.map(t => t.content);
                      if (titles.length <= 2) return titles.join(", ");
                      return `${titles.slice(0, 2).join(", ")} ${lang === "ko" ? `외 ${titles.length - 2}개` : lang === "ja" ? `ほか ${titles.length - 2}件` : `and ${titles.length - 2} more`}`;
                    })()}
                  </span>
                </div>
              )}
            </div>
          </div>
          {onSelectTodoBoard && (
            <button
              onClick={onSelectTodoBoard}
              className="px-4 py-2 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-rose-500/20 whitespace-nowrap shrink-0"
            >
              {t("todoBannerBtn") || "View Board"}
            </button>
          )}
        </div>
      )}

      {/* 폴더 요약 섹션 */}
      <section>
        <h2 className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold mb-2.5">
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
                className="group relative flex flex-col items-center gap-1 p-2.5 bg-white dark:bg-slate-800/70 hover:bg-slate-100/80 dark:hover:bg-slate-700/80 border border-slate-200/90 dark:border-slate-700/70 hover:border-indigo-400 dark:hover:border-indigo-500/50 rounded-xl transition-all shadow-figma-sm cursor-pointer select-none"
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
                          : "opacity-0 group-hover:opacity-100 text-slate-400 dark:text-slate-500 hover:text-amber-500 dark:hover:text-amber-400"
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
                      <Pencil size={10} className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400" />
                    </button>

                    {f.id !== DEFAULT_FOLDER_ID && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteFolder(f.id, f.name); }}
                        className="p-0.5 rounded hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all"
                        title={t("deleteTooltip")}
                      >
                        <Trash2 size={10} className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400" />
                      </button>
                    )}
                  </div>
                )}
                <div className="relative flex justify-center items-center h-7 mt-0.5">
                  <FolderIcon 
                    iconName={f.icon || EMOJI_MAP[f.id] || "📂"} 
                    size={20} 
                    className="text-[20px] text-slate-700 dark:text-slate-200" 
                  />
                  {subCount > 0 && (
                    <span className="absolute -top-1 -right-2 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[9px] font-bold px-1 py-0.5 rounded-full leading-none shadow-figma-sm">
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
                      className="w-full text-center text-xs bg-transparent border-b border-indigo-500 text-slate-800 dark:text-slate-100 outline-none"
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
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate w-full text-center">
                      {getLocalizedFolderName(f, lang)}
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      {count}
                    </span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>


      {/* 최근 읽은 사이트 */}
      <RecentReaderWidget bookmarks={bookmarks} />

      {/* 최근 추가 */}
      <section>
        <RecentWidget bookmarks={bookmarks} folders={folders} memos={memos} count={recentCount} onDelete={handleDelete} onEdit={setEditingBookmark} onMemoChange={onRefresh} />
      </section>

      {/* 랭킹 위젯 */}
      <section>
        <div className="bg-white dark:bg-slate-800/70 border border-slate-200/90 dark:border-slate-700/70 rounded-xl p-3.5 shadow-figma-sm">
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
