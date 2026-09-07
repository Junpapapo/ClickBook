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
    sage: "bg-[#F2F5ED] !text-[#243828] border-[#D6DFD3]",
    dot: "bg-[#FAF9F5] !text-[#1F2421] border-[#E6E6E0]",
  };

  // 폰트 종류별 클래스 매핑
  const FONT_CLASSES: Record<string, string> = {
    serif: "font-serif",
    sans: "font-sans",
    mono: "font-mono",
    pretendard: "font-pretendard",
  };

  // 테마별 background 패턴 속성 지정 (모눈, 불렛 도트, 라인드 페이퍼)
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
    // 도트(Dot) 테마: 5mm/20px 간격의 불렛저널 핀 도트
    if (theme === "dot") {
      return {
        backgroundImage: "radial-gradient(rgba(0, 0, 0, 0.16) 1.2px, transparent 1.2px)",
        backgroundSize: "20px 20px",
      };
    }
    // 세이지(Sage) 테마: 은은한 28px 올리브 룰드 라인
    if (theme === "sage") {
      return {
        backgroundImage: "linear-gradient(rgba(36, 56, 40, 0.045) 1px, transparent 1px)",
        backgroundSize: "100% 28px",
      };
    }
    // Sepia나 Light일 때 은은한 줄선 배경
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
    <div className="flex-1 w-full min-w-0 flex relative overflow-hidden h-full">
      {/* 바인더 스프링 제본 장식 영역 (정밀 3D 스테인리스 스틸 와이어 & 펀칭 홀) */}
      <div className="absolute left-0 top-0 bottom-0 w-7 z-30 flex flex-col justify-around items-center pointer-events-none select-none pl-0.5">
        {rings.map((i) => (
          <div key={i} className="relative w-full flex items-center justify-center my-0.5">
            <svg
              width="26"
              height="16"
              viewBox="0 0 26 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="overflow-visible filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]"
            >
              <defs>
                {/* 원통형 스테인리스 스틸 메탈릭 반사 그라데이션 */}
                <linearGradient id={`stainless-wire-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#475569" />
                  <stop offset="16%" stopColor="#CBD5E1" />
                  <stop offset="36%" stopColor="#FFFFFF" />
                  <stop offset="56%" stopColor="#F1F5F9" />
                  <stop offset="78%" stopColor="#94A3B8" />
                  <stop offset="100%" stopColor="#1E293B" />
                </linearGradient>

                {/* 펀칭 구멍 안쪽 깊은 그림자 그라데이션 */}
                <linearGradient id={`hole-depth-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0F172A" />
                  <stop offset="50%" stopColor="#1E293B" />
                  <stop offset="100%" stopColor="#090D16" />
                </linearGradient>
              </defs>

              {/* 1. 펀칭 구멍 (왼쪽 책등 구멍 & 오른쪽 지면 구멍) */}
              {/* 왼쪽 책등 쪽 구멍 */}
              <rect x="0.8" y="2.5" width="2.6" height="11" rx="1.3" fill={`url(#hole-depth-${i})`} />
              <rect x="0.8" y="2.5" width="2.6" height="11" rx="1.3" stroke="rgba(255,255,255,0.15)" strokeWidth="0.4" />

              {/* 오른쪽 지면 쪽 구멍 */}
              <rect x="20.2" y="2.5" width="3.2" height="11" rx="1.6" fill={`url(#hole-depth-${i})`} />
              {/* 종이 단면 두께를 표현하는 미세 엠보스 림 */}
              <path d="M 20.4 12 Q 21.8 13.8 23.2 12" stroke="rgba(255,255,255,0.45)" strokeWidth="0.6" strokeLinecap="round" fill="none" />

              {/* 2. 지면에 떨어지는 철사 그림자 (Drop Shadow) */}
              <path
                d="M 2.2 8.5 C 7.5 3.8, 17 4.8, 21.8 9.2"
                stroke="rgba(0,0,0,0.28)"
                strokeWidth="3.2"
                strokeLinecap="round"
                fill="none"
                transform="translate(0.6, 1.2)"
              />

              {/* 3. 스테인리스 스틸 와이어 본체 */}
              <path
                d="M 2.2 8.2 C 7.5 3.5, 17 4.5, 21.8 8.8"
                stroke={`url(#stainless-wire-${i})`}
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />

              {/* 4. 최상단 백색 광택 하이라이트 (Specular Sheen) */}
              <path
                d="M 3.8 7.2 C 8.5 3.3, 16 4.1, 20.2 7.6"
                stroke="#FFFFFF"
                strokeWidth="0.85"
                strokeLinecap="round"
                fill="none"
                opacity="0.95"
              />

              {/* 5. 펀칭 구멍 속으로 철사가 들어가는 뎁스 오버레이 (관통 입체감) */}
              <path
                d="M 20.2 3.5 C 20.2 2.5, 23.4 2.5, 23.4 3.5 L 23.4 9.5 C 22.8 9, 20.8 9, 20.2 9.5 Z"
                fill="rgba(15,23,42,0.45)"
              />
            </svg>
          </div>
        ))}
      </div>

      {/* 다이어리 세로 책등 바인더 가죽 홈 및 그림자 장식 (스프링 링 뒤쪽에 입체감을 더해 시각적 짤림 보정) */}
      <div 
        className={`absolute left-0 top-0 bottom-0 w-5 bg-gradient-to-r ${
          theme === "sage"
            ? "from-[#1F3324]/15 via-[#1F3324]/3 to-transparent border-r border-[#1F3324]/10"
            : theme === "sepia"
            ? "from-black/20 via-[#231710]/5 to-transparent border-r border-[#231710]/15"
            : theme === "dark"
            ? "from-black/40 via-black/10 to-transparent border-r border-black/30"
            : "from-black/15 via-black/2 to-transparent border-r border-black/5"
        } z-20 pointer-events-none transition-all duration-300`}
      />

      {/* 내부 콘텐츠 (메모 종이 영역) */}
      <div
        style={{
          fontSize: `${fontSize}px`,
          ...getGridStyle(),
        }}
        className={`flex-1 w-full min-w-0 flex flex-col pl-8.5 pr-1.5 pt-3 pb-2 overflow-auto scrollbar-thin transition-colors duration-300 ${THEME_CLASSES[theme]} ${FONT_CLASSES[font]}`}
      >
        {children}
      </div>
    </div>
  );
}

