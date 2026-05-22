import { useState } from "react";
import { Settings, Search } from "lucide-react";
import type { CustomSearchConfig } from "@/shared/types";
import { useLang } from "@/shared/LanguageContext";
import CustomSearchSettingsModal from "./CustomSearchSettingsModal";

interface Props {
  configs: CustomSearchConfig[];
  onSaveConfigs: (configs: CustomSearchConfig[]) => void;
}

export default function CustomSearchArea({ configs, onSaveConfigs }: Props) {
  const { t } = useLang();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});

  const handleSearch = (config: CustomSearchConfig) => {
    const term = searchTerms[config.id] || "";
    if (!term.trim()) return;

    let url = config.urlTemplate;
    url = url.replace(/\{keyword\}/g, encodeURIComponent(term));
    
    if (url.startsWith("http://") || url.startsWith("https://")) {
      window.open(url, "_blank");
      // clear the search term after searching
      setSearchTerms({ ...searchTerms, [config.id]: "" });
    } else {
      console.warn("Blocked navigation: URL must start with http:// or https://");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, config: CustomSearchConfig) => {
    if (e.key === "Enter") {
      handleSearch(config);
    }
  };

  const getDomain = (urlTemplate: string) => {
    try {
      const url = new URL(urlTemplate.replace("{keyword}", "test"));
      return url.hostname;
    } catch {
      return null;
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
          <Search size={14} className="text-gray-400" />
          {t("customSearchTitle")}
        </h2>
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="p-1 rounded-md text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
          title={t("customSearchSettings")}
        >
          <Settings size={14} />
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        {configs.length === 0 ? (
          <div className="w-full text-center py-4 bg-gray-50 dark:bg-surface-800 rounded-xl border border-gray-200 dark:border-surface-700 border-dashed">
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-2">No custom searches configured</p>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="text-xs px-3 py-1.5 bg-white dark:bg-surface-700 hover:bg-gray-100 dark:hover:bg-surface-600 text-indigo-500 border border-gray-200 dark:border-surface-600 rounded-lg transition-colors shadow-sm"
            >
              Configure Searches
            </button>
          </div>
        ) : (
          configs.map((config) => {
            const domain = getDomain(config.urlTemplate);
            return (
              <div key={config.id} className="flex-1 min-w-[200px] max-w-[300px] flex items-center bg-white dark:bg-surface-800 border border-gray-200 dark:border-surface-600 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500 transition-all shadow-sm group">
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-surface-700 border-r border-gray-200 dark:border-surface-600 shrink-0">
                  {domain ? (
                    <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} alt="" className="w-4 h-4 rounded-sm" />
                  ) : (
                    <Search size={14} className="text-gray-400" />
                  )}
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300 truncate max-w-[80px]" title={config.name}>{config.name}</span>
                </div>
                <input
                  type="text"
                  placeholder={t("customSearchKeyword")}
                  className="flex-1 w-0 bg-transparent px-3 py-2 text-sm text-gray-800 dark:text-gray-100 outline-none"
                  value={searchTerms[config.id] || ""}
                  onChange={(e) => setSearchTerms({ ...searchTerms, [config.id]: e.target.value })}
                  onKeyDown={(e) => handleKeyDown(e, config)}
                />
                <button
                  onClick={() => handleSearch(config)}
                  className="px-3 py-2 text-gray-400 hover:text-indigo-500 group-focus-within:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                >
                  <Search size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>

      <CustomSearchSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        configs={configs}
        onSave={onSaveConfigs}
      />
    </div>
  );
}
