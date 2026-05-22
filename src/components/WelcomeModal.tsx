import { useState } from "react";
import { Sparkles, MousePointerClick, FolderTree, ChevronRight, X, CheckSquare, Map } from "lucide-react";
import { useLang } from "@/shared/LanguageContext";

interface Props {
  onClose: () => void;
}

export default function WelcomeModal({ onClose }: Props) {
  const { t } = useLang();
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: <MousePointerClick className="w-12 h-12 text-blue-500 mb-4" />,
      title: t("onboardingStep1Title"),
      desc: t("onboardingStep1Desc"),
    },
    {
      icon: <Sparkles className="w-12 h-12 text-yellow-500 mb-4" />,
      title: t("onboardingStep2Title"),
      desc: t("onboardingStep2Desc"),
    },
    {
      icon: <FolderTree className="w-12 h-12 text-emerald-500 mb-4" />,
      title: t("onboardingStep3Title"),
      desc: t("onboardingStep3Desc"),
    },
    {
      icon: <CheckSquare className="w-12 h-12 text-indigo-500 mb-4" />,
      title: t("onboardingStep4Title"),
      desc: t("onboardingStep4Desc"),
    },
    {
      icon: <Map className="w-12 h-12 text-purple-500 mb-4" />,
      title: t("onboardingStep5Title"),
      desc: t("onboardingStep5Desc"),
    },
  ];

  const current = steps[step];

  return (
    <>
      <div className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm" />
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-600 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-surface-700">
            <span className="font-bold text-gray-800 dark:text-gray-100">{t("onboardingTitle")}</span>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-surface-700"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="p-8 flex flex-col items-center text-center h-64 justify-center">
            {current.icon}
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              {current.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {current.desc}
            </p>
          </div>

          <div className="px-6 py-5 bg-gray-50 dark:bg-surface-800 flex items-center justify-between border-t border-gray-100 dark:border-surface-700">
            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === step ? "bg-indigo-500" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                />
              ))}
            </div>
            
            <button
              onClick={() => {
                if (step < steps.length - 1) setStep(step + 1);
                else onClose();
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-full transition-colors"
            >
              {step < steps.length - 1 ? (
                <>Next <ChevronRight size={14} /></>
              ) : (
                t("onboardingStartBtn")
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
