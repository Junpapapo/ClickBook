import { useState, useEffect } from "react";
import { X, Settings2, Eye, FolderTree, Sparkles, Download, Upload, Globe2, Database, Keyboard, HardDrive, AlertOctagon, Trash2, ChevronDown, ChevronRight, Calendar, Rocket, Sun, Crosshair, Image as ImageIcon } from "lucide-react";
import type { AppSettings, WeatherConfig } from "@/shared/types";
import { useLang } from "@/shared/LanguageContext";
import { useDialog } from "@/shared/useDialog";
import { LanguageSelector } from "@/components/LanguageSelector";
import { getCurrentCoordinates, fetchCityName } from "@/utils/weatherApi";
import {
  type WallpaperConfig,
  getStoredWallpaperConfig,
  saveStoredWallpaperConfig,
  getLocalWallpapers,
  GRADIENT_PRESETS,
} from "@/utils/wallpaperService";

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
  onOpenOnboarding?: () => void;
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
    <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-200/60 dark:border-slate-700/60 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
        {description && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-bold transition-colors cursor-pointer"
        >
          −
        </button>
        <span className="w-9 text-center text-sm font-semibold text-slate-800 dark:text-slate-100 tabular-nums">
          {value}
        </span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-bold transition-colors cursor-pointer"
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
    <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-200/60 dark:border-slate-700/60 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
        {description && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 focus:outline-none cursor-pointer ${
          checked ? "bg-indigo-600 dark:bg-indigo-500" : "bg-slate-200 dark:bg-slate-700"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-xs transition-transform duration-200 ${
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
      <span className="text-slate-400 dark:text-slate-500">{icon}</span>
      <span className="text-xs uppercase tracking-widest text-slate-400 dark:text-slate-500 font-semibold">
        {title}
      </span>
    </div>
  );
}

export default function SettingsModal({
  settings, onSave, onClose, onExportJSON, onExportHTML, onImport,
  sidebarChromeOpen, onToggleSidebarChrome,
  showGitHubRankingMenu, onToggleGitHubRankingMenu,
  showWikiRankingMenu, onToggleWikiRankingMenu,
  showHFRankingMenu, onToggleHFRankingMenu,
  showHNRankingMenu, onToggleHNRankingMenu,
  settingsMessage,
  onOpenOnboarding
}: Props) {
  const { t, lang } = useLang();
  const { showConfirm, showAlert, DialogEl } = useDialog();
  const [draft, setDraft] = useState<AppSettings>({ ...settings });
  const [initialWp] = useState<WallpaperConfig>(getStoredWallpaperConfig);
  const [wpDraft, setWpDraft] = useState<WallpaperConfig>(getStoredWallpaperConfig);
  const [saving, setSaving] = useState(false);
  const [storageBytes, setStorageBytes] = useState<number>(0);
  const [dangerZoneExpanded, setDangerZoneExpanded] = useState(false);
  const [gcRunning, setGcRunning] = useState(false);
  const [orphanedStats, setOrphanedStats] = useState<{ count: number; bytes: number } | null>(null);

  const localWallpapers = getLocalWallpapers();

  function updateWallpaper(patch: Partial<WallpaperConfig>) {
    setWpDraft((prev) => {
      const next = { ...prev, ...patch };
      saveStoredWallpaperConfig(next);
      return next;
    });
  }

  function handleCloseModal() {
    if (JSON.stringify(wpDraft) !== JSON.stringify(initialWp)) {
      saveStoredWallpaperConfig(initialWp);
    }
    onClose();
  }

  useEffect(() => {
    chrome.storage.local.getBytesInUse(null, (bytes) => {
      setStorageBytes(bytes || 0);
    });
    loadOrphanedStats();
  }, []);

  async function loadOrphanedStats() {
    try {
      const res = await chrome.runtime.sendMessage({ type: "GET_ORPHANED_STATS" });
      if (res?.success && res.data) {
        setOrphanedStats(res.data);
      }
    } catch (err) {
      console.error("Failed to load orphaned stats:", err);
    }
  }

  const [detectingLoc, setDetectingLoc] = useState(false);

  function set<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function updateWeatherConfig(patch: Partial<WeatherConfig>) {
    setDraft((prev) => ({
      ...prev,
      weatherConfig: {
        unit: prev.weatherConfig?.unit ?? "celsius",
        cacheExpiry: prev.weatherConfig?.cacheExpiry ?? 180,
        lat: prev.weatherConfig?.lat ?? 37.5665,
        lon: prev.weatherConfig?.lon ?? 126.9780,
        displayName: prev.weatherConfig?.displayName ?? "",
        ...patch,
      },
    }));
  }

  async function handleDetectLocation() {
    setDetectingLoc(true);
    try {
      const coords = await getCurrentCoordinates(lang);
      let detectedCity = coords.city || "";
      if (!detectedCity) {
        detectedCity = await fetchCityName(coords.lat, coords.lon, lang);
      }
      updateWeatherConfig({
        lat: coords.lat,
        lon: coords.lon,
        displayName: detectedCity || draft.weatherConfig?.displayName || "",
      });
      await showAlert(
        detectedCity
          ? `${t("weatherAutoDetectSuccess")} (${detectedCity})`
          : t("weatherAutoDetectSuccess"),
        "info"
      );
    } catch {
      await showAlert(t("weatherAutoDetectFailed"), "warn");
    } finally {
      setDetectingLoc(false);
    }
  }

  async function handleRunGC() {
    setGcRunning(true);
    try {
      const res = await chrome.runtime.sendMessage({ type: "RUN_GARBAGE_COLLECTOR" });
      if (res?.success) {
        chrome.storage.local.getBytesInUse(null, (bytes) => {
          setStorageBytes(bytes || 0);
        });
        setOrphanedStats({ count: 0, bytes: 0 });
        await showAlert(t("gcSuccess"), "info");
      } else {
        await showAlert(res?.error || "Cleanup failed", "warn");
      }
    } catch (err) {
      console.error("Manual GC trigger failed:", err);
      await showAlert(String(err), "warn");
    } finally {
      setGcRunning(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      localStorage.removeItem("clickbook_weather_cache_v2");
      saveStoredWallpaperConfig(wpDraft);
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
    draft.useClickBookAsNewTab !== settings.useClickBookAsNewTab ||
    draft.enableTodoNotifications !== settings.enableTodoNotifications ||
    draft.gcInterval !== settings.gcInterval ||
    draft.holidayCountry !== settings.holidayCountry ||
    JSON.stringify(draft.weatherConfig) !== JSON.stringify(settings.weatherConfig) ||
    JSON.stringify(wpDraft) !== JSON.stringify(initialWp);

  return (
    <>
      {DialogEl}
      {/* オーバーレイ */}
      <div
        className="fixed inset-0 z-[9000] bg-black/50 backdrop-blur-sm"
        onClick={handleCloseModal}
      />

      {/* モーダル本体 */}
      <div className="fixed inset-0 z-[9001] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-xl flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ヘッダー */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Settings2 size={15} className="text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{t("settingsTitle")}</span>
            </div>
            <button
              onClick={handleCloseModal}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
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
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 rounded-xl px-3">
              <div className="flex items-center justify-between gap-4 py-3">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("settingsLanguage")}</p>
                <div className="w-48 shrink-0">
                  <LanguageSelector />
                </div>
              </div>
            </div>

            {/* Onboarding Guide */}
            <div className="mt-4">
              <SectionHeader icon={<Rocket size={13} />} title={t("settingsOnboardingGuide")} />
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 rounded-xl px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("settingsOnboardingGuide")}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">
                      {t("settingsOnboardingGuideDesc")}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenOnboarding?.();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-lg border border-indigo-200/60 dark:border-indigo-800/60 transition-all shrink-0 hover:shadow-2xs active:scale-95 cursor-pointer"
                  >
                    <Sparkles size={12} className="text-indigo-500 shrink-0" />
                    <span>{t("settingsOnboardingGuideBtn")}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 공휴일 표시 국가 설정 */}
            <div className="mt-4">
              <SectionHeader icon={<Calendar size={13} />} title="Calendar" />
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 rounded-xl px-3">
                <div className="flex items-center justify-between gap-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("holidayCountryLabel")}</p>
                  </div>
                  <select
                    value={draft.holidayCountry ?? "auto"}
                    onChange={(e) => set("holidayCountry", e.target.value as any)}
                    className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500 transition-all cursor-pointer shrink-0"
                  >
                    <option value="auto">{t("holidayCountryAuto")}</option>
                    <option value="KR">{t("holidayCountryKR")}</option>
                    <option value="JP">{t("holidayCountryJP")}</option>
                    <option value="US">{t("holidayCountryUS")}</option>
                    <option value="off">{t("holidayCountryOff")}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ── 날씨 위젯 설정 (Weather Widget Settings) ── */}
            <div className="mt-4">
              <SectionHeader icon={<Sun size={13} className="text-amber-500" />} title={t("weatherWidgetSettings")} />
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 rounded-xl p-3.5 space-y-3">
                {/* Temperature Unit */}
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {t("weatherTempUnit")}
                  </span>
                  <div className="flex bg-slate-200/80 dark:bg-slate-700/80 p-0.5 rounded-lg border border-slate-300/50 dark:border-slate-600/50">
                    <button
                      type="button"
                      onClick={() => updateWeatherConfig({ unit: "celsius" })}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                        (draft.weatherConfig?.unit ?? "celsius") === "celsius"
                          ? "bg-orange-500 text-white shadow-2xs"
                          : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      °C
                    </button>
                    <button
                      type="button"
                      onClick={() => updateWeatherConfig({ unit: "fahrenheit" })}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                        draft.weatherConfig?.unit === "fahrenheit"
                          ? "bg-orange-500 text-white shadow-2xs"
                          : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      °F
                    </button>
                  </div>
                </div>

                {/* Weather Cache Expiry */}
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {t("weatherCacheExpiry")}
                  </span>
                  <select
                    value={draft.weatherConfig?.cacheExpiry ?? 180}
                    onChange={(e) => updateWeatherConfig({ cacheExpiry: Number(e.target.value) })}
                    className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 outline-none focus:border-orange-500 transition-all cursor-pointer shrink-0"
                  >
                    <option value={30}>30m</option>
                    <option value={60}>1h</option>
                    <option value={180}>3h</option>
                    <option value={360}>6h</option>
                    <option value={720}>12h</option>
                    <option value={1440}>24h</option>
                  </select>
                </div>

                {/* Location Coordinates & GPS */}
                <div className="space-y-1.5 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">📍</span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {t("weatherLocationCoords")}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      disabled={detectingLoc}
                      className="p-1.5 bg-white dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-950/30 border border-slate-200 dark:border-slate-700 rounded-lg text-orange-500 hover:text-orange-600 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
                      title={t("weatherAutoDetectGps")}
                    >
                      <Crosshair size={14} className={detectingLoc ? "animate-spin" : ""} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      step="0.0001"
                      placeholder={t("weatherLatPlaceholder")}
                      value={draft.weatherConfig?.lat ?? 37.5665}
                      onChange={(e) => updateWeatherConfig({ lat: parseFloat(e.target.value) || 0 })}
                      className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 outline-none focus:border-orange-500"
                    />
                    <input
                      type="number"
                      step="0.0001"
                      placeholder={t("weatherLonPlaceholder")}
                      value={draft.weatherConfig?.lon ?? 126.9780}
                      onChange={(e) => updateWeatherConfig({ lon: parseFloat(e.target.value) || 0 })}
                      className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 outline-none focus:border-orange-500"
                    />
                  </div>

                  <input
                    type="text"
                    placeholder={t("weatherDisplayNamePlaceholder")}
                    value={draft.weatherConfig?.displayName ?? ""}
                    onChange={(e) => updateWeatherConfig({ displayName: e.target.value })}
                    className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 outline-none focus:border-orange-500 placeholder-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* キーボードショートカット */}
            <div className="mt-4">
              <SectionHeader icon={<Keyboard size={13} />} title={t("settingsShortcuts")} />
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 rounded-xl px-3">
                <div className="flex items-center justify-between gap-4 py-3">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("settingsShortcutSave")}</p>
                  <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono text-slate-600 dark:text-slate-300 shadow-2xs">
                    Alt + S
                  </kbd>
                </div>
              </div>
            </div>

            {/* 데이터 관리 */}
            <div className="mt-4">
            <SectionHeader icon={<Database size={13} />} title={t("settingsDataManagement")} />
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 rounded-xl overflow-hidden">
              <button
                onClick={onExportJSON}
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors border-b border-slate-200/60 dark:border-slate-700/50 cursor-pointer"
              >
                <Download size={14} className="text-slate-400 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-tight">
                    {t("exportJson")}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 leading-normal">
                    {t("exportJsonDesc")}
                  </span>
                </div>
              </button>
              <button
                onClick={onExportHTML}
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors border-b border-slate-200/60 dark:border-slate-700/50 cursor-pointer"
              >
                <Download size={14} className="text-slate-400 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-tight">
                    {t("exportHtml")}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 leading-normal">
                    {t("exportHtmlDesc") || "Export bookmarks in Netscape HTML format."}
                  </span>
                </div>
              </button>
              <button
                onClick={onImport}
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
              >
                <Upload size={14} className="text-slate-400 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-tight">
                    {t("importBtn")}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 leading-normal">
                    {t("importBtnDesc")}
                  </span>
                </div>
              </button>
              
              <div className="w-full flex items-center justify-between px-4 py-3 text-sm text-slate-600 dark:text-slate-300 border-t border-slate-200/60 dark:border-slate-700/50">
                <div className="flex items-center gap-2.5">
                  <HardDrive size={13} className="text-slate-400 shrink-0" />
                  <div className="flex flex-col">
                    <span>{t("settingsStorageUsage")}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{t("settingsStorageUsageDesc")}</span>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {(storageBytes / 1024 / 1024).toFixed(2)} MB
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">/ 10 MB</span>
                </div>
              </div>

              {/* 자동 위생 청소 알람 주기 설정 */}
              <div className="w-full flex items-center justify-between px-4 py-3 text-sm text-slate-600 dark:text-slate-300 border-t border-slate-200/60 dark:border-slate-700/50">
                <div className="flex flex-col flex-1 min-w-0 pr-2">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-tight">
                    {t("settingsGCIntervalLabel")}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 leading-normal">
                    {t("settingsGCIntervalDesc")}
                  </span>
                </div>
                <select
                  value={draft.gcInterval ?? "daily"}
                  onChange={(e) => set("gcInterval", e.target.value as "daily" | "weekly" | "off")}
                  className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500 transition-all cursor-pointer shrink-0"
                >
                  <option value="daily">{t("settingsGCIntervalDaily")}</option>
                  <option value="weekly">{t("settingsGCIntervalWeekly")}</option>
                  <option value="off">{t("settingsGCIntervalOff")}</option>
                </select>
              </div>

              {/* 저장 공간 즉시 위생 소거 (수동 GC 트리거) */}
              <div className="w-full flex flex-col px-4 py-3 border-t border-slate-200/60 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/40">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-tight">
                        {t("runGC")}
                      </span>
                      {orphanedStats !== null && orphanedStats.count > 0 && (
                        <span className="inline-flex items-center text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded animate-pulse whitespace-nowrap">
                          ⚠️ {t("orphanedFound", { count: orphanedStats.count, size: (orphanedStats.bytes / 1024).toFixed(1) })}
                        </span>
                      )}
                      {orphanedStats !== null && orphanedStats.count === 0 && (
                        <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded whitespace-nowrap">
                          ✨ {t("orphanedNone")}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 leading-normal block">
                      {t("runGCDesc")}
                    </span>
                  </div>
                  <button
                    onClick={handleRunGC}
                    disabled={gcRunning}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold rounded-lg transition-all shrink-0 cursor-pointer"
                  >
                    <Trash2 size={12} className={gcRunning ? "animate-spin" : ""} />
                    {gcRunning ? t("gcRunning") : t("runGC")}
                  </button>
                </div>
              </div>
            </div>
            </div>

            {/* ── 대시보드 배경화면 설정 ── */}
            <div className="mt-4">
              <SectionHeader icon={<ImageIcon size={13} />} title={t("settingsWallpaper")} />
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 rounded-xl p-3.5 space-y-3.5">
                {/* 배경화면 소스 선택 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {t("settingsWallpaperSource")}
                    </span>
                    <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                      {wpDraft.source === "auto" && `🔄 ${t("settingsWallpaperSourceAuto")}`}
                      {wpDraft.source === "online" && `🌐 ${t("settingsWallpaperSourceOnline")}`}
                      {wpDraft.source === "local" && `📁 ${t("settingsWallpaperSourceLocal")}`}
                      {wpDraft.source === "gradient" && `🎨 ${t("settingsWallpaperSourceGradient")}`}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {/* Auto */}
                    <button
                      type="button"
                      onClick={() => updateWallpaper({ source: "auto" })}
                      className={`flex flex-col items-center text-center p-2 rounded-lg border transition-all cursor-pointer ${
                        wpDraft.source === "auto"
                          ? "bg-indigo-50/90 dark:bg-indigo-950/50 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-2xs font-semibold"
                          : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
                      }`}
                    >
                      <span className="text-sm mb-0.5">🔄</span>
                      <span className="text-xs font-bold leading-tight">Auto</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-tight">
                        {t("settingsWallpaperSourceAuto")}
                      </span>
                    </button>

                    {/* Online */}
                    <button
                      type="button"
                      onClick={() => updateWallpaper({ source: "online" })}
                      className={`flex flex-col items-center text-center p-2 rounded-lg border transition-all cursor-pointer ${
                        wpDraft.source === "online"
                          ? "bg-indigo-50/90 dark:bg-indigo-950/50 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-2xs font-semibold"
                          : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
                      }`}
                    >
                      <span className="text-sm mb-0.5">🌐</span>
                      <span className="text-xs font-bold leading-tight">Online</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-tight">
                        {t("settingsWallpaperSourceOnline")}
                      </span>
                    </button>

                    {/* Local */}
                    <button
                      type="button"
                      onClick={() => updateWallpaper({ source: "local" })}
                      className={`flex flex-col items-center text-center p-2 rounded-lg border transition-all cursor-pointer ${
                        wpDraft.source === "local"
                          ? "bg-indigo-50/90 dark:bg-indigo-950/50 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-2xs font-semibold"
                          : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
                      }`}
                    >
                      <span className="text-sm mb-0.5">📁</span>
                      <span className="text-xs font-bold leading-tight">Offline</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-tight">
                        {t("settingsWallpaperSourceLocal")}
                      </span>
                    </button>

                    {/* Gradient */}
                    <button
                      type="button"
                      onClick={() => updateWallpaper({ source: "gradient" })}
                      className={`flex flex-col items-center text-center p-2 rounded-lg border transition-all cursor-pointer ${
                        wpDraft.source === "gradient"
                          ? "bg-indigo-50/90 dark:bg-indigo-950/50 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-2xs font-semibold"
                          : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
                      }`}
                    >
                      <span className="text-sm mb-0.5">🎨</span>
                      <span className="text-xs font-bold leading-tight">Gradient</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-tight">
                        {t("settingsWallpaperSourceGradient")}
                      </span>
                    </button>
                  </div>

                  {/* Mode Description Tip */}
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 bg-white/70 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-200/60 dark:border-slate-700/50 leading-relaxed">
                    {wpDraft.source === "auto" && t("settingsWallpaperSourceAutoDesc")}
                    {wpDraft.source === "online" && t("settingsWallpaperSourceOnlineDesc")}
                    {wpDraft.source === "local" && t("settingsWallpaperSourceLocalDesc")}
                    {wpDraft.source === "gradient" && t("settingsWallpaperSourceGradientDesc")}
                  </p>
                </div>

                {/* Sub-Selection for Local Mode */}
                {wpDraft.source === "local" && (
                  <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {t("settingsWallpaperLocalPresets")}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-1">
                      {/* Random Auto Cycle Button */}
                      <button
                        type="button"
                        onClick={() => updateWallpaper({ localId: undefined })}
                        className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between col-span-2 ${
                          !wpDraft.localId
                            ? "bg-indigo-50/90 dark:bg-indigo-950/50 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-semibold shadow-2xs"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">🎲</span>
                          <span className="text-xs font-bold">{t("settingsWallpaperRandomCycle")}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-normal">10 Presets</span>
                      </button>

                      {/* Local Wallpaper Presets */}
                      {localWallpapers.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => updateWallpaper({ localId: item.id })}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-2 ${
                            wpDraft.localId === item.id
                              ? "bg-indigo-50/90 dark:bg-indigo-950/50 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-semibold shadow-2xs"
                              : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
                          }`}
                        >
                          {item.path ? (
                            <img
                              src={item.path}
                              alt={item.nameEn}
                              className="w-7 h-7 rounded object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded shrink-0" style={{ background: item.css }} />
                          )}
                          <span className="text-[11px] truncate leading-tight flex-1 text-left">
                            {lang === "ko" ? item.nameKo : item.nameEn}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sub-Selection for Gradient Mode */}
                {wpDraft.source === "gradient" && (
                  <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {t("settingsWallpaperSourceGradient")}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-1.5">
                      {GRADIENT_PRESETS.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => updateWallpaper({ localId: item.id })}
                          className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center gap-2.5 ${
                            wpDraft.localId === item.id
                              ? "bg-indigo-50/90 dark:bg-indigo-950/50 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-semibold shadow-2xs"
                              : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
                          }`}
                        >
                          <div className="w-6 h-6 rounded-md shrink-0 shadow-2xs border border-white/20" style={{ background: item.css }} />
                          <span className="text-xs truncate leading-tight flex-1 text-left">
                            {lang === "ko" ? item.nameKo : item.nameEn}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Blur & Overlay Sliders */}
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-3">
                  {/* Background Blur */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{t("settingsWallpaperBlur")}</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{t("settingsWallpaperBlurDesc")}</p>
                    </div>
                    <div className="flex bg-slate-200/80 dark:bg-slate-700/80 p-0.5 rounded-lg border border-slate-300/50 dark:border-slate-600/50 shrink-0">
                      {[0, 4, 8, 12, 16].map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => updateWallpaper({ blur: b })}
                          className={`px-2 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                            wpDraft.blur === b
                              ? "bg-indigo-600 text-white shadow-2xs"
                              : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          {b === 0 ? "Off" : `${b}px`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Overlay Darkness / Opacity */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between pr-2">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{t("settingsWallpaperOpacity")}</p>
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                          {Math.round((wpDraft.overlayOpacity ?? 0.35) * 100)}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{t("settingsWallpaperOpacityDesc")}</p>
                    </div>
                    <div className="w-36 shrink-0 flex items-center gap-2">
                      <input
                        type="range"
                        min="0.1"
                        max="0.8"
                        step="0.05"
                        value={wpDraft.overlayOpacity ?? 0.35}
                        onChange={(e) => updateWallpaper({ overlayOpacity: parseFloat(e.target.value) })}
                        className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 表示設定 */}
            <div className="mt-4">
              <SectionHeader icon={<Eye size={13} />} title={t("settingsDisplay")} />
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 rounded-xl px-3">
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
                  checked={draft.useClickBookAsNewTab === true}
                  onChange={(v) => set("useClickBookAsNewTab", v)}
                  description={t("settingsUseAsNewTabDesc")}
                />
                <Toggle
                  label={t("settingsTodoNotificationsLabel")}
                  checked={!!draft.enableTodoNotifications}
                  onChange={(v) => set("enableTodoNotifications", v)}
                  description={t("settingsTodoNotificationsDesc")}
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

              </div>
            </div>

            {/* フォルダー設定 */}
            <div className="mt-4">
              <SectionHeader icon={<FolderTree size={13} />} title={t("settingsFolders")} />
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 rounded-xl px-3">
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
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 rounded-xl px-3">
                <Toggle
                  label={t("settingsKeepFoldersLabel")}
                  checked={draft.keepExistingFolders}
                  onChange={(v) => set("keepExistingFolders", v)}
                  description={t("settingsKeepFoldersDesc")}
                />
              </div>
            </div>

            {/* Danger Zone */}
            <div className="mt-8 pt-4 border-t border-rose-200/60 dark:border-rose-900/40 pb-2">
              <button
                onClick={() => setDangerZoneExpanded(!dangerZoneExpanded)}
                className="w-full flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <AlertOctagon size={13} className={dangerZoneExpanded ? "text-rose-500" : "text-slate-400 dark:text-slate-500"} />
                  <span className={`text-xs uppercase tracking-widest font-semibold ${dangerZoneExpanded ? "text-rose-500" : "text-slate-400 dark:text-slate-500"}`}>
                    {t("settingsDangerZone")}
                  </span>
                </div>
                {dangerZoneExpanded ? (
                  <ChevronDown size={14} className="text-rose-500" />
                ) : (
                  <ChevronRight size={14} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                )}
              </button>
              
              {dangerZoneExpanded && (
                <div className="mt-3 bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 rounded-xl px-3 py-1 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex items-center justify-between gap-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">{t("settingsFactoryResetLabel")}</p>
                      <p className="text-[11px] text-rose-500/80 dark:text-rose-500/60 mt-0.5 leading-relaxed">
                        {t("settingsFactoryResetDesc")}
                      </p>
                    </div>
                    <button
                      onClick={handleFactoryReset}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-all shadow-xs active:scale-95 shrink-0 cursor-pointer"
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
          <div className="px-5 py-4 border-t border-slate-200/80 dark:border-slate-800 flex justify-end items-center gap-2 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex gap-2">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200/80 dark:border-slate-700/80 cursor-pointer"
              >
                {t("closeBtn")}
              </button>
              <button
                onClick={handleSave}
                disabled={!changed || saving}
                className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg transition-all shadow-figma-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
