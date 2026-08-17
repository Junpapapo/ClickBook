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
  ChevronLeft,
  ChevronRight,
  X, 
  Command,
  BookOpen,
  GitFork,
  MousePointerClick,
  Layers
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
  const [tab, setTab] = useState<"overview" | "tour">("overview");
  const [tourStep, setTourStep] = useState(0);

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

  const tourSteps = [
    {
      step: 1,
      icon: <MousePointerClick className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />,
      accentBg: "bg-indigo-50 dark:bg-indigo-950/50 border-indigo-100 dark:border-indigo-900/50",
      badgeBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/60",
      title: t("onboardingStep1Title"),
      desc: t("onboardingStep1Desc"),
      actionLabel: t("onboardingStep1Action"),
      targetPage: "dashboard",
    },
    {
      step: 2,
      icon: <BookOpen className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />,
      accentBg: "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-100 dark:border-emerald-900/50",
      badgeBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60",
      title: t("onboardingStep2Title"),
      desc: t("onboardingStep2Desc"),
      actionLabel: t("onboardingStep2Action"),
      targetPage: "springnote",
    },
    {
      step: 3,
      icon: <GitFork className="w-8 h-8 text-purple-500 dark:text-purple-400" />,
      accentBg: "bg-purple-50 dark:bg-purple-950/50 border-purple-100 dark:border-purple-900/50",
      badgeBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/60",
      title: t("onboardingStep3Title"),
      desc: t("onboardingStep3Desc"),
      actionLabel: t("onboardingStep3Action"),
      targetPage: "mindmap",
    },
    {
      step: 4,
      icon: <Bot className="w-8 h-8 text-cyan-500 dark:text-cyan-400" />,
      accentBg: "bg-cyan-50 dark:bg-cyan-950/50 border-cyan-100 dark:border-cyan-900/50",
      badgeBg: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800/60",
      title: t("onboardingStep4Title"),
      desc: t("onboardingStep4Desc"),
      actionLabel: t("onboardingStep4Action"),
      targetPage: "dashboard",
    },
    {
      step: 5,
      icon: <TrendingUp className="w-8 h-8 text-amber-500 dark:text-amber-400" />,
      accentBg: "bg-amber-50 dark:bg-amber-950/50 border-amber-100 dark:border-amber-900/50",
      badgeBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/60",
      title: t("onboardingStep5Title"),
      desc: t("onboardingStep5Desc"),
      actionLabel: t("onboardingStep5Action"),
      targetPage: "github",
    },
  ];

  const currentTour = tourSteps[tourStep];

  const handleFinish = () => {
    chrome.storage.local.set({ clickbook_onboarded: true });
    onClose();
  };

  const handleNavigate = (page: string) => {
    chrome.storage.local.set({ clickbook_onboarded: true });
    if (onNavigate) {
      onNavigate(page);
    } else {
      onClose();
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-[9998] bg-black/60 dark:bg-black/80 backdrop-blur-xs transition-opacity duration-200" 
        onClick={handleFinish}
      />
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div 
          className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-figma-lg flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 font-sans text-slate-800 dark:text-slate-100 my-auto select-none"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header (Single-line Compact Layout) */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 gap-3 flex-nowrap overflow-x-auto scrollbar-none">
            {/* Left: Brand & Segmented Tabs */}
            <div className="flex items-center gap-3 shrink-0 flex-nowrap">
              <div className="flex items-center gap-2 shrink-0">
                <img src="/icons/icon128.png" alt="ClickBook" className="w-6 h-6 rounded-lg shadow-figma-sm shrink-0" />
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">ClickBook</span>
                  <span className="flex items-center gap-0.5 bg-indigo-600 text-white px-1.5 py-0.5 rounded-full text-[9px] font-extrabold select-none leading-none shadow-figma-sm shrink-0">
                    <Sparkles size={8} className="text-amber-300 fill-amber-300 shrink-0" />
                    AI Hub
                  </span>
                </div>
              </div>

              {/* Segmented View Tabs */}
              <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700/80 shrink-0 flex-nowrap">
                <button
                  onClick={() => setTab("overview")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    tab === "overview"
                      ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs font-bold"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <Layers size={12} className={tab === "overview" ? "text-indigo-500 dark:text-indigo-300" : ""} />
                  <span>{t("onboardingTabOverview")}</span>
                </button>
                <button
                  onClick={() => setTab("tour")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    tab === "tour"
                      ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs font-bold"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <BookOpen size={12} className={tab === "tour" ? "text-indigo-500 dark:text-indigo-300" : ""} />
                  <span>{t("onboardingTabTour")}</span>
                </button>
              </div>
            </div>

            {/* Right: Language & Theme & Close */}
            <div className="flex items-center gap-2 shrink-0 flex-nowrap">
              {/* Language Selector */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 text-xs shrink-0 flex-nowrap">
                {SUPPORTED_LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setLang(l.code)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      lang === l.code 
                        ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs" 
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    {l.shortLabel}
                  </button>
                ))}
              </div>

              {/* Theme Toggle */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 shrink-0 flex-nowrap">
                <button
                  onClick={() => toggleTheme("light")}
                  className={`p-1 rounded-md transition-all cursor-pointer ${
                    theme === "light" 
                      ? "bg-white text-amber-500 shadow-2xs" 
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                  title="Light Mode"
                >
                  <Sun size={13} />
                </button>
                <button
                  onClick={() => toggleTheme("dark")}
                  className={`p-1 rounded-md transition-all cursor-pointer ${
                    theme === "dark" 
                      ? "bg-slate-700 text-indigo-400 shadow-2xs" 
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                  title="Dark Mode"
                >
                  <Moon size={13} />
                </button>
              </div>

              <button
                onClick={handleFinish}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 cursor-pointer"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Modal Main Body (Fixed Consistent Height: Zero Layout Shift) */}
          <div className="min-h-[365px] flex flex-col justify-between">
            {/* TAB 1: OVERVIEW (4 FEATURE CARDS) */}
            {tab === "overview" && (
              <div className="animate-in fade-in duration-200 flex flex-col justify-between h-full">
                {/* Hero Banner */}
                <div className="px-6 pt-4 pb-2 text-center sm:text-left">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {t("onboardingTitle")}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {t("onboardingWelcomeSubtitle")}
                  </p>
                </div>

                {/* 4 Feature Cards Grid */}
                <div className="px-6 py-2 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {featureCards.map((card) => (
                    <div
                      key={card.id}
                      className="group relative p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-700/80 bg-slate-50/90 dark:bg-slate-800/90 hover:border-indigo-400/80 dark:hover:border-indigo-500/80 hover:shadow-figma-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between min-h-[110px]"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="p-1.5 rounded-lg bg-white dark:bg-slate-700/90 text-slate-700 dark:text-slate-200 shadow-2xs">
                            {card.icon}
                          </div>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${card.badgeColor}`}>
                            {card.actionLabel}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {card.title}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed font-normal">
                          {card.desc}
                        </p>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-end">
                        <button
                          onClick={() => handleNavigate(card.targetPage)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <span>{card.actionLabel}</span>
                          <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: STEP-BY-STEP TOUR SLIDER */}
            {tab === "tour" && (
              <div className="px-6 py-4 animate-in fade-in duration-200 flex flex-col justify-center h-full">
                <div className="relative p-6 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-slate-50/90 dark:bg-slate-800/90 flex flex-col min-h-[295px] justify-between shadow-2xs">
                  {/* Step Top Meta */}
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${currentTour.badgeBg}`}>
                      Step {tourStep + 1} / {tourSteps.length}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 font-medium">
                      <span>{tourStep + 1} of 5</span>
                    </div>
                  </div>

                  {/* Step Content */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 my-2">
                    <div className={`p-4 rounded-2xl border ${currentTour.accentBg} shrink-0 shadow-2xs`}>
                      {currentTour.icon}
                    </div>
                    <div className="flex-1 min-w-0 text-center sm:text-left">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                        {currentTour.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                        {currentTour.desc}
                      </p>
                      <div className="mt-4">
                        <button
                          onClick={() => handleNavigate(currentTour.targetPage)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-600 transition-all cursor-pointer shadow-2xs whitespace-nowrap"
                        >
                          <span>{currentTour.actionLabel}</span>
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Step Navigation Arrows */}
                  <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-200/80 dark:border-slate-700/80">
                    <button
                      disabled={tourStep === 0}
                      onClick={() => setTourStep((prev) => Math.max(0, prev - 1))}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer whitespace-nowrap"
                    >
                      <ChevronLeft size={14} />
                      <span>{t("onboardingPrevStep")}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {tourSteps.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setTourStep(i)}
                          className={`h-2 rounded-full transition-all cursor-pointer ${
                            i === tourStep 
                              ? "w-6 bg-indigo-600 dark:bg-indigo-400" 
                              : "w-2 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400"
                          }`}
                          title={`Step ${i + 1}`}
                        />
                      ))}
                    </div>

                    <button
                      disabled={tourStep === tourSteps.length - 1}
                      onClick={() => setTourStep((prev) => Math.min(tourSteps.length - 1, prev + 1))}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer whitespace-nowrap"
                    >
                      <span>{t("onboardingNextStep")}</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 bg-slate-50/90 dark:bg-slate-900/90 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Command size={13} className="text-slate-400 shrink-0" />
              <span>{t("onboardingShortcutTip")}</span>
            </div>

            <button
              onClick={handleFinish}
              className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold rounded-xl shadow-figma-sm hover:shadow-figma-md transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <span>{t("onboardingStartBtn")}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
