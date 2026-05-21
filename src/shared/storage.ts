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
import type { Bookmark, Folder, StorageData } from "./types";
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
    return await fn(data);
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
  const data = await readStorage();
  data.bookmarks = [bookmark, ...data.bookmarks];
  await writeStorage(data);
}

export async function addBookmarks(newBookmarks: Bookmark[]): Promise<void> {
  const data = await readStorage();
  data.bookmarks = [...newBookmarks, ...data.bookmarks];
  await writeStorage(data);
}

export async function deleteBookmark(id: string): Promise<void> {
  const data = await readStorage();
  data.bookmarks = data.bookmarks.filter((b) => b.id !== id);
  await writeStorage(data);
  await deleteMemo(id);
}

export async function moveBookmark(
  id: string,
  folderId: string
): Promise<void> {
  const data = await readStorage();
  data.bookmarks = data.bookmarks.map((b) =>
    b.id === id ? { ...b, folderId } : b
  );
  await writeStorage(data);
}

export async function updateBookmark(
  id: string,
  changes: { title?: string; url?: string; folderId?: string; summary?: string; tags?: string[] }
): Promise<void> {
  const data = await readStorage();
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
  await writeStorage(data);
}

export async function isDuplicateUrl(url: string, excludeId?: string): Promise<boolean> {
  const data = await readStorage();
  return data.bookmarks.some((b) => b.url === url && b.id !== excludeId);
}

export async function incrementVisitCount(id: string): Promise<void> {
  const data = await readStorage();
  data.bookmarks = data.bookmarks.map((b) =>
    b.id === id ? { ...b, visitCount: b.visitCount + 1 } : b
  );
  await writeStorage(data);
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
  const data = await readStorage();
  const siblings = data.folders.filter((f) => f.parentId === parentId);
  const maxOrder = siblings.reduce((max, f) => Math.max(max, f.order), -1);

  const folder: Folder = {
    id: crypto.randomUUID(),
    name,
    nameJa: name,
    icon,
    color: "indigo",
    parentId,
    order: maxOrder + 1,
    isDefault: false,
    collapsed: false,
    createdAt: Date.now(),
  };

  data.folders = [...data.folders, folder];
  await writeStorage(data);
  return folder;
}

export async function renameFolder(
  id: string,
  name: string,
  icon?: string
): Promise<void> {
  const data = await readStorage();
  data.folders = data.folders.map((f) =>
    f.id === id ? { ...f, name, nameJa: name, ...(icon ? { icon } : {}) } : f
  );
  await writeStorage(data);
}

export async function moveFolder(
  id: string,
  parentId: string | null,
  order: number
): Promise<void> {
  const data = await readStorage();
  
  // Update parentId of the target folder first
  const targetFolder = data.folders.find((f) => f.id === id);
  if (!targetFolder) return;
  targetFolder.parentId = parentId;

  // Get all siblings in the new parent, sorted by current order
  let siblings = data.folders
    .filter((f) => f.parentId === parentId && f.id !== id)
    .sort((a, b) => a.order - b.order);

  // Insert the target folder at the specified order (index)
  siblings.splice(order, 0, targetFolder);

  // Re-assign sequential order to all siblings
  siblings.forEach((f, index) => {
    f.order = index;
  });

  await writeStorage(data);
}

export async function deleteFolder(id: string): Promise<void> {
  const data = await readStorage();
  const target = data.folders.find((f) => f.id === id);
  if (!target || target.id === DEFAULT_FOLDER_ID) return; // "other" フォルダーのみ削除不可

  // 子フォルダーのIDを再帰的に収集
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

  // 削除対象フォルダーのブックマークを "other" へ移動
  data.bookmarks = data.bookmarks.map((b) =>
    toDelete.has(b.folderId) ? { ...b, folderId: DEFAULT_FOLDER_ID } : b
  );
  data.folders = data.folders.filter((f) => !toDelete.has(f.id));
  await writeStorage(data);
}

export async function toggleFolderCollapsed(id: string): Promise<void> {
  const data = await readStorage();
  data.folders = data.folders.map((f) =>
    f.id === id ? { ...f, collapsed: !f.collapsed } : f
  );
  await writeStorage(data);
}

export async function collapseAllFolders(): Promise<void> {
  const data = await readStorage();
  data.folders = data.folders.map((f) => ({ ...f, collapsed: true }));
  await writeStorage(data);
}

export async function toggleFolderLock(id: string): Promise<void> {
  const data = await readStorage();
  data.folders = data.folders.map((f) =>
    f.id === id ? { ...f, locked: !f.locked } : f
  );
  await writeStorage(data);
}

// ── Export / Import ────────────────────────────────────────

export async function exportData(): Promise<StorageData> {
  return await readStorage();
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

export async function importData(incoming: StorageData): Promise<void> {
  if (!Array.isArray(incoming.bookmarks)) {
    throw new Error("Invalid import data format");
  }
  const validBookmarks = incoming.bookmarks.filter(isValidBookmark);
  // フォルダーが無ければデフォルトを使用
  const folders = Array.isArray(incoming.folders)
    ? incoming.folders
    : [...DEFAULT_FOLDERS];
  await writeStorage({ bookmarks: validBookmarks, folders });

  // インポート後に孤立したメモ (対応ブックマークなし・非スタンドアロン) を削除
  const validIds = new Set(validBookmarks.map(b => b.id));
  const memos = await readMemos();
  const cleaned: typeof memos = {};
  for (const [key, memo] of Object.entries(memos)) {
    if (key.startsWith("standalone_") || validIds.has(key)) {
      cleaned[key] = memo;
    }
  }
  await chrome.storage.local.set({ [MEMOS_KEY]: cleaned });
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
