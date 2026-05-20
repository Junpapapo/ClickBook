import { Trophy, ExternalLink } from "lucide-react";
import type { Bookmark } from "@/shared/types";
import { useLang } from "@/shared/LanguageContext";

interface Props {
  bookmarks: Bookmark[];
  onClose: () => void;
}

const MEDALS: Record<number, string> = { 0: "🥇", 1: "🥈", 2: "🥉" };

export default function RankingPanel({ bookmarks, onClose }: Props) {
  const { t } = useLang();
  const ranked = [...bookmarks]
    .sort((a, b) => b.visitCount - a.visitCount)
    .slice(0, 20);

  return (
    <div className="w-72 h-full flex flex-col">
      {/* ヘッダー（タイトルクリックで閉じる） */}
      <button
        onClick={onClose}
        className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-surface-700 shrink-0 w-full text-left group hover:bg-gray-50 dark:hover:bg-surface-800 transition-colors"
        title={t("rankingClose")}
      >
        <Trophy size={14} className="text-amber-400" />
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 flex-1">{t("rankingTitle")}</span>
        <span className="text-[10px] text-gray-400 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">閉じる</span>
      </button>

        {/* リスト */}
        <div className="flex-1 overflow-y-auto py-2">
          {ranked.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-600">
              <Trophy size={28} className="mb-2 opacity-30" />
              <p className="text-xs">{t("rankingEmpty")}</p>
            </div>
          ) : (
            <ol className="flex flex-col">
              {ranked.map((b, i) => (
                <li key={b.id}>
                  <a
                    href={b.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => chrome.runtime.sendMessage({ type: "INCREMENT_VISIT", id: b.id })}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-surface-800 transition-colors group"
                  >
                    <span className="w-6 text-center shrink-0">
                      {MEDALS[i] ?? (
                        <span className="text-xs font-bold text-gray-400 dark:text-gray-600">{i + 1}</span>
                      )}
                    </span>
                    <img
                      src={b.favicon}
                      alt=""
                      width={14}
                      height={14}
                      className="rounded-sm shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                        {b.title}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-600 truncate">{b.domain}</p>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-0.5">
                      <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">{b.visitCount}</span>
                      <span className="text-[9px] text-gray-400 dark:text-gray-600">{t("rankingVisits", { n: b.visitCount })}</span>
                    </div>
                    <ExternalLink size={10} className="shrink-0 text-gray-300 dark:text-gray-700 group-hover:text-indigo-400 transition-colors" />
                  </a>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* フッター */}
        <div className="px-4 py-2 border-t border-gray-200 dark:border-surface-700 shrink-0">
          <p className="text-[10px] text-gray-400 dark:text-gray-600 text-center">
            {t("rankingFooter")}
          </p>
        </div>
    </div>
  );
}
