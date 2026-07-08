import React from "react";
import type { SpringNoteBookProps } from "../spring-note-types";

export default function SpringNoteBook({
  theme,
  font,
  fontSize,
  children,
}: SpringNoteBookProps) {
  // 테마별 클래스 매핑
  const THEME_CLASSES: Record<string, string> = {
    light: "bg-white !text-black border-gray-200",
    sepia: "bg-[#FBF6EC] !text-[#4A3728] border-[#EADCC6]",
    dark: "bg-[#1E1E1E] !text-gray-200 border-[#2D2D30]",
    grid: "bg-white !text-black border-gray-200",
  };

  // 폰트 종류별 클래스 매핑
  const FONT_CLASSES: Record<string, string> = {
    serif: "font-serif",
    sans: "font-sans",
    mono: "font-mono",
    pretendard: "font-pretendard",
  };

  // 그리드 테마일 경우 CSS background 속성 지정
  const getGridStyle = (): React.CSSProperties => {
    if (theme === "grid") {
      return {
        backgroundImage: `
          linear-gradient(to right, rgba(99, 102, 241, 0.08) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(99, 102, 241, 0.08) 1px, transparent 1px)
        `,
        backgroundSize: "20px 20px",
      };
    }
    // 일반 노트(Lined Paper) 효과를 은은하게 줄 수도 있음 (Sepia나 Light일 때 줄선 배경)
    if (theme === "sepia" || theme === "light") {
      return {
        backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.035) 1px, transparent 1px)",
        backgroundSize: "100% 28px",
      };
    }
    return {};
  };

  // 스프링 링 렌더링 개수
  const rings = Array.from({ length: 15 }, (_, i) => i);

  return (
    <div className="flex-1 flex relative overflow-hidden h-full">
      {/* 바인더 스프링 제본 장식 영역 (경계선 안에서 잘리지 않도록 크기 및 오프셋 미세 조율) */}
      <div className="absolute left-1 top-0 bottom-0 w-6 z-30 flex flex-col justify-around items-center pointer-events-none select-none">
        {rings.map((i) => (
          <div key={i} className="relative w-full flex items-center justify-center my-0.5">
            {/* 스프링 구멍 1 (왼쪽) */}
            <div className="absolute left-0 w-1.5 h-2.5 bg-black/75 dark:bg-black/90 rounded-full shadow-inner" />
            
            {/* 스프링 구멍 2 (오른쪽) */}
            <div className="absolute right-0.5 w-1.5 h-2.5 bg-black/75 dark:bg-black/90 rounded-full shadow-inner" />
            
            {/* 금속 스프링 링 */}
            <div className="absolute left-0.5 w-5 h-2.5 bg-gradient-to-b from-gray-300 via-gray-100 to-gray-450 dark:from-surface-700 dark:via-surface-500 dark:to-surface-850 rounded-full shadow border-t border-white/20 dark:border-white/5 transform -rotate-12" />
          </div>
        ))}
      </div>

      {/* 다이어리 세로 책등 바인더 가죽 홈 및 그림자 장식 (스프링 링 뒤쪽에 입체감을 더해 시각적 짤림 보정) */}
      <div 
        className={`absolute left-0 top-0 bottom-0 w-5 bg-gradient-to-r ${
          theme === "light" || theme === "grid"
            ? "from-black/15 via-black/2 to-transparent border-r border-black/5"
            : "from-black/20 via-[#231710]/5 to-transparent border-r border-[#231710]/15"
        } z-20 pointer-events-none transition-all duration-300`}
      />

      {/* 내부 콘텐츠 (메모 종이 영역) */}
      <div
        style={{
          fontSize: `${fontSize}px`,
          ...getGridStyle(),
        }}
        className={`flex-1 flex flex-col pl-8.5 pr-1.5 py-4 overflow-y-auto scrollbar-thin transition-colors duration-300 ${THEME_CLASSES[theme]} ${FONT_CLASSES[font]}`}
      >
        {children}
      </div>
    </div>
  );
}

