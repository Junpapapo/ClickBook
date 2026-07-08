import { useState, useEffect } from "react";
import { X, StickyNote, Copy, Trash2, BookOpen, Edit3, Sparkles, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { refineMemoDraft } from "@/shared/categorizer";
import { useLang } from "@/shared/LanguageContext";
import {
  MEMO_DOT,
  MEMO_CARD_BG as MEMO_CARD_CLS,
  MEMO_ACCENT,
  MEMO_TEXTAREA_BG,
} from "@/shared/colors";
import type { ColorTheme } from "../mindmap-types";

interface Props {
  nodeId: string;
  nodeLabel: string;
  initialContent: string;
  initialColor: ColorTheme;
  onUpdate: (content: string, color: ColorTheme) => void;
  onClose: () => void;
}

export default function NodeMemoSidePanel({
  nodeId,
  nodeLabel,
  initialContent,
  initialColor,
  onUpdate,
  onClose,
}: Props) {
  const { t, lang } = useLang();
  const [isEditing, setIsEditing] = useState(true); // 사이드 패널은 기본 편집 모드로 기동
  const [text, setText] = useState(initialContent);
  const [color, setColor] = useState<ColorTheme>(initialColor);
  const [isRefining, setIsRefining] = useState(false);

  useEffect(() => {
    setText(initialContent);
    setColor(initialColor);
  }, [nodeId, initialContent, initialColor]);

  const handleTextChange = (val: string) => {
    setText(val);
    onUpdate(val, color);
  };

  const handleColorChange = (newColor: ColorTheme) => {
    setColor(newColor);
    onUpdate(text, newColor);
  };

  const handleRefine = async () => {
    if (!text.trim() || isRefining) return;
    setIsRefining(true);
    try {
      const res = await refineMemoDraft(text, lang);
      if (res.aiUsed) {
        setText(res.draft);
        onUpdate(res.draft, color);
      }
    } catch (e) {
      console.warn("Refine memo draft failed:", e);
    } finally {
      setIsRefining(false);
    }
  };

  // 마인드맵 ColorTheme과 메모장 전용 colors.ts 키 매핑
  const themeToMemoColor = (theme: ColorTheme): "yellow" | "pink" | "blue" | "green" | "purple" => {
    const map: Record<string, "yellow" | "pink" | "blue" | "green" | "purple"> = {
      indigo: "blue",
      emerald: "green",
      amber: "yellow",
      rose: "pink",
      violet: "purple",
      slate: "purple",
    };
    return map[theme] || "blue";
  };

  const memoColorKey = themeToMemoColor(color);

  return (
    <div
      className={`w-80 h-full border-l border-gray-200 dark:border-surface-800 transition-all duration-300 shadow-2xl flex flex-col shrink-0 animate-in slide-in-from-right duration-200 z-10 ${
        MEMO_CARD_CLS[memoColorKey] || "bg-blue-50"
      }`}
    >
      {/* 컬러 액센트 탑 바 */}
      <div className={`h-1.5 w-full ${MEMO_ACCENT[memoColorKey] || "bg-blue-500"}`} />

      {/* 헤더 바 */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5">
        <div className="flex items-center gap-2 min-w-0">
          <StickyNote size={14} className="text-indigo-500 shrink-0" />
          <div className="min-w-0">
            <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block leading-none">
              NODE DETAIL MEMO
            </span>
            <h3 className="text-xs font-bold text-gray-800 dark:text-gray-100 truncate mt-1" title={nodeLabel}>
              {nodeLabel}
            </h3>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          title="Close panel"
        >
          <X size={15} />
        </button>
      </div>

      {/* 바디 영역 */}
      <div className="flex-1 p-4 flex flex-col gap-3 min-h-0 overflow-y-auto">
        
        {/* 에디팅 툴바 */}
        <div className="flex items-center justify-between flex-wrap gap-2 shrink-0">
          {/* 컬러 도트 선택기 */}
          <div className="flex items-center gap-1.5 bg-white/50 dark:bg-black/20 px-2 py-1 rounded-lg border border-black/5 dark:border-white/5">
            {(["yellow", "pink", "blue", "green", "purple"] as const).map((c) => {
              const memoToTheme = (mCol: "yellow" | "pink" | "blue" | "green" | "purple"): ColorTheme => {
                const reverseMap: Record<"yellow" | "pink" | "blue" | "green" | "purple", ColorTheme> = {
                  blue: "indigo",
                  green: "emerald",
                  yellow: "amber",
                  pink: "rose",
                  purple: "violet",
                };
                return reverseMap[mCol] || "indigo";
              };
              const themeVal = memoToTheme(c);
              return (
                <button
                  key={c}
                  onClick={() => handleColorChange(themeVal)}
                  className={`w-3.5 h-3.5 rounded-full ${MEMO_DOT[c]} transition-all cursor-pointer ${
                    c === memoColorKey
                      ? "ring-2 ring-offset-1 ring-gray-400 dark:ring-gray-500 dark:ring-offset-transparent scale-110"
                      : "opacity-60 hover:opacity-100"
                  }`}
                />
              );
            })}
          </div>

          {/* 유틸리티 액션 버튼 */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-surface-700 bg-white hover:bg-gray-50 dark:bg-surface-800 dark:hover:bg-surface-750 font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm text-gray-700 dark:text-gray-200"
              title={isEditing ? "Preview Markdown" : "Edit Note"}
            >
              {isEditing ? <BookOpen size={12} /> : <Edit3 size={12} />}
            </button>

            <button
              onClick={handleRefine}
              disabled={!text.trim() || isRefining}
              className="p-1.5 rounded-lg border border-indigo-100 dark:border-indigo-950 bg-indigo-50/50 hover:bg-indigo-50 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 disabled:opacity-40 transition-all cursor-pointer shadow-sm"
              title="Refine with AI"
            >
              {isRefining ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            </button>

            <button
              onClick={() => {
                if (text) navigator.clipboard.writeText(text);
              }}
              disabled={!text.trim()}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-surface-700 bg-white hover:bg-gray-50 dark:bg-surface-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 disabled:opacity-40 transition-all cursor-pointer shadow-sm"
              title="Copy to Clipboard"
            >
              <Copy size={12} />
            </button>

            <button
              onClick={() => handleTextChange("")}
              disabled={!text.trim()}
              className="p-1.5 rounded-lg border border-rose-100 dark:border-rose-950 bg-rose-50/50 hover:bg-rose-50 dark:bg-rose-950/20 text-rose-500 disabled:opacity-40 transition-all cursor-pointer shadow-sm"
              title="Clear All"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {/* 텍스트 영역 또는 마크다운 렌더러 */}
        <div className="flex-1 flex flex-col min-h-0">
          {isEditing ? (
            <textarea
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder={t("mindmapNotesPlaceholder")}
              className={`w-full flex-1 text-xs rounded-xl border border-gray-200/60 dark:border-surface-800/40 px-3 py-2.5 resize-none outline-none leading-relaxed shadow-sm ${
                MEMO_TEXTAREA_BG[memoColorKey] || "bg-white"
              } text-gray-850 dark:text-gray-200 placeholder-gray-400 focus:ring-1 focus:ring-indigo-500/20`}
            />
          ) : (
            <div
              onClick={() => setIsEditing(true)}
              className={`w-full flex-1 text-xs rounded-xl px-4 py-3.5 leading-relaxed border border-gray-200/50 dark:border-surface-800/20 overflow-y-auto cursor-text ${
                MEMO_TEXTAREA_BG[memoColorKey] || "bg-white"
              } text-gray-800 dark:text-gray-200 shadow-inner`}
            >
              {text.trim() ? (
                <div className="prose dark:prose-invert max-w-none text-xs break-all prose-headings:text-[11px] prose-headings:font-bold prose-headings:mt-1 prose-headings:mb-1.5 prose-p:my-1 prose-ul:my-1 prose-li:my-0.5">
                  <ReactMarkdown>{text}</ReactMarkdown>
                </div>
              ) : (
                <span className="text-gray-400 dark:text-gray-500 italic">
                  {t("mindmapNoNotes")}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
