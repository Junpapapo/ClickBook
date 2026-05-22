import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Trash2, ExternalLink, Pencil, StickyNote, X, Info, Sparkles, Loader2, CheckCheck, Bot } from "lucide-react";
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
        lang as "en" | "ja" | "ko"
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

  useEffect(() => {
    if (!anchorRef.current) return;
    const r  = anchorRef.current.getBoundingClientRect();
    const ph = draftState === "done" ? 380 : 280;
    const pw = 264;
    const top  = r.bottom + 8 + ph < window.innerHeight ? r.bottom + 8 : r.top - ph - 8;
    const left = Math.max(8, Math.min(r.left, window.innerWidth - pw - 8));
    setPos({ top, left });
  }, [anchorRef, draftState]);

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
      style={{ position: "fixed", top: pos.top, left: pos.left, width: 264, zIndex: 9999 }}
      className="bg-white dark:bg-surface-800 border border-gray-200 dark:border-surface-600 rounded-xl shadow-2xl p-3"
      onClick={(e) => e.stopPropagation()}
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1">
          <StickyNote size={10} />
          {t("memo")}
        </span>
        <div className="flex items-center gap-1">
          {/* AI 초안 버튼 */}
          {bookmark && (
            <button
              onClick={handleGenerateDraft}
              disabled={draftState === "loading"}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold transition-all ${
                draftState === "loading"
                  ? "bg-violet-100 dark:bg-violet-900/30 text-violet-400 cursor-not-allowed"
                  : draftState === "done" || draftState === "used"
                  ? "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"
                  : "bg-gray-100 dark:bg-surface-700 text-gray-500 dark:text-gray-400 hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-600 dark:hover:text-violet-400"
              }`}
              title="AI 메모 초안 생성"
            >
              {draftState === "loading"
                ? <Loader2 size={8} className="animate-spin" />
                : <Sparkles size={8} />}
              AI 초안
            </button>
          )}
          <button onClick={onClose} className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <X size={12} />
          </button>
        </div>
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

      {/* AI Draft Panel */}
      {draftState === "loading" && (
        <div className="mt-2 p-3 rounded-xl border border-violet-200 dark:border-violet-700/40 bg-violet-50 dark:bg-violet-900/20 flex items-center gap-2">
          <Loader2 size={12} className="text-violet-500 animate-spin shrink-0" />
          <span className="text-[10px] text-violet-600 dark:text-violet-400 animate-pulse">
            {lang === "ko" ? "AI가 메모 초안을 작성 중..." : lang === "ja" ? "AI が下書きを生成中..." : "AI is drafting..."}
          </span>
        </div>
      )}

      {(draftState === "done" || draftState === "used") && (
        <div className={`mt-2 rounded-xl border overflow-hidden transition-all ${
          draftState === "used"
            ? "border-emerald-200 dark:border-emerald-700/40 bg-emerald-50 dark:bg-emerald-900/20"
            : "border-violet-200 dark:border-violet-700/40 bg-violet-50/60 dark:bg-violet-900/15"
        }`}>
          {/* Panel header */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 border-b ${
            draftState === "used"
              ? "border-emerald-200 dark:border-emerald-700/40"
              : "border-violet-200 dark:border-violet-700/40"
          }`}>
            {draftState === "used"
              ? <CheckCheck size={9} className="text-emerald-500" />
              : <Bot size={9} className="text-violet-500" />}
            <span className={`text-[9px] font-bold uppercase tracking-wider ${
              draftState === "used" ? "text-emerald-600 dark:text-emerald-400" : "text-violet-600 dark:text-violet-400"
            }`}>
              {draftState === "used"
                ? (lang === "ko" ? "초안 적용됨" : lang === "ja" ? "下書き適用済" : "Draft applied")
                : (lang === "ko" ? `AI 초안 ${draftAiUsed ? "(Gemini Nano)" : "(요약 기반)"}` : lang === "ja" ? `AI 下書き ${draftAiUsed ? "(Gemini Nano)" : "(要約ベース)"}` : `AI Draft ${draftAiUsed ? "(Gemini Nano)" : "(summary-based)"}`)}
            </span>
          </div>
          {/* Draft text */}
          <div className="px-3 py-2">
            <pre className={`text-[10px] leading-relaxed whitespace-pre-wrap font-sans ${
              draftState === "used" ? "text-emerald-700 dark:text-emerald-300" : "text-violet-700 dark:text-violet-300"
            }`}>{draft}</pre>
          </div>
          {/* Actions */}
          {draftState === "done" && (
            <div className="flex items-center justify-end gap-1.5 px-3 pb-2">
              <button
                onClick={() => setDraftState("idle")}
                className="text-[9px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-1.5 py-0.5 rounded transition-colors"
              >
                {lang === "ko" ? "닫기" : lang === "ja" ? "閉じる" : "Dismiss"}
              </button>
              <button
                onClick={handleUseDraft}
                className="flex items-center gap-1 text-[9px] font-bold px-2.5 py-1 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors shadow-sm shadow-violet-500/30"
              >
                <CheckCheck size={8} />
                {lang === "ko" ? "이 내용 사용" : lang === "ja" ? "使用する" : "Use this"}
              </button>
            </div>
          )}
        </div>
      )}

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
          bookmark={{ title: bookmark.title, url: bookmark.url, summary: bookmark.summary, tags: bookmark.tags }}
          anchorRef={stickyBtnRef}
          onClose={() => setShowPopover(false)}
          onSave={handleMemoSave}
          onDelete={handleMemoDelete}
        />
      )}
    </>
  );
}
