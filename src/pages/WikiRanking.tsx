import { useEffect, useState, useMemo } from "react";
import { fetchWikiRanking } from "@/shared/rankingApi";
import type { WikiArticle } from "@/shared/types";
import { Book, Eye, Globe, ExternalLink, AlertCircle, BookmarkPlus, Check, Search, RefreshCw, ChevronUp, ChevronDown } from "lucide-react";
import { useLang } from "@/shared/LanguageContext";
import RankingSkeleton from "@/components/RankingSkeleton";
import { formatLastUpdated } from "@/shared/utils";

export default function WikiRankingPage() {
  const { t, lang } = useLang();
  const [articles, setArticles] = useState<WikiArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [filterQuery, setFilterQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("day");
  const [lastUpdated, setLastUpdated] = useState<number>(0);



  const handleQuickSave = async (art: WikiArticle) => {
    try {
      await chrome.runtime.sendMessage({
        type: "ADD_BOOKMARK",
        url: art.url,
        title: art.article,
        folderId: "other",
      });
      setSavedIds(prev => new Set(prev).add(art.article));
      setTimeout(() => {
        setSavedIds(prev => {
          const next = new Set(prev);
          next.delete(art.article);
          return next;
        });
      }, 2000);
    } catch (err) {
      console.error("Failed to quick save:", err);
    }
  };

  const [sortKey, setSortKey] = useState<string>("rank");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const filtered = useMemo(() => {
    let result = articles
      .map((r, i) => ({ ...r, _originalRank: r.rank ?? i + 1 } as WikiArticle & { _originalRank: number }))
      .filter(art => {
        const title = art.article.replace(/_/g, " ");
        return title.toLowerCase().includes(filterQuery.toLowerCase());
      });

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
  }, [articles, filterQuery, sortKey, sortOrder]);

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
    return sortOrder === "asc" ? <ChevronUp className="inline w-3 h-3 ml-1 text-emerald-500" /> : <ChevronDown className="inline w-3 h-3 ml-1 text-emerald-500" />;
  };

  const loadData = async (force: boolean = false, filter = dateFilter) => {
    setLoading(true);
    setError("");
    try {
      const wikiLang = lang === "ko" ? "ko" : lang === "ja" ? "ja" : "en";
      const { items, lastUpdated } = await fetchWikiRanking(wikiLang, filter, force);
      setArticles(items);
      setLastUpdated(lastUpdated);
    } catch (err) {
      setError(t("errorFetch"));
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilterChange = (filterId: string) => {
    setDateFilter(filterId);
    loadData(false, filterId);
  };

  useEffect(() => {
    loadData(false, dateFilter);
  }, [lang]);

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-150 dark:border-surface-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-800 dark:text-gray-100 group">
            <Book className="text-blue-500 shrink-0 w-6 h-6" />
            {t("wikiRanking")}
            <button
              onClick={() => loadData(true)}
              disabled={loading}
              title="Refresh"
              className="ml-2 p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {lang === "ko" ? "위키백과에서 현재 가장 많이 읽히고 있는 문서 랭킹입니다." : 
               lang === "ja" ? "Wikipediaで現在最も読まれている記事のランキングです。" : 
               "The most read articles on Wikipedia right now."}
            </p>
            {lastUpdated > 0 && (
              <span className="text-[10px] text-gray-300 dark:text-gray-600 bg-gray-100 dark:bg-surface-800 px-1.5 py-0.5 rounded">
                Updated: {formatLastUpdated(lastUpdated)}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-end md:items-center gap-3">
          <div className="flex bg-gray-100 dark:bg-surface-800 p-1 rounded-lg border border-gray-200 dark:border-surface-700">
            {[
              { id: "day", name: t("dateDaily") || "Daily" },
              { id: "month", name: t("dateMonth") || "Monthly" },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => handleDateFilterChange(f.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all active:scale-95 ${
                  dateFilter === f.id
                    ? "bg-white dark:bg-surface-600 shadow-sm text-blue-600 dark:text-blue-400 font-semibold"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-64">
            <input
              type="text"
              value={filterQuery}
              onChange={e => setFilterQuery(e.target.value)}
              placeholder={lang === "ko" ? "결과 내 필터..." : lang === "ja" ? "結果内フィルター..." : "Filter results..."}
              className="w-full pl-9 pr-3 py-1.5 border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all text-gray-800 dark:text-gray-100"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          </div>
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-surface-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-surface-700 h-[34px]">
             <Globe size={14} className="text-gray-400" />
             <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
               {lang === "ko" ? "한국어 위키" : lang === "ja" ? "日本語 Wiki" : "English Wiki"}
             </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-lg flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <RankingSkeleton rows={15} cols={5} />
      ) : (
        <div className="bg-white dark:bg-surface-900 border border-gray-150 dark:border-surface-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-surface-800/50 border-b border-gray-150 dark:border-surface-800 text-gray-500 uppercase tracking-wider font-semibold">
                  <th className="px-4 py-3 text-center w-20 whitespace-nowrap cursor-pointer text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors" onClick={() => handleSort("rank")}>
                    {t("thRank")} <SortIcon columnKey="rank" />
                  </th>
                  <th className="px-4 py-3 text-left whitespace-nowrap cursor-pointer text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors" onClick={() => handleSort("article")}>
                    {lang === "ko" ? "문서 제목" : lang === "ja" ? "記事タイトル" : "Article Title"} <SortIcon columnKey="article" />
                  </th>
                  <th className="px-4 py-3 text-right w-40 whitespace-nowrap cursor-pointer text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors" onClick={() => handleSort("views")}>
                    {lang === "ko" ? "조회수" : lang === "ja" ? "閲覧数" : "Page Views"} <SortIcon columnKey="views" />
                  </th>
                  <th className="px-4 py-3 text-center w-24">Link</th>
                  <th className="px-4 py-3 text-center w-20">Save</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-surface-800">
                {filtered.map((art) => {
                  const isSaved = savedIds.has(art.article);
                  const getRankBadge = (rank: number) => {
                    if (rank === 1) return <span className="text-lg">🥇</span>;
                    if (rank === 2) return <span className="text-lg">🥈</span>;
                    if (rank === 3) return <span className="text-lg">🥉</span>;
                    return <span className="font-bold text-gray-400 dark:text-gray-600">{rank}</span>;
                  };
                  return (
                    <tr key={art.article} className="hover:bg-emerald-50/20 dark:hover:bg-emerald-950/10 transition-colors">
                      <td className="px-4 py-3.5 text-center font-bold text-gray-400 dark:text-gray-600">
                        {getRankBadge(art._originalRank)}
                      </td>
                      <td className="px-4 py-3.5 font-medium">
                        <a href={art.url} target="_blank" rel="noopener noreferrer" className="text-gray-800 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors">{art.article}</a>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5 font-semibold text-blue-600 dark:text-blue-400">
                          <Eye size={13} />
                          {art.views.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <a href={art.url} target="_blank" rel="noopener noreferrer" className="inline-block p-1 text-gray-400 hover:text-blue-500 transition-colors">
                          <ExternalLink size={14} />
                        </a>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => handleQuickSave(art)}
                          className={`p-1.5 rounded-lg transition-all ${
                            isSaved 
                              ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30" 
                              : "text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                          }`}
                          title="Quick Save to ClickBook"
                        >
                          {isSaved ? <Check size={16} /> : <BookmarkPlus size={16} />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!loading && filtered.length === 0 && (
            <div className="py-20 text-center text-gray-400 dark:text-gray-600 flex flex-col items-center justify-center gap-2">
              <AlertCircle className="w-8 h-8 opacity-30" />
              <p className="text-xs font-semibold">{t("noResult")}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
