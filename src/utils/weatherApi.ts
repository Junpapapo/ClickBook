import type { WeatherConfig } from "@/shared/types";

export interface HourlyForecastItem {
  time: string;       // "2 PM", "14:00"
  temp: number;
  weatherCode: number;
  condition: string;
  icon: "sun" | "cloud-sun" | "cloud" | "rain" | "snow" | "thunder";
}

export interface DailyForecastItem {
  day: string;        // "오늘", "내일", "목", "금"
  dateStr: string;    // "2026-08-18"
  maxTemp: number;
  minTemp: number;
  weatherCode: number;
  condition: string;
  icon: "sun" | "cloud-sun" | "cloud" | "rain" | "snow" | "thunder";
}

export interface WeatherResult {
  city: string;
  temp: number;
  apparentTemp: number;
  condition: string;
  weatherCode: number;
  icon: "sun" | "cloud-sun" | "cloud" | "rain" | "snow" | "thunder";
  humidity: number;
  windSpeed: number;
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
  lastUpdated: number;
  expiryMinutes?: number;
}

// WMO 날씨 코드 해석 및 아이콘/번역 매핑
export function getWeatherInfo(code: number, lang: string = "ko"): { condition: string; icon: "sun" | "cloud-sun" | "cloud" | "rain" | "snow" | "thunder" } {
  const getCond = (ko: string, ja: string, zh: string, de: string, es: string, fr: string, en: string) => {
    switch (lang) {
      case "ko": return ko;
      case "ja": return ja;
      case "zh-TW": return zh;
      case "de": return de;
      case "es": return es;
      case "fr": return fr;
      default: return en;
    }
  };

  if (code === 0) {
    return {
      condition: getCond("맑음", "快晴", "晴朗", "Klar", "Despejado", "Ciel dégagé", "Clear Sky"),
      icon: "sun",
    };
  }
  if (code === 1 || code === 2) {
    return {
      condition: getCond("구름 조금", "晴れ時々曇り", "多雲時晴", "Teils bewölkt", "Parcialmente nublado", "Partiellement nuageux", "Partly Cloudy"),
      icon: "cloud-sun",
    };
  }
  if (code === 3) {
    return {
      condition: getCond("흐림", "曇り", "陰天", "Bedeckt", "Nublado", "Couvert", "Overcast"),
      icon: "cloud",
    };
  }
  if (code === 45 || code === 48) {
    return {
      condition: getCond("안개", "霧", "有霧", "Nebel", "Niebla", "Brouillard", "Foggy"),
      icon: "cloud",
    };
  }
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return {
      condition: getCond("비", "雨", "下雨", "Regen", "Lluvia", "Pluie", "Rain"),
      icon: "rain",
    };
  }
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
    return {
      condition: getCond("눈", "雪", "下雪", "Schnee", "Nieve", "Neige", "Snow"),
      icon: "snow",
    };
  }
  if (code >= 95) {
    return {
      condition: getCond("뇌우", "雷雨", "雷陣雨", "Gewitter", "Tormenta", "Orage", "Thunderstorm"),
      icon: "thunder",
    };
  }
  return {
    condition: getCond("맑음", "晴れ", "晴", "Klar", "Despejado", "Clair", "Clear"),
    icon: "sun",
  };
}

export const WEATHER_CACHE_KEY = "clickbook_weather_cache_v2";

/**
 * 로컬 스토리지에 캐시된 날씨 데이터를 동기적으로 조회합니다.
 */
export function getCachedWeather(
  config?: WeatherConfig,
  lang: string = "ko"
): { data: WeatherResult; isFresh: boolean } | null {
  try {
    const cachedStr = localStorage.getItem(WEATHER_CACHE_KEY);
    if (!cachedStr) return null;
    const cached: WeatherResult & { cacheKey?: string; expiryMinutes?: number } = JSON.parse(cachedStr);

    const lat = config?.lat ?? 37.5665;
    const lon = config?.lon ?? 126.9780;
    const isFahrenheit = config?.unit === "fahrenheit";
    const cacheExpiryMinutes = config?.cacheExpiry ?? cached.expiryMinutes ?? 60;
    const cacheKey = `${lat.toFixed(3)}_${lon.toFixed(3)}_${isFahrenheit ? "F" : "C"}_${lang}`;

    const isFresh = Date.now() - (cached.lastUpdated || 0) < cacheExpiryMinutes * 60 * 1000;
    const isMatchingKey = !cached.cacheKey || cached.cacheKey === cacheKey;

    if (config?.displayName) {
      cached.city = config.displayName;
    }

    if (isMatchingKey) {
      return { data: cached, isFresh };
    }
    return { data: cached, isFresh: false };
  } catch {
    return null;
  }
}

export async function fetchLiveWeather(
  config?: WeatherConfig,
  lang: string = "ko",
  forceRefresh: boolean = false
): Promise<WeatherResult> {
  const lat = config?.lat ?? 37.5665;
  const lon = config?.lon ?? 126.9780;
  const isFahrenheit = config?.unit === "fahrenheit";
  const expiryMinutes = config?.cacheExpiry ?? 60; // 사용자가 설정한 캐시 만료 시간(분)

  // 1. 캐시가 유효하고 강제 새로고침이 아닌 경우 캐시 즉시 반환
  if (!forceRefresh) {
    const cachedInfo = getCachedWeather(config, lang);
    if (cachedInfo && cachedInfo.isFresh) {
      return cachedInfo.data;
    }
  }

  const tempUnitParam = isFahrenheit ? "&temperature_unit=fahrenheit" : "";
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto${tempUnitParam}`;

  let data: any;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Weather API error: ${res.statusText}`);
    }
    data = await res.json();
  } catch (fetchErr) {
    // 네트워크 실패 시 기존 캐시가 있으면 반환
    const fallback = getCachedWeather(config, lang);
    if (fallback?.data) {
      console.warn("[WeatherAPI] Fetch failed, fallback to stale cache:", fetchErr);
      return fallback.data;
    }
    throw fetchErr;
  }

  const current = data.current || {};
  const weatherCode = current.weather_code ?? 0;
  const currentInfo = getWeatherInfo(weatherCode, lang);

  // 기본 도시명 결정
  let defaultCity = config?.displayName?.trim() || "";
  if (!defaultCity) {
    try {
      const geoCity = await fetchCityName(lat, lon, lang);
      if (geoCity) {
        defaultCity = geoCity;
      }
    } catch {
      // fallback
    }
  }
  if (!defaultCity) {
    if (Math.abs(lat - 37.5665) < 0.1 && Math.abs(lon - 126.9780) < 0.1) {
      defaultCity = lang === "ko" ? "서울특별시" : lang === "ja" ? "ソウル" : lang === "zh-TW" ? "首爾" : "Seoul";
    } else {
      defaultCity = `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
    }
  }

  // 시간별 예보 가공 (현재 시간 이후 5개 시간대)
  const now = new Date();
  const currentHourIso = now.toISOString().slice(0, 13); // "YYYY-MM-DDTHH"
  const hourlyTimes: string[] = data.hourly?.time || [];
  const hourlyTemps: number[] = data.hourly?.temperature_2m || [];
  const hourlyCodes: number[] = data.hourly?.weather_code || [];

  let startIndex = hourlyTimes.findIndex((t) => t.startsWith(currentHourIso));
  if (startIndex === -1) startIndex = 0;

  const hourly: HourlyForecastItem[] = [];
  for (let i = startIndex; i < Math.min(startIndex + 5, hourlyTimes.length); i++) {
    const itemDate = new Date(hourlyTimes[i]);
    const rawHours = itemDate.getHours();
    let formattedTime: string;

    if (lang === "ko") {
      const ampm = rawHours >= 12 ? "오후" : "오전";
      const h12 = rawHours % 12 || 12;
      formattedTime = `${ampm} ${h12}시`;
    } else if (lang === "ja") {
      formattedTime = `${rawHours}:00`;
    } else if (lang === "zh-TW") {
      const ampm = rawHours >= 12 ? "下午" : "上午";
      const h12 = rawHours % 12 || 12;
      formattedTime = `${ampm} ${h12}點`;
    } else if (lang === "de") {
      formattedTime = `${rawHours}:00 Uhr`;
    } else if (lang === "fr") {
      formattedTime = `${rawHours}h`;
    } else if (lang === "es") {
      formattedTime = `${rawHours}:00`;
    } else {
      const ampm = rawHours >= 12 ? "PM" : "AM";
      const h12 = rawHours % 12 || 12;
      formattedTime = `${h12} ${ampm}`;
    }

    const code = hourlyCodes[i] ?? 0;
    const info = getWeatherInfo(code, lang);

    hourly.push({
      time: formattedTime,
      temp: Math.round(hourlyTemps[i]),
      weatherCode: code,
      condition: info.condition,
      icon: info.icon,
    });
  }

  // 일별 예보 가공 (향후 5일)
  const dailyTimes: string[] = data.daily?.time || [];
  const dailyMaxTemps: number[] = data.daily?.temperature_2m_max || [];
  const dailyMinTemps: number[] = data.daily?.temperature_2m_min || [];
  const dailyCodes: number[] = data.daily?.weather_code || [];

  const daily: DailyForecastItem[] = [];
  const dayNamesKo = ["일", "월", "화", "수", "목", "금", "토"];
  const dayNamesJa = ["日", "月", "火", "水", "木", "金", "土"];
  const dayNamesZh = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];
  const dayNamesDe = ["SO", "MO", "DI", "MI", "DO", "FR", "SA"];
  const dayNamesEs = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
  const dayNamesFr = ["DIM", "LUN", "MAR", "MER", "JEU", "VEN", "SAM"];
  const dayNamesEn = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  for (let i = 0; i < Math.min(5, dailyTimes.length); i++) {
    const dDate = new Date(dailyTimes[i] + "T00:00:00");
    const dayOfWeek = dDate.getDay();
    let dayLabel: string;

    if (i === 0) {
      dayLabel =
        lang === "ko" ? "오늘" :
        lang === "ja" ? "今日" :
        lang === "zh-TW" ? "今天" :
        lang === "de" ? "Heute" :
        lang === "es" ? "Hoy" :
        lang === "fr" ? "Auj." :
        "Today";
    } else if (i === 1) {
      dayLabel =
        lang === "ko" ? "내일" :
        lang === "ja" ? "明日" :
        lang === "zh-TW" ? "明天" :
        lang === "de" ? "Morgen" :
        lang === "es" ? "Mañana" :
        lang === "fr" ? "Demain" :
        "Tom";
    } else {
      dayLabel =
        lang === "ko" ? dayNamesKo[dayOfWeek] :
        lang === "ja" ? dayNamesJa[dayOfWeek] :
        lang === "zh-TW" ? dayNamesZh[dayOfWeek] :
        lang === "de" ? dayNamesDe[dayOfWeek] :
        lang === "es" ? dayNamesEs[dayOfWeek] :
        lang === "fr" ? dayNamesFr[dayOfWeek] :
        dayNamesEn[dayOfWeek];
    }

    const code = dailyCodes[i] ?? 0;
    const info = getWeatherInfo(code, lang);

    daily.push({
      day: dayLabel,
      dateStr: dailyTimes[i],
      maxTemp: Math.round(dailyMaxTemps[i]),
      minTemp: Math.round(dailyMinTemps[i]),
      weatherCode: code,
      condition: info.condition,
      icon: info.icon,
    });
  }

  const result: WeatherResult & { cacheKey?: string } = {
    city: defaultCity,
    temp: Math.round(current.temperature_2m ?? 24),
    apparentTemp: Math.round(current.apparent_temperature ?? current.temperature_2m ?? 24),
    condition: currentInfo.condition,
    weatherCode,
    icon: currentInfo.icon,
    humidity: Math.round(current.relative_humidity_2m ?? 50),
    windSpeed: current.wind_speed_10m ?? 2.0,
    hourly,
    daily,
    lastUpdated: Date.now(),
    expiryMinutes,
    cacheKey: `${lat.toFixed(3)}_${lon.toFixed(3)}_${isFahrenheit ? "F" : "C"}_${lang}`,
  };

  // 만약 도시명이 기본 좌표 형식("lat, lon")인 경우, 비동기 역지오코딩으로 실제 지명 조회
  if (!config?.displayName && (!defaultCity || defaultCity.includes("°"))) {
    try {
      const realCity = await fetchCityName(lat, lon, lang);
      if (realCity) {
        result.city = realCity;
      }
    } catch {
      // ignore
    }
  }

  try {
    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(result));
  } catch {
    // ignore
  }

  return result;
}

// 무료 역지오코딩(Reverse Geocoding): 좌표 -> 실제 도시명 변환
export async function fetchCityName(lat: number, lon: number, lang: string = "ko"): Promise<string> {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=${lang}`;
    const res = await fetch(url);
    if (!res.ok) return "";
    const data = await res.json();

    // 한국어일 경우 시/군/구 우선 조합
    if (lang === "ko") {
      const city = data.city || data.locality || "";
      const subdivision = data.principalSubdivision || "";
      if (city && subdivision && !city.includes(subdivision)) {
        return `${subdivision} ${city}`.trim();
      }
      return city || subdivision || data.countryName || "";
    }

    return data.city || data.locality || data.principalSubdivision || data.countryName || "";
  } catch {
    return "";
  }
}

// 브라우저 위치 가져오기 (백그라운드 서비스 워커 & Geolocation 연동)
export async function getCurrentCoordinates(lang: string = "ko"): Promise<{ lat: number; lon: number; city?: string }> {
  // 1. 백그라운드 서비스 워커를 통한 IP/네트워크 지오로케이션 (CORS/확장프로그램 보안 제한 없음)
  try {
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
      const bgRes = await new Promise<{ success: boolean; data?: { lat: number; lon: number; city?: string } }>((resolve) => {
        chrome.runtime.sendMessage({ type: "GET_CURRENT_LOCATION", lang }, (res) => {
          resolve(res || { success: false });
        });
      });
      if (bgRes && bgRes.success && bgRes.data && bgRes.data.lat && bgRes.data.lon) {
        return bgRes.data;
      }
    }
  } catch (err) {
    console.warn("[WeatherAPI] Background location detection failed, trying navigator.geolocation...", err);
  }

  // 2. 브라우저 내장 Geolocation 시도
  try {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      const coords = await new Promise<{ lat: number; lon: number }>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({
              lat: Number(pos.coords.latitude.toFixed(4)),
              lon: Number(pos.coords.longitude.toFixed(4)),
            });
          },
          (err) => reject(err),
          { timeout: 4000, enableHighAccuracy: false, maximumAge: 300000 }
        );
      });
      const city = await fetchCityName(coords.lat, coords.lon, lang);
      return { ...coords, city };
    }
  } catch (err) {
    console.warn("[WeatherAPI] Geolocation failed:", err);
  }

  // 3. Fallback: 기본 서울 좌표
  return {
    lat: 37.5665,
    lon: 126.9780,
    city: lang === "ko" ? "서울특별시" : "Seoul",
  };
}
