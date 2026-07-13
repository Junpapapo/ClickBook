import { BUDDY_STYLES } from "./buddy-styles";
import { getBuddyState, subscribeBuddyState, updateBuddyState } from "./buddy-state";
import { detectRadialDirection, isContextInvalidated, getFrameUrl } from "./buddy-utils";
import { initLang } from "./i18n";

import { createBuddyCharacter } from "./components/buddy-character";
import { createRadialMenu, updateRadialMenuState } from "./components/radial-menu";
import { createBuddyPanel } from "./components/buddy-panel";
import { initToast, resetToast } from "./components/buddy-toast";
import { initDragActions } from "./components/drag-actions";

const ROOT_ID = "clickbook-buddy-root";
let hostElement: HTMLElement | null = null;
let shadowRoot: ShadowRoot | null = null;

export function injectBuddySystem(): void {
  // 중복 주입 차단
  if (document.getElementById(ROOT_ID)) {
    return;
  }

  // i18n 언어 초기 설정
  initLang();

  // Shadow Host 생성 및 문서 바디에 삽입
  hostElement = document.createElement("div");
  hostElement.id = ROOT_ID;
  
  // closed Shadow DOM 사용으로 스타일 완벽 격리
  shadowRoot = hostElement.attachShadow({ mode: "closed" });
  
  // 스타일시트 마운트
  const styleTag = document.createElement("style");
  styleTag.textContent = BUDDY_STYLES;
  shadowRoot.appendChild(styleTag);

  // 동적 @keyframes 애니메이션 스타일 생성 및 마운트 (자바스크립트 setInterval 애니메이션 완전 대체)
  try {
    const buddyIds = [
      // Basic (13종)
      "bsprout", "bydragon", "cat", "cotton", "curobot", "fox", "owl", "penguin", "rabbit", "shroom", "star", "xcafe", "xcloud",
      // Premium (18종)
      "astrobot", "corgi", "dog", "dragon", "fairy", "fennec", "jellyfish", "nebula", "ufo", "unicorn", "wizard", "sprout", "chef", "p_cat", "p_fox", "p_owl", "p_penguin", "p_rabbit",
      // Hidden (17종)
      "blue_dragon", "cactus", "h_chef", "cloud", "cupcake", "dino", "frosty", "ghost", "hamster", "hedgehog", "otter", "panda", "penguin_blue_hat", "red_panda", "sky_dragon", "sprout_fairy", "witchy"
    ];
    let keyframesCss = "";
    for (const id of buddyIds) {
      const frame1 = getFrameUrl(id, 1);
      const frame2 = getFrameUrl(id, 2);
      const frame3 = getFrameUrl(id, 3);
      
      keyframesCss += `
        @keyframes play-buddy-${id} {
          0% { content: url('${frame1}'); }
          33.33% { content: url('${frame2}'); }
          66.66% { content: url('${frame3}'); }
          100% { content: url('${frame1}'); }
        }
      `;
    }
    const keyframesStyle = document.createElement("style");
    keyframesStyle.id = "buddy-dynamic-keyframes";
    keyframesStyle.textContent = keyframesCss;
    shadowRoot.appendChild(keyframesStyle);
  } catch (e) {
    console.warn("[Buddy Injector] Failed to generate dynamic keyframes CSS:", e);
  }

  // 커스텀 토스트 알림 구조체 생성
  initToast(shadowRoot);

  // 캐릭터 DOM 생성 및 추가
  const buddyContainer = createBuddyCharacter(shadowRoot);
  shadowRoot.appendChild(buddyContainer);

  // 래디얼 메뉴 DOM 생성
  createRadialMenu(shadowRoot, buddyContainer);

  // 플로팅 카드 패널 DOM 생성
  const panel = createBuddyPanel(shadowRoot);
  shadowRoot.appendChild(panel);

  // 드래그 블록 요약/번역/학습 액션 초기화
  initDragActions(shadowRoot, buddyContainer);

  document.body.appendChild(hostElement);

  // 윈도우 스크롤 또는 리사이즈 시 래디얼/패널 닫기 (UX 완성도 향상)
  // 단, 패널 내부 스크롤바 조작 시 오동작하여 닫히는 현상 방지
  const closeAllOnNav = (e?: Event) => {
    if (e && e.target && e.target !== document && e.target !== window) {
      return;
    }
    const s = getBuddyState();
    if (s.isMenuOpen || s.activePanel) {
      updateBuddyState({ isMenuOpen: false, activePanel: null });
    }
  };

  let lastWidth = window.innerWidth;
  let lastHeight = window.innerHeight;

  const handleResize = () => {
    if (window.innerWidth === lastWidth && window.innerHeight === lastHeight) {
      return;
    }
    lastWidth = window.innerWidth;
    lastHeight = window.innerHeight;

    closeAllOnNav();
    const s = getBuddyState();
    if (s.config) {
      updateBuddyState({ config: { ...s.config } });
    }
  };

  window.addEventListener("resize", handleResize);

  // 상태 구독 연동
  const unsubscribe = subscribeBuddyState((s) => {
    if (!s.config) return;

    // 패널 활성화 시 캐릭터 이미지 숨김을 유도하는 클래스 토글
    if (s.activePanel) {
      buddyContainer.classList.add("panel-open");
    } else {
      buddyContainer.classList.remove("panel-open");
    }

    // 테마 클래스 적용 (기존 테마 클래스들 제거 후 적용)
    const currentTheme = s.config.theme || "midnight";
    const themes = ["theme-midnight", "theme-cozy", "theme-sky", "theme-sweet", "theme-fresh", "theme-carbon", "theme-cyber"];
    themes.forEach(t => {
      buddyContainer.classList.remove(t);
      panel.classList.remove(t);
    });
    buddyContainer.classList.add(`theme-${currentTheme}`);
    panel.classList.add(`theme-${currentTheme}`);

    // 투명도 및 표시 여부 적용
    buddyContainer.style.opacity = s.isDragging ? "0.7" : String(s.config.opacity);
    buddyContainer.style.width = `${s.config.size}px`;
    buddyContainer.style.height = `${s.config.size}px`;

    // 위치 갱신 (저장된 % 좌표를 뷰포트 크기에 비례한 물리 px로 환산하여 렌더링)
    if (!s.isDragging) {
      const availWidth = window.innerWidth - s.config.size;
      const availHeight = window.innerHeight - s.config.size;
      const xPx = (s.config.position.x / 100) * Math.max(0, availWidth);
      const yPx = (s.config.position.y / 100) * Math.max(0, availHeight);

      buddyContainer.style.left = `${xPx}px`;
      buddyContainer.style.top = `${yPx}px`;
      buddyContainer.style.transform = "none";
    }

    // 4사분면 래디얼 메뉴 갱신
    const dir = detectRadialDirection(s.config.position.x, s.config.position.y);
    updateRadialMenuState(s, dir);
  });

  // 언어 변경 감지 시 상태 갱신 및 리렌더링 유도
  const handleLangChanged = () => {
    const s = getBuddyState();
    if (s.config) {
      updateBuddyState({ config: { ...s.config } });
    }
  };
  window.addEventListener("buddy-lang-changed", handleLangChanged);

  // 전역 청소 헬퍼 연결
  (hostElement as any).__cleanupBuddy = () => {
    unsubscribe();
    window.removeEventListener("resize", handleResize);
    window.removeEventListener("buddy-lang-changed", handleLangChanged);
  };
}

export function removeBuddySystem(): void {
  const root = document.getElementById(ROOT_ID);
  if (root) {
    if (typeof (root as any).__cleanupBuddy === "function") {
      (root as any).__cleanupBuddy();
    }
    root.remove();
  }
  hostElement = null;
  shadowRoot = null;
  resetToast();
}

export function getBuddyShadowRoot(): ShadowRoot | null {
  return shadowRoot;
}
