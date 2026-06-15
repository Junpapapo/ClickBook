import React from "react";
import { Sparkles as SparklesIcon, ChevronUp as ChevronUpIcon, ChevronDown as ChevronDownIcon, Search as SearchIcon, X as XIcon, Tag as TagIcon } from "lucide-react";

interface TagCloudViewProps {
  filteredTagsList: { name: string; count: number }[];
  selectedTags: string[];
  tagSearch: string;
  setTagSearch: (val: string) => void;
  tagCloudOpen: boolean;
  setTagCloudOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleTagClick: (tag: string) => void;
  handleSelectAllTags: () => void;
  handleDeselectAllTags: () => void;
  getTagColor: (tag: string) => any;
  t: (key: string, params?: any) => string;
}

export default function TagCloudView({
  filteredTagsList,
  selectedTags,
  tagSearch,
  setTagSearch,
  tagCloudOpen,
  setTagCloudOpen,
  handleTagClick,
  handleSelectAllTags,
  handleDeselectAllTags,
  getTagColor,
  t,
}: TagCloudViewProps) {
  return (
    <div
      className={`bg-white dark:bg-surface-900/60 backdrop-blur border border-gray-200/50 dark:border-white/[0.05] rounded-3xl shadow-sm mb-6 shrink-0 relative overflow-hidden flex flex-col transition-all duration-300 ${
        tagCloudOpen ? "p-5 max-h-[360px]" : "p-4"
      }`}
    >
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0 cursor-pointer select-none"
        onClick={() => setTagCloudOpen((prev) => !prev)}
      >
        <h2 className="text-[14px] font-bold text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-1.5">
          <SparklesIcon size={15} className="text-yellow-500" />
          {t("tagCloudTitle") || "AI Tag Cloud"}
          <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 ml-1">
            ({filteredTagsList.length})
          </span>
          {tagCloudOpen ? (
            <ChevronUpIcon size={14} className="text-gray-400 dark:text-gray-500 ml-0.5" />
          ) : (
            <ChevronDownIcon size={14} className="text-gray-400 dark:text-gray-500 ml-0.5" />
          )}
        </h2>

        {/* Tag Search and Controls - only when open */}
        {tagCloudOpen && (
          <div className="flex items-center gap-2 w-full sm:w-auto" onClick={(e) => e.stopPropagation()}>
            <div className="relative flex-1 sm:w-[220px]">
              <SearchIcon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                className="w-full bg-gray-100 dark:bg-surface-900 text-xs text-gray-800 dark:text-gray-100 pl-8 pr-3 py-2 rounded-xl outline-none border border-gray-200 dark:border-surface-800 focus:border-indigo-500 dark:focus:border-indigo-500 placeholder-gray-450 dark:placeholder-gray-500 transition-colors"
                placeholder={t("tagSearchPlaceholder") || "Filter tags..."}
              />
              {tagSearch && (
                <button
                  onClick={() => setTagSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XIcon size={12} />
                </button>
              )}
            </div>

            {/* Tag Selection Shortkeys */}
            <div className="flex gap-1">
              <button
                onClick={handleSelectAllTags}
                className="px-2.5 py-2 bg-gray-100 dark:bg-surface-900 hover:bg-gray-100 dark:hover:bg-surface-800 text-[11px] font-semibold text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-surface-800 rounded-xl transition-colors shrink-0"
              >
                {t("tagSelectAll") || "All"}
              </button>
              <button
                onClick={handleDeselectAllTags}
                className="px-2.5 py-2 bg-gray-100 dark:bg-surface-900 hover:bg-gray-100 dark:hover:bg-surface-800 text-[11px] font-semibold text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-surface-800 rounded-xl transition-colors shrink-0"
              >
                {t("tagDeselectAll") || "Clear"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cloud container - collapsible */}
      {tagCloudOpen && (
        <div className="flex-1 overflow-y-auto pr-1 mt-4 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-surface-800">
          {filteredTagsList.length === 0 ? (
            <div className="h-28 flex flex-col items-center justify-center text-center">
              <TagIcon size={24} className="text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500">
                {t("tagBoardEmpty") || "No tags found"}
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-x-4 gap-y-3 py-2 items-center justify-start">
              {filteredTagsList.map((tagObj) => {
                const isSelected = selectedTags.includes(tagObj.name);
                const colors = getTagColor(tagObj.name);

                const fontSize =
                  Math.min(1.4, Math.max(0.78, 0.78 + tagObj.count * 0.045)) + "rem";

                return (
                  <button
                    key={tagObj.name}
                    onClick={() => handleTagClick(tagObj.name)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-[11px] font-bold transition-all duration-300 active:scale-95 cursor-pointer shadow-sm hover:shadow-md relative
                      ${
                        isSelected
                          ? "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-surface-950 scale-105 z-10 font-extrabold shadow-md"
                          : "opacity-85 hover:opacity-100 hover:scale-103 z-0"
                      }
                    `}
                    style={{
                      fontSize,
                      backgroundColor: isSelected ? colors.activeBg : colors.bg,
                      borderColor: isSelected ? colors.activeBorder : colors.border,
                      color: isSelected ? colors.activeText : colors.text,
                    }}
                  >
                    <span>#{tagObj.name}</span>
                    <span
                      className={`inline-flex items-center justify-center text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-0.5
                        ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-black/5 dark:bg-white/10 text-gray-500 dark:text-gray-400"
                        }
                      `}
                    >
                      {tagObj.count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
