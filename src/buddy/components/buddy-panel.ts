import { getBuddyState, subscribeBuddyState, updateBuddyState } from "../buddy-state";
import { calculatePanelPosition, detectRadialDirection, isContextInvalidated, getThumbnailUrl, detectBuddyType } from "../buddy-utils";
import { HIDDEN_BUDDIES } from "../buddy-constants";
import { renderTranslateCard } from "./translate-card";
import { renderSettingsCard } from "./settings-card";
import { renderMemoCard } from "../memo";
import { renderChatCard } from "../chat";
import { renderTimerCard } from "./timer-card";
import { getChatState } from "../chat/chat-state";
import { t } from "../i18n";



export function createBuddyPanel(shadow: ShadowRoot): HTMLElement {
  const panel = document.createElement("div");
  panel.className = "floating-panel";

  const header = document.createElement("div");
  header.className = "panel-header";

  const title = document.createElement("h3");
  title.className = "panel-title";

  const closeBtn = document.createElement("button");
  closeBtn.className = "panel-close-btn";
  closeBtn.innerHTML = "&times;";
  closeBtn.title = "Close";

  // Reveal All Hidden - 토글 스위치 형태 (닫기 버튼 왼쪽) - UI상에서는 완전히 비표시(display: none)
  const revealWrap = document.createElement("label");
  revealWrap.className = "panel-reveal-option";
  revealWrap.style.display = "none";
  revealWrap.title = "Show all hidden characters";
  revealWrap.innerHTML = `
    <span class="panel-reveal-label">Reveal All</span>
    <span class="panel-toggle-switch">
      <input type="checkbox" class="panel-toggle-input" id="buddy-reveal-all">
      <span class="panel-toggle-track"><span class="panel-toggle-thumb"></span></span>
    </span>
  `;

  const revealCheckbox = revealWrap.querySelector(".panel-toggle-input") as HTMLInputElement;
  revealCheckbox.checked = getBuddyState().revealHidden;

  revealCheckbox.addEventListener("change", (e) => {
    e.stopPropagation();
    const checked = revealCheckbox.checked;
    updateBuddyState({ revealHidden: checked });
    // config에도 동기 저장해서 팝업이 읽을 수 있도록
    const s = getBuddyState();
    if (s.config) {
      const updated = { ...s.config, revealHidden: checked };
      updateBuddyState({ config: updated });
      chrome.runtime.sendMessage({ type: "SAVE_BUDDY_CONFIG", config: updated }).catch(() => {});
    }
  });

  header.appendChild(title);
  header.appendChild(revealWrap);
  header.appendChild(closeBtn);
  panel.appendChild(header);

  const body = document.createElement("div");
  body.className = "panel-body";
  panel.appendChild(body);

  // ─ 패널 외부 클릭 감지 전략: 투명 오버레이 방식
  //
  //   document 이벤트 리스너(composedPath, e.target, getBoundingClientRect 등)는
  //   closed Shadow DOM 경계에서 이벤트가 retarget되는 방식 때문에
  //   신뢰할 수 없는 결과를 반환하는 경우가 있어 사용하지 않는다.
  //
  //   대신 Shadow DOM 내부에 전체화면 투명 오버레이를 생성하여:
  //   - 패널 외부 클릭 → 오버레이가 이벤트를 받음 → 패널 닫기
  //   - 패널 내부 클릭 → 패널이 오버레이보다 높은 z-index이므로 오버레이 이벤트 발생 안 함
  //   - 버디 캐릭터(z-index: 999999)는 오버레이(999997)보다 위에 있으므로 정상 클릭 가능
  const overlay = document.createElement("div");
  overlay.id = "buddy-panel-overlay";

  overlay.addEventListener("mousedown", (e) => {
    if (isContextInvalidated()) return;

    // 방어 코드: 브라우저 네이티브 UI(number input 스피너 등)가
    // z-index 우선순위를 무시하고 오버레이에 mousedown을 전달할 수 있음.
    // 클릭 좌표가 패널 영역 내부라면 닫지 않는다.
    const rect = panel.getBoundingClientRect();
    const isInsidePanel =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;
    if (isInsidePanel) return;

    updateBuddyState({ activePanel: null });
  });

  // 닫기 버튼 클릭 핸들러
  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    updateBuddyState({ activePanel: null });
  });

  // ESC 키로 패널 닫기 (document 레벨, 키보드 이벤트는 retarget 문제 없음)
  const handleEscKey = (e: KeyboardEvent) => {
    if (isContextInvalidated()) {
      document.removeEventListener("keydown", handleEscKey);
      return;
    }
    if (e.key === "Escape") {
      updateBuddyState({ activePanel: null });
    }
  };
  document.addEventListener("keydown", handleEscKey);

  // 패널 내부에서 발생하는 키보드 입력이 외부 페이지로 전파되는 것을 차단
  // (예: 네이버 등에서 타이핑 시 검색창으로 포커스를 강탈하는 오작동 방지)
  // 단, ESC 키는 패널 닫기 동작(handleEscKey)을 위해 전파를 허용함
  const blockKeyboardPropagation = (e: KeyboardEvent) => {
    if (e.key !== "Escape") {
      e.stopPropagation();
    }
  };
  panel.addEventListener("keydown", blockKeyboardPropagation);
  panel.addEventListener("keypress", blockKeyboardPropagation);
  panel.addEventListener("keyup", blockKeyboardPropagation);

  // 패널 내부에서 발생하는 mousedown 이벤트가 외부 오버레이로 버블링되어 패널이 닫히는 오작동 방지
  panel.addEventListener("mousedown", (e) => {
    e.stopPropagation();
  });

  // 상태 구독
  let lastPanelType: string | null = null;

  subscribeBuddyState((s) => {
    if (!s.config) return;

    if (s.activePanel) {
      // chat 패널의 경우 pendingAutoSend가 있을 때도 강제 재렌더링
      const chatPending = s.activePanel === "chat" && getChatState().pendingAutoSend;
      const isNewPanel = s.activePanel !== lastPanelType || chatPending;

      if (isNewPanel) {
        lastPanelType = s.activePanel;
        body.innerHTML = ""; // 클리어

        // 다른 카드(패널)로 전환 시 타이머 통계 확장 상태 원상복구 리셋
        panel.style.width = "";
        if (panel.classList.contains("stats-layout-active")) {
          const currentLeft = parseFloat(panel.style.left || "0");
          if (!isNaN(currentLeft)) {
            panel.style.left = `${currentLeft + 320}px`;
          }
          panel.classList.remove("stats-layout-active");
        }

        if (s.activePanel === "translate") {
          title.textContent = t("translateTitle");
          renderTranslateCard(body);
        } else if (s.activePanel === "memo") {
          title.textContent = t("memoTitle");
          renderMemoCard(body);
        } else if (s.activePanel === "settings") {
          renderSettingsCard(body, shadow);
        } else if (s.activePanel === "chat") {
          title.textContent = t("chatTitle");
          renderChatCard(body);
        } else if (s.activePanel === "timer") {
          title.textContent = t("timerTitle");
          renderTimerCard(body, shadow);
        }
      }

      // 설정 패널일 때는 캐릭터 선택 클릭 시 실시간으로 헤더의 이미지와 이름 동기화 갱신
      if (s.activePanel === "settings") {
        const buddyId = s.config.buddyId;
        const isHiddenBuddy = HIDDEN_BUDDIES.includes(buddyId);
        const calculatedType = detectBuddyType(buddyId);
        const thumbUrl = getThumbnailUrl(buddyId, "webp", calculatedType);
        const getBuddyDefaultName = (id: string) => {
          switch (id) {
            case "owl": return "Owly";
            case "cat": return "Catty";
            case "fox": return "Foxy";
            case "penguin": return "Teddy";
            case "rabbit": return "Bunny";
            case "p_owl": return "Wise Owly";
            case "p_cat": return "Premium Catty";
            case "p_fox": return "Premium Foxy";
            case "p_penguin": return "Royal Teddy";
            case "p_rabbit": return "Royal Bunny";
            case "leafy": return "Leafy";
            case "jellyfish": return "Jelly";
            case "fennec": return "Fennec";
            case "unicorn": return "Uni";
            case "wizard": return "Wizy";
            case "fairy": return "Fairy";
            case "ufo": return "Ufo";
            case "cotton": return "Cotton";
            case "dragon": return "Dragon";
            case "pingu": return "Pingu";
            case "shiba": return "Shiba";
            case "shroom": return "Shroom";
            case "starbot": return "Starbot";
            case "boba": return "Boba";
            case "cactus": return "Cacty";
            case "chef": return "Chefy";
            case "h_chef": return "Hidden Chefy";
            case "frosty": return "Frosty";
            case "nebula": return "Neby";
            case "witchy": return "Witchy";
            default: return "Buddy";
          }
        };
        // 사용자가 명시적으로 수동 입력해 둔 이름(buddyName)이 존재한다면 그것을 최우선 유지/노옶, 없으면 캐릭터 고유 기본명
        const customName = s.config.buddyName ? s.config.buddyName.trim() : "";
        const displayName = customName || getBuddyDefaultName(buddyId);
        
        // 등급별 뱃지 분기 (calculatedType은 위에서 선언됨)
        
        let badgeSpan = "";
        if (calculatedType === "hidden") {
          badgeSpan = `<span style="font-size: 8.5px; font-weight: 800; color: #ffffff; background: linear-gradient(135deg, #f59e0b, #ec4899); padding: 1.5px 5.5px; border-radius: 4px; margin-left: 6px; box-shadow: 0 1px 4px rgba(245, 158, 11, 0.4); border: 1px solid rgba(255,255,255,0.25); display: inline-block; vertical-align: middle; line-height: 1; letter-spacing: 0.3px;">👑 SPECIAL</span>`;
        } else if (calculatedType === "premium") {
          badgeSpan = `<span style="font-size: 8.5px; font-weight: 800; color: #ffffff; background: linear-gradient(135deg, #ffd700, #ff8c00); padding: 1.5px 5.5px; border-radius: 4px; margin-left: 6px; box-shadow: 0 1px 4px rgba(255, 215, 0, 0.4); border: 1px solid rgba(255,255,255,0.25); display: inline-block; vertical-align: middle; line-height: 1; letter-spacing: 0.3px;">👑 PREMIUM</span>`;
        } else {
          badgeSpan = `<span style="font-size: 8.5px; font-weight: 800; color: #ffffff; background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 1.5px 5.5px; border-radius: 4px; margin-left: 6px; box-shadow: 0 1px 4px rgba(59, 130, 246, 0.4); border: 1px solid rgba(255,255,255,0.25); display: inline-block; vertical-align: middle; line-height: 1; letter-spacing: 0.3px;">⭐ BASIC</span>`;
        }
          
        title.innerHTML = `<img src="${thumbUrl}" alt="${buddyId}" style="width: 32px; height: 32px; object-fit: contain; margin-right: 6px; display: inline-block; vertical-align: middle;" /> <span style="vertical-align: middle; display: inline-block;">${displayName}</span> ${badgeSpan}`;
      }

      // 오버레이를 Shadow DOM에 추가 (중복 방지)
      if (!shadow.getElementById("buddy-panel-overlay")) {
        shadow.appendChild(overlay);
      }

      panel.classList.add("open");

      // ─ 패널 위치는 처음 열릴 때만 계산한다.
      //   설정값 변경 시마다 재계산하면 calculatePanelPosition이 잘못된
      //   좌표를 반환하거나 buddyContainer rect가 아직 갱신되지 않아
      //   패널이 화면 밖으로 이동하는 버그가 발생한다.
      if (isNewPanel) {
        const buddyContainer = shadow.getElementById("buddy-container");
        if (buddyContainer) {
          const buddyRect = buddyContainer.getBoundingClientRect();
          const dir = detectRadialDirection(s.config.position.x, s.config.position.y);
          
          const pWidth = panel.clientWidth || 320;
          const pHeight = panel.clientHeight || 240;

          const pos = calculatePanelPosition(
            {
              x: buddyRect.left,
              y: buddyRect.top,
              width: buddyRect.width,
              height: buddyRect.height,
            },
            pWidth,
            pHeight,
            dir,
            window.innerWidth,
            window.innerHeight
          );

          panel.style.left = `${pos.left}px`;
          panel.style.top = `${pos.top}px`;
        }
      }
    } else {
      // 패널 닫힐 때 오버레이 제거
      overlay.remove();
      panel.classList.remove("open");
      lastPanelType = null;

      // 패널 완전히 닫힐 때 타이머 통계 확장 상태 원상복구 리셋
      panel.style.width = "";
      if (panel.classList.contains("stats-layout-active")) {
        const currentLeft = parseFloat(panel.style.left || "0");
        if (!isNaN(currentLeft)) {
          panel.style.left = `${currentLeft + 320}px`;
        }
        panel.classList.remove("stats-layout-active");
      }
    }
  });

  return panel;
}
