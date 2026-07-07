import React, { useEffect, useRef, useState } from "react";
import { Send, RotateCcw, X, Check, Loader2, Sparkles } from "lucide-react";
import type { Editor } from "@tiptap/react";
import { getAIModel } from "@/shared/categorizer/ai-service";

interface Props {
  editor: Editor;
  aiType: "continue" | "ask";
  aiAvailable: boolean;
  t: (key: string, replacements?: Record<string, any>) => string;
  onClose: () => void;
}

import { markdownToHtml } from "../spring-note-utils";

type Phase = "input" | "loading" | "preview" | "error";

export default function AiInlinePrompt({ editor, aiType, aiAvailable, t, onClose }: Props) {
  const [prompt, setPrompt] = useState("");
  const [phase, setPhase] = useState<Phase>("input");
  const [generatedText, setGeneratedText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
    if (!aiAvailable) {
      setErrorMsg(t("springNoteAiErrorDisabled") || "AI가 꺼져 있습니다. 팝업에서 켜주세요.");
      setPhase("error");
      return;
    }
    if (aiType === "continue") {
      runContinueWriting();
    }
  }, []);

  const getContext = () => {
    const pos = editor.state.selection.from;
    const fullText = editor.state.doc.textBetween(0, pos, "\n");
    return fullText.slice(-600);
  };

  const runContinueWriting = async () => {
    setPhase("loading");
    try {
      const lm = await getAIModel();
      if (!lm) throw new Error(t("springNoteAiErrorModel") || "AI 모델을 사용할 수 없습니다.");
      const context = getContext();
      const session = await lm.create({
        systemPrompt: "You are a helpful writing assistant. Continue the user's text naturally and fluently in the same language and style. Output only the continuation text as HTML format (e.g. use <strong> for bold, <ul>/<li> for lists, <p> for paragraphs), no markdown, no explanations.",
        expectedOutputs: [{ type: "text", languages: ["en", "ja"] }],
        temperature: 0.7,
        topK: 40,
      });
      const result: string = await session.prompt(
        `Continue this text naturally:\n\n${context}`
      );
      session.destroy();
      setGeneratedText(result.trim());
      setPhase("preview");
      try {
        chrome.storage.local.remove("clickbook_ai_error");
      } catch (_) {}
    } catch (err) {
      setErrorMsg(String(err));
      setPhase("error");
    }
  };

  const runAskAI = async () => {
    if (!prompt.trim()) return;
    setPhase("loading");
    try {
      const lm = await getAIModel();
      if (!lm) throw new Error(t("springNoteAiErrorModel") || "AI 모델을 사용할 수 없습니다.");
      const context = getContext();
      const session = await lm.create({
        systemPrompt: "You are a helpful writing assistant embedded in a note editor. Respond concisely in the same language as the user's request. Output only the content to insert in HTML format (e.g. use <strong> for bold, <ul>/<li> for lists, <p> for paragraphs). Do not use Markdown, no explanations.",
        expectedOutputs: [{ type: "text", languages: ["en", "ja"] }],
        temperature: 0.7,
        topK: 40,
      });
      const result: string = await session.prompt(
        context ? `Context:\n${context}\n\nRequest: ${prompt.trim()}` : prompt.trim()
      );
      session.destroy();
      setGeneratedText(result.trim());
      setPhase("preview");
      try {
        chrome.storage.local.remove("clickbook_ai_error");
      } catch (_) {}
    } catch (err) {
      setErrorMsg(String(err));
      setPhase("error");
    }
  };

  const handleApply = () => {
    if (!generatedText) return;
    // 마크다운 형태가 들어오더라도 안전하게 HTML로 변환하여 에디터에 주입
    const htmlContent = markdownToHtml(generatedText);
    editor.chain().focus().insertContent(htmlContent + " ").run();
    onClose();
  };

  const handleDiscard = () => {
    setGeneratedText("");
    setPhase("input");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && aiType === "ask") {
      e.preventDefault();
      runAskAI();
    }
    if (e.key === "Escape") onClose();
  };

  return (
    <div className="w-[432px] rounded-xl shadow-2xl border border-violet-500/30 bg-[#1c1c1e]/97 backdrop-blur-md overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-violet-900/20">
        <Sparkles size={12} className="text-violet-400 shrink-0" />
        <span className="text-[11px] font-semibold text-violet-300">
          {aiType === "continue" ? t("springNoteAiContinueWriting") : t("springNoteAiAsk")}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto p-0.5 rounded hover:bg-white/10 text-gray-500 hover:text-gray-300 transition-colors"
        >
          <X size={11} />
        </button>
      </div>

      <div className="p-3 space-y-2">
        {/* 로딩 */}
        {phase === "loading" && (
          <div className="flex items-center gap-2 py-2">
            <Loader2 size={14} className="animate-spin text-violet-400 shrink-0" />
            <span className="text-[12px] text-gray-400">{t("springNoteAiWriting")}</span>
          </div>
        )}

        {/* 미리보기 */}
        {phase === "preview" && (
          <div className="rounded-lg bg-white/5 border border-white/10 p-2.5 max-h-64 overflow-y-auto">
            <p className="text-[12px] text-gray-200 whitespace-pre-wrap leading-relaxed">{generatedText}</p>
          </div>
        )}

        {/* 에러 */}
        {phase === "error" && (
          <div className="rounded-lg bg-red-900/20 border border-red-500/30 p-2">
            <p className="text-[11px] text-red-400">{errorMsg}</p>
          </div>
        )}

        {/* 프롬프트 입력 */}
        {aiType === "ask" && (phase === "input" || phase === "preview" || phase === "error") && (
          <div className="flex items-end gap-1.5">
            <textarea
              ref={inputRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("springNoteAiPromptPlaceholder") || "Ask AI what you want..."}
              rows={2}
              className="flex-1 resize-none bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[12px] text-gray-200 placeholder-gray-500 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
            />
            <button
              type="button"
              onClick={runAskAI}
              disabled={!prompt.trim() || phase === "loading"}
              className="p-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              <Send size={12} className="text-white" />
            </button>
          </div>
        )}

        {/* 액션 버튼 */}
        {phase === "preview" && (
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={aiType === "continue" ? runContinueWriting : runAskAI}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-gray-300 hover:bg-white/10 transition-colors"
            >
              <RotateCcw size={11} />
              {t("springNoteAiTryAgain")}
            </button>
            <button
              type="button"
              onClick={handleDiscard}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-gray-300 hover:bg-white/10 transition-colors"
            >
              <X size={11} />
              {t("springNoteAiDiscard")}
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="ml-auto flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors"
            >
              <Check size={11} />
              {t("springNoteAiApply")}
            </button>
          </div>
        )}

        {/* error 단계 재시도 */}
        {phase === "error" && aiType === "continue" && aiAvailable && (
          <button
            type="button"
            onClick={runContinueWriting}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-gray-300 hover:bg-white/10 transition-colors"
          >
            <RotateCcw size={11} />
            {t("springNoteAiTryAgain")}
          </button>
        )}
      </div>
    </div>
  );
}
