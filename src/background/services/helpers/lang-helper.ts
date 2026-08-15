import { type Lang, SUPPORTED_LANGUAGES, DEFAULT_LANG, isValidLang } from "@/shared/i18n";

export async function getEffectiveLanguage(): Promise<Lang> {
  try {
    const { clickbook_lang } = await chrome.storage.local.get("clickbook_lang");
    if (isValidLang(clickbook_lang)) {
      return clickbook_lang;
    }
  } catch (e) {
    console.error("Error fetching clickbook_lang from storage:", e);
  }

  try {
    const uiLang = chrome.i18n.getUILanguage().toLowerCase();
    for (const meta of SUPPORTED_LANGUAGES) {
      if (meta.prefixMatch.some((prefix) => uiLang === prefix || uiLang.startsWith(`${prefix}-`))) {
        return meta.code;
      }
    }
  } catch (e) {
    console.error("Error getting UI language:", e);
  }

  return DEFAULT_LANG;
}

