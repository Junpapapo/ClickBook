import { useEffect, useState } from "react";
import { fetchWikiRanking } from "@/shared/rankingApi";
import type { WikiArticle } from "@/shared/types";
import { Book, Eye, Globe, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { useLang } from "@/shared/LanguageContext";

export default function WikiRankingPage() {
  const { t, lang } = useLang();
  const [articles, setArticles] = useState<WikiArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      // mapping our app lang to wiki lang code
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
          <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <Book className="text-blue-500 shrink-0 w-6 h-6" />
            {t("wikiRanking")}
          </h1>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {lang === "ko" ? "위키백과에서 현재 가장 많이 읽히고 있는 문서 랭킹입니다." : 
             lang === "ja" ? "Wikipediaで現在最も読まれている記事のランキングです。" : 
             "The most read articles on Wikipedia right now."}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-surface-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-surface-700">
           <Globe size={14} className="text-gray-400" />
           <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
             {lang === "ko" ? "한국어 위키백과" : lang === "ja" ? "日本語版 Wikipedia" : "English Wikipedia"}
           </span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-lg flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white dark:bg-surface-900 border border-gray-150 dark:border-surface-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="bg-gray-50 dark:bg-surface-800/50 border-b border-gray-150 dark:border-surface-800 text-gray-500 uppercase tracking-wider font-semibold">
                <th className="px-4 py-3 text-center w-16">{t("thRank")}</th>
                <th className="px-4 py-3 text-left">{lang === "ko" ? "문서 제목" : lang === "ja" ? "記事タイトル" : "Article Title"}</th>
                <th className="px-4 py-3 text-right w-40">{lang === "ko" ? "조회수" : lang === "ja" ? "閲覧数" : "Page Views"}</th>
                <th className="px-4 py-3 text-center w-24">Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-surface-800">
              {articles.map((art) => (
                <tr key={art.rank} className="hover:bg-blue-50/20 dark:hover:bg-blue-900/10 transition-colors">
                  <td className="px-4 py-3.5 text-center font-bold text-gray-400 dark:text-gray-600">{art.rank}</td>
                  <td className="px-4 py-3.5 font-medium text-gray-800 dark:text-gray-100">{art.article}</td>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-400 dark:text-gray-600">
            <Loader2 size={30} className="animate-spin text-blue-500" />
            <p className="text-xs font-semibold">Fetching Data...</p>
          </div>
        )}
      </div>
    </div>
  );
}
