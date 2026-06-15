import React, { useState, useEffect, useCallback } from "react";
import { ChevronRight, ChevronDown, Plus, Download, Trash2, Check, X } from "lucide-react";
import type { ChromePattern, MessageResponse } from "@/shared/types";
import { useLang } from "@/shared/LanguageContext";
import { useDialog } from "@/shared/useDialog";

interface ChromePatternSectionProps {
  onPatternLoad: () => void;
}

export default function ChromePatternSection({ onPatternLoad }: ChromePatternSectionProps) {
  const { t } = useLang();
  const { showConfirm, DialogEl } = useDialog();

  const [patterns, setPatterns] = useState<ChromePattern[]>([]);
  const [patternSectionOpen, setPatternSectionOpen] = useState(true);
  const [showPatternInput, setShowPatternInput] = useState(false);
  const [newPatternName, setNewPatternName] = useState("");
  const [patternBusy, setPatternBusy] = useState(false);
  const [patternStatus, setPatternStatus] = useState("");

  const flashPattern = (msg: string) => {
    setPatternStatus(msg);
    setTimeout(() => setPatternStatus(""), 3000);
  };

  const loadPatterns = useCallback(async () => {
    const res = (await chrome.runtime.sendMessage({
      type: "GET_CHROME_PATTERNS",
    })) as MessageResponse;
    if (res.success) setPatterns(res.data as ChromePattern[]);
  }, []);

  useEffect(() => {
    loadPatterns();
  }, [loadPatterns]);

  async function handleSavePattern() {
    const name = newPatternName.trim();
    if (!name) return;
    setPatternBusy(true);
    const res = (await chrome.runtime.sendMessage({
      type: "SAVE_CHROME_PATTERN",
      name,
    })) as MessageResponse;
    setPatternBusy(false);
    setNewPatternName("");
    setShowPatternInput(false);
    if (res.success) {
      const d = res.data as { count: number };
      flashPattern(t("chromePatternSaveDone", { name, n: d.count }));
      await loadPatterns();
    }
  }

  async function handleLoadPattern(id: string, name: string) {
    if (!(await showConfirm(t("chromePatternLoadConfirm", { name })))) return;
    setPatternBusy(true);
    const res = (await chrome.runtime.sendMessage({
      type: "LOAD_CHROME_PATTERN",
      id,
    })) as MessageResponse;
    setPatternBusy(false);
    if (res.success) {
      const d = res.data as { added: number; total: number };
      flashPattern(t("chromePatternLoadDone", { added: d.added, total: d.total }));
      onPatternLoad();
    }
  }

  async function handleDeletePattern(id: string, name: string) {
    if (!(await showConfirm(t("chromePatternDeleteConfirm", { name }), t("chromeDeleteBtn")))) return;
    await chrome.runtime.sendMessage({ type: "DELETE_CHROME_PATTERN", id });
    await loadPatterns();
  }

  return (
    <div className="border-b border-gray-200 dark:border-surface-700">
      {DialogEl}
      <div className="flex items-center justify-between px-3 py-1.5">
        <button
          onClick={() => setPatternSectionOpen((v) => !v)}
          className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          {patternSectionOpen ? <ChevronDown size={9} /> : <ChevronRight size={9} />}
          <span className="uppercase tracking-widest font-bold">{t("chromePatternsTitle")}</span>
          <span className="text-gray-400 dark:text-gray-700">({patterns.length})</span>
        </button>
        <button
          onClick={() => setShowPatternInput((v) => !v)}
          title={t("chromePatternSaveTooltip")}
          className="flex items-center gap-0.5 text-[10px] font-medium text-white bg-indigo-600 hover:bg-indigo-500 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
        >
          <Plus size={10} />
          {t("chromePatternSaveBtn")}
        </button>
      </div>

      {patternSectionOpen && (
        <div className="pb-1.5 px-2 space-y-0.5">
          {patterns.map((p) => (
            <div key={p.id} className="flex items-center gap-1 group">
              <span className="flex-1 min-w-0 text-[11px] text-gray-600 dark:text-gray-400 truncate">
                {p.name}
                <span className="ml-1 text-[10px] text-gray-400 dark:text-gray-600">
                  ({t("itemCount", { n: p.items.length })})
                </span>
              </span>
              <button
                onClick={() => handleLoadPattern(p.id, p.name)}
                disabled={patternBusy}
                title={t("chromePatternLoadTooltip")}
                className="shrink-0 flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-surface-700 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors disabled:opacity-40 cursor-pointer"
              >
                <Download size={8} />
                {t("chromePatternLoadBtn")}
              </button>
              <button
                onClick={() => handleDeletePattern(p.id, p.name)}
                className="shrink-0 opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 dark:text-gray-600 hover:text-rose-500 dark:hover:text-rose-400 transition-colors cursor-pointer"
                title={t("chromeDeleteTooltip")}
              >
                <Trash2 size={9} />
              </button>
            </div>
          ))}
          {showPatternInput && (
            <div className="flex items-center gap-1 pt-0.5">
              <input
                autoFocus
                value={newPatternName}
                onChange={(e) => setNewPatternName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSavePattern();
                  if (e.key === "Escape") {
                    setShowPatternInput(false);
                    setNewPatternName("");
                  }
                }}
                placeholder={t("patternPlaceholder")}
                className="flex-1 min-w-0 text-[11px] bg-gray-100 dark:bg-surface-700 border border-gray-300 dark:border-surface-500 rounded px-1.5 py-0.5 text-gray-800 dark:text-gray-200 outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleSavePattern}
                disabled={patternBusy || !newPatternName.trim()}
                className="shrink-0 p-0.5 text-emerald-500 hover:text-emerald-400 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <Check size={11} />
              </button>
              <button
                onClick={() => {
                  setShowPatternInput(false);
                  setNewPatternName("");
                }}
                className="shrink-0 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
              >
                <X size={11} />
              </button>
            </div>
          )}
          {patternStatus && (
            <p className="text-[10px] text-emerald-500 dark:text-emerald-400 text-center pt-0.5">
              {patternStatus}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
