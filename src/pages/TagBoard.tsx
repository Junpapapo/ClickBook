import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  Tag as TagIcon,
  Tags as TagsIcon,
  Merge as MergeIcon,
  Filter as FilterIcon,
  X as XIcon,
  HelpCircle as HelpIcon,
  CheckCircle2 as CheckCircleIcon,
  Loader2 as Loader2Icon,
} from "lucide-react";
import type { Bookmark, Folder } from "@/shared/types";
import { useLang } from "@/shared/LanguageContext";
import { useDialog } from "@/shared/useDialog";
import { getLocalizedFolderName } from "@/shared/categories";
import TagCloudView from "./TagBoard/TagCloudView";
import TagActionDialogs from "./TagBoard/TagActionDialogs";
import TagBookmarkList from "./TagBoard/TagBookmarkList";

interface Props {
  bookmarks: Bookmark[];
  folders: Folder[];
  onRefresh: () => void;
  onAutoTag?: () => void;
  isAutoTagging?: boolean;
}

const tagColorCache = new Map<
  string,
  {
    h: number;
    bg: string;
    border: string;
    text: string;
    hoverBg: string;
    activeBg: string;
    activeBorder: string;
    activeText: string;
    darkBg: string;
    darkBorder: string;
    darkText: string;
    darkHoverBg: string;
  }
>();

export default function TagBoard({
  bookmarks,
  folders,
  onRefresh,
  onAutoTag,
  isAutoTagging = false,
}: Props) {
  const { t, lang } = useLang();
  const { showConfirm, DialogEl } = useDialog();

  // State definitions
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filterMode, setFilterMode] = useState<"AND" | "OR">("OR");
  const [tagSearch, setTagSearch] = useState("");
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [tagCloudOpen, setTagCloudOpen] = useState(true);

  const toastTimeoutRef = useRef<number | null>(null);

  const showToast = useCallback((text: string, type: "success" | "error" | "info" = "success") => {
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage({ text, type });
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
      toastTimeoutRef.current = null;
    }, 3500);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // Unique HSL Tag Color Generator
  const getTagColor = useCallback((tag: string) => {
    const cacheKey = tag.toLowerCase().trim();
    if (tagColorCache.has(cacheKey)) {
      return tagColorCache.get(cacheKey)!;
    }
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
      hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    const colorObj = {
      h,
      bg: `hsla(${h}, 70%, 50%, 0.08)`,
      border: `hsla(${h}, 70%, 50%, 0.25)`,
      text: `hsl(${h}, 75%, 42%)`,
      hoverBg: `hsla(${h}, 70%, 50%, 0.15)`,
      activeBg: `hsl(${h}, 65%, 45%)`,
      activeBorder: `hsl(${h}, 65%, 35%)`,
      activeText: `#ffffff`,
      darkBg: `hsla(${h}, 60%, 40%, 0.15)`,
      darkBorder: `hsla(${h}, 60%, 40%, 0.45)`,
      darkText: `hsl(${h}, 75%, 80%)`,
      darkHoverBg: `hsla(${h}, 60%, 40%, 0.25)`,
    };
    tagColorCache.set(cacheKey, colorObj);
    return colorObj;
  }, []);

  // Folder Name mapping for BookmarkCard
  const folderMap = useMemo(() => {
    const map = new Map<string, string>();
    folders.forEach((f) => map.set(f.id, getLocalizedFolderName(f, lang)));
    return map;
  }, [folders, lang]);

  // Aggregate and calculate all unique tags with count
  const allTagsWithCount = useMemo(() => {
    const counts: Record<string, number> = {};
    bookmarks.forEach((b) => {
      if (b.tags && Array.isArray(b.tags)) {
        b.tags.forEach((t) => {
          const normalized = t.trim().toLowerCase();
          if (normalized) {
            counts[normalized] = (counts[normalized] || 0) + 1;
          }
        });
      }
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [bookmarks]);

  // Filtered tags based on search input
  const filteredTagsList = useMemo(() => {
    if (!tagSearch.trim()) return allTagsWithCount;
    const query = tagSearch.toLowerCase().trim();
    return allTagsWithCount.filter((t) => t.name.includes(query));
  }, [allTagsWithCount, tagSearch]);

  // Tag Metrics
  const metrics = useMemo(() => {
    const totalUnique = allTagsWithCount.length;
    const taggedBookmarksCount = bookmarks.filter((b) => b.tags && b.tags.length > 0).length;
    const totalAssignments = allTagsWithCount.reduce((acc, curr) => acc + curr.count, 0);
    const mostPopular = allTagsWithCount.length > 0 ? allTagsWithCount[0] : null;

    return {
      totalUnique,
      taggedBookmarksCount,
      totalAssignments,
      mostPopular,
    };
  }, [allTagsWithCount, bookmarks]);

  // Filtered Bookmarks based on selected tags and filterMode
  const filteredBookmarks = useMemo(() => {
    if (selectedTags.length === 0) {
      return bookmarks.filter((b) => b.tags && b.tags.length > 0);
    }

    return bookmarks.filter((b) => {
      if (!b.tags || b.tags.length === 0) return false;
      const bTags = b.tags.map((t) => t.toLowerCase());

      if (filterMode === "AND") {
        return selectedTags.every((t) => bTags.includes(t.toLowerCase()));
      } else {
        return selectedTags.some((t) => bTags.includes(t.toLowerCase()));
      }
    });
  }, [bookmarks, selectedTags, filterMode]);

  // Toggle selected tags for filtering
  const handleTagClick = useCallback((tag: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((t) => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  }, []);

  // Select/Deselect All tags
  const handleSelectAllTags = useCallback(() => {
    const allNames = filteredTagsList.map((t) => t.name);
    setSelectedTags(allNames);
  }, [filteredTagsList]);

  const handleDeselectAllTags = useCallback(() => {
    setSelectedTags([]);
  }, []);

  const handleEditBookmarkClick = useCallback((b: Bookmark) => {
    setEditingBookmark(b);
  }, []);

  return (
    <>
      {DialogEl}
      <div className="h-full flex flex-col font-sans relative">
        {/* Toast Notification */}
        {toastMessage && (
          <div
            role="alert"
            aria-live="assertive"
            className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl border animate-in fade-in slide-in-from-bottom-5 duration-300 bg-white dark:bg-surface-900 border-gray-100 dark:border-surface-800"
          >
            {toastMessage.type === "success" && (
              <CheckCircleIcon size={18} className="text-emerald-500 shrink-0" />
            )}
            {toastMessage.type === "error" && (
              <XIcon size={18} className="text-rose-500 shrink-0" />
            )}
            {toastMessage.type === "info" && (
              <HelpIcon size={18} className="text-indigo-500 shrink-0" />
            )}
            <span className="text-xs font-semibold text-gray-800 dark:text-gray-100">
              {toastMessage.text}
            </span>
          </div>
        )}

        {/* Dashboard Title & Quick Actions */}
        <div className="mb-6 shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2 tracking-tight">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30">
                <TagIcon size={16} />
              </span>
              <span className="bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 text-transparent bg-clip-text">
                {t("tagBoardTitle") || "AI Tag Cloud & Management"}
              </span>
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-450 mt-1">
              Browse interactive tag analytics, filter dynamically, and resolve duplicate or redundant tags.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Auto Tag Button */}
            {onAutoTag && (
              <button
                disabled={isAutoTagging}
                onClick={onAutoTag}
                className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 shrink-0
                  ${
                    isAutoTagging
                      ? "bg-gray-200 dark:bg-surface-800 text-gray-400 dark:text-gray-600 cursor-not-allowed shadow-none hover:shadow-none hover:translate-y-0"
                      : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20 hover:shadow-emerald-500/30"
                  }`}
              >
                {isAutoTagging ? (
                  <Loader2Icon size={14} className="animate-spin" />
                ) : (
                  <TagsIcon size={14} />
                )}
                {t("autoTagTooltip") || "Auto Tag"}
              </button>
            )}

            {/* Merge Tags Button */}
            <button
              onClick={() => setShowMergeModal(true)}
              className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:scale-95 shrink-0"
            >
              <MergeIcon size={14} />
              {t("tagMergeBtn") || "Merge Tags"}
            </button>
          </div>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 shrink-0">
          <div className="bg-white dark:bg-surface-900/60 backdrop-blur border border-gray-200/50 dark:border-white/[0.05] p-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                {t("tagStatsUnique") || "Unique Tags"}
              </span>
              <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-550 dark:text-indigo-400 group-hover:scale-115 transition-transform duration-300">
                <TagIcon size={14} />
              </div>
            </div>
            <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 text-transparent bg-clip-text tracking-tight">
              {metrics.totalUnique}
            </div>
          </div>

          <div className="bg-white dark:bg-surface-900/60 backdrop-blur border border-gray-200/50 dark:border-white/[0.05] p-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-gray-400 dark:text-gray-550 uppercase tracking-wider">
                {t("tagStatsTagged") || "Tagged Bookmarks"}
              </span>
              <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-555 dark:text-emerald-450 group-hover:scale-115 transition-transform duration-300">
                <FilterIcon size={14} />
              </div>
            </div>
            <div className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 text-transparent bg-clip-text tracking-tight">
              {metrics.taggedBookmarksCount}{" "}
              <span className="text-xs text-gray-450 dark:text-gray-500 font-medium">
                / {bookmarks.length}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-surface-900/60 backdrop-blur border border-gray-200/50 dark:border-white/[0.05] p-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                {t("tagStatsTotal") || "Total Assignments"}
              </span>
              <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-550 dark:text-purple-400 group-hover:scale-115 transition-transform duration-300">
                <TagsIcon size={14} />
              </div>
            </div>
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 text-transparent bg-clip-text tracking-tight">
              {metrics.totalAssignments}
            </div>
          </div>

          <div className="bg-white dark:bg-surface-900/60 backdrop-blur border border-gray-200/50 dark:border-white/[0.05] p-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-gray-400 dark:text-gray-550 uppercase tracking-wider">
                Top Popular Tag
              </span>
              <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-555 dark:text-rose-455 group-hover:scale-115 transition-transform duration-300">
                <MergeIcon size={14} />
              </div>
            </div>
            {metrics.mostPopular ? (
              <div className="flex items-baseline gap-2 truncate">
                <span className="text-lg font-bold text-gray-800 dark:text-gray-100 truncate">
                  #{metrics.mostPopular.name}
                </span>
                <span className="text-xs font-bold text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded-md border border-rose-100 dark:border-rose-900/25 shrink-0">
                  {metrics.mostPopular.count}×
                </span>
              </div>
            ) : (
              <div className="text-sm font-medium text-gray-400 dark:text-gray-500 italic">
                None
              </div>
            )}
          </div>
        </div>

        {/* Tag Cloud View Component */}
        <TagCloudView
          filteredTagsList={filteredTagsList}
          selectedTags={selectedTags}
          tagSearch={tagSearch}
          setTagSearch={setTagSearch}
          tagCloudOpen={tagCloudOpen}
          setTagCloudOpen={setTagCloudOpen}
          handleTagClick={handleTagClick}
          handleSelectAllTags={handleSelectAllTags}
          handleDeselectAllTags={handleDeselectAllTags}
          getTagColor={getTagColor}
          t={t}
        />

        {/* Filter State Banner & Switch */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 shrink-0 bg-white dark:bg-surface-900/40 border border-gray-200/50 dark:border-white/[0.03] px-5 py-3 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <FilterIcon size={14} className="text-indigo-500" />
            <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
              {selectedTags.length > 0 ? (
                <>
                  Filtered by{" "}
                  <span className="text-indigo-600 dark:text-indigo-400 font-extrabold bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-lg border border-indigo-100/30">
                    {selectedTags.length}
                  </span>{" "}
                  tag(s) ·{" "}
                  <span className="text-gray-800 dark:text-gray-300 font-extrabold">
                    {filteredBookmarks.length}
                  </span>{" "}
                  bookmarks matched
                </>
              ) : (
                <>
                  Showing all{" "}
                  <span className="text-gray-800 dark:text-gray-100 font-extrabold bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-lg">
                    {filteredBookmarks.length}
                  </span>{" "}
                  tagged bookmarks
                </>
              )}
            </span>
          </div>

          {selectedTags.length > 1 && (
            <div className="flex items-center bg-gray-100 dark:bg-surface-900 border border-gray-200 dark:border-surface-800 p-0.5 rounded-xl self-start sm:self-auto shrink-0 shadow-inner">
              <button
                onClick={() => setFilterMode("OR")}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  filterMode === "OR"
                    ? "bg-white dark:bg-surface-800 text-indigo-650 dark:text-indigo-400 shadow-md border-gray-100 dark:border-white/[0.04]"
                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                }`}
              >
                OR Match
              </button>
              <button
                onClick={() => setFilterMode("AND")}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  filterMode === "AND"
                    ? "bg-white dark:bg-surface-800 text-indigo-650 dark:text-indigo-400 shadow-md border-gray-100 dark:border-white/[0.04]"
                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                }`}
              >
                AND Match
              </button>
            </div>
          )}
        </div>

        {/* Filtered Bookmarks List Component */}
        <TagBookmarkList
          bookmarks={bookmarks}
          filteredBookmarks={filteredBookmarks}
          folderMap={folderMap}
          onRefresh={onRefresh}
          showToast={showToast}
          showConfirm={showConfirm}
          handleEditBookmarkClick={handleEditBookmarkClick}
          t={t}
        />

        {/* Tag Action Dialogs (Merge and Inline Tag Modals) */}
        <TagActionDialogs
          showMergeModal={showMergeModal}
          setShowMergeModal={setShowMergeModal}
          editingBookmark={editingBookmark}
          setEditingBookmark={setEditingBookmark}
          allTagsWithCount={allTagsWithCount}
          bookmarks={bookmarks}
          onRefresh={onRefresh}
          showToast={showToast}
          showConfirm={showConfirm}
          getTagColor={getTagColor}
          t={t}
          lang={lang}
        />
      </div>
    </>
  );
}
