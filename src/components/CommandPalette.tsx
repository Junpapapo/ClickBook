import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  Command,
  LayoutDashboard,
  BookOpen,
  GitFork,
  CheckSquare,
  FileText,
  Calendar as CalendarIcon,
  Tag,
  MapPin,
  Github,
  Sparkles,
  Sun,
  Moon,
  Settings,
  HelpCircle,
  ArrowRight,
  Bookmark as BookmarkIcon,
  X,
} from "lucide-react";
import type { PageId, Bookmark } from "@/shared/types";
import { useLang } from "@/shared/LanguageContext";
import { useTheme } from "@/shared/ThemeContext";
import { smartMatch } from "@/utils/hangulUtils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: PageId) => void;
  onToggleTheme?: () => void;
  onOpenSettings?: () => void;
  onOpenGuide?: () => void;
  onAiOrganize?: () => void;
  onAutoTag?: () => void;
  bookmarks?: Bookmark[];
}

interface CommandGroup {
  category: string;
  items: {
    id: string;
    icon: React.ReactNode;
    title: string;
    description?: string;
    shortcut?: string[];
    action: () => void;
  }[];
}

export default function CommandPalette({
  isOpen,
  onClose,
  onNavigate,
  onToggleTheme,
  onOpenSettings,
  onOpenGuide,
  onAiOrganize,
  onAutoTag,
  bookmarks = [],
}: Props) {
  const { lang } = useLang();
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  const isKo = lang === "ko";

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const commandGroups = useMemo<CommandGroup[]>(() => {
    const groups: CommandGroup[] = [
      {
        category: isKo ? "빠른 이동" : "Navigation",
        items: [
          {
            id: "nav-dashboard",
            icon: <LayoutDashboard size={16} className="text-indigo-400" />,
            title: isKo ? "대시보드 (홈)" : "Dashboard (Home)",
            description: isKo ? "모든 북마크 및 위젯 개요 보드" : "All bookmarks & widget overview",
            action: () => {
              onNavigate("dashboard");
              onClose();
            },
          },
          {
            id: "nav-springnote",
            icon: <BookOpen size={16} className="text-amber-400" />,
            title: isKo ? "아날로그 스프링노트" : "Analog Spring Note",
            description: isKo ? "리치 텍스트 서식 서재 에디터" : "Rich-text analog note editor",
            action: () => {
              onNavigate("springnote");
              onClose();
            },
          },
          {
            id: "nav-mindmap",
            icon: <GitFork size={16} className="text-emerald-400" />,
            title: isKo ? "인터랙티브 마인드맵" : "Interactive MindMap",
            description: isKo ? "노드 기반 비주얼 구조화" : "Visual node diagramming",
            action: () => {
              onNavigate("mindmap");
              onClose();
            },
          },
          {
            id: "nav-todo",
            icon: <CheckSquare size={16} className="text-sky-400" />,
            title: isKo ? "생산성 TODO 보드" : "Productivity TODO Board",
            description: isKo ? "칸반 방식 할 일 및 메모 관리" : "Kanban task & todo board",
            action: () => {
              onNavigate("todo");
              onClose();
            },
          },
          {
            id: "nav-memo",
            icon: <FileText size={16} className="text-rose-400" />,
            title: isKo ? "메모 관리 보드" : "Memo Board",
            description: isKo ? "북마크 스티키 메모 한눈에 모아보기" : "Sticky memo repository",
            action: () => {
              onNavigate("memo");
              onClose();
            },
          },
          {
            id: "nav-calendar",
            icon: <CalendarIcon size={16} className="text-purple-400" />,
            title: isKo ? "스마트 캘린더" : "Smart Calendar",
            description: isKo ? "일정, 공휴일 및 Todo 타임라인 연동" : "Schedule & holiday calendar",
            action: () => {
              onNavigate("calendar");
              onClose();
            },
          },
          {
            id: "nav-tagboard",
            icon: <Tag size={16} className="text-pink-400" />,
            title: isKo ? "AI 태그 클라우드" : "AI Tag Board",
            description: isKo ? "인터랙티브 HSL 태그 필터링" : "Tag cloud and filtering",
            action: () => {
              onNavigate("tagboard");
              onClose();
            },
          },
          {
            id: "nav-map",
            icon: <MapPin size={16} className="text-teal-400" />,
            title: isKo ? "비주얼 북마크 맵" : "Visual Bookmark Map",
            description: isKo ? "카테고리별 위치 시각화" : "Visual map of saved links",
            action: () => {
              onNavigate("map");
              onClose();
            },
          },
          {
            id: "nav-github",
            icon: <Github size={16} className="text-slate-400" />,
            title: isKo ? "GitHub 트렌드 랭킹" : "GitHub Trending",
            description: isKo ? "인기 저장소 탐색" : "Popular GitHub repos",
            action: () => {
              onNavigate("github");
              onClose();
            },
          },
        ],
      },
      {
        category: isKo ? "빠른 실행 (Actions)" : "Quick Actions",
        items: [
          {
            id: "act-ai-organize",
            icon: <Sparkles size={16} className="text-purple-400" />,
            title: isKo ? "AI 자동 정리 실행" : "Run AI Auto-Organize",
            description: isKo ? "북마크 카테고리 일괄 자동 재분류" : "Bulk re-categorize bookmarks",
            action: () => {
              onAiOrganize?.();
              onClose();
            },
          },
          {
            id: "act-auto-tag",
            icon: <Tag size={16} className="text-pink-400" />,
            title: isKo ? "AI 자동 태깅 실행" : "Run AI Auto-Tagging",
            description: isKo ? "태그 없는 북마크에 AI 자동 태그 부여" : "Generate tags for untagged items",
            action: () => {
              onAutoTag?.();
              onClose();
            },
          },
          {
            id: "act-theme-toggle",
            icon: isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-indigo-400" />,
            title: isDark ? (isKo ? "라이트 테마로 전환" : "Switch to Light Theme") : (isKo ? "다크 테마로 전환" : "Switch to Dark Theme"),
            action: () => {
              if (onToggleTheme) onToggleTheme();
              else toggle();
              onClose();
            },
          },
          {
            id: "act-open-guide",
            icon: <HelpCircle size={16} className="text-purple-400" />,
            title: isKo ? "단축키 & 사용 도움말 가이드" : "Shortcuts & User Guide",
            action: () => {
              onOpenGuide?.();
              onClose();
            },
          },
          {
            id: "act-open-settings",
            icon: <Settings size={16} className="text-slate-400" />,
            title: isKo ? "상세 설정 모달 열기" : "Open Settings",
            action: () => {
              onOpenSettings?.();
              onClose();
            },
          },
        ],
      },
    ];

    // Filter bookmarks if search query exists
    if (query.trim() && bookmarks.length > 0) {
      const q = query.trim();
      const matchedBookmarks = bookmarks
        .filter(
          (b) =>
            smartMatch(b.title, q) ||
            smartMatch(b.url, q) ||
            (b.tags && b.tags.some((t) => smartMatch(t, q)))
        )
        .slice(0, 5);

      if (matchedBookmarks.length > 0) {
        groups.unshift({
          category: isKo ? "북마크 바로가기" : "Bookmark Results",
          items: matchedBookmarks.map((b) => ({
            id: `bm-${b.id}`,
            icon: <BookmarkIcon size={16} className="text-amber-400" />,
            title: b.title,
            description: b.url,
            action: () => {
              window.open(b.url, "_blank");
              onClose();
            },
          })),
        });
      }
    }

    return groups;
  }, [isKo, isDark, query, bookmarks, onNavigate, onClose, onAiOrganize, onAutoTag, onToggleTheme, toggle, onOpenGuide, onOpenSettings]);

  // Flattened items for keyboard navigation
  const flatItems = useMemo(() => {
    const q = query.trim();
    return commandGroups.flatMap((g) =>
      g.items.filter(
        (item) =>
          !q ||
          smartMatch(item.title, q) ||
          (item.description && smartMatch(item.description, q))
      )
    );
  }, [commandGroups, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (flatItems.length > 0 ? (prev + 1) % flatItems.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (flatItems.length > 0 ? (prev - 1 + flatItems.length) % flatItems.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flatItems[selectedIndex]) {
        flatItems[selectedIndex].action();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  let globalIdxCount = 0;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[99999] flex items-start justify-center pt-[12vh] px-4 animate-in fade-in duration-150">
      <div
        className="bg-white/95 dark:bg-surface-900/95 border border-slate-200 dark:border-surface-700/80 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-surface-800 bg-slate-50/50 dark:bg-surface-950/50">
          <Search size={18} className="text-purple-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              isKo
                ? "페이지 이동, 액션 실행 또는 북마크 검색... (위/아래 방향키, Enter)"
                : "Type a command, page name or bookmark search..."
            }
            className="flex-1 bg-transparent text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/60 dark:hover:bg-surface-800 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Results List */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2 space-y-4 scrollbar-thin">
          {flatItems.length === 0 ? (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
              {isKo ? "일치하는 커맨드나 검색 결과가 없습니다." : "No matching commands found."}
            </div>
          ) : (
            commandGroups.map((group) => {
              const q = query.toLowerCase().trim();
              const items = group.items.filter(
                (item) =>
                  !q ||
                  item.title.toLowerCase().includes(q) ||
                  (item.description && item.description.toLowerCase().includes(q))
              );

              if (items.length === 0) return null;

              return (
                <div key={group.category} className="space-y-1">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {group.category}
                  </div>
                  <div className="space-y-0.5">
                    {items.map((item) => {
                      const itemGlobalIdx = globalIdxCount++;
                      const isSelected = itemGlobalIdx === selectedIndex;

                      return (
                        <div
                          key={item.id}
                          onClick={() => item.action()}
                          onMouseEnter={() => setSelectedIndex(itemGlobalIdx)}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                            isSelected
                              ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                              : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-surface-800/80"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`p-1.5 rounded-lg shrink-0 ${
                                isSelected
                                  ? "bg-white/20 text-white"
                                  : "bg-slate-100 dark:bg-surface-800 text-slate-600 dark:text-slate-300"
                              }`}
                            >
                              {item.icon}
                            </div>
                            <div className="min-w-0">
                              <p className={`text-xs font-bold truncate ${isSelected ? "text-white" : ""}`}>
                                {item.title}
                              </p>
                              {item.description && (
                                <p
                                  className={`text-[10px] truncate mt-0.5 ${
                                    isSelected ? "text-purple-100/90" : "text-slate-400 dark:text-slate-400"
                                  }`}
                                >
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 ml-3">
                            {item.shortcut &&
                              item.shortcut.map((sc, sIdx) => (
                                <kbd
                                  key={sIdx}
                                  className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded ${
                                    isSelected
                                      ? "bg-purple-800/60 text-purple-100 border border-purple-400/30"
                                      : "bg-slate-100 dark:bg-surface-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-surface-700"
                                  }`}
                                >
                                  {sc}
                                </kbd>
                              ))}
                            <ArrowRight
                              size={14}
                              className={`transition-transform ${
                                isSelected ? "translate-x-0.5 opacity-100" : "opacity-0"
                              }`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Hint */}
        <div className="px-4 py-2.5 border-t border-slate-200 dark:border-surface-800 bg-slate-50/80 dark:bg-surface-950/80 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 font-mono bg-slate-200 dark:bg-surface-800 rounded">↑↓</kbd> {isKo ? "이동" : "Navigate"}
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 font-mono bg-slate-200 dark:bg-surface-800 rounded">Enter</kbd> {isKo ? "선택" : "Select"}
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 font-mono bg-slate-200 dark:bg-surface-800 rounded">Esc</kbd> {isKo ? "닫기" : "Close"}
            </span>
          </div>
          <div className="flex items-center gap-1 font-semibold text-purple-500 dark:text-purple-400">
            <Command size={12} />
            <span>ClickBook Command Palette</span>
          </div>
        </div>
      </div>
    </div>
  );
}
