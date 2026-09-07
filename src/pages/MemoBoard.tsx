import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  StickyNote,
  ExternalLink,
  X,
  Plus,
  Check,
  Info,
  Sparkles,
  Loader2,
  Copy,
  Trash2,
  BookOpen,
  Search,
  Globe,
  Anchor,
  Link2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Bookmark, BookmarkMemo, MemoColor, MemoMap } from "@/shared/types";
import { refineMemoDraft } from "@/shared/categorizer";
import {
  MEMO_DOT,
  MEMO_CARD_BG as MEMO_CARD_CLS,
  MEMO_ACCENT,
  MEMO_TEXTAREA_BG,
  ALL_MEMO_COLORS as ALL_COLORS,
} from "@/shared/colors";
import { useLang } from "@/shared/LanguageContext";
import { useTheme } from "@/shared/ThemeContext";
import WallpaperBackground from "@/components/dashboard/WallpaperBackground";

// ── サイズ設定 ─────────────────────────────────────────────

type CardSize = "s" | "m" | "l";

const SIZE_GRID: Record<CardSize, string> = {
  s: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
  m: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
  l: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
};

const SIZE_STYLES: Record<
  CardSize,
  {
    padding: string;
    bodyText: string;
    leading: string;
    textareaText: string;
    textareaMinH: string;
    metaText: string;
  }
> = {
  s: {
    padding: "p-2.5",
    bodyText: "text-[11.5px]",
    leading: "leading-snug",
    textareaText: "text-[11.5px]",
    textareaMinH: "min-h-[85px]",
    metaText: "text-[9.5px]",
  },
  m: {
    padding: "p-3",
    bodyText: "text-[13px]",
    leading: "leading-relaxed",
    textareaText: "text-[13px]",
    textareaMinH: "min-h-[110px]",
    metaText: "text-[10.5px]",
  },
  l: {
    padding: "p-3.5 sm:p-4",
    bodyText: "text-[14.5px]",
    leading: "leading-relaxed",
    textareaText: "text-[14.5px]",
    textareaMinH: "min-h-[140px]",
    metaText: "text-[11.5px]",
  },
};

const SIZE_LABEL: Record<CardSize, string> = { s: "S", m: "M", l: "L" };
const SIZE_STORAGE_KEY = "clickbook_memo_size";
const COLS_STORAGE_KEY = "clickbook_memo_cols";
type ColumnOption = "auto" | 2 | 3 | 4 | 5 | 6 | 7 | 8;

// ── NewMemoCard（サイト連携なしの新規メモ入力カード） ────

interface NewMemoCardProps {
  onSave: () => void;
  onCancel: () => void;
  cardSize?: CardSize;
  aiEnabled: boolean;
}

function NewMemoCard({
  onSave,
  onCancel,
  cardSize = "m",
  aiEnabled,
}: NewMemoCardProps) {
  const { t, lang } = useLang();
  const [content, setContent] = useState("");
  const [color, setColor] = useState<MemoColor>("yellow");
  const [isRefining, setIsRefining] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleSave() {
    const text = content.trim();
    if (!text) return;
    const id = `standalone_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await chrome.runtime.sendMessage({ type: "SAVE_MEMO", bookmarkId: id, content: text, color });
    onSave();
  }

  async function handleRefine() {
    if (!content.trim() || isRefining || !aiEnabled) return;
    setIsRefining(true);
    try {
      const res = await refineMemoDraft(content, lang);
      if (res.aiUsed) {
        setContent(res.draft);
      }
    } catch {
      // ignore
    } finally {
      setIsRefining(false);
    }
  }

  const handleCopy = useCallback(() => {
    if (!content) return;
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  }, [content]);

  return (
    <div className={`flex flex-col rounded-xl border overflow-hidden shadow-md ${MEMO_CARD_CLS[color]} transition-all animate-fadeIn h-full`}>
      <div className={`h-1.5 w-full shrink-0 ${MEMO_ACCENT[color]}`} />
      <div className={`${SIZE_STYLES[cardSize].padding} flex flex-col gap-2 flex-1`}>
        {/* カラーピッカー */}
        <div className="flex items-center gap-1.5">
          {ALL_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-4 h-4 rounded-full ${MEMO_DOT[c]} transition-all cursor-pointer ${
                c === color
                  ? "ring-2 ring-offset-1 ring-gray-400 dark:ring-gray-500 dark:ring-offset-transparent scale-110"
                  : "opacity-50 hover:opacity-100"
              }`}
            />
          ))}
        </div>

        {/* テキストエリア */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          autoFocus
          placeholder={t("memoPlaceholder")}
          rows={cardSize === "s" ? 6 : cardSize === "l" ? 10 : 8}
          onKeyDown={(e) => {
            if (e.key === "Escape") onCancel();
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleSave();
            }
          }}
          className={`w-full ${SIZE_STYLES[cardSize].textareaText} rounded-lg px-2.5 py-2 resize-y ${SIZE_STYLES[cardSize].textareaMinH} outline-none ${SIZE_STYLES[cardSize].leading} ${MEMO_TEXTAREA_BG[color]} text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 custom-scrollbar border focus:border-indigo-400/80 transition-colors flex-1`}
        />

        {/* アクション */}
        <div className="flex gap-1 justify-between items-center mt-auto pt-1">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleRefine}
              disabled={!content.trim() || isRefining || !aiEnabled}
              title={aiEnabled ? t("aiRefineMemo") : t("aiNotAvailable")}
              className="text-indigo-500 hover:text-indigo-600 disabled:opacity-40 p-1 px-1.5 transition-colors bg-white/60 dark:bg-black/20 rounded-md hover:bg-white dark:hover:bg-black/40 shadow-figma-xs flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
            >
              {isRefining ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              {isRefining && <span className="text-[10px] font-medium">{t("aiRefining")}</span>}
            </button>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!content}
              title={copied ? t("memoCopied") : t("memoCopyTooltip")}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-40 p-1 px-1.5 transition-colors bg-white/60 dark:bg-black/20 rounded-md hover:bg-white dark:hover:bg-black/40 shadow-figma-xs flex items-center cursor-pointer disabled:cursor-not-allowed"
            >
              {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
            </button>
            <button
              type="button"
              onClick={() => setContent("")}
              disabled={!content}
              title={t("memoClearTooltip")}
              className="text-red-500 hover:text-red-600 disabled:opacity-40 p-1 px-1.5 transition-colors bg-white/60 dark:bg-black/20 rounded-md hover:bg-white dark:hover:bg-black/40 shadow-figma-xs flex items-center cursor-pointer disabled:cursor-not-allowed"
            >
              <Trash2 size={13} />
            </button>
          </div>
          <div className="flex gap-1 items-center">
            <button
              type="button"
              onClick={onCancel}
              className="text-[11px] font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-2 py-1 rounded-md transition-colors cursor-pointer"
            >
              {t("memoCancelAction")}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!content.trim()}
              className="text-[11px] font-semibold bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 shadow-figma-xs cursor-pointer"
            >
              <Check size={12} strokeWidth={2.5} />
              <span>{t("memoSaveAction")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 본문 내 URL 링크 추출 및 링크 아이템 컴포넌트 ────

interface ExtractedLink {
  url: string;
  title: string;
  domain: string;
}

function extractLinksFromContent(content: string): ExtractedLink[] {
  if (!content) return [];
  const results: ExtractedLink[] = [];
  const seenUrls = new Set<string>();

  // 1. Markdown 링크 [title](url) 추출
  const mdRegex = /\[([^\]]+)\]\(((?:https?:\/\/)[^\s)]+)\)/gi;
  let match: RegExpExecArray | null;
  while ((match = mdRegex.exec(content)) !== null) {
    const title = match[1].trim();
    const url = match[2].trim();
    if (url && !seenUrls.has(url)) {
      seenUrls.add(url);
      try {
        const u = new URL(url);
        results.push({
          url,
          title: title || u.hostname.replace(/^www\./, ""),
          domain: u.hostname,
        });
      } catch {
        results.push({ url, title: title || url, domain: "" });
      }
    }
  }

  // 2. 일반 URL (http:// 또는 https://) 추출
  const urlRegex = /(https?:\/\/[^\s)\]>"']+)/gi;
  while ((match = urlRegex.exec(content)) !== null) {
    let rawUrl = match[1].trim();
    rawUrl = rawUrl.replace(/[.,;:!?]+$/, "");
    if (rawUrl && !seenUrls.has(rawUrl)) {
      seenUrls.add(rawUrl);
      try {
        const u = new URL(rawUrl);
        const cleanHost = u.hostname.replace(/^www\./, "");
        const pathSnippet =
          u.pathname !== "/" && u.pathname.length > 1
            ? u.pathname.length > 26
              ? u.pathname.slice(0, 23) + "..."
              : u.pathname
            : "";
        const displayTitle = pathSnippet ? `${cleanHost}${pathSnippet}` : cleanHost;
        results.push({
          url: rawUrl,
          title: displayTitle,
          domain: u.hostname,
        });
      } catch {
        results.push({ url: rawUrl, title: rawUrl, domain: "" });
      }
    }
  }

  return results;
}

function MemoLinkItem({ link, cardSize }: { link: ExtractedLink; cardSize: CardSize }) {
  const [imgFailed, setImgFailed] = useState(false);
  const faviconUrl = link.domain
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(link.domain)}&sz=32`
    : "";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        window.open(link.url, "_blank", "noopener,noreferrer");
      }}
      title={link.url}
      className="flex items-center gap-1.5 w-full px-1.5 py-1 rounded-md text-left transition-all hover:bg-black/5 dark:hover:bg-white/5 group/link cursor-pointer border border-black/5 dark:border-white/5 bg-white/40 dark:bg-black/15 shadow-figma-xs"
    >
      {!imgFailed && faviconUrl ? (
        <img
          src={faviconUrl}
          alt=""
          width={12}
          height={12}
          className="rounded-sm shrink-0 object-contain"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <Globe size={11} className="text-gray-400 shrink-0" />
      )}
      <span
        className={`${SIZE_STYLES[cardSize].metaText} text-gray-600 dark:text-gray-300 truncate flex-1 font-medium group-hover/link:text-indigo-500 dark:group-hover/link:text-indigo-400 transition-colors`}
      >
        {link.title}
      </span>
      <ExternalLink
        size={10}
        className="shrink-0 text-gray-400 ml-auto group-hover/link:text-indigo-500 transition-colors opacity-70 group-hover/link:opacity-100"
      />
    </button>
  );
}

// ── MemoCard ──────────────────────────────────────────────

interface MemoCardProps {
  memo: BookmarkMemo;
  bookmark?: Bookmark;
  cardSize?: CardSize;
  aiEnabled: boolean;
  onRefresh: () => void;
}

const MemoCard = React.memo(function MemoCard({
  memo,
  bookmark,
  cardSize = "m",
  aiEnabled,
  onRefresh,
}: MemoCardProps) {
  const { t, lang } = useLang();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(memo.content);
  const [color, setColor] = useState<MemoColor>(memo.color);
  const [isRefining, setIsRefining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [faviconFailed, setFaviconFailed] = useState(false);

  // 본문 내 URL 링크 자동 추출 (뷰 모드 하단 목록용, 북마크와 중복 제외)
  const extractedLinks = useMemo(() => {
    const links = extractLinksFromContent(memo.content);
    if (bookmark?.url) {
      const bmClean = bookmark.url.replace(/\/$/, "");
      return links.filter((l) => l.url.replace(/\/$/, "") !== bmClean);
    }
    return links;
  }, [memo.content, bookmark?.url]);

  // memo prop 변경 시 로컬 draft/color 동기화
  useEffect(() => {
    setDraft(memo.content);
    setColor(memo.color);
  }, [memo.content, memo.color]);

  async function handleSave() {
    const text = draft.trim();
    if (!text) return;
    await chrome.runtime.sendMessage({
      type: "SAVE_MEMO",
      bookmarkId: memo.bookmarkId,
      content: text,
      color,
    });
    setEditing(false);
    onRefresh();
  }

  async function handleRefine() {
    if (!draft.trim() || isRefining || !aiEnabled) return;
    setIsRefining(true);
    try {
      const res = await refineMemoDraft(draft, lang);
      if (res.aiUsed) {
        setDraft(res.draft);
      }
    } catch {
      // ignore
    } finally {
      setIsRefining(false);
    }
  }

  // 색상 변경 시 편집 중인 내용(draft) 유실 방지
  async function handleColorChange(c: MemoColor) {
    setColor(c);
    const contentToSave = editing ? draft : memo.content;
    await chrome.runtime.sendMessage({
      type: "SAVE_MEMO",
      bookmarkId: memo.bookmarkId,
      content: contentToSave,
      color: c,
    });
    onRefresh();
  }

  async function handleDeleteConfirm() {
    await chrome.runtime.sendMessage({ type: "DELETE_MEMO", bookmarkId: memo.bookmarkId });
    setShowDeleteConfirm(false);
    onRefresh();
  }

  const handleCopy = useCallback(() => {
    const textToCopy = editing ? draft : memo.content;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  }, [editing, draft, memo.content]);

  // 마크다운 클릭 시 텍스트 드래그 선택 중이면 편집 모드 전환 차단
  const handleMarkdownClick = () => {
    const selection = window.getSelection()?.toString();
    if (selection && selection.length > 0) return;
    setDraft(memo.content);
    setEditing(true);
  };

  const hasAnchors = memo.anchoredMemos && memo.anchoredMemos.length > 0;

  return (
    <div className={`group relative flex flex-col rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition-shadow dark:shadow-none ${MEMO_CARD_CLS[color]} h-full`}>
      {/* カラーアクセントバー */}
      <div className={`h-1.5 w-full shrink-0 ${MEMO_ACCENT[color]}`} />

      <div className={`${SIZE_STYLES[cardSize].padding} flex flex-col gap-2 flex-1`}>
        {/* カラーピッカー + 削除（ホバーまたは常時アクセス） */}
        <div className="flex items-center gap-1 min-h-[22px]">
          <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
            {ALL_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => handleColorChange(c)}
                className={`w-3.5 h-3.5 rounded-full ${MEMO_DOT[c]} transition-all cursor-pointer ${
                  c === color
                    ? "ring-2 ring-offset-1 ring-gray-400 dark:ring-gray-500 dark:ring-offset-transparent scale-110"
                    : "opacity-40 hover:opacity-100"
                }`}
                title={t("changeColor")}
              />
            ))}
          </div>

          <div className="ml-auto flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            {hasAnchors && (
              <span
                className="flex items-center gap-0.5 text-[9.5px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold"
                title={t("memoAnchoredBadge", { n: memo.anchoredMemos!.length })}
              >
                <Anchor size={10} />
                <span>{memo.anchoredMemos!.length}</span>
              </span>
            )}
            {bookmark && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  window.dispatchEvent(new CustomEvent("OPEN_BOOKMARK_INFO", { detail: bookmark }));
                }}
                className="p-1 text-gray-400 hover:text-indigo-500 transition-colors rounded-md hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                title={t("memoViewSiteTooltip")}
              >
                <Info size={13} />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                window.dispatchEvent(new CustomEvent("OPEN_READER_MODE", {
                  detail: {
                    bookmarkId: `memo-${memo.bookmarkId}`,
                    title: bookmark ? `${t("memo")}: ${bookmark.title}` : t("memo"),
                    url: bookmark?.url,
                    content: memo.content,
                  },
                }));
              }}
              className="p-1 text-gray-400 hover:text-indigo-500 transition-colors rounded-md hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              title={t("readerTooltipOpenZen")}
            >
              <BookOpen size={13} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm((prev) => !prev);
              }}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded-md hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              title={t("deleteMemoTooltip")}
            >
              <X size={13} />
            </button>
          </div>
        </div>

        {/* インライン削除確認バー */}
        {showDeleteConfirm && (
          <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs animate-fadeIn">
            <span className="font-semibold text-[11px] truncate">{t("memoDeleteConfirm")}</span>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(false);
                }}
                className="px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              >
                {t("memoCancelAction")}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteConfirm();
                }}
                className="px-2 py-0.5 text-[10px] font-semibold bg-red-500 hover:bg-red-600 text-white rounded shadow-figma-xs cursor-pointer"
              >
                {t("memoDeleteAction")}
              </button>
            </div>
          </div>
        )}

        {/* メモ本文 */}
        {editing ? (
          <div className="flex flex-col gap-2 flex-1">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
              rows={Math.min(20, Math.max(cardSize === "s" ? 6 : cardSize === "l" ? 10 : 8, Math.floor((memo.content || "").length / 50)))}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setDraft(memo.content);
                  setEditing(false);
                }
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleSave();
                }
              }}
              className={`w-full ${SIZE_STYLES[cardSize].textareaText} rounded-lg px-2.5 py-2 resize-y ${SIZE_STYLES[cardSize].textareaMinH} outline-none ${SIZE_STYLES[cardSize].leading} ${MEMO_TEXTAREA_BG[color]} text-gray-800 dark:text-gray-200 custom-scrollbar border focus:border-indigo-400/80 transition-colors flex-1`}
            />
            <div className="flex gap-1 justify-between items-center mt-auto pt-1">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleRefine}
                  disabled={!draft.trim() || isRefining || !aiEnabled}
                  title={aiEnabled ? t("aiRefineMemo") : t("aiNotAvailable")}
                  className="text-indigo-500 hover:text-indigo-600 disabled:opacity-40 p-1 px-1.5 transition-colors bg-white/60 dark:bg-black/20 rounded-md hover:bg-white dark:hover:bg-black/40 shadow-figma-xs flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isRefining ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                  {isRefining && <span className="text-[10px] font-medium whitespace-nowrap">{t("aiRefining")}</span>}
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!draft}
                  title={copied ? t("memoCopied") : t("memoCopyTooltip")}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-40 p-1 px-1.5 transition-colors bg-white/60 dark:bg-black/20 rounded-md hover:bg-white dark:hover:bg-black/40 shadow-figma-xs flex items-center cursor-pointer disabled:cursor-not-allowed"
                >
                  {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                </button>
                <button
                  type="button"
                  onClick={() => setDraft("")}
                  disabled={!draft}
                  title={t("memoClearTooltip")}
                  className="text-red-500 hover:text-red-600 disabled:opacity-40 p-1 px-1.5 transition-colors bg-white/60 dark:bg-black/20 rounded-md hover:bg-white dark:hover:bg-black/40 shadow-figma-xs flex items-center cursor-pointer disabled:cursor-not-allowed"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <div className="flex gap-1 items-center">
                <button
                  type="button"
                  onClick={() => {
                    setDraft(memo.content);
                    setEditing(false);
                  }}
                  className="text-[11px] font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-2 py-1 rounded-md transition-colors cursor-pointer"
                >
                  {t("memoCancelAction")}
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!draft.trim()}
                  className="text-[11px] font-semibold bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 shadow-figma-xs cursor-pointer"
                >
                  <Check size={12} strokeWidth={2.5} />
                  <span>{t("memoSaveAction")}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            className={`${SIZE_STYLES[cardSize].bodyText} ${SIZE_STYLES[cardSize].leading} text-gray-700 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-gray-100 transition-colors flex-1 min-h-[44px] custom-scrollbar overflow-y-auto`}
            onClick={handleMarkdownClick}
            title={t("clickToEdit")}
          >
            <ReactMarkdown
              components={{
                p: ({ node, ...props }) => <p className="whitespace-pre-wrap mb-2 last:mb-0 break-words" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2 last:mb-0 space-y-0.5" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2 last:mb-0 space-y-0.5" {...props} />,
                li: ({ node, ...props }) => <li className="leading-snug" {...props} />,
                a: ({ node, ...props }) => (
                  <a
                    className="text-indigo-500 hover:underline underline-offset-2 break-all"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    {...props}
                  />
                ),
                strong: ({ node, ...props }) => <strong className="font-semibold text-gray-900 dark:text-gray-100" {...props} />,
                blockquote: ({ node, ...props }) => (
                  <blockquote className="border-l-2 border-indigo-400 pl-2.5 my-1.5 italic text-slate-500 dark:text-slate-400" {...props} />
                ),
                code: ({ node, ...props }) => (
                  <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[90%]" {...props} />
                ),
              }}
            >
              {memo.content}
            </ReactMarkdown>
          </div>
        )}

        {/* 본문 내 추출된 링크 목록 (뷰 모드일 때만 표시) */}
        {!editing && extractedLinks.length > 0 && (
          <div className="mt-auto pt-2 border-t border-black/10 dark:border-white/10 flex flex-col gap-1">
            <div className="flex items-center gap-1 text-[9.5px] font-bold text-gray-400 dark:text-gray-500 px-0.5 select-none">
              <Link2 size={10} />
              <span>{t("memoExtractedLinks") || "Links"}</span>
              <span className="text-[8.5px] px-1 rounded-full bg-black/5 dark:bg-white/10 font-bold">
                {extractedLinks.length}
              </span>
            </div>
            <div className="flex flex-col gap-1 max-h-24 overflow-y-auto custom-scrollbar pr-0.5">
              {extractedLinks.map((link) => (
                <MemoLinkItem key={link.url} link={link} cardSize={cardSize} />
              ))}
            </div>
          </div>
        )}

        {/* 紐づきサイト */}
        {bookmark && (
          <div className={`${!editing && extractedLinks.length > 0 ? "pt-1.5 border-t border-dashed border-black/10 dark:border-white/10" : "mt-auto pt-2 border-t border-black/10 dark:border-white/10"}`}>
            <button
              type="button"
              onClick={() => window.open(bookmark.url, "_blank", "noopener,noreferrer")}
              className="flex items-center gap-1.5 w-full hover:opacity-85 transition-opacity group/link cursor-pointer"
            >
              {!faviconFailed && bookmark.favicon ? (
                <img
                  src={bookmark.favicon}
                  alt=""
                  width={13}
                  height={13}
                  className="rounded-sm shrink-0 object-contain"
                  onError={() => setFaviconFailed(true)}
                />
              ) : (
                <Globe size={13} className="text-gray-400 shrink-0" />
              )}
              <span className={`${SIZE_STYLES[cardSize].metaText} text-gray-500 dark:text-gray-400 truncate flex-1 text-left group-hover/link:text-indigo-500 dark:group-hover/link:text-indigo-400 transition-colors font-medium`}>
                {bookmark.title}
              </span>
              <ExternalLink size={10} className="shrink-0 text-gray-400 ml-auto group-hover/link:text-indigo-500 transition-colors" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

// ── MemoBoard（メインエクスポート） ───────────────────────

interface Props {
  memos: MemoMap;
  bookmarks: Bookmark[];
  onRefresh: () => void;
}

export default function MemoBoard({ memos, bookmarks, onRefresh }: Props) {
  const { t } = useLang();
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  const [showNew, setShowNew] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [colorFilter, setColorFilter] = useState<MemoColor | "all">("all");
  const [aiEnabled, setAiEnabled] = useState(true);

  // AI 활성화 여부 상위에서 1회만 조회 (N+1 IPC 쿼리 제거)
  useEffect(() => {
    chrome.storage.local.get("clickbook_ai_enabled", (res) => {
      if (res.clickbook_ai_enabled === false) {
        setAiEnabled(false);
      }
    });
  }, []);

  const [cardSize, setCardSize] = useState<CardSize>(() => {
    return (localStorage.getItem(SIZE_STORAGE_KEY) as CardSize | null) ?? "m";
  });

  const [customCols, setCustomCols] = useState<ColumnOption>(() => {
    const saved = localStorage.getItem(COLS_STORAGE_KEY);
    if (!saved || saved === "auto") return "auto";
    const num = parseInt(saved, 10);
    return isNaN(num) ? "auto" : (num as ColumnOption);
  });

  function handleSizeChange(s: CardSize) {
    setCardSize(s);
    setCustomCols("auto");
    localStorage.setItem(SIZE_STORAGE_KEY, s);
    localStorage.setItem(COLS_STORAGE_KEY, "auto");
  }

  function handleColsChange(c: ColumnOption) {
    setCustomCols(c);
    localStorage.setItem(COLS_STORAGE_KEY, String(c));
  }

  // 북마크 매핑 캐싱 (useMemo)
  const bookmarkMap = useMemo(() => {
    return new Map(bookmarks.map((b) => [b.id, b]));
  }, [bookmarks]);

  // 검색 및 색상 필터링 적용된 메모 리스트 (useMemo)
  const filteredMemos = useMemo(() => {
    let list = Object.values(memos).sort((a, b) => b.updatedAt - a.updatedAt);

    if (colorFilter !== "all") {
      list = list.filter((m) => m.color === colorFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((m) => {
        const contentMatch = (m.content || "").toLowerCase().includes(q);
        const bm = bookmarkMap.get(m.bookmarkId);
        const titleMatch = bm?.title ? bm.title.toLowerCase().includes(q) : false;
        const urlMatch = bm?.url ? bm.url.toLowerCase().includes(q) : false;
        return contentMatch || titleMatch || urlMatch;
      });
    }

    return list;
  }, [memos, colorFilter, searchQuery, bookmarkMap]);

  const totalCount = Object.keys(memos).length;

  return (
    <WallpaperBackground isDarkMode={isDarkMode}>
      <div className="w-full pb-12 pt-2 sm:pt-4 px-2 sm:px-6 select-none space-y-4">
        {/* ── 타이틀 & 컨트롤 헤더 (피그마 스타일 고품격 툴바) ── */}
        <div className="flex items-center gap-2.5 flex-wrap px-1">
          {/* 타이틀 & 배지 */}
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold flex items-center gap-2 tracking-tight text-slate-800 dark:text-slate-100">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500 text-white shadow-sm shadow-amber-500/20">
                <StickyNote size={15} strokeWidth={2.5} />
              </span>
              <span>{t("memo") || "MEMO"}</span>
            </h1>
            <span className="text-xs font-semibold bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full shadow-figma-xs">
              {filteredMemos.length}
              {totalCount !== filteredMemos.length && ` / ${totalCount}`}
            </span>
          </div>

          {/* 검색창 */}
          <div className="relative flex items-center min-w-[160px] sm:min-w-[210px] max-w-[280px]">
            <Search size={13} className="absolute left-2.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("memoSearchPlaceholder")}
              className="w-full pl-8 pr-7 py-1 text-xs rounded-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-slate-200/70 dark:border-white/10 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all shadow-figma-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title={t("memoClearTooltip")}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* 색상 필터 칩 */}
          <div className="flex items-center gap-1 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-xl p-1 border border-slate-200/70 dark:border-white/10 shadow-figma-xs">
            <button
              type="button"
              onClick={() => setColorFilter("all")}
              className={`px-2 py-0.5 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                colorFilter === "all"
                  ? "bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow-figma-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {t("memoAllColors")}
            </button>
            {ALL_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColorFilter(c)}
                className={`w-4 h-4 rounded-full ${MEMO_DOT[c]} transition-all cursor-pointer ${
                  colorFilter === c
                    ? "ring-2 ring-offset-1 ring-slate-400 dark:ring-slate-500 scale-110"
                    : "opacity-45 hover:opacity-100"
                }`}
                title={`${t("memoColorFilterTooltip")}: ${c}`}
              />
            ))}
          </div>

          {/* 반응형 프리셋 카드 크기 (S / M / L) */}
          <div className="flex items-center gap-0.5 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-xl p-0.5 border border-slate-200/70 dark:border-white/10 shadow-figma-xs">
            {(["s", "m", "l"] as CardSize[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleSizeChange(s)}
                className={`text-[10.5px] font-bold w-6 h-5 rounded-lg transition-all cursor-pointer ${
                  cardSize === s
                    ? "bg-amber-500 text-white shadow-figma-xs"
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
                title={`Preset Size ${SIZE_LABEL[s]}`}
              >
                {SIZE_LABEL[s]}
              </button>
            ))}
          </div>

          {/* 한 열당 메모 개수 지정 (2 ~ 8개 / Auto) */}
          <div className="hidden sm:flex items-center gap-0.5 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-xl p-0.5 text-[11px] border border-slate-200/70 dark:border-white/10 shadow-figma-xs">
            <span className="text-[9.5px] font-bold text-slate-400 dark:text-slate-500 px-1.5 select-none">
              {t("memoColsLabel")}:
            </span>
            {(["auto", 2, 3, 4, 5, 6, 7, 8] as ColumnOption[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => handleColsChange(c)}
                className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  customCols === c
                    ? "bg-indigo-600 text-white shadow-figma-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
                }`}
                title={c === "auto" ? "Auto Layout" : `${c} Columns`}
              >
                {c === "auto" ? t("memoColsAuto") : c}
              </button>
            ))}
          </div>

          {/* 메모 추가 버튼 */}
          <button
            type="button"
            onClick={() => setShowNew(true)}
            className="ml-auto flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-xl transition-all shadow-figma-xs active:scale-98 cursor-pointer"
          >
            <Plus size={13} strokeWidth={2.5} />
            <span>{t("addMemo")}</span>
          </button>
        </div>

        {/* ── 메모 카드 그리드 ── */}
        {totalCount === 0 && !showNew ? (
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-white/10 shadow-figma-lg flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500 select-none">
            <StickyNote size={44} className="mb-3 opacity-25" />
            <p className="text-sm font-semibold mb-1">{t("memoEmpty")}</p>
            <p className="text-xs text-center leading-relaxed max-w-xs mb-4 text-slate-400 dark:text-slate-500">
              {t("memoEmptyDesc")}
            </p>
            <button
              type="button"
              onClick={() => setShowNew(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-figma-xs cursor-pointer"
            >
              <Plus size={13} />
              <span>{t("addMemo")}</span>
            </button>
          </div>
        ) : filteredMemos.length === 0 && !showNew ? (
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-white/10 shadow-figma-sm flex flex-col items-center justify-center py-14 text-slate-400 dark:text-slate-500 select-none">
            <Search size={32} className="mb-2 opacity-30" />
            <p className="text-xs font-semibold mb-2">{t("memoNoSearchResults")}</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setColorFilter("all");
              }}
              className="text-[11px] font-semibold text-indigo-500 hover:underline cursor-pointer"
            >
              {t("memoClearTooltip")}
            </button>
          </div>
        ) : (
          <div
            className={`grid gap-3.5 items-stretch ${customCols === "auto" ? SIZE_GRID[cardSize] : ""}`}
            style={
              customCols !== "auto"
                ? { gridTemplateColumns: `repeat(${customCols}, minmax(200px, 1fr))` }
                : undefined
            }
          >
            {/* 新規入力カード（先頭に表示） */}
            {showNew && (
              <NewMemoCard
                cardSize={cardSize}
                aiEnabled={aiEnabled}
                onSave={() => {
                  setShowNew(false);
                  onRefresh();
                }}
                onCancel={() => setShowNew(false)}
              />
            )}
            {filteredMemos.map((memo) => (
              <MemoCard
                key={memo.bookmarkId}
                memo={memo}
                bookmark={bookmarkMap.get(memo.bookmarkId)}
                cardSize={cardSize}
                aiEnabled={aiEnabled}
                onRefresh={onRefresh}
              />
            ))}
          </div>
        )}
      </div>
    </WallpaperBackground>
  );
}
