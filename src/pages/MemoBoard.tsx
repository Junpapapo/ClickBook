import { useState, useEffect } from "react";
import { StickyNote, ExternalLink, X, Plus, Check } from "lucide-react";
import type { Bookmark, BookmarkMemo, MemoColor, MemoMap } from "@/shared/types";
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
  const { t } = useLang();
  const [content, setContent] = useState("");
  const [color, setColor] = useState<MemoColor>("yellow");

  async function handleSave() {
    const text = content.trim();
    if (!text) return;
    const id = `standalone_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await chrome.runtime.sendMessage({ type: "SAVE_MEMO", bookmarkId: id, content: text, color });
    onSave();
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
        <div className="flex gap-1 justify-end">
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
  const { t } = useLang();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(memo.content);
  const [color, setColor] = useState<MemoColor>(memo.color);

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
          <button
            onClick={handleDelete}
            className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-gray-400 hover:text-red-400"
            title="メモを削除"
          >
            <X size={12} />
          </button>
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
            <div className="flex gap-1 justify-end">
              <button
                onClick={() => { setDraft(memo.content); setEditing(false); }}
                className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-2 py-1 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded-lg transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <p
            className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap cursor-pointer hover:text-gray-900 dark:hover:text-gray-100 transition-colors flex-1 min-h-[40px]"
            onClick={() => { setDraft(memo.content); setEditing(true); }}
            title={t("clickToEdit")}
          >
            {memo.content}
          </p>
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
      <div className="flex items-center gap-3">
        <StickyNote size={14} className="text-amber-400" />
        <h2 className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-600 font-semibold">
          {t("memoTitle")}
        </h2>
        <span className="text-xs text-gray-400 dark:text-gray-600">{t("memoCount", { n: memoList.length })}</span>

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
