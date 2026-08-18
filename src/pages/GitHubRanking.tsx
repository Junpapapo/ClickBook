import { useEffect, useState, useMemo } from "react";
import { getCachedTopRepos, getCachedCustomRepos } from "@/shared/githubApi";
import type { GitHubRepo } from "@/shared/types";
import { Trophy, Star, GitFork, AlertCircle, Search, Globe, Calendar, ChevronDown, ChevronUp, BookmarkPlus, Check, RefreshCw } from "lucide-react";
import { useLang } from "@/shared/LanguageContext";
import { useTheme } from "@/shared/ThemeContext";
import RankingSkeleton from "@/components/RankingSkeleton";
import { formatLastUpdated } from "@/shared/utils";
import WallpaperBackground from "@/components/dashboard/WallpaperBackground";

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
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
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
      .filter(r => {
        const matchName = r.name.toLowerCase().includes(filterQuery.toLowerCase());
        const matchDesc = (r.description || "").toLowerCase().includes(filterQuery.toLowerCase());
        return matchName || matchDesc;
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
  }, [repos, filterQuery, sortKey, sortOrder]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  const handleQuickSave = async (repo: GitHubRepo) => {
    try {
      await chrome.runtime.sendMessage({
        type: "ADD_BOOKMARK",
        url: repo.html_url,
        title: repo.name,
        description: repo.description || undefined,
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
    <WallpaperBackground isDarkMode={isDarkMode}>
      <div className="max-w-[1440px] w-full mx-auto pb-12 pt-2 sm:pt-4 px-2 sm:px-6 select-none space-y-4">
        {/* ── 타이틀 & 컨트롤 헤더 (박스 없이 시원하게 노출) ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold flex items-center gap-2.5 text-slate-800 dark:text-slate-100 tracking-tight">
              <Trophy className="text-amber-400 shrink-0 w-6 h-6 animate-pulse" />
              {t("githubRankingTitle")}
              <button
                onClick={() => query ? executeSearch(query, dateFilter, true) : loadRepos(selectedLang, dateFilter, true)}
                disabled={loading}
                title="Refresh"
                className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50/80 dark:hover:bg-amber-950/40 rounded-full transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              </button>
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("githubRankingDesc")}
              </p>
              {lastUpdated > 0 && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xs border border-slate-200/50 dark:border-white/5 px-1.5 py-0.5 rounded-md">
                  Updated: {formatLastUpdated(lastUpdated)}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-2.5 items-end">
            <div className="relative w-full md:w-44">
              <input
                type="text"
                value={filterQuery}
                onChange={e => setFilterQuery(e.target.value)}
                placeholder="Filter results..."
                className="w-full pl-8 pr-2.5 py-1.5 border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500/30 transition-all text-slate-800 dark:text-slate-100 placeholder-slate-400 shadow-figma-xs"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            </div>

            <form onSubmit={handleSearch} className="flex gap-1.5 w-full md:w-72 relative">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={t("githubSearchPlaceholder")}
                  className="w-full pl-8 pr-2.5 py-1.5 border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500/30 transition-all text-slate-800 dark:text-slate-100 placeholder-slate-400 shadow-figma-xs"
                />
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              </div>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-semibold text-xs shadow-figma-xs transition-all shrink-0 cursor-pointer"
              >
                {t("searchBtn")}
              </button>
            </form>
          </div>
        </div>

        {/* ── 필터 및 랭킹 테이블 글래스 카드 ── */}
        <div className="bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-white/10 shadow-figma-lg p-3 sm:p-5 space-y-4">
          <div className="bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-900/40 rounded-2xl overflow-hidden transition-all duration-200">
            <button
              onClick={() => setShowLimits(s => !s)}
              className="w-full flex items-center justify-between p-3 text-left focus:outline-none cursor-pointer"
            >
              <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                <span className="font-semibold text-indigo-900 dark:text-indigo-200">{t("apiLimitTitle")}</span>
              </div>
              {showLimits ? <ChevronUp size={14} className="text-indigo-600 dark:text-indigo-400" /> : <ChevronDown size={14} className="text-indigo-600 dark:text-indigo-400" />}
            </button>
            {showLimits && (
              <div className="px-3 pb-3 pt-0 text-xs text-indigo-800 dark:text-indigo-300">
                <p className="opacity-90 leading-relaxed pl-6 text-[11px]">{t("apiLimitDesc")}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col xl:flex-row gap-4 xl:items-end justify-between border-b border-slate-200/60 dark:border-slate-800/80 pb-4">
            <div className="space-y-1.5 overflow-hidden">
              <label className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                {t("langRankingLabel")}
              </label>
              <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-0.5 max-w-full">
                {LANGUAGES.map(lang => {
                  const isActive = selectedLang === lang.id;
                  return (
                    <button
                      key={lang.id}
                      onClick={() => handleLanguageChange(lang.id)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all duration-150 active:scale-98 shrink-0 cursor-pointer ${
                        isActive
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-2xs"
                          : "bg-white/80 dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200/90 dark:border-slate-700/70 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {lang.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5 shrink-0">
              <label className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {t("dateFilterLabel")}
              </label>
              <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl p-1 border border-slate-200/60 dark:border-slate-700/60">
                {[
                  { id: "week", label: t("dateWeek") },
                  { id: "month", label: t("dateMonth") },
                  { id: "all", label: t("dateAll") }
                ].map(tf => (
                  <button
                    key={tf.id}
                    onClick={() => handleDateFilterChange(tf.id)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
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
            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-xl flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <RankingSkeleton rows={10} />
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-white/10 text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider">
                    <th className="px-4 py-3 text-center w-14 first:rounded-l-xl text-amber-600 dark:text-amber-400">#</th>
                    <th className="px-4 py-3 cursor-pointer hover:text-indigo-500 text-slate-700 dark:text-slate-300" onClick={() => handleSort("name")}>
                      Repository {sortKey === "name" && (sortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th className="px-4 py-3 text-right cursor-pointer hover:text-indigo-500 text-slate-700 dark:text-slate-300" onClick={() => handleSort("stargazers_count")}>
                      Stars {sortKey === "stargazers_count" && (sortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th className="px-4 py-3 text-right cursor-pointer hover:text-indigo-500 text-slate-700 dark:text-slate-300" onClick={() => handleSort("forks_count")}>
                      Forks {sortKey === "forks_count" && (sortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th className="px-4 py-3 text-center">Language</th>
                    <th className="px-4 py-3 text-right">Issues</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3 text-center">Updated</th>
                    <th className="px-4 py-3 text-center w-16 last:rounded-r-xl">Save</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80 dark:divide-white/[0.04]">
                  {filtered.map((repo, i) => {
                    const isSaved = savedIds.has(repo.id);
                    const rankNum = repo._originalRank ?? i + 1;
                    const getRankBadge = (rank: number) => {
                      if (rank === 1) return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-900 font-extrabold shadow-sm text-xs">1</span>;
                      if (rank === 2) return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-tr from-slate-300 to-slate-200 text-slate-900 font-extrabold shadow-sm text-xs">2</span>;
                      if (rank === 3) return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-tr from-amber-600 to-amber-500 text-white font-extrabold shadow-sm text-xs">3</span>;
                      return <span className="font-semibold text-slate-400 dark:text-slate-500">{rank}</span>;
                    };
                    return (
                      <tr
                        key={repo.id}
                        className="hover:bg-indigo-500/[0.04] dark:hover:bg-white/[0.03] transition-colors group"
                      >
                        <td className="px-4 py-3 text-center">{getRankBadge(rankNum)}</td>
                        <td className="px-4 py-3 font-medium">
                          <div className="flex items-center gap-2">
                            {repo.owner?.avatar_url && (
                              <img
                                src={repo.owner.avatar_url}
                                alt={repo.owner.login}
                                className="w-5 h-5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 shrink-0"
                                loading="lazy"
                              />
                            )}
                            <a
                              href={repo.html_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-800 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold hover:underline transition-colors"
                            >
                              {repo.name}
                            </a>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50/80 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30 font-semibold text-[11px]">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            <span>{repo.stargazers_count.toLocaleString()}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50/80 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30 font-semibold text-[11px]">
                            <GitFork className="w-3 h-3 text-blue-500" />
                            <span>{repo.forks_count.toLocaleString()}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100/90 dark:bg-slate-800/70 border border-slate-200/60 dark:border-white/5 text-slate-700 dark:text-slate-300 font-medium text-[10.5px]">
                            {repo.language || "N/A"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400 text-[11px]">
                          {repo.open_issues_count.toLocaleString()}
                        </td>
                        <td
                          className="px-4 py-3 text-left text-slate-500 dark:text-slate-400 max-w-xs truncate text-[11px]"
                          title={repo.description || ""}
                        >
                          {repo.description || <span className="text-slate-400 italic">{t("noDesc")}</span>}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-400 dark:text-slate-500 text-[11px]">
                          {repo.pushed_at ? repo.pushed_at.slice(0, 10) : "N/A"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleQuickSave(repo)}
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
