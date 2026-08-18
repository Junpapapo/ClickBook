import { useState, useRef, useMemo } from "react";
import { Check, X, Pencil, Trash2, AlertOctagon, Sparkles, FolderTree } from "lucide-react";
import RecentWidget from "@/components/RecentWidget";
import RankingWidget from "@/components/RankingWidget";
import RecentReaderWidget from "@/components/RecentReaderWidget";
import { EditModal } from "@/components/BookmarkEditPanel";
import type { Bookmark, Folder, MemoMap, MessageResponse } from "@/shared/types";
import { useLang } from "@/shared/LanguageContext";
import { useTheme } from "@/shared/ThemeContext";
import { useDialog } from "@/shared/useDialog";
import { getLocalizedFolderName } from "@/shared/categories";
import { FolderIcon } from "@/components/DynamicIcon";
import { sendMsg } from "@/shared/utils";

// ── 모던 대시보드 컴포넌트 ──────────────────────────────
import WallpaperBackground from "@/components/dashboard/WallpaperBackground";
import ModernHeroHeader from "@/components/dashboard/ModernHeroHeader";
import ZenClock from "@/components/dashboard/ZenClock";

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
  onSearchChange?: (query: string) => void;
  aiSearchQuery?: string;
  onAiLoadingChange?: (loading: boolean) => void;
  customSearchConfigs?: import("@/shared/types").CustomSearchConfig[];
  customPresets?: import("@/shared/types").CustomSearchConfig[];
  onSaveCustomSearchConfigs?: (configs: import("@/shared/types").CustomSearchConfig[], presets?: import("@/shared/types").CustomSearchConfig[]) => void;
  todoStats?: { overdueCount: number; dueTodayCount: number };
  urgentTasks?: import("@/shared/types").TodoTask[];
  onSelectTodoBoard?: () => void;
  onOpenSettings?: () => void;
  onOpenGuide?: () => void;
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

export default function Dashboard({
  bookmarks,
  folders,
  memos,
  recentCount,
  rankingCount,
  recommendCount: _recommendCount,
  onSelectFolder,
  onRefresh,
  searchQuery = "",
  onSearchChange,
  aiSearchQuery: _aiSearchQuery,
  onAiLoadingChange: _onAiLoadingChange,
  customSearchConfigs: _customSearchConfigs = [],
  customPresets: _customPresets = [],
  onSaveCustomSearchConfigs: _onSaveCustomSearchConfigs,
  todoStats,
  urgentTasks: _urgentTasks = [],
  onSelectTodoBoard,
  onOpenSettings,
  onOpenGuide,
  organizeResult = null,
  onClearOrganizeResult,
}: Props) {
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const { showConfirm, showAlert, DialogEl } = useDialog();

  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);
  const [isZenMode, setIsZenMode] = useState(false);

  // 빈 배경 클릭 시 상단 검색창만 남기고 위젯 숨김 토글
  const handleBackgroundClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest(
        "button, input, select, textarea, a, [role='button'], [role='dialog'], .no-zen-toggle"
      )
    ) {
      return;
    }
    setIsZenMode((prev) => !prev);
  };

  async function handleDelete(id: string) {
    try {
      const response = (await sendMsg({
        type: "DELETE_BOOKMARK",
        id,
      })) as MessageResponse;
      if (response && response.success) {
        onRefresh();
      } else {
        await showAlert(response?.error || t("saveFailed") || "Failed to delete bookmark", "warn");
      }
    } catch (err) {
      console.error(err);
      await showAlert("Error deleting bookmark", "warn");
    }
  }

  async function handleDeleteFolder(id: string, _name: string) {
    const count = countByFolder[id] ?? 0;
    const msg = count > 0 ? t("folderDeleteWithBookmarks", { n: count }) : t("folderDeleteConfirm");
    if (!(await showConfirm(msg, t("deleteTooltip"), t("cancelBtn"), "warn"))) return;
    try {
      const response = (await sendMsg({ type: "DELETE_FOLDER", id })) as MessageResponse;
      if (response && response.success) {
        onRefresh();
      } else {
        await showAlert(response?.error || t("saveFailed") || "Failed to delete folder", "warn");
      }
    } catch (err) {
      console.error(err);
      await showAlert("Error deleting folder", "warn");
    }
  }

  const folderToRoot = useMemo(() => {
    const map: Record<string, string> = {};
    for (const f of folders) {
      const visited = new Set<string>();
      let curId = f.id;
      visited.add(curId);
      let cur = f;
      while (cur && cur.parentId !== null) {
        if (visited.has(cur.parentId)) break;
        visited.add(cur.parentId);
        const next = folders.find((p) => p.id === cur.parentId);
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
        if (visited.has(parentId)) break;
        visited.add(parentId);
        acc[parentId] = (acc[parentId] ?? 0) + 1;
        const parentFolder = folders.find((p) => p.id === parentId);
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
    <WallpaperBackground isDarkMode={isDarkMode} onClick={handleBackgroundClick}>
      <div className="flex flex-col gap-5 max-w-[1440px] w-full mx-auto pb-12 px-2 sm:px-6 select-none min-h-[calc(100vh-2rem)] cursor-default">
        {DialogEl}

        {/* ── 1. 상단 히어로 & 통합 검색창 & 유틸리티 툴바 (항상 유지) ── */}
        <ModernHeroHeader
          searchQuery={searchQuery}
          onSearchChange={(q) => onSearchChange?.(q)}
          onSearchSubmit={(q) => {
            if (q.trim()) onSearchChange?.(q);
          }}
          onOpenSettings={onOpenSettings}
          onOpenGuide={onOpenGuide}
        />

        {/* ── 2~7. 하단 위젯/콘텐츠 영역 (빈 배경 클릭 시 감춤/표시 토글) ── */}
        {!isZenMode ? (
          <div className="flex flex-col gap-5 animate-in fade-in duration-300">
            {/* ── 2. AI 정리 브리핑 배너 (있을 때만) ── */}
            {organizeResult && (
              <div className="no-zen-toggle relative overflow-hidden bg-indigo-50/85 dark:bg-indigo-950/40 backdrop-blur-md border border-indigo-200/80 dark:border-indigo-800/50 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-figma-sm animate-in fade-in duration-200">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl shadow-xs shrink-0">
                    <Sparkles size={15} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-xs truncate">
                      {lang === "ko" ? "AI 북정리 완료 브리핑" : "AI Organize Briefing"}
                    </h3>
                    <p className="text-[11.5px] text-slate-600 dark:text-slate-300 truncate mt-0.5">
                      {lang === "ko"
                        ? `총 ${organizeResult.total}개의 북마크 중 ${organizeResult.movedCount}개의 위치를 정리했습니다.`
                        : `Organized ${organizeResult.movedCount} out of ${organizeResult.total} bookmarks.`}
                    </p>
                  </div>
                </div>
                {onClearOrganizeResult && (
                  <button
                    onClick={onClearOrganizeResult}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
                  >
                    {t("dashboardBtnOk")}
                  </button>
                )}
              </div>
            )}

            {/* ── 3. 긴급 TODO 배너 (있을 때만) ── */}
            {todoStats && (todoStats.overdueCount > 0 || todoStats.dueTodayCount > 0) && (
              <div className="no-zen-toggle relative overflow-hidden bg-rose-50/85 dark:bg-rose-950/40 backdrop-blur-md border border-rose-200/80 dark:border-rose-800/50 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-figma-sm animate-in fade-in duration-200">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 bg-rose-600 dark:bg-rose-500 text-white rounded-xl shadow-xs shrink-0">
                    <AlertOctagon size={15} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-xs truncate">
                      {t("todoBannerTitle") || "Action Required on Tasks"}
                    </h3>
                    <p className="text-[11.5px] text-slate-600 dark:text-slate-300 truncate mt-0.5">
                      {lang === "ko"
                        ? `오늘 마감 ${todoStats.dueTodayCount}개, 마감 초과 ${todoStats.overdueCount}개의 긴급 태스크가 있습니다.`
                        : `${todoStats.dueTodayCount} tasks due today, ${todoStats.overdueCount} overdue.`}
                    </p>
                  </div>
                </div>
                {onSelectTodoBoard && (
                  <button
                    onClick={onSelectTodoBoard}
                    className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
                  >
                    {t("dashboardBtnView")}
                  </button>
                )}
              </div>
            )}

            {/* ── 4. 루트 폴더 카드 그리드 (글래스모피즘) ── */}
            <section className="no-zen-toggle bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl p-4 shadow-figma-sm">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <FolderTree size={16} className="text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {t("dashboardCategoryFolders")}
                  </h2>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {rootFolders.length} {t("dashboardFolderUnit")}
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-2.5">
                {rootFolders.map((f) => {
                  const count = countByFolder[f.id] ?? 0;
                  const subCount = subfolderCountByFolder[f.id] ?? 0;
                  const isRenaming = renamingFolderId === f.id;

                  return (
                    <div
                      key={f.id}
                      onClick={() => !isRenaming && onSelectFolder(f.id)}
                      className="group relative flex flex-col items-center justify-between p-3 rounded-2xl bg-white/60 dark:bg-slate-800/60 hover:bg-white/90 dark:hover:bg-slate-800/90 border border-white/80 dark:border-white/10 shadow-figma-xs hover:shadow-figma-sm hover:-translate-y-0.5 transition-all cursor-pointer min-h-[90px]"
                    >
                      {/* 카드 상단 우측 인라인 액션 (이름수정 / 삭제) */}
                      {!isRenaming && (
                        <div
                          className="absolute top-1.5 right-1.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => startRename(f)}
                            className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            title={t("renameTooltip") || "이름 수정"}
                          >
                            <Pencil size={11} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" />
                          </button>
                          {count === 0 && (
                            <button
                              onClick={() => handleDeleteFolder(f.id, f.name)}
                              className="p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                              title={t("deleteTooltip") || "폴더 삭제"}
                            >
                              <Trash2 size={11} className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400" />
                            </button>
                          )}
                        </div>
                      )}

                      {/* 폴더 아이콘 */}
                      <div className="relative flex justify-center items-center h-8 mt-1">
                        <FolderIcon
                          iconName={f.icon || EMOJI_MAP[f.id] || "📂"}
                          size={24}
                          className="text-[24px] text-slate-700 dark:text-slate-200 group-hover:scale-110 transition-transform"
                        />
                        {subCount > 0 && (
                          <span className="absolute -top-1 -right-2 bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full leading-none shadow-2xs">
                            {subCount}
                          </span>
                        )}
                      </div>

                      {/* 폴더명 / 북마크 개수 */}
                      {isRenaming ? (
                        <div className="flex flex-col items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
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
                              onMouseDown={(e) => {
                                e.preventDefault();
                                commitRename(f.id, f.name);
                              }}
                              className="text-emerald-500 hover:text-emerald-400"
                            >
                              <Check size={12} />
                            </button>
                            <button
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setRenamingFolderId(null);
                              }}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full text-center mt-1">
                          <span className="text-[11.5px] font-bold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate w-full block transition-colors">
                            {getLocalizedFolderName(f, lang)}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{count} items</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ── 5. 최근 읽은 사이트 (리더모드 진행률) ── */}
            <div className="no-zen-toggle">
              <RecentReaderWidget bookmarks={bookmarks} />
            </div>

            {/* ── 6. 최근 추가된 북마크 카드 그리드 (글래스모피즘) ── */}
            <section className="no-zen-toggle bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl p-4 shadow-figma-sm">
              <RecentWidget
                bookmarks={bookmarks}
                folders={folders}
                memos={memos}
                count={recentCount}
                onDelete={handleDelete}
                onEdit={setEditingBookmark}
                onMemoChange={onRefresh}
              />
            </section>

            {/* ── 7. 하단 2-Grid 랭킹 요약 섹션 (클릭북 인기 북마크 + 브라우저 Top Sites) ── */}
            <section className="no-zen-toggle">
              <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl p-4 shadow-figma-sm">
                <RankingWidget bookmarks={bookmarks} count={rankingCount} onRefresh={onRefresh} />
              </div>
            </section>
          </div>
        ) : (
          /* ── Zen 모드 활성화 시 (순수 대형 시간 표시 모드) ── */
          <div className="flex-1 flex flex-col items-center justify-center py-16 animate-in fade-in duration-500 select-none pointer-events-none">
            <ZenClock />
          </div>
        )}
      </div>

      {/* 북마크 수정 모달 */}
      {editingBookmark && (
        <EditModal
          mode="edit"
          bookmark={editingBookmark}
          folders={folders}
          onSaved={() => {
            setEditingBookmark(null);
            onRefresh();
          }}
          onDeleted={() => {
            setEditingBookmark(null);
            onRefresh();
          }}
          onClose={() => setEditingBookmark(null)}
        />
      )}
    </WallpaperBackground>
  );
}
