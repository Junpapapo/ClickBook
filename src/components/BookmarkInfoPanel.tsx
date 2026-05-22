import { useState, useRef, useCallback } from "react";
import { X, Info, Tag, ExternalLink, RefreshCw, StickyNote, Pencil, FolderOpen, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Bookmark, BookmarkMemo, MemoColor, Folder } from "@/shared/types";
import { MEMO_TEXTAREA_BG } from "@/shared/colors";
import { useLang } from "@/shared/LanguageContext";
import { getLocalizedFolderName } from "@/shared/categories";
import { MemoPopover } from "./BookmarkCard";
import { EditModal } from "./BookmarkEditPanel";

interface Props {
  bookmark: Bookmark | null;
  memo: BookmarkMemo | undefined;
  folders: Folder[];
  onClose: () => void;
  onRefresh?: () => void;
}

export default function BookmarkInfoPanel({ bookmark, memo, folders, onClose, onRefresh }: Props) {
  const { t, lang } = useLang();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showMemoPopover, setShowMemoPopover] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const memoBtnRef = useRef<HTMLButtonElement | null>(null);

  const handleCopy = useCallback(async () => {
    if (!bookmark) return;
    try {
      await navigator.clipboard.writeText(bookmark.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [bookmark]);

  const handleMemoSave = useCallback(async (content: string, color: MemoColor) => {
    if (!bookmark) return;
    await chrome.runtime.sendMessage({ type: "SAVE_MEMO", bookmarkId: bookmark.id, content, color });
    onRefresh?.();
  }, [bookmark, onRefresh]);

  const handleMemoDelete = useCallback(async () => {
    if (!bookmark) return;
    await chrome.runtime.sendMessage({ type: "DELETE_MEMO", bookmarkId: bookmark.id });
    onRefresh?.();
  }, [bookmark, onRefresh]);

  const handleUpdateAI = async () => {
    if (!bookmark) return;
    setIsUpdating(true);
    try {
      const res = await chrome.runtime.sendMessage({
        type: "UPDATE_AI_INFO",
        id: bookmark.id,
        url: bookmark.url,
        title: bookmark.title,
      });
      if (res.success && onRefresh) {
        onRefresh();
      } else if (!res.success && res.error) {
        alert(res.error);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to update AI info.");
    } finally {
      setIsUpdating(false);
    }
  };

  const currentFolder = bookmark ? folders.find(f => f.id === bookmark.folderId) : null;
  const isEmoji = (s: string) => !!s && !/^[A-Za-z0-9_]+$/.test(s);
  const folderDisplayName = currentFolder 
    ? (isEmoji(currentFolder.icon) ? currentFolder.icon + " " : "") + getLocalizedFolderName(currentFolder, lang)
    : "";

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
    <>
      {isEditing && bookmark && (
        <EditModal
          mode="edit"
          bookmark={bookmark}
          folders={folders}
          onSaved={() => { setIsEditing(false); onRefresh?.(); }}
          onDeleted={() => { setIsEditing(false); onClose(); onRefresh?.(); }}
          onClose={() => setIsEditing(false)}
        />
      )}
      <div className="w-72 h-full flex flex-col border-l border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-surface-700 shrink-0">
        <div className="flex items-center gap-2">
          <Info size={14} className="text-indigo-500" />
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">Site Info</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:text-indigo-400 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
            title="Edit Site"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
          >
            <X size={14} />
          </button>
        </div>
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
              <div className="flex items-center gap-2 mt-1">
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                >
                  <span className="truncate max-w-[150px]">{bookmark.domain}</span>
                  <ExternalLink size={10} />
                </a>
                <button
                  onClick={handleCopy}
                  className="p-1 text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                  title={t("popupUrlCopySection")}
                >
                  {copied ? <Check size={10} className="text-green-500" /> : <Copy size={10} />}
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <div className="text-[10px] text-gray-400 dark:text-gray-500">
              Saved on {new Date(bookmark.savedAt).toLocaleDateString(t("timeLocale") || "en-US", { year: 'numeric', month: 'short', day: 'numeric' })}
            </div>
            {currentFolder && (
              <div className="flex items-center gap-1 text-[10px] text-indigo-600 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full truncate max-w-[120px]" title="Folder">
                <FolderOpen size={10} className="shrink-0" />
                <span className="truncate">{folderDisplayName}</span>
              </div>
            )}
          </div>
        </div>

        {/* AI Summary */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              AI Summary
            </h4>
            <button
              onClick={handleUpdateAI}
              disabled={isUpdating}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 rounded-md border border-indigo-200 dark:border-indigo-500/20 transition-colors disabled:opacity-50"
              title="Refresh AI Info"
            >
              <RefreshCw size={10} className={isUpdating ? "animate-spin" : ""} />
              {isUpdating ? "Updating..." : "Refresh"}
            </button>
          </div>
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
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
              Memo
            </h4>
            <button
              ref={memoBtnRef}
              onClick={() => setShowMemoPopover(!showMemoPopover)}
              className="p-1 text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-500/10 rounded transition-colors"
              title={memo ? "Edit Memo" : "Add Memo"}
            >
              <Pencil size={12} />
            </button>
          </div>
          {memo ? (
            <div className={`rounded-xl p-3 text-xs leading-relaxed text-gray-800 dark:text-gray-200 markdown-body ${MEMO_TEXTAREA_BG[memo.color]}`}>
              <ReactMarkdown
                components={{
                  p: ({ node, ...props }) => <p className="whitespace-pre-wrap mb-2 last:mb-0" {...props} />,
                  ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2 last:mb-0" {...props} />,
                  ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2 last:mb-0" {...props} />,
                  li: ({ node, ...props }) => <li className="mb-0.5" {...props} />,
                  a: ({ node, ...props }) => <a className="text-indigo-500 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                  strong: ({ node, ...props }) => <strong className="font-semibold text-gray-900 dark:text-gray-100" {...props} />
                }}
              >
                {memo.content}
              </ReactMarkdown>
            </div>
          ) : (
            <button
              onClick={() => setShowMemoPopover(true)}
              className="w-full py-3 px-4 border border-dashed border-gray-300 dark:border-surface-600 rounded-xl text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-surface-500 hover:bg-gray-50 dark:hover:bg-surface-800 transition-all flex items-center justify-center gap-2"
            >
              <StickyNote size={14} />
              Add a memo
            </button>
          )}
        </div>
      </div>
      {showMemoPopover && (
        <MemoPopover
          memo={memo}
          bookmark={{ title: bookmark.title, url: bookmark.url, summary: bookmark.summary, tags: bookmark.tags }}
          anchorRef={memoBtnRef}
          onClose={() => setShowMemoPopover(false)}
          onSave={handleMemoSave}
          onDelete={handleMemoDelete}
        />
      )}
    </div>
    </>
  );
}
