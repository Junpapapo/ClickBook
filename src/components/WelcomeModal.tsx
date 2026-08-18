import { useState, useEffect, useCallback } from "react";
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
  Layers, 
  Cpu, 
  Copy, 
  Check, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import { useLang } from "@/shared/LanguageContext";
import { SUPPORTED_LANGUAGES } from "@/shared/i18n";
import { isAIAvailable, getAIModel } from "@/shared/categorizer";

interface Props {
  onClose: () => void;
  onNavigate?: (page: string) => void;
}

export default function WelcomeModal({ onClose, onNavigate }: Props) {
  const { t, lang, setLang } = useLang();
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [tab, setTab] = useState<"overview" | "tour" | "nano">("overview");
  const [tourStep, setTourStep] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [nanoStatus, setNanoStatus] = useState<"checking" | "ready" | "not_ready">("checking");
  const [userName, setUserName] = useState("Creator");

  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(["clickbook_username"], (res) => {
        if (res && res.clickbook_username) {
          setUserName(res.clickbook_username);
        }
      });
    }
  }, []);

  const handleUserNameChange = (val: string) => {
    setUserName(val);
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ clickbook_username: val });
    }
  };

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  const checkNanoStatus = useCallback(async () => {
    setNanoStatus("checking");
    try {
      // 1. Check storage toggle first (AI ON in popup/app)
      const storage = await chrome.storage.local.get(["clickbook_ai_enabled"]);
      if (storage.clickbook_ai_enabled === true) {
        setNanoStatus("ready");
        return;
      }

      // 2. Check if AI model API exists via shared model detector
      const lm = await getAIModel();
      if (lm) {
        setNanoStatus("ready");
        return;
      }

      // 3. Check window.ai / chrome.ai / LanguageModel globals directly
      const glob = (typeof window !== "undefined" ? window : (typeof self !== "undefined" ? self : globalThis)) as Record<string, unknown>;
      const winAi = glob.ai as { languageModel?: unknown; create?: unknown; canCreateGenericSession?: unknown } | undefined;
      const chromeAi = (glob.chrome as { ai?: { languageModel?: unknown }; aiOriginTrial?: { languageModel?: unknown } } | undefined);

      if (
        winAi?.languageModel ||
        chromeAi?.ai?.languageModel ||
        chromeAi?.aiOriginTrial?.languageModel ||
        glob.LanguageModel ||
        (winAi && typeof winAi.create === "function") ||
        winAi?.canCreateGenericSession
      ) {
        setNanoStatus("ready");
        return;
      }

      // 4. Fallback to isAIAvailable()
      const available = await isAIAvailable();
      setNanoStatus(available ? "ready" : "not_ready");
    } catch {
      setNanoStatus("not_ready");
    }
  }, []);

  useEffect(() => {
    checkNanoStatus();
  }, [checkNanoStatus]);

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

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenUrl = (url: string) => {
    if (typeof chrome !== "undefined" && chrome.tabs?.create) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, "_blank");
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
          className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-figma-lg flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 font-sans text-slate-800 dark:text-slate-100 my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 gap-3 flex-wrap sm:flex-nowrap select-none">
            {/* Left: Brand & Segmented Tabs */}
            <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
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

              {/* Segmented View Tabs (Overview | Step Tour | Gemini Nano Setup) */}
              <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700/80 shrink-0">
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
                <button
                  onClick={() => setTab("nano")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    tab === "nano"
                      ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs font-bold"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <Cpu size={12} className={tab === "nano" ? "text-indigo-500 dark:text-indigo-300" : "text-amber-500"} />
                  <span>{t("onboardingTabNano")}</span>
                </button>
              </div>
            </div>

            {/* Right: Language & Theme & Close */}
            <div className="flex items-center gap-2 shrink-0 ml-auto">
              {/* Language Selector (주요 언어 + 간결한 디자인) */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 text-xs shrink-0 max-w-[220px] overflow-x-auto custom-scrollbar">
                {SUPPORTED_LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setLang(l.code)}
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      lang === l.code 
                        ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs font-bold" 
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    {l.shortLabel}
                  </button>
                ))}
              </div>

              {/* Theme Toggle */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 shrink-0">
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
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                  title="Dark Mode"
                >
                  <Moon size={13} />
                </button>
              </div>

              {/* Close Button */}
              <button
                onClick={handleFinish}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer ml-1"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Modal Main Body (Fixed Consistent Height: Zero Layout Shift) */}
          <div className="min-h-[385px] flex flex-col justify-between">
            {/* TAB 1: OVERVIEW (4 FEATURE CARDS + NANO BANNER) */}
            {tab === "overview" && (
              <div className="animate-in fade-in duration-200 flex flex-col justify-between h-full">
                {/* Hero Banner */}
                <div className="px-6 pt-3.5 pb-1.5 text-center sm:text-left">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {t("onboardingTitle")}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                    {t("onboardingWelcomeSubtitle")}
                  </p>

                  {/* Gemini Nano Slim Recommendation Banner */}
                  <div className="mt-2 px-3 py-1.5 rounded-xl bg-indigo-50/80 dark:bg-slate-800/80 border border-indigo-200/70 dark:border-indigo-800/70 flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="flex h-2 w-2 relative shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      </span>
                      <p className="text-[11px] font-medium text-slate-700 dark:text-slate-200 truncate">
                        {t("onboardingNanoBannerText")}
                      </p>
                    </div>
                    <button
                      onClick={() => setTab("nano")}
                      className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold shadow-2xs transition-all cursor-pointer whitespace-nowrap"
                    >
                      <span>{t("onboardingNanoBannerBtn")}</span>
                      <ArrowRight size={11} />
                    </button>
                  </div>

                  {/* 👤 사용자 대시보드 닉네임 설정 바 */}
                  <div className="mt-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-50/90 to-purple-50/90 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-200/80 dark:border-indigo-800/60 flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-extrabold text-xs shadow-2xs shrink-0">
                        {(userName || "C").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-slate-800 dark:text-slate-100">
                          {lang === "ko" ? "대시보드 닉네임" : "Dashboard Nickname"}
                        </div>
                        <p className="text-[9.5px] text-slate-500 dark:text-slate-400 truncate">
                          {lang === "ko" ? "대시보드 인사말과 우측 스마트 위젯에 실시간 표시됩니다." : "Displayed on dashboard greeting & smart widgets."}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        value={userName}
                        onChange={(e) => handleUserNameChange(e.target.value)}
                        placeholder={lang === "ko" ? "닉네임 입력 (예: Creator)" : "Your name"}
                        className="w-32 sm:w-36 px-2 py-0.8 text-xs rounded-lg bg-white dark:bg-slate-800 border border-indigo-200/80 dark:border-indigo-700 text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 font-bold shadow-2xs text-center"
                      />
                    </div>
                  </div>
                </div>

                {/* 4 Feature Cards Grid */}
                <div className="px-6 py-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {featureCards.map((card) => (
                    <div
                      key={card.id}
                      className="group relative p-3 rounded-xl border border-slate-200/90 dark:border-slate-700/80 bg-slate-50/90 dark:bg-slate-800/90 hover:border-indigo-400/80 dark:hover:border-indigo-500/80 hover:shadow-figma-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between min-h-[102px]"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
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
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2 leading-relaxed font-normal">
                          {card.desc}
                        </p>
                      </div>

                      <div className="mt-2 pt-1.5 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-end">
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
                <div className="relative p-5 sm:p-6 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-slate-50/90 dark:bg-slate-800/90 flex flex-col min-h-[305px] justify-between shadow-2xs">
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

            {/* TAB 3: GEMINI NANO SETUP GUIDE */}
            {tab === "nano" && (
              <div className="px-6 py-3.5 animate-in fade-in duration-200 flex flex-col justify-between h-full">
                {/* Nano Header & Status Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-indigo-500 shrink-0" />
                      <span>{t("onboardingNanoTitle")}</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {t("onboardingNanoSubtitle")}
                    </p>
                  </div>

                  {/* Realtime Status Pill */}
                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                      nanoStatus === "ready"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700/80"
                        : nanoStatus === "checking"
                        ? "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700/80"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700/80"
                    }`}>
                      {nanoStatus === "ready" ? (
                        <CheckCircle2 size={13} className="text-emerald-500" />
                      ) : nanoStatus === "checking" ? (
                        <RefreshCw size={13} className="animate-spin text-slate-500" />
                      ) : (
                        <AlertCircle size={13} className="text-amber-500" />
                      )}
                      <span>
                        {nanoStatus === "ready" 
                          ? t("onboardingNanoStatusReady")
                          : nanoStatus === "checking"
                          ? t("onboardingNanoStatusCheck")
                          : t("onboardingNanoStatusNotReady")}
                      </span>
                    </div>

                    <button
                      onClick={checkNanoStatus}
                      className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer"
                      title={t("onboardingNanoStatusCheck")}
                    >
                      <RefreshCw size={13} className={nanoStatus === "checking" ? "animate-spin" : ""} />
                    </button>
                  </div>
                </div>

                {/* 3-Step Setup Cards */}
                <div className="grid grid-cols-1 gap-2.5 py-2.5">
                  {/* STEP 1: FLAGS */}
                  <div className="p-3 rounded-xl border border-slate-200/90 dark:border-slate-700/80 bg-slate-50/90 dark:bg-slate-800/90 shadow-2xs">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-600 text-white shadow-2xs">
                        {t("onboardingNanoStep1Badge")}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {t("onboardingNanoStep1Title")}
                      </h4>
                    </div>

                    {/* Flag Items List */}
                    <div className="space-y-1.5">
                      {/* Flag 1 */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-2 rounded-lg bg-white dark:bg-slate-700/90 border border-slate-200/70 dark:border-slate-600/70 text-xs">
                        <div className="min-w-0 select-text cursor-text">
                          <div className="font-semibold text-slate-800 dark:text-slate-200 select-text selection:bg-indigo-500 selection:text-white">
                            {t("onboardingNanoFlag1Name")}
                          </div>
                          <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono select-text selection:bg-indigo-500 selection:text-white">
                            ➔ {t("onboardingNanoFlag1Val")}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto select-none">
                          <button
                            onClick={() => handleCopy("chrome://flags/#optimization-guide-on-device-model", "flag1")}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                          >
                            {copiedId === "flag1" ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                            <span>{copiedId === "flag1" ? t("onboardingNanoCopied") : t("onboardingNanoCopy")}</span>
                          </button>
                          <button
                            onClick={() => handleOpenUrl("chrome://flags/#optimization-guide-on-device-model")}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                          >
                            <ExternalLink size={11} />
                            <span>{t("onboardingNanoOpen")}</span>
                          </button>
                        </div>
                      </div>

                      {/* Flag 2 */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-2 rounded-lg bg-white dark:bg-slate-700/90 border border-slate-200/70 dark:border-slate-600/70 text-xs">
                        <div className="min-w-0 select-text cursor-text">
                          <div className="font-semibold text-slate-800 dark:text-slate-200 select-text selection:bg-indigo-500 selection:text-white">
                            {t("onboardingNanoFlag2Name")}
                          </div>
                          <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono select-text selection:bg-indigo-500 selection:text-white">
                            ➔ {t("onboardingNanoFlag2Val")}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto select-none">
                          <button
                            onClick={() => handleCopy("chrome://flags/#prompt-api-for-gemini-nano", "flag2")}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                          >
                            {copiedId === "flag2" ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                            <span>{copiedId === "flag2" ? t("onboardingNanoCopied") : t("onboardingNanoCopy")}</span>
                          </button>
                          <button
                            onClick={() => handleOpenUrl("chrome://flags/#prompt-api-for-gemini-nano")}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                          >
                            <ExternalLink size={11} />
                            <span>{t("onboardingNanoOpen")}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* STEP 2 & STEP 3 (2 COLUMNS) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* STEP 2: RELAUNCH */}
                    <div className="p-3 rounded-xl border border-slate-200/90 dark:border-slate-700/80 bg-slate-50/90 dark:bg-slate-800/90 shadow-2xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-600 text-white shadow-2xs">
                            {t("onboardingNanoStep2Badge")}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            {t("onboardingNanoStep2Title")}
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                          {t("onboardingNanoStep2Desc")}
                        </p>
                      </div>
                    </div>

                    {/* STEP 3: COMPONENTS */}
                    <div className="p-3 rounded-xl border border-slate-200/90 dark:border-slate-700/80 bg-slate-50/90 dark:bg-slate-800/90 shadow-2xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-600 text-white shadow-2xs">
                            {t("onboardingNanoStep3Badge")}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            {t("onboardingNanoStep3Title")}
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mb-2">
                          {t("onboardingNanoStep3Desc")}
                        </p>
                      </div>
                      <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-slate-200/70 dark:border-slate-700/70">
                        <button
                          onClick={() => handleCopy("chrome://components", "components")}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                        >
                          {copiedId === "components" ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                          <span>{copiedId === "components" ? t("onboardingNanoCopied") : t("onboardingNanoCopy")}</span>
                        </button>
                        <button
                          onClick={() => handleOpenUrl("chrome://components")}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded bg-purple-50 dark:bg-purple-950/70 hover:bg-purple-100 dark:hover:bg-purple-900/80 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800 transition-colors cursor-pointer"
                        >
                          <ExternalLink size={11} />
                          <span>{t("onboardingNanoOpen")}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Notice */}
                <div className="pt-1 text-center">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    {t("onboardingNanoChromeNotice")}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 bg-slate-50/90 dark:bg-slate-900/90 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Command size={13} className="text-slate-400 shrink-0" />
              <span>{t("onboardingShortcutTip")}</span>
            </div>

            <button
              onClick={handleFinish}
              className="w-full sm:w-auto px-5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold rounded-xl shadow-figma-sm hover:shadow-figma-md transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
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
