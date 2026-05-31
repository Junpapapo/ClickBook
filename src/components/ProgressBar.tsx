import { useEffect, useState } from "react";

interface Props {
  isLoading: boolean;
  color?: string;
}

export default function ProgressBar({ isLoading, color = "bg-indigo-500" }: Props) {
  const [show, setShow] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isLoading) {
      setShow(true);
      setProgress(0);
      
      // 인공지능 처리 느낌을 주기 위해 처음엔 빠르게, 뒤로 갈수록 느리게 증가 (가짜 진행률)
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev < 30) return prev + Math.random() * 5;
          if (prev < 70) return prev + Math.random() * 2;
          if (prev < 90) return prev + Math.random() * 0.5;
          return prev;
        });
      }, 200);
    } else {
      setProgress(100);
      const timer = setTimeout(() => {
        setShow(false);
        setProgress(0);
      }, 500); // 완료 애니메이션 대기
      return () => clearTimeout(timer);
    }

    return () => clearInterval(interval);
  }, [isLoading]);

  if (!show) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[10000] h-1 bg-transparent pointer-events-none">
      <div
        className={`h-full ${color} transition-all duration-300 ease-out shadow-[0_0_8px_rgba(99,102,241,0.6)]`}
        style={{ width: `${progress}%` }}
      />
      
      {/* 반짝이는 광원 효과 */}
      <div 
        className="absolute top-0 h-full w-20 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"
        style={{ left: `${progress - 10}%` }}
      />

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(500%); }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  );
}
