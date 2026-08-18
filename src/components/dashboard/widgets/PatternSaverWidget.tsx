import { useState, useEffect, useCallback } from "react";
import { Layers, Plus, Trash2, Check, X, BookmarkPlus } from "lucide-react";
import type { Pattern } from "@/shared/types";
import { useDialog } from "@/shared/useDialog";
import { useLang } from "@/shared/LanguageContext";
import { sendMsg } from "@/shared/utils";

interface Props {
  onPatternLoad?: () => void;
}

export default function PatternSaverWidget({ onPatternLoad }: Props) {
  const { t } = useLang();
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [showInput, setShowInput] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const { showConfirm, DialogEl } = useDialog();

  const load = useCallback(async () => {
    const res = await sendMsg({ type: "GET_PATTERNS" });
    if (res && res.success) setPatterns((res.data as Pattern[]) || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // 스토리지 변경 시 자동 갱신
  useEffect(() => {
    function handleStorageChange(changes: { [key: string]: chrome.storage.StorageChange }) {
      if (changes["clickbook_patterns"]) {
        load();
      }
    }
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener(handleStorageChange);
      return () => chrome.storage.onChanged.removeListener(handleStorageChange);
    }
  }, [load]);

  async function handleSave() {
    const name = newName.trim();
    if (!name) return;
    setSaving(true);
    await sendMsg({ type: "SAVE_PATTERN", name });
    setSaving(false);
    setNewName("");
    setShowInput(false);
    await load();
  }

  async function handleLoad(id: string) {
    if (!await showConfirm(t("patternLoadConfirm"))) return;
    await sendMsg({ type: "LOAD_PATTERN", id });
    onPatternLoad?.();
  }

  async function handleDelete(id: string) {
    await sendMsg({ type: "DELETE_PATTERN", id });
    await load();
  }

  return (
    <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl p-3.5 shadow-figma-sm select-none">
      {DialogEl}
      {/* ── 헤더 ── */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <BookmarkPlus size={13} />
          </div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">
            {t("patternTitle")}
          </span>
        </div>

        {!showInput && (
          <button
            onClick={() => setShowInput(true)}
            className="flex items-center gap-1 px-2 py-0.8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold shadow-2xs transition-all cursor-pointer"
          >
            <Plus size={11} />
            <span>{t("patternSaveBtn")}</span>
          </button>
        )}
      </div>

      {/* ── 패턴 이름 입력창 ── */}
      {showInput && (
        <div className="mb-2.5 flex items-center gap-1.5 p-1.5 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 rounded-xl animate-in fade-in duration-150">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") {
                setShowInput(false);
                setNewName("");
              }
            }}
            placeholder={t("patternPlaceholder")}
            className="flex-1 text-xs bg-transparent px-1.5 py-0.5 outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 font-medium"
          />
          <button
            onClick={handleSave}
            disabled={saving || !newName.trim()}
            className="p-1 text-emerald-600 hover:text-emerald-500 disabled:opacity-40 cursor-pointer"
            title="Save"
          >
            <Check size={13} />
          </button>
          <button
            onClick={() => {
              setShowInput(false);
              setNewName("");
            }}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            title="Cancel"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* ── 패턴 목록 ── */}
      {patterns.length === 0 ? (
        <div className="py-3 text-center text-[11px] text-slate-400 dark:text-slate-500">
          {t("patternNoData")}
        </div>
      ) : (
        <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar pr-0.5">
          {patterns.map((p) => (
            <div
              key={p.id}
              className="group flex items-center justify-between p-2 rounded-xl bg-white/50 dark:bg-slate-700/40 hover:bg-white/90 dark:hover:bg-slate-700/80 border border-slate-200/40 dark:border-slate-700/50 transition-all text-xs"
            >
              <button
                onClick={() => handleLoad(p.id)}
                className="flex items-center gap-1.5 flex-1 min-w-0 text-left font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer truncate"
                title={t("patternRestoreTooltip")}
              >
                <Layers size={12} className="text-indigo-500 shrink-0" />
                <span className="truncate">{p.name}</span>
              </button>

              <button
                onClick={() => handleDelete(p.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded-md transition-all cursor-pointer"
                title={t("patternDeleteTooltip")}
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
