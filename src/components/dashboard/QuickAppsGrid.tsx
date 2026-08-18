import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import type { Bookmark } from "@/shared/types";
import { useLang } from "@/shared/LanguageContext";

interface Props {
  bookmarks: Bookmark[];
  onOpenBookmark: (b: Bookmark) => void;
  onAddNewApp?: () => void;
}

export type CategoryFilter = "ALL" | "FAVORITES" | "DEV" | "DESIGN" | "AI" | "WORK";

function getSafeHostname(url: string, fallbackDomain: string): string {
  if (fallbackDomain) return fallbackDomain;
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

export default function QuickAppsGrid({ bookmarks, onOpenBookmark, onAddNewApp }: Props) {
  const { t } = useLang();
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("ALL");

  const categories: { id: CategoryFilter; label: string }[] = [
    { id: "ALL", label: t("quickAppsAll") },
    { id: "FAVORITES", label: t("quickAppsFavorites") },
    { id: "DEV", label: "DEV" },
    { id: "DESIGN", label: "DESIGN" },
    { id: "AI", label: "AI" },
    { id: "WORK", label: "WORK" },
  ];

  // 카테고리 필터링 로직
  const filteredApps = useMemo(() => {
    // 방문 횟수 또는 최근 저장 순으로 상위 앱 정렬
    const sorted = [...bookmarks].sort((a, b) => (b.visitCount || 0) - (a.visitCount || 0));

    if (activeCategory === "ALL") {
      return sorted.slice(0, 12);
    }

    if (activeCategory === "FAVORITES") {
      return sorted.filter((b) => (b.visitCount || 0) >= 3 || (b.tags && b.tags.includes("favorite"))).slice(0, 12);
    }

    const keyword = activeCategory.toLowerCase();
    return sorted.filter((b) => {
      const matchTag = b.tags?.some((t) => t.toLowerCase().includes(keyword));
      const matchTitle = b.title.toLowerCase().includes(keyword);
      const matchUrl = b.url.toLowerCase().includes(keyword);
      const matchDomain = (b.domain || "").toLowerCase().includes(keyword);
      return matchTag || matchTitle || matchUrl || matchDomain;
    }).slice(0, 12);
  }, [bookmarks, activeCategory]);

  return (
    <div className="w-full select-none">
      {/* ── 상단 헤더 & 카테고리 칩 필터 ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <span>{t("quickAppsTitle")}</span>
          </h2>
          {onAddNewApp && (
            <button
              onClick={onAddNewApp}
              className="p-1 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold transition-all cursor-pointer"
              title={t("quickAppsAdd")}
            >
              <Plus size={13} />
            </button>
          )}
        </div>

        {/* 카테고리 필터 탭 */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all duration-150 shrink-0 cursor-pointer ${
                activeCategory === cat.id
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/40"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 글래스모피즘 앱 아이콘 그리드 ── */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {/* 앱 추가 카드 */}
        {onAddNewApp && (
          <button
            onClick={onAddNewApp}
            className="group flex flex-col items-center justify-center gap-2 p-3 bg-white/40 dark:bg-slate-800/40 hover:bg-white/70 dark:hover:bg-slate-700/50 backdrop-blur-md border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-figma-md cursor-pointer aspect-square"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:scale-110 transition-all">
              <Plus size={20} />
            </div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 truncate w-full text-center">
              {t("quickAppsAdd")}
            </span>
          </button>
        )}

        {/* 북마크 앱 아이콘들 */}
        {filteredApps.map((b) => {
          const hostname = getSafeHostname(b.url, b.domain);
          return (
            <div
              key={b.id}
              onClick={() => onOpenBookmark(b)}
              className="group relative flex flex-col items-center justify-center gap-2 p-3 bg-white/60 dark:bg-slate-800/60 hover:bg-white/85 dark:hover:bg-slate-700/70 backdrop-blur-md border border-white/60 dark:border-white/10 hover:border-indigo-400/80 dark:hover:border-indigo-500/60 rounded-2xl shadow-figma-sm hover:shadow-figma-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer aspect-square"
            >
              {/* 파비콘 아이콘 컨테이너 */}
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900/80 shadow-xs border border-slate-100 dark:border-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform duration-200 overflow-hidden">
                <img
                  src={b.favicon || (hostname ? `https://www.google.com/s2/favicons?domain=${hostname}&sz=64` : "")}
                  alt=""
                  className="w-5 h-5 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236366f1' stroke-width='2'><circle cx='12' cy='12' r='10'/></svg>";
                  }}
                />
              </div>

              {/* 타이틀 */}
              <span className="text-[11.5px] font-semibold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate w-full text-center px-1">
                {b.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
