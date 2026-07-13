import { getBuddyState, updateBuddyState, subscribeBuddyState } from "../buddy-state";
import { getThumbnailUrl, detectBuddyType } from "../buddy-utils";
import { showBuddyToast } from "./buddy-toast";
import { t } from "../i18n";
import type { BuddyConfig } from "../buddy-types";
import { HIDDEN_BUDDIES, LEGACY_BUDDY_MAP } from "../buddy-constants";

// 스토리지에 실시간 자동 저장(Auto-Save) 처리 함수
function autoSaveConfig(config: BuddyConfig): void {
  chrome.runtime.sendMessage({
    type: "SAVE_BUDDY_CONFIG",
    config: config
  }).catch((err) => {
    console.warn("[ClickBook Buddy] Auto-save failed:", err);
  });
}

// 버디 캐릭터 ID별 디폴트 이름 매핑 함수
function getBuddyDefaultName(id: string): string {
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
    case "cactus": return "Cacty";
    case "chef": return "Chefy";
    case "h_chef": return "Hidden Chefy";
    case "frosty": return "Frosty";
    case "nebula": return "Neby";
    case "witchy": return "Witchy";
    default: return "Buddy";
  }
}

export function renderSettingsCard(container: HTMLElement, shadow: ShadowRoot): void {
  const s = getBuddyState();
  if (!s.config) return;

  const currentConf = { ...s.config };
  
  // 48종의 캐릭터 ID 목록 정의 (Basic 13종 + Premium 18종 + Hidden 17종)
  const buddyIds = [
    // Basic (13종)
    "bsprout", "bydragon", "cat", "cotton", "curobot", "fox", "owl", "penguin", "rabbit", "shroom", "star", "xcafe", "xcloud",
    // Premium (18종)
    "astrobot", "corgi", "dog", "dragon", "fairy", "fennec", "jellyfish", "nebula", "ufo", "unicorn", "wizard", "sprout", "chef", "p_cat", "p_fox", "p_owl", "p_penguin", "p_rabbit",
    // Hidden (17종)
    "blue_dragon", "cactus", "h_chef", "cloud", "cupcake", "dino", "frosty", "ghost", "hamster", "hedgehog", "otter", "panda", "penguin_blue_hat", "red_panda", "sky_dragon", "sprout_fairy", "witchy"
  ];

  const uniqueBuddyIds = Array.from(new Set(buddyIds)).map(id => LEGACY_BUDDY_MAP[id] || id);

  const LEVEL_UNLOCKABLE_BUDDIES = new Set([
    "cactus", "h_chef", "frosty", "witchy", "dino", "ghost", "hamster", "hedgehog", "otter", "panda",
    "blue_dragon", "cloud", "cupcake", "penguin_blue_hat", "red_panda", "sky_dragon", "sprout_fairy"
  ]);

  // 그리드 HTML 빌드 함수 (revealHidden 값에 따라 매번 재계산)
  const buildGridHtml = (): string => {
    const revealHidden = getBuddyState().revealHidden;
    return uniqueBuddyIds
      .map((id) => {
        const isHidden = HIDDEN_BUDDIES.includes(id);
        const baseUnlocked = !isHidden || (currentConf.unlockedBuddies || []).includes(id);
        const isUnlocked = baseUnlocked || revealHidden;

        // 히든 캐릭터 필터링: 레벨 해금 17종에 속하지 않으면서 미해금 시 렌더링 스킵
        if (isHidden && !LEVEL_UNLOCKABLE_BUDDIES.has(id) && !baseUnlocked && !revealHidden) {
          return "";
        }

        const isSelected = currentConf.buddyId === id;

        let activeClass = isSelected ? "selected" : "";
        if (isHidden) {
          activeClass += isUnlocked ? " hidden-unlocked" : " hidden-locked";
          if (isSelected && isUnlocked) {
            activeClass += " special-glow-selected";
          }
        }

        if (!isUnlocked) {
          const unlockLevels: Record<string, number> = {
            cactus: 1,
            h_chef: 2,
            frosty: 3,
            witchy: 4,
            dino: 5,
            ghost: 6,
            hamster: 7,
            hedgehog: 8,
            otter: 9,
            panda: 10,
            blue_dragon: 11,
            cloud: 12,
            cupcake: 13,
            penguin_blue_hat: 14,
            red_panda: 15,
            sky_dragon: 16,
            sprout_fairy: 17
          };
          const unlockLevel = unlockLevels[id] || 17;

          return `
            <div class="buddy-select-item ${activeClass}" data-id="${id}" title="Locked: Reach Level ${unlockLevel} to unlock!">
              <div class="buddy-locked-placeholder" style="width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; color: var(--text-sub); opacity: 0.6; background: rgba(0,0,0,0.2); border-radius: 50%;">?</div>
            </div>
          `;
        }

        const calculatedType = detectBuddyType(id);
        const thumbUrl = getThumbnailUrl(id, "webp", calculatedType);
        
        let borderStyle = "";
        let crownBadge = "";
        if (calculatedType === "premium") {
          borderStyle = isSelected
            ? "border: 1.5px solid rgba(245,158,11,0.85); box-shadow: 0 0 8px rgba(245,158,11,0.45); background: linear-gradient(135deg, rgba(251,191,36,0.14) 0%, rgba(245,158,11,0.08) 100%);"
            : "border: 1px solid rgba(245,158,11,0.3); background: linear-gradient(135deg, rgba(251,191,36,0.06) 0%, rgba(245,158,11,0.03) 100%);";
          crownBadge = `<span style="position: absolute; top: -3px; right: -3px; width: 14px; height: 14px; display: flex; align-items: center; justify-content: center; font-size: 10px; background: #f59e0b; border-radius: 50%; box-shadow: 0 0 5px rgba(245,158,11,0.6); border: 1px solid #fef08a; z-index: 5;">👑</span>`;
        } else if (calculatedType === "hidden") {
          borderStyle = isSelected
            ? "border: 1.5px solid #ec4899; box-shadow: 0 0 10px rgba(236,72,153,0.5), inset 0 0 5px rgba(139,92,246,0.3); background: linear-gradient(135deg, rgba(99,102,241,0.12), rgba(236,72,153,0.12));"
            : "border: 1px solid rgba(139,92,246,0.35); box-shadow: 0 0 4px rgba(139,92,246,0.1); background: linear-gradient(135deg, rgba(99,102,241,0.06), rgba(236,72,153,0.06));";
          crownBadge = `<span style="position: absolute; top: -3px; right: -3px; width: 14px; height: 14px; display: flex; align-items: center; justify-content: center; font-size: 9px; background: linear-gradient(135deg, #a855f7, #ec4899); border-radius: 50%; box-shadow: 0 0 5px rgba(236,72,153,0.6); border: 1px solid #fbcfe8; color: #ffffff; z-index: 5;">✨</span>`;
        }

        const titleAttr = isHidden ? "Special Hidden Buddy!" : id.toUpperCase();
        return `
          <div class="buddy-select-item ${activeClass}" data-id="${id}" title="${titleAttr}" style="position: relative; ${borderStyle}">
            <img class="buddy-thumb" src="${thumbUrl}" alt="${id}">
            ${crownBadge}
          </div>
        `;
      })
      .join("");
  };

  container.innerHTML = `
    <!-- 버디 레벨 및 경험치 대시보드 -->
    <div class="buddy-gamification-dashboard" style="background: rgba(255, 255, 255, 0.04); border: 1px solid var(--border-color); border-radius: 12px; padding: 12px 16px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 8px;">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <span style="font-size: 13px; font-weight: 800; color: var(--text-main); display: flex; align-items: center; gap: 4px;">
          <span id="dashboard-level-txt" style="color: var(--accent-color); display: flex; align-items: center; gap: 4px;">⭐ Lv.${currentConf.level || 1}</span>
          <span id="dashboard-name-txt" style="margin-left: 2px;">${currentConf.buddyName || getBuddyDefaultName(currentConf.buddyId)}</span>
        </span>
        <div style="display: flex; align-items: center; gap: 6px;">
          <span id="dashboard-xp-txt" style="font-size: 11px; color: var(--text-sub); font-family: monospace;">
            ${currentConf.xp || 0} / 100 XP
          </span>
          <button id="buddy-reset-xp-btn" title="Reset Level & XP" style="background: none; border: none; color: #ef4444; font-size: 13px; cursor: pointer; padding: 4px; border-radius: 6px; display: flex; align-items: center; justify-content: center; transition: background-color 0.2s, transform 0.2s; width: 22px; height: 22px;" onmouseover="this.style.backgroundColor='rgba(239,68,68,0.1)'; this.style.transform='scale(1.15)';" onmouseout="this.style.backgroundColor='transparent'; this.style.transform='scale(1.0)';">🔄</button>
        </div>
      </div>
      <!-- 경험치 프로그레스 바 -->
      <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.08); border-radius: 999px; overflow: hidden;">
        <div id="dashboard-xp-bar" style="width: ${Math.min(100, (currentConf.xp || 0))}%; height: 100%; background: linear-gradient(90deg, #6366f1, #ec4899); border-radius: 999px; transition: width 0.4s ease;"></div>
      </div>
    </div>

    <!-- 그룹 1: 버디 설정 (기본 정보) -->
    <div class="settings-accordion-group">
      <div class="settings-accordion-header active" id="header-buddy-base">
        <span>🦊 ${t("settingsBuddySelect") || "버디 외형 & 움직임 설정"}</span>
        <span class="acc-icon" style="transform: rotate(90deg); display: inline-block; transition: transform 0.2s;">▶</span>
      </div>
      <div class="settings-accordion-body" id="body-buddy-base" style="display: block;">
        <!-- 캐릭터 선택 -->
        <div class="settings-section-title" style="margin-top: 0;">${t("settingsBuddySelect")} (${buddyIds.length})</div>
        <div class="buddies-scroll-container" style="position: relative; display: flex; align-items: center; width: 100%; margin-bottom: 6px;">
          <button type="button" class="buddy-scroll-btn left" style="display: flex; align-items: center; justify-content: center; position: absolute; left: -8px; z-index: 10; width: 22px; height: 22px; border-radius: 50%; border: 1px solid var(--border-color); background: var(--bg-panel); color: var(--text-main); cursor: pointer; font-size: 11px; font-weight: bold; box-shadow: 0 2px 6px rgba(0,0,0,0.25); transition: background-color 0.2s, transform 0.2s; outline: none; padding: 0 0 1px 0;" onmouseover="this.style.transform='scale(1.15)';" onmouseout="this.style.transform='scale(1.0)';">&lt;</button>
          <div class="buddies-grid" id="buddy-select-grid" style="flex: 1; overflow-x: auto; scroll-behavior: smooth; margin-bottom: 0; padding: 2px 0;">
          </div>
          <button type="button" class="buddy-scroll-btn right" style="display: flex; align-items: center; justify-content: center; position: absolute; right: -8px; z-index: 10; width: 22px; height: 22px; border-radius: 50%; border: 1px solid var(--border-color); background: var(--bg-panel); color: var(--text-main); cursor: pointer; font-size: 11px; font-weight: bold; box-shadow: 0 2px 6px rgba(0,0,0,0.25); transition: background-color 0.2s, transform 0.2s; outline: none; padding: 0 0 1px 0;" onmouseover="this.style.transform='scale(1.15)';" onmouseout="this.style.transform='scale(1.0)';">&gt;</button>
        </div>

        <!-- Size slider -->
        <div class="buddy-input-group" style="margin-top: 4px; margin-bottom: 4px;">
          <label class="buddy-label">${t("settingsSize")} <span class="range-val" id="val-size">${currentConf.size}px</span></label>
          <input type="range" class="buddy-range" id="range-size" min="64" max="192" step="8" value="${currentConf.size}">
        </div>

        <!-- Interval & Opacity -->
        <div class="buddy-row" style="margin-top: 4px;">
          <!-- Interval (30%) -->
          <div class="buddy-col-3">
            <label class="buddy-label" style="margin-bottom: 4px;">${t("settingsInterval")}</label>
            <input type="number" step="0.1" min="0.5" max="10" id="input-speed" class="buddy-select" style="padding: 4px 6px; height: 32px; box-sizing: border-box; text-align: center;" value="${(currentConf.animationInterval / 1000).toFixed(1)}">
          </div>
          
          <!-- Opacity slider (70%) -->
          <div class="buddy-col-7">
            <label class="buddy-label" style="margin-bottom: 4px;">${t("settingsOpacity")} <span class="range-val" id="val-opacity">${Math.round(currentConf.opacity * 100)}%</span></label>
            <input type="range" class="buddy-range" id="range-opacity" min="0.3" max="1.0" step="0.05" value="${currentConf.opacity}" style="margin: 12px 0 0 0;">
          </div>
        </div>
      </div>
    </div>

    <!-- 그룹 2: 테마 & 번역 (테마 및 UI) -->
    <div class="settings-accordion-group">
      <div class="settings-accordion-header" id="header-buddy-theme">
        <span>🎨 ${t("settingsTheme") || "테마 & 기본 인터페이스"}</span>
        <span class="acc-icon" style="transform: rotate(0deg); display: inline-block; transition: transform 0.2s;">▶</span>
      </div>
      <div class="settings-accordion-body" id="body-buddy-theme" style="display: none;">
        <!-- Theme -->
        <div class="buddy-input-group" style="margin-bottom: 12px;">
          <label class="buddy-label">${t("settingsTheme")}</label>
          <div class="theme-picker-row" style="display: flex; flex-wrap: wrap; justify-content: flex-start; gap: 6px; width: 100%;">
            ${["midnight", "cozy", "sky", "sweet", "fresh", "carbon", "cyber"].map(tName => {
              const active = (currentConf.theme || "midnight") === tName ? "active" : "";
              let displayName = tName.toUpperCase();
              if (tName === "midnight") displayName = "MID";
              else if (tName === "carbon") displayName = "CARB";
              else if (tName === "cyber") displayName = "CYBR";
              return `<button type="button" class="theme-dot ${active}" data-theme="${tName}">${displayName}</button>`;
            }).join("")}
          </div>
        </div>

        <!-- Default Translate Language & Drag Menu Toggle -->
        <div class="buddy-row" style="margin-bottom: 0; display: flex; gap: 12px; align-items: flex-end;">
          <!-- Default Translate Language -->
          <div class="buddy-input-group" style="flex: 1; margin-bottom: 0;">
            <label class="buddy-label" style="margin-bottom: 4px;">${t("settingsTargetLang")}</label>
            <select class="buddy-select" id="select-target-lang" style="width: 100%; box-sizing: border-box; height: 32px;">
              ${[
                { code: "ko", name: "Korean" },
                { code: "en", name: "English" },
                { code: "ja", name: "Japanese" },
                { code: "zh", name: "Chinese" },
                { code: "es", name: "Spanish" },
                { code: "fr", name: "French" },
                { code: "de", name: "German" },
                { code: "it", name: "Italian" },
                { code: "ru", name: "Russian" },
                { code: "vi", name: "Vietnamese" },
                { code: "th", name: "Thai" },
                { code: "id", name: "Indonesian" }
              ].map(l => {
                const selected = (currentConf.targetLanguage || "ko") === l.code ? "selected" : "";
                return `<option value="${l.code}" ${selected}>${l.name}</option>`;
              }).join("")}
            </select>
          </div>

          <!-- Drag Menu On/Off Option -->
          <div class="buddy-input-group" style="flex: 1; margin-bottom: 0;">
            <label class="buddy-label" style="display: flex; align-items: center; gap: 6px; cursor: pointer; user-select: none; height: 32px; margin-bottom: 0;">
              <input type="checkbox" id="check-drag-menu" style="accent-color: var(--accent-color); width: 14px; height: 14px; margin: 0; cursor: pointer;" ${currentConf.showDragMenu !== false ? "checked" : ""}>
              <span style="font-size: 11px; white-space: nowrap;">${t("settingsShowDragMenu")}</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- 그룹 3: 포커스 & 휴식 -->
    <div class="settings-accordion-group">
      <div class="settings-accordion-header" id="header-buddy-timer">
        <span>⏰ ${t("settingsFocusAndRest" as any) || "포커스 & 휴식"}</span>
        <span class="acc-icon" style="transform: rotate(0deg); display: inline-block; transition: transform 0.2s;">▶</span>
      </div>
      <div class="settings-accordion-body" id="body-buddy-timer" style="display: none;">
        <!-- Timer Complete Theme Option -->
        <div class="buddy-input-group" style="margin-bottom: 12px;">
          <label class="buddy-label" style="margin-bottom: 4px;">${t("settingsRestThemeLabel" as any) || "Rest Theme"}</label>
          <div class="timer-effect-theme-picker-row" style="display: flex; flex-wrap: wrap; gap: 3.5px; align-items: center; padding-top: 2px;">
            ${[
              { id: "night", icon: "🌠", name: t("themeNightName" as any) || "Starry Night" },
              { id: "forest", icon: "🌿", name: t("themeForestName" as any) || "Deep Forest" },
              { id: "ocean", icon: "🌊", name: t("themeOceanName" as any) || "Calm Ocean" },
              { id: "fireplace", icon: "🔥", name: t("themeFireplaceName" as any) || "Cozy Fireplace" },
              { id: "sunset", icon: "🌅", name: t("themeSunsetName" as any) || "Soft Sunset" },
              { id: "yoga", icon: "🧘‍♀️", name: t("themeYogaName" as any) || "Zen Yoga" },
              { id: "gallery", icon: "🖼️", name: t("themeGalleryName" as any) || "Art Gallery" },
              { id: "breath", icon: "🌬️", name: t("themeBreathName" as any) || "Mindful Breath" },
              { id: "comic_random", icon: "📚", name: t("themeComicRandomName" as any) || "Success Story" },
              { id: "random", icon: "🔀", name: t("themeRandomName" as any) || "Random" },
            ].map(thm => {
              const isSelected = thm.id === "random" 
                ? currentConf.restRandomTheme === true
                : (currentConf.restRandomTheme !== true && 
                   ((currentConf.timerCompleteTheme || "night") === thm.id || 
                    (thm.id === "comic_random" && (currentConf.timerCompleteTheme || "night").startsWith("comic"))));
              const active = isSelected ? "active" : "";
              const activeBg = isSelected ? "background: var(--accent-color); border: 1px solid var(--accent-color);" : "background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15);";
              return `<button type="button" class="settings-timer-theme-chip ${active}" data-theme="${thm.id}" style="${activeBg} width: 22px; height: 22px; border-radius: 3px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 13px; padding: 0; transition: all 0.2s;" title="${thm.name}">${thm.icon}</button>`;
            }).join("")}
          </div>
        </div>

        <!-- Success Story Episode Sub Row -->
        <div id="success-story-sub-row" class="buddy-input-group" style="margin-top: 6px; margin-bottom: 12px; display: ${(currentConf.restRandomTheme !== true && (currentConf.timerCompleteTheme || "night").startsWith("comic")) ? "block" : "none"};">
          <label class="buddy-label" style="margin-bottom: 4px;">${t("successStoryLabel" as any) || "Success Story Episode"}</label>
          <div class="timer-effect-episode-picker-row" style="display: flex; flex-wrap: wrap; gap: 4px; align-items: center; padding-top: 2px;">
            ${[
              { id: "comic_random", label: "🎲" },
              { id: "comic1", label: "1" },
              { id: "comic2", label: "2" },
              { id: "comic3", label: "3" },
              { id: "comic4", label: "4" },
              { id: "comic5", label: "5" },
              { id: "comic6", label: "6" },
              { id: "comic7", label: "7" },
              { id: "comic8", label: "8" },
              { id: "comic9", label: "9" },
              { id: "comic10", label: "10" },
              { id: "comic11", label: "11" },
              { id: "comic12", label: "12" },
              { id: "comic13", label: "13" },
              { id: "comic14", label: "14" },
              { id: "comic15", label: "15" },
              { id: "comic16", label: "16" },
              { id: "comic17", label: "17" },
              { id: "comic18", label: "18" }
            ].map(ep => {
              const isSelected = currentConf.restRandomTheme !== true && ((currentConf.timerCompleteTheme || "night") === ep.id || (ep.id === "comic_random" && currentConf.timerCompleteTheme === "comic_random"));
              const active = isSelected ? "active" : "";
              const activeBg = isSelected ? "background: var(--accent-color); border: 1px solid var(--accent-color); color: #ffffff;" : "background: var(--bg-input); border: 1px solid var(--border-color); color: var(--text-main); opacity: 0.85;";
              return `<button type="button" class="settings-timer-episode-chip ${active}" data-episode="${ep.id}" style="${activeBg} width: 18px; height: 18px; border-radius: 3px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: bold; padding: 0; transition: all 0.2s;" title="${ep.id === "comic_random" ? "Random Episode" : "Episode " + ep.id.replace("comic", "")}">${ep.label}</button>`;
            }).join("")}
          </div>
        </div>

        <!-- Gallery Background Image Option Sub Row -->
        <div id="gallery-sub-row" class="buddy-input-group" style="margin-top: 6px; margin-bottom: 12px; display: ${(currentConf.restRandomTheme !== true && currentConf.timerCompleteTheme === "gallery") ? "block" : "none"};">
          <label class="buddy-label" style="display: flex; align-items: center; gap: 6px; cursor: pointer; user-select: none; margin-bottom: 0;">
            <input type="checkbox" id="check-gallery-offline" style="accent-color: var(--accent-color); width: 14px; height: 14px; margin: 0; cursor: pointer;" ${currentConf.galleryOfflineMode ? "checked" : ""}>
            <span style="font-size: 11px;">${t("settingsGalleryOffline" as any) || "Always use local images (Offline mode)"}</span>
          </label>
        </div>

        <!-- DND Mode Option -->
        <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px;">
          <div class="buddy-input-group" style="margin-bottom: 0;">
            <label class="buddy-label" style="display: flex; align-items: center; gap: 6px; cursor: pointer; user-select: none;">
              <input type="checkbox" id="check-dnd-mode" style="accent-color: var(--accent-color); width: 14px; height: 14px; margin: 0; cursor: pointer;" ${currentConf.isDndMode ? "checked" : ""}>
              <span>${t("settingsDndMode" as any)}</span>
            </label>
          </div>
        </div>

        <!-- Focus Timer Subtitle -->
        <div class="settings-section-title" style="margin-top: 8px; margin-bottom: 8px; border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 8px;">
          ${t("settingsFocusTimerSubTitle" as any) || "Focus Timer"}
        </div>

        <!-- Timer Settings (Size & Color side-by-side) -->
        <div class="buddy-row" style="margin-bottom: 0; display: flex; gap: 16px;">
          <!-- Timer Size (50%) -->
          <div style="flex: 1; min-w: 0;">
            <label class="buddy-label" style="margin-bottom: 4px;">${t("settingsTimerSize")} <span class="range-val" id="val-timer-size">${currentConf.timerSize || "L"}</span></label>
            <input type="range" class="buddy-range" id="range-timer-size" min="1" max="3" step="1" value="${currentConf.timerSize === "S" ? 1 : currentConf.timerSize === "M" ? 2 : 3}">
            <div style="display: flex; justify-content: space-between; font-size: 8px; color: var(--text-sub); padding: 0 4px; margin-top: 2px; user-select: none;">
              <span>S</span>
              <span>M</span>
              <span>L</span>
            </div>
          </div>

          <!-- Timer Color Palette (50%) -->
          <div style="width: 50%; flex-shrink: 0;">
            <label class="buddy-label" style="margin-bottom: 4px;">${t("settingsTimerColor")}</label>
            <div class="timer-color-picker-row" style="display: flex; flex-wrap: wrap; gap: 4px; align-items: center; padding-top: 4px;">
              ${[
                { id: "default", bg: "linear-gradient(135deg, #cbd5e1 0%, #ffffff 100%)", title: "Default" },
                { id: "purple", bg: "#a855f7", title: "Purple" },
                { id: "blue", bg: "#3b82f6", title: "Blue" },
                { id: "mint", bg: "#10b981", title: "Mint" },
                { id: "rose", bg: "#f43f5e", title: "Rose" },
                { id: "yellow", bg: "#eab308", title: "Yellow" },
                { id: "orange", bg: "#f97316", title: "Orange" },
                { id: "white", bg: "#ffffff", title: "White" },
              ].map(c => {
                const isSelected = (currentConf.timerColor || "default") === c.id;
                const active = isSelected ? "active" : "";
                const borderStyle = (c.id === "white" || c.id === "default") ? "border: 1px solid rgba(255, 255, 255, 0.3);" : "border: none;";
                const activeShadow = isSelected ? "box-shadow: 0 0 0 1.5px var(--bg-panel), 0 0 0 3px #6366f1; transform: scale(1.2);" : "";
                return `<button type="button" class="timer-color-chip ${active}" data-color="${c.id}" style="background: ${c.bg}; width: 14px; height: 14px; border-radius: 50%; cursor: pointer; padding: 0; transition: all 0.2s; ${borderStyle} ${activeShadow}" title="${c.title}"></button>`;
              }).join("")}
            </div>
          </div>
        </div>

        <!-- Focus Timer Complete Random Option -->
        <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255, 255, 255, 0.05); display: flex; align-items: center; justify-content: space-between;">
          <label class="buddy-label" style="margin-bottom: 0; display: flex; align-items: center; gap: 6px; cursor: pointer; user-select: none;">
            <span>${t("settingsFocusRandomTooltip" as any) || "Apply random theme on focus complete"}</span>
          </label>
          <button type="button" id="btn-focus-random" class="settings-timer-theme-chip ${currentConf.focusRandomTheme ? "active" : ""}" style="${currentConf.focusRandomTheme ? "background: var(--accent-color); border: 1px solid var(--accent-color);" : "background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15);"} width: 22px; height: 22px; border-radius: 3px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 13px; padding: 0; transition: all 0.2s;" title="${t("settingsFocusRandomTooltip" as any) || "Random"}">🔀</button>
        </div>
      </div>
    </div>

    <!-- AI Prompt Presets Settings Section (Collapsible) -->
    <div class="settings-accordion-group" style="margin-bottom: 4px;">
      <div class="settings-accordion-header" id="title-ai-presets">
        <span>🤖 ${t("settingsAiPresets" as any) || "AI Prompt Presets"}</span>
        <span class="toggle-icon acc-icon" style="transform: rotate(0deg); display: inline-block; transition: transform 0.2s;">▶</span>
      </div>
      <div class="settings-accordion-body" id="ai-presets-content" style="display: none; padding: 12px 14px;">
        <div style="display: flex; gap: 6px; margin-bottom: 6px;">
          <input type="text" id="input-new-preset" placeholder="Enter new question preset..." style="flex: 1; height: 26px; font-size: 11px; padding: 0 8px; background: var(--bg-input); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-main); outline: none;">
          <button type="button" class="buddy-btn" id="btn-add-preset" style="height: 26px; padding: 0 8px; font-size: 11px; border-radius: 6px; cursor: pointer; white-space: nowrap; line-height: 24px; margin: 0; width: auto; background: var(--accent-color); color: white; border: none;">+</button>
        </div>
        <div id="presets-list-box" style="display: flex; flex-direction: column; gap: 4px; max-height: 90px; overflow-y: auto; padding-right: 2px;">
          <!-- Dynamic Presets List -->
        </div>
      </div>
    </div>
  `;

  // 엘리먼트 획득
  const gridContainer = container.querySelector(".buddies-grid") as HTMLDivElement;
  const btnScrollLeft = container.querySelector(".buddy-scroll-btn.left") as HTMLButtonElement;
  const btnScrollRight = container.querySelector(".buddy-scroll-btn.right") as HTMLButtonElement;

  // 그리드 초기 렌더 + revealHidden 상태 변화 시 재렌더링
  if (gridContainer) {
    gridContainer.innerHTML = buildGridHtml();
    subscribeBuddyState((st) => {
      if (!container.isConnected) return; // 패널이 닫히면 구독 자동 탈락
      gridContainer.innerHTML = buildGridHtml();

      // 대시보드(레벨, 이름, XP텍스트, 게이지바) 실시간 동기화 갱신
      if (st.config) {
        const lvlTxt = container.querySelector("#dashboard-level-txt");
        if (lvlTxt) lvlTxt.textContent = `⭐ Lv.${st.config.level || 1}`;

        const nameTxt = container.querySelector("#dashboard-name-txt");
        if (nameTxt) nameTxt.textContent = st.config.buddyName || getBuddyDefaultName(st.config.buddyId);

        const xpTxt = container.querySelector("#dashboard-xp-txt");
        if (xpTxt) xpTxt.textContent = `${st.config.xp || 0} / 100 XP`;

        const xpBar = container.querySelector("#dashboard-xp-bar") as HTMLDivElement;
        if (xpBar) xpBar.style.width = `${Math.min(100, st.config.xp || 0)}%`;
      }
    });
  }
  
  if (btnScrollLeft && btnScrollRight && gridContainer) {
    btnScrollLeft.addEventListener("click", (e) => {
      e.stopPropagation();
      gridContainer.scrollBy({ left: -108, behavior: "smooth" });
    });
    btnScrollRight.addEventListener("click", (e) => {
      e.stopPropagation();
      gridContainer.scrollBy({ left: 108, behavior: "smooth" });
    });
  }
  const themeContainer = container.querySelector(".theme-picker-row") as HTMLDivElement;
  const targetLangSelect = container.querySelector("#select-target-lang") as HTMLSelectElement;
  const speedInput = container.querySelector("#input-speed") as HTMLInputElement;
  const opacityInput = container.querySelector("#range-opacity") as HTMLInputElement;
  const sizeInput = container.querySelector("#range-size") as HTMLInputElement;
  const timerSizeInput = container.querySelector("#range-timer-size") as HTMLInputElement;
  const timerColorContainer = container.querySelector(".timer-color-picker-row") as HTMLDivElement;

  const valOpacity = container.querySelector("#val-opacity") as HTMLElement;
  const valSize = container.querySelector("#val-size") as HTMLElement;
  const valTimerSize = container.querySelector("#val-timer-size") as HTMLElement;
  const dndCheckbox = container.querySelector("#check-dnd-mode") as HTMLInputElement;
  const dragMenuCheckbox = container.querySelector("#check-drag-menu") as HTMLInputElement;
  const focusRandomBtn = container.querySelector("#btn-focus-random") as HTMLButtonElement;
  const galleryOfflineCheckbox = container.querySelector("#check-gallery-offline") as HTMLInputElement;
  const gallerySubRow = container.querySelector("#gallery-sub-row") as HTMLDivElement;
  const titleAiPresets = container.querySelector("#title-ai-presets") as HTMLElement;
  const contentAiPresets = container.querySelector("#ai-presets-content") as HTMLElement;
  const toggleIcon = titleAiPresets.querySelector(".toggle-icon") as HTMLElement;
  const themePickerContainer = container.querySelector(".timer-effect-theme-picker-row") as HTMLDivElement;

  // 캐릭터 선택 (실시간 이미지/이름 헤더 동기화 및 자동저장)
  gridContainer.addEventListener("click", (e) => {
    const target = (e.target as HTMLElement).closest(".buddy-select-item") as HTMLElement;
    if (target) {
      const nextId = target.dataset.id || "owl";
      const isHidden = HIDDEN_BUDDIES.includes(nextId);
      const baseUnlocked = !isHidden || (currentConf.unlockedBuddies || []).includes(nextId);
      const isUnlocked = baseUnlocked || getBuddyState().revealHidden;
      
      if (!isUnlocked) {
        // 아직 해금되지 않은 히든 캐릭터인 경우 -> 토스트 알림 띄우고 선택 차단
        const unlockLevels: Record<string, number> = {
          cactus: 1,
          h_chef: 2,
          frosty: 3,
          witchy: 4,
          dino: 5,
          ghost: 6,
          hamster: 7,
          hedgehog: 8,
          otter: 9,
          panda: 10,
          blue_dragon: 11,
          cloud: 12,
          cupcake: 13,
          penguin_blue_hat: 14,
          red_panda: 15,
          sky_dragon: 16,
          sprout_fairy: 17
        };
        const unlockLevel = unlockLevels[nextId] || 17;
        
        showBuddyToast(`Locked! Reach Level ${unlockLevel} to unlock this special buddy! ⭐`);
        return;
      }

      gridContainer.querySelectorAll(".buddy-select-item").forEach((item) => {
        item.classList.remove("selected");
      });
      target.classList.add("selected");
      
      currentConf.buddyId = nextId;
      const calculatedType = detectBuddyType(nextId);
      currentConf.buddyType = calculatedType;
      
      const state = getBuddyState();
      if (state.config) {
        const updated = { 
          ...state.config, 
          buddyId: nextId,
          buddyType: calculatedType
        };
        updateBuddyState({ config: updated });
        autoSaveConfig(updated);
      }
    }
  });

  // 테마 선택 (실시간 테마 적용 및 자동저장)
  themeContainer.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest(".theme-dot") as HTMLButtonElement;
    if (btn) {
      themeContainer.querySelectorAll(".theme-dot").forEach((item) => {
        item.classList.remove("active");
      });
      btn.classList.add("active");
      const nextTheme = (btn.dataset.theme || "midnight") as any;
      currentConf.theme = nextTheme;

      const state = getBuddyState();
      if (state.config) {
        const updated = { ...state.config, theme: nextTheme };
        updateBuddyState({ config: updated });
        autoSaveConfig(updated);
      }
    }
  });

  // 기본 번역 언어 선택 리스너 (실시간 자동저장)
  targetLangSelect.addEventListener("change", () => {
    const nextLang = targetLangSelect.value;
    currentConf.targetLanguage = nextLang;

    const state = getBuddyState();
    if (state.config) {
      const updated = { ...state.config, targetLanguage: nextLang };
      updateBuddyState({ config: updated });
      autoSaveConfig(updated);
    }
  });

  // 크기 조작 (실시간 크기 적용 및 자동저장)
  sizeInput.addEventListener("input", () => {
    const val = parseInt(sizeInput.value);
    valSize.textContent = `${val}px`;
    currentConf.size = val;
    
    const state = getBuddyState();
    if (state.config) {
      const updated = { ...state.config, size: val };
      updateBuddyState({ config: updated });
      autoSaveConfig(updated);
    }
  });

  // 타이머 글자 크기 조작 (S, M, L)
  timerSizeInput.addEventListener("input", () => {
    const val = parseInt(timerSizeInput.value);
    const sizeLabel = val === 1 ? "S" : val === 2 ? "M" : "L";
    valTimerSize.textContent = sizeLabel;
    currentConf.timerSize = sizeLabel;

    const state = getBuddyState();
    if (state.config) {
      const updated = { ...state.config, timerSize: sizeLabel };
      updateBuddyState({ config: updated });
      autoSaveConfig(updated);
    }
  });

  // 타이머 색상 선택 (실시간 자동저장)
  timerColorContainer.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest(".timer-color-chip") as HTMLButtonElement;
    if (btn) {
      timerColorContainer.querySelectorAll(".timer-color-chip").forEach((item) => {
        item.classList.remove("active");
        (item as HTMLElement).style.boxShadow = "";
        (item as HTMLElement).style.transform = "";
      });
      btn.classList.add("active");
      btn.style.boxShadow = "0 0 0 1.5px var(--bg-panel), 0 0 0 3px #6366f1";
      btn.style.transform = "scale(1.2)";
      
      const nextColor = (btn.dataset.color || "default") as any;
      currentConf.timerColor = nextColor;

      const state = getBuddyState();
      if (state.config) {
        const updated = { ...state.config, timerColor: nextColor };
        updateBuddyState({ config: updated });
        autoSaveConfig(updated);
      }
    }
  });

  // 애니메이션 주기 (실시간 적용 및 자동저장)
  speedInput.addEventListener("input", () => {
    const val = Math.max(0.5, parseFloat(speedInput.value) || 0.5);
    const ms = Math.round(val * 1000);
    currentConf.animationInterval = ms;

    const state = getBuddyState();
    if (state.config) {
      const updated = { ...state.config, animationInterval: ms };
      updateBuddyState({ config: updated });
      autoSaveConfig(updated);
    }
  });

  // 투명도 조작 (실시간 투명도 적용 및 자동저장)
  opacityInput.addEventListener("input", () => {
    const val = parseFloat(opacityInput.value);
    valOpacity.textContent = `${Math.round(val * 100)}%`;
    currentConf.opacity = val;

    const state = getBuddyState();
    if (state.config) {
      const updated = { ...state.config, opacity: val };
      updateBuddyState({ config: updated });
      autoSaveConfig(updated);
    }
  });

  // 방해 금지 모드 토글 (실시간 자동저장)
  if (dndCheckbox) {
    dndCheckbox.addEventListener("change", () => {
      const nextDnd = dndCheckbox.checked;
      currentConf.isDndMode = nextDnd;

      const state = getBuddyState();
      if (state.config) {
        const updated = { ...state.config, isDndMode: nextDnd };
        updateBuddyState({ config: updated });
        autoSaveConfig(updated);
      }
    });
  }

  // 드래그 메뉴 표시 토글 (실시간 자동저장)
  if (dragMenuCheckbox) {
    dragMenuCheckbox.addEventListener("change", () => {
      const nextVal = dragMenuCheckbox.checked;
      currentConf.showDragMenu = nextVal;

      const state = getBuddyState();
      if (state.config) {
        const updated = { ...state.config, showDragMenu: nextVal };
        updateBuddyState({ config: updated });
        autoSaveConfig(updated);
      }
    });
  }

  // 집중 완료 랜덤 적용 토글 (실시간 자동저장)
  if (focusRandomBtn) {
    focusRandomBtn.addEventListener("click", () => {
      const state = getBuddyState();
      const isFocusRandom = !(state.config?.focusRandomTheme === true);
      currentConf.focusRandomTheme = isFocusRandom;

      if (isFocusRandom) {
        focusRandomBtn.classList.add("active");
        focusRandomBtn.style.background = "var(--accent-color)";
        focusRandomBtn.style.border = "1px solid var(--accent-color)";
      } else {
        focusRandomBtn.classList.remove("active");
        focusRandomBtn.style.background = "rgba(255,255,255,0.08)";
        focusRandomBtn.style.border = "1px solid rgba(255,255,255,0.15)";
      }

      if (state.config) {
        const updated = { ...state.config, focusRandomTheme: isFocusRandom };
        updateBuddyState({ config: updated });
        autoSaveConfig(updated);
      }
    });
  }

  // 타이머 완료 테마 선택 리스너 (실시간 자동저장)
  const subRow = container.querySelector("#success-story-sub-row") as HTMLDivElement;

  if (themePickerContainer) {
    themePickerContainer.addEventListener("click", (e) => {
      const btn = (e.target as HTMLElement).closest(".settings-timer-theme-chip") as HTMLButtonElement;
      if (btn) {
        themePickerContainer.querySelectorAll(".settings-timer-theme-chip").forEach((item: any) => {
          item.classList.remove("active");
          item.style.background = "var(--bg-input)";
          item.style.border = "1px solid var(--border-color)";
          item.style.color = "var(--text-main)";
        });
        btn.classList.add("active");
        btn.style.background = "var(--accent-color)";
        btn.style.border = "1px solid var(--accent-color)";
        
        let nextTheme = (btn.dataset.theme || "night") as any;
        const state = getBuddyState();
        
        if (nextTheme === "random") {
          currentConf.restRandomTheme = true;
          if (subRow) subRow.style.display = "none";
          if (gallerySubRow) gallerySubRow.style.display = "none";
          if (state.config) {
            const updated = { ...state.config, restRandomTheme: true };
            updateBuddyState({ config: updated });
            autoSaveConfig(updated);
          }
        } else {
          currentConf.restRandomTheme = false;
          currentConf.timerCompleteTheme = nextTheme;
          
          // 성공스토리 대분류 선택 시 서브 에피소드 줄 노출 및 기본값 comic_random 세팅
          if (nextTheme === "comic_random") {
            if (subRow) {
              subRow.style.display = "block";
              // 서브 칩들 초기화 (기본적으로 🎲 선택)
              subRow.querySelectorAll(".settings-timer-episode-chip").forEach((item: any) => {
                const isRandom = item.dataset.episode === "comic_random";
                item.classList.toggle("active", isRandom);
                item.style.background = isRandom ? "var(--accent-color)" : "var(--bg-input)";
                item.style.border = isRandom ? "1px solid var(--accent-color)" : "1px solid var(--border-color)";
                item.style.color = isRandom ? "#ffffff" : "var(--text-main)";
              });
            }
          } else {
            if (subRow) subRow.style.display = "none";
          }

          // 명화 갤러리 선택 시 로컬 이미지 우선 옵션 서브 줄 노출
          if (nextTheme === "gallery") {
            if (gallerySubRow) gallerySubRow.style.display = "block";
          } else {
            if (gallerySubRow) gallerySubRow.style.display = "none";
          }

          if (state.config) {
            const updated = { ...state.config, restRandomTheme: false, timerCompleteTheme: nextTheme };
            updateBuddyState({ config: updated });
            autoSaveConfig(updated);
          }
        }
      }
    });
  }

  // 성공 스토리 서브 에피소드 선택 리스너 (실시간 자동저장)
  if (subRow) {
    subRow.addEventListener("click", (e) => {
      const btn = (e.target as HTMLElement).closest(".settings-timer-episode-chip") as HTMLButtonElement;
      if (btn) {
        subRow.querySelectorAll(".settings-timer-episode-chip").forEach((item: any) => {
          item.classList.remove("active");
          item.style.background = "var(--bg-input)";
          item.style.border = "1px solid var(--border-color)";
          item.style.color = "var(--text-main)";
        });
        btn.classList.add("active");
        btn.style.background = "var(--accent-color)";
        btn.style.border = "1px solid var(--accent-color)";
        btn.style.color = "#ffffff";

        // 대분류에서 성공스토리 📚 활성화 유지
        if (themePickerContainer) {
          themePickerContainer.querySelectorAll(".settings-timer-theme-chip").forEach((item: any) => {
            const isComicRandom = item.dataset.theme === "comic_random";
            item.classList.toggle("active", isComicRandom);
            item.style.background = isComicRandom ? "var(--accent-color)" : "var(--bg-input)";
            item.style.border = isComicRandom ? "1px solid var(--accent-color)" : "1px solid var(--border-color)";
            item.style.color = isComicRandom ? "#ffffff" : "var(--text-main)";
          });
        }

        const nextTheme = (btn.dataset.episode || "comic_random") as any;
        currentConf.restRandomTheme = false;
        currentConf.timerCompleteTheme = nextTheme;

        const state = getBuddyState();
        if (state.config) {
          const updated = { ...state.config, restRandomTheme: false, timerCompleteTheme: nextTheme };
          updateBuddyState({ config: updated });
          autoSaveConfig(updated);
        }
      }
    });
  }

  // 갤러리 오프라인 전용 토글 (실시간 자동저장)
  if (galleryOfflineCheckbox) {
    galleryOfflineCheckbox.addEventListener("change", () => {
      const nextVal = galleryOfflineCheckbox.checked;
      currentConf.galleryOfflineMode = nextVal;
      const state = getBuddyState();
      if (state.config) {
        const updated = { ...state.config, galleryOfflineMode: nextVal };
        updateBuddyState({ config: updated });
        autoSaveConfig(updated);
      }
    });
  }

  // 4대 아코디언 섹션 토글 핸들러 셋업
  const setupAccordion = (headerId: string, bodyId: string) => {
    const header = container.querySelector(`#${headerId}`) as HTMLElement;
    const body = container.querySelector(`#${bodyId}`) as HTMLElement;
    if (!header || !body) return;

    header.addEventListener("click", () => {
      const isExpanded = body.style.display === "block";
      const icon = header.querySelector(".acc-icon") as HTMLElement;

      if (isExpanded) {
        body.style.display = "none";
        header.classList.remove("active");
        if (icon) icon.style.transform = "rotate(0deg)";
      } else {
        body.style.display = "block";
        header.classList.add("active");
        if (icon) icon.style.transform = "rotate(90deg)";

        // 아코디언 오픈 시점에 브라우저 화면 하단을 삐져나가는지 판단해 위로 보정
        setTimeout(() => {
          const root = container.getRootNode();
          const floatingPanel = root instanceof ShadowRoot
            ? (root.querySelector(".floating-panel") as HTMLElement)
            : (document.querySelector(".floating-panel") as HTMLElement);

          if (floatingPanel) {
            const rect = floatingPanel.getBoundingClientRect();
            const overflowY = rect.bottom - window.innerHeight;
            if (overflowY > 0) {
              const currentTop = parseFloat(floatingPanel.style.top || "0");
              if (!isNaN(currentTop)) {
                // 화면 밖으로 나간 양 + 12px 만큼 위로 끌어 올림 (화면 맨 위(12px) 한도)
                const targetTop = Math.max(12, currentTop - overflowY - 12);
                floatingPanel.style.top = `${targetTop}px`;
              }
            }
          }
        }, 60);
      }
    });
  };

  setupAccordion("header-buddy-base", "body-buddy-base");
  setupAccordion("header-buddy-theme", "body-buddy-theme");
  setupAccordion("header-buddy-timer", "body-buddy-timer");
  setupAccordion("title-ai-presets", "ai-presets-content");

  // AI 질문 프리셋 리스트 및 컨트롤 바인딩
  const presetsList = currentConf.aiPromptPresets || [];
  
  const renderPresetsList = () => {
    const presetsContainer = container.querySelector("#presets-list-box") as HTMLDivElement;
    if (!presetsContainer) return;
    
    if (presetsList.length === 0) {
      presetsContainer.innerHTML = `<div style="font-size: 10px; color: var(--text-sub); text-align: center; padding: 6px 0;">No presets registered.</div>`;
      return;
    }

    presetsContainer.innerHTML = presetsList.map((p, idx) => `
      <div class="preset-item" style="display: flex; align-items: center; justify-content: space-between; gap: 8px; background: var(--bg-panel); border: 1px solid var(--border-color); padding: 4px 8px; border-radius: 6px; font-size: 11px; color: var(--text-main); min-height: 24px;">
        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 170px;" title="${p}">${p}</span>
        <button type="button" class="delete-preset-btn" data-idx="${idx}" style="background: transparent; border: none; cursor: pointer; color: var(--text-sub); font-size: 9px; padding: 0 2px; line-height: 1; flex-shrink: 0;" title="Delete">❌</button>
      </div>
    `).join("");

    // 개별 프리셋 삭제 바인딩
    presetsContainer.querySelectorAll(".delete-preset-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const idx = parseInt((btn as HTMLButtonElement).dataset.idx || "0");
        presetsList.splice(idx, 1);
        currentConf.aiPromptPresets = [...presetsList];

        const state = getBuddyState();
        if (state.config) {
          const updated = { ...state.config, aiPromptPresets: currentConf.aiPromptPresets };
          updateBuddyState({ config: updated });
          autoSaveConfig(updated);
        }
        renderPresetsList();
      });
    });
  };

  // 프리셋 추가 바인딩
  const addPresetBtn = container.querySelector("#btn-add-preset") as HTMLButtonElement;
  const newPresetInput = container.querySelector("#input-new-preset") as HTMLInputElement;

  if (addPresetBtn && newPresetInput) {
    addPresetBtn.addEventListener("click", () => {
      const text = newPresetInput.value.trim();
      if (!text) return;
      
      if (presetsList.includes(text)) {
        showBuddyToast("This preset already exists.");
        return;
      }
      
      presetsList.push(text);
      currentConf.aiPromptPresets = [...presetsList];
      newPresetInput.value = "";

      const state = getBuddyState();
      if (state.config) {
        const updated = { ...state.config, aiPromptPresets: currentConf.aiPromptPresets };
        updateBuddyState({ config: updated });
        autoSaveConfig(updated);
      }
      renderPresetsList();
    });

    // Enter 키 등록 지원
    newPresetInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addPresetBtn.click();
      }
    });
  }

  // 초기 렌더링
  renderPresetsList();

  // 레벨 및 경험치 초기화 리스너 바인딩
  const resetBtn = container.querySelector("#buddy-reset-xp-btn") as HTMLButtonElement;
  if (resetBtn) {
    resetBtn.addEventListener("click", (e) => {
      e.stopPropagation();

      const rootNode = container.getRootNode() as ShadowRoot | Document;
      
      // 이미 리셋 모달이 띄워져 있다면 무시
      if (rootNode.querySelector("#buddy-custom-confirm-overlay")) {
        return;
      }

      // 커스텀 모달 엘리먼트 동적 생성
      const overlay = document.createElement("div");
      overlay.id = "buddy-custom-confirm-overlay";
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(15, 23, 42, 0.6);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        opacity: 0;
        transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      `;

      overlay.innerHTML = `
        <div id="buddy-confirm-modal-box" style="
          background: #1e293b;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          padding: 24px;
          width: 280px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4);
          display: flex;
          flex-direction: column;
          gap: 18px;
          transform: scale(0.9);
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-sizing: border-box;
        ">
          <div style="display: flex; flex-direction: column; gap: 8px; text-align: center; align-items: center;">
            <div style="
              width: 44px;
              height: 44px;
              border-radius: 50%;
              background: rgba(239, 68, 68, 0.1);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 20px;
              color: #ef4444;
              margin-bottom: 4px;
              border: 1px solid rgba(239, 68, 68, 0.2);
            ">🔄</div>
            <span style="font-size: 14px; font-weight: 800; color: #f8fafc; letter-spacing: -0.01em;">${t("resetTitle")}</span>
            <span style="font-size: 11px; color: #94a3b8; line-height: 1.45; word-break: keep-all; font-weight: 500;">${t("resetConfirm").replace(/\n/g, "<br>")}</span>
          </div>
          <div style="display: flex; gap: 8px; width: 100%;">
            <button id="buddy-confirm-cancel-btn" style="
              flex: 1;
              padding: 9px;
              border-radius: 8px;
              border: 1px solid rgba(255, 255, 255, 0.08);
              background: rgba(255, 255, 255, 0.03);
              color: #cbd5e1;
              font-size: 11.5px;
              font-weight: 600;
              cursor: pointer;
              transition: background-color 0.2s, color 0.2s;
              outline: none;
            " onmouseover="this.style.backgroundColor='rgba(255,255,255,0.08)'; this.style.color='#f8fafc';" onmouseout="this.style.backgroundColor='rgba(255,255,255,0.03)'; this.style.color='#cbd5e1';">${t("resetCancel")}</button>
            
            <button id="buddy-confirm-ok-btn" style="
              flex: 1;
              padding: 9px;
              border-radius: 8px;
              border: none;
              background: #ef4444;
              color: #ffffff;
              font-size: 11.5px;
              font-weight: 600;
              cursor: pointer;
              transition: background-color 0.2s;
              box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
              outline: none;
            " onmouseover="this.style.backgroundColor='#dc2626';" onmouseout="this.style.backgroundColor='#ef4444';">${t("resetOk")}</button>
          </div>
        </div>
      `;

      // 마운트
      if (rootNode instanceof ShadowRoot) {
        rootNode.appendChild(overlay);
      } else {
        document.body.appendChild(overlay);
      }

      // 애니메이션 효과 트리거 (부드러운 페이드인 + 스케일 바운스)
      const modalBox = overlay.querySelector("#buddy-confirm-modal-box") as HTMLElement;
      requestAnimationFrame(() => {
        overlay.style.opacity = "1";
        if (modalBox) {
          modalBox.style.transform = "scale(1)";
        }
      });

      // 닫기 헬퍼 함수
      const closeConfirmModal = () => {
        overlay.style.opacity = "0";
        if (modalBox) {
          modalBox.style.transform = "scale(0.9)";
        }
        setTimeout(() => {
          overlay.remove();
        }, 250);
      };

      // 취소 버튼 바인딩
      const cancelBtn = overlay.querySelector("#buddy-confirm-cancel-btn") as HTMLButtonElement;
      if (cancelBtn) {
        cancelBtn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          closeConfirmModal();
        });
      }

      // 배경 오버레이 클릭 시에도 취소 처리
      overlay.addEventListener("click", (ev) => {
        if (ev.target === overlay) {
          ev.stopPropagation();
          closeConfirmModal();
        }
      });

      // 리셋 확인 버튼 바인딩
      const confirmBtn = overlay.querySelector("#buddy-confirm-ok-btn") as HTMLButtonElement;
      if (confirmBtn) {
        confirmBtn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          
          const defaultUnlocked = [
            "bsprout", "bydragon", "cat", "cotton", "curobot", "fox", "owl", "penguin", 
            "rabbit", "shroom", "star", "xcafe", "xcloud",
            "astrobot", "corgi", "dog", "dragon", "fairy", "fennec", "jellyfish", 
            "nebula", "ufo", "unicorn", "wizard", "sprout", "chef", 
            "p_cat", "p_fox", "p_owl", "p_penguin", "p_rabbit", "cactus"
          ];
          
          const state = getBuddyState();
          if (state.config) {
            const updated = {
              ...state.config,
              level: 1,
              xp: 0,
              unlockedBuddies: defaultUnlocked
            };
            updateBuddyState({ 
              config: updated,
              level: 1,
              xp: 0,
              unlockedBuddies: defaultUnlocked
            });
            autoSaveConfig(updated);
            showBuddyToast("Level & XP Reset Success! ⭐");
          }

          closeConfirmModal();
        });
      }
    });
  }
}
