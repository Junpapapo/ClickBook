import { useState, useEffect, useCallback } from "react";
import { Layers, Plus, Trash2, Check, X } from "lucide-react";
import type { Pattern } from "@/shared/types";
import { useDialog } from "@/shared/useDialog";
import { useLang } from "@/shared/LanguageContext";
import { sendMsg } from "@/shared/utils";

interface Props { onPatternLoad: () => void }

export default function PatternBar({ onPatternLoad }: Props) {
  const { t } = useLang();
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [showInput, setShowInput] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const { showConfirm, DialogEl } = useDialog();

  const load = useCallback(async () => {
    const res = await sendMsg({ type: "GET_PATTERNS" });
    if (res.success) setPatterns(res.data as Pattern[]);
  }, []);

  useEffect(() => { load(); }, [load]);

  // AI 정리나 다른 탭에서 패턴이 저장될 때 자동 갱신
  useEffect(() => {
    function handleStorageChange(changes: { [key: string]: chrome.storage.StorageChange }) {
      if (changes["clickbook_patterns"]) {
        load();
      }
    }
    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
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
    onPatternLoad();
  }

  async function handleDelete(id: string) {
    await sendMsg({ type: "DELETE_PATTERN", id });
    await load();
  }

  return (
    <>
      {DialogEl}
      <div className="flex items-center gap-2 px-4 py-1.5 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md overflow-x-auto shrink-0">
      <div className="flex items-center gap-1 shrink-0">
        <Layers size={11} className="text-indigo-600 dark:text-indigo-400" />
        <span className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold">Pattern</span>
      </div>

      {patterns.map((p) => (
        <div key={p.id} className="flex items-center gap-0.5 shrink-0 group">
          <button
            onClick={() => handleLoad(p.id)}
            className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/60 dark:border-slate-700/60 transition-colors cursor-pointer"
          >
            {p.name}
          </button>
          <button
            onClick={() => handleDelete(p.id)}
            className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-rose-500 transition-all cursor-pointer"
          >
            <Trash2 size={9} />
          </button>
        </div>
      ))}

      {showInput ? (
        <div className="flex items-center gap-1 shrink-0">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") { setShowInput(false); setNewName(""); }
            }}
            placeholder={t("patternPlaceholder")}
            className="text-[11px] w-28 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500"
          />
          <button onClick={handleSave} disabled={saving} className="text-emerald-500 hover:text-emerald-400 transition-colors cursor-pointer">
            <Check size={12} />
          </button>
          <button onClick={() => { setShowInput(false); setNewName(""); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer">
            <X size={12} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowInput(true)}
          className="shrink-0 flex items-center gap-1 text-[10px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 px-2.5 py-1 rounded-full transition-all shadow-2xs cursor-pointer"
        >
          <Plus size={11} />Save
        </button>
      )}
    </div>
    </>
  );
}
