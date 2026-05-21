import { useState } from "react";
import { Search, ClipboardList, X, CheckCircle2, Loader2, Settings, ShieldCheck, HelpCircle } from "lucide-react";
import type { MessageResponse } from "@/shared/types";
import ThemeToggle from "@/components/ThemeToggle";
import { extractUrls } from "@/shared/utils";
import { useLang } from "@/shared/LanguageContext";

interface Props {
  query: string;
  onChange: (q: string) => void;
  onRefresh: () => void;
  onOpenSettings: () => void;
}

export default function SearchBar({ query, onChange, onRefresh, onOpenSettings }: Props) {
  const { t } = useLang();
  const [textImportOpen, setTextImportOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [textImportStatus, setTextImportStatus] = useState<"idle" | "loading" | "done">("idle");
  const [textImportResult, setTextImportResult] = useState<{ saved: number; skipped: number } | null>(null);

  async function handleTextImport() {
    const urls = extractUrls(textInput);
    if (!urls.length) return;
    setTextImportStatus("loading");
    setTextImportResult(null);
    const items = urls.map(u => ({ url: u, title: u }));
    const res = await chrome.runtime.sendMessage({ type: "BULK_IMPORT_CHROME", items }) as MessageResponse;
    const saved = (res.success && res.data) ? ((res.data as { count: number }).count ?? 0) : 0;
    setTextImportStatus("done");
    setTextImportResult({ saved, skipped: urls.length - saved });
    if (saved > 0) { setTextInput(""); onRefresh(); }
    setTimeout(() => { setTextImportStatus("idle"); setTextImportResult(null); }, 4000);
  }
  return (
    <>
      {/* 프라이버시 안내 모달 */}
      {privacyOpen && (
        <>
          <div
            className="fixed inset-0 z-[9000] bg-black/40 backdrop-blur-[2px]"
            onClick={() => setPrivacyOpen(false)}
          />
          <div className="fixed inset-0 z-[9001] flex items-center justify-center p-4 pointer-events-none">
            <div
              className="pointer-events-auto w-full max-w-sm bg-white dark:bg-surface-900 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 text-center">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck size={24} className="text-indigo-500 dark:text-indigo-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">
                  {t("privacyTitle")}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed break-keep">
                  {t("privacyDesc")}
                </p>
                <button
                  onClick={() => setPrivacyOpen(false)}
                  className="mt-6 w-full py-2.5 bg-gray-100 dark:bg-surface-800 hover:bg-gray-200 dark:hover:bg-surface-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-all active:scale-95"
                >
                  {t("closeBtn")}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* テキストインポートモーダル */}
      {textImportOpen && (
        <>
          <div
            className="fixed inset-0 z-[9000] bg-black/50 backdrop-blur-sm"
            onClick={() => setTextImportOpen(false)}
          />
          <div className="fixed inset-0 z-[9001] flex items-center justify-center p-4 pointer-events-none">
            <div
              className="pointer-events-auto w-full max-w-lg bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-600 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-surface-700">
                <div className="flex items-center gap-2">
                  <ClipboardList size={16} className="text-amber-500" />
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{t("bulkImportTitle")}</span>
                </div>
                <button
                  onClick={() => setTextImportOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                >
                  <X size={15} />
                </button>
              </div>
              <div className="px-6 py-5 space-y-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("bulkImportDesc")}
                </p>
                <textarea
                  autoFocus
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  rows={8}
                  placeholder={t("bulkImportPlaceholder")}
                  className="w-full text-sm bg-gray-50 dark:bg-surface-800 border border-gray-300 dark:border-surface-600 rounded-lg px-3 py-2.5 text-gray-800 dark:text-gray-100 outline-none focus:border-amber-500 transition-colors placeholder-gray-400 dark:placeholder-gray-600 resize-none leading-relaxed"
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400 dark:text-gray-600">
                    {textInput ? t("bulkImportDetected", { n: extractUrls(textInput).length }) : t("bulkImportAuto")}
                  </p>
                  {textImportResult && (
                    <p className={`text-xs flex items-center gap-1.5 ${
                      textImportResult.saved > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                    }`}>
                      <CheckCircle2 size={13} />
                      {t("bulkImportResult", { saved: textImportResult.saved, skipped: textImportResult.skipped })}
                    </p>
                  )}
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 dark:border-surface-700 flex justify-end gap-2">
                <button
                  onClick={() => setTextImportOpen(false)}
                  className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-gray-100 dark:bg-surface-700 hover:bg-gray-200 dark:hover:bg-surface-600 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleTextImport}
                  disabled={textImportStatus === "loading" || extractUrls(textInput).length === 0}
                  className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium bg-amber-500 hover:bg-amber-400 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {textImportStatus === "loading" ? <Loader2 size={13} className="animate-spin" /> : <ClipboardList size={13} />}
                  {textImportStatus === "loading" ? t("bulkImporting") : t("bulkImportBtn")}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <header className="flex items-center gap-3 px-6 py-3 border-b border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-900 shrink-0">
      <div className="relative flex-1 max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => onChange(e.target.value)}
        placeholder={t("searchPlaceholder")}
          className="w-full pl-9 pr-3 py-2 bg-gray-100 dark:bg-surface-800 border border-gray-200 dark:border-surface-700 rounded-lg text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      <div className="flex items-center gap-1 ml-auto">
        <button
          title={t("privacyTitle")}
          onClick={() => setPrivacyOpen(true)}
          className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
        >
          <ShieldCheck size={18} />
        </button>
        <a
          href={lang === "ko" ? "/help.ko.html" : lang === "ja" ? "/help.ja.html" : "/help.html"}
          target="_blank"
          rel="noopener noreferrer"
          title={t("helpTooltip")}
          className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
        >
          <HelpCircle size={18} />
        </a>
        <button
          title={t("bulkImportTitle")}
          onClick={() => setTextImportOpen(true)}
          className="p-2 text-gray-500 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-colors"
        >
          <ClipboardList size={15} />
        </button>
        <ThemeToggle />
        <button
          onClick={onOpenSettings}
          title={t("settingsTitle")}
          className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
        >
          <Settings size={15} />
        </button>
      </div>
    </header>
    </>
  );
}

