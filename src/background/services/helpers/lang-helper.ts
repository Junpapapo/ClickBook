import { type Lang } from "@/shared/i18n";

export async function getEffectiveLanguage(): Promise<Lang> {
  try {
    const { clickbook_lang } = await chrome.storage.local.get("clickbook_lang");
    if (clickbook_lang === "en" || clickbook_lang === "ja" || clickbook_lang === "ko") {
      return clickbook_lang as Lang;
    }
  } catch (e) {
    console.error("Error fetching clickbook_lang from storage:", e);
  }

  try {
    const uiLang = chrome.i18n.getUILanguage().toLowerCase();
    if (uiLang.startsWith("ko")) return "ko";
    if (uiLang.startsWith("ja")) return "ja";
  } catch (e) {
    console.error("Error getting UI language:", e);
  }

  return "en";
}
