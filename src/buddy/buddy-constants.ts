import type { RadialMenuItem } from "./buddy-types";

export const DEFAULT_BUDDY_SIZE = 96;
export const DEFAULT_BUDDY_INTERVAL = 4000;
export const RADIAL_MENU_RADIUS = 80; // px
export const RADIAL_ITEM_SIZE = 40; // px
export const CLAMP_PADDING = 8; // 화면 가장자리 최소 패딩

// SVG 아이콘 모음 (Sleek & Rounded)
export const ICONS = {
  translate: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="buddy-icon"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>`,
  
  bookmark: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="buddy-icon"><path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>`,
  
  memo: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="buddy-icon"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`,

  hide: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="buddy-icon"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>`,
  
  settings: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="buddy-icon"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,

  chat: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="buddy-icon"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,

  timer: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="buddy-icon"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  rest: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="buddy-icon"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></svg>`,
};

// 래디얼 메뉴 구성
export const RADIAL_ITEMS: RadialMenuItem[] = [
  {
    id: "translate",
    icon: ICONS.translate,
    labelKey: "menuTranslate",
    cardType: "translate",
  },
  {
    id: "bookmark",
    icon: ICONS.bookmark,
    labelKey: "menuBookmark",
    immediate: true,
  },
  {
    id: "chat",
    icon: ICONS.chat,
    labelKey: "menuChat",
    cardType: "chat",
  },
  {
    id: "timer",
    icon: ICONS.timer,
    labelKey: "menuTimer",
    cardType: "timer",
  },
  {
    id: "rest",
    icon: ICONS.rest,
    labelKey: "menuRest",
    immediate: true,
  },
  {
    id: "memo",
    icon: ICONS.memo,
    labelKey: "menuMemo",
    cardType: "memo",
  },
  {
    id: "hide",
    icon: ICONS.hide,
    labelKey: "menuHide",
    immediate: true,
  },
  {
    id: "settings",
    icon: ICONS.settings,
    labelKey: "menuSettings",
    cardType: "settings",
  },
];

// 지원 언어 12종 정의 (설정 드롭다운 및 번역/드래그 학습 타겟 공통 활용)
export const SUPPORTED_LANGUAGES = [
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
];
  
// 히든 캐릭터 목록 (신규 개편 17종)
export const HIDDEN_BUDDIES: string[] = [
  "blue_dragon", "cactus", "h_chef", "cloud", "cupcake", "dino", "frosty", "ghost", 
  "hamster", "hedgehog", "otter", "panda", "penguin_blue_hat", "red_panda", 
  "sky_dragon", "sprout_fairy", "witchy"
];

// 레거시 캐릭터 ID를 신규 캐릭터 ID로 마이그레이션하기 위한 맵
export const LEGACY_BUDDY_MAP: Record<string, string> = {
  "leafy": "sprout",
  "pingu": "penguin",
  "shiba": "corgi",
  "starbot": "astrobot",
  "starbo": "star",
  "boba": "cactus"
};

export interface CharacterVoicePreset {
  pitch: number;
  rate: number;
}

// 캐릭터별 TTS 보이스 톤(Pitch, Rate) 매핑 테이블
export const VOICE_PRESETS: Record<string, CharacterVoicePreset> = {
  owl: { pitch: 0.8, rate: 0.9 },       // Owly: 진중하고 낮고 약간 차분한 목소리
  cat: { pitch: 1.25, rate: 1.05 },      // Catty: 약간 높은 앙증맞은 목소리
  fox: { pitch: 1.1, rate: 1.0 },       // Foxy: 활발하고 생동감 있는 목소리
  penguin: { pitch: 0.9, rate: 0.95 },  // Teddy(Penguin): 듬직하고 조용함
  rabbit: { pitch: 1.4, rate: 1.15 },    // Bunny: 높고 톡톡 튀며 약간 빠른 목소리
  leafy: { pitch: 1.15, rate: 0.95 },   // Leafy: 부드러운 자연주의 톤
  jellyfish: { pitch: 1.3, rate: 0.9 },  // Jellyfish: 몽환적이고 느림
  fennec: { pitch: 1.35, rate: 1.1 },    // Fennec: 장난스럽고 높은 목소리
  unicorn: { pitch: 1.2, rate: 0.95 },   // Special: 우아한 하이톤
  wizard: { pitch: 0.65, rate: 0.85 },   // Special: 아주 낮고 중후한 대마법사 톤
  fairy: { pitch: 1.5, rate: 1.1 },     // Fairy: 요정처럼 아주 맑고 높은 소리
  ufo: { pitch: 1.7, rate: 1.0 },       // UFO: 기계적인 극하이톤
  cotton: { pitch: 1.2, rate: 1.0 },    // Cotton: 푹신푹신한 아동 톤
  dragon: { pitch: 0.75, rate: 0.95 },   // Special: 강하고 굵직한 톤
  pingu: { pitch: 1.3, rate: 1.2 },     // Pingu: 재치 있고 매우 빠름
  shiba: { pitch: 1.05, rate: 1.05 },    // Shiba: 명랑하고 건강함
  shroom: { pitch: 0.85, rate: 0.9 },   // Shroom: 조용하고 신비로움
  starbot: { pitch: 1.8, rate: 1.0 },    // Starbot: 초하이 피치의 로봇 톤
};


