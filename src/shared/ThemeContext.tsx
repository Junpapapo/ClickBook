import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggle: () => {},
  setTheme: () => {},
});

const STORAGE_KEY = "clickbook_theme";

function readLocalTheme(): Theme {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === "light" || stored === "dark") return stored;
  }
  return "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readLocalTheme);

  const applyDomTheme = (t: Theme) => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      if (t === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  };

  const setTheme = (nextTheme: Theme) => {
    setThemeState(nextTheme);
    applyDomTheme(nextTheme);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, nextTheme);
    }
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ [STORAGE_KEY]: nextTheme }).catch(() => {});
    }
  };

  // 1. Initial DOM theme sync and chrome.storage verification
  useEffect(() => {
    applyDomTheme(theme);
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get([STORAGE_KEY], (res) => {
        if (res && (res[STORAGE_KEY] === "light" || res[STORAGE_KEY] === "dark")) {
          const stored = res[STORAGE_KEY] as Theme;
          if (stored !== theme) {
            setThemeState(stored);
            applyDomTheme(stored);
            localStorage.setItem(STORAGE_KEY, stored);
          }
        } else {
          // Sync current theme to chrome.storage.local if unset
          chrome.storage.local.set({ [STORAGE_KEY]: theme }).catch(() => {});
        }
      });
    }
  }, []);

  // 2. Real-time sync across extension popup, options, and newtab pages
  useEffect(() => {
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === "local" && changes[STORAGE_KEY]) {
        const next = changes[STORAGE_KEY].newValue as Theme;
        if (next === "light" || next === "dark") {
          setThemeState(next);
          applyDomTheme(next);
          if (typeof localStorage !== "undefined") {
            localStorage.setItem(STORAGE_KEY, next);
          }
        }
      }
    };

    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener(handleStorageChange);
      return () => {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      };
    }
  }, []);

  function toggle() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
