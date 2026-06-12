import { en } from "./en";
import { ja } from "./ja";
import { ko } from "./ko";

export type Lang = "en" | "ja" | "ko";

export const DICT: Record<Lang, typeof en> = { en, ja, ko };

// ── Browser language detection ────────────────────────────
export function detectBrowserLang(): Lang {
  const nav = navigator.language ?? navigator.languages?.[0] ?? "en";
  const base = nav.split("-")[0].toLowerCase();
  if (base === "ja") return "ja";
  if (base === "ko") return "ko";
  return "en";
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
