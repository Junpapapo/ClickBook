import { Trophy, Pencil, Globe2, Info, HelpCircle } from "lucide-react";
import RankingPanel from "@/components/RankingPanel";
import BookmarkEditPanel from "@/components/BookmarkEditPanel";
import ChromeBookmarkPanel from "@/components/ChromeBookmarkPanel";
import BookmarkInfoPanel from "@/components/BookmarkInfoPanel";
import GuidePanel from "@/components/GuidePanel";
import type { Bookmark, Folder, BookmarkMemo } from "@/shared/types";
import { useLang } from "@/shared/LanguageContext";

export type RightPanelId = "ranking" | "edit" | "chrome" | "info" | "guide";

interface Props {
  activePanel: RightPanelId | null;
  onToggle: (panel: RightPanelId) => void;
  onClose: () => void;
  bookmarks: Bookmark[];
  folders: Folder[];
  onRefresh: () => void;
  infoBookmark?: Bookmark | null;
  infoMemo?: BookmarkMemo;
  onOpenCommandPalette?: () => void;
  onOpenOnboarding?: () => void;
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
  onOpenCommandPalette,
  onOpenOnboarding,
}: Props) {
  const { t, lang } = useLang();
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
    {
      id: "guide",
      icon: <HelpCircle size={16} />,
      label: lang === "ko" ? "단축키 & 가이드" : lang === "ja" ? "ガイド＆ショートカット" : "Guide & Hotkeys",
      activeClass: "text-purple-400 bg-purple-50 dark:bg-purple-500/10",
    },
  ];
  return (
    <div className="flex h-full shrink-0">
      {/* 展開パネル */}
      <div
        className={`shrink-0 overflow-hidden transition-all duration-300 ease-in-out border-l border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 ${
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
            <ChromeBookmarkPanel onRefresh={onClose} onClose={onClose} fullHeight />
          )}
          {activePanel === "info" && (
            <BookmarkInfoPanel bookmark={infoBookmark || null} memo={infoMemo} folders={folders} onClose={onClose} onRefresh={onRefresh} />
          )}
          {activePanel === "guide" && (
            <GuidePanel onClose={onClose} onOpenCommandPalette={onOpenCommandPalette} onOpenOnboarding={onOpenOnboarding} />
          )}
        </div>
      </div>

      {/* アイコンレール */}
      <div className="w-12 flex flex-col items-center gap-1 py-3 border-l border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        {RAIL_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onToggle(item.id)}
            title={item.label}
            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all cursor-pointer ${
              activePanel === item.id
                ? item.activeClass
                : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {item.icon}
          </button>
        ))}
      </div>
    </div>
  );
}

