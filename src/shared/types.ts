// =============================
// GitHubランキング用型定義
// =============================

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string;
  stargazers_count: number;
  forks_count: number;
  language: string;
  open_issues_count: number;
  pushed_at: string;
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
}

export interface GitHubRankingCache {
  date: string; // YYYY-MM-DD
  items: GitHubRepo[];
  customQueries: Record<string, GitHubRepo[]>; // クエリ文字列→結果
}
// ============================================================
// Bookmark & Folder 型定義
// ============================================================

export interface Bookmark {
  id: string;
  url: string;
  title: string;
  favicon: string;
  ogpImage?: string;
  folderId: string;
  domain: string;
  visitCount: number;
  savedAt: number;
  summary?: string;
  tags?: string[];
}

export interface Folder {
  id: string;
  name: string;
  nameJa: string;
  icon: string;
  color: string;
  parentId: string | null;
  order: number;
  isDefault: boolean;
  collapsed: boolean;
  locked?: boolean;
  createdAt: number;
}

export type StorageData = {
  bookmarks: Bookmark[];
  folders: Folder[];
};

export interface Pattern {
  id: string;
  name: string;
  bookmarks: Bookmark[];
  folders: Folder[];
  createdAt: number;
}

export type MemoColor = "yellow" | "pink" | "blue" | "green" | "purple";

export interface AppSettings {
  recentCount: number;          // 最近追加の表示数 default: 8
  rankingCount: number;         // よく見るサイト表示数 default: 5
  recommendCount: number;       // AI 추천 사이트 표시수 default: 6
  maxFolderDepth: number;       // 最大フォルダー段階数 default: 3
  keepExistingFolders: boolean; // AI整理時に既存フォルダーを変更しない default: false
  openDashboardInNewTab: boolean; // Dashboard 탭 열기 방식 default: true
}


export interface BookmarkMemo {
  bookmarkId: string;
  content: string;
  color: MemoColor;
  updatedAt: number;
}

export type MemoMap = Record<string, BookmarkMemo>;

export interface ChromePattern {
  id: string;
  name: string;
  items: Array<{ url: string; title: string }>;
  createdAt: number;
}

// Service Worker メッセージ型
export type Message =
  | { type: "SAVE_TAB" }
  | { type: "GET_BOOKMARKS" }
  | { type: "GET_ALL_DATA" }
  | { type: "DELETE_BOOKMARK"; id: string }
  | { type: "MOVE_BOOKMARK"; id: string; folderId: string }
  | { type: "CREATE_FOLDER"; name: string; parentId: string | null; icon?: string }
  | { type: "RENAME_FOLDER"; id: string; name: string; icon?: string }
  | { type: "MOVE_FOLDER"; id: string; parentId: string | null; order: number }
  | { type: "DELETE_FOLDER"; id: string }
  | { type: "TOGGLE_FOLDER"; id: string }
  | { type: "TOGGLE_FOLDER_LOCK"; id: string }
  | { type: "EXPORT_DATA" }
  | { type: "IMPORT_DATA"; data: StorageData }
  | { type: "GET_CHROME_BOOKMARKS" }
  | { type: "SYNC_TO_CHROME" }
  | { type: "SAVE_CHROME_SNAPSHOT" }
  | { type: "RESTORE_CHROME_SNAPSHOT" }
  | { type: "BULK_IMPORT_CHROME"; items: Array<{ url: string; title: string }>; folderId?: string }
  | { type: "ADD_CHROME_BOOKMARKS"; items: Array<{ url: string; title: string }>; parentId?: string }
  | { type: "GET_MEMOS" }
  | { type: "SAVE_MEMO"; bookmarkId: string; content: string; color: MemoColor }
  | { type: "DELETE_MEMO"; bookmarkId: string }
  | { type: "GET_PATTERNS" }
  | { type: "SAVE_PATTERN"; name: string }
  | { type: "LOAD_PATTERN"; id: string }
  | { type: "DELETE_PATTERN"; id: string }
  | { type: "UPDATE_BOOKMARK"; id: string; title: string; url: string; folderId: string }
  | { type: "ADD_BOOKMARK"; url: string; title: string; folderId: string }
  | { type: "INCREMENT_VISIT"; id: string }
  | { type: "RENAME_CHROME_BOOKMARK"; id: string; title: string }
  | { type: "DELETE_CHROME_BOOKMARK"; id: string; isFolder: boolean }
  | { type: "MOVE_CHROME_BOOKMARK"; id: string; parentId: string; index?: number }
  | { type: "GET_CHROME_PATTERNS" }
  | { type: "SAVE_CHROME_PATTERN"; name: string }
  | { type: "LOAD_CHROME_PATTERN"; id: string }
  | { type: "DELETE_CHROME_PATTERN"; id: string }
  | { type: "AI_REORGANIZE" }
  | { type: "AI_REORGANIZE_STATUS" }
  | { type: "RECOMMEND_SITES"; keyword: string; count?: number }
  | { type: "EXPAND_SEARCH"; query: string }
  | { type: "FACTORY_RESET" }
  | { type: "GET_SETTINGS" }
  | { type: "SAVE_SETTINGS"; settings: AppSettings }
  | { type: "UPDATE_AI_INFO"; id: string; url: string; title: string };

export type MessageResponse =
  | { success: true; data?: unknown }
  | { success: false; error: string; isDuplicate?: boolean };
