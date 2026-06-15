import React, { useState, useEffect } from "react";
import { StickyNote, Loader2, Sparkles, X, Check } from "lucide-react";
import type { MemoColor, MessageResponse } from "@/shared/types";
import { MEMO_DOT, ALL_MEMO_COLORS } from "@/shared/colors";
import { generateMemoDraft } from "@/shared/categorizer";

interface MemoFormProps {
  existingBookmarkId: string | null;
  setExistingBookmarkId: (id: string | null) => void;
  tabUrl: string;
  tabTitle: string;
  tabSummary?: string;
  tabTags?: string[];
  lang: string;
  t: any;
  onClose: () => void;
}

export default function MemoForm({
  existingBookmarkId,
  setExistingBookmarkId,
  tabUrl,
  tabTitle,
  tabSummary,
  tabTags,
  lang,
  t,
  onClose,
}: MemoFormProps) {
  const [memoText, setMemoText] = useState("");
  const [memoColor, setMemoColor] = useState<MemoColor>("yellow");
  const [memoStatus, setMemoStatus] = useState<"idle" | "loading" | "done" | "used">("idle");

  // AI Draft States
  const [draftState, setDraftState] = useState<"idle" | "loading" | "done" | "used">("idle");
  const [draft, setDraft] = useState("");
  const [draftAiUsed, setDraftAiUsed] = useState(false);

  // Load existing memo if it exists
  useEffect(() => {
    async function loadExistingMemo() {
      if (existingBookmarkId) {
        try {
          const memosRes = (await chrome.runtime.sendMessage({ type: "GET_MEMOS" })) as MessageResponse;
          if (memosRes.success && memosRes.data) {
            const memos = memosRes.data as Record<string, { content: string; color: string }>;
            const memo = memos[existingBookmarkId];
            if (memo) {
              setMemoText(memo.content);
              setMemoColor(memo.color as MemoColor);
            }
          }
        } catch (err) {
          console.warn("Failed to load memo content in MemoForm:", err);
        }
      }
    }
    loadExistingMemo();
  }, [existingBookmarkId]);

  async function handleGeneratePopupDraft() {
    if (!tabUrl) return;
    setDraftState("loading");
    setDraft("");
    try {
      const result = await generateMemoDraft(
        tabUrl,
        tabTitle,
        tabSummary,
        tabTags,
        lang as "en" | "ja" | "ko"
      );
      setDraft(result.draft);
      setDraftAiUsed(result.aiUsed);
      setDraftState("done");
    } catch (err) {
      console.warn("Popup AI Draft error:", err);
      setDraftState("idle");
    }
  }

  function handleUsePopupDraft() {
    setMemoText((prev) => (prev ? prev + "\n" + draft : draft));
    setDraftState("used");
  }

  async function handleSaveMemo() {
    if (!memoText.trim()) return;
    setMemoStatus("loading");

    let bookmarkId = existingBookmarkId;

    if (!bookmarkId) {
      bookmarkId = `standalone_${crypto.randomUUID()}`;
      setExistingBookmarkId(bookmarkId);
    }

    try {
      await chrome.runtime.sendMessage({
        type: "SAVE_MEMO",
        bookmarkId,
        content: memoText.trim(),
        color: memoColor,
      });
      setMemoStatus("done");
      setTimeout(() => setMemoStatus("idle"), 1500);
    } catch (err) {
      console.warn("Failed to save memo:", err);
      setMemoStatus("idle");
    }
  }

  return (
    <div className="flex flex-col gap-2 bg-surface-800 rounded-xl p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <p className="text-[11px] font-medium text-yellow-400 flex items-center gap-1.5 shrink-0">
            <StickyNote size={12} />
            {t("popupMemoPanel")}
          </p>
          <div className="flex items-center gap-1">
            {ALL_MEMO_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setMemoColor(c)}
                className={`w-3.5 h-3.5 rounded-full ${MEMO_DOT[c]} transition-all ${
                  memoColor === c
                    ? "ring-2 ring-offset-1 ring-gray-400 ring-offset-surface-800"
                    : "opacity-50 hover:opacity-100"
                }`}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleGeneratePopupDraft}
            disabled={draftState === "loading"}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold transition-all ${
              draftState === "loading"
                ? "bg-violet-900/30 text-violet-400 cursor-not-allowed"
                : draftState === "done" || draftState === "used"
                ? "bg-violet-900/30 text-violet-400"
                : "bg-surface-700 text-gray-400 hover:bg-violet-900/30 hover:text-violet-400"
            }`}
            title="AI 메모 초안 생성"
          >
            {draftState === "loading" ? (
              <Loader2 size={8} className="animate-spin" />
            ) : (
              <Sparkles size={8} />
            )}
            AI 초안
          </button>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-400">
            <X size={12} />
          </button>
        </div>
      </div>
      <textarea
        value={memoText}
        onChange={(e) => setMemoText(e.target.value)}
        autoFocus
        placeholder={t("popupMemoPlaceholder")}
        rows={3}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
        className="w-full text-xs bg-surface-900 border border-surface-700 rounded-lg px-2.5 py-2 text-gray-200 outline-none focus:border-yellow-500/50 transition-colors placeholder-gray-700 resize-y min-h-[60px] max-h-[200px] leading-relaxed"
      />
      {/* AI Draft Panel */}
      {draftState === "loading" && (
        <div className="mt-1 p-2 rounded-lg border border-violet-700/40 bg-violet-900/20 flex items-center gap-2">
          <Loader2 size={12} className="text-violet-500 animate-spin shrink-0" />
          <span className="text-[10px] text-violet-400 animate-pulse">
            {lang === "ko"
              ? "AI가 메모 초안을 작성 중..."
              : lang === "ja"
              ? "AI が下書きを生成중..."
              : "AI is drafting..."}
          </span>
        </div>
      )}

      {(draftState === "done" || draftState === "used") && (
        <div
          className={`mt-1 rounded-lg border overflow-hidden transition-all ${
            draftState === "used" ? "border-emerald-700/40 bg-emerald-900/20" : "border-violet-700/40 bg-violet-900/15"
          }`}
        >
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 border-b ${
              draftState === "used" ? "border-emerald-700/40" : "border-violet-700/40"
            }`}
          >
            {draftState === "used" ? (
              <Check size={9} className="text-emerald-500" />
            ) : (
              <Sparkles size={9} className="text-violet-500" />
            )}
            <span
              className={`text-[9px] font-bold uppercase tracking-wider ${
                draftState === "used" ? "text-emerald-400" : "text-violet-400"
              }`}
            >
              {draftState === "used"
                ? lang === "ko"
                  ? "초안 적용됨"
                  : lang === "ja"
                  ? "下書き適用済"
                  : "Draft applied"
                : lang === "ko"
                ? `AI 초안 ${draftAiUsed ? "(Gemini Nano)" : "(요약 기반)"}`
                : lang === "ja"
                ? `AI 下書き ${draftAiUsed ? "(Gemini Nano)" : "(要約ベース)"}`
                : `AI Draft ${draftAiUsed ? "(Gemini Nano)" : "(summary-based)"}`}
            </span>
          </div>
          <div className="px-2.5 py-1.5">
            <pre
              className={`text-[10px] leading-relaxed whitespace-pre-wrap font-sans ${
                draftState === "used" ? "text-emerald-300" : "text-violet-300"
              }`}
            >
              {draft}
            </pre>
          </div>
          {draftState === "done" && (
            <div className="flex items-center justify-end gap-1.5 px-2.5 pb-1.5">
              <button
                onClick={() => setDraftState("idle")}
                className="text-[9px] text-gray-500 hover:text-gray-300 px-1.5 py-0.5 rounded transition-colors"
              >
                {lang === "ko" ? "닫기" : lang === "ja" ? "閉じる" : "Dismiss"}
              </button>
              <button
                onClick={handleUsePopupDraft}
                className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
              >
                <Check size={8} />
                {lang === "ko" ? "이 내용 사용" : lang === "ja" ? "使用する" : "Use this"}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSaveMemo}
          disabled={memoStatus === "loading" || !memoText.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium transition-colors"
        >
          {memoStatus === "loading" ? (
            <Loader2 size={11} className="animate-spin" />
          ) : memoStatus === "done" ? (
            <Check size={11} className="text-white" />
          ) : (
            <StickyNote size={11} />
          )}
          {memoStatus === "done" ? t("popupMemoSaved") : t("popupMemoSave")}
        </button>
      </div>
    </div>
  );
}
