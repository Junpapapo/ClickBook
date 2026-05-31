import { useState, useEffect, useCallback } from "react";
import {
  X,
  Loader2,
  Sparkles,
  Trash2,
  ExternalLink,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Cpu,
} from "lucide-react";
import type { Bookmark, Folder } from "@/shared/types";
import { findDuplicateGroups } from "@/shared/categorizer";
import { useLang } from "@/shared/LanguageContext";
import { useDialog } from "@/shared/useDialog";
import { FolderIcon } from "./DynamicIcon";

interface Props {
  bookmarks: Bookmark[];
  folders: Folder[];
  onClose: () => void;
  onRefresh: () => void;
}

interface GroupWithBookmarks {
  reason: string;
  items: Bookmark[];
  /** 그룹 내에서 가장 먼저 추가된(오래된) bookmark ID = 기본 "유지" 추천 */
  keepId: string;
}

function getFavicon(url: string): string {
  try {
    const { hostname } = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
  } catch {
    return "";
  }
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function AICleanerModal({ bookmarks, folders, onClose, onRefresh }: Props) {
  const { t, lang } = useLang();
  const { showConfirm, DialogEl } = useDialog();

  // folderId → folder name 룩업 맵
  const folderMap = new Map(folders.map(f => [f.id, f]));

  const [phase, setPhase] = useState<"analyzing" | "results" | "error">("analyzing");
  const [groups, setGroups] = useState<GroupWithBookmarks[]>([]);
  const [aiUsed, setAiUsed] = useState(false);
  /** key: bookmarkId, value: true=삭제 대상 */
  const [deleteSet, setDeleteSet] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [doneCount, setDoneCount] = useState<number | null>(null);

  const analyze = useCallback(async () => {
    setPhase("analyzing");
    setDeleteSet(new Set());
    setDoneCount(null);

    try {
      const result = await findDuplicateGroups(
        bookmarks.map((b) => ({ id: b.id, title: b.title, url: b.url })),
        lang
      );
      const rawGroups = result.groups;
      setAiUsed(result.aiUsed);

      // id → Bookmark 룩업
      const bmMap = new Map<string, Bookmark>(bookmarks.map((b) => [b.id, b]));

      const resolved: GroupWithBookmarks[] = rawGroups
        .map((g) => {
          const items: Bookmark[] = g.ids
            .map((id) => bmMap.get(id))
            .filter((b): b is Bookmark => !!b);
          if (items.length < 2) return null;

          // 가장 오래된 북마크(savedAt 기준, 없으면 첫 번째)를 keep 추천
          const oldest = items.reduce((prev, cur) =>
            (prev.savedAt ?? 0) <= (cur.savedAt ?? 0) ? prev : cur
          );

          return { reason: g.reason, items, keepId: oldest.id };
        })
        .filter((g): g is GroupWithBookmarks => g !== null);

      setGroups(resolved);
      setPhase("results");
    } catch {
      setPhase("error");
    }
  }, [bookmarks, lang]);

  useEffect(() => {
    analyze();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleDelete(id: string) {
    // keep으로 표시된 항목을 삭제 대상으로 토글할 때는 허용
    setDeleteSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleDeleteSelected() {
    if (deleteSet.size === 0) return;
    const ok = await showConfirm(
      t("aiCleanerConfirmDelete", { n: deleteSet.size }),
      t("aiCleanerConfirmBtn"),
      t("cancelBtn"),
      "warn"
    );
    if (!ok) return;

    setIsDeleting(true);
    let deleted = 0;
    for (const id of deleteSet) {
      try {
        await chrome.runtime.sendMessage({ type: "DELETE_BOOKMARK", id });
        deleted++;
      } catch {
        /* ignore */
      }
    }
    setIsDeleting(false);
    setDoneCount(deleted);
    
    // 로컬 groups 상태에서 즉시 제거 (재분석 방지)
    setGroups(prev => prev.map(g => {
      const remainingItems = g.items.filter(b => !deleteSet.has(b.id));
      if (remainingItems.length < 2) return null;
      
      // keepId가 삭제되었다면 남은 것 중 가장 오래된 것으로 갱신
      let newKeepId = g.keepId;
      if (deleteSet.has(g.keepId)) {
        const oldest = remainingItems.reduce((p, c) => (p.savedAt ?? 0) <= (c.savedAt ?? 0) ? p : c);
        newKeepId = oldest.id;
      }
      return { ...g, items: remainingItems, keepId: newKeepId };
    }).filter((g): g is GroupWithBookmarks => g !== null));
    
    setDeleteSet(new Set());
    onRefresh();
  }

  const totalDeleteCount = deleteSet.size;

  return (
    <>
      {DialogEl}
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[9000] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[9001] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-3xl max-h-[88vh] bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-600 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-surface-700 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/30">
                <Sparkles size={15} className="text-yellow-300" />
              </div>
            <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {t("aiCleanerTitle")}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">
                    {t("aiCleanerDesc")}
                  </p>
                  {phase === "results" && (
                    <span className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      aiUsed
                        ? "bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400"
                        : "bg-gray-100 dark:bg-surface-700 text-gray-500 dark:text-gray-400"
                    }`}>
                      {aiUsed ? <><Cpu size={8} /> AI</> : "Rule-based"}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          {/* ── Body ── */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {/* Analyzing */}
            {phase === "analyzing" && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 flex items-center justify-center">
                    <Loader2 size={28} className="text-violet-500 animate-spin" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
                  {t("aiCleanerAnalyzing")}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-600">
                  {bookmarks.length} bookmarks
                </p>
              </div>
            )}

            {/* Error */}
            {phase === "error" && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <AlertTriangle size={36} className="text-amber-400" />
                <p className="text-sm text-gray-500 dark:text-gray-400">{t("aiCleanerError")}</p>
                <button
                  onClick={analyze}
                  className="mt-2 px-4 py-2 text-xs font-medium bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Results */}
            {phase === "results" && (
              <>
                {/* Done banner */}
                {doneCount !== null && (
                  <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/50 rounded-xl px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 size={15} />
                    {t("aiCleanerDone", { n: doneCount })}
                  </div>
                )}

                {/* No groups */}
                {groups.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Shield size={40} className="text-emerald-400" />
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {t("aiCleanerNoGroups")}
                    </p>
                  </div>
                )}

                {/* Groups found */}
                {groups.length > 0 && (
                  <>
                    <div className="flex items-center gap-2">
                      <Layers size={14} className="text-violet-500" />
                      <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                        {t("aiCleanerGroupsFound", { n: groups.length })}
                      </span>
                    </div>

                    <div className="space-y-6">
                      {groups.map((group, gi) => (
                        <div key={gi} className="rounded-xl border border-gray-200 dark:border-surface-700 overflow-hidden bg-gray-50/50 dark:bg-surface-800/50">
                          {/* Group header */}
                          <div className="px-4 py-3 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 border-b border-gray-200 dark:border-surface-700">
                            <div className="flex items-start gap-2">
                              <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/40 px-2 py-0.5 rounded-full shrink-0 mt-0.5 uppercase tracking-wider">
                                {t("aiCleanerGroupLabel", { n: gi + 1 })}
                              </span>
                              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                                {group.reason}
                              </p>
                            </div>
                          </div>

                          {/* Card grid */}
                          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {group.items.map((bm) => {
                              const isKeep = bm.id === group.keepId;
                              const isMarkedDelete = deleteSet.has(bm.id);
                              return (
                                <div
                                  key={bm.id}
                                  className={`relative group flex flex-col rounded-xl border transition-all duration-200 overflow-hidden ${
                                    isMarkedDelete
                                      ? "border-rose-300 dark:border-rose-700/60 bg-rose-50 dark:bg-rose-900/10 opacity-70"
                                      : isKeep
                                      ? "border-emerald-300 dark:border-emerald-700/60 bg-white dark:bg-surface-800 shadow-sm ring-1 ring-emerald-400/30"
                                      : "border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800 hover:border-gray-300 dark:hover:border-surface-600"
                                  }`}
                                >
                                  {/* Keep badge */}
                                  {isKeep && !isMarkedDelete && (
                                    <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                                      <Shield size={8} />
                                      {t("aiCleanerKeep")}
                                    </div>
                                  )}
                                  {/* Delete badge */}
                                  {isMarkedDelete && (
                                    <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                                      <Trash2 size={8} />
                                      {t("aiCleanerDelete")}
                                    </div>
                                  )}

                                  {/* Card body */}
                                  <div className="flex items-start gap-3 p-3 pb-2">
                                    <img
                                      src={getFavicon(bm.url)}
                                      alt=""
                                      className="w-7 h-7 rounded-lg shrink-0 mt-0.5 bg-gray-100 dark:bg-surface-700 object-contain"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src =
                                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%236B7280'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7l5-8v4h4l-5 8z'/%3E%3C/svg%3E";
                                      }}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 leading-tight line-clamp-2">
                                        {bm.title || getDomain(bm.url)}
                                      </p>
                                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 truncate">
                                        {getDomain(bm.url)}
                                      </p>
                                      {/* 폴더 위치 뱃지 */}
                                      {(() => {
                                        const folder = folderMap.get(bm.folderId);
                                        if (!folder) return null;
                                        return (
                                          <span className="inline-flex items-center gap-1 mt-1.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-700/40 max-w-full truncate">
                                            <FolderIcon iconName={folder.icon || "📁"} size={9} className="shrink-0" />
                                            <span className="truncate">{lang === "ko" ? folder.name : (folder.nameJa || folder.name)}</span>
                                          </span>
                                        );
                                      })()}
                                    </div>
                                  </div>

                                  {/* Card actions */}
                                  <div className="flex items-center gap-1.5 px-3 pb-3 mt-auto">
                                    <a
                                      href={bm.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 px-2 py-1 text-[10px] text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-gray-100 dark:bg-surface-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-md transition-colors"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <ExternalLink size={9} />
                                      Open
                                    </a>
                                    <button
                                      onClick={() => toggleDelete(bm.id)}
                                      className={`flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-md transition-all ${
                                        isMarkedDelete
                                          ? "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-900/50"
                                          : "bg-gray-100 dark:bg-surface-700 text-gray-500 dark:text-gray-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 dark:hover:text-rose-400"
                                      }`}
                                    >
                                      <Trash2 size={9} />
                                      {isMarkedDelete ? "Undo" : t("aiCleanerDelete")}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-surface-700 flex items-center justify-between gap-3 shrink-0 bg-gray-50/50 dark:bg-surface-900">
            <span className="text-xs text-gray-400 dark:text-gray-600">
              {totalDeleteCount > 0
                ? t("aiCleanerDeleteSelected", { n: totalDeleteCount })
                : `${bookmarks.length} bookmarks analyzed`}
            </span>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-gray-100 dark:bg-surface-700 hover:bg-gray-200 dark:hover:bg-surface-600 rounded-lg transition-colors"
              >
                {t("aiCleanerClose")}
              </button>
              {totalDeleteCount > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-rose-500 hover:bg-rose-400 text-white rounded-lg transition-all shadow-sm hover:shadow-rose-500/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  {isDeleting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                  {t("aiCleanerDeleteSelected", { n: totalDeleteCount })}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
