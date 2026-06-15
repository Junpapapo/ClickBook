import React, { useState, useRef, useEffect } from "react";
import { ClipboardList, X, Loader2, BookmarkCheck, CheckCircle2 } from "lucide-react";
import { useLang } from "@/shared/LanguageContext";
import { extractUrls } from "@/shared/utils";
import type { MessageResponse } from "@/shared/types";

interface BulkImportFormProps {
  onClose: () => void;
}

export default function BulkImportForm({ onClose }: BulkImportFormProps) {
  const { t } = useLang();
  const [textInput, setTextInput] = useState("");
  const [textImportStatus, setTextImportStatus] = useState<"idle" | "loading" | "done">("idle");
  const [textImportResult, setTextImportResult] = useState<{ saved: number; skipped: number } | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  async function handleTextImport() {
    const urls = extractUrls(textInput);
    if (urls.length === 0) return;
    setTextImportStatus("loading");
    setTextImportResult(null);
    const items = urls.map(u => ({ url: u, title: u }));
    try {
      const res = await chrome.runtime.sendMessage({ type: "BULK_IMPORT_CHROME", items }) as MessageResponse;
      const saved = (res.success && res.data) ? ((res.data as { count: number }).count ?? 0) : 0;
      
      setTextImportStatus("done");
      setTextImportResult({ saved, skipped: urls.length - saved });
      if (saved > 0) setTextInput("");
      setTimeout(() => {
        setTextImportStatus("idle");
        setTextImportResult(null);
      }, 4000);
    } catch (err) {
      console.warn("Failed to import texts:", err);
      setTextImportStatus("idle");
    }
  }

  const detectedUrlsCount = extractUrls(textInput).length;

  return (
    <div className="flex flex-col gap-2 bg-surface-800 rounded-xl p-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium text-amber-400 flex items-center gap-1.5">
          <ClipboardList size={12} />
          {t("popupTextImportPanel")}
        </p>
        <button onClick={onClose} className="text-gray-600 hover:text-gray-400">
          <X size={12} />
        </button>
      </div>
      <textarea
        ref={textareaRef}
        value={textInput}
        onChange={e => setTextInput(e.target.value)}
        placeholder={t("bulkImportPlaceholder")}
        rows={5}
        className="w-full text-xs bg-surface-900 border border-surface-600 rounded-lg px-2.5 py-2 text-gray-200 outline-none focus:border-amber-500 transition-colors placeholder-gray-700 resize-none leading-relaxed"
      />
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] text-gray-600">
          {textInput ? t("popupTextDetected", { n: detectedUrlsCount }) : t("popupTextAutoDetect")}
        </p>
        <button
          onClick={handleTextImport}
          disabled={textImportStatus === "loading" || detectedUrlsCount === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium transition-colors cursor-pointer"
        >
          {textImportStatus === "loading" ? <Loader2 size={11} className="animate-spin" /> : <BookmarkCheck size={11} />}
          {textImportStatus === "loading" ? t("popupTextImporting") : t("popupTextImportBtn")}
        </button>
      </div>
      {textImportResult && (
        <p className={`text-[11px] flex items-center gap-1.5 ${
          textImportResult.saved > 0 ? "text-emerald-400" : "text-amber-400"
        }`}>
          <CheckCircle2 size={12} />
          {t("popupTextResult", { saved: textImportResult.saved, skipped: textImportResult.skipped })}
        </p>
      )}
    </div>
  );
}
