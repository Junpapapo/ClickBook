import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { useLang } from "@/shared/LanguageContext";
import { SUPPORTED_LANGUAGES, getLanguageMeta, type Lang } from "@/shared/i18n";

interface LanguageSelectorProps {
  className?: string;
}

export function LanguageSelector({ className = "" }: LanguageSelectorProps) {
  const { lang, setLang } = useLang();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentMeta = getLanguageMeta(lang);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (code: Lang) => {
    setLang(code);
    setIsOpen(false);
  };

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      {/* Selector Trigger Button (단 32px의 슬림한 높이) */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full h-8 px-2.5 flex items-center justify-between gap-2 rounded-lg text-xs font-medium transition-all duration-150 border ${
          isOpen
            ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-indigo-500/80 shadow-xs ring-2 ring-indigo-500/20"
            : "bg-slate-100/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 hover:border-slate-300 dark:hover:border-slate-600"
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm leading-none shrink-0" role="img" aria-label={currentMeta.label}>
            {currentMeta.flag || "🌐"}
          </span>
          <span className="truncate font-medium text-slate-800 dark:text-slate-100">
            {currentMeta.nativeName}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={`text-slate-400 dark:text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 text-indigo-600 dark:text-indigo-400" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu Options */}
      {isOpen && (
        <div
          className="absolute left-0 right-0 top-full mt-1 z-60 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-figma-lg p-1 max-h-56 overflow-y-auto custom-scrollbar backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
          role="listbox"
        >
          {SUPPORTED_LANGUAGES.map((item) => {
            const isSelected = lang === item.code;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => handleSelect(item.code)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors duration-150 text-left ${
                  isSelected
                    ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
                role="option"
                aria-selected={isSelected}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm leading-none shrink-0" role="img" aria-label={item.label}>
                    {item.flag || "🌐"}
                  </span>
                  <span className="truncate">{item.nativeName}</span>
                </div>
                {isSelected && (
                  <Check size={13} className="text-indigo-600 dark:text-indigo-400 shrink-0 ml-2" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default LanguageSelector;
