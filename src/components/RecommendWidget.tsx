import { useState, useEffect } from "react";
import { Sparkles, Plus, Loader2 } from "lucide-react";
import { useLang } from "@/shared/LanguageContext";
import type { MessageResponse, Bookmark } from "@/shared/types";

interface RecommendedSite {
  title: string;
  url: string;
}

interface Props {
  keyword: string;
  count: number;
  onRefresh: () => void;
  onLoadingChange?: (loading: boolean) => void;
}

export default function RecommendWidget({ keyword, count, onRefresh, onLoadingChange }: Props) {
  const { t } = useLang();
  const [recommendations, setRecommendations] = useState<RecommendedSite[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingUrl, setAddingId] = useState<string | null>(null);

  useEffect(() => { onLoadingChange?.(loading); }, [loading, onLoadingChange]);

  useEffect(() => {
    if (!keyword.trim()) {
      setRecommendations([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await chrome.runtime.sendMessage({
          type: "RECOMMEND_SITES",
          keyword,
          count,
        }) as MessageResponse;
        if (res.success && Array.isArray(res.data)) {
          setRecommendations(res.data);
        } else {
          setRecommendations([]);
        }
      } catch (err) {
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    }, 600); // 디바운스

    return () => clearTimeout(timer);
  }, [keyword, count]);

  async function handleAdd(site: RecommendedSite) {
    setAddingId(site.url);
    try {
      await chrome.runtime.sendMessage({
        type: "ADD_BOOKMARK",
        url: site.url,
        title: site.title,
        folderId: "other", // 기본적으로 '기타' 폴더로 추가
      });
      onRefresh();
    } finally {
      setAddingId(null);
    }
  }

  if (!keyword.trim()) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={16} className="text-yellow-500" />
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t("recommendTitle")}
        </h2>
        <span className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[9px] font-bold rounded uppercase tracking-wider">
          Beta
        </span>
        {loading && <Loader2 size={14} className="animate-spin text-gray-400" />}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="bg-gray-50 dark:bg-surface-800/50 border border-gray-100 dark:border-surface-700 rounded-xl p-3 animate-pulse">
              <div className="flex items-start gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-surface-700 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-2 bg-gray-200 dark:bg-surface-700 rounded w-3/4" />
                  <div className="h-2 bg-gray-200 dark:bg-surface-700 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : recommendations.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {recommendations.map((site, i) => (
            <div
              key={i}
              className="group relative bg-white dark:bg-surface-800 border border-gray-100 dark:border-surface-700 rounded-xl p-3 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden"
              onClick={() => window.open(site.url, "_blank")}
            >
              <div className="flex items-start gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-surface-700 flex items-center justify-center shrink-0 border border-gray-100 dark:border-surface-600">
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${new URL(site.url).hostname}&sz=64`}
                    alt=""
                    className="w-5 h-5"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-bold text-gray-800 dark:text-gray-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    {site.title}
                  </h3>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
                    {new URL(site.url).hostname}
                  </p>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAdd(site);
                }}
                disabled={addingUrl === site.url}
                className="absolute top-2 right-2 p-1.5 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95 shadow-md z-10"
                title={t("addSite")}
              >
                {addingUrl === site.url ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Plus size={14} strokeWidth={3} />
                )}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-surface-800/40 rounded-xl p-6 text-center border border-dashed border-gray-200 dark:border-surface-700">
          <p className="text-xs text-gray-400 dark:text-gray-500">{t("recommendEmpty")}</p>
        </div>
      )}
    </section>
  );
}
