import { useState, useEffect, useCallback, useMemo, useDeferredValue } from "react";
import Sidebar from "@/components/Sidebar";
import SearchBar from "@/components/SearchBar";
import PatternBar from "@/components/PatternBar";
import RightPanelBar, { type RightPanelId } from "@/components/RightPanelBar";
import SettingsModal from "@/components/SettingsModal";
import WelcomeModal from "@/components/WelcomeModal";
import Dashboard from "@/pages/Dashboard";
import FolderView from "@/pages/FolderView";
import MemoBoard from "@/pages/MemoBoard";
import GitHubRankingPage from "@/pages/GitHubRanking";
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
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showMemoBoard, setShowMemoBoard] = useState(false);
  const [showGitHubRanking, setShowGitHubRanking] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activePanel, setActivePanel] = useState<RightPanelId | null>(null);
  const [sidebarChromeOpen, setSidebarChromeOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({ ...DEFAULT_SETTINGS });
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [showGitHubRankingMenu, setShowGitHubRankingMenu] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  // 언어가 바뀌면 탭 제목도 업데이트
  useEffect(() => {
    document.title = t("pageTitle");
  }, [lang, t]);

  useEffect(() => {
    chrome.storage.local.get(["clickbook_sidebar_chrome", "clickbook_show_github_ranking", "clickbook_onboarded"], (r) => {
      if (r.clickbook_sidebar_chrome === true) setSidebarChromeOpen(true);
      if (r.clickbook_show_github_ranking !== undefined) setShowGitHubRankingMenu(r.clickbook_show_github_ranking);
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
  }

  function handleExportHTML() {
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
        if (response.success) loadData();
      } catch (err) {
        console.warn("Operation failed:", err);
        await showAlert(t("importFailed"), "warn");
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

  const deferredQuery = useDeferredValue(searchQuery);

  const filtered = useMemo(
    () =>
      deferredQuery
        ? bookmarks.filter(
            (b) =>
              b.title.toLowerCase().includes(deferredQuery.toLowerCase()) ||
              b.url.toLowerCase().includes(deferredQuery.toLowerCase())
          )
        : bookmarks,
    [bookmarks, deferredQuery]
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
      {DialogEl}
      <Sidebar
        bookmarks={filtered}
        folders={folders}
        selectedFolderId={selectedFolderId}
        onSelect={(id) => {
          setSelectedFolderId(id);
          setShowMemoBoard(false);
          setShowGitHubRanking(false);
        }}
        onRefresh={loadData}
        showChromePanel={sidebarChromeOpen}
        showMemoBoard={showMemoBoard}
        memoCount={Object.keys(memos).length}
        onSelectMemoBoard={() => {
          setShowMemoBoard(true);
          setSelectedFolderId(null);
          setShowGitHubRanking(false);
        }}
        onSelectGitHubRanking={showGitHubRankingMenu ? () => {
          setShowGitHubRanking(true);
          setShowMemoBoard(false);
          setSelectedFolderId(null);
        } : undefined}
        maxFolderDepth={settings.maxFolderDepth}
      />

      <div className="flex flex-col flex-1 overflow-hidden">
        <SearchBar
          query={searchQuery}
          onChange={setSearchQuery}
          onRefresh={loadData}
          onOpenSettings={() => setSettingsModalOpen(true)}
        />

        <PatternBar onPatternLoad={loadData} />

        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-6">
            {showGitHubRanking ? (
              <GitHubRankingPage />
            ) : showMemoBoard ? (
              <MemoBoard memos={memos} bookmarks={bookmarks} onRefresh={loadData} />
            ) : selectedFolderId === null ? (
              <Dashboard
                bookmarks={filtered}
                folders={folders}
                memos={memos}
                recentCount={settings.recentCount}
                rankingCount={settings.rankingCount}
                onSelectFolder={(id) => {
                  setSelectedFolderId(id);
                  setShowMemoBoard(false);
                  setShowGitHubRanking(false);
                }}
                onRefresh={loadData}
                searchQuery={deferredQuery}
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
