import { injectBuddySystem, removeBuddySystem, getBuddyShadowRoot } from "./buddy-injector";
import { updateBuddyState } from "./buddy-state";
import { isContextInvalidated } from "./buddy-utils";
import { initStickyMemos } from "./components/sticky-memo";

function initBuddyContentScript(): void {
  // 이미 주입되어 렌더링 중인 경우, 이전 고아 DOM일 수 있으므로 완전히 청소하고 새로 인젝션
  const existing = document.getElementById("clickbook-buddy-root");
  if (existing) {
    if (typeof (existing as any).__cleanupBuddy === "function") {
      try {
        (existing as any).__cleanupBuddy();
      } catch {}
    }
    existing.remove();
  }

  // 1. 설정 로드
  chrome.runtime.sendMessage({ type: "GET_BUDDY_CONFIG" }).then((res: any) => {
    if (res && res.success && res.data) {
      const { config, aiAvailable } = res.data;
      
      // 상태 초기화
      updateBuddyState({
        config,
        aiAvailable: aiAvailable === true,
        isMenuOpen: false,
        activePanel: null,
      });

      // 2. 버디 시스템 인젝션
      injectBuddySystem();
      const shadow = getBuddyShadowRoot();
      if (shadow) {
        initStickyMemos(shadow);
      }
    }
  });
}

// 백그라운드로부터 동적 메시지 리스너 바인딩
const messageListener = (message: any, _sender: any, sendResponse: any) => {
  // 컨텍스트 만료 검사 및 자폭
  if (isContextInvalidated()) {
    try {
      chrome.runtime.onMessage.removeListener(messageListener);
    } catch {}
    return;
  }

  try {
    if (message.type === "BUDDY_CONFIG_UPDATE") {
      updateBuddyState({ config: message.config });
      
      // 탭 내에 버디 엘리먼트가 없는데 설정상 켜진 경우 동적으로 렌더링 주입
      if (message.config.enabled && !document.getElementById("clickbook-buddy-root")) {
        injectBuddySystem();
      }
      
      sendResponse({ success: true });
    } else if (message.type === "BUDDY_REMOVE") {
      removeBuddySystem();
      
      // 리스너 셀프 제거로 리소스 해제
      chrome.runtime.onMessage.removeListener(messageListener);
      sendResponse({ success: true });
    }
  } catch (e) {
    // 예외 차단
  }
};

chrome.runtime.onMessage.addListener(messageListener);

// 기동
initBuddyContentScript();
