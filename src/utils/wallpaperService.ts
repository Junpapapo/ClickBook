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

// 테마별 엄선된 최고급 고화질 온라인 배경화면 큐레이션 풀 (Unsplash 고해상도)
export const CURATED_ONLINE_WALLPAPERS = {
  dark: [
    { id: "dark_online_01", url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=2560&q=80", name: "Starry Alps Mountains" },
    { id: "dark_online_02", url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=2560&q=80", name: "Milky Way Galaxy Night" },
    { id: "dark_online_03", url: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=2560&q=80", name: "Deep Neon Forest Mist" },
    { id: "dark_online_04", url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=2560&q=80", name: "Aurora Borealis Fjord" },
    { id: "dark_online_05", url: "https://images.unsplash.com/photo-1470813740244-df37b8c1edcb?auto=format&fit=crop&w=2560&q=80", name: "Night Sky Camp" },
    { id: "dark_online_06", url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=2560&q=80", name: "Earth Horizon Deep Blue" },
    { id: "dark_online_07", url: "https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?auto=format&fit=crop&w=2560&q=80", name: "Neon Sunset Horizon" },
    { id: "dark_online_08", url: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=2560&q=80", name: "Starlight Pine Ridge" },
    { id: "dark_online_09", url: "https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?auto=format&fit=crop&w=2560&q=80", name: "Twilight Ocean Rocks" },
    { id: "dark_online_10", url: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=2560&q=80", name: "Misty Evergreen Trees" },
    { id: "dark_online_11", url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2560&q=80", name: "Yosemite Valley Twilight" },
    { id: "dark_online_12", url: "https://images.unsplash.com/photo-1498084393753-b411b2d26b34?auto=format&fit=crop&w=2560&q=80", name: "Cyberpunk City Nights" },
  ],
  light: [
    { id: "light_online_01", url: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=2560&q=80", name: "Peaceful Green Hills" },
    { id: "light_online_02", url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=2560&q=80", name: "Alpine Morning Mist" },
    { id: "light_online_03", url: "https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=2560&q=80", name: "Sunny Canyon River" },
    { id: "light_online_04", url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=2560&q=80", name: "Golden Valley Sunbeams" },
    { id: "light_online_05", url: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=2560&q=80", name: "Green Prairie Sunset" },
    { id: "light_online_06", url: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=2560&q=80", name: "Autumn Path Foliage" },
    { id: "light_online_07", url: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=2560&q=80", name: "Mossy Waterfall Bridge" },
    { id: "light_online_08", url: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=2560&q=80", name: "Misty Evergreen Forest" },
    { id: "light_online_09", url: "https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?auto=format&fit=crop&w=2560&q=80", name: "Mirror Lake Pine Reflections" },
    { id: "light_online_10", url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=2560&q=80", name: "Hallstatt Lake Breeze" },
    { id: "light_online_11", url: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=2560&q=80", name: "Nordic Birch Woods" },
    { id: "light_online_12", url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=2560&q=80", name: "Minimal Clean Desk" },
  ],
};

/**
 * 100% 무료 & 무제한 Unsplash 기반 고해상도 랜덤 배경화면 생성 (Picsum CDN)
 */
export function getRandomOnlineWallpaper(): string {
  const seed = `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
  return `https://picsum.photos/seed/${seed}/2560/1440`;
}

/**
 * 다음 온라인 배경화면 순환:
 * 큐레이션 목록과 무제한 실시간 랜덤 사진을 매끄럽게 결합하여 무한 제공
 */
export function getNextOnlineWallpaper(currentUrl: string | undefined, isDarkMode: boolean): { url: string } {
  // 50% 확률 또는 큐레이션 순환 이후에는 완전 무제한 실시간 고화질 스트리밍
  const list = isDarkMode ? CURATED_ONLINE_WALLPAPERS.dark : CURATED_ONLINE_WALLPAPERS.light;
  const currentIndex = list.findIndex(item => item.url === currentUrl);
  
  if (currentIndex >= 0 && currentIndex < list.length - 1) {
    // 큐레이션 목록 내 순차 이동
    return { url: list[currentIndex + 1].url };
  }
  
  // 큐레이션 끝에 도달했거나 이미 랜덤 URL인 경우: 무제한 실시간 새 사진 생성
  return { url: getRandomOnlineWallpaper() };
}

/**
 * Auto 모드: 내장 로컬 10종과 무제한 온라인 고화질 사진을 매끄럽게 교차 순환
 */
export function getNextAutoWallpaper(config: WallpaperConfig, isDarkMode: boolean): Partial<WallpaperConfig> {
  const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

  if (isOffline) {
    const nextLocal = getNextLocalWallpaper(config.localId, isDarkMode);
    return { localId: nextLocal.id, customUrl: undefined };
  }

  // 온라인 상태: 현재 로컬을 보고 있다면 -> 다음은 무제한 온라인 사진
  // 현재 온라인을 보고 있다면 -> 다음은 다음 로컬 사진으로 교차 순환하여 무한한 시각적 즐거움 제공
  if (config.customUrl) {
    // 온라인 -> 다음 로컬로 이동
    const nextLocal = getNextLocalWallpaper(config.localId, isDarkMode);
    return { localId: nextLocal.id, customUrl: undefined };
  } else {
    // 로컬 -> 무제한 실시간 온라인 사진으로 이동
    const nextOnlineUrl = getRandomOnlineWallpaper();
    return { customUrl: nextOnlineUrl, localId: undefined };
  }
}

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
    if (typeof chrome !== "undefined" && chrome?.storage?.local) {
      chrome.storage.local.set({ [STORAGE_KEY]: config });
    }
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

  // 로컬 전용 모드, 오프라인, 또는 localId가 명시적으로 설정된 경우 (auto 모드 포함)
  if (config.source === "local" || isOffline || (config.source === "auto" && config.localId && !config.customUrl)) {
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

  const curatedList = isDarkMode ? CURATED_ONLINE_WALLPAPERS.dark : CURATED_ONLINE_WALLPAPERS.light;
  return { type: "image", value: curatedList[0].url };
}
