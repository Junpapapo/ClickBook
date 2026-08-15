import { useEffect, useState, useMemo } from "react";
import { getCachedTopRepos, getCachedCustomRepos } from "@/shared/githubApi";
import type { GitHubRepo } from "@/shared/types";
import { Trophy, Star, GitFork, AlertCircle, Search, Globe, Calendar, ChevronDown, ChevronUp, BookmarkPlus, Check, RefreshCw } from "lucide-react";
import { useLang } from "@/shared/LanguageContext";
import RankingSkeleton from "@/components/RankingSkeleton";
import { formatLastUpdated } from "@/shared/utils";

const LANGUAGES = [
  { id: "All", name: "All Languages", query: null },
  { id: "N/A", name: "N/A", query: null },
  { id: "TypeScript", name: "TypeScript", query: "stars:>5000 language:TypeScript" },
  { id: "JavaScript", name: "JavaScript", query: "stars:>5000 language:JavaScript" },
  { id: "Python", name: "Python", query: "stars:>5000 language:Python" },
  { id: "Go", name: "Go", query: "stars:>5000 language:Go" },
  { id: "Rust", name: "Rust", query: "stars:>5000 language:Rust" },
  { id: "Java", name: "Java", query: "stars:>5000 language:Java" },
  { id: "C++", name: "C++", query: "stars:>5000 language:C++" },
  { id: "Ruby", name: "Ruby", query: "stars:>3000 language:Ruby" },
  { id: "Swift", name: "Swift", query: "stars:>3000 language:Swift" }
];

function getDateQueryStr(filter: string) {
  if (filter === "all") return "";
  const d = new Date();
  if (filter === "week") d.setDate(d.getDate() - 7);
  else if (filter === "month") d.setMonth(d.getMonth() - 1);
  const dateStr = d.toISOString().split("T")[0];
  return ` created:>=${dateStr}`;
}

export default function GitHubRankingPage() {
  const { t } = useLang();
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [filterQuery, setFilterQuery] = useState("");
  const [error, setError] = useState("");
  const [selectedLang, setSelectedLang] = useState("All");
  const [dateFilter, setDateFilter] = useState("week");
  const [showLimits, setShowLimits] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [lastUpdated, setLastUpdated] = useState<number>(0);

  const [sortKey, setSortKey] = useState<string>("rank");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const filtered = useMemo(() => {
    let result = repos
      .map((r, i) => ({ ...r, _originalRank: i + 1 } as GitHubRepo & { _originalRank: number }))
      .filter(r => r.name.toLowerCase().includes(filterQuery.toLowerCase()));

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
  }, [repos, filterQuery, sortKey, sortOrder]);

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
    return sortOrder === "asc" ? <ChevronUp className="inline w-3 h-3 ml-1 text-indigo-500" /> : <ChevronDown className="inline w-3 h-3 ml-1 text-indigo-500" />;
  };

  const handleQuickSave = async (repo: GitHubRepo) => {
    try {
      await chrome.runtime.sendMessage({
        type: "ADD_BOOKMARK",
        url: repo.html_url,
        title: repo.name,
        folderId: "other",
      });
      setSavedIds(prev => new Set(prev).add(repo.id));
      setTimeout(() => {
        setSavedIds(prev => {
          const next = new Set(prev);
          next.delete(repo.id);
          return next;
        });
      }, 2000);
    } catch (err) {
      console.error("Failed to quick save:", err);
    }
  };

  const loadRepos = async (langId: string, filter: string, forceRefresh: boolean = false) => {
    setLoading(true);
    setError("");
    setFilterQuery("");
    try {
      const dateQ = getDateQueryStr(filter);

      let newItems: GitHubRepo[] = [];
      if ((langId === "All" || langId === "N/A") && filter === "all") {
        const result = await getCachedTopRepos(forceRefresh);
        newItems = result.items;
        setLastUpdated(result.lastUpdated);
      } else {
        let q = "";
        if (filter === "all") {
          const langConfig = LANGUAGES.find(l => l.id === langId);
          q = langConfig?.query || "stars:>5000";
        } else {
          if (langId !== "All" && langId !== "N/A") {
            q = `language:${langId} stars:>2`;
          } else {
            q = `stars:>5`;
          }
        }
        q += dateQ;
        const result = await getCachedCustomRepos(q, forceRefresh);
        newItems = result.items;
        setLastUpdated(result.lastUpdated);
      }

      if (langId === "N/A") {
        newItems = newItems.filter(r => !r.language || r.language === "N/A");
      }

      setRepos(newItems);
    } catch (err) {
      setError(t("errorFetch"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRepos("All", "week");
  }, []);

  const handleLanguageChange = (langId: string) => {
    setSelectedLang(langId);
    setQuery(""); 
    loadRepos(langId, dateFilter);
  };

  const executeSearch = async (q: string, filter: string, forceRefresh: boolean = false) => {
    if (!q.trim()) return;
    setLoading(true);
    setFilterQuery("");
    setSelectedLang("");
    setError("");
    try {
      const dateQ = getDateQueryStr(filter);
      const finalQuery = `${q.trim()}${dateQ}`;
      const result = await getCachedCustomRepos(finalQuery, forceRefresh);
      setRepos(result.items);
      setLastUpdated(result.lastUpdated);
    } catch (err) {
      console.warn("Operation failed:", err);
      setError(t("errorLimit"));
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilterChange = (filterId: string) => {
    setDateFilter(filterId);
    if (query) {
      executeSearch(query, filterId);
    } else {
      loadRepos(selectedLang, filterId);
    }
  };

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    executeSearch(query, dateFilter);
  }

  return (
    <div className="w-full space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-150 dark:border-surface-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-800 dark:text-gray-100 group">
            <Trophy className="text-amber-400 shrink-0 w-6 h-6 animate-pulse" />
            {t("githubRankingTitle")}
            <button
              onClick={() => query ? executeSearch(query, dateFilter, true) : loadRepos(selectedLang, dateFilter, true)}
              disabled={loading}
              title="Refresh"
              className="ml-2 p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-full transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {t("githubRankingDesc")}
            </p>
            {lastUpdated > 0 && (
              <span className="text-[10px] text-gray-300 dark:text-gray-600 bg-gray-100 dark:bg-surface-800 px-1.5 py-0.5 rounded">
                Updated: {formatLastUpdated(lastUpdated)}
              </span>
            )}
          </div>
        </div>        <div className="flex flex-col md:flex-row gap-2.5 items-end">
          {/* 결과 내 필터 */}
          <div className="relative w-full md:w-44">
             <input
               type="text"
               value={filterQuery}
               onChange={e => setFilterQuery(e.target.value)}
               placeholder="Filter results..."
               className="w-full pl-8 pr-2.5 py-1.5 border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-xs outline-none focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-100 placeholder-slate-400"
             />
             <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          </div>

          {/* 검색 바 */}
          <form onSubmit={handleSearch} className="flex gap-1.5 w-full md:w-72 relative">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t("githubSearchPlaceholder")}
                className="w-full pl-8 pr-2.5 py-1.5 border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-800/90 rounded-lg text-xs outline-none focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-100 placeholder-slate-400"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            </div>
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg font-semibold text-xs shadow-2xs transition-all shrink-0 cursor-pointer"
            >
              {t("searchBtn")}
            </button>
          </form>
        </div>
      </div>

      {/* 실시간 검색 제약 안내 */}
      <div className="bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-900/40 rounded-xl overflow-hidden transition-all duration-200">
        <button
          onClick={() => setShowLimits(s => !s)}
          className="w-full flex items-center justify-between p-2.5 text-left focus:outline-none cursor-pointer"
        >
          <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300 text-xs">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-indigo-600 dark:text-indigo-400" />
            <span className="font-semibold text-indigo-900 dark:text-indigo-200">{t("apiLimitTitle")}</span>
          </div>
          {showLimits ? <ChevronUp size={13} className="text-indigo-600 dark:text-indigo-400" /> : <ChevronDown size={13} className="text-indigo-600 dark:text-indigo-400" />}
        </button>
        {showLimits && (
          <div className="px-2.5 pb-2.5 pt-0 text-xs text-indigo-800 dark:text-indigo-300">
            <p className="opacity-90 leading-relaxed pl-5 text-[11px]">{t("apiLimitDesc")}</p>
          </div>
        )}
      </div>

      {/* 필터 영역 */}
      <div className="flex flex-col xl:flex-row gap-4 xl:items-end justify-between border-b border-slate-200/80 dark:border-slate-800 pb-4">
        <div className="space-y-1.5 overflow-hidden">
          <label className="text-[9.5px] font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
            <Globe className="w-3 h-3" />
            {t("langRankingLabel")}
          </label>
          <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-0.5 max-w-full">
            {LANGUAGES.map(lang => {
              const isActive = selectedLang === lang.id;
              return (
                <button
                  key={lang.id}
                  onClick={() => handleLanguageChange(lang.id)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all duration-150 active:scale-98 shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-2xs"
                      : "bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200/90 dark:border-slate-700/70 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {lang.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5 shrink-0">
          <label className="text-[9.5px] font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
            <Calendar className="w-3 h-3" />
            {t("dateFilterLabel")}
          </label>
          <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-lg p-0.5 border border-slate-200/60 dark:border-slate-700/60">
            {[
              { id: "week", label: t("dateWeek") },
              { id: "month", label: t("dateMonth") },
              { id: "all", label: t("dateAll") }
            ].map(tf => (
              <button
                key={tf.id}
                onClick={() => handleDateFilterChange(tf.id)}
                className={`px-2.5 py-1 text-xs font-semibold rounded transition-all cursor-pointer ${
                  dateFilter === tf.id
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-lg flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 데이터 테이블 */}
      {loading ? (
        <RankingSkeleton rows={15} cols={9} />
      ) : (
        <div className="bg-white dark:bg-surface-900 border border-gray-150 dark:border-surface-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-surface-800/50 border-b border-gray-150 dark:border-surface-800 text-gray-500 uppercase tracking-wider font-semibold">
                  <th className="px-4 py-3 text-center w-20 whitespace-nowrap cursor-pointer text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors" onClick={() => handleSort("rank")}>
                    {t("thRank")} <SortIcon columnKey="rank" />
                  </th>
                  <th className="px-4 py-3 text-left whitespace-nowrap cursor-pointer text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors" onClick={() => handleSort("name")}>
                    {t("thProject")} <SortIcon columnKey="name" />
                  </th>
                  <th className="px-4 py-3 text-right w-28 whitespace-nowrap cursor-pointer text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors" onClick={() => handleSort("stargazers_count")}>
                    Stars <SortIcon columnKey="stargazers_count" />
                  </th>
                  <th className="px-4 py-3 text-right w-28 whitespace-nowrap cursor-pointer text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors" onClick={() => handleSort("forks_count")}>
                    Forks <SortIcon columnKey="forks_count" />
                  </th>
                  <th className="px-4 py-3 text-center w-24 whitespace-nowrap">{t("thLang")}</th>
                  <th className="px-4 py-3 text-right w-28 whitespace-nowrap cursor-pointer text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors" onClick={() => handleSort("open_issues_count")}>
                    Issues <SortIcon columnKey="open_issues_count" />
                  </th>
                  <th className="px-4 py-3 text-left">{t("thDesc")}</th>
                  <th className="px-4 py-3 text-center w-28">{t("thCommit")}</th>
                  <th className="px-4 py-3 text-center w-20">Save</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-surface-800">
                {filtered.map((repo) => {
                  const isSaved = savedIds.has(repo.id);
                  const getRankBadge = (rank: number) => {
                    if (rank === 1) return <span className="text-lg">🥇</span>;
                    if (rank === 2) return <span className="text-lg">🥈</span>;
                    if (rank === 3) return <span className="text-lg">🥉</span>;
                    return <span className="font-bold text-gray-400 dark:text-gray-600">{rank}</span>;
                  };

                  return (
                    <tr
                      key={repo.id}
                      className="hover:bg-indigo-50/20 dark:hover:bg-indigo-950/10 transition-colors"
                    >
                      <td className="px-4 py-3.5 text-center font-bold text-gray-400 dark:text-gray-600">{getRankBadge(repo._originalRank)}</td>
                      <td className="px-4 py-3.5 font-medium">
                        <div className="flex items-center gap-2">
                          {repo.owner?.avatar_url && (
                            <img
                              src={repo.owner.avatar_url}
                              alt={repo.owner.login}
                              className="w-5 h-5 rounded-full border border-gray-100 dark:border-surface-700 bg-gray-50"
                              loading="lazy"
                            />
                          )}
                          <a
                            href={repo.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1"
                          >
                            {repo.name}
                          </a>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold text-gray-700 dark:text-gray-200">
                        <div className="flex items-center justify-end gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span>{repo.stargazers_count.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-300">
                        <div className="flex items-center justify-end gap-1">
                          <GitFork className="w-3.5 h-3.5 text-blue-400" />
                          <span>{repo.forks_count.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-surface-800 text-gray-600 dark:text-gray-300 font-medium">
                          {repo.language || "N/A"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right text-gray-500 dark:text-gray-400">
                        {repo.open_issues_count.toLocaleString()}
                      </td>
                      <td
                        className="px-4 py-3.5 text-left text-gray-500 dark:text-gray-400 max-w-xs truncate"
                        title={repo.description || ""}
                      >
                        {repo.description || <span className="text-gray-350 dark:text-gray-600 italic">{t("noDesc")}</span>}
                      </td>
                      <td className="px-4 py-3.5 text-center text-gray-400 dark:text-gray-500">
                        {repo.pushed_at ? repo.pushed_at.slice(0, 10) : "N/A"}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => handleQuickSave(repo)}
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
