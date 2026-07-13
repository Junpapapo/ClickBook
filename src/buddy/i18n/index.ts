import { en } from "./en";
import { ko } from "./ko";
import { ja } from "./ja";
import type { BuddyLang } from "../buddy-types";

let currentLang: BuddyLang = "en";

// 브라우저 언어 기반 초기 언어 결정 및 chrome.storage 연동
export function initLang(): void {
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith("ko")) {
    currentLang = "ko";
  } else if (browserLang.startsWith("ja")) {
    currentLang = "ja";
  } else {
    currentLang = "en";
  }

  // 비동기 스토리지 언어값 로드 및 반영
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get("clickbook_lang", (result) => {
      if (result && result.clickbook_lang) {
        const storedLang = result.clickbook_lang;
        if (storedLang === "en" || storedLang === "ko" || storedLang === "ja") {
          if (currentLang !== storedLang) {
            currentLang = storedLang;
            window.dispatchEvent(new CustomEvent("buddy-lang-changed", { detail: storedLang }));
          }
        }
      }
    });
  }
}

// 스토리지 변경 사항 실시간 감시 (팝업 설정 변경 즉시 반영)
if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes.clickbook_lang) {
      const nextLang = changes.clickbook_lang.newValue;
      if (nextLang === "en" || nextLang === "ko" || nextLang === "ja") {
        if (currentLang !== nextLang) {
          currentLang = nextLang;
          window.dispatchEvent(new CustomEvent("buddy-lang-changed", { detail: nextLang }));
        }
      }
    }
  });
}

export function getLang(): BuddyLang {
  return currentLang;
}

export function setLang(lang: BuddyLang): void {
  currentLang = lang;
}

const dictionaries = { en, ko, ja };

// 다국어 문자열 반환 함수
export function t(key: keyof typeof ko): string {
  const dict = dictionaries[currentLang] || en;
  return dict[key] || en[key] || String(key);
}

// 특정 지정된 언어로 번역을 강제 조회하는 함수
export function tForLang(key: keyof typeof ko, langCode: string): string {
  let lang: BuddyLang = "en";
  const cleanCode = String(langCode || "").toLowerCase();
  if (cleanCode.startsWith("ko")) {
    lang = "ko";
  } else if (cleanCode.startsWith("ja")) {
    lang = "ja";
  }
  const dict = dictionaries[lang] || en;
  return dict[key] || en[key] || String(key);
}
