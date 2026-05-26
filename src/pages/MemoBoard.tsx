import { useState, useEffect } from "react";
import { StickyNote, ExternalLink, X, Plus, Check, Info, Sparkles, Loader2, Copy, Trash2, BookOpen } from "lucide-react";
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

// ── サイズ設定 ─────────────────────────────────────────────

type CardSize = "s" | "m" | "l";

const SIZE_GRID: Record<CardSize, string> = {
  s: "grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
  m: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
  l: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
};

const SIZE_LABEL: Record<CardSize, string> = { s: "S", m: "M", l: "L" };
const SIZE_STORAGE_KEY = "clickbook_memo_size";

// ── NewMemoCard（サイト連携なしの新規メモ入力カード） ────

function NewMemoCard({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  const { t, lang } = useLang();
  const [content, setContent] = useState("");
  const [color, setColor] = useState<MemoColor>("yellow");
  const [isRefining, setIsRefining] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);

  useEffect(() => {
    chrome.storage.local.get("clickbook_ai_enabled", (res) => {
      if (res.clickbook_ai_enabled === false) {
        setAiEnabled(false);
      }
    });
  }, []);

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
    const res = await refineMemoDraft(content, lang);
    if (res.aiUsed) {
      setContent(res.draft);
    }
    setIsRefining(false);
  }

  return (
    <div className={`flex flex-col rounded-xl border overflow-hidden shadow-md ${MEMO_CARD_CLS[color]}`}>
      <div className={`h-1.5 w-full shrink-0 ${MEMO_ACCENT[color]}`} />
      <div className="p-3 flex flex-col gap-2">
        {/* カラーピッカー */}
        <div className="flex items-center gap-1.5">
          {ALL_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-4 h-4 rounded-full ${MEMO_DOT[c]} transition-all ${
                c === color
                  ? "ring-2 ring-offset-1 ring-gray-400 dark:ring-gray-500 dark:ring-offset-transparent"
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
          rows={4}
          onKeyDown={(e) => {
            if (e.key === "Escape") onCancel();
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSave();
          }}
          className={`w-full text-xs rounded-lg px-2.5 py-2 resize-none outline-none leading-relaxed ${MEMO_TEXTAREA_BG[color]} text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500`}
        />

        {/* アクション */}
        <div className="flex gap-1 justify-between items-center mt-1">
          <div className="flex items-center gap-1">
            <button
              onClick={handleRefine}
              disabled={!content.trim() || isRefining || !aiEnabled}
              title={aiEnabled ? t("aiRefineMemo") : t("aiNotAvailable")}
              className="text-indigo-500 hover:text-indigo-600 disabled:opacity-40 p-1 px-1.5 transition-colors bg-white/50 dark:bg-black/20 rounded-md hover:bg-white dark:hover:bg-black/40 shadow-sm flex items-center gap-1"
            >
              {isRefining ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            </button>
            <button
              onClick={() => {
                if (content) navigator.clipboard.writeText(content);
              }}
              disabled={!content}
              title="Copy"
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-40 p-1 px-1.5 transition-colors bg-white/50 dark:bg-black/20 rounded-md hover:bg-white dark:hover:bg-black/40 shadow-sm flex items-center"
            >
              <Copy size={14} />
            </button>
            <button
              onClick={() => setContent("")}
              disabled={!content}
              title="Clear text"
              className="text-red-500 hover:text-red-600 disabled:opacity-40 p-1 px-1.5 transition-colors bg-white/50 dark:bg-black/20 rounded-md hover:bg-white dark:hover:bg-black/40 shadow-sm flex items-center"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <div className="flex gap-1">
            <button
              onClick={onCancel}
              className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-2 py-1 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!content.trim()}
              className="text-[10px] bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
            >
              <Check size={10} />
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MemoCard ──────────────────────────────────────────────

function MemoCard({
  memo,
  bookmark,
  onRefresh,
}: {
  memo: BookmarkMemo;
  bookmark?: Bookmark;
  onRefresh: () => void;
}) {
  const { t, lang } = useLang();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(memo.content);
  const [color, setColor] = useState<MemoColor>(memo.color);
  const [isRefining, setIsRefining] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);

  useEffect(() => {
    chrome.storage.local.get("clickbook_ai_enabled", (res) => {
      if (res.clickbook_ai_enabled === false) {
        setAiEnabled(false);
      }
    });
  }, []);

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
    const res = await refineMemoDraft(draft, lang);
    if (res.aiUsed) {
      setDraft(res.draft);
    }
    setIsRefining(false);
  }

  async function handleColorChange(c: MemoColor) {
    setColor(c);
    await chrome.runtime.sendMessage({
      type: "SAVE_MEMO",
      bookmarkId: memo.bookmarkId,
      content: memo.content,
      color: c,
    });
    onRefresh();
  }

  async function handleDelete() {
    await chrome.runtime.sendMessage({ type: "DELETE_MEMO", bookmarkId: memo.bookmarkId });
    onRefresh();
  }

  return (
    <div className={`group relative flex flex-col rounded-xl border overflow-hidden shadow-sm dark:shadow-none ${MEMO_CARD_CLS[color]}`}>
      {/* カラーアクセントバー */}
      <div className={`h-1.5 w-full shrink-0 ${MEMO_ACCENT[color]}`} />

      <div className="p-3 flex flex-col gap-2 flex-1">
        {/* カラーピッカー + 削除（ホバー時） */}
        <div className="flex items-center gap-1 min-h-[18px]">
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {ALL_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => handleColorChange(c)}
                className={`w-3.5 h-3.5 rounded-full ${MEMO_DOT[c]} transition-all ${
                  c === color
                    ? "ring-1 ring-offset-1 ring-gray-500 dark:ring-offset-transparent"
                    : "opacity-50 hover:opacity-100"
                }`}
              />
            ))}
          </div>
          <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {bookmark && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.dispatchEvent(new CustomEvent("OPEN_BOOKMARK_INFO", { detail: bookmark }));
                }}
                className="p-0.5 text-gray-400 hover:text-indigo-500"
                title="View Site Info"
              >
                <Info size={12} />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.dispatchEvent(new CustomEvent("OPEN_READER_MODE", {
                  detail: {
                    bookmarkId: `memo-${memo.bookmarkId}`,
                    title: bookmark ? `Memo: ${bookmark.title}` : "Memo",
                    url: bookmark?.url,
                    content: memo.content
                  }
                }));
              }}
              className="p-0.5 text-gray-400 hover:text-indigo-500"
              title={t("readerTooltipOpenZen")}
            >
              <BookOpen size={12} />
            </button>
            <button
              onClick={handleDelete}
              className="p-0.5 text-gray-400 hover:text-red-400"
              title="Delete Memo"
            >
              <X size={12} />
            </button>
          </div>
        </div>

        {/* メモ本文 */}
        {editing ? (
          <div className="flex flex-col gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
              rows={4}
              onKeyDown={(e) => { if (e.key === "Escape") { setDraft(memo.content); setEditing(false); } }}
              className={`w-full text-xs rounded-lg px-2.5 py-1.5 resize-none outline-none leading-relaxed ${MEMO_TEXTAREA_BG[color]} text-gray-800 dark:text-gray-200`}
            />
            <div className="flex gap-1 justify-between items-center mt-1">
              <div className="flex items-center gap-1">
                <button
                  onClick={handleRefine}
                  disabled={!draft.trim() || isRefining || !aiEnabled}
                  title={aiEnabled ? t("aiRefineMemo") : t("aiNotAvailable")}
                  className="text-indigo-500 hover:text-indigo-600 disabled:opacity-40 p-1 px-1.5 transition-colors bg-white/50 dark:bg-black/20 rounded-md hover:bg-white dark:hover:bg-black/40 shadow-sm flex items-center gap-1"
                >
                  {isRefining ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  {isRefining && <span className="text-[10px] whitespace-nowrap">{t("aiRefining")}</span>}
                </button>
                <button
                  onClick={() => {
                    if (draft) navigator.clipboard.writeText(draft);
                  }}
                  disabled={!draft}
                  title="Copy"
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-40 p-1 px-1.5 transition-colors bg-white/50 dark:bg-black/20 rounded-md hover:bg-white dark:hover:bg-black/40 shadow-sm flex items-center"
                >
                  <Copy size={14} />
                </button>
                <button
                  onClick={() => setDraft("")}
                  disabled={!draft}
                  title="Clear text"
                  className="text-red-500 hover:text-red-600 disabled:opacity-40 p-1 px-1.5 transition-colors bg-white/50 dark:bg-black/20 rounded-md hover:bg-white dark:hover:bg-black/40 shadow-sm flex items-center"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => { setDraft(memo.content); setEditing(false); }}
                  className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-2 py-1 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!draft.trim()}
                  className="text-[10px] bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-2.5 py-1 rounded-lg transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed cursor-pointer hover:text-gray-900 dark:hover:text-gray-100 transition-colors flex-1 min-h-[40px] markdown-body"
            onClick={() => { setDraft(memo.content); setEditing(true); }}
            title={t("clickToEdit")}
          >
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
        )}

        {/* 紐づきサイト */}
        {bookmark && (
          <div className="mt-auto pt-2 border-t border-black/10 dark:border-white/10">
            <button
              onClick={() => window.open(bookmark.url, "_blank", "noopener,noreferrer")}
              className="flex items-center gap-1.5 w-full hover:opacity-80 transition-opacity group/link"
            >
              <img
                src={bookmark.favicon}
                alt=""
                width={12}
                height={12}
                className="rounded-sm shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate flex-1 text-left group-hover/link:text-indigo-500 dark:group-hover/link:text-indigo-400 transition-colors">
                {bookmark.title}
              </span>
              <ExternalLink size={9} className="shrink-0 text-gray-400 ml-auto" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── MemoBoard（メインエクスポート） ───────────────────────

interface Props {
  memos: MemoMap;
  bookmarks: Bookmark[];
  onRefresh: () => void;
}

export default function MemoBoard({ memos, bookmarks, onRefresh }: Props) {
  const { t } = useLang();
  const [showNew, setShowNew] = useState(false);
  const [cardSize, setCardSize] = useState<CardSize>(() => {
    return (localStorage.getItem(SIZE_STORAGE_KEY) as CardSize | null) ?? "m";
  });

  function handleSizeChange(s: CardSize) {
    setCardSize(s);
    localStorage.setItem(SIZE_STORAGE_KEY, s);
  }

  const memoList = Object.values(memos).sort((a, b) => b.updatedAt - a.updatedAt);
  const bookmarkMap = new Map(bookmarks.map((b) => [b.id, b]));

  if (memoList.length === 0 && !showNew) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-gray-400 dark:text-gray-600 select-none">
        <StickyNote size={52} className="mb-4 opacity-20" />
        <p className="text-sm font-medium mb-1.5">{t("memoEmpty")}</p>
        <p className="text-xs text-center leading-relaxed max-w-xs mb-6">
          {t("memoEmptyDesc")}
        </p>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors"
        >
          <Plus size={13} />
          {t("addMemo")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-xl font-bold flex items-center gap-2 tracking-tight">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30">
            <StickyNote size={16} strokeWidth={3} />
          </span>
          <span className="bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 text-transparent bg-clip-text">
            MEMO
          </span>
        </h1>
        <span className="text-sm font-bold bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400 px-2.5 py-0.5 rounded-full shadow-sm ml-1">
          {memoList.length}
        </span>

        {/* サイズ切り替え */}
        <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-surface-800 rounded-lg p-0.5">
          {(["s", "m", "l"] as CardSize[]).map((s) => (
            <button
              key={s}
              onClick={() => handleSizeChange(s)}
              className={`text-[10px] font-semibold w-6 h-6 rounded-md transition-all ${
                cardSize === s
                  ? "bg-white dark:bg-surface-700 text-indigo-600 dark:text-indigo-300 shadow-sm"
                  : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
            >
              {SIZE_LABEL[s]}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowNew(true)}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors"
        >
          <Plus size={12} />
          {t("addMemo")}
        </button>
      </div>

      <div className={`grid ${SIZE_GRID[cardSize]} gap-4 items-start`}>
        {/* 新規入力カード（先頭に表示） */}
        {showNew && (
          <NewMemoCard
            onSave={() => { setShowNew(false); onRefresh(); }}
            onCancel={() => setShowNew(false)}
          />
        )}
        {memoList.map((memo) => (
          <MemoCard
            key={memo.bookmarkId}
            memo={memo}
            bookmark={bookmarkMap.get(memo.bookmarkId)}
            onRefresh={onRefresh}
          />
        ))}
      </div>
    </div>
  );
}
