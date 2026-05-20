import { TrendingUp, ExternalLink } from "lucide-react";
import type { Bookmark } from "@/shared/types";
import { useLang } from "@/shared/LanguageContext";

function handleOpen(b: Bookmark) {
  chrome.runtime.sendMessage({ type: "INCREMENT_VISIT", id: b.id });
  window.open(b.url, "_blank", "noopener,noreferrer");
}

interface Props {
  bookmarks: Bookmark[];
  count?: number;
}

export default function RankingWidget({ bookmarks, count = 5 }: Props) {
  const { t } = useLang();
  const ranked = [...bookmarks]
    .sort((a, b) => b.visitCount - a.visitCount)
    .slice(0, count);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={15} className="text-emerald-400" />
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t("rankingTitle")}</h2>
      </div>

      {ranked.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-gray-600">{t("rankingEmpty")}</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {ranked.map((b, i) => (
            <li key={b.id} className="flex items-center gap-3">
              <span className={`text-xs font-bold w-5 text-right shrink-0 ${
                i === 0 ? "text-amber-400" : i === 1 ? "text-gray-400" : i === 2 ? "text-orange-600" : "text-gray-600"
              }`}>
                {i + 1}
              </span>
              <img
                src={b.favicon}
                alt=""
                width={14}
                height={14}
                className="rounded-sm shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <button
                onClick={() => handleOpen(b)}
                className="text-sm text-left text-gray-700 dark:text-gray-300 hover:text-indigo-500 dark:hover:text-indigo-300 truncate flex-1 transition-colors"
              >
                {b.title}
              </button>
              <span className="text-[10px] text-gray-500 dark:text-gray-600 shrink-0">{t("rankingVisits", { n: b.visitCount })}</span>
              <ExternalLink size={11} className="text-gray-400 dark:text-gray-600 shrink-0" />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
