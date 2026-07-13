import { getBuddyState, updateBuddyState, subscribeBuddyState } from "../buddy-state";
import { clampPosition, checkResourceExists, getStateFrameUrl, playCharacterSound, getThumbnailUrl } from "../buddy-utils";
import { stopTimerEngine, togglePauseResume } from "./timer-card";
import { t } from "../i18n";

export function createBuddyCharacter(shadow: ShadowRoot): HTMLElement {
  const container = document.createElement("div");
  container.id = "buddy-container";
  
  let currentAppliedAnimation = "";

  const wrapper = document.createElement("div");
  wrapper.className = "buddy-character-wrapper";
  
  // 이미지 태그
  const img = document.createElement("img");
  img.className = "buddy-image";
  img.alt = "Buddy";
  
  wrapper.appendChild(img);
  container.appendChild(wrapper);

  // 1. Floating time badge (above character head with inline control icons)
  const timerBadge = document.createElement("div");
  timerBadge.className = "buddy-timer-badge";

  const badgeResetBtn = document.createElement("button");
  badgeResetBtn.className = "badge-ctrl-btn reset";
  badgeResetBtn.title = t("timerReset") || "Reset";
  badgeResetBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>`;

  const badgeTimeSpan = document.createElement("span");
  badgeTimeSpan.className = "badge-time-text";

  const badgePlayPauseBtn = document.createElement("button");
  badgePlayPauseBtn.className = "badge-ctrl-btn play-pause";
  badgePlayPauseBtn.title = t("timerPause") || "Pause";
  badgePlayPauseBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>`;

  timerBadge.appendChild(badgeResetBtn);
  timerBadge.appendChild(badgeTimeSpan);
  timerBadge.appendChild(badgePlayPauseBtn);
  container.appendChild(timerBadge);

  // Prevent event bubbling to parent container drag actions on mousedown/touchstart/click
  const blockPointerEvents = (e: MouseEvent | TouchEvent) => {
    e.stopPropagation();
  };
  badgeResetBtn.addEventListener("mousedown", blockPointerEvents);
  badgeResetBtn.addEventListener("touchstart", blockPointerEvents);
  badgePlayPauseBtn.addEventListener("mousedown", blockPointerEvents);
  badgePlayPauseBtn.addEventListener("touchstart", blockPointerEvents);

  badgeResetBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    stopTimerEngine();
  });

  badgePlayPauseBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    togglePauseResume();
  });

  // 2. Outer circular progress ring SVG
  const svgNS = "http://www.w3.org/2000/svg";
  const outerRingSvg = document.createElementNS(svgNS, "svg");
  outerRingSvg.setAttribute("class", "buddy-outer-ring-svg");
  outerRingSvg.setAttribute("viewBox", "0 0 100 100");

  // Create defs for linear gradients
  const defs = document.createElementNS(svgNS, "defs");

  // Running gradient (Violet to Pink gradient)
  const gradRunning = document.createElementNS(svgNS, "linearGradient");
  gradRunning.setAttribute("id", "buddy-timer-grad");
  gradRunning.setAttribute("x1", "0%");
  gradRunning.setAttribute("y1", "0%");
  gradRunning.setAttribute("x2", "100%");
  gradRunning.setAttribute("y2", "100%");
  const stopR1 = document.createElementNS(svgNS, "stop");
  stopR1.setAttribute("offset", "0%");
  stopR1.setAttribute("stop-color", "#6366f1"); // Violet
  const stopR2 = document.createElementNS(svgNS, "stop");
  stopR2.setAttribute("offset", "100%");
  stopR2.setAttribute("stop-color", "#ec4899"); // Pink
  gradRunning.appendChild(stopR1);
  gradRunning.appendChild(stopR2);
  defs.appendChild(gradRunning);

  // Paused gradient (Emerald to Teal gradient)
  const gradPaused = document.createElementNS(svgNS, "linearGradient");
  gradPaused.setAttribute("id", "buddy-timer-grad-paused");
  gradPaused.setAttribute("x1", "0%");
  gradPaused.setAttribute("y1", "0%");
  gradPaused.setAttribute("x2", "100%");
  gradPaused.setAttribute("y2", "100%");
  const stopP1 = document.createElementNS(svgNS, "stop");
  stopP1.setAttribute("offset", "0%");
  stopP1.setAttribute("stop-color", "#34d399"); // Emerald
  const stopP2 = document.createElementNS(svgNS, "stop");
  stopP2.setAttribute("offset", "100%");
  stopP2.setAttribute("stop-color", "#0d9488"); // Teal
  gradPaused.appendChild(stopP1);
  gradPaused.appendChild(stopP2);
  defs.appendChild(gradPaused);

  outerRingSvg.appendChild(defs);

  const ringBg = document.createElementNS(svgNS, "circle");
  ringBg.setAttribute("class", "buddy-outer-ring-bg");
  ringBg.setAttribute("cx", "50");
  ringBg.setAttribute("cy", "50");
  ringBg.setAttribute("r", "46");
  ringBg.setAttribute("fill", "none");
  ringBg.setAttribute("stroke-width", "5.5"); // Thicker ring outline

  const ringBar = document.createElementNS(svgNS, "circle");
  ringBar.setAttribute("class", "buddy-outer-ring-bar");
  ringBar.setAttribute("cx", "50");
  ringBar.setAttribute("cy", "50");
  ringBar.setAttribute("r", "46");
  ringBar.setAttribute("fill", "none");
  ringBar.setAttribute("stroke-width", "5.5"); // Thicker circular progress
  ringBar.setAttribute("stroke", "url(#buddy-timer-grad)");
  ringBar.setAttribute("stroke-dasharray", "289.0");
  ringBar.setAttribute("stroke-dashoffset", "0");
  ringBar.setAttribute("stroke-linecap", "round");

  outerRingSvg.appendChild(ringBg);
  outerRingSvg.appendChild(ringBar);
  container.appendChild(outerRingSvg);

  // 드래그 및 클릭 판정 변수
  let startX = 0;
  let startY = 0;
  let isPointerDown = false;
  let hasMoved = false;

  // 버디 고유 상태 구독하여 이미지 프레임 변경 및 설정 적용
  let lastBuddyId = "";
  let lastFormat = "webp" as any;
  let lastTimerStatus = "idle";

  // JS setInterval 기반 프레임 애니메이션 (content:url() 대체)
  let frameAnimInterval: ReturnType<typeof setInterval> | null = null;
  let frameAnimKey = "";

  function stopFrameAnimation(): void {
    if (frameAnimInterval !== null) {
      clearInterval(frameAnimInterval);
      frameAnimInterval = null;
    }
  }

  function startFrameAnimation(frames: string[], intervalMs: number, key: string): void {
    if (frameAnimKey === key && frameAnimInterval !== null) return; // 이미 동일 애니메이션 실행 중
    stopFrameAnimation();
    frameAnimKey = key;
    if (frames.length === 0) return;
    let idx = 0;
    img.src = frames[0];
    if (frames.length === 1) return;
    const perFrame = Math.max(80, Math.round(intervalMs / frames.length));
    frameAnimInterval = setInterval(() => {
      if (!img.isConnected) { stopFrameAnimation(); return; }
      idx = (idx + 1) % frames.length;
      img.src = frames[idx];
    }, perFrame);
  }

  // 드래그 중 실시간 렌더링 루프
  let currentX = 0;
  let currentY = 0;
  let dragOffset = { x: 0, y: 0 };

  const handlePointerDown = (e: MouseEvent | TouchEvent) => {
    const s = getBuddyState();
    if (!s.config) return;

    isPointerDown = true;
    hasMoved = false;
    
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    const rect = container.getBoundingClientRect();
    dragOffset.x = clientX - rect.left;
    dragOffset.y = clientY - rect.top;

    startX = clientX;
    startY = clientY;

    updateBuddyState({ isDragging: true });
    container.classList.add("dragging");

    document.addEventListener("mousemove", handlePointerMove);
    document.addEventListener("mouseup", handlePointerUp);
    document.addEventListener("touchmove", handlePointerMove, { passive: false });
    document.addEventListener("touchend", handlePointerUp);
  };

  const handlePointerMove = (e: MouseEvent | TouchEvent) => {
    if (!isPointerDown) return;
    const s = getBuddyState();
    if (!s.config) return;

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    const moveX = clientX - startX;
    const moveY = clientY - startY;

    // 5px 이상 움직이면 드래그로 판정
    if (Math.abs(moveX) > 5 || Math.abs(moveY) > 5) {
      hasMoved = true;
    }

    // 위치 연산 및 clamp
    currentX = clientX - dragOffset.x;
    currentY = clientY - dragOffset.y;

    const clamped = clampPosition(
      currentX,
      currentY,
      s.config.size,
      window.innerWidth,
      window.innerHeight
    );

    // 실시간 px 스타일 적용
    container.style.left = `${clamped.x}px`;
    container.style.top = `${clamped.y}px`;
    
    // TouchEvent인 경우 화면 스크롤 기본 동작 차단
    if (e.cancelable) {
      e.preventDefault();
    }
  };

  const handlePointerUp = () => {
    if (!isPointerDown) return;
    isPointerDown = false;
    container.classList.remove("dragging");

    document.removeEventListener("mousemove", handlePointerMove);
    document.removeEventListener("mouseup", handlePointerUp);
    document.removeEventListener("touchmove", handlePointerMove);
    document.removeEventListener("touchend", handlePointerUp);

    const s = getBuddyState();
    if (!s.config) return;

    if (!hasMoved) {
      // 캐릭터 클릭 시 시그니처 사운드 재생
      if (s.config) {
        playCharacterSound(s.config.buddyId);

        // 클릭 시 점프 + 하트/음표 파티클
        triggerJump(container);
        triggerClickParticles(container, false);
      }

      // 드래그가 아닌 단순 클릭인 경우 -> 래디얼 메뉴 토글
      const nextMenuOpen = !s.isMenuOpen;
      updateBuddyState({ 
        isDragging: false,
        isMenuOpen: nextMenuOpen, 
        activePanel: null // 메뉴를 토글하면 패널은 무조건 닫음
      });
    } else {
      // 드래그 완료 -> 최종 위치 백분율(%) 계산하여 전송 및 저장
      const rect = container.getBoundingClientRect();
      const clamped = clampPosition(
        rect.left,
        rect.top,
        s.config.size,
        window.innerWidth,
        window.innerHeight
      );

      // %로 변환 (0~100 범위 보장)
      const denominatorX = window.innerWidth - s.config.size;
      const denominatorY = window.innerHeight - s.config.size;
      
      const xPercent = denominatorX > 0 ? (clamped.x / denominatorX) * 100 : 0;
      const yPercent = denominatorY > 0 ? (clamped.y / denominatorY) * 100 : 0;

      const newConfig = {
        ...s.config,
        position: {
          x: Math.max(0, Math.min(xPercent, 100)),
          y: Math.max(0, Math.min(yPercent, 100)),
        },
      };

      // 낙관적 업데이트: 드래그 오프와 설정 저장을 원자적으로 단 한 번에 업데이트하여 튕김 차단
      updateBuddyState({ 
        isDragging: false,
        config: newConfig 
      });

      chrome.runtime.sendMessage({
        type: "SAVE_BUDDY_CONFIG",
        config: newConfig,
      }).catch((err) => {
        console.warn("[Buddy Drag] Failed to save config to background storage:", err);
      });
    }
  };

  // 마우스 및 터치 리스너
  container.addEventListener("mousedown", handlePointerDown);
  container.addEventListener("touchstart", handlePointerDown, { passive: true });

  let lastInterval = 0;
  let lastActionStatus = "idle";
  let lastCelebrated = false;

  // 이모지 폭죽 파티클 분사 헬퍼 (레벨업용 - 다양한 이모지)
  function triggerCelebrationParticles(charContainer: HTMLElement): void {
    const emojis = ["🎉", "🌟", "✨", "🎈", "❤️", "🔥", "🌈", "🥳"];
    const particleCount = 15;
    
    for (let i = 0; i < particleCount; i++) {
      const p = document.createElement("span");
      p.className = "emoji-particle";
      p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      
      // 캐릭터 중심부 부근 세팅 (정수리 근방)
      p.style.left = `calc(50% - 10px)`;
      p.style.top = `10px`;
      
      // 랜덤 방사 각도 및 거리
      const angle = Math.random() * Math.PI * 2;
      const distance = 40 + Math.random() * 65; // 40~105px 범위
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance - 25; // 상단으로 치우친 벡터
      
      p.style.setProperty("--dx", `${x}px`);
      p.style.setProperty("--dy", `${y}px`);
      
      const scale = 0.5 + Math.random() * 0.9;
      p.style.setProperty("--scale", String(scale));
      
      p.style.animationDelay = `${Math.random() * 0.12}s`;
      p.style.animationDuration = `${0.7 + Math.random() * 0.5}s`;
      
      charContainer.appendChild(p);
      
      setTimeout(() => {
        p.remove();
      }, 1500);
    }
  }

  // 클릭/호버 상호작용 파티클 (하트 ❤️ + 음표 🎵)
  function triggerClickParticles(charContainer: HTMLElement, isHover = false): void {
    const clickEmojis = ["❤️", "🎵", "💖", "🎶", "✨", "💕"];
    const hoverEmojis = ["❤️", "🎵"];
    const emojis = isHover ? hoverEmojis : clickEmojis;
    const count = isHover ? 2 : 6;

    for (let i = 0; i < count; i++) {
      const p = document.createElement("span");
      p.className = "emoji-particle interact-particle";
      p.textContent = emojis[Math.floor(Math.random() * emojis.length)];

      // 캐릭터 상단 중앙에서 시작
      p.style.left = `calc(50% - 8px)`;
      p.style.top = isHover ? `30%` : `20%`;

      // 위쪽 방향으로 퍼지는 벡터
      const angle = (-Math.PI / 2) + (Math.random() - 0.5) * Math.PI * 1.2;
      const distance = isHover ? 20 + Math.random() * 30 : 30 + Math.random() * 55;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;

      p.style.setProperty("--dx", `${x}px`);
      p.style.setProperty("--dy", `${y}px`);

      const scale = isHover ? 0.6 + Math.random() * 0.4 : 0.7 + Math.random() * 0.7;
      p.style.setProperty("--scale", String(scale));

      p.style.animationDelay = `${i * 0.06}s`;
      p.style.animationDuration = `${0.6 + Math.random() * 0.4}s`;
      p.style.fontSize = isHover ? "13px" : "16px";

      charContainer.appendChild(p);
      setTimeout(() => p.remove(), 1200);
    }
  }

  // 캐릭터 점프 애니메이션 트리거
  function triggerJump(charContainer: HTMLElement): void {
    if (charContainer.classList.contains("buddy-jump")) return;
    charContainer.classList.add("buddy-jump");
    setTimeout(() => charContainer.classList.remove("buddy-jump"), 500);
  }

  // 상태 구독하여 CSS 애니메이션 갱신 (JS 타이머 완전 배제)
  subscribeBuddyState((s) => {
    if (!s.config) return;

    // 타이머 상태 변경 시 애니메이션 캐시 초기화
    if (s.timerStatus !== lastTimerStatus) {
      currentAppliedAnimation = "";
      lastTimerStatus = s.timerStatus;
    }

    // 타이머 게이지 및 뱃지 업데이트
    if (s.timerStatus === "running" || s.timerStatus === "paused") {
      container.classList.add("has-timer");
      // 타이머 실행 및 일시정지 상태에서도 이미지를 항상 노출
      img.style.display = "";
      
      // 타이머 숫자 크기 클래스 분기 (S: 소, M: 중, L: 대)
      const tSize = s.config?.timerSize || "L";
      container.classList.remove("timer-size-s", "timer-size-m", "timer-size-l");
      container.classList.add(`timer-size-${tSize.toLowerCase()}`);

      // 타이머 숫자 색상 클래스 분기
      const tColor = s.config?.timerColor || "default";
      container.classList.remove(
        "timer-color-default",
        "timer-color-purple",
        "timer-color-blue",
        "timer-color-mint",
        "timer-color-rose",
        "timer-color-yellow",
        "timer-color-orange",
        "timer-color-white"
      );
      container.classList.add(`timer-color-${tColor}`);
      
      // 화면 상단 영역(y가 35% 이하)에 있을 때 타이머를 아래에 배치하여 잘림 방지
      if (s.config && s.config.position.y <= 35) {
        container.classList.add("timer-below");
      } else {
        container.classList.remove("timer-below");
      }
      
      // 뽀모도로 페이즈 및 타이머 클래스 적용
      if (s.pomodoroPhase === "focus") {
        container.classList.add("timer-running-focus");
        container.classList.remove("timer-running-break");
      } else if (s.pomodoroPhase === "break") {
        container.classList.add("timer-running-break");
        container.classList.remove("timer-running-focus");
      } else {
        container.classList.remove("timer-running-focus", "timer-running-break");
      }
      
      const m = Math.floor(s.timerRemaining / 60);
      const ss = s.timerRemaining % 60;
      
      // 뽀모도로 단계별 미니 아이콘 접두사 제거 (사용자 요청)
      const prefix = "";
      badgeTimeSpan.textContent = `${prefix}${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
      
      // 289.0 = 2 * PI * 46
      const progress = s.timerTotal > 0 ? (s.timerRemaining / s.timerTotal) : 0;
      const offset = 289.0 * (1 - progress);
      ringBar.setAttribute("stroke-dashoffset", String(offset));
      
      if (s.timerStatus === "paused") {
        ringBar.classList.add("paused");
        badgePlayPauseBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
        badgePlayPauseBtn.title = t("timerResume") || "Resume";
      } else {
        ringBar.classList.remove("paused");
        badgePlayPauseBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>`;
        badgePlayPauseBtn.title = t("timerPause") || "Pause";
      }
    } else {
      container.classList.remove("has-timer", "timer-running-focus", "timer-running-break");
      // 타이머 종료 시 캐릭터 이미지 복원
      img.style.display = "";
    }

    // 타이머 완료 축하 폭죽 단 한번만 발포하도록 방어
    const hasCelebrateClass = container.classList.contains("timer-complete-celebrate");
    if (hasCelebrateClass && !lastCelebrated) {
      lastCelebrated = true;
      triggerCelebrationParticles(container);
    } else if (!hasCelebrateClass) {
      lastCelebrated = false;
    }

    // 액션 상태 클래스 동기화
    const isStatusChanged = s.actionStatus !== lastActionStatus;
    if (isStatusChanged) {
      container.classList.remove("loading", "success", "error");
      if (s.actionStatus !== "idle") {
        container.classList.add(s.actionStatus);
      }
      lastActionStatus = s.actionStatus;
    }

    // 상태별 이미지 에셋 연동 및 폴백 로직
    let stateName = "";
    const isCelebrate = container.classList.contains("timer-complete-celebrate");
    if (isCelebrate) {
      stateName = "celebrate";
    } else if (s.actionStatus === "loading") {
      stateName = "loading";
    } else if (s.timerStatus === "running" || s.timerStatus === "paused") {
      stateName = s.pomodoroPhase === "break" ? "break" : "focus";
    }

    let speedFactor = 1.0;
    if (s.actionStatus === "loading") {
      speedFactor = 0.4; // 분석 중: 0.4배 빠른 재생 프레임
    } else if (s.actionStatus === "success") {
      speedFactor = 0.6; // 성공 리액션
    }
    
    const intervalSec = ((s.config.animationInterval * speedFactor) / 1000).toFixed(2);
    const buddyId = s.config.buddyId;
    const animKey = `${buddyId}-${stateName}-${intervalSec}`;

    if (animKey !== currentAppliedAnimation || isStatusChanged) {
      currentAppliedAnimation = animKey;
      lastBuddyId = buddyId;
      lastInterval = s.config.animationInterval;

      if (stateName) {
        const f1 = getStateFrameUrl(buddyId, stateName, 1);
        const f2 = getStateFrameUrl(buddyId, stateName, 2);
        const f3 = getStateFrameUrl(buddyId, stateName, 3);

        Promise.all([
          checkResourceExists(f1),
          checkResourceExists(f2),
          checkResourceExists(f3)
        ]).then(([e1, e2, e3]) => {
          // 비동기 완료 시점에 상태가 바뀌지 않았는지 재검증 (Race Condition 방지)
          if (animKey !== currentAppliedAnimation) return;

          if (e1) {
            // 동적 keyframe 스타일 생성 및 주입
            const styleId = `buddy-keyframes-state-${buddyId}-${stateName}`;
            let styleEl = shadow.getElementById(styleId) as HTMLStyleElement;
            if (!styleEl) {
              styleEl = document.createElement("style");
              styleEl.id = styleId;
              shadow.appendChild(styleEl);
            }

            // 존재하는 프레임 개수에 맞춰 동적으로 keyframes 분기 정의 (404 원천 차단)
            if (e2 && e3) {
              styleEl.textContent = `
                @keyframes play-buddy-${buddyId}-${stateName} {
                  0% { content: url('${f1}'); }
                  33.33% { content: url('${f2}'); }
                  66.66% { content: url('${f3}'); }
                  100% { content: url('${f1}'); }
                }
              `;
            } else if (e2) {
              styleEl.textContent = `
                @keyframes play-buddy-${buddyId}-${stateName} {
                  0%, 100% { content: url('${f1}'); }
                  50% { content: url('${f2}'); }
                }
              `;
            } else {
              // 단일 프레임 정적 이미지인 경우
              styleEl.textContent = `
                @keyframes play-buddy-${buddyId}-${stateName} {
                  0%, 100% { content: url('${f1}'); }
                }
              `;
            }
            img.style.animation = `play-buddy-${buddyId}-${stateName} ${intervalSec}s infinite`;
          } else {
            // 01번 프레임조차 없으면 기본 루프 애니메이션으로 폴백
            img.style.animation = `play-buddy-${buddyId} ${intervalSec}s infinite`;
          }
        }).catch(() => {
          // 비동기 검사 에러 시 기본 폴백
          img.style.animation = `play-buddy-${buddyId} ${intervalSec}s infinite`;
        });
      } else {
        // 기본 대기 모드 애니메이션
        img.style.animation = `play-buddy-${buddyId} ${intervalSec}s infinite`;
      }
    }
  });

  // 모달 내 콘페티(Confetti) 폭죽 생성기
  function triggerModalConfetti(modalContainer: HTMLElement): void {
    const confettiColors = ["#ffd700", "#ff4757", "#2ed573", "#1e90ff", "#a855f7", "#ffa500"];
    const shapes = ["★", "●", "▲", "◆", "✨", "🎉"];
    
    for (let i = 0; i < 50; i++) {
      const p = document.createElement("span");
      p.className = "modal-confetti-particle";
      p.textContent = shapes[Math.floor(Math.random() * shapes.length)];
      p.style.color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
      
      p.style.left = `50%`;
      p.style.top = `45%`;
      
      const angle = Math.random() * Math.PI * 2;
      const distance = 80 + Math.random() * 220; 
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance - 40; 
      
      p.style.setProperty("--dx", `${x}px`);
      p.style.setProperty("--dy", `${y}px`);
      
      const scale = 0.4 + Math.random() * 0.8;
      p.style.setProperty("--scale", String(scale));
      
      p.style.animationDelay = `${Math.random() * 0.3}s`;
      p.style.animationDuration = `${1.2 + Math.random() * 0.8}s`;
      
      modalContainer.appendChild(p);
      
      setTimeout(() => {
        p.remove();
      }, 3000);
    }
  }

  // 레벨업 시 머리 위에 "LEVEL UP! 🌟" 뱃지를 띄우는 리액션 및 팝업 모달 연동
  const handleLevelUp = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    const { level, newlyUnlocked } = detail;
    
    // 1. 레벨업 플로팅 뱃지 엘리먼트 생성
    const lvBadge = document.createElement("div");
    lvBadge.className = "buddy-levelup-badge";
    
    let unlockedMsg = "";
    if (newlyUnlocked && newlyUnlocked.length > 0) {
      unlockedMsg = `<div class="unlocked-msg" style="font-size: 8.5px; opacity: 0.95; color: #ffd700; font-weight: bold; margin-top: 2px;">🔑 Unlocked: ${newlyUnlocked.join(", ").toUpperCase()}</div>`;
    }
    
    lvBadge.innerHTML = `
      <div class="levelup-text" style="font-size: 10px; font-weight: bold; color: #fff; letter-spacing: 0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">LEVEL UP! 🌟</div>
      <div class="levelup-num" style="font-size: 15px; font-weight: 800; color: #ffd700; margin-top: 1px; text-shadow: 0 2px 5px rgba(0,0,0,0.6);">Lv. ${level}</div>
      ${unlockedMsg}
    `;
    
    container.appendChild(lvBadge);
    
    // 2. 이모지 폭죽 뿜기
    triggerCelebrationParticles(container);
    
    // 3. 3초 뒤에 자동 삭제
    setTimeout(() => {
      lvBadge.style.transition = "all 0.5s ease";
      lvBadge.style.opacity = "0";
      lvBadge.style.transform = "translate(-50%, -20px) scale(0.8)";
      setTimeout(() => lvBadge.remove(), 500);
    }, 3000);

    // 4. 해금 캐릭터가 있을 시 레벨업 팝업 모달 생성
    if (newlyUnlocked && newlyUnlocked.length > 0) {
      const unlockedId = newlyUnlocked[0];
      const buddyName = unlockedId.toUpperCase();
      const thumbUrl = getThumbnailUrl(unlockedId);

      const overlay = document.createElement("div");
      overlay.className = "buddy-levelup-overlay";

      overlay.innerHTML = `
        <div class="buddy-levelup-modal">
          <div class="modal-particles-bg"></div>
          <div class="modal-title">NEW BUDDY UNLOCKED! 🎉</div>
          <div class="modal-subtitle">Congratulations! You reached Level ${level}!</div>
          
          <div class="modal-buddy-showcase">
            <div class="modal-buddy-ring"></div>
            <img class="modal-buddy-img" src="${thumbUrl}" alt="${unlockedId}">
          </div>
          
          <div class="modal-buddy-name">${buddyName}</div>
          <div class="modal-message">A secret companion has emerged from the mist to join your browser journey!</div>
          
          <div class="modal-actions">
            <button class="modal-btn equip-btn">Equip Now</button>
            <button class="modal-btn close-btn">Maybe Later</button>
          </div>
        </div>
      `;

      shadow.appendChild(overlay);
      triggerModalConfetti(overlay);

      const closePopup = () => {
        overlay.classList.add("fade-out");
        setTimeout(() => overlay.remove(), 400);
      };

      overlay.querySelector(".close-btn")?.addEventListener("click", (e) => {
        e.stopPropagation();
        closePopup();
      });

      overlay.querySelector(".equip-btn")?.addEventListener("click", (e) => {
        e.stopPropagation();
        const state = getBuddyState();
        if (state.config) {
          const updated = { 
            ...state.config, 
            buddyId: unlockedId 
          };
          updateBuddyState({ config: updated });
          
          chrome.runtime.sendMessage({
            type: "SAVE_BUDDY_CONFIG",
            config: updated,
          }).catch((err) => {
            console.warn("[Level-up Modal] Failed to save config:", err);
          });
        }
        closePopup();
      });
    }
  };
  window.addEventListener("buddy-levelup", handleLevelUp);

  // 전역 클린업 리스너 연결 확장
  const root = document.getElementById("clickbook-buddy-root");
  if (root) {
    const oldCleanup = (root as any).__cleanupBuddy;
    (root as any).__cleanupBuddy = () => {
      if (typeof oldCleanup === "function") oldCleanup();
      window.removeEventListener("buddy-levelup", handleLevelUp);
    };
  }

  return container;
}
