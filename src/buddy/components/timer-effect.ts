import { t } from "../i18n";
import { getBuddyState } from "../buddy-state";

export async function triggerTimerCompleteEffect(shadow: ShadowRoot, message: string, isRestMode = false, overrideTheme?: string): Promise<void> {
  if (shadow.getElementById("buddy-timer-complete-overlay")) return;

  const s = getBuddyState();
  let currentTheme = overrideTheme || s.config?.timerCompleteTheme || "night";

  // 성공 스토리 랜덤 분기
  if (currentTheme === "comic_random") {
    const list = ["comic1", "comic2", "comic3", "comic4", "comic5", "comic6", "comic7", "comic8", "comic9", "comic10", "comic11", "comic12", "comic13", "comic14", "comic15", "comic16", "comic17", "comic18"];
    currentTheme = list[Math.floor(Math.random() * list.length)] as any;
  }

  // 랜덤 처리 (만화 테마도 확률에 포함, 신규 테마 gallery/breath도 포함)
  if (currentTheme === "random") {
    const list = ["night", "forest", "ocean", "fireplace", "sunset", "yoga", "gallery", "breath", "comic1", "comic2", "comic3", "comic4", "comic5", "comic6", "comic7", "comic8", "comic9", "comic10"];
    currentTheme = list[Math.floor(Math.random() * list.length)] as any;
  }

  const overlay = document.createElement("div");
  overlay.id = "buddy-timer-complete-overlay";
  overlay.className = `timer-complete-overlay theme-${currentTheme}`;

  // 동적 스타일 추가
  const styleEl = document.createElement("style");
  styleEl.textContent = `
    .timer-complete-overlay {
      position: fixed;
      inset: 0;
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      overflow: hidden;
      transition: opacity 0.5s ease;
    }
    .timer-complete-overlay.fade-out {
      opacity: 0;
    }
    .timer-complete-overlay.theme-night {
      background: radial-gradient(circle at center, #0d1527 0%, #030712 100%);
    }
    .timer-complete-overlay.theme-forest {
      background: linear-gradient(to top, #011611 0%, #032d22 30%, #043e30 65%, #0d1e2e 100%);
    }
    .timer-complete-overlay.theme-forest::before {
      content: "";
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at center, rgba(16, 185, 129, 0.12) 0%, rgba(0, 0, 0, 0) 80%);
      pointer-events: none;
      animation: forest-ambient-glow 6s infinite alternate ease-in-out;
    }
    @keyframes forest-ambient-glow {
      0% { opacity: 0.5; }
      100% { opacity: 1; }
    }
    .timer-complete-overlay.theme-ocean {
      background: radial-gradient(circle at center, #0c4a6e 0%, #082f49 100%);
    }
    .timer-complete-overlay.theme-fireplace {
      background: #050100;
    }
    .timer-complete-overlay.theme-fireplace::before {
      content: "";
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at bottom, rgba(234, 88, 12, 0.3) 0%, rgba(13, 4, 1, 0.8) 60%, rgba(5, 1, 0, 1) 100%);
      pointer-events: none;
      animation: hearth-ambient-glow 4s infinite alternate ease-in-out;
    }
    @keyframes hearth-ambient-glow {
      0% { opacity: 0.65; }
      100% { opacity: 1; }
    }
    .timer-complete-overlay.theme-sunset {
      background: linear-gradient(to top, #ff7e5f 0%, #feb47b 20%, #764ba2 60%, #150f29 100%);
    }
    .timer-complete-overlay.theme-comic1,
    .timer-complete-overlay.theme-comic2,
    .timer-complete-overlay.theme-comic3,
    .timer-complete-overlay.theme-comic4,
    .timer-complete-overlay.theme-comic5,
    .timer-complete-overlay.theme-comic6,
    .timer-complete-overlay.theme-comic7,
    .timer-complete-overlay.theme-comic8,
    .timer-complete-overlay.theme-comic9,
    .timer-complete-overlay.theme-comic10 {
      background: radial-gradient(circle at center, #0d0c1d 0%, #020205 100%);
    }

    .complete-card {
      background: rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 20px;
      padding: 32px 24px;
      width: 290px;
      text-align: center;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
      z-index: 10;
      color: #fff;
      transform: scale(0.9);
      opacity: 0;
      animation: complete-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
    @keyframes complete-pop {
      to { transform: scale(1); opacity: 1; }
    }

    /* Comic Completed Theme Styles */
    .comic-scene-container {
      position: absolute;
      inset: 0;
      margin: auto; /* 상하좌우 정중앙 정렬 */
      width: 92%;
      height: 92%;
      max-width: 1400px; /* 더 넓고 웅장한 가로폭 상한선 확보 */
      max-height: 90vh;  /* 브라우저 세로 높이 안에서 잘리지 않도록 상한 확보 */
      pointer-events: none;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1;
      background-color: #ffffff; /* 흰색 프레임 배경 제공 */
      border: 6px solid #ffffff; /* 만화책 흰색 외각 테두리 */
      border-radius: 12px;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.85), 0 0 40px rgba(255, 255, 255, 0.05); /* 웅장한 입체 그림자 */
      overflow: hidden; /* 모서리 라운딩 영역 내로 이미지 컷 제한 */
    }
    .comic-scene {
      width: 100%;
      height: 100%;
      background-size: 100% 100%;
      background-position: center;
      background-repeat: no-repeat;
      image-rendering: -webkit-optimize-contrast; /* 크롬 스케일업 확대 시 픽셀 선명도 방어 */
      image-rendering: crisp-edges;
      
      /* 초기 흐릿하고 약간 축소된 흑백 상태 */
      filter: blur(20px) grayscale(85%);
      transform: scale(0.98);
      opacity: 0;
      
      /* 블러 걷힘 + 켄 번즈 카메라 무빙 병렬 연출 */
      animation: comic-fade-blur-in 1.0s cubic-bezier(0.25, 1, 0.5, 1) forwards,
                 comic-ken-burns 14s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite alternate;
      animation-delay: 0.2s, 1.2s; /* 스르륵 걷힌 후 서서히 카메라 무빙 돌입 */
    }
    @keyframes comic-fade-blur-in {
      to {
        filter: blur(0px) grayscale(0%);
        transform: scale(1.02);
        opacity: 1;
      }
    }
    @keyframes comic-ken-burns {
      0% {
        transform: scale(1.02) translate(0%, 0%);
      }
      100% {
        transform: scale(1.10) translate(-1.5%, -1%);
      }
    }
    .comic-aurora-bg {
      position: absolute;
      inset: -60px; /* 블러 필터에 의한 외곽 흰색 번짐 차단 */
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      filter: blur(70px) saturate(200%) brightness(35%);
      z-index: 0;
      opacity: 0;
      animation: comic-aurora-fade-in 1.5s ease-out forwards;
      pointer-events: none;
    }
    @keyframes comic-aurora-fade-in {
      to { opacity: 1; }
    }
    .comic-bokeh-container {
      position: absolute;
      inset: 0;
      overflow: hidden;
      z-index: 1;
      pointer-events: none;
    }
    .comic-bokeh-particle {
      position: absolute;
      bottom: -20px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0) 75%);
      animation: comic-bokeh-rise infinite linear;
    }
    @keyframes comic-bokeh-rise {
      0% {
        transform: translateY(0) translateX(0) scale(1);
        opacity: 0;
      }
      10% {
        opacity: var(--max-opacity, 0.25);
      }
      90% {
        opacity: var(--max-opacity, 0.25);
      }
      100% {
        transform: translateY(-110vh) translateX(var(--drift-x, 80px)) scale(1.3);
        opacity: 0;
      }
    }
    .complete-icon {
      font-size: 48px;
      margin-bottom: 12px;
      animation: complete-bounce 2s infinite ease-in-out;
    }
    @keyframes complete-bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }
    .complete-title {
      font-size: 18px;
      font-weight: 700;
      margin: 0 0 6px 0;
      color: #fff;
      word-break: keep-all;
    }
    .complete-subtitle {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.7);
      margin: 0 0 16px 0;
      line-height: 1.4;
      word-break: keep-all;
    }
    .complete-message {
      background: rgba(0, 0, 0, 0.25);
      border-radius: 8px;
      padding: 10px;
      font-size: 11px;
      font-style: italic;
      margin-bottom: 20px;
      word-break: break-word;
      color: rgba(255, 255, 255, 0.9);
    }
    .complete-ok-btn {
      background: #fff;
      color: #030712;
      border: none;
      padding: 10px 24px;
      border-radius: 10px;
      font-weight: 700;
      cursor: pointer;
      font-size: 12px;
      transition: background-color 0.2s, transform 0.1s;
      width: 100%;
    }
    .complete-ok-btn:hover {
      background: rgba(255, 255, 255, 0.9);
      transform: translateY(-1px);
    }
    .complete-ok-btn:active {
      transform: translateY(0);
    }

    /* Night Starry System */
    .constellations-svg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }
    .constellation-line {
      stroke: rgba(255, 255, 255, 0.15);
      stroke-width: 1;
      stroke-dasharray: 4 2;
    }
    .constellation-star-node {
      fill: #fff;
      filter: drop-shadow(0 0 4px rgba(255,255,255,0.8));
    }
    .stars-container {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
    .star {
      position: absolute;
      background: #fff;
      border-radius: 50%;
      animation: star-twinkle var(--twinkle-duration) ease-in-out var(--twinkle-delay) infinite alternate;
    }
    @keyframes star-twinkle {
      0% { opacity: 0.2; transform: scale(0.8); }
      100% { opacity: 1; transform: scale(1.2); }
    }
    .glitter-star {
      background: radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 70%);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .flare-h, .flare-v {
      position: absolute;
      background: rgba(255, 255, 255, 0.7);
    }
    .flare-h { width: 100%; height: 25%; }
    .flare-v { width: 25%; height: 100%; }

    .shooting-stars-container {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
    .shooting-star {
      position: absolute;
      height: 1.5px;
      background: linear-gradient(-45deg, #fff, rgba(0, 0, 244, 0));
      filter: drop-shadow(0 0 6px #fff);
      animation: shoot var(--shoot-duration) ease-in-out infinite;
      transform: rotate(-45deg);
      opacity: 0;
    }
    .shooting-star.normal { width: 80px; }
    .shooting-star.large { width: 150px; height: 2.5px; }
    @keyframes shoot {
      0% { transform: rotate(-45deg) translateX(0); opacity: 0; }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { transform: rotate(-45deg) translateX(-400px); opacity: 0; }
    }

    /* Forest Firefly & Leaf System */
    .forest-trees {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 220px;
      pointer-events: none;
      z-index: 2; /* 빛줄기 위에 그리도록 z-index 올림 */
      transform-origin: bottom center;
      overflow: visible !important;
    }
    /* 숲속 달빛 사선 빛줄기 */
    .forest-light-rays {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 1;
    }
    .forest-light-ray {
      position: absolute;
      top: -30%;
      width: 180px;
      height: 160%;
      background: linear-gradient(to bottom, rgba(52, 211, 153, 0.08) 0%, rgba(52, 211, 153, 0) 80%);
      transform: rotate(-30deg);
      transform-origin: top left;
      animation: forest-ray-shimmer var(--ray-duration) ease-in-out var(--ray-delay) infinite alternate;
    }
    @keyframes forest-ray-shimmer {
      0% { opacity: 0.2; transform: rotate(-31deg) scaleX(0.85); }
      100% { opacity: 0.8; transform: rotate(-28deg) scaleX(1.15); }
    }
    @keyframes forest-sway {
      0% { transform: skewX(-1deg) scaleY(1); }
      100% { transform: skewX(1deg) scaleY(1.03); }
    }
    .forest-fireflies {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
    /* 반딧불이: 수직 상승 제거하고 제자리 부유 및 깜빡임 연출 */
    .firefly {
      position: absolute;
      background: rgba(163, 230, 53, 0.65);
      box-shadow: 0 0 10px rgba(163, 230, 53, 0.85);
      border-radius: 50%;
      animation: firefly-hover var(--float-duration) ease-in-out var(--float-delay) infinite alternate;
      opacity: 0.1;
    }
    @keyframes firefly-hover {
      0% { transform: translate(0, 0) scale(0.7); opacity: 0.2; }
      50% { transform: translate(var(--x-drift), var(--y-drift)) scale(1.2); opacity: 0.9; }
      100% { transform: translate(calc(var(--x-drift) * 1.8), calc(var(--y-drift) * 0.5)) scale(0.8); opacity: 0.3; }
    }
    /* 나뭇잎: 대각선 흔들림 하강 */
    .leaf {
      position: absolute;
      pointer-events: none;
      animation: leaf-fall var(--fall-duration) linear var(--fall-delay) infinite;
    }
    @keyframes leaf-fall {
      0% {
        transform: translateY(-5vh) translateX(0) rotate(0deg);
        opacity: 0;
      }
      10% {
        opacity: 1;
      }
      90% {
        opacity: 1;
      }
      100% {
        transform: translateY(105vh) translateX(var(--x-drift)) rotate(var(--r-spin));
        opacity: 0;
      }
    }

    /* Ocean Bubble & Wave & Ray System */
    .ocean-bubbles {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
    /* 물기포: 파도의 너울에 밀리며 물속을 둥둥 헤엄치듯 좌우로 휩쓸리며 대각선 상승 */
    .bubble {
      position: absolute;
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 50%;
      animation: bubble-wave-rise var(--rise-duration) ease-in-out var(--rise-delay) infinite;
      opacity: 0;
    }
    @keyframes bubble-wave-rise {
      0% { transform: translateY(110vh) translateX(0) scale(0.3); opacity: 0; }
      10% { opacity: 0.6; }
      45% { transform: translateY(60vh) translateX(calc(var(--x-wobble) * 1.4)) scale(1.1); }
      80% { transform: translateY(20vh) translateX(calc(var(--x-wobble) * 0.4)) scale(1.6); opacity: 0.6; }
      100% { transform: translateY(-5vh) translateX(var(--x-wobble)) scale(2.6); opacity: 0; border-width: 0.5px; background: transparent; }
    }
    .ocean-waves {
      position: absolute;
      bottom: -10px;
      left: 0;
      width: 100%;
      height: 150px;
      pointer-events: none;
      z-index: 1;
    }
    .wave-g {
      animation: move-forever 15s cubic-bezier(.55,.5,.45,.5) infinite;
    }
    .wave-g-1 {
      animation-delay: -2s;
      animation-duration: 7s;
    }
    .wave-g-2 {
      animation-delay: -3s;
      animation-duration: 10s;
    }
    .wave-g-3 {
      animation-delay: -4s;
      animation-duration: 13s;
    }
    .wave-g-4 {
      animation-delay: -5s;
      animation-duration: 20s;
    }
    @keyframes move-forever {
      0% { transform: translate3d(-90px,0,0); }
      100% { transform: translate3d(85px,0,0); }
    }
    /* 심해 사선 빛줄기 */
    .ocean-light-rays {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
    .ocean-light-ray {
      position: absolute;
      top: -20%;
      width: 150px;
      height: 150%;
      background: linear-gradient(to bottom, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 80%);
      transform: rotate(-25deg);
      transform-origin: top left;
      animation: ray-shimmer var(--ray-duration) ease-in-out var(--ray-delay) infinite alternate;
    }
    @keyframes ray-shimmer {
      0% { opacity: 0.15; transform: rotate(-26deg) scaleX(0.85); }
      100% { opacity: 0.7; transform: rotate(-22deg) scaleX(1.15); }
    }

    /* 바다 생물 (물고기, 고래) 애니메이션 */
    .ocean-creatures {
      position: absolute;
      inset: 0;
      pointer-events: none;
      overflow: hidden;
      z-index: 2;
    }
    .ocean-creature {
      position: absolute;
      user-select: none;
      pointer-events: none;
      opacity: 0;
    }
    .ocean-creature.swim-right {
      animation: swim-x-right var(--swim-duration) linear var(--swim-delay) infinite;
    }
    .ocean-creature.swim-left {
      animation: swim-x-left var(--swim-duration) linear var(--swim-delay) infinite;
    }
    @keyframes swim-x-right {
      0% { left: -100px; opacity: 0; }
      10% { opacity: 0.75; }
      90% { opacity: 0.75; }
      100% { left: calc(100vw + 100px); opacity: 0; }
    }
    @keyframes swim-x-left {
      0% { left: calc(100vw + 100px); opacity: 0; }
      10% { opacity: 0.75; }
      90% { opacity: 0.75; }
      100% { left: -100px; opacity: 0; }
    }

    /* 자식 생물 바디 모션 */
    .creature-body {
      display: inline-block;
      transition: transform 0.2s ease;
    }
    .ocean-creature.swim-right .creature-body {
      transform: scaleX(-1);
      transform-origin: center right; /* 우향 유영 시 머리(우측)를 회전축으로 */
    }
    .ocean-creature.swim-left .creature-body {
      transform: scaleX(1);
      transform-origin: center left; /* 좌향 유영 시 머리(좌측)를 회전축으로 */
    }

    /* 일반 물고기: 위아래로 꿀렁꿀렁 (자연스러운 파형 유영) */
    .ocean-creature:not(.whale) .creature-body {
      animation: fish-swim-action 2.0s ease-in-out infinite;
    }
    @keyframes fish-swim-action {
      0%, 100% {
        transform: scaleX(var(--creature-scale-x, 1)) translateY(-15px) rotate(-6deg);
      }
      50% {
        transform: scaleX(var(--creature-scale-x, 1)) translateY(15px) rotate(6deg);
      }
    }
    .ocean-creature.swim-right:not(.whale) .creature-body {
      --creature-scale-x: -1;
    }

    /* 고래: 꼬리를 꿀렁이며 찰랑찰랑 꼬리치기 */
    .ocean-creature.whale .creature-body {
      animation: whale-swim-action 3.2s ease-in-out infinite;
    }
    @keyframes whale-swim-action {
      0%, 100% {
        transform: scaleX(var(--creature-scale-x, 1)) translateY(-8px) rotate(-4deg) skewY(-3deg) scaleY(0.95);
      }
      50% {
        transform: scaleX(var(--creature-scale-x, 1)) translateY(8px) rotate(4deg) skewY(3deg) scaleY(1.05);
      }
    }
    .ocean-creature.swim-right.whale .creature-body {
      --creature-scale-x: -1;
    }

    /* Fireplace Ember & Fire System */
    .fireplace-bg-svg {
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 100%;
      max-width: 800px;
      height: 220px;
      pointer-events: none;
      z-index: 2;
    }
    .fireplace-embers {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 3;
    }
    /* 불씨: 상승 기류의 와류(Swirling)를 모사하여 소용돌이치듯 좌우로 굽이치며 흔들려 상승 */
    .ember {
      position: absolute;
      border-radius: 50%;
      animation: ember-swirl var(--rise-duration) ease-out var(--rise-delay) infinite;
      opacity: 0;
    }
    @keyframes ember-swirl {
      0% { transform: translateY(105vh) translateX(0) scale(0.6); opacity: 1; }
      35% { transform: translateY(65vh) translateX(calc(var(--x-drift) * 0.7 + 35px)) scale(1.1); }
      70% { transform: translateY(35vh) translateX(calc(var(--x-drift) * 0.3 - 35px)) scale(1.3); }
      100% { transform: translateY(10vh) translateX(var(--x-drift)) scale(1.5); opacity: 0; }
    }
    /* 3단계 불꽃 일렁임 애니메이션 */
    .flame-outer {
      fill: #ea580c;
      filter: blur(4px) drop-shadow(0 0 12px #ea580c);
      transform-origin: bottom center;
      animation: flame-wag-outer 2.5s infinite alternate ease-in-out;
    }
    .flame-medium {
      fill: #f97316;
      filter: blur(2px) drop-shadow(0 0 8px #f97316);
      transform-origin: bottom center;
      animation: flame-wag-medium 1.8s infinite alternate-reverse ease-in-out;
    }
    .flame-inner {
      fill: #fef08a;
      filter: blur(1px) drop-shadow(0 0 6px #fef08a);
      transform-origin: bottom center;
      animation: flame-wag-inner 1.2s infinite alternate ease-in-out;
    }

    @keyframes flame-wag-outer {
      0% { transform: scale(0.95) rotate(-2deg) skewX(-2deg); }
      50% { transform: scale(1.05) rotate(1deg) skewX(2deg); }
      100% { transform: scale(0.98) rotate(-1deg) skewX(-1deg); }
    }
    @keyframes flame-wag-medium {
      0% { transform: scale(1.02) rotate(1deg) skewX(1deg); }
      50% { transform: scale(0.95) rotate(-2deg) skewX(-2deg); }
      100% { transform: scale(1.08) rotate(2deg) skewX(3deg); }
    }
    @keyframes flame-wag-inner {
      0% { transform: scale(0.9) scaleY(0.95) rotate(-1deg); }
      50% { transform: scale(1.1) scaleY(1.05) rotate(1deg); }
      100% { transform: scale(0.95) scaleY(1.0) rotate(0deg); }
    }

    /* 장작 속 불씨(Ember)가 이글거리는 효과 */
    .wood-glow {
      fill: #f97316;
      filter: drop-shadow(0 0 8px #ea580c);
      animation: ember-breathe 3s infinite alternate ease-in-out;
    }
    @keyframes ember-breathe {
      0% { opacity: 0.45; }
      100% { opacity: 0.95; }
    }
    @keyframes fire-glow {
      0% { opacity: 0.6; transform: scale(0.95); }
      100% { opacity: 1; transform: scale(1.05); }
    }

    /* Sunset Mountain & Bird & Sun System */
    .sunset-mountains {
      position: absolute;
      bottom: -5px;
      left: 0;
      width: 100%;
      height: 150px;
      pointer-events: none;
      z-index: 2; /* 태양 뒤로 가리기 위해 z-index 조정 */
    }
    .sunset-sun {
      position: absolute;
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: radial-gradient(circle, #fffdeb 20%, #fdba74 60%, #f97316 100%);
      filter: drop-shadow(0 0 35px rgba(253, 186, 116, 0.8));
      pointer-events: none;
      z-index: 1;
      animation: sun-down 8s cubic-bezier(0.1, 0.8, 0.25, 1) forwards;
      left: calc(50% - 60px);
    }
    @keyframes sun-down {
      0% { transform: translateY(-120px); opacity: 0.9; }
      100% { transform: translateY(180px); opacity: 0.85; }
    }
    .sunset-clouds-container {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 1;
    }
    .sunset-cloud {
      position: absolute;
      filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.08)) blur(0.5px);
      animation: cloud-drift var(--drift-duration) linear var(--drift-delay) infinite;
      left: -250px;
    }
    @keyframes cloud-drift {
      0% { transform: translateX(0); }
      100% { transform: translateX(calc(100vw + 350px)); }
    }
    .sunset-birds-container {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 3;
    }
    .sunset-bird {
      position: absolute;
      fill: rgba(251, 113, 133, 0.35);
      pointer-events: none;
      left: -50px;
      animation: bird-fly var(--fly-duration) linear var(--fly-delay) infinite;
    }
    .bird-path {
      animation: bird-wing 0.45s ease-in-out infinite alternate;
      transform-origin: 10px 5px;
    }
    @keyframes bird-fly {
      0% { transform: translate(0, 0); }
      100% { transform: translate(110vw, var(--y-drift)); }
    }
    @keyframes bird-wing {
      0% { transform: scaleY(0.3); }
      100% { transform: scaleY(1.1); }
    }
    /* 노을빛 대각 낙하 빛가루 */
    .sunset-dusts {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
    .sunset-dust {
      position: absolute;
      border-radius: 50%;
      filter: blur(0.5px);
      animation: dust-fall var(--fall-duration) linear var(--fall-delay) infinite;
      opacity: 0;
    }
    @keyframes dust-fall {
      0% { transform: translateY(-5vh) translateX(0) scale(0.8); opacity: 0; }
      15% { opacity: 0.6; }
      85% { opacity: 0.6; }
      100% { transform: translateY(105vh) translateX(var(--x-drift)) scale(1.3); opacity: 0; }
    }

    /* 성공스토리 한정 배너형 카드 */
    [class*="theme-comic"] .complete-card {
      position: absolute;
      top: 24px;
      width: 92%;
      max-width: 640px;
      padding: 12px 20px;
      border-radius: 16px;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      text-align: left;
      z-index: 100;
      transform: translateY(-20px) scale(0.95);
      animation: complete-pop-down 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
    @keyframes complete-pop-down {
      to { transform: translateY(0) scale(1); opacity: 1; }
    }
    .complete-card-content {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
      min-width: 0;
    }
    .complete-card-icon-wrap {
      font-size: 28px;
      flex-shrink: 0;
    }
    .complete-card-text-wrap {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }
    .complete-card-text-wrap .complete-title {
      font-size: 14px;
      margin: 0;
      font-weight: 700;
      color: #fff;
    }
    .complete-card-text-wrap .complete-sub {
      font-size: 11px;
      margin: 0;
      color: rgba(255, 255, 255, 0.85);
      line-height: 1.3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .complete-card-close-btn {
      flex-shrink: 0;
      margin: 0 !important;
      padding: 6px 14px !important;
      width: auto !important;
      font-size: 11px !important;
      white-space: nowrap;
    }

    /* 요가 & 명상(Zen) 테마 전용 스타일 (초고화질 젠가든 전체화면 일러스트 + 호흡 펄스) */
    .timer-complete-overlay.theme-yoga {
      align-items: flex-start;
      padding-top: 10vh;
    }

    .yoga-scene-aurora {
      position: absolute;
      inset: -50px;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      filter: blur(80px) saturate(160%) brightness(30%);
      z-index: 0;
      opacity: 0;
      animation: yoga-aurora-glow-fade 2.2s ease-out forwards;
      pointer-events: none;
    }
    @keyframes yoga-aurora-glow-fade {
      to { opacity: 0.95; }
    }

    .yoga-fullscreen-scene {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      z-index: 1;
      opacity: 0;
      animation: yoga-scene-fade-in 1.8s ease-out forwards;
      pointer-events: none;
    }
    @keyframes yoga-scene-fade-in {
      to { opacity: 1; }
    }

    /* 요가 가부좌 위치에 매칭되어 펄싱하는 차크라 글로우 호흡 가이드 */
    .yoga-chakra-breathing {
      position: absolute;
      left: 50%;
      top: 61%; /* 와이드 명상 일러스트의 요가인 물결 바위 위치 */
      transform: translate(-50%, -50%) scale(1);
      width: 320px;
      height: 320px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(167, 139, 250, 0.45) 0%, rgba(251, 191, 36, 0.15) 45%, rgba(0, 0, 0, 0) 70%);
      z-index: 2;
      pointer-events: none;
      animation: yoga-chakra-breathing-pulse 12s ease-in-out infinite, yoga-chakra-color-shift 8s ease-in-out infinite alternate;
    }
    @keyframes yoga-chakra-breathing-pulse {
      0%, 100% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.55; }
      33% { transform: translate(-50%, -50%) scale(1.15); opacity: 0.95; filter: drop-shadow(0 0 15px rgba(167,139,250,0.4)); }
      66% { transform: translate(-50%, -50%) scale(1.15); opacity: 0.95; filter: drop-shadow(0 0 15px rgba(167,139,250,0.4)); }
    }
    @keyframes yoga-chakra-color-shift {
      0% {
        background: radial-gradient(circle, rgba(167, 139, 250, 0.45) 0%, rgba(251, 191, 36, 0.15) 45%, rgba(0,0,0,0) 70%);
      }
      100% {
        background: radial-gradient(circle, rgba(96, 165, 250, 0.55) 0%, rgba(52, 211, 153, 0.25) 45%, rgba(0,0,0,0) 70%);
      }
    }

    /* 몽환적으로 흐르는 호수 물안개 */
    .yoga-mist-overlay {
      position: absolute;
      width: 200%;
      height: 180px;
      bottom: 40px;
      left: -50%;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0) 75%);
      filter: blur(28px);
      z-index: 2;
      pointer-events: none;
      animation: yoga-mist-drift-wide 28s linear infinite alternate;
    }
    @keyframes yoga-mist-drift-wide {
      0% { transform: translateX(-25%); }
      100% { transform: translateX(5%); }
    }

    /* 둥실 떠오르며 별빛처럼 황홀하게 반짝거리는 반딧불이(Firefly) 젠 입자 */
    .yoga-zen-particles {
      position: absolute;
      inset: 0;
      z-index: 3;
      pointer-events: none;
      overflow: hidden;
    }
    .yoga-zen-particle {
      position: absolute;
      background: radial-gradient(circle, rgba(254, 240, 138, 0.95) 0%, rgba(254, 243, 199, 0.4) 40%, rgba(254, 240, 138, 0) 70%);
      box-shadow: 0 0 10px rgba(254, 240, 138, 0.8), 0 0 20px rgba(254, 240, 138, 0.4);
      border-radius: 50%;
      animation: yoga-zen-float-glow var(--float-duration) ease-in-out var(--float-delay) infinite;
    }
    @keyframes yoga-zen-float-glow {
      0%, 100% {
        transform: translateY(0) translateX(0) scale(0.65);
        opacity: 0.15;
      }
      35% {
        opacity: 0.95;
        transform: translateY(-90px) translateX(calc(var(--drift-x) * 0.4)) scale(1.15);
      }
      70% {
        opacity: 0.35;
        transform: translateY(-190px) translateX(calc(var(--drift-x) * 0.75)) scale(0.85);
      }
      100% {
        transform: translateY(-300px) translateX(var(--drift-x)) scale(0.5);
        opacity: 0;
      }
    }

    /* Gallery Theme Styles */
    .timer-complete-overlay.theme-gallery {
      background: #000;
      flex-direction: column;
    }
    .gallery-bg-image {
      position: absolute;
      inset: 0;
      width: 100vw;
      height: 100vh;
      object-fit: cover;
      object-position: center;
      opacity: 0;
      filter: brightness(0.68) contrast(1.05) blur(1.5px);
      transition: opacity 2s ease-in-out;
      z-index: 1;
      pointer-events: none;
    }
    .gallery-content-wrap {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      width: 80%;
      max-width: 800px;
      color: #ffffff;
      text-shadow: 0 4px 12px rgba(0,0,0,0.6);
      gap: 32px;
    }
    .gallery-clock {
      font-size: 96px;
      font-weight: 800;
      letter-spacing: -1px;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      animation: gallery-fade-in 1.2s ease-out forwards;
      background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #a1c4fd 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-shadow: none;
      filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.55));
    }
    .gallery-quote-card {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 24px 32px;
      border-radius: 16px;
      background: rgba(0, 0, 0, 0.12);
      backdrop-filter: blur(6px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      max-width: 600px;
      animation: gallery-fade-in 1.5s ease-out forwards;
      animation-delay: 0.3s;
      opacity: 0;
      transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease;
    }
    .gallery-quote-card:hover {
      transform: translateY(-4px) scale(1.02);
      background: rgba(255, 255, 255, 0.04);
      border-color: rgba(255, 255, 255, 0.2);
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
    }
    .gallery-quote-text {
      font-size: 18px;
      line-height: 1.6;
      font-weight: 400;
      font-family: Georgia, Cambria, "Times New Roman", Times, serif;
      font-style: italic;
      word-break: keep-all;
    }
    .gallery-quote-author {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.6);
      font-weight: 500;
      letter-spacing: 0.5px;
    }
    @keyframes gallery-fade-in {
      to { opacity: 1; transform: translateY(0); }
    }

    /* Breath Theme Styles */
    .timer-complete-overlay.theme-breath {
      background: radial-gradient(circle at center, #071330 0%, #020617 100%);
      flex-direction: column;
      overflow: hidden;
    }
    /* 움직이는 오로라 백그라운드 글로우 */
    .timer-complete-overlay.theme-breath::before,
    .timer-complete-overlay.theme-breath::after {
      content: "";
      position: absolute;
      width: 600px;
      height: 600px;
      border-radius: 50%;
      filter: blur(120px);
      opacity: 0.12;
      z-index: 1;
      pointer-events: none;
    }
    .timer-complete-overlay.theme-breath::before {
      background: radial-gradient(circle, #10b981 0%, transparent 70%);
      top: -10%;
      left: -10%;
      animation: breath-aurora-1 25s infinite alternate ease-in-out;
    }
    .timer-complete-overlay.theme-breath::after {
      background: radial-gradient(circle, #6366f1 0%, transparent 70%);
      bottom: -10%;
      right: -10%;
      animation: breath-aurora-2 25s infinite alternate ease-in-out;
    }
    @keyframes breath-aurora-1 {
      0% { transform: translate(0, 0) scale(1); }
      100% { transform: translate(200px, 150px) scale(1.3); }
    }
    @keyframes breath-aurora-2 {
      0% { transform: translate(0, 0) scale(1.2); }
      100% { transform: translate(-200px, -150px) scale(0.9); }
    }

    /* 은은하게 부유하는 스타 더스트 힐링 파티클 */
    .breath-dust {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.35);
      filter: blur(1px);
      z-index: 1;
      pointer-events: none;
      animation: breath-dust-float infinite linear;
    }
    @keyframes breath-dust-float {
      0% { transform: translateY(105vh) translateX(0); opacity: 0; }
      10% { opacity: 0.5; }
      90% { opacity: 0.5; }
      100% { transform: translateY(-5vh) translateX(var(--x-drift)); opacity: 0; }
    }

    .breath-content-wrap {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 40px;
    }
    .breath-circle-container {
      position: relative;
      width: 240px;
      height: 240px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .breath-circle-outer {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, rgba(99, 102, 241, 0.05) 70%);
      border: 1px solid rgba(16, 185, 129, 0.3);
      transform: scale(1);
      animation: breath-pulse 12s infinite ease-in-out;
    }
    
    /* 동심원 숨결 파동 */
    .breath-wave-ring {
      position: absolute;
      border-radius: 50%;
      border: 1px solid rgba(16, 185, 129, 0.25);
      background: transparent;
      inset: 0;
      z-index: 2;
      pointer-events: none;
      transform: scale(1);
      animation: breath-wave-pulse 12s infinite ease-in-out;
    }
    .breath-wave-ring.wave-delay-1 {
      animation-delay: -4s;
    }
    .breath-wave-ring.wave-delay-2 {
      animation-delay: -8s;
    }
    @keyframes breath-wave-pulse {
      0% { transform: scale(1); opacity: 0.8; border-color: rgba(16, 185, 129, 0.25); }
      33% { transform: scale(2.4); opacity: 0; border-color: rgba(99, 102, 241, 0); }
      66% { transform: scale(1); opacity: 0; }
      100% { transform: scale(1); opacity: 0.8; }
    }

    .breath-circle-inner {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(16, 185, 129, 0.6) 0%, rgba(99, 102, 241, 0.3) 100%);
      box-shadow: 0 0 40px rgba(16, 185, 129, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-weight: bold;
      font-size: 18px;
      letter-spacing: 1px;
      text-shadow: 0 0 8px rgba(255, 255, 255, 0.7);
      z-index: 3;
      transform: scale(1);
      animation: breath-pulse-inner 12s infinite ease-in-out;
    }
    .breath-guide-text {
      font-size: 24px;
      font-weight: 500;
      color: #ffffff;
      text-shadow: 0 2px 8px rgba(0,0,0,0.5);
      margin: 0;
      height: 36px;
    }
    .breath-sub-guide {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.6);
      margin: 0;
      max-width: 300px;
      text-align: center;
      line-height: 1.5;
    }
    @keyframes breath-pulse {
      0%, 100% { transform: scale(1); opacity: 0.3; }
      33% { transform: scale(1.6); opacity: 0.8; border-color: rgba(99, 102, 241, 0.5); }
      66% { transform: scale(1.6); opacity: 0.8; }
    }
    @keyframes breath-pulse-inner {
      0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(16, 185, 129, 0.3); }
      33% { transform: scale(1.4); box-shadow: 0 0 45px rgba(99, 102, 241, 0.6); }
      66% { transform: scale(1.4); box-shadow: 0 0 45px rgba(99, 102, 241, 0.6); }
    }
    
    /* Common rest mode elements */
    .rest-exit-guide-text {
      position: absolute;
      bottom: 40px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 12px;
      color: rgba(255, 255, 255, 0.4);
      letter-spacing: 0.5px;
      z-index: 999;
      pointer-events: none;
      animation: rest-guide-fade 2s infinite alternate;
    }
    @keyframes rest-guide-fade {
      from { opacity: 0.3; }
      to { opacity: 0.8; }
    }
  `;
  overlay.appendChild(styleEl);

  // 테마별 시각 콘텐츠 마운트
  let completeIcon = "🌠";
  let completeTitle = t("timerCompleteTitle") || "Goal Achieved!";
  let completeSub = t("timerCompleteSub") || "Great job!";
  let cardDelay = "0s";

  if (currentTheme === "night") {
    // 1. 별자리 SVG 그리기
    const svgNS = "http://www.w3.org/2000/svg";
    const constellationsSvg = document.createElementNS(svgNS, "svg");
    constellationsSvg.setAttribute("class", "constellations-svg");
    constellationsSvg.setAttribute("viewBox", "0 0 1000 600");
    constellationsSvg.setAttribute("preserveAspectRatio", "xMidYMid slice");

    const constellationData = [
      { points: [[100, 200], [160, 190], [210, 210], [240, 250], [290, 280], [340, 285], [320, 330], [270, 320], [290, 280]] },
      { points: [[750, 100], [785, 135], [820, 115], [855, 150], [890, 125]] },
      { points: [[800, 380], [870, 390], [850, 440], [875, 500], [810, 490], [825, 440], [800, 380]], extraLines: [[[825, 440], [838, 442], [850, 444]]] }
    ];

    constellationData.forEach((constel) => {
      if (constel.points && constel.points.length > 1) {
        const polyline = document.createElementNS(svgNS, "polyline");
        polyline.setAttribute("points", constel.points.map(p => p.join(",")).join(" "));
        polyline.setAttribute("class", "constellation-line");
        constellationsSvg.appendChild(polyline);

        constel.points.forEach(([x, y]) => {
          const star = document.createElementNS(svgNS, "circle");
          star.setAttribute("cx", String(x));
          star.setAttribute("cy", String(y));
          star.setAttribute("r", "3.5");
          star.setAttribute("class", "constellation-star-node");
          constellationsSvg.appendChild(star);
        });
      }
      if (constel.extraLines) {
        constel.extraLines.forEach(linePts => {
          const line = document.createElementNS(svgNS, "polyline");
          line.setAttribute("points", linePts.map(p => p.join(",")).join(" "));
          line.setAttribute("class", "constellation-line");
          constellationsSvg.appendChild(line);
        });
      }
    });
    overlay.appendChild(constellationsSvg);

    // 2. 반짝이는 별들 스폰
    const starsContainer = document.createElement("div");
    starsContainer.className = "stars-container";
    for (let i = 0; i < 70; i++) {
      const star = document.createElement("div");
      const isGlitter = Math.random() < 0.15;
      star.className = `star ${isGlitter ? "glitter-star" : "normal-star"}`;
      const size = Math.random() * 2 + (isGlitter ? 2 : 1);
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.setProperty("--twinkle-duration", `${Math.random() * 2 + 1.5}s`);
      star.style.setProperty("--twinkle-delay", `${Math.random() * 4}s`);

      if (isGlitter) {
        const flareH = document.createElement("div");
        flareH.className = "flare-h";
        const flareV = document.createElement("div");
        flareV.className = "flare-v";
        star.appendChild(flareH);
        star.appendChild(flareV);
      }
      starsContainer.appendChild(star);
    }
    overlay.appendChild(starsContainer);

    // 3. 별똥별 스폰
    const shootingStarsContainer = document.createElement("div");
    shootingStarsContainer.className = "shooting-stars-container";
    overlay.appendChild(shootingStarsContainer);

    let shootingTimerId: any = null;
    const spawnShootingStar = () => {
      if (!shadow.getElementById("buddy-timer-complete-overlay")) {
        if (shootingTimerId) clearTimeout(shootingTimerId);
        return;
      }
      const star = document.createElement("div");
      const isLarge = Math.random() < 0.25;
      star.className = `shooting-star ${isLarge ? "large" : "normal"}`;
      star.style.left = `${Math.random() * 80 + 20}%`;
      star.style.top = `${Math.random() * 30}%`;
      star.style.setProperty("--shoot-duration", `${Math.random() * 1.2 + 0.8}s`);
      shootingStarsContainer.appendChild(star);
      setTimeout(() => star.remove(), 2500);
      shootingTimerId = setTimeout(spawnShootingStar, Math.random() * 2000 + 1000);
    };
    setTimeout(spawnShootingStar, 200);
    setTimeout(spawnShootingStar, 1000);

  } else if (currentTheme === "forest") {
    completeIcon = "🌿";
    completeTitle = t("timerCompleteForestTitle" as any) || "Peace of Mind";
    completeSub = t("timerCompleteForestSub" as any) || "Forest breeze fills you with energy.";

    // 1. 숲속 달빛 사선 빛줄기 마운트
    const raysContainer = document.createElement("div");
    raysContainer.className = "forest-light-rays";
    for (let i = 0; i < 3; i++) {
      const ray = document.createElement("div");
      ray.className = "forest-light-ray";
      ray.style.left = `${10 + i * 28}%`;
      ray.style.setProperty("--ray-duration", `${Math.random() * 5 + 4}s`);
      ray.style.setProperty("--ray-delay", `${Math.random() * 3}s`);
      raysContainer.appendChild(ray);
    }
    overlay.appendChild(raysContainer);

    // 2. 바람에 흔들리는 침엽수림 전나무 실루엣 마운트
    const forestSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    forestSvg.setAttribute("class", "forest-trees");
    forestSvg.setAttribute("viewBox", "0 0 1000 220");
    forestSvg.setAttribute("preserveAspectRatio", "none");
    forestSvg.innerHTML = `
      <defs>
        <!-- 디테일한 전나무(Pine Tree) 템플릿 1 (완전하게 예리하고 뾰족한 칼날 피크 구현) -->
        <g id="pine-tree-1">
          <path d="M 0 -85 L -14 -60 L -6 -60 L -20 -35 L -10 -35 L -26 -5 L -12 -5 L -30 25 L 30 25 L 12 -5 L 26 -5 L 10 -35 L 20 -35 L 6 -60 L 14 -60 Z" />
          <rect x="-3.5" y="25" width="7" height="45" />
        </g>
        <!-- 조금 다른 모양의 전나무 템플릿 2 (곡선감이 섞인 전나무) -->
        <g id="pine-tree-2">
          <path d="M 0 -95 L -12 -70 L -5 -70 L -18 -45 L -9 -45 L -24 -15 L -11 -15 L -28 25 L 28 25 L 11 -15 L 24 -15 L 9 -45 L 18 -45 L 5 -70 L 12 -70 Z" />
          <rect x="-3" y="25" width="6" height="40" />
        </g>
      </defs>

      <!-- 1. 가장 먼 거리의 미세한 안개 속 전나무 레이어 (다양한 스케일과 매우 들쭉날쭉한 높낮이 구현) -->
      <g fill="#011914" opacity="0.32" style="animation: forest-sway 11s ease-in-out infinite alternate;">
        ${[30, 110, 195, 270, 360, 440, 520, 600, 680, 760, 840, 920, 975].map((baseX, i) => {
          const template = i % 2 === 0 ? "#pine-tree-1" : "#pine-tree-2";
          const scale = 0.7 + Math.random() * 0.7; // 0.7배 ~ 1.4배의 높은 다양성
          const x = baseX + (Math.random() - 0.5) * 30; // 가로축 불규칙 분포
          const y = 165 + (Math.random() - 0.5) * 35;  // 들쭉날쭉 높낮이 편차
          return `<use href="${template}" x="${x / scale}" y="${y / scale}" transform="scale(${scale.toFixed(2)})" />`;
        }).join("")}
      </g>

      <!-- 2. 중간 거리의 전나무 레이어 (안개 중간 수준) -->
      <g fill="#01221a" opacity="0.65" style="animation: forest-sway 9s ease-in-out infinite alternate-reverse;">
        ${[10, 90, 170, 250, 330, 410, 490, 570, 650, 730, 810, 890, 970].map((baseX, i) => {
          const template = i % 2 === 0 ? "#pine-tree-2" : "#pine-tree-1";
          const scale = 1.1 + Math.random() * 0.7; // 1.1배 ~ 1.8배
          const x = baseX + (Math.random() - 0.5) * 35;
          const y = 135 + (Math.random() - 0.5) * 40;
          return `<use href="${template}" x="${x / scale}" y="${y / scale}" transform="scale(${scale.toFixed(2)})" />`;
        }).join("")}
      </g>
      
      <!-- 3. 가장 가까운 거리의 전나무 레이어 (가장 어둡고 웅장함, 1.5배 ~ 2.4배의 거대 전나무가 엇갈려 지그재그 연출) -->
      <g fill="#000d0a" opacity="0.95" style="animation: forest-sway 7.5s ease-in-out infinite alternate;">
        ${[-10, 60, 130, 210, 290, 370, 450, 530, 610, 690, 770, 850, 935, 1010].map((baseX, i) => {
          const template = i % 2 === 0 ? "#pine-tree-1" : "#pine-tree-2";
          const scale = 1.5 + Math.random() * 0.9; // 1.5배 ~ 2.4배 거대 침엽수
          const x = baseX + (Math.random() - 0.5) * 40;
          const y = 100 + (Math.random() - 0.5) * 50; // 근경일수록 거대함의 차이가 극명히 나도록 세로축 랜덤 셰이크 강화
          return `<use href="${template}" x="${x / scale}" y="${y / scale}" transform="scale(${scale.toFixed(2)})" />`;
        }).join("")}
      </g>

      <!-- 4. 숲 아래쪽을 덮는 그라데이션 어둠 그늘 레이어 -->
      <rect x="0" y="160" width="1000" height="60" fill="url(#forest-bottom-dark)" />
      
      <defs>
        <linearGradient id="forest-bottom-dark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(1, 19, 14, 0)" />
          <stop offset="100%" stop-color="rgba(1, 19, 14, 0.95)" />
        </linearGradient>
      </defs>
    `;
    overlay.appendChild(forestSvg);

    // 1-2. 숲속을 떠도는 신비로운 초록빛 물안개 레이어
    const forestMist = document.createElement("div");
    forestMist.className = "yoga-mist-overlay"; // 명상 요가 테마의 안개 애니메이션 재활용
    forestMist.style.background = "radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0) 75%)";
    forestMist.style.height = "250px";
    forestMist.style.bottom = "-20px";
    overlay.appendChild(forestMist);

    // 2. 나뭇잎 흩날림 스폰
    const leafContainer = document.createElement("div");
    leafContainer.className = "forest-leaves";
    leafContainer.style.position = "absolute";
    leafContainer.style.inset = "0";
    leafContainer.style.pointerEvents = "none";

    for (let i = 0; i < 28; i++) {
      const leaf = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      leaf.setAttribute("class", "leaf");
      leaf.setAttribute("width", String(Math.random() * 12 + 10)); // 10px ~ 22px
      leaf.setAttribute("height", String(Math.random() * 12 + 10));
      leaf.setAttribute("viewBox", "0 0 20 20");
      leaf.innerHTML = `<path d="M10 2 C 15 7, 18 13, 10 18 C 2 13, 5 7, 10 2 Z" />`;
      
      leaf.style.position = "absolute";
      leaf.style.left = `${Math.random() * 100}%`;
      leaf.style.top = "-25px";
      
      const colors = ["rgba(52, 211, 153, 0.4)", "rgba(16, 185, 129, 0.35)", "rgba(110, 231, 183, 0.3)", "rgba(5, 150, 105, 0.4)"];
      leaf.style.fill = colors[Math.floor(Math.random() * colors.length)];
      
      leaf.style.setProperty("--fall-duration", `${Math.random() * 8 + 6}s`);
      leaf.style.setProperty("--fall-delay", `${Math.random() * 5}s`);
      leaf.style.setProperty("--x-drift", `${(Math.random() - 0.3) * 200}px`);
      leaf.style.setProperty("--r-spin", `${Math.random() * 360 + 360}deg`);
      
      leafContainer.appendChild(leaf);
    }
    overlay.appendChild(leafContainer);

    // 3. 반딧불이 스폰 (제자리 부유 모션 활성화)
    const firefliesContainer = document.createElement("div");
    firefliesContainer.className = "forest-fireflies";
    for (let i = 0; i < 18; i++) {
      const fly = document.createElement("div");
      fly.className = "firefly";
      const size = Math.random() * 3 + 3;
      fly.style.width = `${size}px`;
      fly.style.height = `${size}px`;
      fly.style.left = `${Math.random() * 100}%`;
      fly.style.top = `${Math.random() * 80 + 10}%`; // 제자리 부유이므로 임의 Y좌표 분포
      fly.style.setProperty("--float-duration", `${Math.random() * 5 + 4}s`);
      fly.style.setProperty("--float-delay", `${Math.random() * 5}s`);
      fly.style.setProperty("--x-drift", `${(Math.random() - 0.5) * 50}px`); // 호버 범위 제약
      fly.style.setProperty("--y-drift", `${(Math.random() - 0.5) * 50}px`);
      firefliesContainer.appendChild(fly);
    }
    overlay.appendChild(firefliesContainer);

  } else if (currentTheme === "ocean") {
    completeIcon = "🌊";
    completeTitle = t("timerCompleteOceanTitle" as any) || "Calm Ocean";
    completeSub = t("timerCompleteOceanSub" as any) || "Relax with the rolling waves.";

    // 1. 심해 빛줄기(Sun Rays) 레이어 추가
    const raysContainer = document.createElement("div");
    raysContainer.className = "ocean-light-rays";
    for (let i = 0; i < 3; i++) {
      const ray = document.createElement("div");
      ray.className = "ocean-light-ray";
      ray.style.left = `${15 + i * 25}%`;
      ray.style.setProperty("--ray-duration", `${Math.random() * 4 + 4}s`);
      ray.style.setProperty("--ray-delay", `${Math.random() * 3}s`);
      raysContainer.appendChild(ray);
    }
    overlay.appendChild(raysContainer);

    // 2. 물방울 스폰 (너울 흔들림 상승 모션)
    const bubblesContainer = document.createElement("div");
    bubblesContainer.className = "ocean-bubbles";
    for (let i = 0; i < 40; i++) {
      const bub = document.createElement("div");
      bub.className = "bubble";
      const size = Math.random() * 15 + 3;
      bub.style.width = `${size}px`;
      bub.style.height = `${size}px`;
      bub.style.left = `${Math.random() * 100}%`;
      bub.style.setProperty("--rise-duration", `${Math.random() * 6 + 4}s`);
      bub.style.setProperty("--rise-delay", `${Math.random() * 5}s`);
      bub.style.setProperty("--x-wobble", `${(Math.random() - 0.5) * 130}px`);
      bubblesContainer.appendChild(bub);
    }
    overlay.appendChild(bubblesContainer);

    // 2-2. 바다 생물 (물고기 및 고래) 스폰
    const creaturesContainer = document.createElement("div");
    creaturesContainer.className = "ocean-creatures";
    
    const creatureDefs = [
      { emoji: "🐋", isWhale: true, dir: "right" },
      { emoji: "🐳", isWhale: true, dir: "left" },
      { emoji: "🐟", isWhale: false, dir: "right" },
      { emoji: "🐠", isWhale: false, dir: "left" },
      { emoji: "🐡", isWhale: false, dir: "right" },
      { emoji: "🐠", isWhale: false, dir: "right" },
      { emoji: "🐟", isWhale: false, dir: "left" }
    ];

    creatureDefs.forEach((def) => {
      const creature = document.createElement("div");
      creature.className = `ocean-creature swim-${def.dir} ${def.isWhale ? "whale" : ""}`;
      
      // 자식 바디 엘리먼트 생성 (CSS transform 충돌 회피 및 세컨더리 애니메이션 적용용)
      const body = document.createElement("div");
      body.className = "creature-body";
      body.textContent = def.emoji;
      creature.appendChild(body);
      
      // 높이 무작위 배치 (15% ~ 80% 사이)
      creature.style.top = `${15 + Math.random() * 65}%`;
      
      // 크기 동적 무작위 설정 (사용자 요청: 물방울보다 더 크게, 작은 것과 큰 것이 섞이도록 랜덤)
      const fontSize = def.isWhale
        ? Math.floor(Math.random() * 26 + 60)  // 고래: 60px ~ 86px (더 거대하게 변경)
        : Math.floor(Math.random() * 20 + 28);  // 일반 물고기: 28px ~ 48px
      creature.style.fontSize = `${fontSize}px`;
      
      // 애니메이션 변수 설정 (고래는 느리고, 일반 물고기는 보통 빠르기)
      const duration = def.isWhale 
        ? Math.random() * 8 + 14
        : Math.random() * 5 + 8;
      const delay = Math.random() * 8;
      
      creature.style.setProperty("--swim-duration", `${duration}s`);
      creature.style.setProperty("--swim-delay", `${delay}s`);
      
      creaturesContainer.appendChild(creature);
    });
    overlay.appendChild(creaturesContainer);

    // 3. 파도 일렁임 SVG
    const waveSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    waveSvg.setAttribute("class", "ocean-waves");
    waveSvg.setAttribute("viewBox", "0 24 150 28");
    waveSvg.setAttribute("preserveAspectRatio", "none");
    waveSvg.innerHTML = `
      <defs>
        <path id="gentle-wave" d="M-160 44c30 0 58-18 88-18s58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" />
      </defs>
      <g class="wave-g wave-g-1">
        <use href="#gentle-wave" x="48" y="0" fill="rgba(255,255,255,0.06)" />
      </g>
      <g class="wave-g wave-g-2">
        <use href="#gentle-wave" x="48" y="3" fill="rgba(255,255,255,0.11)" />
      </g>
      <g class="wave-g wave-g-3">
        <use href="#gentle-wave" x="48" y="5" fill="rgba(255,255,255,0.18)" />
      </g>
      <g class="wave-g wave-g-4">
        <use href="#gentle-wave" x="48" y="7" fill="rgba(255,255,255,0.28)" />
      </g>
    `;
    overlay.appendChild(waveSvg);

  } else if (currentTheme === "fireplace") {
    completeIcon = "🔥";
    completeTitle = t("timerCompleteFireplaceTitle" as any) || "Cozy Fireplace";
    completeSub = t("timerCompleteFireplaceSub" as any) || "Enjoy warm thoughts by the fire.";

    // 1. 하단 벽난로 및 입체 불꽃 SVG 마운트
    const fireplaceSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    fireplaceSvg.setAttribute("class", "fireplace-bg-svg");
    fireplaceSvg.setAttribute("viewBox", "0 0 1000 240");
    fireplaceSvg.setAttribute("preserveAspectRatio", "xMidYMax meet");
    fireplaceSvg.innerHTML = `
      <defs>
        <filter id="fire-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="12" />
        </filter>
        <linearGradient id="fireplace-back-grad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stop-color="#110502" />
          <stop offset="100%" stop-color="#050100" />
        </linearGradient>
      </defs>

      <!-- 1. 아치 내부 공간 백그라운드 -->
      <path d="M 280 240 C 280 80, 720 80, 720 240 Z" fill="url(#fireplace-back-grad)" />

      <!-- 2. 벽난로 뒷벽 안쪽 불꽃 반사광 (앰비언트 글로우) -->
      <circle cx="500" cy="180" r="130" fill="#f97316" opacity="0.15" filter="url(#fire-blur)" style="animation: fire-glow 4s ease-in-out infinite alternate;" />

      <!-- 3. 활활 타오르는 3단계 불길 (장작 뒤에서 솟구침) -->
      <path class="flame-outer" d="M 430 220 C 390 190, 410 130, 440 100 C 460 130, 470 120, 500 70 C 530 110, 540 100, 560 120 C 590 140, 610 190, 570 220 Z" />
      <path class="flame-medium" d="M 445 220 C 420 195, 430 145, 460 115 C 475 135, 485 125, 505 90 C 525 125, 535 115, 550 140 C 570 160, 580 195, 555 220 Z" />
      <path class="flame-inner" d="M 465 220 C 450 200, 460 160, 480 135 C 490 145, 495 140, 505 115 C 515 140, 520 135, 530 155 C 540 170, 550 200, 535 220 Z" />

      <!-- 4. 장작더미 (어긋나게 쌓인 장작과 붉은 내부 불씨) -->
      <rect x="360" y="210" width="220" height="24" rx="6" fill="#1b0a03" transform="rotate(12, 470, 222)" stroke="#0d0401" stroke-width="2" />
      <rect x="420" y="212" width="220" height="24" rx="6" fill="#150802" transform="rotate(-10, 530, 224)" stroke="#0d0401" stroke-width="2" />
      <line x1="390" y1="216" x2="550" y2="216" stroke="#2c1407" stroke-width="2" transform="rotate(12, 470, 222)" />
      <line x1="450" y1="218" x2="610" y2="218" stroke="#251004" stroke-width="2" transform="rotate(-10, 530, 224)" />

      <!-- 장작 내부 불씨 효과 -->
      <circle class="wood-glow" cx="500" cy="216" r="32" />
      <ellipse class="wood-glow" cx="500" cy="212" rx="48" ry="14" />

      <!-- 위에 올린 잔가지 장작 -->
      <rect x="440" y="180" width="130" height="16" rx="4" fill="#2d1306" transform="rotate(-35, 505, 188)" stroke="#0d0401" stroke-width="2" />
      
      <!-- 5. 전면 벽난로 둥근 프레임 기둥 & 상단 원목 선반 실루엣 (아치 구멍 뚫기) -->
      <!-- 몸체 스톤 프레임 (Evenodd 룰로 중앙 아치 부분을 뚫어줌) -->
      <path d="M 250 70 L 750 70 A 12 12 0 0 1 762 82 L 762 240 L 238 240 L 238 82 A 12 12 0 0 1 250 70 Z M 280 240 C 280 80, 720 80, 720 240 Z" fill="#261612" fill-rule="evenodd" />
      
      <!-- 벽돌 타일 줄눈(Grid) 감성의 장식선들 -->
      <path d="M 250 126 L 310 126 M 690 126 L 750 126 M 250 182 L 290 182 M 710 182 L 750 182 M 400 70 L 400 86 M 600 70 L 600 86" fill="none" stroke="#1c0f0c" stroke-width="2.5" opacity="0.7" />

      <!-- 상단 아늑한 원목 벽난로 선반 (Mantle Shelf) -->
      <rect x="220" y="44" width="560" height="26" rx="6" fill="#4e2c1e" stroke="#1e0f0a" stroke-width="2" />
      <rect x="230" y="70" width="540" height="6" fill="#150906" opacity="0.45" />

      <!-- 테두리 데코레이션 프레임 라인 -->
      <path d="M 270 240 C 270 70, 730 70, 730 240" fill="none" stroke="#361f19" stroke-width="12" />
      <path d="M 285 240 C 285 85, 715 85, 715 240" fill="none" stroke="#150906" stroke-width="4" />
    `;
    overlay.appendChild(fireplaceSvg);

    // 2. 불꽃 입자 스폰 (소용돌이 와류 무빙 및 다채로운 색감)
    const embersContainer = document.createElement("div");
    embersContainer.className = "fireplace-embers";
    const emberColors = [
      "rgba(254, 240, 138, 0.85)", // 노란빛
      "rgba(249, 115, 22, 0.75)",  // 주황빛
      "rgba(239, 68, 68, 0.7)"     // 붉은빛
    ];
    for (let i = 0; i < 45; i++) {
      const emb = document.createElement("div");
      emb.className = "ember";
      const size = Math.random() * 4 + 2;
      emb.style.width = `${size}px`;
      emb.style.height = `${size}px`;
      emb.style.left = `${Math.random() * 30 + 35}%`;
      emb.style.background = emberColors[Math.floor(Math.random() * emberColors.length)];
      emb.style.boxShadow = `0 0 6px ${emb.style.background}`;
      emb.style.setProperty("--rise-duration", `${Math.random() * 3.5 + 2.5}s`);
      emb.style.setProperty("--rise-delay", `${Math.random() * 4}s`);
      emb.style.setProperty("--x-drift", `${(Math.random() - 0.5) * 160}px`);
      embersContainer.appendChild(emb);
    }
    overlay.appendChild(embersContainer);

  } else if (currentTheme === "sunset") {
    completeIcon = "🌅";
    completeTitle = t("timerCompleteSunsetTitle" as any) || "Soft Sunset";
    completeSub = t("timerCompleteSunsetSub" as any) || "Soft sunset colors reflect your peace.";

    // 1. 하늘에서 천천히 내려앉는 태양(Sun) 마운트 (일몰 연출)
    const sun = document.createElement("div");
    sun.className = "sunset-sun";
    overlay.appendChild(sun);

    // 2. 하단 산맥 실루엣 마운트
    const sunsetSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    sunsetSvg.setAttribute("class", "sunset-mountains");
    sunsetSvg.setAttribute("viewBox", "0 0 1000 150");
    sunsetSvg.setAttribute("preserveAspectRatio", "none");
    sunsetSvg.innerHTML = `
      <path d="M0 150 L0 100 L150 65 L280 110 L410 55 L560 115 L710 70 L860 110 L1000 65 L1000 150 Z" fill="rgba(87, 43, 114, 0.5)" />
      <path d="M0 150 L0 120 L180 85 L340 130 L500 80 L680 125 L840 90 L1000 125 L1000 150 Z" fill="rgba(29, 18, 51, 0.85)" />
    `;
    overlay.appendChild(sunsetSvg);

    // 3. 흘러가는 몽글몽글 다채로운 솜구름 렌더링
    const cloudsContainer = document.createElement("div");
    cloudsContainer.className = "sunset-clouds-container";
    const cloudPaths = [
      // 몽글몽글 구름 형태 1
      `<path d="M10 30 C 10 20, 20 15, 30 20 C 35 10, 50 10, 58 18 C 65 10, 80 12, 85 22 C 95 22, 98 28, 90 32 C 90 35, 10 35, 10 30 Z" />`,
      // 몽글몽글 구름 형태 2
      `<path d="M5 25 C 5 15, 15 12, 25 15 C 30 5, 45 5, 52 13 C 58 4, 72 6, 78 15 C 85 12, 92 18, 90 25 C 90 28, 5 28, 5 25 Z" />`,
      // 몽글몽글 구름 형태 3
      `<path d="M10 28 C 10 18, 18 12, 28 15 C 33 5, 48 5, 54 13 C 60 4, 75 6, 80 16 C 88 16, 92 22, 88 28 C 88 30, 10 30, 10 28 Z" />`
    ];
    for (let i = 0; i < 7; i++) {
      const cloudSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      cloudSvg.setAttribute("class", "sunset-cloud");
      cloudSvg.setAttribute("width", String(Math.random() * 100 + 130)); // 130px ~ 230px
      cloudSvg.setAttribute("height", "80");
      cloudSvg.setAttribute("viewBox", "0 0 100 40");
      
      const pathIdx = i % cloudPaths.length;
      cloudSvg.innerHTML = cloudPaths[pathIdx];
      
      cloudSvg.style.top = `${Math.random() * 45 + 5}%`;
      cloudSvg.style.setProperty("--drift-duration", `${Math.random() * 35 + 30}s`);
      cloudSvg.style.setProperty("--drift-delay", `-${Math.random() * 30}s`);
      
      const opacity = Math.random() * 0.12 + 0.1; // 0.1 ~ 0.22 투명도 조절
      cloudSvg.style.fill = `rgba(255, 243, 232, ${opacity})`; // 따뜻한 석양빛을 머금은 구름 색상
      
      const scale = Math.random() * 0.9 + 0.5;
      cloudSvg.style.transform = `scale(${scale})`;
      cloudsContainer.appendChild(cloudSvg);
    }
    overlay.appendChild(cloudsContainer);

    // 4. 날갯짓하며 수평 비행하는 새떼 스폰
    const birdsContainer = document.createElement("div");
    birdsContainer.className = "sunset-birds-container";
    for (let i = 0; i < 6; i++) {
      const bird = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      bird.setAttribute("class", "sunset-bird");
      bird.setAttribute("width", "20");
      bird.setAttribute("height", "12");
      bird.setAttribute("viewBox", "0 0 20 10");
      bird.innerHTML = `<path class="bird-path" d="M0 5 Q5 0, 10 5 Q15 0, 20 5 Q15 2, 10 5 Q5 2, 0 5 Z" />`;
      
      bird.style.top = `${Math.random() * 25 + 10}%`;
      bird.style.setProperty("--fly-duration", `${Math.random() * 12 + 10}s`);
      bird.style.setProperty("--fly-delay", `${Math.random() * 6}s`);
      bird.style.setProperty("--y-drift", `${(Math.random() - 0.5) * 80}px`);
      birdsContainer.appendChild(bird);
    }
    overlay.appendChild(birdsContainer);

    // 5. 공기 중에 나른하게 떨어지는 노을빛 민들레 빛가루(Dust) 스폰
    const dustsContainer = document.createElement("div");
    dustsContainer.className = "sunset-dusts";
    const dustColors = [
      "rgba(253, 224, 71, 0.4)",  // 노란색
      "rgba(251, 146, 60, 0.35)", // 주황색
      "rgba(254, 215, 170, 0.4)"  // 살구색
    ];
    for (let i = 0; i < 26; i++) {
      const dust = document.createElement("div");
      dust.className = "sunset-dust";
      const size = Math.random() * 4.5 + 1.5;
      dust.style.width = `${size}px`;
      dust.style.height = `${size}px`;
      dust.style.left = `${Math.random() * 100}%`;
      dust.style.background = dustColors[Math.floor(Math.random() * dustColors.length)];
      dust.style.setProperty("--fall-duration", `${Math.random() * 8 + 6}s`);
      dust.style.setProperty("--fall-delay", `${Math.random() * 5}s`);
      dust.style.setProperty("--x-drift", `${(Math.random() - 0.4) * 150}px`); // 사선 낙하 유도
      dustsContainer.appendChild(dust);
    }
    overlay.appendChild(dustsContainer);
  } else if (currentTheme === "yoga") {
    completeIcon = "🧘‍♀️";
    completeTitle = t("timerCompleteYogaTitle" as any) || "마음의 평온을 찾았습니다 🧘‍♀️";
    completeSub = t("timerCompleteYogaSub" as any) || "천천히 숨을 들이쉬고 내쉬며, 몰입하느라 애쓴 나를 토닥여 주세요.";

    // 1. 전체화면 오로라 번짐 효과 배경용 레이어
    const auroraBg = document.createElement("div");
    auroraBg.className = "yoga-scene-aurora";
    auroraBg.style.backgroundImage = `url('${chrome.runtime.getURL("buddies/timer-themes/yoga/scene.webp")}')`;
    overlay.appendChild(auroraBg);

    // 2. 가로 와이드 16:9 젠 가든 일러스트 전체화면 마운트
    const fullBgImg = document.createElement("img");
    fullBgImg.className = "yoga-fullscreen-scene";
    fullBgImg.src = chrome.runtime.getURL("buddies/timer-themes/yoga/scene.webp");
    overlay.appendChild(fullBgImg);

    // 3. 요가 명상가 위치에 맞춰 12초 주기로 팽창하며 숨쉬는 아우라 글로우 차크라
    const chakraBreathing = document.createElement("div");
    chakraBreathing.className = "yoga-chakra-breathing";
    overlay.appendChild(chakraBreathing);

    // 4. 부드러운 호수 물안개 레이어
    const mistOverlay = document.createElement("div");
    mistOverlay.className = "yoga-mist-overlay";
    overlay.appendChild(mistOverlay);

    // 5. 밤하늘로 부드럽게 흩날리며 깜빡이는 반딧불이(Firefly) 젠 입자 36개 스폰
    const particlesContainer = document.createElement("div");
    particlesContainer.className = "yoga-zen-particles";
    for (let i = 0; i < 36; i++) {
      const p = document.createElement("div");
      p.className = "yoga-zen-particle";
      const size = Math.random() * 6 + 2.5; // 2.5px ~ 8.5px 크기 다채화
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.left = `${Math.random() * 92 + 4}%`;
      p.style.bottom = `${Math.random() * 55 + 5}%`; // 수면 위 하늘 영역에 주로 스폰
      
      // 애니메이션 속성들을 개별 변수로 주입
      const duration = Math.random() * 6 + 8; // 8s ~ 14s의 여유로운 부유
      const delay = -(Math.random() * 12); // 음수 딜레이를 주어 화면 등장 즉시 이미 부유 중인 상태 연출!
      const driftX = (Math.random() - 0.5) * 160; // 좌우로 더 풍부하게 흔들리게 함 (-80px ~ 80px)
      
      p.style.setProperty("--float-duration", `${duration}s`);
      p.style.setProperty("--float-delay", `${delay}s`);
      p.style.setProperty("--drift-x", `${driftX}px`);
      particlesContainer.appendChild(p);
    }
    overlay.appendChild(particlesContainer);

  } else if (currentTheme.startsWith("comic")) {
    completeIcon = "🏔️";
    completeTitle = t("timerCompleteComicTitle" as any) || "Goal Achieved! 🏔️";
    completeSub = t("timerCompleteComicSub" as any) || "Step by step without giving up, you finally reached the summit!";

    // 10종 에피소드의 고유 가로세로 비율 및 최대 높이 인메모리 맵 정의
    const ASPECT_RATIOS: Record<string, string> = {
      comic1: "2/1",
      comic2: "5/4",
      comic3: "3/2",
      comic4: "3/2",
      comic5: "3/2",
      comic6: "3/2",
      comic7: "3/2",
      comic8: "4/5",
      comic9: "3/2",
      comic10: "5/4",
      comic11: "1000/882",
      comic12: "920/1000",
      comic13: "938/1000",
      comic14: "935/1000",
      comic15: "1000/889",
      comic16: "913/1000",
      comic17: "1000/919",
      comic18: "1000/921"
    };
    const aspectRatio = ASPECT_RATIOS[currentTheme] || "3/2";
    const episodeNum = currentTheme.replace("comic", "").padStart(2, "0");
    const folder = `story${episodeNum}`;
    const imgUrl = chrome.runtime.getURL(`buddies/timer-themes/${folder}/scene.webp`);
    
    cardDelay = "4000ms";

    const comicContainer = document.createElement("div");
    comicContainer.className = "comic-scene-container";
    comicContainer.style.aspectRatio = aspectRatio;
    comicContainer.style.maxHeight = "82vh"; // 브라우저 세로 높이 대비 최대 비율 스케일업 허용 (비율 보존)

    // 단일 켄 번즈 시네마틱 씬 엘리먼트 생성
    const sceneEl = document.createElement("div");
    sceneEl.className = "comic-scene";
    sceneEl.style.backgroundImage = `url(${imgUrl})`;
    comicContainer.appendChild(sceneEl);

    // 1. 실시간 만화 이미지 적응형 오로라 글래스 배경 생성
    const auroraBg = document.createElement("div");
    auroraBg.className = "comic-aurora-bg";
    auroraBg.style.backgroundImage = `url(${imgUrl})`;
    overlay.appendChild(auroraBg);

    // 2. 몽환적인 소프트 보케 파티클 생성 및 살포
    const bokehContainer = document.createElement("div");
    bokehContainer.className = "comic-bokeh-container";
    
    for (let i = 0; i < 15; i++) {
      const p = document.createElement("div");
      p.className = "comic-bokeh-particle";
      
      const size = Math.random() * 9 + 4; // 4px ~ 13px 크기
      const left = Math.random() * 100;
      const delay = Math.random() * 8; // 무작위 애니메이션 딜레이
      const duration = Math.random() * 7 + 8; // 8s ~ 15s 무한 상승
      const maxOpacity = Math.random() * 0.22 + 0.08; // 0.08 ~ 0.3 투명도
      const driftX = (Math.random() - 0.5) * 120; // 좌우 부유 거리

      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.left = `${left}%`;
      p.style.animationDelay = `${delay}s`;
      p.style.animationDuration = `${duration}s`;
      p.style.setProperty("--max-opacity", String(maxOpacity));
      p.style.setProperty("--drift-x", `${driftX}px`);

      bokehContainer.appendChild(p);
    }
    overlay.appendChild(bokehContainer);

    overlay.appendChild(comicContainer);
  } else if (currentTheme === "gallery") {
    completeIcon = "🖼️";
    completeTitle = t("themeGalleryName" as any) || "Art & Quotes Gallery";
    completeSub = t("restExitGuide" as any) || "Double-click anywhere to exit";

    // 1. Picsum 자연/명화 이미지 로드 (오프라인 시 로컬 WebP 템플릿 연동)
    const imgEl = document.createElement("img");
    imgEl.className = "gallery-bg-image";
    
    const localImagesCount = 10;
    const randomIdx = Math.floor(Math.random() * localImagesCount) + 1;
    const getLocalImageUrl = (idx: number) => {
      const path = `buddies/gallery/gallery${idx}.webp`;
      if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getURL) {
        return chrome.runtime.getURL(path);
      }
      return `/${path}`;
    };

    const isOnline = navigator.onLine;
    const useLocalOnly = s.config?.galleryOfflineMode === true || !isOnline;

    if (!useLocalOnly) {
      imgEl.src = `https://picsum.photos/1920/1080?random=${Date.now()}`;
      imgEl.onerror = () => {
        // 외부 리소스 로드 실패 시 로컬 WebP 대체
        imgEl.src = getLocalImageUrl(randomIdx);
      };
    } else {
      // 오프라인 상태이거나 로컬 전용 모드이면 즉시 로컬 템플릿 사용
      imgEl.src = getLocalImageUrl(randomIdx);
    }

    imgEl.onload = () => {
      imgEl.style.opacity = "1";
    };
    overlay.appendChild(imgEl);

    // 2. 메인 콘텐츠
    const galleryContent = document.createElement("div");
    galleryContent.className = "gallery-content-wrap";

    // 실시간 디지털 시계
    const clockEl = document.createElement("h1");
    clockEl.className = "gallery-clock";
    const updateClock = () => {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      const ss = String(d.getSeconds()).padStart(2, "0");
      clockEl.textContent = `${hh}:${mm}:${ss}`;
    };
    updateClock();
    const clockIntervalId = setInterval(updateClock, 1000);
    (overlay as any).__clockIntervalId = clockIntervalId;

    // 무작위 명언 카드 (영문 고정 명언 리스트 정의)
    const GALLERY_QUOTES = [
      { text: "Within you is a stillness and a sanctuary to which you can retreat at any time.", author: "Hermann Hesse" },
      { text: "Almost everything will work again if you unplug it for a few minutes, including you.", author: "Anne Lamott" },
      { text: "Nature does not hurry, yet everything is accomplished.", author: "Lao Tzu" },
      { text: "Quiet the mind and the soul will speak.", author: "Ma Jaya Sati Bhagavati" },
      { text: "Your calm mind is the ultimate weapon against your challenges. So close your eyes and breathe.", author: "Bryant McGill" },
      { text: "He who rests in peace finds wisdom.", author: "Seneca" },
      { text: "Rest is not idleness, and to lie sometimes on the grass under trees, listening to the murmur of the water, is by no means a waste of time.", author: "John Lubbock" },
      { text: "Tension is who you think you should be. Relaxation is who you are.", author: "Chinese Proverb" },
      { text: "The time to relax is when you don't have time for it.", author: "Sydney J. Harris" },
      { text: "Slow down and everything you are chasing will come around and catch you.", author: "Zen Proverb" },
      { text: "Do not anticipate trouble, or worry about what may never happen. Keep in the sunlight.", author: "Benjamin Franklin" },
      { text: "To mind your own mind, you must first give it a quiet space.", author: "Marcus Aurelius" }
    ];

    const randomQuote = GALLERY_QUOTES[Math.floor(Math.random() * GALLERY_QUOTES.length)];
    const quoteCard = document.createElement("div");
    quoteCard.className = "gallery-quote-card";

    const qTextEl = document.createElement("p");
    qTextEl.className = "gallery-quote-text";
    qTextEl.textContent = `"${randomQuote.text}"`;

    let qAuthEl = document.createElement("span");
    qAuthEl.className = "gallery-quote-author";
    qAuthEl.textContent = `- ${randomQuote.author}`;

    quoteCard.appendChild(qTextEl);
    quoteCard.appendChild(qAuthEl);

    // 명언 카드가 위로 가도록 먼저 append, 시계를 나중에 append
    galleryContent.appendChild(quoteCard);
    galleryContent.appendChild(clockEl);
    overlay.appendChild(galleryContent);

  } else if (currentTheme === "breath") {
    completeIcon = "🌬️";
    completeTitle = t("themeBreathName" as any) || "Mindful Breath";
    completeSub = t("restExitGuide" as any) || "Double-click anywhere to exit";

    // 0. 스타 더스트 25개 살포 (크기와 깊이감을 다채롭게 개선)
    for (let i = 0; i < 25; i++) {
      const dust = document.createElement("div");
      dust.className = "breath-dust";
      const size = Math.random() * 9 + 1.5; // 1.5px ~ 10.5px (다채롭게 크기 확장)
      const delay = Math.random() * 12;
      const duration = Math.random() * 10 + 7; // 7초 ~ 17초 (속도 다변화)
      const left = Math.random() * 100;
      const xDrift = (Math.random() - 0.5) * 160; // -80px ~ 80px (좌우 유영 범위 확대)
      
      // 크기에 따른 동적 입체 블러 및 투명도 매핑 (3D 공간감 형성)
      const blurVal = size > 6 ? (size > 9 ? "2.5px" : "1.2px") : "0.5px";
      const opacityVal = size > 6 ? (Math.random() * 0.15 + 0.12) : (Math.random() * 0.4 + 0.25);

      dust.style.width = `${size}px`;
      dust.style.height = `${size}px`;
      dust.style.left = `${left}%`;
      dust.style.opacity = String(opacityVal);
      dust.style.filter = `blur(${blurVal})`;
      dust.style.animationDelay = `${delay}s`;
      dust.style.animationDuration = `${duration}s`;
      dust.style.setProperty("--x-drift", `${xDrift}px`);
      overlay.appendChild(dust);
    }

    const breathContent = document.createElement("div");
    breathContent.className = "breath-content-wrap";

    // 중앙 호흡 원형 애니메이션
    const circleContainer = document.createElement("div");
    circleContainer.className = "breath-circle-container";

    const outerCircle = document.createElement("div");
    outerCircle.className = "breath-circle-outer";
    
    // 동심원 숨결 파동 링 2개 마운트
    const waveRing1 = document.createElement("div");
    waveRing1.className = "breath-wave-ring wave-delay-1";
    const waveRing2 = document.createElement("div");
    waveRing2.className = "breath-wave-ring wave-delay-2";
    
    const innerCircle = document.createElement("div");
    innerCircle.className = "breath-circle-inner";
    innerCircle.textContent = "Breath";

    circleContainer.appendChild(outerCircle);
    circleContainer.appendChild(waveRing1);
    circleContainer.appendChild(waveRing2);
    circleContainer.appendChild(innerCircle);

    const guideText = document.createElement("h2");
    guideText.className = "breath-guide-text";
    guideText.textContent = "";

    const subGuide = document.createElement("p");
    subGuide.className = "breath-sub-guide";
    
    const updateBreathGuide = () => {
      const sec = Math.floor(Date.now() / 1000) % 12;
      
      let inhaleText = "Inhale";
      let holdText = "Hold";
      let exhaleText = "Exhale";
      let inhaleDesc = "Slowly draw in positive energy.";
      let holdDesc = "Hold your breath and feel the calmness.";
      let exhaleDesc = "Exhale slowly, releasing all your stress.";

      const lang = (chrome.i18n.getUILanguage() || "ko").toLowerCase();
      if (lang.startsWith("ko")) {
        inhaleText = "숨을 깊게 들이쉬세요";
        holdText = "잠시 숨을 멈추세요";
        exhaleText = "천천히 숨을 내쉬세요";
        inhaleDesc = "몸 안 가득 맑은 에너지를 채워넣습니다.";
        holdDesc = "고요함 속에 가만히 머물러 봅니다.";
        exhaleDesc = "머릿속 모든 걱정과 긴장을 밖으로 보냅니다.";
      } else if (lang.startsWith("ja")) {
        inhaleText = "深く息を吸い込んでください";
        holdText = "息を止めてください";
        exhaleText = "ゆっくり息を吐き出してください";
        inhaleDesc = "体にきれいなエネルギーを満たします。";
        holdDesc = "静けさの中に身を置いてみましょう。";
        exhaleDesc = "頭の中のすべてのストレスを外に吐き出します。";
      }

      if (sec < 4) {
        guideText.textContent = inhaleText;
        innerCircle.textContent = lang.startsWith("ko") ? "들숨" : (lang.startsWith("ja") ? "吸" : "In");
        subGuide.textContent = inhaleDesc;
      } else if (sec < 8) {
        guideText.textContent = holdText;
        innerCircle.textContent = lang.startsWith("ko") ? "멈춤" : (lang.startsWith("ja") ? "止" : "Hold");
        subGuide.textContent = holdDesc;
      } else {
        guideText.textContent = exhaleText;
        innerCircle.textContent = lang.startsWith("ko") ? "날숨" : (lang.startsWith("ja") ? "呼" : "Out");
        subGuide.textContent = exhaleDesc;
      }
    };
    updateBreathGuide();
    const breathIntervalId = setInterval(updateBreathGuide, 200);
    (overlay as any).__breathIntervalId = breathIntervalId;

    breathContent.appendChild(circleContainer);
    breathContent.appendChild(guideText);
    breathContent.appendChild(subGuide);
    overlay.appendChild(breathContent);
  }

  const removeOverlay = () => {
    if ((overlay as any).__clockIntervalId) {
      clearInterval((overlay as any).__clockIntervalId);
    }
    if ((overlay as any).__breathIntervalId) {
      clearInterval((overlay as any).__breathIntervalId);
    }
    overlay.classList.add("fade-out");
    setTimeout(() => overlay.remove(), 500);
  };

  if (isRestMode) {
    overlay.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      removeOverlay();
    });

    const exitGuide = document.createElement("div");
    exitGuide.className = "rest-exit-guide-text";
    exitGuide.textContent = t("restExitGuide" as any) || "Double-click anywhere to exit";
    overlay.appendChild(exitGuide);
  } else {
    const card = document.createElement("div");
    card.className = "complete-card";
    card.style.animationDelay = cardDelay;

    const isComic = currentTheme.startsWith("comic");

    const okBtn = document.createElement("button");
    okBtn.textContent = t("confirmClose") || "Close";

    if (isComic) {
      const contentWrap = document.createElement("div");
      contentWrap.className = "complete-card-content";

      const iconWrap = document.createElement("div");
      iconWrap.className = "complete-card-icon-wrap";
      iconWrap.innerHTML = completeIcon;
      contentWrap.appendChild(iconWrap);

      const textWrap = document.createElement("div");
      textWrap.className = "complete-card-text-wrap";

      const titleEl = document.createElement("h2");
      titleEl.className = "complete-title";
      titleEl.textContent = completeTitle;
      textWrap.appendChild(titleEl);

      const descEl = document.createElement("p");
      descEl.className = "complete-sub";
      if (message && message.trim()) {
        descEl.textContent = `"${message.trim()}"`;
      } else {
        descEl.textContent = completeSub;
      }
      textWrap.appendChild(descEl);
      contentWrap.appendChild(textWrap);

      card.appendChild(contentWrap);

      okBtn.className = "complete-ok-btn complete-card-close-btn";
      card.appendChild(okBtn);
    } else {
      const icon = document.createElement("div");
      icon.className = "complete-icon";
      icon.innerHTML = completeIcon;

      const title = document.createElement("h2");
      title.className = "complete-title";
      title.textContent = completeTitle;

      const subTitle = document.createElement("p");
      subTitle.className = "complete-subtitle";
      subTitle.textContent = completeSub;

      card.appendChild(icon);
      card.appendChild(title);
      card.appendChild(subTitle);

      if (message && message.trim()) {
        const msgEl = document.createElement("div");
        msgEl.className = "complete-message";
        msgEl.textContent = `"${message.trim()}"`;
        card.appendChild(msgEl);
      }

      okBtn.className = "complete-ok-btn";
      card.appendChild(okBtn);
    }

    overlay.appendChild(card);

    okBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      removeOverlay();
    });
  }

  overlay.addEventListener("click", (e) => {
    if (isRestMode) return;
    if (e.target === overlay || 
        (e.target instanceof HTMLElement && 
         (e.target.classList.contains("stars-container") || 
          e.target.classList.contains("forest-fireflies") || 
          e.target.classList.contains("ocean-bubbles") || 
          e.target.classList.contains("fireplace-embers") || 
          e.target.classList.contains("sunset-clouds-container") || 
          e.target.classList.contains("sunset-dusts")))) {
      removeOverlay();
    }
  });

  playChimeSoundByTheme(currentTheme);

  shadow.appendChild(overlay);
}

function playChimeSoundByTheme(theme: string): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const playNote = (freq: number, startTime: number, duration: number, oscType: OscillatorType = "sine", volume = 0.12) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = oscType;
      osc.frequency.setValueAtTime(freq, startTime);
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(volume, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    if (theme === "night") {
      playNote(523.25, now, 1.2);       // C5
      playNote(659.25, now + 0.15, 1.2); // E5
      playNote(783.99, now + 0.3, 1.2);  // G5
      playNote(1046.50, now + 0.45, 1.8); // C6
    } else if (theme === "forest") {
      playNote(349.23, now, 1.5, "triangle", 0.15);       // F4
      playNote(440.00, now + 0.2, 1.5, "triangle", 0.15);   // A4
      playNote(523.25, now + 0.4, 1.5, "triangle", 0.15);   // C5
      playNote(587.33, now + 0.6, 1.5, "triangle", 0.15);   // D5
      playNote(698.46, now + 0.8, 2.0, "triangle", 0.15);   // F5
    } else if (theme === "ocean") {
      playNote(415.30, now, 2.0, "sine", 0.12);       // Ab4
      playNote(523.25, now + 0.25, 2.0, "sine", 0.12); // C5
      playNote(622.25, now + 0.5, 2.0, "sine", 0.12);  // Eb5
      playNote(830.61, now + 0.75, 2.5, "sine", 0.12); // Ab5
    } else if (theme === "fireplace") {
      playNote(220.00, now, 1.8, "triangle", 0.12); // A3
      playNote(261.63, now + 0.1, 1.8, "triangle", 0.12); // C4
      playNote(329.63, now + 0.2, 1.8, "triangle", 0.10); // E4
      playNote(392.00, now + 0.3, 1.8, "triangle", 0.10); // G4
      playNote(493.88, now + 0.4, 2.2, "triangle", 0.08); // B4
    } else if (theme === "sunset") {
      playNote(392.00, now, 1.6, "sine", 0.12);       // G4
      playNote(493.88, now + 0.15, 1.6, "triangle", 0.10); // B4
      playNote(587.33, now + 0.3, 1.6, "sine", 0.10);      // D5
      playNote(783.99, now + 0.45, 2.0, "triangle", 0.08); // G5
    } else if (theme === "yoga") {
      playNote(123.47, now, 3.5, "sine", 0.15);        // B2
      playNote(246.94, now + 0.05, 3.5, "sine", 0.12);  // B3
      playNote(440.00, now + 0.1, 3.5, "sine", 0.08);   // A4
      playNote(554.37, now + 0.15, 3.5, "sine", 0.08);  // C#5
      playNote(659.25, now + 0.2, 4.0, "sine", 0.06);   // E5
      playNote(739.99, now + 0.25, 4.0, "sine", 0.04);  // F#5
    } else if (theme === "gallery") {
      playNote(261.63, now, 2.5, "sine", 0.10);       // C4
      playNote(329.63, now + 0.2, 2.5, "sine", 0.08); // E4
      playNote(392.00, now + 0.4, 2.5, "sine", 0.08); // G4
      playNote(493.88, now + 0.6, 3.0, "sine", 0.06); // B4
      playNote(523.25, now + 0.8, 3.0, "sine", 0.05); // C5
    } else if (theme === "breath") {
      playNote(329.63, now, 4.5, "sine", 0.12);       // E4
      playNote(333.63, now, 4.5, "sine", 0.12);       // 4Hz 차이로 맥놀이 유도
      playNote(493.88, now + 0.3, 4.0, "sine", 0.08); // B4
    } else if (theme.startsWith("comic")) {
      playNote(261.63, now, 0.8, "triangle", 0.15); // C4
      playNote(329.63, now + 0.1, 0.8, "triangle", 0.15); // E4
      playNote(392.00, now + 0.2, 0.8, "triangle", 0.15); // G4
      playNote(523.25, now + 0.3, 1.2, "sine", 0.12);     // C5
      playNote(659.25, now + 0.45, 1.2, "sine", 0.12);    // E5
      playNote(1046.50, now + 0.6, 2.0, "sine", 0.10);    // C6
    }
  } catch (err) {
    console.error("Failed to play timer sound:", err);
  }
}
