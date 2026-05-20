import { useEffect, useState } from "react";
import { getCachedTopRepos, getCachedCustomRepos } from "@/shared/githubApi";
import type { GitHubRepo } from "@/shared/types";
import { Trophy, Star, GitFork, AlertCircle, Search, Globe, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { useLang } from "@/shared/LanguageContext";

const LANGUAGES = [
  { id: "All", name: "All Languages", query: null },
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
  const [error, setError] = useState("");
  const [custom, setCustom] = useState(false);
  const [selectedLang, setSelectedLang] = useState("All");
  const [dateFilter, setDateFilter] = useState("all");
  const [showLimits, setShowLimits] = useState(false);

  const loadRepos = async (langId: string, filter: string) => {
    setLoading(true);
    setError("");
    setCustom(langId !== "All" || filter !== "all");
    try {
      let items: GitHubRepo[] = [];
      const dateQ = getDateQueryStr(filter);

      if (langId === "All" && filter === "all") {
        items = await getCachedTopRepos();
      } else {
        const langConfig = LANGUAGES.find(l => l.id === langId);
        let q = langConfig?.query || "stars:>1000";
        q += dateQ;
        items = await getCachedCustomRepos(q);
      }
      setRepos(items);
    } catch (err) {
      setError(t("errorFetch"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRepos("All", "all");
  }, []);

  const handleLanguageChange = (langId: string) => {
    setSelectedLang(langId);
    setQuery(""); // Clear custom search
    loadRepos(langId, dateFilter);
  };

  const executeSearch = async (q: string, filter: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setCustom(true);
    setSelectedLang("");
    setError("");
    try {
      const dateQ = getDateQueryStr(filter);
      const finalQuery = `${q.trim()}${dateQ}`;
      const items = await getCachedCustomRepos(finalQuery);
      setRepos(items);
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
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-150 dark:border-surface-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <Trophy className="text-amber-400 shrink-0 w-6 h-6 animate-pulse" />
            {t("githubRankingTitle")}
          </h1>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {t("githubRankingDesc")}
          </p>
        </div>

        {/* 검색 바 */}
        <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-96 relative">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t("githubSearchPlaceholder")}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-gray-800 dark:text-gray-100"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-xs shadow-sm hover:shadow-indigo-500/20 active:scale-95 transition-all shrink-0"
          >
            {t("searchBtn")}
          </button>
        </form>
      </div>

      {/* 실시간 검색 제약 안내 */}
      <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/30 rounded-lg overflow-hidden transition-all duration-300">
        <button
          onClick={() => setShowLimits(s => !s)}
          className="w-full flex items-center justify-between p-3 text-left focus:outline-none"
        >
          <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
            <span className="font-semibold text-indigo-900 dark:text-indigo-200">{t("apiLimitTitle")}</span>
          </div>
          {showLimits ? <ChevronUp size={14} className="text-indigo-600 dark:text-indigo-400" /> : <ChevronDown size={14} className="text-indigo-600 dark:text-indigo-400" />}
        </button>
        {showLimits && (
          <div className="px-3 pb-3 pt-0 text-xs text-indigo-800 dark:text-indigo-300">
            <p className="opacity-90 leading-relaxed pl-6">{t("apiLimitDesc")}</p>
          </div>
        )}
      </div>

      {/* 필터 영역 */}
      <div className="flex flex-col xl:flex-row gap-5 xl:items-end justify-between border-b border-gray-150 dark:border-surface-800 pb-5">
        <div className="space-y-2 overflow-hidden">
          <label className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" />
            {t("langRankingLabel")}
          </label>
          <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 max-w-full">
            {LANGUAGES.map(lang => {
              const isActive = selectedLang === lang.id;
              return (
                <button
                  key={lang.id}
                  onClick={() => handleLanguageChange(lang.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all duration-150 active:scale-95 shrink-0 ${
                    isActive
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-600/15"
                      : "bg-white dark:bg-surface-800 hover:bg-gray-50 dark:hover:bg-surface-700 border-gray-200 dark:border-surface-700 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {lang.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2 shrink-0">
          <label className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {t("dateFilterLabel")}
          </label>
          <div className="flex bg-gray-100 dark:bg-surface-800 p-1 rounded-lg border border-gray-200 dark:border-surface-700">
            {[
              { id: "all", name: t("dateAll") },
              { id: "week", name: t("dateWeek") },
              { id: "month", name: t("dateMonth") },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => handleDateFilterChange(f.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all active:scale-95 ${
                  dateFilter === f.id
                    ? "bg-white dark:bg-surface-600 shadow-sm text-indigo-600 dark:text-indigo-400 font-semibold"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {f.name}
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
      <div className="bg-white dark:bg-surface-900 border border-gray-150 dark:border-surface-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="bg-gray-50 dark:bg-surface-800/50 border-b border-gray-150 dark:border-surface-800 text-gray-500 uppercase tracking-wider font-semibold">
                <th className="px-4 py-3 text-center w-12">{t("thRank")}</th>
                <th className="px-4 py-3 text-left">{t("thProject")}</th>
                <th className="px-4 py-3 text-right w-24">Stars</th>
                <th className="px-4 py-3 text-right w-24">Forks</th>
                <th className="px-4 py-3 text-center w-24">{t("thLang")}</th>
                <th className="px-4 py-3 text-right w-24">Issues</th>
                <th className="px-4 py-3 text-left">{t("thDesc")}</th>
                <th className="px-4 py-3 text-center w-28">{t("thCommit")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-surface-800">
              {repos.map((repo, i) => {
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
                    <td className="px-4 py-3.5 text-center">{getRankBadge(i + 1)}</td>
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-400 dark:text-gray-600">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-semibold">{t("loadingGithub")}</p>
          </div>
        )}

        {!loading && repos.length === 0 && (
          <div className="py-20 text-center text-gray-400 dark:text-gray-600 flex flex-col items-center justify-center gap-2">
            <AlertCircle className="w-8 h-8 opacity-30" />
            <p className="text-xs font-semibold">{t("noResult")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
