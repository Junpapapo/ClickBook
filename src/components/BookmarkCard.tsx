import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Trash2, ExternalLink, Pencil, StickyNote, X, Info, Sparkles, Loader2, CheckCheck, Bot, Copy, History, GripHorizontal } from "lucide-react";
import type { Bookmark, BookmarkMemo, MemoColor } from "@/shared/types";
import { MEMO_DOT, MEMO_TEXTAREA_BG, ALL_MEMO_COLORS as ALL_COLORS } from "@/shared/colors";
import { useLang } from "@/shared/LanguageContext";
import type { TFunction } from "@/shared/i18n";
import { generateMemoDraft } from "@/shared/categorizer";

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
  bookmark?: { title: string; url: string; summary?: string; tags?: string[] };
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onSave: (content: string, color: MemoColor) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function MemoPopover({ memo, bookmark, anchorRef, onClose, onSave, onDelete }: PopoverProps) {
  const { t, lang } = useLang();
  const [content, setContent] = useState(memo?.content ?? "");
  const [color, setColor] = useState<MemoColor>(memo?.color ?? "yellow");
  const popRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [size, setSize] = useState<{ width: number; height?: number }>({ width: 280 });

  // Drag & Resize states
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);
  const hasMovedRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef({ startX: 0, startY: 0, startWidth: 280, startHeight: 260 });

  // AI Draft Panel state
  const [draftState, setDraftState] = useState<"idle" | "loading" | "done" | "used">("idle");
  const [draft, setDraft] = useState("");
  const [draftAiUsed, setDraftAiUsed] = useState(false);

  async function handleGenerateDraft() {
    if (!bookmark) return;
    setDraftState("loading");
    setDraft("");
    try {
      const result = await generateMemoDraft(
        bookmark.url,
        bookmark.title,
        bookmark.summary,
        bookmark.tags,
        lang
      );
      setDraft(result.draft);
      setDraftAiUsed(result.aiUsed);
      setDraftState("done");
    } catch {
      setDraftState("idle");
    }
  }

  function handleUseDraft() {
    setContent(prev => prev ? prev + "\n" + draft : draft);
    setDraftState("used");
  }

  // Calculate initial position from anchor
  useEffect(() => {
    if (hasMovedRef.current || !anchorRef.current) return;
    const r = anchorRef.current.getBoundingClientRect();
    const ph = draftState === "done" ? 380 : 280;
    const pw = size.width;
    const top = r.bottom + 8 + ph < window.innerHeight ? r.bottom + 8 : Math.max(8, r.top - ph - 8);
    const left = Math.max(8, Math.min(r.left, window.innerWidth - pw - 8));
    setPos({ top, left });
  }, [anchorRef, draftState, size.width]);

  // Pointer event handlers for Header Drag
  const handleHeaderPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest("input")) return;
    isDraggingRef.current = true;
    setIsDragging(true);
    hasMovedRef.current = true;
    dragOffsetRef.current = {
      x: e.clientX - pos.left,
      y: e.clientY - pos.top,
    };
    e.preventDefault();
  };

  // Pointer event handlers for Resize
  const handleResizePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    isResizingRef.current = true;
    setIsResizing(true);
    hasMovedRef.current = true;
    resizeStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: popRef.current?.offsetWidth || size.width,
      startHeight: popRef.current?.offsetHeight || 260,
    };
  };

  // Global PointerMove & PointerUp listeners
  useEffect(() => {
    function handlePointerMove(e: PointerEvent) {
      if (isDraggingRef.current) {
        const w = popRef.current?.offsetWidth || size.width;
        const h = popRef.current?.offsetHeight || 260;
        const clampedLeft = Math.max(8, Math.min(e.clientX - dragOffsetRef.current.x, window.innerWidth - w - 8));
        const clampedTop = Math.max(8, Math.min(e.clientY - dragOffsetRef.current.y, window.innerHeight - h - 8));
        setPos({ top: clampedTop, left: clampedLeft });
      } else if (isResizingRef.current) {
        const dx = e.clientX - resizeStartRef.current.startX;
        const dy = e.clientY - resizeStartRef.current.startY;
        const minW = 240;
        const maxW = Math.max(minW, window.innerWidth - pos.left - 16);
        const minH = 200;
        const maxH = Math.max(minH, window.innerHeight - pos.top - 16);
        const newW = Math.max(minW, Math.min(maxW, resizeStartRef.current.startWidth + dx));
        const newH = Math.max(minH, Math.min(maxH, resizeStartRef.current.startHeight + dy));
        setSize({ width: newW, height: newH });
      }
    }

    function handlePointerUp() {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDragging(false);
      }
      if (isResizingRef.current) {
        isResizingRef.current = false;
        setIsResizing(false);
      }
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [pos.left, pos.top, size.width]);

  // Click outside detection
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (isDraggingRef.current || isResizingRef.current) return;
      if (anchorRef.current?.contains(e.target as Node)) return;
      if (popRef.current && !popRef.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [anchorRef, onClose]);

  return createPortal(
    <div
      ref={popRef}
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        width: size.width,
        height: size.height ? `${size.height}px` : undefined,
        zIndex: 9999,
      }}
      className={`bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border ${
        isDragging || isResizing
          ? "border-indigo-400/80 dark:border-indigo-500/80 shadow-2xl scale-[1.005]"
          : "border-slate-200/90 dark:border-slate-800 shadow-figma-lg"
      } rounded-xl p-3 flex flex-col transition-[box-shadow,border-color,transform] duration-150 relative`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* ヘッダー (드래그 핸들) */}
      <div
        onPointerDown={handleHeaderPointerDown}
        className="flex items-center justify-between mb-2 cursor-grab active:cursor-grabbing select-none shrink-0 group/header pb-1"
        title={lang === "ko" ? "드래그하여 이동" : "Drag to move"}
      >
        <div className="flex items-center gap-1.5">
          <GripHorizontal size={13} className="text-slate-400 dark:text-slate-500 opacity-60 group-hover/header:opacity-100 transition-opacity" />
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <StickyNote size={10} className="text-amber-500" />
            {t("memo")}
          </span>
        </div>
        <div className="flex items-center gap-1" onPointerDown={(e) => e.stopPropagation()}>
          {/* AI 초안 버튼 */}
          {bookmark && (
            <button
              onClick={handleGenerateDraft}
              disabled={draftState === "loading"}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold transition-all cursor-pointer ${
                draftState === "loading"
                  ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-400 cursor-not-allowed"
                  : draftState === "done" || draftState === "used"
                  ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/40"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400"
              }`}
              title={t("aiDraftTooltip")}
            >
              {draftState === "loading"
                ? <Loader2 size={8} className="animate-spin" />
                : <Sparkles size={8} />}
              {t("aiDraftBtn")}
            </button>
          )}
          <button onClick={onClose} className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer" title={t("closeTooltip")}>
            <X size={12} />
          </button>
        </div>
      </div>

      {/* カラーピッカー */}
      <div className="flex items-center gap-1.5 mb-2 shrink-0">
        {ALL_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={`w-4 h-4 rounded-full ${MEMO_DOT[c]} transition-all cursor-pointer ${
              color === c
                ? "ring-2 ring-offset-1 ring-indigo-500 dark:ring-indigo-400 dark:ring-offset-slate-900 scale-110"
                : "opacity-50 hover:opacity-100"
            }`}
          />
        ))}
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => {
              if (content) navigator.clipboard.writeText(content);
            }}
            disabled={!content}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors disabled:opacity-40 cursor-pointer"
            title={t("copyTooltip")}
          >
            <Copy size={12} />
          </button>
          {memo && (
            <button
              onClick={async () => { await onDelete(); onClose(); }}
              className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
              title={t("deleteMemoTooltip")}
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>

      {/* テキストエリア */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        autoFocus
        placeholder={t("memoPlaceholder")}
        rows={4}
        onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
        className={`w-full text-xs rounded-lg px-2.5 py-2 min-h-[90px] flex-1 resize-none outline-none leading-relaxed border border-slate-200/60 dark:border-slate-700/60 ${MEMO_TEXTAREA_BG[color]} text-slate-800 dark:text-slate-200 placeholder-slate-400 custom-scrollbar`}
      />

      {/* AI Draft Panel */}
      {draftState === "loading" && (
        <div className="mt-2 p-2.5 rounded-xl border border-indigo-200/80 dark:border-indigo-800/40 bg-indigo-50/70 dark:bg-indigo-950/30 flex items-center gap-2 shrink-0">
          <Loader2 size={12} className="text-indigo-500 animate-spin shrink-0" />
          <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 animate-pulse">
            {t("aiDraftApplying")}
          </span>
        </div>
      )}

      {(draftState === "done" || draftState === "used") && (
        <div className={`mt-2 rounded-xl border overflow-hidden transition-all shrink-0 max-h-[160px] flex flex-col ${
          draftState === "used"
            ? "border-emerald-200/80 dark:border-emerald-800/40 bg-emerald-50/70 dark:bg-emerald-950/20"
            : "border-indigo-200/80 dark:border-indigo-800/40 bg-indigo-50/70 dark:bg-indigo-950/20"
        }`}>
          {/* Panel header */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 border-b shrink-0 ${
            draftState === "used"
              ? "border-emerald-200/80 dark:border-emerald-800/40"
              : "border-indigo-200/80 dark:border-indigo-800/40"
          }`}>
            {draftState === "used"
              ? <CheckCheck size={9} className="text-emerald-500" />
              : <Bot size={9} className="text-indigo-500" />}
            <span className={`text-[9px] font-bold uppercase tracking-wider ${
              draftState === "used" ? "text-emerald-600 dark:text-emerald-400" : "text-indigo-600 dark:text-indigo-400"
            }`}>
              {draftState === "used"
                ? t("aiDraftApplied")
                : `${t("aiDraftLabel")} ${draftAiUsed ? "(Gemini Nano)" : lang === "ko" ? "(요약 기반)" : lang === "ja" ? "(要約ベース)" : "(summary-based)"}`}
            </span>
          </div>
          {/* Draft text */}
          <div className="px-3 py-2 overflow-y-auto custom-scrollbar flex-1">
            <pre className={`text-[10px] leading-relaxed whitespace-pre-wrap font-sans ${
              draftState === "used" ? "text-emerald-700 dark:text-emerald-300" : "text-indigo-700 dark:text-indigo-300"
            }`}>{draft}</pre>
          </div>
          {/* Actions */}
          {draftState === "done" && (
            <div className="flex items-center justify-end gap-1.5 px-3 pb-2 shrink-0">
              <button
                onClick={() => setDraftState("idle")}
                className="text-[9px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
              >
                {t("aiDraftDismiss")}
              </button>
              <button
                onClick={handleUseDraft}
                className="flex items-center gap-1 text-[9px] font-bold px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg transition-colors shadow-2xs cursor-pointer"
              >
                <CheckCheck size={8} />
                {t("aiDraftUseThis")}
              </button>
            </div>
          )}
        </div>
      )}

      {/* アクションボタン */}
      <div className="flex justify-end gap-1.5 mt-2 shrink-0">
        <button
          onClick={onClose}
          className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
        >
          {t("closeTooltip")}
        </button>
        <button
          onClick={async () => {
            if (content.trim()) await onSave(content.trim(), color);
            else if (memo)      await onDelete();
            onClose();
          }}
          className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-3 py-1 rounded-md transition-all shadow-2xs cursor-pointer"
        >
          Save
        </button>
      </div>

      {/* 우하단 리사이즈 핸들 */}
      <div
        onPointerDown={handleResizePointerDown}
        className="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize flex items-end justify-end p-0.5 opacity-30 hover:opacity-100 transition-opacity group/resize select-none"
        title={lang === "ko" ? "드래그하여 크기 조절" : "Drag to resize"}
      >
        <svg
          width="8"
          height="8"
          viewBox="0 0 8 8"
          fill="none"
          className="text-slate-400 dark:text-slate-500 group-hover/resize:text-indigo-500 transition-colors"
        >
          <circle cx="7" cy="7" r="0.75" fill="currentColor" />
          <circle cx="4" cy="7" r="0.75" fill="currentColor" />
          <circle cx="7" cy="4" r="0.75" fill="currentColor" />
          <circle cx="1" cy="7" r="0.75" fill="currentColor" />
          <circle cx="4" cy="4" r="0.75" fill="currentColor" />
          <circle cx="7" cy="1" r="0.75" fill="currentColor" />
        </svg>
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

const BookmarkCard = React.memo(function BookmarkCard({ bookmark, memo, folderName, onDelete, onEdit, onMemoChange }: Props) {
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
        className="group relative bg-white dark:bg-slate-800/70 border border-slate-200/90 dark:border-slate-700/70 rounded-xl overflow-hidden hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-all duration-200 cursor-grab active:cursor-grabbing shadow-figma-sm"
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
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{bookmark.domain}</span>
            {folderName && (
              <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40 font-medium truncate max-w-[72px]">
                {folderName}
              </span>
            )}
            <span className="ml-auto text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
              {formatRelativeTime(bookmark.savedAt, t)}
            </span>
          </div>

          {/* 타이틀 */}
          <button
            onClick={handleOpen}
            className="text-left text-xs font-semibold text-slate-800 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 line-clamp-2 transition-colors leading-snug cursor-pointer"
          >
            {bookmark.title}
          </button>

          {/* URL + 편집 버튼 */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex-1">{shortenUrl(bookmark.url)}</span>
            {onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(bookmark); }}
                className="shrink-0 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title={t("editTooltip")}
              >
                <Pencil size={11} className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" />
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
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-1 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-xs">
          {/* Info 버튼 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.dispatchEvent(new CustomEvent("OPEN_BOOKMARK_INFO", { detail: bookmark }));
            }}
            className="p-1 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
            title={t("infoTooltip") || "Site Info"}
          >
            <Info size={13} />
          </button>

          {/* Web Archive 버튼 */}
          <a
            href={`https://web.archive.org/web/*/${encodeURIComponent(bookmark.url)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1 text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
            title={t("viewWebArchive" as any) || "Wayback Machine Archive"}
          >
            <History size={13} />
          </a>

          {/* メモボタン */}
          <button
            ref={stickyBtnRef}
            onClick={(e) => { e.stopPropagation(); setShowPopover((v) => !v); }}
            className={`p-1 rounded transition-colors ${
              memo
                ? "bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
                : "text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
            title={memo ? t("editMemoTooltip") : t("addMemoTooltip")}
          >
            <StickyNote size={13} />
          </button>

          <button
            onClick={handleOpen}
            className="p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
            title={t("openTooltip")}
          >
            <ExternalLink size={13} />
          </button>

          {onDelete && (
            <button
              onClick={() => onDelete(bookmark.id)}
              className="p-1 text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
              title={t("deleteBookmarkTooltip")}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ポップオーバー（portal 経由で body に描画） */}
      {showPopover && (
        <MemoPopover
          memo={memo}
          bookmark={{ title: bookmark.title, url: bookmark.url, summary: bookmark.summary, tags: bookmark.tags }}
          anchorRef={stickyBtnRef}
          onClose={() => setShowPopover(false)}
          onSave={handleMemoSave}
          onDelete={handleMemoDelete}
        />
      )}
    </>
  );
});

export default BookmarkCard;
