import React, { useState, useEffect, useCallback } from "react";
import {
  type WallpaperConfig,
  getStoredWallpaperConfig,
  saveStoredWallpaperConfig,
  resolveCurrentWallpaper,
  getNextLocalWallpaper,
  GRADIENT_PRESETS,
} from "@/utils/wallpaperService";

interface Props {
  isDarkMode: boolean;
  children: React.ReactNode;
}

export default function WallpaperBackground({ isDarkMode, children }: Props) {
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
    } else {
      // 온라인 추천 사진 새로고침
      const randomSeed = Math.random().toString(36).substring(7);
      const newUrl = `https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2560&q=80&sig=${randomSeed}`;
      handleUpdateConfig({ customUrl: newUrl });
    }
  }, [config.source, config.localId, isDarkMode, handleUpdateConfig]);

  useEffect(() => {
    const handleConfigChange = (e: Event) => {
      const customEvent = e as CustomEvent<WallpaperConfig>;
      if (customEvent.detail) setConfig(customEvent.detail);
    };
    window.addEventListener("CLICKBOOK_WALLPAPER_CHANGED", handleConfigChange);
    
    const handleTriggerRefresh = () => {
      handleRefresh();
    };
    window.addEventListener("TRIGGER_WALLPAPER_REFRESH", handleTriggerRefresh);

    return () => {
      window.removeEventListener("CLICKBOOK_WALLPAPER_CHANGED", handleConfigChange);
      window.removeEventListener("TRIGGER_WALLPAPER_REFRESH", handleTriggerRefresh);
    };
  }, [handleRefresh]);

  const currentWp = resolveCurrentWallpaper(config, isDarkMode);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden transition-colors duration-300">
      {/* ── 배경 레이어 (이미지 / 그라디언트) ── */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none">
        {currentWp.type === "image" ? (
          <img
            key={currentWp.value}
            src={currentWp.value}
            alt="Dashboard Wallpaper"
            onLoad={() => setImgLoaded(true)}
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

        {/* ── 테마별 글래스모피즘 오버레이 틴트 ── */}
        <div
          className={`absolute inset-0 transition-colors duration-300 ${
            isDarkMode
              ? "bg-slate-950/40 backdrop-brightness-[0.75]"
              : "bg-white/35 backdrop-brightness-[1.02]"
          }`}
          style={{
            backgroundColor: isDarkMode
              ? `rgba(15, 23, 42, ${config.overlayOpacity})`
              : `rgba(248, 250, 252, ${Math.max(0.2, config.overlayOpacity * 0.7)})`,
          }}
        />
      </div>

      {/* ── 메인 콘텐츠 캔버스 ── */}
      <div className="relative z-10 flex flex-col min-h-screen">{children}</div>
    </div>
  );
}
