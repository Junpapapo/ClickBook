import type { BuddyConfig, CardType, BuddyActionStatus } from "./buddy-types";
import { isContextInvalidated } from "./buddy-utils";
import { LEGACY_BUDDY_MAP } from "./buddy-constants";

export interface BuddyState {
  config: BuddyConfig | null;
  aiAvailable: boolean;
  activePanel: CardType | null;
  isMenuOpen: boolean;
  isDragging: boolean;
  translateInputCache: string;
  translateResultCache: string;
  memoInputCache: string;
  actionStatus: BuddyActionStatus;
  timerStatus: "idle" | "running" | "paused";
  timerRemaining: number;
  timerTotal: number;
  timerMessage: string;
  isPomodoroMode: boolean;
  isReversePomodoro: boolean;
  isSoundEnabled: boolean;
  isDndMode: boolean;
  asmrType: "off" | "rain" | "metronome";
  aiPromptPresets: string[];
  pomodoroPhase: "focus" | "break" | "none";
  timerCompleteTheme?: "night" | "forest" | "ocean" | "fireplace" | "sunset" | "yoga" | "comic_random" | "comic1" | "comic2" | "comic3" | "comic4" | "comic5" | "comic6" | "comic7" | "comic8" | "comic9" | "comic10" | "comic11" | "comic12" | "comic13" | "comic14" | "comic15" | "comic16" | "comic17" | "comic18" | "random";
  restRandomTheme?: boolean;
  focusRandomTheme?: boolean;
  galleryOfflineMode?: boolean;
  level: number;
  xp: number;
  unlockedBuddies: string[];
  revealHidden: boolean;
  buddyType?: "basic" | "premium" | "hidden";
}

// 싱글톤 상태 객체
const state: BuddyState = {
  config: null,
  aiAvailable: false,
  activePanel: null,
  isMenuOpen: false,
  isDragging: false,
  translateInputCache: "",
  translateResultCache: "",
  memoInputCache: "",
  actionStatus: "idle",
  timerStatus: "idle",
  timerRemaining: 0,
  timerTotal: 0,
  timerMessage: "",
  isPomodoroMode: false,
  isReversePomodoro: false,
  isSoundEnabled: true,
  isDndMode: false,
  asmrType: "off",
  aiPromptPresets: [],
  pomodoroPhase: "none",
  timerCompleteTheme: "night",
  restRandomTheme: false,
  focusRandomTheme: false,
  galleryOfflineMode: false,
  level: 1,
  xp: 0,
  unlockedBuddies: [],
  revealHidden: false,
  buddyType: "basic",
};

type StateListener = (state: BuddyState) => void;
const listeners = new Set<StateListener>();

export function getBuddyState(): BuddyState {
  return { ...state };
}

// 상태 업데이트 및 리스너 전파
export function updateBuddyState(updates: Partial<BuddyState>): void {
  if (isContextInvalidated()) {
    listeners.clear();
    return;
  }
  Object.assign(state, updates);
  if (updates.config) {
    // 레거시 buddyId 강제 보정
    if (updates.config.buddyId && LEGACY_BUDDY_MAP[updates.config.buddyId]) {
      updates.config.buddyId = LEGACY_BUDDY_MAP[updates.config.buddyId];
    }

    // 버디 이름이 "superadmin"인 경우 revealHidden을 강제로 true로 설정 (이스터에그 숨김 기능)
    const isSuperAdmin = updates.config.buddyName === "superadmin";
    updates.config.revealHidden = isSuperAdmin;
    state.revealHidden = isSuperAdmin;

    if (updates.config.level !== undefined) state.level = updates.config.level;
    if (updates.config.xp !== undefined) state.xp = updates.config.xp;
    if (updates.config.buddyType !== undefined) state.buddyType = updates.config.buddyType;
    
    // unlockedBuddies 레거시 ID 변환
    let unlocked = updates.config.unlockedBuddies;
    let newlyUnlockedCactus = false;
    if (unlocked) {
      unlocked = unlocked.map(id => LEGACY_BUDDY_MAP[id] || id);
      
      // 1레벨 히든 캐릭터(cactus) 최초 기동 시 강제 해금 보장
      if (!unlocked.includes("cactus")) {
        unlocked.push("cactus");
        newlyUnlockedCactus = true;
      }
      
      // 누락되었던 신규 프리미엄/베이직 캐릭터들 강제 추가
      const defaultPremiumAndBasic = [
        "bsprout", "bydragon", "cat", "cotton", "curobot", "fox", "owl", "penguin", 
        "rabbit", "shroom", "star", "xcafe", "xcloud",
        "astrobot", "corgi", "dog", "dragon", "fairy", "fennec", "jellyfish", 
        "nebula", "ufo", "unicorn", "wizard", "sprout", "chef", 
        "p_cat", "p_fox", "p_owl", "p_penguin", "p_rabbit"
      ];
      defaultPremiumAndBasic.forEach(id => {
        if (!unlocked.includes(id)) {
          unlocked.push(id);
        }
      });
      
      unlocked = Array.from(new Set(unlocked));
      updates.config.unlockedBuddies = unlocked;
    }

    if (!unlocked || unlocked.length === 0) {
      unlocked = [
        "bsprout", "bydragon", "cat", "cotton", "curobot", "fox", "owl", "penguin", 
        "rabbit", "shroom", "star", "xcafe", "xcloud",
        "astrobot", "corgi", "dog", "dragon", "fairy", "fennec", "jellyfish", 
        "nebula", "ufo", "unicorn", "wizard", "sprout", "chef", 
        "p_cat", "p_fox", "p_owl", "p_penguin", "p_rabbit", "cactus"
      ];
      updates.config.unlockedBuddies = unlocked;
      newlyUnlockedCactus = true;
    }
    state.unlockedBuddies = unlocked;

    // 최초 1레벨 시점이고 선인장이 처음 해금되었을 때 1초 뒤 축하 이벤트 발생
    if (newlyUnlockedCactus && state.level === 1) {
      setTimeout(() => {
        if (isContextInvalidated()) return;
        window.dispatchEvent(
          new CustomEvent("buddy-levelup", {
            detail: { level: 1, newlyUnlocked: ["cactus"] },
          })
        );
      }, 1000);
    }
  }
  listeners.forEach((listener) => {
    try {
      if (isContextInvalidated()) {
        listeners.clear();
        return;
      }
      listener({ ...state });
    } catch (e: any) {
      const msg = e?.message ? String(e.message) : "";
      const stack = e?.stack ? String(e.stack) : "";
      const name = e?.name ? String(e.name) : "";
      const str = String(e || "");
      const str2 = typeof e?.toString === "function" ? String(e.toString()) : "";
      const fullErrText = `${msg} ${stack} ${name} ${str} ${str2}`.toLowerCase();
      if (!fullErrText.includes("invalidated") && !fullErrText.includes("context")) {
        console.error("[Buddy State] Listener execution failed:", e);
      }
    }
  });
}

// 상태 변경 구독
export function subscribeBuddyState(listener: StateListener): () => void {
  listeners.add(listener);
  // 초기 상태 전달 시의 예외 처리 감싸기
  try {
    listener({ ...state });
  } catch (e: any) {
    const msg = e?.message ? String(e.message) : "";
    const stack = e?.stack ? String(e.stack) : "";
    const name = e?.name ? String(e.name) : "";
    const str = String(e || "");
    const str2 = typeof e?.toString === "function" ? String(e.toString()) : "";
    const fullErrText = `${msg} ${stack} ${name} ${str} ${str2}`.toLowerCase();
    if (!fullErrText.includes("invalidated") && !fullErrText.includes("context")) {
      console.error("[Buddy State] Initial subscriber execution failed:", e);
    }
  }
  return () => {
    listeners.delete(listener);
  };
}

// 경험치 추가 및 레벨업 판정 함수
export function addBuddyXp(amount: number): void {
  if (!state.config) return;

  let newXp = (state.config.xp || 0) + amount;
  let newLevel = state.config.level || 1;
  let leveledUp = false;
  const newlyUnlocked: string[] = [];

  // 레벨업 경험치 한계선 계산 공식: 항상 100 XP 필요
  while (true) {
    const xpNeeded = 100;
    if (newXp >= xpNeeded) {
      newXp -= xpNeeded;
      newLevel += 1;
      leveledUp = true;

      // 최대 17레벨까지 해금 매핑 적용 (1레벨은 cactus 기본 자동 해금)
      if (newLevel === 2 && !state.config.unlockedBuddies?.includes("h_chef")) {
        newlyUnlocked.push("h_chef");
      } else if (newLevel === 3 && !state.config.unlockedBuddies?.includes("frosty")) {
        newlyUnlocked.push("frosty");
      } else if (newLevel === 4 && !state.config.unlockedBuddies?.includes("witchy")) {
        newlyUnlocked.push("witchy");
      } else if (newLevel === 5 && !state.config.unlockedBuddies?.includes("dino")) {
        newlyUnlocked.push("dino");
      } else if (newLevel === 6 && !state.config.unlockedBuddies?.includes("ghost")) {
        newlyUnlocked.push("ghost");
      } else if (newLevel === 7 && !state.config.unlockedBuddies?.includes("hamster")) {
        newlyUnlocked.push("hamster");
      } else if (newLevel === 8 && !state.config.unlockedBuddies?.includes("hedgehog")) {
        newlyUnlocked.push("hedgehog");
      } else if (newLevel === 9 && !state.config.unlockedBuddies?.includes("otter")) {
        newlyUnlocked.push("otter");
      } else if (newLevel === 10 && !state.config.unlockedBuddies?.includes("panda")) {
        newlyUnlocked.push("panda");
      } else if (newLevel === 11 && !state.config.unlockedBuddies?.includes("blue_dragon")) {
        newlyUnlocked.push("blue_dragon");
      } else if (newLevel === 12 && !state.config.unlockedBuddies?.includes("cloud")) {
        newlyUnlocked.push("cloud");
      } else if (newLevel === 13 && !state.config.unlockedBuddies?.includes("cupcake")) {
        newlyUnlocked.push("cupcake");
      } else if (newLevel === 14 && !state.config.unlockedBuddies?.includes("penguin_blue_hat")) {
        newlyUnlocked.push("penguin_blue_hat");
      } else if (newLevel === 15 && !state.config.unlockedBuddies?.includes("red_panda")) {
        newlyUnlocked.push("red_panda");
      } else if (newLevel === 16 && !state.config.unlockedBuddies?.includes("sky_dragon")) {
        newlyUnlocked.push("sky_dragon");
      } else if (newLevel === 17 && !state.config.unlockedBuddies?.includes("sprout_fairy")) {
        newlyUnlocked.push("sprout_fairy");
      }
    } else {
      break;
    }
  }

  const updatedUnlocked = [...(state.config.unlockedBuddies || [])];
  newlyUnlocked.forEach((id) => {
    if (!updatedUnlocked.includes(id)) {
      updatedUnlocked.push(id);
    }
  });

  const updatedConfig = {
    ...state.config,
    xp: newXp,
    level: newLevel,
    unlockedBuddies: updatedUnlocked,
  };

  updateBuddyState({
    config: updatedConfig,
    xp: newXp,
    level: newLevel,
    unlockedBuddies: updatedUnlocked,
  });

  // 백그라운드 스토리지에 동기화 저장
  try {
    chrome.runtime.sendMessage({
      type: "SAVE_BUDDY_CONFIG",
      config: updatedConfig,
    }).catch((err) => {
      console.warn("[Buddy State] Failed to auto-save gamification status:", err);
    });
  } catch (err) {
    console.warn("[Buddy State] Failed to send SAVE_BUDDY_CONFIG message:", err);
  }

  // 레벨업 이벤트 발행
  if (leveledUp) {
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("buddy-levelup", {
          detail: { level: newLevel, newlyUnlocked },
        })
      );
    }, 50);
  }
}

