import React, { useState, useMemo, useEffect } from "react";
import {
  Tag as TagIcon,
  Tags as TagsIcon,
  Merge as MergeIcon,
  Layers as LayersIcon,
  Edit as EditIcon,
  X as XIcon,
  Filter as FilterIcon,
  ChevronDown as ChevronDownIcon,
  ChevronUp as ChevronUpIcon,
  Trash2 as TrashIcon,
  Plus as PlusIcon,
  Check as CheckIcon,
  Search as SearchIcon,
  HelpCircle as HelpIcon,
  RefreshCw as RefreshIcon,
  SlidersHorizontal as SlidersIcon,
  CheckCircle2 as CheckCircleIcon,
  Sparkles as SparklesIcon,
  Loader2 as Loader2Icon
} from "lucide-react";
import BookmarkCard from "@/components/BookmarkCard";
import type { Bookmark, Folder, MessageResponse } from "@/shared/types";
import { useLang } from "@/shared/LanguageContext";
import { useDialog } from "@/shared/useDialog";

interface Props {
  bookmarks: Bookmark[];
  folders: Folder[];
  onRefresh: () => void;
  onAutoTag?: () => void;
  isAutoTagging?: boolean;
}

export default function TagBoard({ bookmarks, folders, onRefresh, onAutoTag, isAutoTagging = false }: Props) {
  const { t } = useLang();
  const { showConfirm, DialogEl } = useDialog();

  // State definitions
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filterMode, setFilterMode] = useState<"AND" | "OR">("OR");
  const [tagSearch, setTagSearch] = useState("");
  
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeSource, setMergeSource] = useState("");
  const [mergeTarget, setMergeTarget] = useState("");
  const [isMerging, setIsMerging] = useState(false);

  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [editingTags, setEditingTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState("");

  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const [tagCloudOpen, setTagCloudOpen] = useState(true);

  const showToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Unique HSL Tag Color Generator
  const getTagColor = (tag: string) => {
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
      hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    return {
      h,
      bg: `hsla(${h}, 70%, 50%, 0.08)`,
      border: `hsla(${h}, 70%, 50%, 0.25)`,
      text: `hsl(${h}, 75%, 42%)`,
      hoverBg: `hsla(${h}, 70%, 50%, 0.15)`,
      // Active states
      activeBg: `hsl(${h}, 65%, 45%)`,
      activeBorder: `hsl(${h}, 65%, 35%)`,
      activeText: `#ffffff`,
      // Dark theme support overrides
      darkBg: `hsla(${h}, 60%, 40%, 0.15)`,
      darkBorder: `hsla(${h}, 60%, 40%, 0.45)`,
      darkText: `hsl(${h}, 75%, 80%)`,
      darkHoverBg: `hsla(${h}, 60%, 40%, 0.25)`,
    };
  };

  // Folder Name mapping for BookmarkCard
  const folderMap = useMemo(() => {
    const map = new Map<string, string>();
    folders.forEach(f => map.set(f.id, f.name));
    return map;
  }, [folders]);

  // Aggregate and calculate all unique tags with count
  const allTagsWithCount = useMemo(() => {
    const counts: Record<string, number> = {};
    bookmarks.forEach(b => {
      if (b.tags && Array.isArray(b.tags)) {
        b.tags.forEach(t => {
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
    return allTagsWithCount.filter(t => t.name.includes(query));
  }, [allTagsWithCount, tagSearch]);

  // Tag Metrics
  const metrics = useMemo(() => {
    const totalUnique = allTagsWithCount.length;
    const taggedBookmarksCount = bookmarks.filter(b => b.tags && b.tags.length > 0).length;
    const totalAssignments = allTagsWithCount.reduce((acc, curr) => acc + curr.count, 0);
    const mostPopular = allTagsWithCount.length > 0 ? allTagsWithCount[0] : null;

    return {
      totalUnique,
      taggedBookmarksCount,
      totalAssignments,
      mostPopular
    };
  }, [allTagsWithCount, bookmarks]);

  // Filtered Bookmarks based on selected tags and filterMode
  const filteredBookmarks = useMemo(() => {
    // If no tags selected, show all bookmarks that have tags
    if (selectedTags.length === 0) {
      return bookmarks.filter(b => b.tags && b.tags.length > 0);
    }

    const selectedSet = new Set(selectedTags.map(t => t.toLowerCase()));

    return bookmarks.filter(b => {
      if (!b.tags || b.tags.length === 0) return false;
      const bTags = b.tags.map(t => t.toLowerCase());

      if (filterMode === "AND") {
        return selectedTags.every(t => bTags.includes(t.toLowerCase()));
      } else {
        return selectedTags.some(t => bTags.includes(t.toLowerCase()));
      }
    });
  }, [bookmarks, selectedTags, filterMode]);

  // Toggle selected tags for filtering
  const handleTagClick = (tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  // Select/Deselect All tags
  const handleSelectAllTags = () => {
    const allNames = allTagsWithCount.map(t => t.name);
    setSelectedTags(allNames);
  };

  const handleDeselectAllTags = () => {
    setSelectedTags([]);
  };

  // bookmark edit triggers tag editor modal instead of default edit
  const handleEditBookmarkClick = (b: Bookmark) => {
    setEditingBookmark(b);
    setEditingTags(b.tags || []);
    setNewTagInput("");
  };

  const handleAddTagChip = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newTagInput.trim().toLowerCase();
    if (clean && !editingTags.includes(clean)) {
      setEditingTags(prev => [...prev, clean]);
    }
    setNewTagInput("");
  };

  const handleRemoveTagChip = (tagToRemove: string) => {
    setEditingTags(prev => prev.filter(t => t !== tagToRemove));
  };

  const handleSaveTags = async () => {
    if (!editingBookmark) return;
    try {
      const response = await chrome.runtime.sendMessage({
        type: "UPDATE_BOOKMARK",
        id: editingBookmark.id,
        title: editingBookmark.title,
        url: editingBookmark.url,
        folderId: editingBookmark.folderId,
        tags: editingTags
      }) as MessageResponse;

      if (response.success) {
        showToast(t("popupMemoSaved") || "Saved successfully!", "success");
        setEditingBookmark(null);
        onRefresh();
      } else {
        showToast(response.error || "Failed to save changes", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error updating tags", "error");
    }
  };

  // Delete Bookmark wrapper
  const handleDeleteBookmark = async (id: string) => {
    const target = bookmarks.find(b => b.id === id);
    if (!target) return;
    const confirmMsg = t("deleteConfirm", { title: target.title }) || `Delete "${target.title}"?`;
    const confirmed = await showConfirm(confirmMsg, "Delete", "Cancel", "warn");
    if (confirmed) {
      try {
        const response = await chrome.runtime.sendMessage({
          type: "DELETE_BOOKMARK",
          id
        }) as MessageResponse;
        if (response.success) {
          showToast(t("aiCleanerDone", { n: 1 }) || "Deleted bookmark successfully", "success");
          onRefresh();
        } else {
          showToast(response.error || "Failed to delete bookmark", "error");
        }
      } catch (err) {
        console.error(err);
        showToast("Error deleting bookmark", "error");
      }
    }
  };

  // Tag Merger execution
  const handleMergeTags = async () => {
    const src = mergeSource.trim().toLowerCase();
    const dest = mergeTarget.trim().toLowerCase();

    if (!src || !dest) {
      showToast(t("tagMergeSelectError") || "Please select both source and destination tags.", "error");
      return;
    }

    if (src === dest) {
      showToast(t("tagMergeSameError") || "Source and destination tags cannot be the same.", "error");
      return;
    }

    const affected = bookmarks.filter(b => {
      if (!b.tags || b.tags.length === 0) return false;
      return b.tags.map(t => t.toLowerCase()).includes(src);
    });

    if (affected.length === 0) {
      showToast(`No bookmarks found with tag '${src}'`, "info");
      return;
    }

    const confirmed = await showConfirm(
      `Are you sure you want to merge '${src}' into '${dest}'?\nThis will permanently update ${affected.length} bookmark(s).`,
      "Merge Tags",
      "Cancel",
      "info"
    );

    if (!confirmed) return;

    setIsMerging(true);
    try {
      // Loop and merge tags for all affected bookmarks
      const updatePromises = affected.map(async (b) => {
        const currentTags = b.tags || [];
        // Remove source, add destination, make unique, lowercase
        const mergedTagsSet = new Set(
          currentTags
            .map(t => t.trim().toLowerCase())
            .filter(t => t !== src)
        );
        mergedTagsSet.add(dest);
        const nextTags = Array.from(mergedTagsSet);

        return chrome.runtime.sendMessage({
          type: "UPDATE_BOOKMARK",
          id: b.id,
          title: b.title,
          url: b.url,
          folderId: b.folderId,
          tags: nextTags
        }) as Promise<MessageResponse>;
      });

      const results = await Promise.all(updatePromises);
      const failures = results.filter(r => !r.success);

      if (failures.length === 0) {
        const successMsg = t("tagMergeSuccess", { src, dest }) || `Successfully merged tag '${src}' into '${dest}'!`;
        showToast(successMsg, "success");
        setSelectedTags(prev => {
          const removedSrc = prev.filter(t => t !== src);
          if (prev.includes(src) && !removedSrc.includes(dest)) {
            return [...removedSrc, dest];
          }
          return removedSrc;
        });
        setMergeSource("");
        setMergeTarget("");
        setShowMergeModal(false);
        onRefresh();
      } else {
        showToast(`Merged completed with ${failures.length} errors.`, "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error merging tags", "error");
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <>
      {DialogEl}
      <div className="h-full flex flex-col font-sans relative">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl border animate-in fade-in slide-in-from-bottom-5 duration-300 bg-white dark:bg-surface-900 border-gray-100 dark:border-surface-800">
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
                  ${isAutoTagging
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
          {/* Stat 1 */}
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

          {/* Stat 2 */}
          <div className="bg-white dark:bg-surface-900/60 backdrop-blur border border-gray-200/50 dark:border-white/[0.05] p-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                {t("tagStatsTagged") || "Tagged Bookmarks"}
              </span>
              <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-555 dark:text-emerald-450 group-hover:scale-115 transition-transform duration-300">
                <LayersIcon size={14} />
              </div>
            </div>
            <div className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 text-transparent bg-clip-text tracking-tight">
              {metrics.taggedBookmarksCount}{" "}
              <span className="text-xs text-gray-450 dark:text-gray-500 font-medium">
                / {bookmarks.length}
              </span>
            </div>
          </div>

          {/* Stat 3 */}
          <div className="bg-white dark:bg-surface-900/60 backdrop-blur border border-gray-200/50 dark:border-white/[0.05] p-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                {t("tagStatsTotal") || "Total Assignments"}
              </span>
              <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-550 dark:text-purple-400 group-hover:scale-115 transition-transform duration-300">
                <SparklesIcon size={14} />
              </div>
            </div>
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 text-transparent bg-clip-text tracking-tight">
              {metrics.totalAssignments}
            </div>
          </div>

          {/* Stat 4 */}
          <div className="bg-white dark:bg-surface-900/60 backdrop-blur border border-gray-200/50 dark:border-white/[0.05] p-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Top Popular Tag
              </span>
              <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-555 dark:text-rose-450 group-hover:scale-115 transition-transform duration-300">
                <SlidersIcon size={14} />
              </div>
            </div>
            {metrics.mostPopular ? (
              <div className="flex items-baseline gap-2 truncate">
                <span className="text-lg font-bold text-gray-800 dark:text-gray-150 truncate">
                  #{metrics.mostPopular.name}
                </span>
                <span className="text-xs font-bold text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded-md border border-rose-100 dark:border-rose-900/25 shrink-0">
                  {metrics.mostPopular.count}×
                </span>
              </div>
            ) : (
              <div className="text-sm font-medium text-gray-400 dark:text-gray-550 italic">
                None
              </div>
            )}
          </div>
        </div>

        {/* HSL Interactive Tag Cloud Card */}
        <div className={`bg-white dark:bg-surface-900/60 backdrop-blur border border-gray-200/50 dark:border-white/[0.05] rounded-3xl shadow-sm mb-6 shrink-0 relative overflow-hidden flex flex-col transition-all duration-300 ${tagCloudOpen ? "p-5 max-h-[360px]" : "p-4"}`}>
          <div
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0 cursor-pointer select-none"
            onClick={() => setTagCloudOpen(prev => !prev)}
          >
            <h2 className="text-[14px] font-bold text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-1.5">
              <SparklesIcon size={15} className="text-yellow-500" />
              {t("tagCloudTitle") || "AI Tag Cloud"}
              <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 ml-1">
                ({filteredTagsList.length})
              </span>
              {tagCloudOpen ? (
                <ChevronUpIcon size={14} className="text-gray-400 dark:text-gray-500 ml-0.5" />
              ) : (
                <ChevronDownIcon size={14} className="text-gray-400 dark:text-gray-500 ml-0.5" />
              )}
            </h2>

            {/* Tag Search and Controls - only when open */}
            {tagCloudOpen && (
              <div className="flex items-center gap-2 w-full sm:w-auto" onClick={(e) => e.stopPropagation()}>
                <div className="relative flex-1 sm:w-[220px]">
                  <SearchIcon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  <input
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                    className="w-full bg-gray-55 dark:bg-surface-900 text-xs text-gray-800 dark:text-gray-150 pl-8 pr-3 py-2 rounded-xl outline-none border border-gray-200 dark:border-surface-800 focus:border-indigo-500 dark:focus:border-indigo-500 placeholder-gray-450 dark:placeholder-gray-500 transition-colors"
                    placeholder={t("tagSearchPlaceholder") || "Filter tags..."}
                  />
                  {tagSearch && (
                    <button
                      onClick={() => setTagSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <XIcon size={12} />
                    </button>
                  )}
                </div>

                {/* Tag Selection Shortkeys */}
                <div className="flex gap-1">
                  <button
                    onClick={handleSelectAllTags}
                    className="px-2.5 py-2 bg-gray-55 dark:bg-surface-900 hover:bg-gray-100 dark:hover:bg-surface-800 text-[11px] font-semibold text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-surface-800 rounded-xl transition-colors shrink-0"
                  >
                    {t("tagSelectAll") || "All"}
                  </button>
                  <button
                    onClick={handleDeselectAllTags}
                    className="px-2.5 py-2 bg-gray-55 dark:bg-surface-900 hover:bg-gray-100 dark:hover:bg-surface-800 text-[11px] font-semibold text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-surface-800 rounded-xl transition-colors shrink-0"
                  >
                    {t("tagDeselectAll") || "Clear"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Cloud container - collapsible */}
          {tagCloudOpen && (
            <div className="flex-1 overflow-y-auto pr-1 mt-4 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-surface-800">
              {filteredTagsList.length === 0 ? (
                <div className="h-28 flex flex-col items-center justify-center text-center">
                  <TagIcon size={24} className="text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500">
                    {t("tagBoardEmpty") || "No tags found"}
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-x-4 gap-y-3 py-2 items-center justify-start">
                  {filteredTagsList.map(tagObj => {
                    const isSelected = selectedTags.includes(tagObj.name);
                    const colors = getTagColor(tagObj.name);
                    
                    // Calculate dynamic font size based on weight (frequency)
                    const fontSize = Math.min(1.4, Math.max(0.78, 0.78 + (tagObj.count * 0.045))) + "rem";

                    return (
                      <button
                        key={tagObj.name}
                        onClick={() => handleTagClick(tagObj.name)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-[11px] font-bold transition-all duration-300 active:scale-95 cursor-pointer shadow-sm hover:shadow-md relative
                          ${isSelected 
                            ? "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-surface-950 scale-105 z-10 font-extrabold shadow-md" 
                            : "opacity-85 hover:opacity-100 hover:scale-103 z-0"
                          }
                        `}
                        style={{
                          fontSize,
                          backgroundColor: isSelected ? colors.activeBg : colors.bg,
                          borderColor: isSelected ? colors.activeBorder : colors.border,
                          color: isSelected ? colors.activeText : colors.text
                        }}
                      >
                        <span>#{tagObj.name}</span>
                        <span className={`inline-flex items-center justify-center text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-0.5
                          ${isSelected 
                            ? "bg-white/20 text-white" 
                            : "bg-black/5 dark:bg-white/10 text-gray-500 dark:text-gray-400"
                          }
                        `}>
                          {tagObj.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

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
                  <span className="text-gray-800 dark:text-gray-100 font-extrabold bg-gray-55 dark:bg-white/5 px-2 py-0.5 rounded-lg">
                    {filteredBookmarks.length}
                  </span>{" "}
                  tagged bookmarks
                </>
              )}
            </span>
          </div>

          {selectedTags.length > 1 && (
            <div className="flex items-center bg-gray-55 dark:bg-surface-900 border border-gray-200 dark:border-surface-800 p-0.5 rounded-xl self-start sm:self-auto shrink-0 shadow-inner">
              <button
                onClick={() => setFilterMode("OR")}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  filterMode === "OR"
                    ? "bg-white dark:bg-surface-850 text-indigo-650 dark:text-indigo-400 shadow-md border-gray-100 dark:border-white/[0.04]"
                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                }`}
              >
                OR Match
              </button>
              <button
                onClick={() => setFilterMode("AND")}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  filterMode === "AND"
                    ? "bg-white dark:bg-surface-850 text-indigo-650 dark:text-indigo-400 shadow-md border-gray-100 dark:border-white/[0.04]"
                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                }`}
              >
                AND Match
              </button>
            </div>
          )}
        </div>

        {/* Filtered Bookmarks List */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 pb-4 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-surface-800">
          {filteredBookmarks.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center bg-white dark:bg-surface-900/30 border border-dashed border-gray-200 dark:border-surface-800 rounded-3xl p-6">
              <FilterIcon size={32} className="text-gray-300 dark:text-gray-600 mb-3 animate-pulse" />
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">
                No matching bookmarks
              </h3>
              <p className="text-xs text-gray-450 dark:text-gray-500 max-w-sm">
                Try selecting different tags or changing the match mode to OR.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredBookmarks.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="transform hover:-translate-y-0.5 active:translate-y-0 transition-transform duration-200"
                >
                  <BookmarkCard
                    bookmark={bookmark}
                    folderName={folderMap.get(bookmark.folderId)}
                    onDelete={handleDeleteBookmark}
                    onEdit={handleEditBookmarkClick}
                    onMemoChange={onRefresh}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* MODAL 1: Tag Merge Tool Modal */}
        {/* ============================================================ */}
        {showMergeModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !isMerging && setShowMergeModal(false)}
            />
            <div className="bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-850 rounded-3xl w-full max-w-lg shadow-2xl z-50 animate-in zoom-in-95 duration-200 flex flex-col overflow-hidden">
              <div className="px-6 pt-5 pb-3 border-b border-gray-100 dark:border-surface-850 flex items-center justify-between">
                <h3 className="text-[15px] font-bold text-gray-900 dark:text-gray-150 flex items-center gap-2 tracking-tight">
                  <MergeIcon size={16} className="text-indigo-500" />
                  {t("tagMergeTitle") || "Tag Merge Tool"}
                </h3>
                <button
                  disabled={isMerging}
                  onClick={() => setShowMergeModal(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-55 dark:hover:bg-surface-800 transition-colors"
                >
                  <XIcon size={16} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4 max-h-[75vh] scrollbar-thin">
                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 p-3.5 rounded-2xl flex gap-2.5 items-start">
                  <SparklesIcon size={16} className="text-indigo-500 mt-0.5 shrink-0" />
                  <p className="text-[11px] leading-relaxed text-indigo-750 dark:text-indigo-300">
                    {t("tagMergeDesc") || "Merge two redundant tags into one master tag. Bookmark associations will update automatically."}
                  </p>
                </div>

                {/* Select Source Tag */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                    {t("tagMergeSelectSource") || "Select source tag (to be merged & deleted)"}
                  </label>
                  <div className="relative">
                    <select
                      disabled={isMerging}
                      value={mergeSource}
                      onChange={(e) => {
                        setMergeSource(e.target.value);
                        if (e.target.value === mergeTarget) setMergeTarget("");
                      }}
                      className="w-full bg-gray-55 dark:bg-surface-900 text-xs text-gray-800 dark:text-gray-100 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-surface-800 outline-none focus:border-indigo-500 dark:focus:border-indigo-500 appearance-none shadow-sm cursor-pointer"
                    >
                      <option value="">-- Choose tag to delete --</option>
                      {allTagsWithCount.map(tagObj => (
                        <option key={tagObj.name} value={tagObj.name}>
                          #{tagObj.name} ({tagObj.count} bookmarks)
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-400 dark:border-t-gray-500" />
                  </div>
                </div>

                {/* Select Destination Tag */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                    {t("tagMergeSelectTarget") || "Select target master tag (to be kept)"}
                  </label>
                  <div className="relative">
                    <select
                      disabled={isMerging}
                      value={mergeTarget}
                      onChange={(e) => setMergeTarget(e.target.value)}
                      className="w-full bg-gray-55 dark:bg-surface-900 text-xs text-gray-800 dark:text-gray-100 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-surface-800 outline-none focus:border-indigo-500 dark:focus:border-indigo-500 appearance-none shadow-sm cursor-pointer"
                    >
                      <option value="">-- Choose tag to maintain --</option>
                      {allTagsWithCount
                        .filter(t => t.name !== mergeSource)
                        .map(tagObj => (
                          <option key={tagObj.name} value={tagObj.name}>
                            #{tagObj.name} ({tagObj.count} bookmarks)
                          </option>
                        ))}
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-400 dark:border-t-gray-500" />
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-55 dark:bg-surface-850/50 border-t border-gray-100 dark:border-surface-850 flex justify-end gap-2 shrink-0">
                <button
                  disabled={isMerging}
                  onClick={() => setShowMergeModal(false)}
                  className="px-4 py-2 bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-800 text-xs font-semibold text-gray-500 dark:text-gray-400 rounded-xl hover:bg-gray-100 dark:hover:bg-surface-800 transition-colors"
                >
                  {t("cancelBtn") || "Cancel"}
                </button>
                <button
                  disabled={isMerging || !mergeSource || !mergeTarget}
                  onClick={handleMergeTags}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-indigo-500/20 hover:shadow-lg flex items-center gap-1.5"
                >
                  {isMerging && (
                    <RefreshIcon size={12} className="animate-spin text-white" />
                  )}
                  {t("tagMergeBtn") || "Merge Tags"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL 2: Inline Tag Editor Modal */}
        {/* ============================================================ */}
        {editingBookmark && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setEditingBookmark(null)}
            />
            <div className="bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-850 rounded-3xl w-full max-w-md shadow-2xl z-50 animate-in zoom-in-95 duration-200 flex flex-col overflow-hidden">
              <div className="px-6 pt-5 pb-3 border-b border-gray-100 dark:border-surface-850 flex items-center justify-between">
                <h3 className="text-[14px] font-bold text-gray-900 dark:text-gray-150 flex items-center gap-1.5 tracking-tight">
                  <EditIcon size={15} className="text-indigo-500" />
                  {t("tagEditModalTitle") || "Edit Bookmark Tags"}
                </h3>
                <button
                  onClick={() => setEditingBookmark(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-55 dark:hover:bg-surface-800 transition-colors"
                >
                  <XIcon size={15} />
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh] scrollbar-thin">
                {/* Bookmark details for context */}
                <div className="p-3 bg-gray-55 dark:bg-surface-900/80 border border-gray-250/20 dark:border-surface-800/40 rounded-xl">
                  <h4 className="text-[12px] font-bold text-gray-700 dark:text-gray-200 truncate">
                    {editingBookmark.title}
                  </h4>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate mt-0.5">
                    {editingBookmark.url}
                  </p>
                </div>

                {/* Tag Input Form */}
                <form onSubmit={handleAddTagChip} className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                    Add Tag
                  </label>
                  <div className="flex gap-2">
                    <input
                      autoFocus
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      className="flex-1 bg-gray-55 dark:bg-surface-900 text-xs text-gray-800 dark:text-gray-150 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-surface-800 outline-none focus:border-indigo-500 dark:focus:border-indigo-500 placeholder-gray-450 dark:placeholder-gray-500 transition-colors"
                      placeholder={t("tagEditModalPlaceholder") || "Enter tag and press Enter..."}
                    />
                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-xl transition-all shadow-md shadow-indigo-500/10 hover:shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-0.5"
                    >
                      <PlusIcon size={15} />
                    </button>
                  </div>
                </form>

                {/* Chips Container */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                    Assigned Tags ({editingTags.length})
                  </label>
                  <div className="flex flex-wrap gap-1.5 p-3.5 bg-gray-55 dark:bg-surface-900/60 rounded-xl border border-gray-200/50 dark:border-surface-850 border-dashed min-h-[70px] align-top items-start">
                    {editingTags.length === 0 ? (
                      <span className="text-[10.5px] italic text-gray-400 dark:text-gray-500 self-center mx-auto">
                        No tags assigned to this bookmark.
                      </span>
                    ) : (
                      editingTags.map(tag => {
                        const colors = getTagColor(tag);
                        return (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10.5px] font-bold transition-all shadow-sm"
                            style={{
                              backgroundColor: colors.bg,
                              borderColor: colors.border,
                              color: colors.text
                            }}
                          >
                            <span>#{tag}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveTagChip(tag)}
                              className="text-gray-400 hover:text-red-500 rounded p-0.5 transition-colors"
                            >
                              <XIcon size={10} strokeWidth={2.5} />
                            </button>
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-55 dark:bg-surface-850/50 border-t border-gray-100 dark:border-surface-850 flex justify-end gap-2 shrink-0">
                <button
                  onClick={() => setEditingBookmark(null)}
                  className="px-4 py-2 bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-800 text-xs font-semibold text-gray-500 dark:text-gray-400 rounded-xl hover:bg-gray-100 dark:hover:bg-surface-800 transition-colors"
                >
                  {t("cancelBtn") || "Cancel"}
                </button>
                <button
                  onClick={handleSaveTags}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-indigo-500/20 hover:shadow-lg"
                >
                  {t("saveBtn") || "Save"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
