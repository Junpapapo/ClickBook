import { TrendingUp } from "lucide-react";
import type { Bookmark } from "@/shared/types";
import { useLang } from "@/shared/LanguageContext";

interface Props {
  bookmarks: Bookmark[];
  count?: number;
  onOpenBookmark?: (b: Bookmark) => void;
}

export default function TopSitesWidget({ bookmarks, count = 5, onOpenBookmark }: Props) {
  const { lang } = useLang();

  const ranked = [...bookmarks]
    .sort((a, b) => (b.visitCount || 0) - (a.visitCount || 0))
    .slice(0, count);

  const handleOpen = (b: Bookmark) => {
    if (onOpenBookmark) {
      onOpenBookmark(b);
    } else {
      chrome.runtime.sendMessage({ type: "INCREMENT_VISIT", id: b.id });
      window.open(b.url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl p-4 shadow-figma-sm select-none">
      {/* ── 헤더 ── */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <TrendingUp size={14} className="text-amber-500" />
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            {lang === "ko" ? "인기 탑 사이트" : "TOP SITES"}
          </span>
        </div>
        <span className="text-[9.5px] text-slate-400 dark:text-slate-500">
          {lang === "ko" ? "방문 순위" : "By Visits"}
        </span>
      </div>

      {/* ── 랭킹 목록 ── */}
      {ranked.length === 0 ? (
        <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center py-3">
          {lang === "ko" ? "방문 기록이 없습니다." : "No visits recorded yet."}
        </p>
      ) : (
        <div className="space-y-1.5">
          {ranked.map((b, i) => (
            <div
              key={b.id}
              onClick={() => handleOpen(b)}
              className="flex items-center gap-2.5 p-2 rounded-xl bg-white/50 dark:bg-slate-900/40 hover:bg-white/80 dark:hover:bg-slate-900/70 border border-slate-200/40 dark:border-slate-700/40 transition-all cursor-pointer group"
            >
              <span
                className={`text-xs font-black w-4 text-center shrink-0 ${
                  i === 0
                    ? "text-amber-500"
                    : i === 1
                    ? "text-slate-400 dark:text-slate-300"
                    : i === 2
                    ? "text-amber-700 dark:text-amber-400"
                    : "text-slate-400 dark:text-slate-600"
                }`}
              >
                {i + 1}
              </span>

              <div className="w-4 h-4 rounded-md bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                <img
                  src={
                    b.favicon ||
                    (() => {
                      let d = b.domain || "";
                      if (!d) {
                        try {
                          d = new URL(b.url).hostname;
                        } catch {
                          d = "";
                        }
                      }
                      return d ? `https://www.google.com/s2/favicons?domain=${d}&sz=32` : "";
                    })()
                  }
                  alt=""
                  className="w-3.5 h-3.5 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>

              <span className="text-[11.5px] font-semibold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate flex-1">
                {b.title}
              </span>

              <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 font-medium">
                {b.visitCount || 0}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
