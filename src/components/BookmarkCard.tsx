import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Trash2, ExternalLink, Pencil, StickyNote, X, Info } from "lucide-react";
import type { Bookmark, BookmarkMemo, MemoColor } from "@/shared/types";
import { MEMO_DOT, MEMO_TEXTAREA_BG, ALL_MEMO_COLORS as ALL_COLORS } from "@/shared/colors";
import { useLang } from "@/shared/LanguageContext";
import type { TFunction } from "@/shared/i18n";

// ── ユーティリティ ─────────────────────────────────────────

function formatRelativeTime(timestamp: number, t: TFunction): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (minutes < 1) return t("timeJustNow");
  if (minutes < 60) return t("timeMinAgo", { n: minutes });
  if (hours < 24) return t("timeHourAgo", { n: hours });
  if (days < 30) return t("timeDayAgo", { n: days });
  return new Date(timestamp).toLocaleDateString(t("timeLocale"));
}

function shortenUrl(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname.length > 30 ? u.pathname.slice(0, 30) + "…" : u.pathname;
    const query = u.search ? "?…" : "";
    return u.hostname + path + query;
  } catch (err) {
    console.warn("Operation failed:", err);
    return url.slice(0, 50);
  }
}

// ── MemoPopover（createPortal で body 直下にレンダリング） ──

export interface PopoverProps {
  memo?: BookmarkMemo;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onSave: (content: string, color: MemoColor) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function MemoPopover({ memo, anchorRef, onClose, onSave, onDelete }: PopoverProps) {
  const { t } = useLang();
  const [content, setContent] = useState(memo?.content ?? "");
  const [color, setColor] = useState<MemoColor>(memo?.color ?? "yellow");
  const popRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!anchorRef.current) return;
    const r  = anchorRef.current.getBoundingClientRect();
    const ph = 248;
    const pw = 244;
    const top  = r.bottom + 8 + ph < window.innerHeight ? r.bottom + 8 : r.top - ph - 8;
    const left = Math.max(8, Math.min(r.left, window.innerWidth - pw - 8));
    setPos({ top, left });
  }, [anchorRef]);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (anchorRef.current?.contains(e.target as Node)) return;
      if (popRef.current && !popRef.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [anchorRef, onClose]);

  return createPortal(
    <div
      ref={popRef}
      style={{ position: "fixed", top: pos.top, left: pos.left, width: 244, zIndex: 9999 }}
      className="bg-white dark:bg-surface-800 border border-gray-200 dark:border-surface-600 rounded-xl shadow-2xl p-3"
      onClick={(e) => e.stopPropagation()}
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1">
          <StickyNote size={10} />
          {t("memo")}
        </span>
        <button onClick={onClose} className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
          <X size={12} />
        </button>
      </div>

      {/* カラーピッカー */}
      <div className="flex items-center gap-1.5 mb-2">
        {ALL_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={`w-4 h-4 rounded-full ${MEMO_DOT[c]} transition-all ${
              color === c
                ? "ring-2 ring-offset-1 ring-gray-400 dark:ring-gray-500 dark:ring-offset-surface-800"
                : "opacity-50 hover:opacity-100"
            }`}
          />
        ))}
        {memo && (
          <button
            onClick={async () => { await onDelete(); onClose(); }}
            className="ml-auto p-0.5 text-gray-400 hover:text-red-400 transition-colors"
            title={t("deleteMemoTooltip")}
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {/* テキストエリア */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        autoFocus
        placeholder={t("memoPlaceholder")}
        rows={4}
        onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
        className={`w-full text-xs rounded-lg px-2.5 py-2 resize-none outline-none leading-relaxed ${MEMO_TEXTAREA_BG[color]} text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500`}
      />

      {/* アクションボタン */}
      <div className="flex justify-end gap-2 mt-2">
        <button
          onClick={onClose}
          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-2 py-1 transition-colors"
        >
          Close
        </button>
        <button
          onClick={async () => {
            if (content.trim()) await onSave(content.trim(), color);
            else if (memo)      await onDelete();
            onClose();
          }}
          className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-lg transition-colors"
        >
          Save
        </button>
      </div>
    </div>,
    document.body
  );
}

// ── BookmarkCard ──────────────────────────────────────────

interface Props {
  bookmark: Bookmark;
  memo?: BookmarkMemo;
  folderName?: string;
  onDelete?: (id: string) => void;
  onEdit?: (b: Bookmark) => void;
  onMemoChange?: () => void;
}

export default function BookmarkCard({ bookmark, memo, folderName, onDelete, onEdit, onMemoChange }: Props) {
  const { t } = useLang();
  const [showPopover, setShowPopover] = useState(false);
  const stickyBtnRef = useRef<HTMLButtonElement | null>(null);

  function handleOpen() {
    chrome.runtime.sendMessage({ type: "INCREMENT_VISIT", id: bookmark.id });
    window.open(bookmark.url, "_blank", "noopener,noreferrer");
  }

  function handleDragStart(e: React.DragEvent<HTMLDivElement>) {
    e.dataTransfer.setData("text/plain", bookmark.id);
    e.dataTransfer.setData("application/x-clickbook-type", "bookmark");
    e.dataTransfer.effectAllowed = "move";
  }

  const handleMemoSave = useCallback(async (content: string, color: MemoColor) => {
    await chrome.runtime.sendMessage({ type: "SAVE_MEMO", bookmarkId: bookmark.id, content, color });
    onMemoChange?.();
  }, [bookmark.id, onMemoChange]);

  const handleMemoDelete = useCallback(async () => {
    await chrome.runtime.sendMessage({ type: "DELETE_MEMO", bookmarkId: bookmark.id });
    onMemoChange?.();
  }, [bookmark.id, onMemoChange]);

  return (
    <>
      <div
        draggable
        onDragStart={handleDragStart}
        className="group relative bg-white dark:bg-surface-800 border border-gray-200 dark:border-surface-700 rounded-xl overflow-hidden hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all duration-200 cursor-grab active:cursor-grabbing shadow-sm dark:shadow-none"
      >
        {/* メモ有りドット */}
        {memo && (
          <div className={`absolute top-2 left-2 w-2 h-2 rounded-full z-10 shadow-sm ${MEMO_DOT[memo.color]}`} />
        )}

        {/* OGP サムネイル */}
        {bookmark.ogpImage && (
          <div className="w-full h-28 overflow-hidden bg-surface-700">
            <img
              src={bookmark.ogpImage}
              alt=""
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
        )}

        <div className="p-3 flex flex-col gap-1.5">
          {/* ファビコン + ドメイン */}
          <div className="flex items-center gap-2">
            <img
              src={bookmark.favicon}
              alt=""
              width={16}
              height={16}
              className="rounded-sm shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <span className="text-xs text-gray-500 truncate">{bookmark.domain}</span>
            {folderName && (
              <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 font-medium truncate max-w-[72px]">
                {folderName}
              </span>
            )}
            <span className="ml-auto text-[10px] text-gray-600 shrink-0">
              {formatRelativeTime(bookmark.savedAt, t)}
            </span>
          </div>

          {/* タイトル */}
          <button
            onClick={handleOpen}
            className="text-left text-sm font-medium text-gray-800 dark:text-gray-200 hover:text-indigo-500 dark:hover:text-indigo-300 line-clamp-2 transition-colors leading-snug"
          >
            {bookmark.title}
          </button>

          {/* URL + 編集ボタン */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-gray-600 truncate flex-1">{shortenUrl(bookmark.url)}</span>
            {onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(bookmark); }}
                className="shrink-0 p-1 rounded hover:bg-indigo-900/30 transition-colors"
                title={t("editTooltip")}
              >
                <Pencil size={11} className="text-gray-500 hover:text-indigo-400 transition-colors" />
              </button>
            )}
          </div>
          {/* AI Tags */}
          {bookmark.tags && bookmark.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-0.5">
              {bookmark.tags.map(tag => (
                <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded border border-emerald-100 dark:border-emerald-500/20 truncate max-w-[80px]">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ホバー時アクション */}
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Info 버튼 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.dispatchEvent(new CustomEvent("OPEN_BOOKMARK_INFO", { detail: bookmark }));
            }}
            className="p-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-surface-700 dark:hover:bg-surface-600 rounded-lg transition-colors"
            title={t("infoTooltip") || "Site Info"}
          >
            <Info size={12} className="text-indigo-500 dark:text-indigo-400" />
          </button>
          {/* メモボタン */}
          <button
            ref={stickyBtnRef}
            onClick={(e) => { e.stopPropagation(); setShowPopover((v) => !v); }}
            className={`p-1.5 rounded-lg transition-colors ${
              memo
                ? "bg-yellow-400/20 hover:bg-yellow-400/30"
                : "bg-gray-100 hover:bg-gray-200 dark:bg-surface-700 dark:hover:bg-surface-600"
            }`}
            title={memo ? t("editMemoTooltip") : t("addMemoTooltip")}
          >
            <StickyNote size={12} className={memo ? "text-yellow-400" : "text-gray-500 dark:text-gray-400"} />
          </button>

          <button
            onClick={handleOpen}
            className="p-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-surface-700 dark:hover:bg-surface-600 rounded-lg transition-colors"
            title={t("openTooltip")}
          >
            <ExternalLink size={12} className="text-gray-500 dark:text-gray-400" />
          </button>

          {onDelete && (
            <button
              onClick={() => onDelete(bookmark.id)}
              className="p-1.5 bg-gray-100 hover:bg-red-100 dark:bg-surface-700 dark:hover:bg-red-900/60 rounded-lg transition-colors"
              title={t("deleteBookmarkTooltip")}
            >
              <Trash2 size={12} className="text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400" />
            </button>
          )}
        </div>
      </div>

      {/* ポップオーバー（portal 経由で body に描画） */}
      {showPopover && (
        <MemoPopover
          memo={memo}
          anchorRef={stickyBtnRef}
          onClose={() => setShowPopover(false)}
          onSave={handleMemoSave}
          onDelete={handleMemoDelete}
        />
      )}
    </>
  );
}
