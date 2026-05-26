import React, { useState, useEffect } from "react";
import { BookOpen, Play, Loader2, Trash2 } from "lucide-react";
import { useLang } from "@/shared/LanguageContext";
import type { Bookmark } from "@/shared/types";
import { sendMsg } from "@/shared/utils";

interface Props {
  bookmarks: Bookmark[];
}

export default function RecentReaderWidget({ bookmarks }: Props) {
  const { t } = useLang();
  const [recentReadIds, setRecentReadIds] = useState<string[]>([]);
  const [scrollMap, setScrollMap] = useState<Record<string, number>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    const loadRecentData = () => {
      chrome.storage.local.get(["clickbook_recent_reads", "clickbook_reader_scrolls"], (result) => {
        const recent = (result.clickbook_recent_reads as string[]) || [];
        const scrolls = (result.clickbook_reader_scrolls as Record<string, number>) || {};
        setRecentReadIds(recent);
        setScrollMap(scrolls);
      });
    };

    loadRecentData();

    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string
    ) => {
      if (areaName === "local" && (changes.clickbook_recent_reads || changes.clickbook_reader_scrolls)) {
        loadRecentData();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const handleOpenReader = async (bookmark: Bookmark) => {
    setLoadingId(bookmark.id);
    try {
      const res = await sendMsg({ type: "GET_PAGE_CONTENT", bookmarkId: bookmark.id });
      const content = res.success && res.data
        ? (typeof res.data === "string" ? res.data : ((res.data as any).readableContent || (res.data as any).rawText || ""))
        : (bookmark.summary || "");
      
      window.dispatchEvent(
        new CustomEvent("OPEN_READER_MODE", {
          detail: {
            bookmarkId: bookmark.id,
            title: bookmark.title,
            url: bookmark.url,
            content,
          },
        })
      );
    } catch (err) {
      console.error("Failed to open reader from recent reader widget:", err);
    } finally {
      setLoadingId(null);
    }
  };

  const handleRemoveFromHistory = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    chrome.storage.local.get(["clickbook_recent_reads"], (result) => {
      const recent = (result.clickbook_recent_reads as string[]) || [];
      const updated = recent.filter((x) => x !== id);
      chrome.storage.local.set({ clickbook_recent_reads: updated }, () => {
        setRecentReadIds(updated);
      });
    });
  };

  // Resolve matching Bookmark objects
  const recentReads = recentReadIds
    .map((id) => bookmarks.find((b) => b.id === id))
    .filter((b): b is Bookmark => !!b);

  if (recentReads.length === 0) return null;

  const getHostname = (urlStr: string) => {
    try {
      return new URL(urlStr).hostname;
    } catch {
      return urlStr;
    }
  };

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-purple-500" />
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {t("recentReadsTitle")}
          </h2>
          <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 text-[9px] font-bold rounded uppercase tracking-wider">
            Reader
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {recentReads.map((b) => {
          const progress = Math.round(scrollMap[b.id] || 0);
          const isCompleted = progress >= 95;
          const isLoading = loadingId === b.id;

          return (
            <div
              key={b.id}
              onClick={() => !isLoading && handleOpenReader(b)}
              className="group relative bg-white dark:bg-surface-800 border border-gray-200/60 dark:border-surface-700 rounded-2xl p-4 shadow-sm hover:shadow-md hover:shadow-purple-500/5 dark:hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between"
            >
              {/* Card Header: Icon, domain, and close button */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center shrink-0 border border-purple-100/50 dark:border-purple-500/10 group-hover:scale-110 transition-transform duration-300">
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${getHostname(b.url)}&sz=64`}
                      alt=""
                      className="w-5 h-5 rounded-md object-contain"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 truncate">
                      {getHostname(b.url)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={(e) => handleRemoveFromHistory(e, b.id)}
                  className="p-1 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 opacity-0 group-hover:opacity-100 transition-all duration-200 shrink-0"
                  title="Remove from history"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              {/* Card Body: Title */}
              <div className="mb-4 flex-1">
                <h3 className="text-xs font-bold text-gray-800 dark:text-gray-100 line-clamp-2 leading-relaxed group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-200">
                  {b.title}
                </h3>
              </div>

              {/* Card Footer: Progress tracker */}
              <div className="space-y-2 mt-auto">
                <div className="flex justify-between items-center text-[10px]">
                  <span className={`font-semibold ${isCompleted ? "text-emerald-500 dark:text-emerald-400" : "text-purple-500 dark:text-purple-400"}`}>
                    {isCompleted ? t("readerCompleted") : t("readerProgress", { n: progress })}
                  </span>
                  <span className="text-gray-400 dark:text-gray-500 group-hover:translate-x-1 transition-transform duration-200">
                    {isLoading ? (
                      <Loader2 size={12} className="animate-spin text-purple-500" />
                    ) : (
                      <Play size={10} className="fill-purple-500 text-purple-500" />
                    )}
                  </span>
                </div>
                {/* Progress Bar background and fill */}
                <div className="w-full h-1.5 bg-gray-100 dark:bg-surface-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isCompleted
                        ? "bg-emerald-500"
                        : "bg-gradient-to-r from-purple-500 to-indigo-500"
                    }`}
                    style={{ width: `${Math.max(3, progress)}%` }}
                  />
                </div>
              </div>

              {/* Subtle accent border on hover */}
              <div className="absolute inset-0 border border-transparent group-hover:border-purple-500/20 rounded-2xl pointer-events-none transition-colors duration-300" />
            </div>
          );
        })}
      </div>
    </section>
  );
}
