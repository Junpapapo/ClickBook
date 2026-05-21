import { useEffect, useState, useMemo } from "react";
import { fetchWikiRanking } from "@/shared/rankingApi";
import type { WikiArticle } from "@/shared/types";
import { Book, Eye, Globe, ExternalLink, AlertCircle, BookmarkPlus, Check, Search } from "lucide-react";
import { useLang } from "@/shared/LanguageContext";
import RankingSkeleton from "@/components/RankingSkeleton";

export default function WikiRankingPage() {
  const { t, lang } = useLang();
  const [articles, setArticles] = useState<WikiArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [filterQuery, setFilterQuery] = useState("");

  const filtered = useMemo(() => {
    return articles.filter(a => a.article.toLowerCase().includes(filterQuery.toLowerCase()));
  }, [articles, filterQuery]);

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

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const wikiLang = lang === "ko" ? "ko" : lang === "ja" ? "ja" : "en";
      const data = await fetchWikiRanking(wikiLang);
      setArticles(data);
    } catch (err) {
      setError(t("errorFetch"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [lang]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-150 dark:border-surface-800 pb-4">
        <div>
          <a 
            href={`https://${lang === "ko" ? "ko" : lang === "ja" ? "ja" : "en"}.wikipedia.org/wiki/Special:MostVisitedPages`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2"
          >
            <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              <Book className="text-blue-500 shrink-0 w-6 h-6" />
              {t("wikiRanking")}
            </h1>
            <ExternalLink size={14} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
          </a>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {lang === "ko" ? "위키백과에서 현재 가장 많이 읽히고 있는 문서 랭킹입니다." : 
             lang === "ja" ? "Wikipediaで現在最も読まれている記事のランキングです。" : 
             "The most read articles on Wikipedia right now."}
          </p>
        </div>
        <div className="flex flex-col md:flex-row items-end md:items-center gap-3">
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
                  <th className="px-4 py-3 text-center w-12 shrink-0">{t("thRank")}</th>
                  <th className="px-4 py-3 text-left whitespace-nowrap">{lang === "ko" ? "문서 제목" : lang === "ja" ? "記事タイトル" : "Article Title"}</th>
                  <th className="px-4 py-3 text-right w-40">{lang === "ko" ? "조회수" : lang === "ja" ? "閲覧数" : "Page Views"}</th>
                  <th className="px-4 py-3 text-center w-24">Link</th>
                  <th className="px-4 py-3 text-center w-20">Save</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-surface-800">
                {filtered.map((art) => {
                  const isSaved = savedIds.has(art.article);
                  return (
                    <tr key={art.rank} className="hover:bg-blue-50/20 dark:hover:bg-blue-900/10 transition-colors">
                      <td className="px-4 py-3.5 text-center shrink-0 font-bold text-gray-400 dark:text-gray-600">{art.rank}</td>
                      <td className="px-4 py-3.5 font-medium whitespace-nowrap text-gray-800 dark:text-gray-100">{art.article}</td>
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
