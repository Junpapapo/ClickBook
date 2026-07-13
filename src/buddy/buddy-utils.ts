import type { RadialDirection } from "./buddy-types";
import { HIDDEN_BUDDIES } from "./buddy-constants";

// 위치를 화면 내 영역으로 제한 (px 단위)
export function clampPosition(
  x: number,
  y: number,
  size: number,
  vw: number,
  vh: number,
  padding: number = 8
): { x: number; y: number } {
  const minX = padding;
  const maxX = vw - size - padding;
  const minY = padding;
  const maxY = vh - size - padding;

  return {
    x: Math.max(minX, Math.min(x, maxX)),
    y: Math.max(minY, Math.min(y, maxY)),
  };
}

import { getBuddyState } from "./buddy-state";

// 캐릭터별 등급 타입 자동 감지 헬퍼
export function detectBuddyType(buddyId: string, preferredType?: "basic" | "premium" | "hidden"): "basic" | "premium" | "hidden" {
  if (preferredType) return preferredType;

  const basicSet = new Set([
    "bsprout", "bydragon", "cat", "cotton", "curobot", "fox", "owl", "penguin", "rabbit", "shroom", "star", "xcafe", "xcloud"
  ]);
  const premiumSet = new Set([
    "astrobot", "corgi", "dog", "dragon", "fairy", "fennec", "jellyfish", "nebula", "ufo", "unicorn", "wizard", "sprout", "chef",
    "p_cat", "p_fox", "p_owl", "p_penguin", "p_rabbit"
  ]);
  const hiddenSet = new Set([
    "blue_dragon", "cactus", "h_chef", "cloud", "cupcake", "dino", "frosty", "ghost", "hamster", "hedgehog", "otter", "panda", "penguin_blue_hat", "red_panda", "sky_dragon", "sprout_fairy", "witchy"
  ]);

  if (basicSet.has(buddyId)) return "basic";
  if (premiumSet.has(buddyId)) return "premium";
  if (hiddenSet.has(buddyId)) return "hidden";

  return "basic";
}

// 0-패딩 프레임 이미지 URL 변환
export function getFrameUrl(
  buddyId: string, 
  frameNum: number, 
  format: "webp" | "png" = "webp",
  buddyType?: "basic" | "premium" | "hidden"
): string {
  try {
    if (isContextInvalidated()) {
      return "";
    }
    const paddedFrame = String(frameNum).padStart(2, "0");
    
    let type = buddyType;
    if (!type) {
      const s = getBuddyState();
      if (s.config && s.config.buddyId === buddyId && s.config.buddyType) {
        type = s.config.buddyType;
      } else {
        type = detectBuddyType(buddyId);
      }
    }

    const basePath = `buddies/characters/${type}/${buddyId}`;
    return chrome.runtime.getURL(`${basePath}/frame_${paddedFrame}.${format}`);
  } catch {
    return "";
  }
}

// 썸네일 이미지 URL 변환
export function getThumbnailUrl(
  buddyId: string, 
  format: "webp" | "png" = "webp",
  buddyType?: "basic" | "premium" | "hidden"
): string {
  try {
    if (isContextInvalidated()) {
      return "";
    }
    let type = buddyType;
    if (!type) {
      const s = getBuddyState();
      if (s.config && s.config.buddyId === buddyId && s.config.buddyType) {
        type = s.config.buddyType;
      } else {
        type = detectBuddyType(buddyId);
      }
    }
    const basePath = `buddies/characters/${type}/${buddyId}`;
    return chrome.runtime.getURL(`${basePath}/frame_01.${format}`);
  } catch {
    return "";
  }
}

// URL에서 도메인 추출
export function extractDomain(urlStr: string): string {
  try {
    const url = new URL(urlStr);
    return url.hostname;
  } catch {
    return urlStr;
  }
}

// 컨텍스트 만료 검증 유틸리티 (성능 최적화 및 API 스로틀링 오류 차단)
export function isContextInvalidated(): boolean {
  try {
    return typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.id;
  } catch {
    return true;
  }
}

// 버디의 백분율 위치를 기준으로 화면의 사분면 감지 -> 래디얼 메뉴 전개 방향 반환
export function detectRadialDirection(xPercent: number, yPercent: number): RadialDirection {
  const isLeft = xPercent <= 50;
  const isTop = yPercent <= 50;

  if (isTop) {
    return isLeft ? "bottom-right" : "bottom-left";
  } else {
    return isLeft ? "top-right" : "top-left";
  }
}

// 전개 방향 및 아이템 인덱스에 따라 각 아이템의 상대적 변위 (tx, ty) 계산
export function calculateRadialPositions(
  itemCount: number,
  radius: number,
  direction: RadialDirection
): Array<{ tx: number; ty: number }> {
  const positions: Array<{ tx: number; ty: number }> = [];
  
  // 사분면별 부채꼴 각도 범위 설정 (단위: 도)
  let startAngle = 0;
  let endAngle = 90;

  switch (direction) {
    case "bottom-right": // 우하향
      startAngle = -7.5;
      endAngle = 97.5;
      break;
    case "bottom-left": // 좌하향
      startAngle = 82.5;
      endAngle = 187.5;
      break;
    case "top-left": // 좌상향
      startAngle = 172.5;
      endAngle = 277.5;
      break;
    case "top-right": // 우상향
      startAngle = 262.5;
      endAngle = 367.5;
      break;
  }

  // 아이템 수에 따라 고르게 각도 분배
  const angleRange = endAngle - startAngle;
  const angleStep = itemCount > 1 ? angleRange / (itemCount - 1) : 0;

  for (let i = 0; i < itemCount; i++) {
    const angle = startAngle + i * angleStep;
    const rad = (angle * Math.PI) / 180;
    
    positions.push({
      tx: Math.round(radius * Math.cos(rad)),
      ty: Math.round(radius * Math.sin(rad)),
    });
  }

  return positions;
}

// 버디 크기 및 화면 뷰포트를 고려해 패널의 최적 위치 계산
export function calculatePanelPosition(
  buddyRect: { x: number; y: number; width: number; height: number },
  panelWidth: number,
  panelHeight: number,
  direction: RadialDirection,
  vw: number,
  vh: number,
  padding: number = 12
): { top: number; left: number } {
  let left = 0;
  let top = 0;

  // 좌/우 판단에 따라 배치
  if (direction.includes("right")) {
    // 버디 오른쪽에 패널 배치
    left = buddyRect.x + buddyRect.width + padding;
  } else {
    // 버디 왼쪽에 패널 배치
    left = buddyRect.x - panelWidth - padding;
  }

  // 상/하 판단에 따라 배치
  if (direction.includes("bottom")) {
    // 버디 상단 정렬 및 아래로 확장
    top = buddyRect.y;
  } else {
    // 버디 하단 정렬 및 위로 확장
    top = buddyRect.y + buddyRect.height - panelHeight;
  }

  // 화면 경계 밖으로 벗어나지 않게 클램핑 처리 (최소 520px 높이를 상정하여 하단 짤림 방지)
  const assumedHeight = Math.max(panelHeight, 520);
  left = Math.max(padding, Math.min(left, vw - panelWidth - padding));
  top = Math.max(padding, Math.min(top, vh - assumedHeight - padding));

  return { top, left };
}

/**
 * 경량 마크다운 및 HTML 안전 파서 (공통화)
 * HTML 기본 이스케이프로 XSS를 방어하면서, 마크다운 문법(**bold**, *italic*, `inline code`, ```block```)만 HTML로 렌더링합니다.
 */
export function parseMarkdown(text: string): string {
  if (!text) return "";

  // 1. XSS 방지를 위해 특수문자 HTML 이스케이프
  let safeHtml = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  // 2. 멀티라인 코드 블록 파싱 (```language ... ```)
  safeHtml = safeHtml.replace(/```(?:[a-zA-Z0-9_-]+)?\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

  // 3. 인라인 코드 파싱 (`code`)
  safeHtml = safeHtml.replace(/`([^`]+)`/g, '<code>$1</code>');

  // 4. 굵은 글씨 파싱 (**bold**)
  safeHtml = safeHtml.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // 5. 기울임꼴 파싱 (*italic*)
  safeHtml = safeHtml.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // 6. pre 블록만 임시 마스킹한 뒤 \n을 <br>로 바꾸고 언마스킹
  const placeholders: string[] = [];
  safeHtml = safeHtml.replace(/<pre>[\s\S]*?<\/pre>/g, (match) => {
    placeholders.push(match);
    return `__PRE_PLACEHOLDER_${placeholders.length - 1}__`;
  });

  safeHtml = safeHtml.replace(/\n/g, "<br>");

  placeholders.forEach((val, idx) => {
    safeHtml = safeHtml.replace(`__PRE_PLACEHOLDER_${idx}__`, val);
  });

  return safeHtml;
}

// 리소스 존재 여부 메모리 캐시
const checkedResources = new Map<string, boolean>();

// 익스텐션 로컬 리소스 존재 여부 사전 체크 (콘솔 404 차단 목적)
export async function checkResourceExists(url: string): Promise<boolean> {
  if (!url) return false;
  if (checkedResources.has(url)) {
    return checkedResources.get(url)!;
  }
  try {
    const res = await fetch(url, { method: "HEAD" });
    const exists = res.ok;
    checkedResources.set(url, exists);
    return exists;
  } catch {
    checkedResources.set(url, false);
    return false;
  }
}

// 특정 상태에 대한 이미지 URL 변환
export function getStateFrameUrl(
  buddyId: string,
  stateName: string,
  frameNum: number,
  format: "webp" | "png" = "webp"
): string {
  try {
    if (isContextInvalidated()) {
      return "";
    }
    const paddedFrame = String(frameNum).padStart(2, "0");
    const isHidden = HIDDEN_BUDDIES.includes(buddyId);
    const basePath = isHidden ? `buddies/hidden/${buddyId}` : `buddies/characters/${buddyId}`;
    return chrome.runtime.getURL(`${basePath}/state_${stateName}_${paddedFrame}.${format}`);
  } catch {
    return "";
  }
}

// Web Audio API를 활용한 캐릭터별 시그니처 사운드 합성기
export function playCharacterSound(buddyId: string): void {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    const now = audioCtx.currentTime;
    
    // 캐릭터별 음색 및 주파수 패턴 설정
    switch (buddyId) {
      case "owl": // 부엉이: 낮고 부드러운 두 번의 울음소리 (Hoot)
        osc.type = "sine";
        osc.frequency.setValueAtTime(350, now);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.15, now + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        
        osc.frequency.setValueAtTime(330, now + 0.3);
        gainNode.gain.setValueAtTime(0, now + 0.3);
        gainNode.gain.linearRampToValueAtTime(0.15, now + 0.35);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        
        osc.start(now);
        osc.stop(now + 0.6);
        break;
        
      case "cat": // 고양이: 높고 앙증맞게 올라가는 울음소리 (Meow)
        osc.type = "triangle";
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(850, now + 0.25);
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.15, now + 0.08);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        
        osc.start(now);
        osc.stop(now + 0.35);
        break;
        
      case "starbot":
      case "ufo": // 로봇/UFO: 기계적인 삐빅 소리 (Chirp)
        osc.type = "square";
        osc.frequency.setValueAtTime(880, now);
        gainNode.gain.setValueAtTime(0.1, now);
        
        osc.frequency.setValueAtTime(1760, now + 0.08);
        
        gainNode.gain.setValueAtTime(0.1, now + 0.08);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        
        osc.start(now);
        osc.stop(now + 0.22);
        break;

      case "rabbit":
      case "fairy": // 토끼/요정: 뾰로롱 스타 더스트 소리 (Chime)
        osc.type = "sine";
        gainNode.gain.setValueAtTime(0, now);
        
        const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        freqs.forEach((freq, idx) => {
          const noteTime = now + idx * 0.06;
          osc.frequency.setValueAtTime(freq, noteTime);
          gainNode.gain.setValueAtTime(0.1, noteTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.15);
        });
        
        osc.start(now);
        osc.stop(now + 0.4);
        break;
        
      default: // 기본 캐릭터: 조용하고 부드러운 알림음
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, now);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.12, now + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        
        osc.start(now);
        osc.stop(now + 0.3);
        break;
    }
  } catch (err) {
    console.warn("[Buddy Audio Synthesis] Web Audio not supported or blocked by gesture restrictions:", err);
  }
}


