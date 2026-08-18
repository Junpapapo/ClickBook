import { useState, useEffect, useCallback } from "react";
import { 
  Sun, 
  Cloud, 
  CloudRain, 
  CloudSun, 
  CloudSnow, 
  CloudLightning, 
  RefreshCw, 
  MapPin, 
} from "lucide-react";
import { useLang } from "@/shared/LanguageContext";
import type { WeatherConfig, AppSettings } from "@/shared/types";
import { fetchLiveWeather, type WeatherResult } from "@/utils/weatherApi";

function WeatherIcon({ icon, size = 16, className = "" }: { icon: string; size?: number; className?: string }) {
  switch (icon) {
    case "sun":
      return <Sun size={size} className={`text-amber-500 ${className}`} />;
    case "cloud-sun":
      return <CloudSun size={size} className={`text-amber-400 dark:text-amber-300 ${className}`} />;
    case "cloud":
      return <Cloud size={size} className={`text-slate-400 dark:text-slate-300 ${className}`} />;
    case "rain":
      return <CloudRain size={size} className={`text-blue-500 ${className}`} />;
    case "snow":
      return <CloudSnow size={size} className={`text-sky-400 ${className}`} />;
    case "thunder":
      return <CloudLightning size={size} className={`text-purple-500 ${className}`} />;
    default:
      return <Sun size={size} className={`text-amber-500 ${className}`} />;
  }
}

export default function WeatherWidget() {
  const { lang, t } = useLang();
  const [viewTab, setViewTab] = useState<"hourly" | "daily">("hourly");
  const [weatherConfig, setWeatherConfig] = useState<WeatherConfig | undefined>(undefined);
  const [weather, setWeather] = useState<WeatherResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 1. chrome.storage에서 날씨 설정 불러오기 및 실시간 동기화
  useEffect(() => {
    const loadConfig = () => {
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(["clickbook_settings"], (res) => {
          const settings: AppSettings = res.clickbook_settings;
          if (settings && settings.weatherConfig) {
            setWeatherConfig(settings.weatherConfig);
          }
        });
      }
    };

    loadConfig();

    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
      const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
        if (changes.clickbook_settings) {
          const nextSettings: AppSettings = changes.clickbook_settings.newValue;
          if (nextSettings?.weatherConfig) {
            setWeatherConfig(nextSettings.weatherConfig);
          }
        }
      };
      chrome.storage.onChanged.addListener(listener);
      return () => chrome.storage.onChanged.removeListener(listener);
    }
  }, []);

  // 2. 날씨 데이터 패치
  const loadWeather = useCallback(async (force = false) => {
    if (force) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await fetchLiveWeather(weatherConfig, lang, force);
      setWeather(data);
    } catch (err) {
      console.error("Failed to fetch live weather:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [weatherConfig, lang]);

  useEffect(() => {
    loadWeather(false);
  }, [loadWeather]);

  const unitLabel = weatherConfig?.unit === "fahrenheit" ? "°F" : "°C";

  if (loading && !weather) {
    return (
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-2xl p-4 shadow-figma-sm select-none">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5">
            <Sun size={15} className="text-amber-500 animate-spin-slow" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {t("weatherWidgetSettings")}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 animate-pulse">
            {t("weatherLoading")}
          </span>
        </div>
        <div className="h-28 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-2xl p-3.5 shadow-figma-sm select-none transition-all">
      {/* ── 1. 대형 기온 & 날씨 상태 & 우측 지역명/리프레시 ── */}
      {weather && (
        <div className="flex flex-col mb-2.5 px-0.5">
          <div className="flex items-center justify-between gap-2">
            {/* 좌측: 날씨 아이콘 + 대형 기온 + 날씨 상태 */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 text-amber-500 shrink-0 flex items-center justify-center">
                <WeatherIcon icon={weather.icon} size={36} />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-baseline gap-1 leading-none">
                  <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums">
                    {weather.temp}°
                  </span>
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                    {unitLabel.replace("°", "")}
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-tight truncate mt-1">
                  {weather.condition}
                </span>
              </div>
            </div>

            {/* 우측 (빨간 사각형 영역): 지역명 + 새로고침 버튼 */}
            <div className="flex items-center gap-1 shrink-0 bg-slate-100/70 dark:bg-slate-800/70 px-2 py-1 rounded-xl border border-slate-200/60 dark:border-white/5">
              <MapPin size={11} className="text-rose-500 shrink-0" />
              <span className="text-[11.5px] font-bold text-slate-700 dark:text-slate-200 max-w-[100px] truncate" title={weather.city}>
                {weather.city}
              </span>
              <button
                type="button"
                onClick={() => loadWeather(true)}
                disabled={refreshing}
                className="p-0.5 text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded-md transition-colors cursor-pointer ml-0.5"
                title={t("weatherRefresh")}
              >
                <RefreshCw size={10.5} className={refreshing ? "animate-spin text-amber-500" : ""} />
              </button>
            </div>
          </div>

          {/* 하단 세부 메타 (체감온도 · 풍속 · 습도) */}
          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate mt-1.5 pl-1">
            {t("feelsLike")} {weather.apparentTemp}° · {t("weatherWind")} {weather.windSpeed}m/s · {t("humidity") || "습도"} {weather.humidity}%
          </div>
        </div>
      )}

      {/* ── 3. 시간별 / 5일간 세그먼트 스위처 (온도 밑 배치) ── */}
      <div className="flex items-center justify-center bg-slate-100/90 dark:bg-slate-800/90 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 mb-2.5">
        <button
          type="button"
          onClick={() => setViewTab("hourly")}
          className={`flex-1 py-1 text-center text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
            viewTab === "hourly"
              ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-2xs font-extrabold border border-slate-200/60 dark:border-slate-700/60"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          {t("weatherHourlyTab")}
        </button>
        <button
          type="button"
          onClick={() => setViewTab("daily")}
          className={`flex-1 py-1 text-center text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
            viewTab === "daily"
              ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-2xs font-extrabold border border-slate-200/60 dark:border-slate-700/60"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          {t("weather5DayTab")}
        </button>
      </div>

      {/* ── 4. 본문 예보 영역 (5개 미니 카드) ── */}
      {weather && (
        <>
          {viewTab === "hourly" ? (
            /* 시간별 예보 (5개 시간대 카드) */
            <div className="grid grid-cols-5 gap-1.5 text-center">
              {weather.hourly.map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center justify-between p-1.5 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/60 dark:border-white/5 shadow-2xs hover:scale-102 transition-all min-h-[68px]"
                >
                  <span className="text-[9.5px] font-semibold text-slate-400 dark:text-slate-500 whitespace-nowrap">
                    {item.time}
                  </span>
                  <div className="my-0.5 flex items-center justify-center">
                    <WeatherIcon icon={item.icon} size={17} />
                  </div>
                  <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-100 tabular-nums">
                    {item.temp}°
                  </span>
                </div>
              ))}
            </div>
          ) : (
            /* 일별 예보 (5일간 카드) */
            <div className="grid grid-cols-5 gap-1.5 text-center">
              {weather.daily.map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center justify-between p-1.5 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/60 dark:border-white/5 shadow-2xs hover:scale-102 transition-all min-h-[68px]"
                >
                  <span className={`text-[9.5px] font-bold whitespace-nowrap ${idx === 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-500 dark:text-slate-400"}`}>
                    {item.day}
                  </span>
                  <div className="my-0.5 flex items-center justify-center">
                    <WeatherIcon icon={item.icon} size={17} />
                  </div>
                  <div className="flex flex-col text-[10px] font-extrabold leading-tight">
                    <span className="text-slate-800 dark:text-slate-100 tabular-nums">
                      {item.maxTemp}°
                    </span>
                    <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500 tabular-nums">
                      {item.minTemp}°
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
