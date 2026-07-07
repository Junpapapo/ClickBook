import React, { useState, useEffect } from "react";
import { Search, X, Link, FileText } from "lucide-react";
import type { BookmarkSelectorProps } from "../spring-note-types";
import type { Bookmark, BookmarkMemo, MessageResponse } from "@/shared/types";

export default function BookmarkSelector({
  onSelectBookmark,
  onSelectMemo,
  t,
  onClose,
}: BookmarkSelectorProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [memos, setMemos] = useState<Record<string, BookmarkMemo>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"bookmarks" | "memos">("bookmarks");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const bmRes = (await chrome.runtime.sendMessage({ type: "GET_BOOKMARKS" })) as MessageResponse;
        if (bmRes.success && bmRes.data) {
          setBookmarks(bmRes.data);
        }
        const memoRes = (await chrome.runtime.sendMessage({ type: "GET_MEMOS" })) as MessageResponse;
        if (memoRes.success && memoRes.data) {
          setMemos(memoRes.data);
        }
      } catch (err) {
        console.warn("Failed to fetch bookmarks/memos for Spring Note drawer:", err);
      }
    };
    fetchData();
  }, []);

  const filteredBookmarks = bookmarks.filter(
    (b) =>
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMemos = Object.values(memos).filter((m) =>
    m.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-80 h-full bg-white dark:bg-[#1E1E20] border-l border-gray-250 dark:border-surface-700/60 flex flex-col transition-colors z-45 shadow-xl shrink-0 animate-in slide-in-from-right duration-200 select-none">
      {/* 드로어 헤더 */}
      <div className="p-3 border-b border-gray-200 dark:border-surface-700/60 flex items-center justify-between shrink-0">
        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
          {t("springNoteDrawerTitle") || "Library"}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-450 hover:text-gray-700 dark:hover:text-white p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-800 transition-colors"
          title={t("springNoteCloseDrawerTooltip") || "Close"}
        >
          <X size={16} />
        </button>
      </div>

      {/* 탭 인터페이스 */}
      <div className="flex border-b border-gray-200 dark:border-surface-700/60 text-xs shrink-0 bg-gray-50/50 dark:bg-surface-900/30">
        <button
          type="button"
          onClick={() => setActiveTab("bookmarks")}
          className={`flex-1 py-2.5 font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 ${
            activeTab === "bookmarks"
              ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-extrabold"
              : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
          }`}
        >
          <Link size={12} />
          <span>Bookmarks</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("memos")}
          className={`flex-1 py-2.5 font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 ${
            activeTab === "memos"
              ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-extrabold"
              : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
          }`}
        >
          <FileText size={12} />
          <span>Memos</span>
        </button>
      </div>

      {/* 검색 바 */}
      <div className="p-3 shrink-0">
        <div className="relative flex items-center">
          <Search size={14} className="absolute left-3 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("springNoteSearchPlaceholder") || "Search..."}
            className="w-full pl-9 pr-3 py-1.5 bg-gray-50 dark:bg-surface-900 text-xs text-gray-800 dark:text-gray-200 rounded-xl border border-gray-200 dark:border-surface-700/60 focus:border-indigo-505 dark:focus:border-indigo-400 focus:outline-none transition-all shadow-inner"
          />
        </div>
      </div>

      {/* 리스트 영역 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
        {activeTab === "bookmarks" ? (
          filteredBookmarks.length > 0 ? (
            filteredBookmarks.map((b) => (
              <button
                type="button"
                key={b.id}
                onClick={() =>
                  onSelectBookmark({ title: b.title, url: b.url, id: b.id, favicon: b.favicon })
                }
                className="w-full text-left p-2.5 bg-gray-50/50 dark:bg-surface-800/10 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 border border-gray-150 dark:border-white/5 rounded-xl transition-all cursor-pointer flex gap-2.5 group min-w-0"
              >
                <img
                  src={b.favicon}
                  alt=""
                  className="w-4 h-4 shrink-0 rounded mt-0.5 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://www.google.com/s2/favicons?domain=example.com";
                  }}
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {b.title}
                  </h4>
                  <p className="text-[10px] text-gray-400 truncate mt-0.5">{b.url}</p>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-8 text-xs text-gray-400">
              {t("springNoteNoItems") || "No items found."}
            </div>
          )
        ) : filteredMemos.length > 0 ? (
          filteredMemos.map((m) => {
            const bm = bookmarks.find((b) => b.id === m.bookmarkId);
            return (
              <button
                type="button"
                key={m.bookmarkId}
                onClick={() =>
                  onSelectMemo({ id: m.bookmarkId, content: m.content, color: m.color })
                }
                className="w-full text-left p-2.5 bg-gray-50/50 dark:bg-surface-800/10 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 border border-gray-150 dark:border-white/5 rounded-xl transition-all cursor-pointer flex flex-col gap-1.5 group"
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      m.color === "pink"
                        ? "bg-rose-400"
                        : m.color === "blue"
                        ? "bg-blue-400"
                        : m.color === "green"
                        ? "bg-emerald-400"
                        : m.color === "purple"
                        ? "bg-purple-400"
                        : "bg-amber-400"
                    }`}
                  />
                  <span className="text-[10px] font-bold text-gray-400 truncate flex-1">
                    {bm?.title || "Standalone Memo"}
                  </span>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-3 leading-normal">
                  {m.content}
                </p>
              </button>
            );
          })
        ) : (
          <div className="text-center py-8 text-xs text-gray-400">
            {t("springNoteNoItems") || "No items found."}
          </div>
        )}
      </div>

      {/* 안내 영역 */}
      <div className="p-3 bg-gray-50 dark:bg-surface-900 border-t border-gray-200 dark:border-surface-700/60 text-[10px] text-gray-400 text-center select-none shrink-0">
        {t("springNoteDragHint") || "Click item to place on note"}
      </div>
    </div>
  );
}

