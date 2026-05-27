import { useState, useEffect, useCallback, useMemo, useDeferredValue } from "react";
import Sidebar from "@/components/Sidebar";
import SearchBar from "@/components/SearchBar";
import PatternBar from "@/components/PatternBar";
import RightPanelBar, { type RightPanelId } from "@/components/RightPanelBar";
import SettingsModal from "@/components/SettingsModal";
import WelcomeModal from "@/components/WelcomeModal";
import ProgressBar from "@/components/ProgressBar";
import Dashboard from "@/pages/Dashboard";
import FolderView from "@/pages/FolderView";
import MemoBoard from "@/pages/MemoBoard";
import BookmarkMap from "@/pages/BookmarkMap";
import GitHubRankingPage from "@/pages/GitHubRanking";
import WikiRankingPage from "@/pages/WikiRanking";
import HFRankingPage from "@/pages/HFRanking";
import HNRankingPage from "@/pages/HNRanking";
import type { Bookmark, Folder, MemoMap, StorageData, MessageResponse, AppSettings, ClickBookBackupData, TodoBoardData, PageId } from "@/shared/types";
import { DEFAULT_SETTINGS } from "@/shared/storage";
import { sendMsg } from "@/shared/utils";
import { ThemeProvider } from "@/shared/ThemeContext";
import { LanguageProvider, useLang } from "@/shared/LanguageContext";
import { useDialog } from "@/shared/useDialog";

import TodoBoard from "@/pages/TodoBoard";
import TagBoard from "@/pages/TagBoard";
import TaskControlPage from "@/pages/TaskControlPage";
import { ReaderModeViewer } from "@/components/ReaderModeViewer";
import { useTaskQueue } from "@/shared/useTaskQueue";

// ── メインアプリケーションコンポーネント ───────────────────

function AppContent() {
  const { t, lang } = useLang();
  const { DialogEl } = useDialog();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [memos, setMemos] = useState<MemoMap>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [aiSearchQuery, setAiSearchQuery] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<PageId>("dashboard");
  const [activePanel, setActivePanel] = useState<RightPanelId | null>(null);
  const [infoBookmarkId, setInfoBookmarkId] = useState<string | null>(null);
  const [sidebarChromeOpen, setSidebarChromeOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({ ...DEFAULT_SETTINGS });
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [showGitHubRankingMenu, setShowGitHubRankingMenu] = useState(true);
  const [showWikiRankingMenu, setShowWikiRankingMenu] = useState(true);
  const [showHFRankingMenu, setShowHFRankingMenu] = useState(true);
  const [showHNRankingMenu, setShowHNRankingMenu] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [expandedKeywords, setExpandedKeywords] = useState<string[]>([]);
  const [pageContents, setPageContents] = useState<Record<string, string>>({});
  const [pageContentsLoaded, setPageContentsLoaded] = useState(false);
  const [readerOpen, setReaderOpen] = useState(false);
  const [readerData, setReaderData] = useState<{ bookmarkId: string; title: string; url?: string; content: string } | null>(null);
  const [todoBoard, setTodoBoard] = useState<TodoBoardData | null>(null);

  // Task Control Center
  const taskQueue = useTaskQueue();

  const loadData = useCallback(async () => {
    const response = await sendMsg({
      type: "GET_ALL_DATA",
    });
    if (response.success && response.data) {
      const data = response.data as StorageData;
      setBookmarks(data.bookmarks);
      setFolders(data.folders);
    }
    const memosRes = await sendMsg({ type: "GET_MEMOS" });
    if (memosRes.success) setMemos((memosRes.data as MemoMap) ?? {});
    const settingsRes = await sendMsg({ type: "GET_SETTINGS" });
    if (settingsRes.success && settingsRes.data) setSettings(settingsRes.data as AppSettings);
    
    const todoBoardRes = await sendMsg({ type: "GET_TODO_BOARD" });
    if (todoBoardRes.success && todoBoardRes.data) {
      setTodoBoard(todoBoardRes.data as TodoBoardData);
    }
  }, []);

  const navigate = useCallback((page: PageId, folderId?: string | null) => {
    setActivePage(page);
    setSelectedFolderId(folderId ?? null);
  }, []);

  const handleAutoTag = useCallback(() => {
    if (taskQueue.tasks.some(t => t.category === "ai-tag" && (t.status === "running" || t.status === "queued"))) return;

    const taskId = taskQueue.addTask("ai-tag", "Auto Tag");
    const port = chrome.runtime.connect({ name: "auto-tag" });

    port.onMessage.addListener((msg: any) => {
      if (msg.type === "progress") {
        taskQueue.updateProgress(taskId, msg.progress ?? 0, msg.detail ?? "");
      } else if (msg.type === "done") {
        const tagged = msg.tagged ?? 0;
        const total = msg.total ?? 0;
        const failed = msg.failed ?? 0;
        let summary = `${tagged}/${total} bookmarks tagged`;
        if (failed > 0) summary += ` (${failed} failed)`;
        taskQueue.completeTask(taskId, summary);
        loadData();
      } else if (msg.type === "error") {
        taskQueue.failTask(taskId, msg.error ?? "Auto tagging failed");
      }
    });

    port.onDisconnect.addListener(() => {
      if (chrome.runtime.lastError) {
        taskQueue.failTask(taskId, chrome.runtime.lastError.message ?? "Connection lost");
      }
    });
  }, [taskQueue, loadData]);

  // Sync todo board from other pages or background via storage changes
  useEffect(() => {
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === "local" && changes["clickbook_todo_board"]) {
        const nextVal = changes["clickbook_todo_board"].newValue;
        if (nextVal) {
          setTodoBoard(nextVal);
        }
      }
    };
    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const todayStr = useMemo(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const urgentTasks = useMemo(() => {
    if (!todoBoard || !todoBoard.tasks) return [];
    return Object.values(todoBoard.tasks).filter((task: any) => {
      if (task.completed || !task.dueDate) return false;
      return task.dueDate <= todayStr;
    });
  }, [todoBoard, todayStr]);

  const todoStats = useMemo(() => {
    let overdueCount = 0;
    let dueTodayCount = 0;
    
    for (const task of urgentTasks) {
      if (task.dueDate === todayStr) {
        dueTodayCount++;
      } else if (task.dueDate && task.dueDate < todayStr) {
        overdueCount++;
      }
    }
    return { overdueCount, dueTodayCount };
  }, [urgentTasks, todayStr]);

  const handleSelectTodoBoard = useCallback(() => {
    navigate("todo");
  }, [navigate]);

  // 언어가 바뀌면 탭 제목도 업데이트
  useEffect(() => {
    document.title = t("pageTitle");
  }, [lang, t]);

  useEffect(() => {
    chrome.storage.local.get([
      "clickbook_sidebar_chrome",
      "clickbook_show_github_ranking",
      "clickbook_show_wiki_ranking",
      "clickbook_show_hf_ranking",
      "clickbook_show_hn_ranking",
      "clickbook_onboarded"
    ], (r) => {
      if (r.clickbook_sidebar_chrome === true) setSidebarChromeOpen(true);
      if (r.clickbook_show_github_ranking !== undefined) setShowGitHubRankingMenu(r.clickbook_show_github_ranking);
      if (r.clickbook_show_wiki_ranking !== undefined) setShowWikiRankingMenu(r.clickbook_show_wiki_ranking);
      if (r.clickbook_show_hf_ranking !== undefined) setShowHFRankingMenu(r.clickbook_show_hf_ranking);
      if (r.clickbook_show_hn_ranking !== undefined) setShowHNRankingMenu(r.clickbook_show_hn_ranking);
      if (!r.clickbook_onboarded) setShowWelcome(true);
    });
  }, []);

  function toggleSidebarChrome() {
    setSidebarChromeOpen((o) => {
      const next = !o;
      chrome.storage.local.set({ clickbook_sidebar_chrome: next });
      return next;
    });
  }

  async function handleSaveSettings(next: AppSettings) {
    await sendMsg({ type: "SAVE_SETTINGS", settings: next });
    setSettings(next);
  }

  function escapeHtml(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  const [settingsMessage, setSettingsMessage] = useState<{ text: string, type: "info" | "warn" } | null>(null);

  function showSettingsMessage(text: string, type: "info" | "warn" = "info") {
    setSettingsMessage({ text, type });
    setTimeout(() => setSettingsMessage(null), 3000);
  }

  async function handleExportJSON() {
    const response = await sendMsg({ type: "EXPORT_DATA" });
    if (!response.success) return;
    const data = response.data as ClickBookBackupData;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clickbook-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showSettingsMessage(t("exportSuccess"), "info");
  }

  async function handleExportHTML() {
    const rows = bookmarks
      .map((b) => `<li><a href="${escapeHtml(b.url)}">${escapeHtml(b.title)}</a></li>`)
      .join("\n");
    const html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>\n<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n<TITLE>ClickBook Bookmarks</TITLE>\n<H1>Bookmarks</H1>\n<DL><ul>\n${rows}\n</ul></DL>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clickbook-export-${new Date().toISOString().split("T")[0]}.html`;
    a.click();
    URL.revokeObjectURL(url);
    showSettingsMessage(t("exportSuccess"), "info");
  }

  function handleImport() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const data: ClickBookBackupData = JSON.parse(text);
        const response = await sendMsg({ type: "IMPORT_DATA", data });
        if (response.success) {
          const count = (response.data as { count: number })?.count ?? 0;
          showSettingsMessage(t("importSuccess", { n: count }), "info");
          // 1초 뒤 강제 새로고침을 통해 TodoBoard, memos, settings를 완벽하게 재정비합니다.
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      } catch (err) {
        console.warn("Operation failed:", err);
        showSettingsMessage(t("importFailed"), "warn");
      }
    };
    input.click();
  }

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 사용자가 검색어 입력을 시작하면 단 1회 대용량 컴팩트 FTS 인덱스를 호출합니다.
  useEffect(() => {
    if (searchQuery.trim().length > 0 && !pageContentsLoaded) {
      setPageContentsLoaded(true);
      sendMsg({ type: "GET_PAGE_CONTENTS" }).then((res) => {
        if (res.success && res.data) {
          setPageContents(res.data as Record<string, string>);
        }
      }).catch((err) => {
        console.warn("Failed to load page contents lazily:", err);
        setPageContentsLoaded(false); // 에러 시 다음 키 입력 때 재시도할 수 있도록 상태 롤백
      });
    }
  }, [searchQuery, pageContentsLoaded]);

  // Catch the `reader` parameter in URL query on mount / bookmarks loaded
  useEffect(() => {
    if (bookmarks.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const readerId = params.get("reader");
    if (readerId) {
      const bm = bookmarks.find(b => b.id === readerId);
      if (bm) {
        sendMsg({ type: "GET_PAGE_CONTENT", bookmarkId: readerId }).then((res) => {
          const content = res.success && res.data
            ? (typeof res.data === "string" ? res.data : ((res.data as any).readableContent || (res.data as any).rawText || ""))
            : (bm.summary || "");
          setReaderData({
            bookmarkId: readerId,
            title: bm.title,
            url: bm.url,
            content
          });
          setReaderOpen(true);
        }).catch((err) => {
          console.warn("Failed to load page content for URL reader param:", err);
          setReaderData({
            bookmarkId: readerId,
            title: bm.title,
            url: bm.url,
            content: bm.summary || ""
          });
          setReaderOpen(true);
        });

        // Clean the URL query parameters
        const newUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, [bookmarks]);

  useEffect(() => {
    const handleOpenInfo = (e: CustomEvent) => {
      setInfoBookmarkId((e.detail as Bookmark).id);
      setActivePanel("info");
    };
    window.addEventListener("OPEN_BOOKMARK_INFO", handleOpenInfo as EventListener);
    
    const handleOpenReader = (e: CustomEvent) => {
      setReaderData(e.detail);
      setReaderOpen(true);
    };
    window.addEventListener("OPEN_READER_MODE", handleOpenReader as EventListener);

    return () => {
      window.removeEventListener("OPEN_BOOKMARK_INFO", handleOpenInfo as EventListener);
      window.removeEventListener("OPEN_READER_MODE", handleOpenReader as EventListener);
    };
  }, []);

  const infoBookmark = useMemo(() => {
    return bookmarks.find((b) => b.id === infoBookmarkId) || null;
  }, [bookmarks, infoBookmarkId]);

  const deferredQuery = useDeferredValue(searchQuery);

  // AI 검색어 확장 (시맨틱 검색 보조) - 엔터 쳤을 때(aiSearchQuery)만 동작
  useEffect(() => {
    if (!aiSearchQuery || aiSearchQuery.length < 3) {
      setExpandedKeywords([]);
      return;
    }

    const timer = setTimeout(async () => {
      setAiLoading(true);
      try {
        const res = await sendMsg({ type: "EXPAND_SEARCH", query: aiSearchQuery });
        if (res.success && Array.isArray(res.data)) {
          setExpandedKeywords(res.data);
        }
      } finally {
        setAiLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [aiSearchQuery]);

  const filtered = useMemo(
    () => {
      if (!deferredQuery) return bookmarks;
      
      const terms = deferredQuery.toLowerCase().split(/\s+/).filter(Boolean);
      if (terms.length === 0) return bookmarks;

      return bookmarks.filter((b) => {
        const title = b.title.toLowerCase();
        const url = b.url.toLowerCase();
        const summary = (b.summary || "").toLowerCase();
        const tags = (b.tags || []).map(t => t.toLowerCase());
        const pageContent = (pageContents[b.id] || "").toLowerCase();

        // Each space-separated term must match in at least one of the fields (Title, URL, Summary, Tags, or Scraped Content)
        return terms.every(term => {
          if (title.includes(term)) return true;
          if (url.includes(term)) return true;
          if (summary.includes(term)) return true;
          if (tags.some(tag => tag.includes(term))) return true;
          if (pageContent.includes(term)) return true;
          return false;
        });
      });
    },
    [bookmarks, deferredQuery, pageContents]
  );

  const getBookmarksForFolder = useCallback(
    (folderId: string): Bookmark[] => {
      const descendantIds = new Set<string>([folderId]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const f of folders) {
          if (f.parentId && descendantIds.has(f.parentId) && !descendantIds.has(f.id)) {
            descendantIds.add(f.id);
            changed = true;
          }
        }
      }
      return filtered.filter((b) => descendantIds.has(b.folderId));
    },
    [filtered, folders]
  );

  const folderBookmarks = useMemo(
    () => (selectedFolderId ? getBookmarksForFolder(selectedFolderId) : []),
    [selectedFolderId, getBookmarksForFolder]
  );

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50 dark:bg-surface-950 text-gray-800 dark:text-gray-100 transition-colors duration-200">
      <ProgressBar isLoading={aiLoading} />
      {DialogEl}
      <Sidebar
        bookmarks={filtered}
        folders={folders}
        selectedFolderId={selectedFolderId}
        activePage={activePage}
        onNavigate={navigate}
        onRefresh={loadData}
        showChromePanel={sidebarChromeOpen}
        memoCount={Object.keys(memos).length}
        onAutoTag={handleAutoTag}
        taskCount={taskQueue.tasks.length}
        maxFolderDepth={settings.maxFolderDepth}
        onAiLoadingChange={setAiLoading}
        todoStats={todoStats}
        showGitHubRankingMenu={showGitHubRankingMenu}
        showWikiRankingMenu={showWikiRankingMenu}
        showHFRankingMenu={showHFRankingMenu}
        showHNRankingMenu={showHNRankingMenu}
      />

      <div className="flex flex-col flex-1 overflow-hidden">
        <SearchBar
          query={searchQuery}
          onChange={setSearchQuery}
          onEnter={setAiSearchQuery}
          onRefresh={loadData}
          onOpenSettings={() => setSettingsModalOpen(true)}
        />

        <PatternBar onPatternLoad={loadData} />

        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-6">
            {activePage === "taskcontrol" ? (
              <TaskControlPage
                tasks={taskQueue.tasks}
                aiRunningCount={taskQueue.aiRunningCount}
                aiQueuedCount={taskQueue.aiQueuedCount}
                onCancel={(taskId) => taskQueue.cancelTask(taskId)}
                onDismiss={(taskId) => taskQueue.dismissTask(taskId)}
                onRetry={(task) => {
                  taskQueue.dismissTask(task.id);
                  // Re-add the task
                  taskQueue.addTask(task.category, task.name);
                }}
              />
            ) : activePage === "todo" ? (
              <TodoBoard settings={settings} />
            ) : activePage === "tagboard" ? (
              <TagBoard
                bookmarks={filtered}
                folders={folders}
                onRefresh={loadData}
                isAutoTagging={taskQueue.tasks.some(t => t.category === "ai-tag" && (t.status === "running" || t.status === "queued"))}
                onAutoTag={handleAutoTag}
              />
            ) : activePage === "github" ? (
              <GitHubRankingPage />
            ) : activePage === "wiki" ? (
              <WikiRankingPage />
            ) : activePage === "hf" ? (
              <HFRankingPage />
            ) : activePage === "hn" ? (
              <HNRankingPage />
            ) : activePage === "map" ? (
              <BookmarkMap bookmarks={filtered} folders={folders} memos={memos} onRefresh={loadData} />
            ) : activePage === "memo" ? (
              <MemoBoard memos={memos} bookmarks={bookmarks} onRefresh={loadData} />
            ) : activePage === "dashboard" ? (
              <Dashboard
                bookmarks={filtered}
                folders={folders}
                memos={memos}
                todoStats={todoStats}
                urgentTasks={urgentTasks}
                onSelectTodoBoard={handleSelectTodoBoard}
                recentCount={settings.recentCount}
                rankingCount={settings.rankingCount}
                recommendCount={settings.recommendCount}
                onSelectFolder={(id) => navigate("folder", id)}
                onRefresh={loadData}
                searchQuery={deferredQuery}
                aiSearchQuery={aiSearchQuery}
                onAiLoadingChange={setAiLoading}
                customSearchConfigs={settings.customSearchConfigs || []}
                customPresets={settings.customPresets || []}
                onSaveCustomSearchConfigs={(configs, presets) => {
                  handleSaveSettings({ ...settings, customSearchConfigs: configs, customPresets: presets || settings.customPresets });
                }}
              />
            ) : (
              <FolderView
                bookmarks={folderBookmarks}
                folders={folders}
                folderId={selectedFolderId}
                memos={memos}
                onBack={() => navigate("dashboard")}
                onSelectFolder={(id) => navigate("folder", id)}
                onRefresh={loadData}
              />
            )}
          </main>

          {/* 右パネルバー（アイコンレール + 展開パネル） */}
          <RightPanelBar
            activePanel={activePanel}
            onToggle={(panel) => setActivePanel((p) => (p === panel ? null : panel))}
            onClose={() => setActivePanel(null)}
            bookmarks={bookmarks}
            folders={folders}
            onRefresh={loadData}
            infoBookmark={infoBookmark}
            infoMemo={infoBookmark ? memos[infoBookmark.id] : undefined}
          />
        </div>
      </div>

      {/* 詳細設定モーダル */}
      {settingsModalOpen && (
        <SettingsModal
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setSettingsModalOpen(false)}
          onExportJSON={handleExportJSON}
          onExportHTML={handleExportHTML}
          onImport={handleImport}
          sidebarChromeOpen={sidebarChromeOpen}
          onToggleSidebarChrome={toggleSidebarChrome}
          showGitHubRankingMenu={showGitHubRankingMenu}
          onToggleGitHubRankingMenu={(v) => {
            setShowGitHubRankingMenu(v);
            chrome.storage.local.set({ clickbook_show_github_ranking: v });
            if (!v && activePage === "github") navigate("dashboard");
          }}
          showWikiRankingMenu={showWikiRankingMenu}
          onToggleWikiRankingMenu={(v) => {
            setShowWikiRankingMenu(v);
            chrome.storage.local.set({ clickbook_show_wiki_ranking: v });
            if (!v && activePage === "wiki") navigate("dashboard");
          }}
          showHFRankingMenu={showHFRankingMenu}
          onToggleHFRankingMenu={(v) => {
            setShowHFRankingMenu(v);
            chrome.storage.local.set({ clickbook_show_hf_ranking: v });
            if (!v && activePage === "hf") navigate("dashboard");
          }}
          showHNRankingMenu={showHNRankingMenu}
          onToggleHNRankingMenu={(v) => {
            setShowHNRankingMenu(v);
            chrome.storage.local.set({ clickbook_show_hn_ranking: v });
            if (!v && activePage === "hn") navigate("dashboard");
          }}
          settingsMessage={settingsMessage}
        />
      )}

      {/* 온보딩 가이드 */}
      {showWelcome && (
        <WelcomeModal
          onClose={() => {
            setShowWelcome(false);
            chrome.storage.local.set({ clickbook_onboarded: true });
          }}
        />
      )}

      {/* Reader Mode Viewer Overlay */}
      {readerOpen && readerData && (
        <ReaderModeViewer
          bookmarkId={readerData.bookmarkId}
          title={readerData.title}
          url={readerData.url}
          initialContent={readerData.content}
          onClose={() => {
            setReaderOpen(false);
            setReaderData(null);
            loadData(); // Load any memo updates if applicable
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </LanguageProvider>
  );
}
