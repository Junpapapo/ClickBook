/**
 * config.ts
 * 다국어(i18n) 중앙 설정 및 레지스트리
 * 새로운 언어 지원 추가 시 이 파일에 정의를 추가하면 전체 앱 UI와 감지 로직에 자동 반영됩니다.
 */

export type Lang = "en" | "ja" | "ko" | "zh-TW" | "de" | "es";

export interface LanguageMeta {
  code: Lang;
  label: string;          // 전체 표시 라벨 (예: "한국어", "English", "日本語", "繁體中文", "Deutsch", "Español")
  nativeName: string;     // 모국어 표기
  shortLabel: string;     // 좁은 영역(버튼 등)용 축약 라벨 (예: "한국어", "EN", "日本語", "繁中", "DE", "ES")
  flag: string;           // 국기 이모지 (예: "🇰🇷", "🇺🇸", "🇯🇵", "🇹🇼", "🇩🇪", "🇪🇸")
  prefixMatch: string[];  // 브라우저 navigator.language 매칭 접두사 (소문자)
  defaultHolidayCountry?: string; // 캘린더 공휴일 기본 연동 국가 코드 (ISO 3166-1 alpha-2)
}

export const SUPPORTED_LANGUAGES: readonly LanguageMeta[] = [
  {
    code: "ko",
    label: "한국어",
    nativeName: "한국어",
    shortLabel: "한국어",
    flag: "🇰🇷",
    prefixMatch: ["ko", "ko-kr"],
    defaultHolidayCountry: "KR",
  },
  {
    code: "en",
    label: "English",
    nativeName: "English",
    shortLabel: "EN",
    flag: "🇺🇸",
    prefixMatch: ["en", "en-us", "en-gb"],
    defaultHolidayCountry: "US",
  },
  {
    code: "ja",
    label: "日本語",
    nativeName: "日本語",
    shortLabel: "日本語",
    flag: "🇯🇵",
    prefixMatch: ["ja", "ja-jp"],
    defaultHolidayCountry: "JP",
  },
  {
    code: "zh-TW",
    label: "繁體中文",
    nativeName: "繁體中文",
    shortLabel: "繁中",
    flag: "🇹🇼",
    prefixMatch: ["zh-tw", "zh-hk", "zh-mo", "zh-hant"],
    defaultHolidayCountry: "TW",
  },
  {
    code: "de",
    label: "Deutsch",
    nativeName: "Deutsch",
    shortLabel: "DE",
    flag: "🇩🇪",
    prefixMatch: ["de", "de-de", "de-at", "de-ch", "de-li", "de-lu"],
    defaultHolidayCountry: "DE",
  },
  {
    code: "es",
    label: "Español",
    nativeName: "Español",
    shortLabel: "ES",
    flag: "🇪🇸",
    prefixMatch: ["es", "es-es", "es-419", "es-mx", "es-ar", "es-co", "es-cl", "es-pe"],
    defaultHolidayCountry: "ES",
  },
] as const;

export const DEFAULT_LANG: Lang = "en";

/**
 * 주어진 문자열이 지원되는 유효한 언어 코드인지 검사
 */
export function isValidLang(code: unknown): code is Lang {
  return typeof code === "string" && SUPPORTED_LANGUAGES.some((l) => l.code === code);
}

/**
 * 언어 코드로 메타데이터 조회
 */
export function getLanguageMeta(lang: Lang): LanguageMeta {
  return SUPPORTED_LANGUAGES.find((l) => l.code === lang) ?? SUPPORTED_LANGUAGES[1]; // fallback: en
}
