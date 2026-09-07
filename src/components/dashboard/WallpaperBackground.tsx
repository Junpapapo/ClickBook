import React, { useState, useEffect, useCallback } from "react";
import {
  type WallpaperConfig,
  getStoredWallpaperConfig,
  saveStoredWallpaperConfig,
  resolveCurrentWallpaper,
  getNextLocalWallpaper,
  getNextOnlineWallpaper,
  getNextAutoWallpaper,
  GRADIENT_PRESETS,
} from "@/utils/wallpaperService";

interface Props {
  isDarkMode: boolean;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  className?: string;
}

export default function WallpaperBackground({ isDarkMode, children, onClick, className = "" }: Props) {
  const [config, setConfig] = useState<WallpaperConfig>(getStoredWallpaperConfig);
  const [imgLoaded, setImgLoaded] = useState(false);

  const handleUpdateConfig = useCallback((updates: Partial<WallpaperConfig>) => {
    setConfig(prev => {
      const next = { ...prev, ...updates };
      saveStoredWallpaperConfig(next);
      return next;
    });
  }, []);

  const handleRefresh = useCallback(() => {
    const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

    if (config.source === "local" || (config.source === "auto" && isOffline)) {
      // 로컬 월페이퍼 순환
      const nextItem = getNextLocalWallpaper(config.localId, isDarkMode);
      handleUpdateConfig({ localId: nextItem.id, customUrl: undefined });
    } else if (config.source === "gradient") {
      // 그라디언트 순환
      const currentIndex = GRADIENT_PRESETS.findIndex((g) => g.id === config.localId);
      const nextIndex = (currentIndex + 1) % GRADIENT_PRESETS.length;
      handleUpdateConfig({ localId: GRADIENT_PRESETS[nextIndex].id });
    } else if (config.source === "online") {
      // 온라인 큐레이션 사진 순환
      const nextOnline = getNextOnlineWallpaper(config.customUrl, isDarkMode);
      handleUpdateConfig({ customUrl: nextOnline.url, localId: undefined });
    } else {
      // auto 모드: 로컬 10종 + 온라인 12종 통합 풀 지능형 순환
      const next = getNextAutoWallpaper(config, isDarkMode);
      handleUpdateConfig(next);
    }
  }, [config, isDarkMode, handleUpdateConfig]);

  useEffect(() => {
    const handleConfigChange = (e: Event) => {
      const customEvent = e as CustomEvent<WallpaperConfig>;
      if (customEvent.detail) setConfig(customEvent.detail);
    };
    window.addEventListener("CLICKBOOK_WALLPAPER_CHANGED", handleConfigChange);

    // Chrome storage 동기화 리스너
    const storageListener = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === "local" && changes.clickbook_wallpaper_config?.newValue) {
        setConfig(changes.clickbook_wallpaper_config.newValue);
      }
    };
    if (typeof chrome !== "undefined" && chrome?.storage?.onChanged) {
      chrome.storage.onChanged.addListener(storageListener);
    }
    
    const handleTriggerRefresh = () => {
      handleRefresh();
    };
    window.addEventListener("TRIGGER_WALLPAPER_REFRESH", handleTriggerRefresh);

    // 네트워크 끊김 감지 시 즉시 오프라인 내장 월페이퍼로 폴백
    const handleOffline = () => {
      if (config.customUrl) {
        const fallbackLocal = getNextLocalWallpaper(config.localId, isDarkMode);
        handleUpdateConfig({ customUrl: undefined, localId: fallbackLocal.id });
      }
    };
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("CLICKBOOK_WALLPAPER_CHANGED", handleConfigChange);
      if (typeof chrome !== "undefined" && chrome?.storage?.onChanged) {
        chrome.storage.onChanged.removeListener(storageListener);
      }
      window.removeEventListener("TRIGGER_WALLPAPER_REFRESH", handleTriggerRefresh);
      window.removeEventListener("offline", handleOffline);
    };
  }, [handleRefresh, config.customUrl, config.localId, isDarkMode, handleUpdateConfig]);

  const currentWp = resolveCurrentWallpaper(config, isDarkMode);

  useEffect(() => {
    setImgLoaded(false);
  }, [currentWp.value]);

  // 온라인 이미지 로드 실패 시 오프라인 내장 고화질 배경으로 즉각 폴백
  const handleImageError = useCallback(() => {
    console.warn("온라인 배경화면 로딩 실패: 오프라인 내장 고화질 배경화면으로 자동 폴백합니다.");
    const fallbackLocal = getNextLocalWallpaper(config.localId, isDarkMode);
    handleUpdateConfig({
      customUrl: undefined,
      localId: fallbackLocal.id,
    });
  }, [config.localId, isDarkMode, handleUpdateConfig]);

  return (
    <div 
      onClick={onClick}
      className={`relative min-h-screen w-full overflow-x-hidden transition-colors duration-300 ${className}`}
    >
      {/* ── 배경 레이어 (이미지 / 그라디언트) ── */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none">
        {currentWp.type === "image" ? (
          <img
            key={currentWp.value}
            src={currentWp.value}
            alt="Dashboard Wallpaper"
            onLoad={() => setImgLoaded(true)}
            onError={handleImageError}
            className={`w-full h-full object-cover transition-opacity duration-500 ${
              imgLoaded ? "opacity-100 scale-100" : "opacity-0 scale-102"
            }`}
            style={{
              filter: config.blur > 0 ? `blur(${config.blur}px)` : undefined,
              transform: config.blur > 0 ? "scale(1.04)" : "scale(1)",
            }}
          />
        ) : currentWp.type === "gradient" ? (
          <div className="w-full h-full transition-all duration-500" style={{ background: currentWp.value }} />
        ) : (
          <div className="w-full h-full transition-all duration-500" style={{ backgroundColor: currentWp.value }} />
        )}

        {/* ── 테마별 글래스모피즘 안티 글레어(눈부심 방지) 오버레이 틴트 ── */}
        <div
          className={`absolute inset-0 transition-all duration-300 ${
            isDarkMode
              ? "bg-slate-950/40 backdrop-brightness-[0.75]"
              : "backdrop-brightness-[0.93] backdrop-contrast-[1.02]"
          }`}
          style={{
            backgroundColor: isDarkMode
              ? `rgba(15, 23, 42, ${Math.max(0.3, config.overlayOpacity)})`
              : `rgba(226, 232, 240, ${Math.max(0.42, config.overlayOpacity * 0.95)})`,
          }}
        />
      </div>

      {/* ── 메인 콘텐츠 캔버스 ── */}
      <div className="relative z-10 flex flex-col min-h-screen">{children}</div>
    </div>
  );
}
