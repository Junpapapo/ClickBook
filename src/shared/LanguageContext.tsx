import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { type Lang, type TFunction, createT, detectBrowserLang } from "./i18n";

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: TFunction;
}

const STORAGE_KEY = "clickbook_lang";

function readLang(): Lang {
  const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
  if (stored === "en" || stored === "ja" || stored === "ko") return stored;
  return detectBrowserLang();
}

const LangContext = createContext<LangContextValue>({
  lang: "en",
  setLang: () => {},
  t: createT("en"),
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readLang);

  function setLang(l: Lang) {
    localStorage.setItem(STORAGE_KEY, l);
    chrome.storage.local.set({ [STORAGE_KEY]: l }).catch(() => {});
    setLangState(l);
  }

  // Initial sync to chrome.storage.local on mount
  useState(() => {
    chrome.storage.local.set({ [STORAGE_KEY]: readLang() }).catch(() => {});
  });

  return (
    <LangContext.Provider value={{ lang, setLang, t: createT(lang) }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
