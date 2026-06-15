import React, { useState, useEffect } from "react";
import { Copy, RefreshCw, Check } from "lucide-react";
import { getRandomQuote } from "@/shared/quotes";
import type { Quote } from "@/shared/quotes";

interface QuotePanelProps {
  isCollapsed: boolean;
  lang: string;
}

export default function QuotePanel({ isCollapsed, lang }: QuotePanelProps) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setQuote(getRandomQuote());
  }, []);

  const handleRefreshQuote = () => {
    setQuote(getRandomQuote());
  };

  const handleCopyQuote = () => {
    if (!quote) return;
    const textToCopy = `"${quote.text}" — ${quote.author || "Unknown"}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  if (isCollapsed || !quote) {
    return null;
  }

  return (
    <div className="relative group/quote px-3 py-2 border-t border-gray-200 dark:border-surface-700 shrink-0 bg-gray-50/30 dark:bg-surface-800/10 rounded-b-lg transition-colors hover:bg-gray-100/40 dark:hover:bg-surface-800/20">
      {/* Action Buttons (Refresh & Copy) */}
      <div className="absolute right-1 top-1 flex items-center gap-1 opacity-0 group-hover/quote:opacity-100 transition-opacity duration-200">
        <button
          onClick={handleCopyQuote}
          title={lang === "ko" ? "명언 복사" : lang === "ja" ? "名言をコピー" : "Copy Quote"}
          className="p-0.5 rounded bg-white dark:bg-surface-800 shadow-sm border border-gray-200 dark:border-surface-700 text-gray-400 dark:text-gray-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors cursor-pointer"
        >
          {copied ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
        </button>
        <button
          onClick={handleRefreshQuote}
          title={lang === "ko" ? "다른 명언 보기" : lang === "ja" ? "他の名言を見る" : "Refresh Quote"}
          className="p-0.5 rounded bg-white dark:bg-surface-800 shadow-sm border border-gray-200 dark:border-surface-700 text-gray-400 dark:text-gray-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors cursor-pointer"
        >
          <RefreshCw size={10} />
        </button>
      </div>

      <p className="text-[10px] text-gray-500 dark:text-gray-400 italic text-center font-medium leading-normal pr-5 select-text selection:bg-indigo-500/20">
        "{quote.text}"
      </p>
      {quote.author && (
        <p className="text-[9px] text-gray-400 dark:text-gray-500 text-center mt-0.5 font-semibold select-text selection:bg-indigo-500/20">
          — {quote.author}
        </p>
      )}
    </div>
  );
}
