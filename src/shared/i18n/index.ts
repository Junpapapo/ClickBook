import { en } from "./en";
import { ja } from "./ja";
import { ko } from "./ko";
import { zhTW } from "./zh-TW";
import { de } from "./de";
import { es } from "./es";
import { fr } from "./fr";
import {
  type Lang,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANG,
} from "./config";

export * from "./config";
export * from "./ai-prompts";

export const DICT: Record<Lang, typeof en> = { en, ja, ko, "zh-TW": zhTW, de, es, fr };

// ── Browser language detection ────────────────────────────
export function detectBrowserLang(): Lang {
  const nav = (navigator.language ?? navigator.languages?.[0] ?? "en").toLowerCase();
  for (const meta of SUPPORTED_LANGUAGES) {
    if (meta.prefixMatch.some((prefix) => nav === prefix || nav.startsWith(`${prefix}-`))) {
      return meta.code;
    }
  }
  return DEFAULT_LANG;
}

// ── Translation function factory ──────────────────────────
export function createT(lang: Lang) {
  const dict = DICT[lang] ?? DICT.en;
  return function t(
    key: keyof typeof en,
    vars?: Record<string, string | number>
  ): string {
    let str: string = dict[key] ?? DICT.en[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      }
    }
    return str;
  };
}

export type TFunction = ReturnType<typeof createT>;

