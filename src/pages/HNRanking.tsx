import { useEffect, useState, useMemo } from "react";
import { fetchHNTopStories } from "@/shared/rankingApi";
import type { HNStory } from "@/shared/types";
import { Newspaper, MessageSquare, ArrowBigUp, ExternalLink, AlertCircle, BookmarkPlus, Check, Search, RefreshCw, ChevronUp, ChevronDown } from "lucide-react";
import { useLang } from "@/shared/LanguageContext";
import { useTheme } from "@/shared/ThemeContext";
import RankingSkeleton from "@/components/RankingSkeleton";
import { formatLastUpdated } from "@/shared/utils";
import WallpaperBackground from "@/components/dashboard/WallpaperBackground";

export default function HNRankingPage() {
  const { t } = useLang();
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const [stories, setStories] = useState<HNStory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [filterQuery, setFilterQuery] = useState("");
  const [dateFilter] = useState("week");
  const [lastUpdated, setLastUpdated] = useState<number>(0);
  const [sortKey, setSortKey] = useState<string>("rank");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleQuickSave = async (story: HNStory) => {
    try {
      await chrome.runtime.sendMessage({
        type: "ADD_BOOKMARK",
        url: story.url,
        title: story.title,
        folderId: "other",
      });
      setSavedIds(prev => new Set(prev).add(story.id));
      setTimeout(() => {
        setSavedIds(prev => {
          const next = new Set(prev);
          next.delete(story.id);
          return next;
        });
      }, 2000);
    } catch (err) {
      console.error("Failed to quick save:", err);
    }
  };

  const filtered = useMemo(() => {
    let result = stories
      .map((r, i) => ({ ...r, _originalRank: i + 1 } as HNStory & { _originalRank: number }))
      .filter(s => s.title.toLowerCase().includes(filterQuery.toLowerCase()) || s.url?.toLowerCase().includes(filterQuery.toLowerCase()));

    if (sortKey !== "rank") {
      result.sort((a, b) => {
        let valA = a[sortKey as keyof typeof a];
        let valB = b[sortKey as keyof typeof b];

        if (typeof valA === "string" && typeof valB === "string") {
          return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }

        valA = valA ?? 0;
        valB = valB ?? 0;

        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    } else {
      if (sortOrder === "desc") {
        result.reverse();
      }
    }
    return result;
  }, [stories, filterQuery, sortKey, sortOrder]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortKey !== columnKey) return <ChevronDown className="inline w-3 h-3 ml-1 opacity-20" />;
    return sortOrder === "asc" ? <ChevronUp className="inline w-3 h-3 ml-1 text-orange-500" /> : <ChevronDown className="inline w-3 h-3 ml-1 text-orange-500" />;
  };

  const loadData = async (force: boolean = false, filter = dateFilter) => {
    setLoading(true);
    setError("");
    try {
      const { items, lastUpdated } = await fetchHNTopStories(filter, force);
      setStories(items);
      setLastUpdated(lastUpdated);
    } catch (err) {
      setError(t("errorFetch"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(false, dateFilter);
  }, []);

  return (
    <WallpaperBackground isDarkMode={isDarkMode}>
      <div className="max-w-[1440px] w-full mx-auto pb-12 pt-2 sm:pt-4 px-2 sm:px-6 select-none space-y-4">
        {/* ── 타이틀 & 컨트롤 헤더 (박스 없이 시원하게 노출) ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold flex items-center gap-2.5 text-slate-800 dark:text-slate-100 tracking-tight">
              <Newspaper className="text-orange-500 shrink-0 w-6 h-6" />
              {t("hnRanking")}
              <button
                onClick={() => loadData(true)}
                disabled={loading}
                title="Refresh"
                className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50/80 dark:hover:bg-orange-950/40 rounded-full transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              </button>
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("rankingHnDesc")}
              </p>
              {lastUpdated > 0 && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xs border border-slate-200/50 dark:border-white/5 px-1.5 py-0.5 rounded-md">
                  Updated: {formatLastUpdated(lastUpdated)}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-end md:items-center gap-3">
            <div className="relative w-full md:w-64">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder={t("rankingHnFilterPlaceholder")}
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-slate-200/70 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 text-slate-800 dark:text-slate-100 shadow-figma-xs"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50/90 dark:bg-rose-950/40 backdrop-blur-md border border-rose-200 dark:border-rose-800/60 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 text-xs">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* ── 랭킹 테이블 글래스 카드 ── */}
        <div className="bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-white/10 shadow-figma-lg p-3 sm:p-4 overflow-hidden">
          {loading ? (
            <RankingSkeleton rows={15} cols={6} />
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="min-w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-white/10 text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider">
                    <th className="px-4 py-3 text-center w-20 whitespace-nowrap cursor-pointer text-orange-600 dark:text-orange-400 first:rounded-l-xl" onClick={() => handleSort("rank")}>
                      {t("thRank")} <SortIcon columnKey="rank" />
                    </th>
                    <th className="px-4 py-3 text-left whitespace-nowrap cursor-pointer text-slate-700 dark:text-slate-300" onClick={() => handleSort("title")}>
                      Title <SortIcon columnKey="title" />
                    </th>
                    <th className="px-4 py-3 text-right w-28 whitespace-nowrap cursor-pointer text-slate-700 dark:text-slate-300" onClick={() => handleSort("score")}>
                      Points <SortIcon columnKey="score" />
                    </th>
                    <th className="px-4 py-3 text-right w-32 whitespace-nowrap cursor-pointer text-slate-700 dark:text-slate-300" onClick={() => handleSort("descendants")}>
                      Comments <SortIcon columnKey="descendants" />
                    </th>
                    <th className="px-4 py-3 text-center w-32 whitespace-nowrap cursor-pointer text-slate-700 dark:text-slate-300" onClick={() => handleSort("by")}>
                      Author <SortIcon columnKey="by" />
                    </th>
                    <th className="px-4 py-3 text-center w-20">Link</th>
                    <th className="px-4 py-3 text-center w-20 last:rounded-r-xl">Save</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80 dark:divide-white/[0.04]">
                  {filtered.map((s, i) => {
                    const isSaved = savedIds.has(s.id);
                    const rankNum = s._originalRank ?? i + 1;
                    const getRankBadge = (rank: number) => {
                      if (rank === 1) return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-900 font-extrabold shadow-sm text-xs">1</span>;
                      if (rank === 2) return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-tr from-slate-300 to-slate-200 text-slate-900 font-extrabold shadow-sm text-xs">2</span>;
                      if (rank === 3) return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-tr from-amber-600 to-amber-500 text-white font-extrabold shadow-sm text-xs">3</span>;
                      return <span className="font-semibold text-slate-400 dark:text-slate-500">{rank}</span>;
                    };
                    return (
                      <tr key={s.id} className="hover:bg-orange-500/[0.04] dark:hover:bg-white/[0.03] transition-colors group">
                        <td className="px-4 py-3 text-center">{getRankBadge(rankNum)}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <a href={s.url || `https://news.ycombinator.com/item?id=${s.id}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-800 dark:text-slate-100 leading-snug hover:text-orange-600 dark:hover:text-orange-400 hover:underline transition-colors">{s.title}</a>
                            <span className="text-[10.5px] text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-[400px]">
                              {s.url ? new URL(s.url).hostname : "news.ycombinator.com"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-orange-50/80 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border border-orange-200/50 dark:border-orange-900/30 font-semibold text-[11px]">
                            <ArrowBigUp size={13} fill="currentColor" />
                            <span>{s.score}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-white/5 font-semibold text-[11px]">
                            <MessageSquare size={11} />
                            <span>{s.descendants}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-indigo-600 dark:text-indigo-400 font-medium text-[11px]">
                          @{s.by}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-block p-1 text-slate-400 hover:text-orange-500 transition-colors">
                            <ExternalLink size={13} />
                          </a>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleQuickSave(s)}
                            className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                              isSaved 
                                ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30" 
                                : "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                            }`}
                            title="Quick Save to ClickBook"
                          >
                            {isSaved ? <Check size={14} /> : <BookmarkPlus size={14} />}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="py-20 text-center text-slate-400 dark:text-slate-600 flex flex-col items-center justify-center gap-2">
              <AlertCircle className="w-8 h-8 opacity-30" />
              <p className="text-xs font-semibold">{t("noResult")}</p>
            </div>
          )}
        </div>
      </div>
    </WallpaperBackground>
  );
}
