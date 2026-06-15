import React from "react";
import { Filter as FilterIcon } from "lucide-react";
import BookmarkCard from "@/components/BookmarkCard";
import type { Bookmark, MessageResponse } from "@/shared/types";

interface TagBookmarkListProps {
  bookmarks: Bookmark[];
  filteredBookmarks: Bookmark[];
  folderMap: Map<string, string>;
  onRefresh: () => void;
  showToast: (text: string, type?: "success" | "error" | "info") => void;
  showConfirm: (
    msg: string,
    okLabel?: string,
    cancelLabel?: string,
    type?: "info" | "warn" | "error"
  ) => Promise<boolean>;
  handleEditBookmarkClick: (b: Bookmark) => void;
  t: (key: string, params?: any) => string;
}

export default function TagBookmarkList({
  bookmarks,
  filteredBookmarks,
  folderMap,
  onRefresh,
  showToast,
  showConfirm,
  handleEditBookmarkClick,
  t,
}: TagBookmarkListProps) {
  const handleDeleteBookmark = async (id: string) => {
    const target = bookmarks.find((b) => b.id === id);
    if (!target) return;
    const confirmMsg = t("deleteConfirm", { title: target.title }) || `Delete "${target.title}"?`;
    const confirmed = await showConfirm(confirmMsg, "Delete", "Cancel", "warn");
    if (confirmed) {
      try {
        const response = (await chrome.runtime.sendMessage({
          type: "DELETE_BOOKMARK",
          id,
        })) as MessageResponse;
        if (response.success) {
          showToast(
            t("aiCleanerDone", { n: 1 }) || "Deleted bookmark successfully",
            "success"
          );
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

  return (
    <div className="flex-1 min-h-0 overflow-y-auto pr-1 pb-4 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-surface-800">
      {filteredBookmarks.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-center bg-white dark:bg-surface-900/30 border border-dashed border-gray-200 dark:border-surface-800 rounded-3xl p-6">
          <FilterIcon size={32} className="text-gray-300 dark:text-gray-650 mb-3 animate-pulse" />
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
  );
}
