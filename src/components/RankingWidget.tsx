import { useState, useEffect, useCallback } from "react";
import { TrendingUp, Globe2, ExternalLink, Plus, Check, Star } from "lucide-react";
import type { Bookmark } from "@/shared/types";
import { useLang } from "@/shared/LanguageContext";

interface BrowserTopSite {
  title: string;
  url: string;
  originalUrl?: string;
  isBookmarked?: boolean;
}

interface Props {
  bookmarks: Bookmark[];
  count?: number;
  onRefresh?: () => void;
}

export default function RankingWidget({ bookmarks, count = 5, onRefresh }: Props) {
  const { t, lang } = useLang();
  const [browserTopSites, setBrowserTopSites] = useState<BrowserTopSite[]>([]);
  const [addingUrl, setAddingUrl] = useState<string | null>(null);
  const [toastText, setToastText] = useState<string | null>(null);

  // 1. 클릭북 북마크 랭킹 Top N
  const rankedBookmarks = [...bookmarks]
    .sort((a, b) => (b.visitCount || 0) - (a.visitCount || 0))
    .slice(0, count);

  // 2. 브라우저 Top Sites 불러오기
  const loadBrowserTopSites = useCallback(() => {
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: "BUDDY_GET_TOP_SITES" }, (res) => {
        if (res && res.success && Array.isArray(res.data)) {
          const list: BrowserTopSite[] = res.data.slice(0, count);
          setBrowserTopSites(list);
        }
      });
    }
  }, [count]);

  useEffect(() => {
    loadBrowserTopSites();
  }, [loadBrowserTopSites, bookmarks]);

  // 클릭북 북마크 열기
  const handleOpenBookmark = (b: Bookmark) => {
    chrome.runtime.sendMessage({ type: "INCREMENT_VISIT", id: b.id });
    window.open(b.url, "_blank", "noopener,noreferrer");
  };

  // 브라우저 Top Site 열기
  const handleOpenBrowserSite = (site: BrowserTopSite) => {
    const targetUrl = site.originalUrl || site.url;
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  // 브라우저 Top Site 즉석 북마크 추가
  const handleAddBookmark = async (site: BrowserTopSite, e: React.MouseEvent) => {
    e.stopPropagation();
    const targetUrl = site.originalUrl || site.url;
    setAddingUrl(targetUrl);

    try {
      const res = await new Promise<{ success: boolean; data?: any }>((resolve) => {
        chrome.runtime.sendMessage(
          {
            type: "BUDDY_SAVE_BOOKMARK",
            url: targetUrl,
            title: site.title || targetUrl,
          },
          (response) => resolve(response || { success: false })
        );
      });

      if (res.success) {
        setToastText(t("toastBookmarkAdded"));
        setTimeout(() => setToastText(null), 2500);
        // 로컬 상태 즉시 갱신
        setBrowserTopSites((prev) =>
          prev.map((s) => (s.url === site.url ? { ...s, isBookmarked: true } : s))
        );
        onRefresh?.();
      }
    } catch (err) {
      console.error("Failed to add bookmark from top site:", err);
    } finally {
      setAddingUrl(null);
    }
  };

  return (
    <div className="relative">
      {/* 토스트 알림 */}
      {toastText && (
        <div className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2 px-3.5 py-2 rounded-xl shadow-figma-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check size={14} className="text-emerald-500 shrink-0" />
          <span>{toastText}</span>
        </div>
      )}

      {/* 2-Grid 레이아웃 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-8">
        {/* ── 좌측: 클릭북 인기 북마크 ── */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between h-7 mb-3 pb-2 border-b border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center gap-1.5 min-w-0">
              <TrendingUp size={15} className="text-emerald-500 shrink-0" />
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 truncate">
                {t("topBookmarksTitle")}
              </h3>
            </div>
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 shrink-0">
              {lang === "ko" ? "방문 순위 Top 5" : "By Visits"}
            </span>
          </div>

          {rankedBookmarks.length === 0 ? (
            <div className="h-[188px] flex items-center justify-center">
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
                {t("rankingEmpty")}
              </p>
            </div>
          ) : (
            <ol className="space-y-1.5">
              {rankedBookmarks.map((b, i) => (
                <li
                  key={b.id}
                  onClick={() => handleOpenBookmark(b)}
                  className="h-9 flex items-center gap-2.5 px-2.5 rounded-xl bg-white/40 dark:bg-slate-900/30 hover:bg-white/80 dark:hover:bg-slate-900/70 border border-slate-200/40 dark:border-white/5 transition-all cursor-pointer group"
                >
                  <span
                    className={`text-xs font-black w-4 text-center shrink-0 ${
                      i === 0
                        ? "text-amber-500 font-extrabold"
                        : i === 1
                        ? "text-slate-400 dark:text-slate-300"
                        : i === 2
                        ? "text-orange-500"
                        : "text-slate-400 dark:text-slate-500 font-medium"
                    }`}
                  >
                    {i + 1}
                  </span>

                  <img
                    src={b.favicon || `https://www.google.com/s2/favicons?domain=${encodeURIComponent(b.url)}&sz=32`}
                    alt=""
                    width={15}
                    height={15}
                    className="rounded-sm shrink-0 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(b.url)}&sz=32`;
                    }}
                  />

                  <span className="text-xs font-medium text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate flex-1 transition-colors">
                    {b.title}
                  </span>

                  <span className="h-5 flex items-center text-[10px] font-bold text-slate-400 dark:text-slate-500 tabular-nums shrink-0">
                    {b.visitCount || 0}x
                  </span>

                  <ExternalLink
                    size={11}
                    className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-300 transition-colors shrink-0 ml-0.5"
                  />
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* ── 우측: 브라우저 자주 방문한 사이트 (버디 Top Sites) ── */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between h-7 mb-3 pb-2 border-b border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center gap-1.5 min-w-0">
              <Globe2 size={15} className="text-amber-500 shrink-0" />
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 truncate">
                {t("browserTopSitesTitle")}
              </h3>
            </div>
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 shrink-0">
              {lang === "ko" ? "브라우저 추천 Top 5" : "Browser Top 5"}
            </span>
          </div>

          {browserTopSites.length === 0 ? (
            <div className="h-[188px] flex items-center justify-center">
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
                {t("browserTopSitesEmpty")}
              </p>
            </div>
          ) : (
            <ol className="space-y-1.5">
              {browserTopSites.map((site, i) => {
                const isBookmarked =
                  site.isBookmarked ||
                  bookmarks.some((b) => {
                    try {
                      return new URL(b.url).origin === new URL(site.url).origin;
                    } catch {
                      return false;
                    }
                  });

                const isAdding = addingUrl === (site.originalUrl || site.url);

                return (
                  <li
                    key={i}
                    onClick={() => handleOpenBrowserSite(site)}
                    className="h-9 flex items-center gap-2.5 px-2.5 rounded-xl bg-white/40 dark:bg-slate-900/30 hover:bg-white/80 dark:hover:bg-slate-900/70 border border-slate-200/40 dark:border-white/5 transition-all cursor-pointer group"
                  >
                    <span
                      className={`text-xs font-black w-4 text-center shrink-0 ${
                        i === 0
                          ? "text-amber-500 font-extrabold"
                          : i === 1
                          ? "text-slate-400 dark:text-slate-300"
                          : i === 2
                          ? "text-orange-500"
                          : "text-slate-400 dark:text-slate-500 font-medium"
                      }`}
                    >
                      {i + 1}
                    </span>

                    <img
                      src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(site.url)}&sz=32`}
                      alt=""
                      width={15}
                      height={15}
                      className="rounded-sm shrink-0 object-contain"
                    />

                    <span className="text-xs font-medium text-slate-700 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 truncate flex-1 transition-colors">
                      {site.title || site.url}
                    </span>

                    {/* 등록 상태 / 북마크 추가 버튼 */}
                    {isBookmarked ? (
                      <span
                        className="h-5 flex items-center gap-1 px-1.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/70 dark:border-amber-900/50 text-[10px] font-bold shrink-0"
                        title={t("alreadyBookmarked")}
                      >
                        <Star size={9.5} className="fill-amber-500 text-amber-500" />
                        <span className="hidden sm:inline">{t("alreadyBookmarked")}</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handleAddBookmark(site, e)}
                        disabled={isAdding}
                        className="h-5 flex items-center gap-1 px-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/50 rounded-lg text-[10px] font-bold transition-all shadow-2xs hover:scale-102 active:scale-98 shrink-0 cursor-pointer"
                        title={t("addBookmarkBtn")}
                      >
                        {isAdding ? (
                          <div className="w-2.5 h-2.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Plus size={10} strokeWidth={2.5} />
                        )}
                        <span>{t("addBookmarkBtn")}</span>
                      </button>
                    )}

                    <ExternalLink
                      size={11}
                      className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-300 transition-colors shrink-0 ml-0.5"
                    />
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
