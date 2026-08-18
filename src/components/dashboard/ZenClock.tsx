import { useState, useEffect, useMemo } from "react";
import { useLang } from "@/shared/LanguageContext";
import { QUOTES } from "@/shared/quotes";

interface Props {
  className?: string;
}

export default function ZenClock({ className = "" }: Props) {
  const { lang } = useLang();
  const [time, setTime] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 시간, 분, 초 포맷팅
  const hours = time.getHours().toString().padStart(2, "0");
  const minutes = time.getMinutes().toString().padStart(2, "0");
  const seconds = time.getSeconds().toString().padStart(2, "0");

  // 로컬라이즈된 순수 날짜 포맷팅
  const formattedDate = useMemo(() => {
    const dateLocaleMap: Record<string, string> = {
      ko: "ko-KR",
      ja: "ja-JP",
      "zh-TW": "zh-TW",
      de: "de-DE",
      es: "es-ES",
      fr: "fr-FR",
    };
    return time.toLocaleDateString(dateLocaleMap[lang] || "en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [time, lang]);

  // 오늘의 감성 명언 (날짜 기반 1일 1명언)
  const todayQuote = useMemo(() => {
    if (!QUOTES || QUOTES.length === 0) return null;
    const dayOfYear = Math.floor((time.getTime() - new Date(time.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    return QUOTES[dayOfYear % QUOTES.length];
  }, [time]);

  return (
    <div
      className={`flex flex-col items-center justify-center w-full select-none pointer-events-none animate-in fade-in zoom-in-95 duration-500 ${className}`}
    >
      {/* ── 1. 상단 순수 날짜 & 요일 (투명 위젯 박스 없는 미니멀 텍스트) ── */}
      <div className="mb-2 sm:mb-3 text-center">
        <p className="text-base sm:text-lg md:text-xl font-medium tracking-wider text-white/90 drop-shadow-[0_3px_10px_rgba(0,0,0,0.6)]">
          {formattedDate}
        </p>
      </div>

      {/* ── 2. 메인 대형 감성 시계 (Apple/Momentum 모던 슬림 타이포그래피) ── */}
      <div className="relative flex items-baseline justify-center">
        {/* 은은한 앰비언트 글로우 백드롭 */}
        <div className="absolute inset-0 -m-8 bg-indigo-500/10 dark:bg-white/5 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10 flex items-center tracking-tighter text-white tabular-nums">
          {/* 시 (Hours) */}
          <span className="text-7xl sm:text-9xl md:text-[11rem] lg:text-[13rem] xl:text-[15rem] font-light leading-none drop-shadow-[0_12px_40px_rgba(0,0,0,0.65)]">
            {hours}
          </span>

          {/* 깜빡이는 부드러운 콜론 (Colon) */}
          <span className="text-6xl sm:text-8xl md:text-[9rem] lg:text-[11rem] xl:text-[13rem] font-thin leading-none mx-1 sm:mx-3 text-white/80 animate-pulse drop-shadow-[0_12px_40px_rgba(0,0,0,0.65)] -translate-y-2 sm:-translate-y-4">
            :
          </span>

          {/* 분 (Minutes) */}
          <span className="text-7xl sm:text-9xl md:text-[11rem] lg:text-[13rem] xl:text-[15rem] font-light leading-none drop-shadow-[0_12px_40px_rgba(0,0,0,0.65)]">
            {minutes}
          </span>

          {/* 초 (Seconds) 미니멀 인디케이터 */}
          <div className="flex flex-col ml-3 sm:ml-5 -translate-y-4 sm:-translate-y-8">
            <span className="text-lg sm:text-2xl md:text-3xl font-extralight text-white/60 tracking-normal drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
              {seconds}
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-white/40 uppercase tracking-widest mt-0.5">
              SEC
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. 지적이고 감성적인 오늘의 명언 (글래스모피즘 외곽 위젯 카드) ── */}
      {todayQuote && (
        <div className="mt-8 sm:mt-10 max-w-xl px-6 py-3.5 rounded-2xl bg-black/25 dark:bg-white/10 backdrop-blur-xl border border-white/20 dark:border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.35)] flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-2 duration-700">
          <p className="text-xs sm:text-sm text-white/95 font-light italic leading-relaxed drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
            "{todayQuote.text}"
          </p>
          {todayQuote.author && (
            <span className="text-[11px] font-medium text-white/70 mt-1.5 tracking-wide drop-shadow-xs">
              — {todayQuote.author}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
