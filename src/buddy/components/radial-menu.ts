import { RADIAL_ITEMS } from "../buddy-constants";
import { getBuddyState, updateBuddyState, addBuddyXp } from "../buddy-state";
import { showBubbleConfirm } from "./buddy-confirm";
import { calculateRadialPositions } from "../buddy-utils";
import type { RadialDirection, BuddyState } from "../buddy-types";
import { showBuddyToast } from "./buddy-toast";
import { t } from "../i18n";
import { triggerTimerCompleteEffect } from "./timer-effect";

let radialItems: HTMLElement[] = [];
let lastMenuOpen = false;



const removeBuddyDOM = () => {
  const root = document.getElementById("clickbook-buddy-root");
  if (root) {
    if (typeof (root as any).__cleanupBuddy === "function") {
      try {
        (root as any).__cleanupBuddy();
      } catch {}
    }
    root.remove();
  }
};

export function createRadialMenu(shadow: ShadowRoot, parent: HTMLElement): void {
  const container = document.createElement("div");
  container.className = "radial-menu-container";
  parent.appendChild(container);

  radialItems = RADIAL_ITEMS.map((item, index) => {
    const btn = document.createElement("div");
    btn.className = "radial-item";
    btn.innerHTML = item.icon;
    btn.title = t(item.labelKey as any);
    btn.style.setProperty("--delay", `${index * 80}ms`);
    btn.dataset.id = item.id;

    btn.addEventListener("click", (e) => {
      e.stopPropagation();

      const s = getBuddyState();
      
      // disabled 혹은 이미 즐겨찾기 완료된 사이트(bookmarked)는 클릭 무효화 차단
      if (btn.classList.contains("disabled") || btn.classList.contains("bookmarked")) {
        return;
      }

      updateBuddyState({ isMenuOpen: false });

      // 설정(settings)과 버디 숨기기(hide)를 제외한 6가지 기능 사용 시 1 XP 지급
      if (item.id !== "settings" && item.id !== "hide") {
        addBuddyXp(1);
      }

      if (item.immediate) {
        if (item.id === "bookmark") {
          const url = window.location.href;
          const title = document.title || "No Title";
          
          chrome.runtime.sendMessage({
            type: "BUDDY_SAVE_BOOKMARK",
            url,
            title,
          }).then((res: any) => {
            if (res && res.success) {
              showBuddyToast(t("bookmarkSaved"));
              // 저장 성공 시 즉시 해당 버튼을 bookmarked 상태로 변경
              btn.classList.add("bookmarked");
              btn.title = t("bookmarkExists");
            } else if (res && res.error === "ALREADY_SAVED") {
              showBuddyToast(t("bookmarkAlready"));
              btn.classList.add("bookmarked");
              btn.title = t("bookmarkExists");
            } else {
              showBuddyToast("Error saving bookmark.");
            }
          });
        } else if (item.id === "hide") {
          const domain = window.location.hostname;
          
          // 버디 플로팅 캐릭터 컨테이너(parent) 바로 머리 위에 말풍선 확인창(Confirm Bubble)을 띄움
          showBubbleConfirm(shadow, parent, t("hideSiteConfirm"), t("confirmHide"), () => {
            chrome.runtime.sendMessage({
              type: "BUDDY_HIDE_SITE",
              domain,
            }).then((res: any) => {
              if (res && res.success) {
                removeBuddyDOM();
              }
            });
          });
        } else if (item.id === "rest") {
          const state = getBuddyState();
          const config = state.config;
          const isRandom = config?.restRandomTheme === true;

          let selectedTheme: string | undefined = undefined;
          if (isRandom) {
            const allThemes = ["night", "forest", "ocean", "fireplace", "sunset", "yoga", "gallery", "breath"];
            selectedTheme = allThemes[Math.floor(Math.random() * allThemes.length)];
          }

          triggerTimerCompleteEffect(shadow, "", true, selectedTheme);
        }
      } else if (item.cardType) {
        updateBuddyState({ activePanel: item.cardType });
      }
    });

    container.appendChild(btn);
    return btn;
  });
}

export function updateRadialMenuState(state: BuddyState, direction: RadialDirection): void {
  const size = state.config ? state.config.size : 96;
  // 버디 크기에 완전히 비례하여 중심원 반경(반지름)이 동적으로 변경되도록 넉넉한 보간 처리 적용
  // 다이얼 버튼 간 겹침 현상을 막기 위해 최소 반지름을 92px로 상향하고, 캐릭터 몸체(size/2) 기준 54px 만큼 널널하게 벌려 정렬
  const dynamicRadius = Math.max(92, Math.round(size / 2) + 54);
  const positions = calculateRadialPositions(radialItems.length, dynamicRadius, direction);

  // 래디얼 메뉴가 최초로 토글하여 열릴 때만 비동기로 북마크 중복 체크 수행
  if (state.isMenuOpen && !lastMenuOpen) {
    const currentUrl = window.location.href;
    chrome.runtime.sendMessage({
      type: "BUDDY_CHECK_BOOKMARK",
      url: currentUrl
    }).then((res: any) => {
      const bookmarkBtn = radialItems.find(btn => btn.dataset.id === "bookmark");
      if (bookmarkBtn) {
        if (res && res.success && res.exists) {
          bookmarkBtn.classList.add("bookmarked");
          bookmarkBtn.title = t("bookmarkExists");
        } else {
          bookmarkBtn.classList.remove("bookmarked");
          bookmarkBtn.title = t("menuBookmark" as any);
        }
      }
    }).catch(() => {});
  }
  lastMenuOpen = state.isMenuOpen;

  radialItems.forEach((btn, index) => {
    const itemConfig = RADIAL_ITEMS[index];
    
    // 기본 툴팁 설정 (언어 실시간 변경 대응)
    if (itemConfig.id === "bookmark") {
      if (btn.classList.contains("bookmarked")) {
        btn.title = t("bookmarkExists");
      } else {
        btn.title = t(itemConfig.labelKey as any);
      }
    } else {
      btn.title = t(itemConfig.labelKey as any);
    }
    
    if (itemConfig.id === "translate" || itemConfig.id === "chat") {
      const isAIAvailable = state.aiAvailable;
      const originalTitleKey = itemConfig.id === "translate" ? "menuTranslate" : "menuChat";
      if (!isAIAvailable) {
        btn.classList.add("disabled");
        btn.title = t("translateDisabledTooltip" as any);
      } else {
        btn.classList.remove("disabled");
        btn.title = t(originalTitleKey as any);
      }
    }

    if (itemConfig.id === "hide") {
      btn.title = t("menuHideTooltip" as any);
    }

    if (itemConfig.id === "timer") {
      const isTimerActive = state.timerStatus === "running" || state.timerStatus === "paused";
      if (isTimerActive) {
        btn.classList.add("disabled");
        btn.title = t("timerAlreadyActive" as any);
      } else {
        btn.classList.remove("disabled");
        btn.title = t("menuTimer" as any);
      }
    }

    if (state.isMenuOpen) {
      const pos = positions[index];
      if (pos) {
        btn.style.setProperty("--tx", `${pos.tx}px`);
        btn.style.setProperty("--ty", `${pos.ty}px`);
      }
      btn.classList.add("open");
    } else {
      btn.classList.remove("open");
    }
  });
}
