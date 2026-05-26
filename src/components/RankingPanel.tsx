import { useState } from "react";
import { Trophy, ExternalLink, Clock, BookOpen } from "lucide-react";
import type { Bookmark } from "@/shared/types";
import { useLang } from "@/shared/LanguageContext";
import type { TFunction } from "@/shared/i18n";

interface Props {
  bookmarks: Bookmark[];
  onClose: () => void;
}

const MEDALS: Record<number, string> = { 0: "🥇", 1: "🥈", 2: "🥉" };

function formatRelativeTime(timestamp: number, t: TFunction): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (minutes < 1) return t("timeJustNow");
  if (minutes < 60) return t("timeMinAgo", { n: minutes });
  if (hours < 24) return t("timeHourAgo", { n: hours });
  if (days < 30) return t("timeDayAgo", { n: days });
  return new Date(timestamp).toLocaleDateString(t("timeLocale"));
}

export default function RankingPanel({ bookmarks, onClose }: Props) {
  const { t } = useLang();
  const [activeTab, setActiveTab] = useState<"top" | "recent" | "reads">("top");

  // Top Sites: Top 20 bookmarks sorted by visitCount desc
  const topSites = [...bookmarks]
    .sort((a, b) => b.visitCount - a.visitCount)
    .slice(0, 20);

  // Recently Added: Top 20 bookmarks sorted by savedAt desc
  const recentlyAdded = [...bookmarks]
    .sort((a, b) => b.savedAt - a.savedAt)
    .slice(0, 20);

  // Recent Reads: Top 20 bookmarks sorted by lastVisitedAt desc (falling back to savedAt if lastVisitedAt is missing)
  const recentReads = [...bookmarks]
    .filter((b) => (b.lastVisitedAt !== undefined && b.lastVisitedAt > 0) || b.visitCount > 0)
    .sort((a, b) => {
      const aTime = a.lastVisitedAt || a.savedAt || 0;
      const bTime = b.lastVisitedAt || b.savedAt || 0;
      return bTime - aTime;
    })
    .slice(0, 20);

  const activeList = activeTab === "top" ? topSites : activeTab === "recent" ? recentlyAdded : recentReads;

  const getEmptyMessage = () => {
    switch (activeTab) {
      case "top":
        return t("rankingEmpty");
      case "recent":
        return t("recentEmpty");
      case "reads":
        return t("recentReadsEmpty");
    }
  };

  const getTabIcon = () => {
    switch (activeTab) {
      case "top":
        return <Trophy size={28} className="mb-2 opacity-30 text-amber-500" />;
      case "recent":
        return <Clock size={28} className="mb-2 opacity-30 text-blue-500" />;
      case "reads":
        return <BookOpen size={28} className="mb-2 opacity-30 text-emerald-500" />;
    }
  };

  return (
    <div className="w-72 h-full flex flex-col bg-white dark:bg-surface-900 border-l border-gray-200 dark:border-surface-700">
      {/* ヘッダー（タイトルクリックで閉じる） */}
      <button
        onClick={onClose}
        className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-surface-700 shrink-0 w-full text-left group hover:bg-gray-50 dark:hover:bg-surface-800 transition-colors"
        title={t("rankingClose")}
      >
        <Trophy size={14} className="text-amber-400 animate-pulse" />
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 flex-1">{t("rankingPanelLabel")}</span>
        <span className="text-[10px] text-gray-400 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
          {t("closeBtn")}
        </span>
      </button>

      {/* 탭 헤더 */}
      <div className="flex border-b border-gray-150 dark:border-surface-700 bg-gray-50/50 dark:bg-surface-850/50 shrink-0 p-1 gap-1">
        <button
          onClick={() => setActiveTab("top")}
          className={`flex-1 flex flex-col items-center gap-0.5 py-1 px-1 rounded-lg text-[9px] font-semibold transition-all text-center leading-tight tracking-tight ${
            activeTab === "top"
              ? "bg-white dark:bg-surface-700 text-indigo-600 dark:text-indigo-300 shadow-sm border border-gray-200/50 dark:border-surface-600/50"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-surface-800/50"
          }`}
        >
          <Trophy size={11} className={activeTab === "top" ? "text-amber-500" : ""} />
          <span>{t("rankingTitle")}</span>
        </button>
        <button
          onClick={() => setActiveTab("recent")}
          className={`flex-1 flex flex-col items-center gap-0.5 py-1 px-1 rounded-lg text-[9px] font-semibold transition-all text-center leading-tight tracking-tight ${
            activeTab === "recent"
              ? "bg-white dark:bg-surface-700 text-indigo-600 dark:text-indigo-300 shadow-sm border border-gray-200/50 dark:border-surface-600/50"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-surface-800/50"
          }`}
        >
          <Clock size={11} className={activeTab === "recent" ? "text-blue-500" : ""} />
          <span>{t("recentTitle")}</span>
        </button>
        <button
          onClick={() => setActiveTab("reads")}
          className={`flex-1 flex flex-col items-center gap-0.5 py-1 px-1 rounded-lg text-[9px] font-semibold transition-all text-center leading-tight tracking-tight ${
            activeTab === "reads"
              ? "bg-white dark:bg-surface-700 text-indigo-600 dark:text-indigo-300 shadow-sm border border-gray-200/50 dark:border-surface-600/50"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-surface-800/50"
          }`}
        >
          <BookOpen size={11} className={activeTab === "reads" ? "text-emerald-500" : ""} />
          <span>{t("recentReadsTitle")}</span>
        </button>
      </div>

      {/* 리스트 */}
      <div className="flex-1 overflow-y-auto py-2">
        {activeList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center text-gray-400 dark:text-gray-600">
            {getTabIcon()}
            <p className="text-xs max-w-[200px] leading-relaxed">{getEmptyMessage()}</p>
          </div>
        ) : (
          <ol className="flex flex-col">
            {activeList.map((b, i) => (
              <li key={b.id}>
                <a
                  href={b.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => chrome.runtime.sendMessage({ type: "INCREMENT_VISIT", id: b.id })}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-surface-800 transition-colors group"
                >
                  <span className="w-6 text-center shrink-0">
                    {MEDALS[i] ?? (
                      <span className="text-xs font-bold text-gray-400 dark:text-gray-600">{i + 1}</span>
                    )}
                  </span>
                  <img
                    src={b.favicon}
                    alt=""
                    width={14}
                    height={14}
                    className="rounded-sm shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                      {b.title}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-600 truncate">{b.domain}</p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-0.5">
                    {activeTab === "top" ? (
                      <>
                        <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">{b.visitCount}</span>
                        <span className="text-[9px] text-gray-400 dark:text-gray-600">{t("rankingVisits", { n: b.visitCount })}</span>
                      </>
                    ) : activeTab === "recent" ? (
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 text-right">
                        {formatRelativeTime(b.savedAt, t)}
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 text-right">
                        {formatRelativeTime(b.lastVisitedAt || b.savedAt, t)}
                      </span>
                    )}
                  </div>
                  <ExternalLink size={10} className="shrink-0 text-gray-300 dark:text-gray-700 group-hover:text-indigo-400 transition-colors" />
                </a>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* フッター */}
      <div className="px-4 py-2 border-t border-gray-200 dark:border-surface-700 shrink-0">
        <p className="text-[10px] text-gray-400 dark:text-gray-600 text-center">
          {t("rankingFooter")}
        </p>
      </div>
    </div>
  );
}
