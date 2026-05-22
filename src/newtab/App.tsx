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
import type { Bookmark, Folder, MemoMap, StorageData, MessageResponse, AppSettings } from "@/shared/types";
import { DEFAULT_SETTINGS } from "@/shared/storage";
import { ThemeProvider } from "@/shared/ThemeContext";
import { LanguageProvider, useLang } from "@/shared/LanguageContext";
import { useDialog } from "@/shared/useDialog";

function AppContent() {
  const { showAlert, DialogEl } = useDialog();
  const { t, lang } = useLang();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [memos, setMemos] = useState<MemoMap>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [aiSearchQuery, setAiSearchQuery] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showMemoBoard, setShowMemoBoard] = useState(false);
  const [showBookmarkMap, setShowBookmarkMap] = useState(false);
  const [showGitHubRanking, setShowGitHubRanking] = useState(false);
  const [showWikiRanking, setShowWikiRanking] = useState(false);
  const [showHFRanking, setShowHFRanking] = useState(false);
  const [showHNRanking, setShowHNRanking] = useState(false);
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
    await chrome.runtime.sendMessage({ type: "SAVE_SETTINGS", settings: next });
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
    const response = (await chrome.runtime.sendMessage({ type: "EXPORT_DATA" })) as MessageResponse;
    if (!response.success) return;
    const data = response.data as StorageData;
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
        const data: StorageData = JSON.parse(text);
        const response = (await chrome.runtime.sendMessage({ type: "IMPORT_DATA", data })) as MessageResponse;
        if (response.success) {
          loadData();
          const count = (response.data as { count: number })?.count ?? 0;
          showSettingsMessage(t("importSuccess", { n: count }), "info");
        }
      } catch (err) {
        console.warn("Operation failed:", err);
        showSettingsMessage(t("importFailed"), "warn");
      }
    };
    input.click();
  }

  const loadData = useCallback(async () => {
    const response = (await chrome.runtime.sendMessage({
      type: "GET_ALL_DATA",
    })) as MessageResponse;
    if (response.success && response.data) {
      const data = response.data as StorageData;
      setBookmarks(data.bookmarks);
      setFolders(data.folders);
    }
    const memosRes = (await chrome.runtime.sendMessage({ type: "GET_MEMOS" })) as MessageResponse;
    if (memosRes.success) setMemos((memosRes.data as MemoMap) ?? {});
    const settingsRes = (await chrome.runtime.sendMessage({ type: "GET_SETTINGS" })) as MessageResponse;
    if (settingsRes.success && settingsRes.data) setSettings(settingsRes.data as AppSettings);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const handleOpenInfo = (e: CustomEvent) => {
      setInfoBookmarkId((e.detail as Bookmark).id);
      setActivePanel("info");
    };
    window.addEventListener("OPEN_BOOKMARK_INFO", handleOpenInfo as EventListener);
    return () => window.removeEventListener("OPEN_BOOKMARK_INFO", handleOpenInfo as EventListener);
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
        const res = await chrome.runtime.sendMessage({ type: "EXPAND_SEARCH", query: aiSearchQuery }) as MessageResponse;
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
      
      const q = deferredQuery.toLowerCase();
      return bookmarks.filter((b) => {
        const title = b.title.toLowerCase();
        const url = b.url.toLowerCase();
        
        // 1. 직접 포함 확인
        if (title.includes(q) || url.includes(q)) return true;
        
        // 2. AI 확장 키워드 매칭
        if (expandedKeywords.length > 0) {
          return expandedKeywords.some(kw => title.includes(kw) || url.includes(kw));
        }
        
        return false;
      });
    },
    [bookmarks, deferredQuery, expandedKeywords]
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
        onSelect={(id) => {
          setSelectedFolderId(id);
          setShowMemoBoard(false);
          setShowGitHubRanking(false);
          setShowWikiRanking(false);
          setShowHFRanking(false);
          setShowHNRanking(false);
        }}
        onRefresh={loadData}
        showChromePanel={sidebarChromeOpen}
        showMemoBoard={showMemoBoard}
        showBookmarkMap={showBookmarkMap}
        memoCount={Object.keys(memos).length}
        onSelectMemoBoard={() => {
          setShowMemoBoard(true);
          setShowBookmarkMap(false);
          setSelectedFolderId(null);
          setShowGitHubRanking(false);
          setShowWikiRanking(false);
          setShowHFRanking(false);
          setShowHNRanking(false);
        }}
        onSelectGitHubRanking={showGitHubRankingMenu ? () => {
          setShowGitHubRanking(true);
          setShowMemoBoard(false);
          setSelectedFolderId(null);
          setShowWikiRanking(false);
          setShowHFRanking(false);
          setShowHNRanking(false);
        } : undefined}
        onSelectWikiRanking={showWikiRankingMenu ? () => {
          setShowWikiRanking(true);
          setShowGitHubRanking(false);
          setShowMemoBoard(false);
          setSelectedFolderId(null);
          setShowHFRanking(false);
          setShowHNRanking(false);
        } : undefined}
        onSelectHFRanking={showHFRankingMenu ? () => {
          setShowHFRanking(true);
          setShowWikiRanking(false);
          setShowGitHubRanking(false);
          setShowMemoBoard(false);
          setSelectedFolderId(null);
          setShowHNRanking(false);
          setShowBookmarkMap(false);
        } : undefined}
        onSelectBookmarkMap={() => {
          setShowBookmarkMap(true);
          setShowMemoBoard(false);
          setShowGitHubRanking(false);
          setShowWikiRanking(false);
          setShowHFRanking(false);
          setShowHNRanking(false);
          setSelectedFolderId(null);
        }}
        onSelectHNRanking={showHNRankingMenu ? () => {
          setShowHNRanking(true);
          setShowHFRanking(false);
          setShowWikiRanking(false);
          setShowGitHubRanking(false);
          setShowBookmarkMap(false);
          setShowMemoBoard(false);
          setSelectedFolderId(null);
        } : undefined}
        maxFolderDepth={settings.maxFolderDepth}
        onAiLoadingChange={setAiLoading}
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
            {showGitHubRanking ? (
              <GitHubRankingPage />
            ) : showWikiRanking ? (
              <WikiRankingPage />
            ) : showHFRanking ? (
              <HFRankingPage />
            ) : showHNRanking ? (
              <HNRankingPage />
            ) : showBookmarkMap ? (
              <BookmarkMap bookmarks={filtered} folders={folders} memos={memos} onRefresh={loadData} />
            ) : showMemoBoard ? (
              <MemoBoard memos={memos} bookmarks={bookmarks} onRefresh={loadData} />
            ) : selectedFolderId === null ? (
              <Dashboard
                bookmarks={filtered}
                folders={folders}
                memos={memos}
                recentCount={settings.recentCount}
                rankingCount={settings.rankingCount}
                recommendCount={settings.recommendCount}
                onSelectFolder={(id) => {
                  setSelectedFolderId(id);
                  setShowMemoBoard(false);
                  setShowGitHubRanking(false);
                  setShowWikiRanking(false);
                  setShowHFRanking(false);
                  setShowHNRanking(false);
                  setShowBookmarkMap(false);
                }}
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
                onBack={() => setSelectedFolderId(null)}
                onSelectFolder={(id) => {
                  setSelectedFolderId(id);
                  setShowMemoBoard(false);
                  setShowGitHubRanking(false);
                  setShowWikiRanking(false);
                  setShowHFRanking(false);
                  setShowHNRanking(false);
                  setShowBookmarkMap(false);
                }}
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
            if (!v && showGitHubRanking) setShowGitHubRanking(false);
          }}
          showWikiRankingMenu={showWikiRankingMenu}
          onToggleWikiRankingMenu={(v) => {
            setShowWikiRankingMenu(v);
            chrome.storage.local.set({ clickbook_show_wiki_ranking: v });
            if (!v && showWikiRanking) setShowWikiRanking(false);
          }}
          showHFRankingMenu={showHFRankingMenu}
          onToggleHFRankingMenu={(v) => {
            setShowHFRankingMenu(v);
            chrome.storage.local.set({ clickbook_show_hf_ranking: v });
            if (!v && showHFRanking) setShowHFRanking(false);
          }}
          showHNRankingMenu={showHNRankingMenu}
          onToggleHNRankingMenu={(v) => {
            setShowHNRankingMenu(v);
            chrome.storage.local.set({ clickbook_show_hn_ranking: v });
            if (!v && showHNRanking) setShowHNRanking(false);
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
