import wallpaperManifest from "./wallpaperManifest.json";

export interface WallpaperItem {
  id: string;
  filename?: string;
  nameKo: string;
  nameEn: string;
  path?: string;
  css?: string;
  theme: "dark" | "light" | "both";
}

export interface WallpaperConfig {
  source: "auto" | "online" | "local" | "gradient" | "solid";
  onlineKeyword?: string; // e.g. "nature", "minimal", "space", "architecture"
  localId?: string;       // e.g. "dark_01", "light_01" or undefined (auto cycle)
  customUrl?: string;
  blur: number;           // 0, 4, 8, 12, 16px
  overlayOpacity: number; // 0.1 ~ 0.8
  theme: "auto" | "dark" | "light";
}

export const DEFAULT_WALLPAPER_CONFIG: WallpaperConfig = {
  source: "auto",
  onlineKeyword: "nature,landscape",
  localId: undefined, // 기본값: 테마에 맞는 로컬 이미지 자동 순환
  blur: 0,
  overlayOpacity: 0.35,
  theme: "auto",
};

// 무료 고화질 이미지 소스 (Unsplash Source / Picsum 등 신뢰성 있는 CDN)
export const ONLINE_PRESETS = [
  { id: "nature", labelKo: "자연 & 풍경", labelEn: "Nature & Landscapes", keyword: "nature,landscape,mountain" },
  { id: "minimal", labelKo: "미니멀 & 건축", labelEn: "Minimal & Architecture", keyword: "minimal,architecture,abstract" },
  { id: "space", labelKo: "우주 & 밤하늘", labelEn: "Cosmic & Night Sky", keyword: "space,aurora,galaxy" },
  { id: "coastal", labelKo: "바다 & 해안", labelEn: "Ocean & Coastal", keyword: "ocean,beach,sea" },
  { id: "forest", labelKo: "숲 & 안개", labelEn: "Forest & Fog", keyword: "forest,mist,woods" },
];

export const GRADIENT_PRESETS: WallpaperItem[] = [
  {
    id: "gradient_aurora",
    nameKo: "오로라 그라디언트 (다크)",
    nameEn: "Aurora Gradient (Dark)",
    theme: "dark",
    css: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #064e3b 100%)",
  },
  {
    id: "gradient_soft_light",
    nameKo: "소프트 선라이트 (라이트)",
    nameEn: "Soft Sunlight (Light)",
    theme: "light",
    css: "linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #fef3c7 100%)",
  },
  {
    id: "gradient_rose_mist",
    nameKo: "로즈 미스트 (라이트)",
    nameEn: "Rose Mist (Light)",
    theme: "light",
    css: "linear-gradient(135deg, #fff1f2 0%, #f3e8ff 50%, #f0fdf4 100%)",
  },
];

/**
 * 다크/라이트 테마에 속한 모든 로컬 이미지 목록을 동적으로 가져옵니다.
 * 이미지가 10장, 20장으로 늘어나도 manifest에서 자동으로 로드됩니다.
 */
export function getLocalWallpapers(theme?: "dark" | "light"): WallpaperItem[] {
  const darkItems: WallpaperItem[] = (wallpaperManifest.dark || []).map(item => ({
    ...item,
    theme: "dark" as const
  }));
  const lightItems: WallpaperItem[] = (wallpaperManifest.light || []).map(item => ({
    ...item,
    theme: "light" as const
  }));

  if (theme === "dark") return darkItems;
  if (theme === "light") return lightItems;
  return [...darkItems, ...lightItems];
}

const STORAGE_KEY = "clickbook_wallpaper_config";

export function getStoredWallpaperConfig(): WallpaperConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_WALLPAPER_CONFIG, ...JSON.parse(raw) };
  } catch (e) {
    console.warn("Failed to load wallpaper config:", e);
  }
  return DEFAULT_WALLPAPER_CONFIG;
}

export function saveStoredWallpaperConfig(config: WallpaperConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent("CLICKBOOK_WALLPAPER_CHANGED", { detail: config }));
  } catch (e) {
    console.warn("Failed to save wallpaper config:", e);
  }
}

/**
 * 다음 로컬 배경화면 순환
 */
export function getNextLocalWallpaper(currentId: string | undefined, isDarkMode: boolean): WallpaperItem {
  const list = getLocalWallpapers(isDarkMode ? "dark" : "light");
  if (list.length === 0) {
    return {
      id: isDarkMode ? "dark_fallback" : "light_fallback",
      nameKo: "기본 배경",
      nameEn: "Default",
      theme: isDarkMode ? "dark" : "light",
      css: isDarkMode ? "linear-gradient(135deg, #090d16 0%, #111827 100%)" : "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)"
    };
  }
  const currentIndex = list.findIndex(item => item.id === currentId);
  const nextIndex = (currentIndex + 1) % list.length;
  return list[nextIndex];
}

/**
 * 테마에 적합한 로컬/온라인 배경 CSS 또는 URL 반환
 */
export function resolveCurrentWallpaper(config: WallpaperConfig, isDarkMode: boolean): { type: "image" | "gradient" | "solid"; value: string } {
  const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

  if (config.source === "gradient") {
    const gradient = GRADIENT_PRESETS.find(g => g.id === config.localId);
    if (gradient && gradient.css) {
      return { type: "gradient", value: gradient.css };
    }
    return {
      type: "gradient",
      value: isDarkMode
        ? "linear-gradient(135deg, #090d16 0%, #111827 50%, #1e1b4b 100%)"
        : "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #e0e7ff 100%)",
    };
  }

  if (config.source === "solid") {
    return {
      type: "solid",
      value: isDarkMode ? "#0b0f19" : "#f8fafc",
    };
  }

  // 로컬 전용 모드이거나, 오프라인인 경우 (auto 모드에서 오프라인 포함)
  if (config.source === "local" || isOffline) {
    const allLocal = getLocalWallpapers(isDarkMode ? "dark" : "light");
    
    // 특정 ID가 지정된 경우
    if (config.localId) {
      const match = allLocal.find(w => w.id === config.localId);
      if (match && match.path) return { type: "image", value: match.path };
      if (match && match.css) return { type: "gradient", value: match.css };
    }

    // 기본값: 목록의 첫 번째 이미지 또는 테마에 맞는 이미지
    if (allLocal.length > 0 && allLocal[0].path) {
      return { type: "image", value: allLocal[0].path };
    }

    return {
      type: "gradient",
      value: isDarkMode
        ? "linear-gradient(135deg, #090d16 0%, #111827 50%, #1e1b4b 100%)"
        : "linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #fef3c7 100%)",
    };
  }

  // 온라인 또는 auto (온라인 상태)
  if (config.customUrl) {
    return { type: "image", value: config.customUrl };
  }

  const defaultOnline = isDarkMode
    ? "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=2560&q=80" // 코스믹 산맥/별밤
    : "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2560&q=80"; // 맑고 밝은 해변/하늘

  return { type: "image", value: defaultOnline };
}
