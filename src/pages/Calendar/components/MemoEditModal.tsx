import React, { useState, useEffect } from "react";
import { 
  X, 
  Check, 
  Trash2, 
  StickyNote, 
  Link as LinkIcon 
} from "lucide-react";
import type { Bookmark, BookmarkMemo, MemoColor } from "@/shared/types";
import { MEMO_COLORS } from "../calendar-utils";

interface MemoEditModalProps {
  item: { bookmark: Bookmark | null; memo: BookmarkMemo };
  onClose: () => void;
  onSave: (content: string, color: MemoColor) => void;
  onDelete: (bookmarkId: string) => void;
  t: (key: string) => string;
}

export default function MemoEditModal({
  item,
  onClose,
  onSave,
  onDelete,
  t
}: MemoEditModalProps) {
  const [content, setContent] = useState(item.memo.content);
  const [color, setColor] = useState<MemoColor>(item.memo.color || "yellow");
  const [width, setWidth] = useState<number>(450);
  const [isResizing, setIsResizing] = useState(false);

  // Sync state if item changes
  useEffect(() => {
    setContent(item.memo.content);
    setColor(item.memo.color || "yellow");
    const initialWidth = Math.min(750, Math.max(450, 450 + Math.floor((item.memo.content || "").length / 5)));
    setWidth(initialWidth);
  }, [item]);

  // Mouse drag resize handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      setWidth((w) => Math.max(380, Math.min(950, w + e.movementX * 2)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const handleSave = () => {
    const trimmedContent = content.trim();
    if (!trimmedContent) return;
    onSave(trimmedContent, color);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[999] animate-in fade-in duration-200">
      <div
        style={{ width: `${width}px`, maxWidth: "90vw" }}
        className="bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-700/60 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col relative"
      >
        {/* Resize Handle */}
        <div
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizing(true);
          }}
          className="absolute top-0 right-0 bottom-0 w-2.5 cursor-col-resize hover:bg-indigo-500/20 active:bg-indigo-500/40 transition-colors z-50 flex items-center justify-center group"
          title="가로폭 조절"
        >
          <div className="w-0.5 h-8 bg-gray-350 dark:bg-surface-600 rounded opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Header */}
        <div className="px-4.5 py-3.5 border-b border-gray-200/60 dark:border-surface-800/80 flex items-center justify-between shrink-0">
          <span className="text-xs font-bold text-amber-550 uppercase tracking-widest bg-amber-500/10 px-2.5 py-1 rounded-full flex items-center gap-1">
            <StickyNote size={12} />
            MEMO EDITOR
          </span>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-surface-800 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4.5 space-y-3.5 select-none">
          {/* Linked Bookmark Card (Only if bookmark is not null) */}
          {item.bookmark ? (
            <div className="flex gap-2.5 bg-gray-100/50 dark:bg-surface-800 p-2.5 rounded-2xl border border-gray-200/20 dark:border-white/5 relative group/card">
              <img
                src={item.bookmark.favicon}
                alt=""
                className="w-6 h-6 rounded-lg bg-white shrink-0 shadow-sm self-center"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              <div className="flex-1 min-w-0 pr-6">
                <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate leading-snug">
                  {item.bookmark.title}
                </h4>
                <a
                  href={item.bookmark.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[9px] text-indigo-500 hover:underline flex items-center gap-0.5 mt-0.5 truncate max-w-full font-mono"
                >
                  <LinkIcon size={8} />
                  {item.bookmark.url}
                </a>
              </div>
            </div>
          ) : (
            <div className="p-2.5 bg-amber-500/5 dark:bg-amber-955/10 border border-amber-250/20 dark:border-amber-900/30 rounded-2xl flex items-center gap-2">
              <StickyNote size={14} className="text-amber-500" />
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                독립형 일반 메모 (연결된 북마크 없음)
              </span>
            </div>
          )}

          {/* Memo Color picker */}
          <div className="flex items-center justify-between bg-gray-50/50 dark:bg-surface-800/40 p-2.5 rounded-2xl border border-gray-200/10">
            <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
              메모 색상
            </label>
            <div className="flex gap-2">
              {(["yellow", "pink", "blue", "green", "purple"] as MemoColor[]).map((col) => {
                const isActive = color === col;
                let dotBg = "bg-yellow-400";
                if (col === "pink") dotBg = "bg-rose-400";
                if (col === "blue") dotBg = "bg-blue-400";
                if (col === "green") dotBg = "bg-emerald-400";
                if (col === "purple") dotBg = "bg-purple-400";

                return (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setColor(col)}
                    className={`w-5 h-5 rounded-full ${dotBg} shadow transition-transform hover:scale-115 flex items-center justify-center
                      ${isActive ? "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-surface-900 scale-110" : ""}
                    `}
                  >
                    {isActive && <Check size={10} className="text-white font-bold" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Memo input box */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
              메모 내용
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={14}
              placeholder={t("memoPlaceholder") || "Enter memo..."}
              className="w-full bg-gray-100 dark:bg-surface-800 text-xs border border-gray-200/60 dark:border-surface-700/65 rounded-xl px-3 py-2 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-indigo-500 resize-y min-h-[320px] font-sans"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-4.5 py-3.5 border-t border-gray-200/60 dark:border-surface-800/80 bg-gray-50/60 dark:bg-surface-900/50 flex items-center justify-between shrink-0">
          <button
            onClick={() => onDelete(item.memo.bookmarkId)}
            className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-955/20 px-3 py-2 rounded-xl transition-all"
          >
            <Trash2 size={13} />
            Delete Memo
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!content.trim()}
              className="px-5 py-2.5 text-xs bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-150 disabled:text-gray-400 dark:disabled:bg-surface-800 text-white rounded-xl font-semibold transition-all shadow-md shadow-indigo-500/10 active:scale-95"
            >
              Save Memo
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
