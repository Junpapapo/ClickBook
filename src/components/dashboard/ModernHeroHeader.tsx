import { useState, useEffect } from "react";
import { Search, Command, ShieldCheck, HelpCircle, Sun, Moon, Settings, RefreshCw } from "lucide-react";
import { useLang } from "@/shared/LanguageContext";
import { useTheme } from "@/shared/ThemeContext";

interface Props {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: (query: string) => void;
  onOpenSettings?: () => void;
  onOpenGuide?: () => void;
  userName?: string;
}

export default function ModernHeroHeader({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onOpenSettings,
  onOpenGuide,
  userName = "Creator",
}: Props) {
  const { lang, t } = useLang();
  const { theme, toggle: toggleTheme } = useTheme();
  const isDarkMode = theme === "dark";
  const [name, setName] = useState(userName);

  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(["clickbook_username"], (res) => {
        if (res && res.clickbook_username) {
          setName(res.clickbook_username);
        }
      });

      const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
        if (changes.clickbook_username) {
          setName(changes.clickbook_username.newValue || "Creator");
        }
      };
      chrome.storage.onChanged.addListener(listener);
      return () => chrome.storage.onChanged.removeListener(listener);
    }
  }, []);

  // 오늘 날짜 포맷
  const dateLocaleMap: Record<string, string> = {
    ko: "ko-KR",
    ja: "ja-JP",
    "zh-TW": "zh-TW",
    de: "de-DE",
    es: "es-ES",
    fr: "fr-FR",
  };
  const formattedDate = new Date().toLocaleDateString(
    dateLocaleMap[lang] || "en-US",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  // 시간대별 인사말
  const hour = new Date().getHours();
  const greeting =
    hour >= 5 && hour < 12
      ? t("heroGoodMorning")
      : hour >= 12 && hour < 18
      ? t("heroGoodAfternoon")
      : hour >= 18 && hour < 22
      ? t("heroGoodEvening")
      : t("heroGoodNight");

  const helpUrl = `https://junpapapo.github.io/ClickBook/public/${
    lang === "ko" ? "help.ko.html" :
    lang === "ja" ? "help.ja.html" :
    lang === "zh-TW" ? "help.zh-TW.html" :
    lang === "de" ? "help.de.html" :
    lang === "es" ? "help.es.html" :
    lang === "fr" ? "help.fr.html" :
    "help.html"
  }`;

  return (
    <div className="w-full flex flex-col items-center justify-center text-center pt-2 pb-6 px-2 select-none">
      {/* ── 우측 상단 유틸리티 아이콘 바 (보안 / 가이드 / 테마 / 설정) ── */}
      <div className="w-full flex items-center justify-end gap-1.5 mb-2 px-2">
        <div
          className="flex items-center gap-1 px-2 py-1 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/60 dark:border-white/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold shadow-2xs"
          title={t("heroSecuredTooltip")}
        >
          <ShieldCheck size={14} />
          <span className="text-[11px] hidden sm:inline">{t("heroSecured")}</span>
        </div>

        <button
          onClick={() => {
            if (onOpenGuide) {
              onOpenGuide();
            } else {
              window.open(helpUrl, "_blank", "noopener,noreferrer");
            }
          }}
          className="p-1.5 rounded-xl bg-white/60 dark:bg-slate-800/60 hover:bg-white/90 dark:hover:bg-slate-700/80 backdrop-blur-md border border-white/60 dark:border-white/10 text-slate-600 dark:text-slate-300 shadow-2xs transition-all cursor-pointer"
          title={t("heroHelpTooltip")}
        >
          <HelpCircle size={15} />
        </button>

        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-xl bg-white/60 dark:bg-slate-800/60 hover:bg-white/90 dark:hover:bg-slate-700/80 backdrop-blur-md border border-white/60 dark:border-white/10 text-slate-600 dark:text-slate-300 shadow-2xs transition-all cursor-pointer"
          title={isDarkMode ? t("heroSwitchLight") : t("heroSwitchDark")}
        >
          {isDarkMode ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-indigo-600" />}
        </button>

        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-xl bg-white/60 dark:bg-slate-800/60 hover:bg-white/90 dark:hover:bg-slate-700/80 backdrop-blur-md border border-white/60 dark:border-white/10 text-slate-600 dark:text-slate-300 shadow-2xs transition-all cursor-pointer"
            title={t("heroSettingsTooltip")}
          >
            <Settings size={15} />
          </button>
        )}
      </div>

      {/* ── 메인 타이틀 & 환영 메시지 ── */}
      <div className="mb-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white drop-shadow-xs">
          {greeting},{" "}
          <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            {name}
          </span>{" "}
          👋
        </h1>
        <div className="flex items-center justify-center gap-1.5 mt-1">
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
            {formattedDate}
          </p>
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent("TRIGGER_WALLPAPER_REFRESH"));
            }}
            className="p-1 rounded-full text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all cursor-pointer group"
            title={t("heroRefreshWallpaper")}
          >
            <RefreshCw size={12} className="transition-transform group-hover:rotate-180 duration-300" />
          </button>
        </div>
      </div>

      {/* ── 글래스모피즘 북마크/URL 통합 검색 바 ── */}
      <div className="w-full max-w-2xl relative group">
        <div className="relative flex items-center no-zen-toggle bg-white/75 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-white/10 hover:border-indigo-400/80 dark:hover:border-indigo-500/60 rounded-2xl p-1.5 shadow-figma-lg transition-all duration-300 focus-within:ring-2 focus-within:ring-indigo-500/40">
          <div className="pl-3 pr-2 text-slate-400 dark:text-slate-500">
            <Search size={18} />
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSearchSubmit(searchQuery);
            }}
            placeholder={t("heroSearchPlaceholder")}
            className="w-full bg-transparent py-2 px-1 text-sm md:text-base text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none font-medium"
          />

          <div className="flex items-center gap-1.5 pr-2 shrink-0">
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-[10px] font-mono border border-slate-200 dark:border-slate-700">
              <Command size={10} /> K
            </kbd>
          </div>
        </div>
      </div>
    </div>
  );
}
