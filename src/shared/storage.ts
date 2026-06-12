// =============================
// GitHubランキングキャッシュ
// =============================
import type { GitHubRankingCache } from "./types";

const GITHUB_RANKING_KEY = "github_ranking_cache";

export async function getGitHubRankingCache(): Promise<GitHubRankingCache | null> {
  const result = await chrome.storage.local.get(GITHUB_RANKING_KEY);
  return result[GITHUB_RANKING_KEY] ?? null;
}

export async function setGitHubRankingCache(cache: GitHubRankingCache): Promise<void> {
  await chrome.storage.local.set({ [GITHUB_RANKING_KEY]: cache });
}
import type { Bookmark, Folder, StorageData, ClickBookBackupData } from "./types";
import { DEFAULT_FOLDERS, DEFAULT_FOLDER_ID } from "./categories";

const STORAGE_KEY = "clickbook_data";

// ============================================================
// chrome.storage.local ヘルパー
// ============================================================

async function readStorage(): Promise<StorageData> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const data = result[STORAGE_KEY];
  if (data && typeof data === "object" && Array.isArray(data.bookmarks)) {
    return {
      bookmarks: data.bookmarks,
      folders: Array.isArray(data.folders) ? data.folders : [...DEFAULT_FOLDERS],
    };
  }
  return { bookmarks: [], folders: [...DEFAULT_FOLDERS] };
}

async function writeStorage(data: StorageData): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: data });
}

async function withStorageLock<T>(fn: (data: StorageData) => Promise<T>): Promise<T> {
  return navigator.locks.request("clickbook_storage", async () => {
    const data = await readStorage();
    const result = await fn(data);
    await writeStorage(data);
    return result;
  });
}

// ── Bookmarks ─────────────────────────────────────────────

export async function getBookmarks(): Promise<Bookmark[]> {
  const data = await readStorage();
  return data.bookmarks;
}

export async function getAllData(): Promise<StorageData> {
  return await readStorage();
}

export async function addBookmark(bookmark: Bookmark): Promise<void> {
  await withStorageLock(async (data) => {
    data.bookmarks = [bookmark, ...data.bookmarks];
  });
}

export async function addBookmarks(newBookmarks: Bookmark[]): Promise<void> {
  await withStorageLock(async (data) => {
    data.bookmarks = [...newBookmarks, ...data.bookmarks];
  });
}

export async function deleteBookmark(id: string): Promise<void> {
  await withStorageLock(async (data) => {
    data.bookmarks = data.bookmarks.filter((b) => b.id !== id);
  });
  await deleteMemo(id);
  await deletePageContent(id);
}

export async function moveBookmark(
  id: string,
  folderId: string
): Promise<void> {
  await withStorageLock(async (data) => {
    data.bookmarks = data.bookmarks.map((b) =>
      b.id === id ? { ...b, folderId } : b
    );
  });
}

export async function updateBookmark(
  id: string,
  changes: { title?: string; url?: string; folderId?: string; summary?: string; tags?: string[] }
): Promise<void> {
  await withStorageLock(async (data) => {
    data.bookmarks = data.bookmarks.map((b) => {
      if (b.id !== id) return b;
      const url = changes.url ?? b.url;
      let domain = b.domain;
      let favicon = b.favicon;
      try {
        const parsed = new URL(url);
        domain = parsed.hostname;
        favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
      } catch (err) { console.warn("Invalid URL, kept original:", err); }
      return { ...b, ...changes, url, domain, favicon };
    });
  });
}

export async function isDuplicateUrl(url: string, excludeId?: string): Promise<boolean> {
  const data = await readStorage();
  return data.bookmarks.some((b) => b.url === url && b.id !== excludeId);
}

export async function incrementVisitCount(id: string): Promise<void> {
  await withStorageLock(async (data) => {
    data.bookmarks = data.bookmarks.map((b) =>
      b.id === id ? { ...b, visitCount: b.visitCount + 1, lastVisitedAt: Date.now() } : b
    );
  });
}

// ── Folders ───────────────────────────────────────────────

export async function getFolders(): Promise<Folder[]> {
  const data = await readStorage();
  return data.folders;
}

export async function createFolder(
  name: string,
  parentId: string | null,
  icon = "📁"
): Promise<Folder> {
  return await withStorageLock(async (data) => {
    const siblings = data.folders.filter((f) => f.parentId === parentId);
    const maxOrder = siblings.reduce((max, f) => Math.max(max, f.order), -1);

    const folder: Folder = {
      id: crypto.randomUUID(),
      name,
      nameJa: name,
      nameKo: name,
      icon,
      color: "indigo",
      parentId,
      order: maxOrder + 1,
      isDefault: false,
      collapsed: false,
      createdAt: Date.now(),
    };

    data.folders = [...data.folders, folder];
    return folder;
  });
}

export async function renameFolder(
  id: string,
  name: string,
  icon?: string
): Promise<void> {
  await withStorageLock(async (data) => {
    data.folders = data.folders.map((f) =>
      f.id === id ? { ...f, name, nameJa: name, nameKo: name, ...(icon ? { icon } : {}) } : f
    );
  });
}

export async function moveFolder(
  id: string,
  parentId: string | null,
  order: number
): Promise<void> {
  await withStorageLock(async (data) => {
    const targetFolderIndex = data.folders.findIndex((f) => f.id === id);
    if (targetFolderIndex === -1) return;
    const targetFolder = { ...data.folders[targetFolderIndex], parentId };

    const updatedFolders = [...data.folders];
    updatedFolders[targetFolderIndex] = targetFolder;

    let siblings = updatedFolders
      .filter((f) => f.parentId === parentId && f.id !== id)
      .sort((a, b) => a.order - b.order)
      .map(f => ({ ...f }));

    siblings.splice(order, 0, targetFolder);

    siblings.forEach((f, index) => {
      f.order = index;
    });

    const siblingIds = new Set(siblings.map(f => f.id));
    data.folders = [
      ...updatedFolders.filter(f => !siblingIds.has(f.id)),
      ...siblings
    ];
  });
}

export async function deleteFolder(id: string): Promise<void> {
  await withStorageLock(async (data) => {
    const target = data.folders.find((f) => f.id === id);
    if (!target || target.id === DEFAULT_FOLDER_ID) return;

    function collectDescendants(folderId: string): string[] {
      const children = data.folders.filter((f) => f.parentId === folderId);
      const ids: string[] = [];
      for (const child of children) {
        ids.push(child.id);
        ids.push(...collectDescendants(child.id));
      }
      return ids;
    }

    const toDelete = new Set([id, ...collectDescendants(id)]);

    data.bookmarks = data.bookmarks.map((b) =>
      toDelete.has(b.folderId) ? { ...b, folderId: DEFAULT_FOLDER_ID } : b
    );
    data.folders = data.folders.filter((f) => !toDelete.has(f.id));
  });
}

export async function deleteEmptyFolders(): Promise<number> {
  return await withStorageLock(async (data) => {
    let foldersDeleted = 0;
    let keepChecking = true;
    while (keepChecking) {
      keepChecking = false;
      const indexToDelete = data.folders.findIndex((folder) => {
        if (folder.isDefault || folder.locked) return false;
        const hasBookmarks = data.bookmarks.some((b) => b.folderId === folder.id);
        const hasChildren = data.folders.some((f) => f.parentId === folder.id);
        return !hasBookmarks && !hasChildren;
      });

      if (indexToDelete !== -1) {
        data.folders.splice(indexToDelete, 1);
        foldersDeleted++;
        keepChecking = true;
      }
    }
    return foldersDeleted;
  });
}

export async function toggleFolderCollapsed(id: string): Promise<void> {
  await withStorageLock(async (data) => {
    data.folders = data.folders.map((f) =>
      f.id === id ? { ...f, collapsed: !f.collapsed } : f
    );
  });
}

export async function collapseAllFolders(): Promise<void> {
  await withStorageLock(async (data) => {
    data.folders = data.folders.map((f) => ({ ...f, collapsed: true }));
  });
}

export async function toggleFolderLock(id: string): Promise<void> {
  await withStorageLock(async (data) => {
    data.folders = data.folders.map((f) =>
      f.id === id ? { ...f, locked: !f.locked } : f
    );
  });
}

export async function toggleFolderSecure(id: string): Promise<void> {
  await withStorageLock(async (data) => {
    data.folders = data.folders.map((f) =>
      f.id === id ? { ...f, secure: !f.secure } : f
    );
  });
}

// ── Export / Import ────────────────────────────────────────

export async function exportData(): Promise<ClickBookBackupData> {
  const [mainData, memos, todoBoard, settings, patterns, chromePatterns] = await Promise.all([
    readStorage(),
    readMemos(),
    getTodoBoard(),
    getSettings(),
    readPatterns(),
    readChromePatterns(),
  ]);

  return {
    version: "2.0.0",
    exportedAt: Date.now(),
    bookmarks: mainData.bookmarks,
    folders: mainData.folders,
    memos,
    todoBoard,
    settings,
    patterns,
    chromePatterns,
  };
}

function isValidBookmark(b: unknown): b is Bookmark {
  return (
    typeof b === "object" &&
    b !== null &&
    typeof (b as Bookmark).id === "string" &&
    typeof (b as Bookmark).url === "string" &&
    typeof (b as Bookmark).title === "string"
  );
}

export async function importData(incoming: ClickBookBackupData): Promise<{ count: number }> {
  if (!Array.isArray(incoming.bookmarks)) {
    throw new Error("Invalid import data format");
  }
  const validBookmarks = incoming.bookmarks.filter(isValidBookmark);
  const incomingFolders = Array.isArray(incoming.folders)
    ? incoming.folders
    : [...DEFAULT_FOLDERS];

  return await withStorageLock(async (data) => {
    const existingFolderIds = new Set(data.folders.map(f => f.id));
    const newFolders = incomingFolders.filter(f => !existingFolderIds.has(f.id));
    data.folders = [...data.folders, ...newFolders];

    const existingUrls = new Set(data.bookmarks.map(b => b.url));
    const newBookmarks = validBookmarks.filter(b => !existingUrls.has(b.url));
    data.bookmarks = [...newBookmarks, ...data.bookmarks];

    // ── Memos Restore & Cleaning ──
    let finalMemos = await readMemos();
    if (incoming.memos && typeof incoming.memos === "object") {
      finalMemos = { ...finalMemos, ...incoming.memos };
    }
    const validIds = new Set(data.bookmarks.map(b => b.id));
    const cleanedMemos: typeof finalMemos = {};
    for (const [key, memo] of Object.entries(finalMemos)) {
      if (key.startsWith("standalone_") || validIds.has(key)) {
        cleanedMemos[key] = memo;
      }
    }

    await Promise.all([
      chrome.storage.local.set({ [MEMOS_KEY]: cleanedMemos }),
      incoming.todoBoard && typeof incoming.todoBoard === "object"
        ? saveTodoBoard(incoming.todoBoard)
        : Promise.resolve(),
      incoming.settings && typeof incoming.settings === "object"
        ? saveSettings(incoming.settings)
        : Promise.resolve(),
      incoming.patterns && Array.isArray(incoming.patterns)
        ? readPatterns().then(existing => {
            const existingIds = new Set(existing.map(p => p.id));
            const fresh = incoming.patterns!.filter(p => !existingIds.has(p.id));
            return fresh.length > 0
              ? chrome.storage.local.set({ [PATTERNS_KEY]: [...existing, ...fresh] })
              : Promise.resolve();
          })
        : Promise.resolve(),
      incoming.chromePatterns && Array.isArray(incoming.chromePatterns)
        ? readChromePatterns().then(existing => {
            const existingIds = new Set(existing.map(p => p.id));
            const fresh = incoming.chromePatterns!.filter(p => !existingIds.has(p.id));
            return fresh.length > 0
              ? chrome.storage.local.set({ [CHROME_PATTERNS_KEY]: [...existing, ...fresh] })
              : Promise.resolve();
          })
        : Promise.resolve(),
    ]);

    return { count: newBookmarks.length };
  });
}


// ── Patterns ───────────────────────────────────────────────

const PATTERNS_KEY = "clickbook_patterns";
const SNAPSHOT_KEY = "clickbook_chrome_snapshot";

async function readPatterns(): Promise<import("./types").Pattern[]> {
  const r = await chrome.storage.local.get(PATTERNS_KEY);
  return Array.isArray(r[PATTERNS_KEY]) ? r[PATTERNS_KEY] : [];
}

export async function getPatterns(): Promise<import("./types").Pattern[]> {
  return readPatterns();
}

export async function savePattern(name: string, data: StorageData): Promise<import("./types").Pattern> {
  const patterns = await readPatterns();
  const pattern: import("./types").Pattern = {
    id: crypto.randomUUID(),
    name,
    bookmarks: data.bookmarks,
    folders: data.folders,
    createdAt: Date.now(),
  };
  await chrome.storage.local.set({ [PATTERNS_KEY]: [...patterns, pattern] });
  return pattern;
}

export async function loadPattern(id: string): Promise<void> {
  const patterns = await readPatterns();
  const pattern = patterns.find((p) => p.id === id);
  if (!pattern) throw new Error("Pattern not found");
  await writeStorage({ bookmarks: pattern.bookmarks, folders: pattern.folders });
}

export async function deletePattern(id: string): Promise<void> {
  const patterns = await readPatterns();
  await chrome.storage.local.set({ [PATTERNS_KEY]: patterns.filter((p) => p.id !== id) });
}

// ── Chrome Snapshot ────────────────────────────────────────

export async function saveChromeSnapshot(tree: chrome.bookmarks.BookmarkTreeNode[]): Promise<void> {
  await chrome.storage.local.set({ [SNAPSHOT_KEY]: tree });
}

export async function getChromeSnapshot(): Promise<chrome.bookmarks.BookmarkTreeNode[] | null> {
  const r = await chrome.storage.local.get(SNAPSHOT_KEY);
  return r[SNAPSHOT_KEY] ?? null;
}

// ── Chrome Patterns ────────────────────────────────────────

const CHROME_PATTERNS_KEY = "clickbook_chrome_patterns";

async function readChromePatterns(): Promise<import("./types").ChromePattern[]> {
  const r = await chrome.storage.local.get(CHROME_PATTERNS_KEY);
  return Array.isArray(r[CHROME_PATTERNS_KEY]) ? r[CHROME_PATTERNS_KEY] : [];
}

export async function getChromePatterns(): Promise<import("./types").ChromePattern[]> {
  return readChromePatterns();
}

export async function saveChromePattern(
  name: string,
  items: Array<{ url: string; title: string }>
): Promise<import("./types").ChromePattern> {
  const patterns = await readChromePatterns();
  const pattern: import("./types").ChromePattern = {
    id: crypto.randomUUID(),
    name,
    items,
    createdAt: Date.now(),
  };
  await chrome.storage.local.set({ [CHROME_PATTERNS_KEY]: [...patterns, pattern] });
  return pattern;
}

export async function deleteChromePattern(id: string): Promise<void> {
  const patterns = await readChromePatterns();
  await chrome.storage.local.set({ [CHROME_PATTERNS_KEY]: patterns.filter((p) => p.id !== id) });
}

// ── Memos ─────────────────────────────────────────────────

const MEMOS_KEY = "clickbook_memos";

async function readMemos(): Promise<import("./types").MemoMap> {
  const r = await chrome.storage.local.get(MEMOS_KEY);
  return r[MEMOS_KEY] && typeof r[MEMOS_KEY] === "object" ? r[MEMOS_KEY] : {};
}

export async function getMemos(): Promise<import("./types").MemoMap> {
  return readMemos();
}

export async function saveMemo(
  bookmarkId: string,
  content: string,
  color: import("./types").MemoColor
): Promise<void> {
  const memos = await readMemos();
  memos[bookmarkId] = { bookmarkId, content, color, updatedAt: Date.now() };
  await chrome.storage.local.set({ [MEMOS_KEY]: memos });
}

export async function deleteMemo(bookmarkId: string): Promise<void> {
  const memos = await readMemos();
  delete memos[bookmarkId];
  await chrome.storage.local.set({ [MEMOS_KEY]: memos });
}

// ── Settings ──────────────────────────────────────────────

const SETTINGS_KEY = "clickbook_settings";

export const DEFAULT_SETTINGS: import("./types").AppSettings = {
  recentCount: 8,
  rankingCount: 5,
  recommendCount: 6,
  maxFolderDepth: 3,
  keepExistingFolders: false,
  openDashboardInNewTab: false,
  useClickBookAsNewTab: false,
  gcInterval: "daily",
  enableTodoNotifications: false,
  customSearchConfigs: [],
  customPresets: [],
};

export async function getSettings(): Promise<import("./types").AppSettings> {
  const r = await chrome.storage.local.get(SETTINGS_KEY);
  const s = r[SETTINGS_KEY];
  if (s && typeof s === "object") {
    return { ...DEFAULT_SETTINGS, ...s };
  }
  return { ...DEFAULT_SETTINGS };
}

export async function saveSettings(settings: import("./types").AppSettings): Promise<void> {
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
}

export async function factoryReset(): Promise<void> {
  // chrome.storage.local의 모든 데이터를 삭제
  await chrome.storage.local.clear();
  
  // 필수 기본 데이터 명시적 초기화
  await chrome.storage.local.set({
    clickbook_data: { bookmarks: [], folders: [...DEFAULT_FOLDERS] },
    clickbook_settings: { ...DEFAULT_SETTINGS },
    clickbook_onboarded: false
  });
}

// ── TODO Board ──────────────────────────────────────────────

const TODO_BOARD_KEY = "clickbook_todo_board";

export const DEFAULT_TODO_BOARD: import("./types").TodoBoardData = {
  tasks: {},
  columns: {
    "col-1": { id: "col-1", title: "To Do", taskIds: [] },
    "col-2": { id: "col-2", title: "In Progress", taskIds: [] },
    "col-3": { id: "col-3", title: "Done", taskIds: [] },
  },
  columnOrder: ["col-1", "col-2", "col-3"],
};

export async function getTodoBoard(): Promise<import("./types").TodoBoardData> {
  const r = await chrome.storage.local.get(TODO_BOARD_KEY);
  const data = r[TODO_BOARD_KEY];
  if (data && typeof data === "object" && Array.isArray(data.columnOrder)) {
    return data as import("./types").TodoBoardData;
  }
  return DEFAULT_TODO_BOARD;
}

export async function saveTodoBoard(data: import("./types").TodoBoardData): Promise<void> {
  await chrome.storage.local.set({ [TODO_BOARD_KEY]: data });
}

// ── Page Contents (FTS & Offline Reader) ───────────────────

const PAGE_CONTENTS_KEY = "clickbook_page_contents";
const PAGE_CONTENT_PREFIX = "clickbook_content_";
const FTS_INDEX_KEY = "clickbook_fts_index";

export async function getPageContents(): Promise<Record<string, string>> {
  const r = await chrome.storage.local.get(FTS_INDEX_KEY);
  return r[FTS_INDEX_KEY] ?? {};
}

export async function getPageContent(bookmarkId: string): Promise<import("./types").PageContent | null> {
  const key = PAGE_CONTENT_PREFIX + bookmarkId;
  const r = await chrome.storage.local.get(key);
  return r[key] ?? null;
}

export async function savePageContent(
  bookmarkId: string,
  rawText: string,
  readableContent: string
): Promise<void> {
  // 1. 개별 PageContent 키에 정밀 타격 저장
  const contentKey = PAGE_CONTENT_PREFIX + bookmarkId;
  const contentObj: import("./types").PageContent = {
    bookmarkId,
    rawText,
    readableContent,
    scrapedAt: Date.now()
  };
  await chrome.storage.local.set({ [contentKey]: contentObj });

  // 2. 검색에 활용되는 컴팩트 FTS 인덱스만 단일 키에 누적 보관
  const r = await chrome.storage.local.get(FTS_INDEX_KEY);
  const index = r[FTS_INDEX_KEY] ?? {};
  
  // Truncate rawText for FTS index to avoid exceeding storage quota (e.g. 10,000 chars max, and clean up whitespace)
  const cleanedText = rawText.replace(/\s+/g, " ").substring(0, 10000);
  index[bookmarkId] = cleanedText;
  
  await chrome.storage.local.set({ [FTS_INDEX_KEY]: index });
}

export async function deletePageContent(bookmarkId: string): Promise<void> {
  // 1. 개별 PageContent 키 삭제
  const contentKey = PAGE_CONTENT_PREFIX + bookmarkId;
  await chrome.storage.local.remove(contentKey);

  // 2. FTS 인덱스에서 제거
  const r = await chrome.storage.local.get(FTS_INDEX_KEY);
  const index = r[FTS_INDEX_KEY] ?? {};
  if (index[bookmarkId] !== undefined) {
    delete index[bookmarkId];
    await chrome.storage.local.set({ [FTS_INDEX_KEY]: index });
  }
}

// ── 데이터 마이그레이션 (레거시 단일 키 -> 분산 개별 키 + FTS 인덱스) ──
export async function migratePageContents(): Promise<void> {
  const legacyData = await chrome.storage.local.get(PAGE_CONTENTS_KEY);
  const contents = legacyData[PAGE_CONTENTS_KEY];
  if (!contents || typeof contents !== "object" || Object.keys(contents).length === 0) {
    return;
  }

  console.log(`[Storage Migration] Starting migration of ${Object.keys(contents).length} legacy page contents...`);

  const ftsIndex: Record<string, string> = {};
  const batchSize = 20;
  const entries = Object.entries(contents);

  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);
    const saveObj: Record<string, any> = {};

    for (const [id, content] of batch) {
      if (content && typeof content === "object") {
        const rawText = (content as any).rawText ?? "";
        const readableContent = (content as any).readableContent ?? "";
        const scrapedAt = (content as any).scrapedAt ?? Date.now();

        // 1. 개별 키 세팅
        const contentKey = PAGE_CONTENT_PREFIX + id;
        saveObj[contentKey] = {
          bookmarkId: id,
          rawText,
          readableContent,
          scrapedAt
        };

        // 2. FTS 인덱스 구성
        ftsIndex[id] = rawText;
      }
    }

    if (Object.keys(saveObj).length > 0) {
      await chrome.storage.local.set(saveObj);
    }
  }

  // 3. 컴팩트 FTS 인덱스 반영
  const r = await chrome.storage.local.get(FTS_INDEX_KEY);
  const existingFts = r[FTS_INDEX_KEY] ?? {};
  const mergedFts = { ...existingFts, ...ftsIndex };
  await chrome.storage.local.set({ [FTS_INDEX_KEY]: mergedFts });

  // 4. 레거시 마스터 키 소거 (1회성 작업 완료)
  await chrome.storage.local.remove(PAGE_CONTENTS_KEY);
  console.log("[Storage Migration] Migration completed successfully. Legacy clickbook_page_contents key removed.");
}

// ── 백그라운드 위생 가비지 컬렉터 (GC) ──
export async function runGarbageCollector(): Promise<void> {
  console.log("[GC] Starting storage garbage collection...");
  
  await withStorageLock(async (data) => {
    const activeIds = new Set(data.bookmarks.map(b => b.id));

    const allStorage = await chrome.storage.local.get(null);
    const keysToRemove: string[] = [];

    // 1. 살아있는 북마크가 없는 고아 clickbook_content_{bookmarkId} 키 완전 제거
    for (const key of Object.keys(allStorage)) {
      if (key.startsWith(PAGE_CONTENT_PREFIX)) {
        const bookmarkId = key.substring(PAGE_CONTENT_PREFIX.length);
        if (!activeIds.has(bookmarkId)) {
          keysToRemove.push(key);
        }
      }
    }

    if (keysToRemove.length > 0) {
      await chrome.storage.local.remove(keysToRemove);
      console.log(`[GC] Cleaned up ${keysToRemove.length} orphaned reader content keys.`);
    }

    // 2. 살아있는 북마크가 없는 고아 FTS 인덱스 원소 소거
    const ftsIndex = allStorage[FTS_INDEX_KEY] ?? {};
    let ftsChanged = false;
    for (const bookmarkId of Object.keys(ftsIndex)) {
      if (!activeIds.has(bookmarkId)) {
        delete ftsIndex[bookmarkId];
        ftsChanged = true;
      }
    }
    if (ftsChanged) {
      await chrome.storage.local.set({ [FTS_INDEX_KEY]: ftsIndex });
      console.log("[GC] Cleaned up orphaned entries from compact FTS index.");
    }

    // 3. 살아있는 북마크가 없는 고아 메모 제거 (단, standalone_ 프리픽스는 보존)
    const memos = allStorage[MEMOS_KEY] && typeof allStorage[MEMOS_KEY] === "object" ? allStorage[MEMOS_KEY] : {};
    let memosChanged = false;
    for (const key of Object.keys(memos)) {
      if (!key.startsWith("standalone_") && !activeIds.has(key)) {
        delete memos[key];
        memosChanged = true;
      }
    }
    if (memosChanged) {
      await chrome.storage.local.set({ [MEMOS_KEY]: memos });
      console.log("[GC] Cleaned up orphaned memos.");
    }
  });

  console.log("[GC] Garbage collection run completed successfully.");
}

export interface OrphanedStats {
  count: number;
  bytes: number;
}

export async function getOrphanedStorageStats(): Promise<OrphanedStats> {
  const bookmarks = await getBookmarks();
  const activeIds = new Set(bookmarks.map((b) => b.id));

  const allStorage = await chrome.storage.local.get(null);
  let count = 0;
  let bytes = 0;

  // 1. Orphaned page content keys (clickbook_content_*)
  for (const [key, val] of Object.entries(allStorage)) {
    if (key.startsWith(PAGE_CONTENT_PREFIX)) {
      const bookmarkId = key.substring(PAGE_CONTENT_PREFIX.length);
      if (!activeIds.has(bookmarkId)) {
        count++;
        try {
          const str = JSON.stringify(val);
          bytes += str ? str.length : 0;
        } catch (_) {}
      }
    }
  }

  // 2. Orphaned FTS index entries
  const ftsIndex = allStorage[FTS_INDEX_KEY] ?? {};
  for (const [bookmarkId, rawText] of Object.entries(ftsIndex)) {
    if (!activeIds.has(bookmarkId)) {
      count++;
      try {
        const str = JSON.stringify(rawText);
        bytes += str ? str.length : 0;
      } catch (_) {}
    }
  }

  // 3. Orphaned memos
  const memos = allStorage[MEMOS_KEY] ?? {};
  for (const [key, memo] of Object.entries(memos)) {
    if (!key.startsWith("standalone_") && !activeIds.has(key)) {
      count++;
      try {
        const str = JSON.stringify(memo);
        bytes += str ? str.length : 0;
      } catch (_) {}
    }
  }

  return { count, bytes };
}

