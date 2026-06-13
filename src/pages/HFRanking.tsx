import { useEffect, useState, useMemo } from "react";
import { fetchHFTrending } from "@/shared/rankingApi";
import type { HFModel } from "@/shared/types";
import { Sparkles, Heart, Download, ExternalLink, AlertCircle, BookmarkPlus, Check, Search, RefreshCw, ChevronUp, ChevronDown } from "lucide-react";
import { useLang } from "@/shared/LanguageContext";
import RankingSkeleton from "@/components/RankingSkeleton";
import { formatLastUpdated } from "@/shared/utils";

export default function HFRankingPage() {
  const { t, lang } = useLang();
  const [models, setModels] = useState<HFModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [filterQuery, setFilterQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("week");
  const [lastUpdated, setLastUpdated] = useState<number>(0);



  const handleQuickSave = async (model: HFModel) => {
    try {
      await chrome.runtime.sendMessage({
        type: "ADD_BOOKMARK",
        url: model.url,
        title: model.repo_name,
        folderId: "other",
      });
      setSavedIds(prev => new Set(prev).add(model.id));
      setTimeout(() => {
        setSavedIds(prev => {
          const next = new Set(prev);
          next.delete(model.id);
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
    let result = models
      .map((r, i) => ({ ...r, _originalRank: i + 1 } as HFModel & { _originalRank: number }))
      .filter(r => 
        r.repo_name.toLowerCase().includes(filterQuery.toLowerCase()) ||
        r.author.toLowerCase().includes(filterQuery.toLowerCase())
      );

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
  }, [models, filterQuery, sortKey, sortOrder]);

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
    return sortOrder === "asc" ? <ChevronUp className="inline w-3 h-3 ml-1 text-yellow-500" /> : <ChevronDown className="inline w-3 h-3 ml-1 text-yellow-500" />;
  };

  const loadData = async (force: boolean = false, filter = dateFilter) => {
    setLoading(true);
    setError("");
    try {
      const { items, lastUpdated } = await fetchHFTrending(filter, force);
      setModels(items);
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
  }, []);

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-150 dark:border-surface-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-800 dark:text-gray-100 group">
            <Sparkles className="text-yellow-500 shrink-0 w-6 h-6" />
            {t("hfRanking")}
            <button
              onClick={() => loadData(true)}
              disabled={loading}
              title="Refresh"
              className="ml-2 p-1.5 text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-full transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {lang === "ko" ? "Hugging Face에서 지금 가장 주목받는 AI 모델들입니다." : 
               lang === "ja" ? "Hugging Faceで現在注目されているAIモデルのランキングです。" : 
               "Trending AI models on Hugging Face right now."}
            </p>
            {lastUpdated > 0 && (
              <span className="text-[10px] text-gray-300 dark:text-gray-600 bg-gray-100 dark:bg-surface-800 px-1.5 py-0.5 rounded">
                Updated: {formatLastUpdated(lastUpdated)}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-3 items-end md:items-center">
          <div className="flex bg-gray-100 dark:bg-surface-800 p-1 rounded-lg border border-gray-200 dark:border-surface-700">
            {[
              { id: "all", name: t("dateAll") || "All Time" },
              { id: "week", name: t("dateWeek") || "This Week" },
              { id: "month", name: t("dateMonth") || "This Month" },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => handleDateFilterChange(f.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all active:scale-95 ${
                  dateFilter === f.id
                    ? "bg-white dark:bg-surface-600 shadow-sm text-yellow-600 dark:text-yellow-400 font-semibold"
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
              placeholder={lang === "ko" ? "모델 또는 작성자 필터..." : lang === "ja" ? "モデル・作成者フィルター..." : "Filter models or authors..."}
              className="w-full pl-9 pr-3 py-1.5 border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800 rounded-lg text-xs outline-none focus:ring-1 focus:ring-yellow-500 transition-all text-gray-800 dark:text-gray-100"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
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
        <RankingSkeleton rows={15} cols={7} />
      ) : (
        <div className="bg-white dark:bg-surface-900 border border-gray-150 dark:border-surface-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-surface-800/50 border-b border-gray-150 dark:border-surface-800 text-gray-500 uppercase tracking-wider font-semibold">
                  <th className="px-4 py-3 text-center w-20 whitespace-nowrap cursor-pointer text-yellow-600 dark:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors" onClick={() => handleSort("rank")}>
                    {t("thRank")} <SortIcon columnKey="rank" />
                  </th>
                  <th className="px-4 py-3 text-left whitespace-nowrap cursor-pointer text-yellow-600 dark:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors" onClick={() => handleSort("repo_name")}>
                    Model Name <SortIcon columnKey="repo_name" />
                  </th>
                  <th className="px-4 py-3 text-right w-28 whitespace-nowrap cursor-pointer text-yellow-600 dark:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors" onClick={() => handleSort("likes")}>
                    Likes <SortIcon columnKey="likes" />
                  </th>
                  <th className="px-4 py-3 text-right w-32 whitespace-nowrap cursor-pointer text-yellow-600 dark:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors" onClick={() => handleSort("downloads")}>
                    Downloads <SortIcon columnKey="downloads" />
                  </th>
                  <th className="px-4 py-3 text-center w-24">Pipeline</th>
                  <th className="px-4 py-3 text-center w-24">Link</th>
                  <th className="px-4 py-3 text-center w-20">Save</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-surface-800">
                {filtered.map((m, i) => {
                  const isSaved = savedIds.has(m.id);
                  const getRankBadge = (rank: number) => {
                    if (rank === 1) return <span className="text-lg">🥇</span>;
                    if (rank === 2) return <span className="text-lg">🥈</span>;
                    if (rank === 3) return <span className="text-lg">🥉</span>;
                    return <span className="font-bold text-gray-400 dark:text-gray-600">{rank}</span>;
                  };
                  return (
                    <tr key={m.id} className="hover:bg-yellow-50/20 dark:hover:bg-yellow-950/10 transition-colors">
                      <td className="px-4 py-3.5 text-center font-bold text-gray-400 dark:text-gray-600">{getRankBadge(m._originalRank ?? i + 1)}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col">
                          <a href={m.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-gray-800 dark:text-gray-100 hover:text-yellow-600 dark:hover:text-yellow-400 hover:underline transition-colors">{m.repo_name}</a>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500">{m.author}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1 text-rose-500">
                          <Heart size={12} fill="currentColor" />
                          <span className="font-semibold">{m.likes.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1 text-blue-500">
                          <Download size={12} />
                          <span className="font-semibold">{m.downloads.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center text-gray-400 dark:text-gray-500">
                        {new Date(m.lastModified).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <a href={m.url} target="_blank" rel="noopener noreferrer" className="inline-block p-1 text-gray-400 hover:text-yellow-600 transition-colors">
                          <ExternalLink size={14} />
                        </a>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => handleQuickSave(m)}
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
