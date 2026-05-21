import { useEffect, useState, useMemo } from "react";
import { fetchHNTopStories } from "@/shared/rankingApi";
import type { HNStory } from "@/shared/types";
import { Newspaper, MessageSquare, ArrowBigUp, ExternalLink, AlertCircle, BookmarkPlus, Check, Search } from "lucide-react";
import { useLang } from "@/shared/LanguageContext";
import RankingSkeleton from "@/components/RankingSkeleton";

export default function HNRankingPage() {
  const { t, lang } = useLang();
  const [stories, setStories] = useState<HNStory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [filterQuery, setFilterQuery] = useState("");

  const filtered = useMemo(() => {
    return stories.filter(s => 
      s.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
      (s.url && new URL(s.url).hostname.toLowerCase().includes(filterQuery.toLowerCase()))
    );
  }, [stories, filterQuery]);

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

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchHNTopStories();
      setStories(data);
    } catch (err) {
      setError(t("errorFetch"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-150 dark:border-surface-800 pb-4">
        <div>
          <a 
            href="https://news.ycombinator.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2"
          >
            <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-800 dark:text-gray-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
              <Newspaper className="text-orange-500 shrink-0 w-6 h-6" />
              {t("hnRanking")}
            </h1>
            <ExternalLink size={14} className="text-gray-300 group-hover:text-orange-400 transition-colors" />
          </a>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {lang === "ko" ? "IT 및 스타트업 업계에서 현재 가장 뜨거운 뉴스들입니다." : 
             lang === "ja" ? "IT・スタートアップ業界で現在最も話題のニュースです。" : 
             "Top stories on Hacker News right now."}
          </p>
        </div>
        <div className="relative w-full md:w-64">
          <input
            type="text"
            value={filterQuery}
            onChange={e => setFilterQuery(e.target.value)}
            placeholder={lang === "ko" ? "기사 제목 또는 도메인 필터..." : lang === "ja" ? "記事タイトル・ドメインフィルター..." : "Filter stories or domains..."}
            className="w-full pl-9 pr-3 py-1.5 border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800 rounded-lg text-xs outline-none focus:ring-1 focus:ring-orange-500 transition-all text-gray-800 dark:text-gray-100"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
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
                  <th className="px-4 py-3 text-center w-12 shrink-0">{t("thRank")}</th>
                  <th className="px-4 py-3 text-left whitespace-nowrap">Title</th>
                  <th className="px-4 py-3 text-right w-24">Points</th>
                  <th className="px-4 py-3 text-right w-24">Comments</th>
                  <th className="px-4 py-3 text-center w-28">Author</th>
                  <th className="px-4 py-3 text-center w-24">Link</th>
                  <th className="px-4 py-3 text-center w-20">Save</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-surface-800">
                {filtered.map((s, i) => {
                  const isSaved = savedIds.has(s.id);
                  return (
                    <tr key={s.id} className="hover:bg-orange-50/20 dark:hover:bg-orange-950/10 transition-colors">
                      <td className="px-4 py-3.5 text-center shrink-0 font-bold text-gray-400 dark:text-gray-600">{i + 1}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-800 dark:text-gray-100 leading-snug">{s.title}</span>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 truncate max-w-[400px]">
                            {s.url ? new URL(s.url).hostname : "news.ycombinator.com"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1 text-orange-600 dark:text-orange-400">
                          <ArrowBigUp size={14} fill="currentColor" />
                          <span className="font-semibold">{s.score}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1 text-gray-500">
                          <MessageSquare size={12} />
                          <span className="font-semibold">{s.descendants}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center text-indigo-500 dark:text-indigo-400">
                        @{s.by}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-block p-1 text-gray-400 hover:text-orange-500 transition-colors">
                          <ExternalLink size={14} />
                        </a>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => handleQuickSave(s)}
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
