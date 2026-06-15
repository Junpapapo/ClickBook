import React from "react";
import { ChevronRight, ChevronDown, Trophy, Book, Sparkles, Newspaper } from "lucide-react";
import type { PageId } from "@/shared/types";

interface TrendingPanelProps {
  isCollapsed: boolean;
  isTrendingCollapsed: boolean;
  onToggleCollapse: () => void;
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  showGitHubRankingMenu: boolean;
  showWikiRankingMenu: boolean;
  showHFRankingMenu: boolean;
  showHNRankingMenu: boolean;
  t: (key: string, params?: any) => string;
}

export default function TrendingPanel({
  isCollapsed,
  isTrendingCollapsed,
  onToggleCollapse,
  activePage,
  onNavigate,
  showGitHubRankingMenu,
  showWikiRankingMenu,
  showHFRankingMenu,
  showHNRankingMenu,
  t,
}: TrendingPanelProps) {
  if (isCollapsed) {
    return (
      <div className="pt-4 border-t border-gray-200/50 dark:border-surface-700/50 flex flex-col items-center gap-2 w-full pb-4">
        {showGitHubRankingMenu && (
          <button
            onClick={() => onNavigate("github")}
            className={`relative group flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-150 cursor-pointer
              ${
                activePage === "github"
                  ? "bg-blue-50/15 text-blue-700 dark:text-blue-300 font-semibold"
                  : "text-gray-600 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              }`}
            title={t("githubRanking")}
          >
            <Trophy size={15} className="shrink-0" />
          </button>
        )}
        {showWikiRankingMenu && (
          <button
            onClick={() => onNavigate("wiki")}
            className={`relative group flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-150 cursor-pointer
              ${
                activePage === "wiki"
                  ? "bg-blue-50/15 text-blue-600 dark:text-blue-300 font-semibold"
                  : "text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10"
              }`}
            title={t("wikiRanking")}
          >
            <Book size={15} className="shrink-0" />
          </button>
        )}
        {showHFRankingMenu && (
          <button
            onClick={() => onNavigate("hf")}
            className={`relative group flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-150 cursor-pointer
              ${
                activePage === "hf"
                  ? "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 font-semibold"
                  : "text-gray-600 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/10"
              }`}
            title={t("hfRanking")}
          >
            <Sparkles size={15} className="shrink-0" />
          </button>
        )}
        {showHNRankingMenu && (
          <button
            onClick={() => onNavigate("hn")}
            className={`relative group flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-150 cursor-pointer
              ${
                activePage === "hn"
                  ? "bg-orange-500/15 text-orange-700 dark:text-orange-300 font-semibold"
                  : "text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/10"
              }`}
            title={t("hnRanking")}
          >
            <Newspaper size={15} className="shrink-0" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="pt-2 border-t border-gray-200/50 dark:border-surface-700/50">
      <div
        onClick={onToggleCollapse}
        className="px-3 pb-1.5 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-surface-800/30 select-none text-[10px] uppercase tracking-[0.15em] text-gray-400 dark:text-gray-600 font-semibold"
      >
        <span>Trending</span>
        {isTrendingCollapsed ? (
          <ChevronRight size={10} className="text-gray-400 dark:text-gray-600" />
        ) : (
          <ChevronDown size={10} className="text-gray-400 dark:text-gray-600" />
        )}
      </div>

      {!isTrendingCollapsed && (
        <div className="space-y-0.5 px-1.5 pb-4 mt-1">
          {showGitHubRankingMenu && (
            <button
              onClick={() => onNavigate("github")}
              className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg transition-all duration-150 cursor-pointer
                ${
                  activePage === "github"
                    ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 font-semibold"
                    : "text-gray-600 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                }`}
            >
              <Trophy size={15} className="shrink-0" />
              {t("githubRanking")}
            </button>
          )}
          {showWikiRankingMenu && (
            <button
              onClick={() => onNavigate("wiki")}
              className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg transition-all duration-150 cursor-pointer
                ${
                  activePage === "wiki"
                    ? "bg-blue-500/15 text-blue-600 dark:text-blue-300 font-semibold"
                    : "text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10"
                }`}
            >
              <Book size={15} className="shrink-0" />
              {t("wikiRanking")}
            </button>
          )}
          {showHFRankingMenu && (
            <button
              onClick={() => onNavigate("hf")}
              className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg transition-all duration-150 cursor-pointer
                ${
                  activePage === "hf"
                    ? "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 font-semibold"
                    : "text-gray-600 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/10"
                }`}
            >
              <Sparkles size={15} className="shrink-0" />
              {t("hfRanking")}
            </button>
          )}
          {showHNRankingMenu && (
            <button
              onClick={() => onNavigate("hn")}
              className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg transition-all duration-150 cursor-pointer
                ${
                  activePage === "hn"
                    ? "bg-orange-500/15 text-orange-700 dark:text-orange-300 font-semibold"
                    : "text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/10"
                }`}
            >
              <Newspaper size={15} className="shrink-0" />
              {t("hnRanking")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
