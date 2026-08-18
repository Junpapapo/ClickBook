import { LayoutGrid, Trophy, Pencil, Globe2, Info, HelpCircle, ChevronRight, Image as ImageIcon, Settings2 } from "lucide-react";
import SmartWidgetPanel from "@/components/SmartWidgetPanel";
import RankingPanel from "@/components/RankingPanel";
import BookmarkEditPanel from "@/components/BookmarkEditPanel";
import ChromeBookmarkPanel from "@/components/ChromeBookmarkPanel";
import BookmarkInfoPanel from "@/components/BookmarkInfoPanel";
import GuidePanel from "@/components/GuidePanel";
import type { Bookmark, Folder, BookmarkMemo, TodoTask } from "@/shared/types";
import { useLang } from "@/shared/LanguageContext";

export type RightPanelId = "widgets" | "ranking" | "edit" | "chrome" | "info" | "guide";

interface Props {
  activePanel: RightPanelId | null;
  onToggle: (panel: RightPanelId) => void;
  onClose: () => void;
  bookmarks: Bookmark[];
  folders: Folder[];
  onRefresh: () => void;
  infoBookmark?: Bookmark | null;
  infoMemo?: BookmarkMemo;
  memoCount?: number;
  urgentTasks?: TodoTask[];
  onSelectTodoBoard?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenOnboarding?: () => void;
  onNavigate?: (page: any, folderId?: string | null) => void;
  onOpenSettings?: () => void;
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
  memoCount = 0,
  urgentTasks = [],
  onSelectTodoBoard,
  onOpenCommandPalette,
  onOpenOnboarding,
  onNavigate,
  onOpenSettings,
}: Props) {
  const { t, lang } = useLang();

  const RAIL_ITEMS: { id: RightPanelId; icon: React.ReactNode; label: string; activeClass: string }[] = [
    {
      id: "widgets",
      icon: <LayoutGrid size={16} />,
      label: lang === "ko" ? "스마트 위젯 (프로필/날씨/태스크)" : "Smart Widgets",
      activeClass: "text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10",
    },
    {
      id: "ranking",
      icon: <Trophy size={16} />,
      label: lang === "ko" ? "탑사이트 & 랭킹" : t("rankingPanelLabel"),
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
      label: "Site Info",
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
    <div className="relative z-30 flex h-full shrink-0">
      {/* 展開パネル */}
      <div
        className={`relative shrink-0 transition-all duration-300 ease-in-out border-l border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-figma-md ${
          activePanel ? (activePanel === "widgets" ? "w-80" : "w-72") : "w-0 overflow-hidden"
        }`}
      >
        {/* 열린 패널 왼쪽 상단 슬라이드 닫기 탭 버튼 (패널 일체형 플랜지 탭) */}
        {activePanel && (
          <button
            onClick={onClose}
            className="absolute top-4 -left-6 z-40 w-6 h-12 bg-white/95 dark:bg-slate-900/95 hover:bg-white dark:hover:bg-slate-800 border-y border-l border-r-0 border-slate-200/90 dark:border-white/15 rounded-l-2xl flex items-center justify-center shadow-figma-md text-slate-500 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300 transition-all cursor-pointer group"
            title={lang === "ko" ? "패널 접기" : "Collapse Panel"}
          >
            <ChevronRight size={18} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        )}

        <div className={`${activePanel === "widgets" ? "w-80" : "w-72"} h-full flex flex-col overflow-hidden`}>
          {activePanel === "widgets" && (
            <SmartWidgetPanel
              bookmarks={bookmarks}
              onClose={onClose}
              memoCount={memoCount}
              urgentTasks={urgentTasks}
              onSelectTodoBoard={onSelectTodoBoard}
              onRefresh={onRefresh}
              onNavigate={onNavigate}
            />
          )}
          {activePanel === "ranking" && (
            <RankingPanel
              bookmarks={bookmarks}
              onClose={onClose}
            />
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
            <BookmarkInfoPanel
              bookmark={infoBookmark || null}
              memo={infoMemo}
              folders={folders}
              onClose={onClose}
              onRefresh={onRefresh}
            />
          )}
          {activePanel === "guide" && (
            <GuidePanel
              onClose={onClose}
              onOpenCommandPalette={onOpenCommandPalette}
              onOpenOnboarding={onOpenOnboarding}
            />
          )}
        </div>
      </div>

      {/* アイコンレール */}
      <div className="w-12 flex flex-col items-center gap-1.5 py-3 border-l border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shrink-0 shadow-figma-sm">
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

        {/* 맨 하단: 배경화면 순환 버튼 및 대시보드 설정 모달 열기 버튼 */}
        <div className="mt-auto pt-2 border-t border-slate-200/60 dark:border-slate-800 flex flex-col items-center gap-1.5 w-full">
          {/* 배경화면 변경 버튼 */}
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent("TRIGGER_WALLPAPER_REFRESH"));
            }}
            title={t("changeWallpaperTooltip")}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer group"
          >
            <ImageIcon size={16} className="transition-transform group-hover:scale-110 group-active:rotate-12" />
          </button>

          {/* 대시보드 설정 열기 버튼 */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              title={t("dashboardSettingsTooltip")}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer group"
            >
              <Settings2 size={16} className="transition-transform group-hover:rotate-45" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
