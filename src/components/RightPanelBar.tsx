import { Trophy, Pencil, Globe2, Info } from "lucide-react";
import RankingPanel from "@/components/RankingPanel";
import BookmarkEditPanel from "@/components/BookmarkEditPanel";
import ChromeBookmarkPanel from "@/components/ChromeBookmarkPanel";
import BookmarkInfoPanel from "@/components/BookmarkInfoPanel";
import type { Bookmark, Folder, BookmarkMemo } from "@/shared/types";
import { useLang } from "@/shared/LanguageContext";

export type RightPanelId = "ranking" | "edit" | "chrome" | "info";

interface Props {
  activePanel: RightPanelId | null;
  onToggle: (panel: RightPanelId) => void;
  onClose: () => void;
  bookmarks: Bookmark[];
  folders: Folder[];
  onRefresh: () => void;
  infoBookmark?: Bookmark | null;
  infoMemo?: BookmarkMemo;
}

export default function RightPanelBar({
  activePanel,
  onToggle,
  onClose,
  bookmarks,
  folders,
  onRefresh,
  infoBookmark,
  infoMemo,
}: Props) {
  const { t } = useLang();
  const RAIL_ITEMS: { id: RightPanelId; icon: React.ReactNode; label: string; activeClass: string }[] = [
    {
      id: "ranking",
      icon: <Trophy size={16} />,
      label: t("rankingPanelLabel"),
      activeClass: "text-amber-400 bg-amber-50 dark:bg-amber-500/10",
    },
    {
      id: "edit",
      icon: <Pencil size={16} />,
      label: t("editPanelLabel"),
      activeClass: "text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10",
    },
    {
      id: "chrome",
      icon: <Globe2 size={16} />,
      label: t("chromePanelLabel"),
      activeClass: "text-sky-400 bg-sky-50 dark:bg-sky-500/10",
    },
    {
      id: "info",
      icon: <Info size={16} />,
      label: "Site Info", // Can add i18n later
      activeClass: "text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10",
    },
  ];
  return (
    <div className="flex h-full shrink-0">
      {/* 展開パネル */}
      <div
        className={`shrink-0 overflow-hidden transition-all duration-300 ease-in-out border-l border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-900 ${
          activePanel ? "w-72" : "w-0"
        }`}
      >
        <div className="w-72 h-full flex flex-col">
          {activePanel === "ranking" && (
            <RankingPanel bookmarks={bookmarks} onClose={onClose} />
          )}
          {activePanel === "edit" && (
            <BookmarkEditPanel
              bookmarks={bookmarks}
              folders={folders}
              onRefresh={onRefresh}
              onClose={onClose}
            />
          )}
          {activePanel === "chrome" && (
            <ChromeBookmarkPanel onRefresh={onRefresh} onClose={onClose} fullHeight />
          )}
          {activePanel === "info" && (
            <BookmarkInfoPanel bookmark={infoBookmark || null} memo={infoMemo} onClose={onClose} />
          )}
        </div>
      </div>

      {/* アイコンレール */}
      <div className="w-12 flex flex-col items-center gap-1 py-3 border-l border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-900 shrink-0">
        {RAIL_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onToggle(item.id)}
            title={item.label}
            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
              activePanel === item.id
                ? item.activeClass
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-surface-800"
            }`}
          >
            {item.icon}
          </button>
        ))}
      </div>
    </div>
  );
}
