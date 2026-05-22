import { useState, useEffect } from "react";
import { X, Search, Plus, Trash2, Edit2, Star, GripVertical } from "lucide-react";
import type { CustomSearchConfig } from "@/shared/types";
import type { Lang } from "@/shared/i18n";
import { useLang } from "@/shared/LanguageContext";
import { useDialog } from "@/shared/useDialog";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  configs: CustomSearchConfig[];
  customPresets: CustomSearchConfig[];
  onSave: (configs: CustomSearchConfig[], presets: CustomSearchConfig[]) => void;
}

const PRESETS: Record<string, { name: string; urlTemplate: string }[]> = {
  common: [
    { name: "Google", urlTemplate: "https://www.google.com/search?q={keyword}" },
    { name: "YouTube", urlTemplate: "https://www.youtube.com/results?search_query={keyword}" },
    { name: "GitHub", urlTemplate: "https://github.com/search?q={keyword}" },
    { name: "MDN", urlTemplate: "https://developer.mozilla.org/en-US/search?q={keyword}" },
  ],
  ko: [
    { name: "Naver", urlTemplate: "https://search.naver.com/search.naver?query={keyword}" },
    { name: "Daum", urlTemplate: "https://search.daum.net/search?q={keyword}" },
    { name: "Coupang", urlTemplate: "https://www.coupang.com/np/search?q={keyword}" },
  ],
  ja: [
    { name: "Yahoo Japan", urlTemplate: "https://search.yahoo.co.jp/search?p={keyword}" },
    { name: "Amazon JP", urlTemplate: "https://www.amazon.co.jp/s?k={keyword}" },
    { name: "Qiita", urlTemplate: "https://qiita.com/search?q={keyword}" },
  ],
  en: [
    { name: "Amazon", urlTemplate: "https://www.amazon.com/s?k={keyword}" },
    { name: "StackOverflow", urlTemplate: "https://stackoverflow.com/search?q={keyword}" },
  ],
};

type PresetTab = "common" | Lang | "custom";

export default function CustomSearchSettingsModal({ isOpen, onClose, configs, customPresets, onSave }: Props) {
  const { t } = useLang();
  const { showConfirm, showAlert, DialogEl } = useDialog();
  const [drafts, setDrafts] = useState<CustomSearchConfig[]>(configs);
  const [draftCustomPresets, setDraftCustomPresets] = useState<CustomSearchConfig[]>(customPresets || []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [presetTab, setPresetTab] = useState<PresetTab>("common");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDrafts(configs);
      setDraftCustomPresets(customPresets || []);
      setEditingId(null);
      setPresetTab("common");
    }
  }, [isOpen, configs, customPresets]);

  if (!isOpen) return null;

  function handleAdd() {
    setEditingId("new");
    setEditName("");
    setEditUrl("");
  }

  function handleEdit(config: CustomSearchConfig) {
    setEditingId(config.id);
    setEditName(config.name);
    setEditUrl(config.urlTemplate);
  }

  async function handleDelete(id: string) {
    const ok = await showConfirm(t("customSearchDeleteConfirm"), t("customSearchSettings"), t("cancelBtn"), "warn");
    if (!ok) return;
    setDrafts((prev) => prev.filter((c) => c.id !== id));
  }

  async function handleSaveEdit() {
    if (!editName.trim() || !editUrl.trim()) return;
    
    if (!editUrl.startsWith("http://") && !editUrl.startsWith("https://")) {
      await showAlert("URL must start with http:// or https://", "warn");
      return;
    }
    
    if (editingId === "new") {
      const newConfig = { id: crypto.randomUUID(), name: editName, urlTemplate: editUrl };
      setDrafts((prev) => [...prev, newConfig]);
      setDraftCustomPresets((prev) => [...prev, { ...newConfig, id: crypto.randomUUID() }]);
    } else {
      setDrafts((prev) => prev.map((c) => c.id === editingId ? { ...c, name: editName, urlTemplate: editUrl } : c));
    }
    setEditingId(null);
  }

  function handleAddPreset(preset: { name: string; urlTemplate: string }) {
    setDrafts((prev) => [...prev, { id: crypto.randomUUID(), name: preset.name, urlTemplate: preset.urlTemplate }]);
  }

  async function handleSaveAsPreset(config: CustomSearchConfig) {
    const exists = draftCustomPresets.some(p => p.urlTemplate === config.urlTemplate && p.name === config.name);
    if (!exists) {
      setDraftCustomPresets((prev) => [...prev, { id: crypto.randomUUID(), name: config.name, urlTemplate: config.urlTemplate }]);
      await showAlert(t("presetSavedAlert") || "Saved to My Presets", "info");
    } else {
      await showAlert(t("presetAlreadyExistsAlert") || "Already exists in My Presets", "warn");
    }
  }

  function handleDeleteCustomPreset(id: string) {
    setDraftCustomPresets((prev) => prev.filter((p) => p.id !== id));
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    setDrafts((prev) => {
      const newDrafts = [...prev];
      const draggedItem = newDrafts[draggedIndex];
      newDrafts.splice(draggedIndex, 1);
      newDrafts.splice(index, 0, draggedItem);
      return newDrafts;
    });
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  function saveAndClose() {
    onSave(drafts, draftCustomPresets);
    onClose();
  }

  return (
    <>
      {DialogEl}
      <div className="fixed inset-0 z-[9000] bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[9001] flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-lg bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-600 rounded-2xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-surface-700">
            <div className="flex items-center gap-2">
              <Search size={16} className="text-indigo-500" />
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{t("customSearchSettings")}</span>
            </div>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg transition-colors">
              <X size={15} />
            </button>
          </div>

          <div className="p-5 overflow-y-auto max-h-[60vh]">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Presets</h3>
                <div className="flex bg-gray-100 dark:bg-surface-800 rounded-lg p-0.5">
                  {(["common", "en", "ko", "ja", "custom"] as PresetTab[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setPresetTab(tab)}
                      className={`text-[10px] px-2 py-1 rounded-md transition-colors font-medium ${
                        presetTab === tab
                          ? "bg-white dark:bg-surface-600 text-gray-800 dark:text-gray-100 shadow-sm"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                      }`}
                    >
                      {tab === "common" ? "Common" : tab === "en" ? "EN" : tab === "ko" ? "KO" : tab === "ja" ? "JA" : "My"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {presetTab === "custom" ? (
                  draftCustomPresets.length === 0 ? (
                    <span className="text-xs text-gray-400 py-1">등록된 커스텀 프리셋이 없습니다.</span>
                  ) : (
                    draftCustomPresets.map((p) => (
                      <div key={p.id} className="flex items-center gap-1 bg-gray-100 dark:bg-surface-800 text-gray-700 dark:text-gray-200 rounded-lg border border-gray-200 dark:border-surface-600 overflow-hidden">
                        <button onClick={() => handleAddPreset(p)} className="text-xs px-2 py-1.5 hover:bg-gray-200 dark:hover:bg-surface-700 flex items-center gap-1.5 transition-colors">
                          <Plus size={12} /> {p.name}
                        </button>
                        <button onClick={() => handleDeleteCustomPreset(p.id)} className="px-1.5 py-1.5 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                          <X size={12} />
                        </button>
                      </div>
                    ))
                  )
                ) : (
                  (PRESETS[presetTab] || []).map((p) => (
                    <button key={p.name} onClick={() => handleAddPreset(p)} className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-surface-800 hover:bg-gray-200 dark:hover:bg-surface-700 text-gray-700 dark:text-gray-200 rounded-lg transition-colors border border-gray-200 dark:border-surface-600 flex items-center gap-1.5">
                      <Plus size={12} /> {p.name}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Registered Searches</h3>
              {drafts.length === 0 ? (
                <div className="text-sm text-gray-400 text-center py-4">추가된 검색이 없습니다.</div>
              ) : (
                drafts.map((c, index) => (
                  <div 
                    key={c.id} 
                    draggable={editingId === null}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center justify-between p-3 bg-gray-50 dark:bg-surface-800 rounded-xl border border-gray-100 dark:border-surface-700 transition-colors ${
                      draggedIndex === index ? "opacity-50 bg-indigo-50/50 dark:bg-indigo-900/20" : ""
                    } ${editingId === null ? "cursor-grab active:cursor-grabbing" : ""}`}
                  >
                    {editingId === c.id ? (
                      <div className="flex-1 space-y-2">
                        <input type="text" value={editName} onChange={e => setEditName(e.target.value)} placeholder={t("customSearchName")} className="w-full bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-600 rounded text-sm px-2 py-1" />
                        <input type="text" value={editUrl} onChange={e => setEditUrl(e.target.value)} placeholder={t("customSearchUrlPlaceholder")} className="w-full bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-600 rounded text-sm px-2 py-1" />
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => setEditingId(null)} className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">{t("cancelBtn")}</button>
                          <button onClick={handleSaveEdit} className="text-xs px-2 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600">{t("saveBtn")}</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                          <div className="text-gray-300 dark:text-gray-600 shrink-0">
                            <GripVertical size={15} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{c.name}</div>
                            <div className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{c.urlTemplate}</div>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => handleSaveAsPreset(c)} className="p-1.5 text-gray-400 hover:text-amber-500 transition-colors" title="프리셋에 저장"><Star size={14} /></button>
                          <button onClick={() => handleEdit(c)} className="p-1.5 text-gray-400 hover:text-indigo-500 transition-colors"><Edit2 size={14} /></button>
                          <button onClick={() => handleDelete(c.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>

            {editingId !== "new" && (
              <button onClick={handleAdd} className="mt-4 w-full py-2.5 border-2 border-dashed border-gray-200 dark:border-surface-700 hover:border-indigo-400 dark:hover:border-indigo-500 text-gray-500 hover:text-indigo-500 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-colors">
                <Plus size={16} /> {t("customSearchAdd")}
              </button>
            )}
            
            {editingId === "new" && (
              <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-800/30 space-y-2">
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} placeholder={t("customSearchName")} className="w-full bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-600 rounded text-sm px-2 py-1" />
                <input type="text" value={editUrl} onChange={e => setEditUrl(e.target.value)} placeholder={t("customSearchUrlPlaceholder")} className="w-full bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-600 rounded text-sm px-2 py-1" />
                <div className="flex gap-2 justify-end mt-2">
                  <button onClick={() => setEditingId(null)} className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">{t("cancelBtn")}</button>
                  <button onClick={handleSaveEdit} className="text-xs px-2 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600">{t("saveBtn")}</button>
                </div>
              </div>
            )}

          </div>

          <div className="px-5 py-4 border-t border-gray-200 dark:border-surface-700 flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-gray-100 dark:bg-surface-700 hover:bg-gray-200 dark:hover:bg-surface-600 rounded-lg transition-colors">{t("cancelBtn")}</button>
            <button onClick={saveAndClose} className="px-5 py-2 text-sm font-medium bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg transition-colors">{t("saveBtn")}</button>
          </div>
        </div>
      </div>
    </>
  );
}
