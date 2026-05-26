import { useState, useEffect } from "react";
import { X, Settings2, Eye, FolderTree, Sparkles, Download, Upload, Globe2, Database, Keyboard, HardDrive, AlertOctagon, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import type { AppSettings } from "@/shared/types";
import { useLang } from "@/shared/LanguageContext";
import { useDialog } from "@/shared/useDialog";
import type { Lang } from "@/shared/i18n";

interface Props {
  settings: AppSettings;
  onSave: (next: AppSettings) => void;
  onClose: () => void;
  onExportJSON: () => void;
  onExportHTML: () => void;
  onImport: () => void;
  sidebarChromeOpen: boolean;
  onToggleSidebarChrome: () => void;
  showGitHubRankingMenu: boolean;
  onToggleGitHubRankingMenu: (v: boolean) => void;
  showWikiRankingMenu: boolean;
  onToggleWikiRankingMenu: (v: boolean) => void;
  showHFRankingMenu: boolean;
  onToggleHFRankingMenu: (v: boolean) => void;
  showHNRankingMenu: boolean;
  onToggleHNRankingMenu: (v: boolean) => void;
  settingsMessage?: { text: string; type: "info" | "warn" } | null;
}

function NumInput({
  label,
  value,
  min,
  max,
  onChange,
  description,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-gray-100 dark:border-surface-700 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700 dark:text-gray-200">{label}</p>
        {description && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-surface-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-surface-600 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-bold transition-colors"
        >
          −
        </button>
        <span className="w-9 text-center text-sm font-semibold text-gray-800 dark:text-gray-100 tabular-nums">
          {value}
        </span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-surface-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-surface-600 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-bold transition-colors"
        >
          ＋
        </button>
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
  description,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-gray-100 dark:border-surface-700 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700 dark:text-gray-200">{label}</p>
        {description && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 focus:outline-none ${
          checked ? "bg-indigo-500" : "bg-gray-200 dark:bg-surface-600"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-2 mt-1">
      <span className="text-gray-400 dark:text-gray-500">{icon}</span>
      <span className="text-xs uppercase tracking-widest text-gray-400 dark:text-gray-500 font-semibold">
        {title}
      </span>
    </div>
  );
}

const LANG_OPTIONS: { value: Lang; label: string; native: string }[] = [
  { value: "en", label: "English", native: "English" },
  { value: "ja", label: "Japanese", native: "日本語" },
  { value: "ko", label: "Korean", native: "한국어" },
];

export default function SettingsModal({
  settings, onSave, onClose, onExportJSON, onExportHTML, onImport,
  sidebarChromeOpen, onToggleSidebarChrome,
  showGitHubRankingMenu, onToggleGitHubRankingMenu,
  showWikiRankingMenu, onToggleWikiRankingMenu,
  showHFRankingMenu, onToggleHFRankingMenu,
  showHNRankingMenu, onToggleHNRankingMenu,
  settingsMessage
}: Props) {
  const { t, lang, setLang } = useLang();
  const { showConfirm, showAlert, DialogEl } = useDialog();
  const [draft, setDraft] = useState<AppSettings>({ ...settings });
  const [saving, setSaving] = useState(false);
  const [storageBytes, setStorageBytes] = useState<number>(0);
  const [dangerZoneExpanded, setDangerZoneExpanded] = useState(false);

  useEffect(() => {
    chrome.storage.local.getBytesInUse(null, (bytes) => {
      setStorageBytes(bytes || 0);
    });
  }, []);

  function set<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(draft);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handleFactoryReset() {
    const ok = await showConfirm(
      t("settingsFactoryResetConfirm"),
      t("settingsFactoryResetLabel"),
      t("cancelBtn"),
      "warn"
    );
    if (!ok) return;

    await chrome.runtime.sendMessage({ type: "FACTORY_RESET" });
    await showAlert(t("settingsFactoryResetDone"), "info");
    localStorage.clear();
    window.location.reload();
  }

  const changed =
    draft.recentCount !== settings.recentCount ||
    draft.rankingCount !== settings.rankingCount ||
    draft.recommendCount !== settings.recommendCount ||
    draft.maxFolderDepth !== settings.maxFolderDepth ||
    draft.keepExistingFolders !== settings.keepExistingFolders ||
    draft.openDashboardInNewTab !== settings.openDashboardInNewTab ||
    draft.useClickBookAsNewTab !== settings.useClickBookAsNewTab;


  return (
    <>
      {DialogEl}
      {/* オーバーレイ */}
      <div
        className="fixed inset-0 z-[9000] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* モーダル本体 */}
      <div className="fixed inset-0 z-[9001] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-md bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-600 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ヘッダー */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-surface-700">
            <div className="flex items-center gap-2">
              <Settings2 size={15} className="text-indigo-500" />
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{t("settingsTitle")}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          {settingsMessage && (
            <div className={`px-5 py-2.5 flex items-center gap-2 text-[13px] font-medium animate-in slide-in-from-top-1 fade-in duration-200 border-b ${
              settingsMessage.type === "info"
                ? "bg-indigo-50/80 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300 border-indigo-100 dark:border-indigo-800/30"
                : "bg-red-50/80 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-100 dark:border-red-800/30"
            }`}>
              {settingsMessage.type === "info" ? <Sparkles size={14} className="shrink-0" /> : <AlertOctagon size={14} className="shrink-0" />}
              {settingsMessage.text}
            </div>
          )}

          {/* 設定項目 */}
          <div className="px-5 py-4 space-y-1 overflow-y-auto max-h-[70vh]">

            {/* Language */}
            <SectionHeader icon={<Globe2 size={13} />} title={t("settingsLanguage")} />
            <div className="bg-gray-50 dark:bg-surface-800 rounded-xl px-3">
              <div className="flex items-center justify-between gap-4 py-3">
                <p className="text-sm text-gray-700 dark:text-gray-200">{t("settingsLanguage")}</p>
                <div className="flex gap-1 shrink-0">
                  {LANG_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setLang(opt.value)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                        lang === opt.value
                          ? "bg-indigo-500 text-white"
                          : "bg-gray-200 dark:bg-surface-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-surface-600"
                      }`}
                    >
                      {opt.native}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* キーボードショートカット */}
            <div className="mt-4">
              <SectionHeader icon={<Keyboard size={13} />} title={t("settingsShortcuts")} />
              <div className="bg-gray-50 dark:bg-surface-800 rounded-xl px-3">
                <div className="flex items-center justify-between gap-4 py-3">
                  <p className="text-sm text-gray-700 dark:text-gray-200">{t("settingsShortcutSave")}</p>
                  <kbd className="px-2 py-1 bg-white dark:bg-surface-700 border border-gray-200 dark:border-surface-600 rounded text-xs font-mono text-gray-600 dark:text-gray-300 shadow-sm">
                    Alt + S
                  </kbd>
                </div>
              </div>
            </div>

            {/* 데이터 관리 */}
            <div className="mt-4">
            <SectionHeader icon={<Database size={13} />} title={t("settingsDataManagement")} />
            <div className="bg-gray-50 dark:bg-surface-800 rounded-xl overflow-hidden">
              <button
                onClick={onExportJSON}
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-surface-700 transition-colors border-b border-gray-100 dark:border-surface-700"
              >
                <Download size={14} className="text-gray-400 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 leading-tight">
                    {t("exportJson")}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 leading-normal">
                    {t("exportJsonDesc")}
                  </span>
                </div>
              </button>
              <button
                onClick={onExportHTML}
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-surface-700 transition-colors border-b border-gray-100 dark:border-surface-700"
              >
                <Download size={14} className="text-gray-400 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 leading-tight">
                    {t("exportHtml")}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 leading-normal">
                    {t("exportHtmlDesc") || "Export bookmarks in Netscape HTML format."}
                  </span>
                </div>
              </button>
              <button
                onClick={onImport}
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-surface-700 transition-colors"
              >
                <Upload size={14} className="text-gray-400 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 leading-tight">
                    {t("importBtn")}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 leading-normal">
                    {t("importBtnDesc")}
                  </span>
                </div>
              </button>
              
              <div className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-surface-700">
                <div className="flex items-center gap-2.5">
                  <HardDrive size={13} className="text-gray-400 shrink-0" />
                  <div className="flex flex-col">
                    <span>{t("settingsStorageUsage")}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{t("settingsStorageUsageDesc")}</span>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="font-medium text-gray-700 dark:text-gray-200">
                    {(storageBytes / 1024 / 1024).toFixed(2)} MB
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">/ 10 MB</span>
                </div>
              </div>
            </div>
            </div>

            {/* 表示設定 */}
            <div className="mt-4">
              <SectionHeader icon={<Eye size={13} />} title={t("settingsDisplay")} />
              <div className="bg-gray-50 dark:bg-surface-800 rounded-xl px-3">
                <Toggle
                  label={t("settingsChromePanelLabel")}
                  checked={sidebarChromeOpen}
                  onChange={() => onToggleSidebarChrome()}
                  description={t("settingsChromePanelDesc")}
                />
                <Toggle
                  label={t("githubRanking")}
                  checked={showGitHubRankingMenu}
                  onChange={(v) => onToggleGitHubRankingMenu(v)}
                  description={t("githubRankingMenuDesc")}
                />
                <Toggle
                  label={t("wikiRanking")}
                  checked={showWikiRankingMenu}
                  onChange={(v) => onToggleWikiRankingMenu(v)}
                  description={t("wikiRankingMenuDesc") || "Show Wikipedia Trending menu"}
                />
                <Toggle
                  label={t("hfRanking")}
                  checked={showHFRankingMenu}
                  onChange={(v) => onToggleHFRankingMenu(v)}
                  description={t("hfRankingMenuDesc") || "Show Hugging Face AI menu"}
                />
                <Toggle
                  label={t("hnRanking")}
                  checked={showHNRankingMenu}
                  onChange={(v) => onToggleHNRankingMenu(v)}
                  description={t("hnRankingMenuDesc") || "Show Hacker News menu"}
                />
                <Toggle
                  label={t("settingsOpenNewTabLabel")}
                  checked={draft.openDashboardInNewTab}
                  onChange={(v) => set("openDashboardInNewTab", v)}
                  description={t("settingsOpenNewTabDesc")}
                />
                <Toggle
                  label={t("settingsUseAsNewTabLabel")}
                  checked={draft.useClickBookAsNewTab !== false}
                  onChange={(v) => set("useClickBookAsNewTab", v)}
                  description={t("settingsUseAsNewTabDesc")}
                />
                <NumInput
                  label={t("settingsRecentCountLabel")}
                  value={draft.recentCount}
                  min={1}
                  max={20}
                  onChange={(v) => set("recentCount", v)}
                  description={t("settingsRecentCountDesc")}
                />
                <NumInput
                  label={t("settingsRankingCountLabel")}
                  value={draft.rankingCount}
                  min={1}
                  max={20}
                  onChange={(v) => set("rankingCount", v)}
                  description={t("settingsRankingCountDesc")}
                />
                <NumInput
                  label={t("settingsRecommendCountLabel")}
                  value={draft.recommendCount}
                  min={1}
                  max={20}
                  onChange={(v) => set("recommendCount", v)}
                  description={t("settingsRecommendCountDesc")}
                />
              </div>
            </div>

            {/* フォルダー設定 */}
            <div className="mt-4">
              <SectionHeader icon={<FolderTree size={13} />} title={t("settingsFolders")} />
              <div className="bg-gray-50 dark:bg-surface-800 rounded-xl px-3">
                <NumInput
                  label={t("settingsMaxDepthLabel")}
                  value={draft.maxFolderDepth}
                  min={1}
                  max={5}
                  onChange={(v) => set("maxFolderDepth", v)}
                  description={t("settingsMaxDepthDesc")}
                />
              </div>
            </div>

            {/* AI 整理設定 */}
            <div className="mt-4">
              <SectionHeader icon={<Sparkles size={13} />} title={t("settingsAI")} />
              <div className="bg-gray-50 dark:bg-surface-800 rounded-xl px-3">
                <Toggle
                  label={t("settingsKeepFoldersLabel")}
                  checked={draft.keepExistingFolders}
                  onChange={(v) => set("keepExistingFolders", v)}
                  description={t("settingsKeepFoldersDesc")}
                />
              </div>
            </div>

            {/* Danger Zone */}
            <div className="mt-8 pt-4 border-t border-red-100 dark:border-red-900/30 pb-2">
              <button
                onClick={() => setDangerZoneExpanded(!dangerZoneExpanded)}
                className="w-full flex items-center justify-between group"
              >
                <div className="flex items-center gap-2">
                  <AlertOctagon size={13} className={dangerZoneExpanded ? "text-red-500" : "text-gray-400 dark:text-gray-500"} />
                  <span className={`text-xs uppercase tracking-widest font-semibold ${dangerZoneExpanded ? "text-red-500" : "text-gray-400 dark:text-gray-500"}`}>
                    {t("settingsDangerZone")}
                  </span>
                </div>
                {dangerZoneExpanded ? (
                  <ChevronDown size={14} className="text-red-500" />
                ) : (
                  <ChevronRight size={14} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                )}
              </button>
              
              {dangerZoneExpanded && (
                <div className="mt-3 bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl px-3 py-1 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex items-center justify-between gap-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-red-600 dark:text-red-400">{t("settingsFactoryResetLabel")}</p>
                      <p className="text-[11px] text-red-500/70 dark:text-red-500/50 mt-0.5 leading-relaxed">
                        {t("settingsFactoryResetDesc")}
                      </p>
                    </div>
                    <button
                      onClick={handleFactoryReset}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-all shadow-sm hover:shadow-md active:scale-95 shrink-0"
                    >
                      <Trash2 size={13} />
                      {t("settingsFactoryResetLabel")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* フッター */}
          <div className="px-5 py-4 border-t border-gray-200 dark:border-surface-700 flex justify-between items-center gap-2">
            <a
              href="https://nexusforce.cloud/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 border border-gray-300 dark:border-surface-600 rounded-full text-[10px] tracking-widest text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-surface-700 transition-colors"
              style={{ textShadow: "-1px 0 0 rgba(0, 255, 255, 0.7), 1px 0 0 rgba(255, 100, 0, 0.7)" }}
            >
              POWERED BY NEXUSFORCE
            </a>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-gray-100 dark:bg-surface-700 hover:bg-gray-200 dark:hover:bg-surface-600 rounded-lg transition-colors"
              >
                {t("closeBtn")}
              </button>
              <button
                onClick={handleSave}
                disabled={!changed || saving}
                className="px-5 py-2 text-sm font-medium bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? t("settingsSaving") : t("saveBtn")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
