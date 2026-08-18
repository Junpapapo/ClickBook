import { useState, useEffect, useRef, useMemo } from "react";
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
  X,
  Rocket,
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
  onOpenOnboarding?: () => void;
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
  onOpenOnboarding,
  onAiOrganize,
  onAutoTag,
  bookmarks = [],
}: Props) {
  const { lang, t } = useLang();
  const isKo = lang === "ko";
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

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
        category: t("cmdCategoryNav"),
        items: [
          {
            id: "nav-dashboard",
            icon: <LayoutDashboard size={16} className="text-indigo-400" />,
            title: t("cmdNavDashboard"),
            description: t("cmdNavDashboardDesc"),
            action: () => {
              onNavigate("dashboard");
              onClose();
            },
          },
          {
            id: "nav-springnote",
            icon: <BookOpen size={16} className="text-amber-400" />,
            title: t("cmdNavSpringNote"),
            description: t("cmdNavSpringNoteDesc"),
            action: () => {
              onNavigate("springnote");
              onClose();
            },
          },
          {
            id: "nav-mindmap",
            icon: <GitFork size={16} className="text-emerald-400" />,
            title: t("cmdNavMindMap"),
            description: t("cmdNavMindMapDesc"),
            action: () => {
              onNavigate("mindmap");
              onClose();
            },
          },
          {
            id: "nav-todo",
            icon: <CheckSquare size={16} className="text-sky-400" />,
            title: t("cmdNavTodo"),
            description: t("cmdNavTodoDesc"),
            action: () => {
              onNavigate("todo");
              onClose();
            },
          },
          {
            id: "nav-memo",
            icon: <FileText size={16} className="text-rose-400" />,
            title: t("cmdNavMemo"),
            description: t("cmdNavMemoDesc"),
            action: () => {
              onNavigate("memo");
              onClose();
            },
          },
          {
            id: "nav-calendar",
            icon: <CalendarIcon size={16} className="text-purple-400" />,
            title: t("cmdNavCalendar"),
            description: t("cmdNavCalendarDesc"),
            action: () => {
              onNavigate("calendar");
              onClose();
            },
          },
          {
            id: "nav-tagboard",
            icon: <Tag size={16} className="text-pink-400" />,
            title: t("cmdNavTag"),
            description: t("cmdNavTagDesc"),
            action: () => {
              onNavigate("tagboard");
              onClose();
            },
          },
          {
            id: "nav-map",
            icon: <MapPin size={16} className="text-teal-400" />,
            title: t("cmdNavBookmarkMap"),
            description: t("cmdNavBookmarkMapDesc"),
            action: () => {
              onNavigate("map");
              onClose();
            },
          },
          {
            id: "nav-github",
            icon: <Github size={16} className="text-slate-400" />,
            title: t("cmdNavGithub"),
            description: t("cmdNavGithubDesc"),
            action: () => {
              onNavigate("github");
              onClose();
            },
          },
        ],
      },
      {
        category: t("cmdCategoryActions"),
        items: [
          {
            id: "act-ai-organize",
            icon: <Sparkles size={16} className="text-purple-400" />,
            title: t("cmdActionAiOrganize"),
            description: t("cmdActionAiOrganizeDesc"),
            action: () => {
              onAiOrganize?.();
              onClose();
            },
          },
          {
            id: "act-auto-tag",
            icon: <Tag size={16} className="text-pink-400" />,
            title: t("cmdActionAutoTag"),
            description: t("cmdActionAutoTagDesc"),
            action: () => {
              onAutoTag?.();
              onClose();
            },
          },
          {
            id: "act-theme-toggle",
            icon: isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-indigo-400" />,
            title: isDark ? t("cmdActionSwitchLight") : t("cmdActionSwitchDark"),
            action: () => {
              if (onToggleTheme) onToggleTheme();
              else toggle();
              onClose();
            },
          },
          {
            id: "act-open-onboarding",
            icon: <Rocket size={16} className="text-indigo-400" />,
            title: t("cmdRelaunchOnboarding"),
            description: t("cmdRelaunchOnboardingDesc"),
            action: () => {
              onOpenOnboarding?.();
              onClose();
            },
          },
          {
            id: "act-open-guide",
            icon: <HelpCircle size={16} className="text-purple-400" />,
            title: t("cmdActionShortcutsGuide"),
            action: () => {
              onOpenGuide?.();
              onClose();
            },
          },
          {
            id: "act-open-settings",
            icon: <Settings size={16} className="text-slate-400" />,
            title: t("cmdActionOpenSettings"),
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
          category: t("cmdCategoryBookmarks"),
          items: matchedBookmarks.map((b) => ({
            id: `bm-${b.id}`,
            icon: (
              <img
                src={b.favicon || `https://www.google.com/s2/favicons?domain=${b.domain}&sz=32`}
                alt=""
                className="w-4 h-4 object-contain rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236366f1' stroke-width='2'><circle cx='12' cy='12' r='10'/></svg>";
                }}
              />
            ),
            title: b.title,
            description: b.domain || b.url,
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
              lang === "ko"
                ? "페이지 이동, 액션 실행 또는 북마크 검색... (위/아래 방향키, Enter)"
                : t("heroSearchPlaceholder")
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
              {t("cmdNoResults")}
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
              <kbd className="px-1 py-0.5 font-mono bg-slate-200 dark:bg-surface-800 rounded">↑↓</kbd> {t("cmdHintNavigate")}
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 font-mono bg-slate-200 dark:bg-surface-800 rounded">Enter</kbd> {t("cmdHintSelect")}
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 font-mono bg-slate-200 dark:bg-surface-800 rounded">Esc</kbd> {t("cmdHintClose")}
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
