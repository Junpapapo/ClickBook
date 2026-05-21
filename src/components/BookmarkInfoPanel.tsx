import { X, Info, Tag, ExternalLink } from "lucide-react";
import type { Bookmark, BookmarkMemo } from "@/shared/types";
import { MEMO_TEXTAREA_BG } from "@/shared/colors";
import { useLang } from "@/shared/LanguageContext";

interface Props {
  bookmark: Bookmark | null;
  memo: BookmarkMemo | undefined;
  onClose: () => void;
}

export default function BookmarkInfoPanel({ bookmark, memo, onClose }: Props) {
  const { t } = useLang();

  if (!bookmark) {
    return (
      <div className="w-72 h-full flex flex-col items-center justify-center border-l border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-6 text-center">
        <Info size={32} className="text-gray-300 dark:text-gray-600 mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Select a bookmark's <br/> [Info] button to view details.
        </p>
        <button
          onClick={onClose}
          className="mt-6 px-4 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 dark:bg-surface-800 hover:bg-gray-200 dark:hover:bg-surface-700 rounded-lg transition-colors"
        >
          Close Panel
        </button>
      </div>
    );
  }

  return (
    <div className="w-72 h-full flex flex-col border-l border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-surface-700 shrink-0">
        <div className="flex items-center gap-2">
          <Info size={14} className="text-indigo-500" />
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">Site Info</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Basic Info */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <img
              src={bookmark.favicon}
              alt=""
              width={24}
              height={24}
              className="rounded shrink-0 mt-0.5"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 leading-snug">
                {bookmark.title}
              </h3>
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-1 text-[11px] text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
              >
                <span className="truncate max-w-[200px]">{bookmark.domain}</span>
                <ExternalLink size={10} />
              </a>
            </div>
          </div>
          
          <div className="text-[10px] text-gray-400 dark:text-gray-500">
            Saved on {new Date(bookmark.savedAt).toLocaleDateString(t("timeLocale") || "en-US", { year: 'numeric', month: 'short', day: 'numeric' })}
          </div>
        </div>

        {/* AI Summary */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            AI Summary
          </h4>
          <div className="bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10 rounded-xl p-3">
            {bookmark.summary ? (
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                {bookmark.summary}
              </p>
            ) : (
              <p className="text-xs text-gray-400 italic">No summary available.</p>
            )}
          </div>
        </div>

        {/* AI Tags */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5 uppercase tracking-wider">
            <Tag size={12} className="text-emerald-500" />
            Tags
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {bookmark.tags && bookmark.tags.length > 0 ? (
              bookmark.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium rounded-md border border-emerald-100 dark:border-emerald-500/20"
                >
                  #{tag}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-400 italic">No tags</span>
            )}
          </div>
        </div>

        {/* Memo */}
        {memo && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
              Memo
            </h4>
            <div className={`rounded-xl p-3 text-xs leading-relaxed text-gray-800 dark:text-gray-200 ${MEMO_TEXTAREA_BG[memo.color]}`}>
              {memo.content}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
