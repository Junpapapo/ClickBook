import { useState, useEffect } from "react";
import { 
  Sparkles, 
  Bookmark, 
  CheckSquare, 
  Bot, 
  TrendingUp, 
  Sun, 
  Moon, 
  ArrowRight, 
  X, 
  Command
} from "lucide-react";
import { useLang } from "@/shared/LanguageContext";
import { SUPPORTED_LANGUAGES } from "@/shared/i18n";

interface Props {
  onClose: () => void;
  onNavigate?: (page: string) => void;
}

export default function WelcomeModal({ onClose, onNavigate }: Props) {
  const { t, lang, setLang } = useLang();
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  const toggleTheme = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
      chrome.storage.local.set({ clickbook_theme: "dark" });
    } else {
      document.documentElement.classList.remove("dark");
      chrome.storage.local.set({ clickbook_theme: "light" });
    }
  };

  const featureCards = [
    {
      id: "bookmark",
      icon: <Bookmark className="w-5 h-5 text-indigo-500 shrink-0" />,
      title: t("onboardingCard1Title"),
      desc: t("onboardingCard1Desc"),
      actionLabel: t("onboardingCard1Action"),
      targetPage: "dashboard",
      badgeColor: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-800/50",
    },
    {
      id: "productivity",
      icon: <CheckSquare className="w-5 h-5 text-emerald-500 shrink-0" />,
      title: t("onboardingCard2Title"),
      desc: t("onboardingCard2Desc"),
      actionLabel: t("onboardingCard2Action"),
      targetPage: "todo",
      badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/50",
    },
    {
      id: "buddy",
      icon: <Bot className="w-5 h-5 text-cyan-500 shrink-0" />,
      title: t("onboardingCard3Title"),
      desc: t("onboardingCard3Desc"),
      actionLabel: t("onboardingCard3Action"),
      targetPage: "dashboard",
      badgeColor: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200/50 dark:border-cyan-800/50",
    },
    {
      id: "trends",
      icon: <TrendingUp className="w-5 h-5 text-amber-500 shrink-0" />,
      title: t("onboardingCard4Title"),
      desc: t("onboardingCard4Desc"),
      actionLabel: t("onboardingCard4Action"),
      targetPage: "github",
      badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/50",
    },
  ];

  return (
    <>
      <div 
        className="fixed inset-0 z-[9998] bg-black/60 dark:bg-black/75 backdrop-blur-xs transition-opacity duration-200" 
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div 
          className="w-full max-w-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-figma-lg flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 font-sans text-slate-800 dark:text-slate-100 my-auto select-none"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2.5">
              <img src="/icons/icon128.png" alt="ClickBook" className="w-6 h-6 rounded-lg shadow-figma-sm" />
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-slate-800 dark:text-slate-100">ClickBook</span>
                <span className="flex items-center gap-0.5 bg-indigo-600 text-white px-2 py-0.5 rounded-full text-[10px] font-extrabold select-none leading-none shadow-figma-sm">
                  <Sparkles size={9} className="text-amber-300 fill-amber-300 shrink-0" />
                  AI Hub
                </span>
              </div>
            </div>

            {/* Quick Setup (Language & Theme) */}
            <div className="flex items-center gap-2">
              {/* Language Selector */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 text-xs">
                {SUPPORTED_LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setLang(l.code)}
                    className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                      lang === l.code 
                        ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs" 
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    {l.shortLabel}
                  </button>
                ))}
              </div>

              {/* Theme Toggle */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
                <button
                  onClick={() => toggleTheme("light")}
                  className={`p-1 rounded-md transition-all ${
                    theme === "light" 
                      ? "bg-white text-amber-500 shadow-2xs" 
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                  title="Light Mode"
                >
                  <Sun size={14} />
                </button>
                <button
                  onClick={() => toggleTheme("dark")}
                  className={`p-1 rounded-md transition-all ${
                    theme === "dark" 
                      ? "bg-slate-700 text-indigo-400 shadow-2xs" 
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                  title="Dark Mode"
                >
                  <Moon size={14} />
                </button>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Hero Banner */}
          <div className="px-6 pt-5 pb-3 text-center sm:text-left">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t("onboardingTitle")}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {t("onboardingWelcomeSubtitle")}
            </p>
          </div>

          {/* 4 Feature Cards Grid */}
          <div className="px-6 py-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {featureCards.map((card) => (
              <div
                key={card.id}
                className="group relative p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white/70 dark:bg-slate-850/60 hover:border-indigo-400/60 dark:hover:border-indigo-500/60 hover:shadow-figma-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                      {card.icon}
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${card.badgeColor}`}>
                      {card.actionLabel}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {card.desc}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end">
                  <button
                    onClick={() => {
                      if (onNavigate) {
                        onNavigate(card.targetPage);
                      } else {
                        onClose();
                      }
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                  >
                    <span>{card.actionLabel}</span>
                    <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 mt-2 bg-slate-50/70 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Command size={13} className="text-slate-400 shrink-0" />
              <span>{t("onboardingShortcutTip")}</span>
            </div>

            <button
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold rounded-xl shadow-figma-sm hover:shadow-figma-md transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>{t("onboardingGetStarted")}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
