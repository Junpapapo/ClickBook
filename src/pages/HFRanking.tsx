import { useEffect, useState } from "react";
import { fetchHFTrending } from "@/shared/rankingApi";
import type { HFModel } from "@/shared/types";
import { Sparkles, Heart, Download, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { useLang } from "@/shared/LanguageContext";

export default function HFRankingPage() {
  const { t, lang } = useLang();
  const [models, setModels] = useState<HFModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchHFTrending();
      setModels(data);
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
          <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <Sparkles className="text-yellow-500 shrink-0 w-6 h-6" />
            {t("hfRanking")}
          </h1>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {lang === "ko" ? "Hugging Face에서 지금 가장 주목받는 AI 모델들입니다." : 
             lang === "ja" ? "Hugging Faceで現在注目されているAIモデルのランキングです。" : 
             "Trending AI models on Hugging Face right now."}
          </p>
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
                <th className="px-4 py-3 text-center w-12">{t("thRank")}</th>
                <th className="px-4 py-3 text-left">Model Name</th>
                <th className="px-4 py-3 text-right w-24">Likes</th>
                <th className="px-4 py-3 text-right w-24">Downloads</th>
                <th className="px-4 py-3 text-center w-32">Last Updated</th>
                <th className="px-4 py-3 text-center w-24">Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-surface-800">
              {models.map((m, i) => (
                <tr key={m.id} className="hover:bg-yellow-50/20 dark:hover:bg-yellow-950/10 transition-colors">
                  <td className="px-4 py-3.5 text-center font-bold text-gray-400 dark:text-gray-600">{i + 1}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-800 dark:text-gray-100">{m.repo_name}</span>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-400 dark:text-gray-600">
            <Loader2 size={30} className="animate-spin text-yellow-500" />
            <p className="text-xs font-semibold">Scanning Models...</p>
          </div>
        )}
      </div>
    </div>
  );
}
