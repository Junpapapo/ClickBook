import { useState, useCallback } from "react";
import { 
  Sparkles, 
  Heart, 
  MessageSquareHeart, 
  Star, 
  X, 
  Send, 
  ExternalLink,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { useLang } from "@/shared/LanguageContext";
import { 
  snoozeReviewPrompt, 
  dismissReviewPromptForever, 
  markReviewCompleted 
} from "@/shared/storage";

const CHROME_STORE_REVIEWS_URL = "https://chromewebstore.google.com/detail/ikdaaibmockcojalohiopmbcpcnkkmga/reviews";
const GITHUB_ISSUES_URL = "https://github.com/Junpapapo/ClickBook/issues/new?title=%5BFeedback%5D%20ClickBook%20Improvement&labels=feedback";

interface Props {
  onClose: () => void;
}

type Step = "sentiment" | "love" | "feedback";

export default function ReviewPromptModal({ onClose }: Props) {
  const { t } = useLang();
  const [step, setStep] = useState<Step>("sentiment");
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);

  const handleLater = useCallback(async () => {
    await snoozeReviewPrompt(7);
    onClose();
  }, [onClose]);

  const handleNever = useCallback(async () => {
    await dismissReviewPromptForever();
    onClose();
  }, [onClose]);

  const handleGoToReview = useCallback(async () => {
    await markReviewCompleted();
    if (typeof window !== "undefined") {
      window.open(CHROME_STORE_REVIEWS_URL, "_blank");
    }
    onClose();
  }, [onClose]);

  const handleSendFeedback = useCallback(async () => {
    await snoozeReviewPrompt(14);
    if (feedbackText.trim()) {
      const encodedBody = encodeURIComponent(feedbackText.trim());
      const url = `${GITHUB_ISSUES_URL}&body=${encodedBody}`;
      if (typeof window !== "undefined") {
        window.open(url, "_blank");
      }
    } else {
      if (typeof window !== "undefined") {
        window.open(GITHUB_ISSUES_URL, "_blank");
      }
    }
    setFeedbackSent(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  }, [feedbackText, onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-[460px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 animate-in zoom-in-95"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Close Button */}
        <button
          onClick={handleLater}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors z-10"
          title={t("reviewCloseBtn")}
          aria-label={t("reviewCloseBtn")}
        >
          <X size={18} />
        </button>

        {/* ── STEP 1: Sentiment Check ──────────────────────── */}
        {step === "sentiment" && (
          <div className="p-6 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-700/40 flex items-center justify-center text-amber-500 mb-4 shadow-sm">
              <Sparkles size={28} className="animate-pulse" />
            </div>

            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-50 tracking-tight mb-2">
              {t("reviewStep1Title")}
            </h3>
            
            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-xs mb-6">
              {t("reviewStep1Desc")}
            </p>

            <div className="w-full flex flex-col gap-2.5 mb-5">
              <button
                onClick={() => setStep("love")}
                className="w-full group flex items-center justify-between px-4 py-3 bg-neutral-50 hover:bg-amber-500/10 dark:bg-neutral-800/60 dark:hover:bg-amber-500/15 border border-neutral-200 dark:border-neutral-700/80 hover:border-amber-400 dark:hover:border-amber-500/50 rounded-xl transition-all duration-200 text-left font-medium text-neutral-800 dark:text-neutral-100 text-sm shadow-sm"
              >
                <span>{t("reviewStep1Positive")}</span>
                <ChevronRight size={16} className="text-neutral-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => setStep("feedback")}
                className="w-full group flex items-center justify-between px-4 py-3 bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800/60 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/80 hover:border-neutral-300 dark:hover:border-neutral-600 rounded-xl transition-all duration-200 text-left font-medium text-neutral-700 dark:text-neutral-300 text-sm shadow-sm"
              >
                <span>{t("reviewStep1Negative")}</span>
                <ChevronRight size={16} className="text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-200 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>

            <div className="w-full flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800/80 text-xs text-neutral-400 dark:text-neutral-500">
              <button
                onClick={handleNever}
                className="hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors py-1 px-1.5 rounded"
              >
                {t("reviewNeverBtn")}
              </button>
              <button
                onClick={handleLater}
                className="hover:text-neutral-700 dark:hover:text-neutral-200 font-medium transition-colors py-1 px-1.5 rounded"
              >
                {t("reviewLaterBtn")}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2A: Love & 5-Star Store Review ─────────── */}
        {step === "love" && (
          <div className="p-6 flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-amber-600 dark:text-amber-400 text-xs font-semibold mb-3">
              <Heart size={13} className="fill-amber-500 text-amber-500" />
              <span>{t("reviewStep2LoveBadge")}</span>
            </div>

            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-50 tracking-tight mb-3">
              {t("reviewStep2LoveTitle")}
            </h3>

            <div className="w-full bg-amber-50/50 dark:bg-neutral-800/50 border border-amber-100 dark:border-neutral-700/60 rounded-xl p-3.5 mb-5 text-left text-xs leading-relaxed text-neutral-700 dark:text-neutral-300 space-y-2">
              <p>{t("reviewStep2LoveMsg1")}</p>
              <p className="font-medium text-neutral-900 dark:text-neutral-100">
                {t("reviewStep2LoveMsg2")}
              </p>
            </div>

            {/* 5-Star Visual Ribbon */}
            <div className="flex items-center justify-center gap-1.5 mb-5 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={20} className="fill-amber-400 drop-shadow-sm" />
              ))}
            </div>

            <div className="w-full flex flex-col gap-2 mb-4">
              <button
                onClick={handleGoToReview}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-[0.98] shadow-md shadow-amber-500/20 transition-all duration-150 cursor-pointer"
              >
                <span>{t("reviewStep2LoveBtn")}</span>
                <ExternalLink size={15} />
              </button>

              <button
                onClick={handleLater}
                className="w-full py-2 px-3 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
              >
                {t("reviewLaterBtn")}
              </button>
            </div>

            <div className="text-[11px] text-neutral-400 dark:text-neutral-500 flex items-center gap-1">
              <ShieldCheck size={13} className="text-emerald-500" />
              <span>ClickBook is 100% free & open for privacy</span>
            </div>
          </div>
        )}

        {/* ── STEP 2B: Feedback & Issue Report ─────────────── */}
        {step === "feedback" && (
          <div className="p-6 flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-3">
              <MessageSquareHeart size={13} />
              <span>{t("reviewStep2FeedbackBadge")}</span>
            </div>

            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-50 tracking-tight mb-2">
              {t("reviewStep2FeedbackTitle")}
            </h3>

            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed mb-4 max-w-sm">
              {t("reviewStep2FeedbackMsg")}
            </p>

            <div className="w-full mb-4">
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Write your feedback, feature request or bug report here..."
                rows={3}
                className="w-full p-3 text-xs bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 resize-none transition"
              />
            </div>

            <div className="w-full flex flex-col gap-2 mb-3">
              <button
                onClick={handleSendFeedback}
                disabled={feedbackSent}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {feedbackSent ? (
                  <span>Thank you! ❤️</span>
                ) : (
                  <>
                    <span>{t("reviewStep2FeedbackBtn")}</span>
                    <Send size={13} />
                  </>
                )}
              </button>

              <button
                onClick={handleLater}
                className="w-full py-1.5 px-3 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
              >
                {t("reviewCloseBtn")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
