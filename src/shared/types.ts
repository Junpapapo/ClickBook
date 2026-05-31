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
  timestamp: number;
  items: GitHubRepo[];
  customQueries: Record<string, GitHubRepo[]>; // クエリ文字列→結果
}

// =============================
// Wiki/HF/HN 랭킹용형 정의
// =============================

export interface WikiArticle {
  article: string;
  views: number;
  rank: number;
  url: string;
}

export interface HFModel {
  id: string;
  author: string;
  repo_name: string;
  likes: number;
  downloads: number;
  lastModified: string;
  url: string;
}

export interface HNStory {
  id: number;
  title: string;
  url: string;
  score: number;
  by: string;
  time: number;
  descendants: number;
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
  lastVisitedAt?: number;
  summary?: string;
  tags?: string[];
}

export interface Folder {
  id: string;
  name: string;
  nameJa: string;
  nameKo?: string;
  icon: string;
  color: string;
  parentId: string | null;
  order: number;
  isDefault: boolean;
  collapsed: boolean;
  locked?: boolean;
  secure?: boolean;
  createdAt: number;
}

export type StorageData = {
  bookmarks: Bookmark[];
  folders: Folder[];
};

export interface ClickBookBackupData {
  version: string;
  exportedAt: number;
  bookmarks: Bookmark[];
  folders: Folder[];
  memos?: Record<string, BookmarkMemo>;
  todoBoard?: TodoBoardData;
  settings?: AppSettings;
}

export interface Pattern {
  id: string;
  name: string;
  bookmarks: Bookmark[];
  folders: Folder[];
  createdAt: number;
}

export type MemoColor = "yellow" | "pink" | "blue" | "green" | "purple";

export interface CustomSearchConfig {
  id: string;
  name: string;
  urlTemplate: string;
}

export interface AppSettings {
  recentCount: number;          // 最近追加の表示数 default: 8
  rankingCount: number;         // よく見るサイト表示数 default: 5
  recommendCount: number;       // AI 추천 사이트 표시수 default: 6
  maxFolderDepth: number;       // 最大フォルダー段階数 default: 3
  keepExistingFolders: boolean; // AI整理時に既存フォルダーを変更しない default: false
  openDashboardInNewTab: boolean; // Dashboard 탭 열기 방식 default: false
  useClickBookAsNewTab: boolean; // 새 탭 페이지로 ClickBook 사용 여부 default: true
  gcInterval?: "daily" | "weekly" | "off"; // 백그라운드 위생 청소 알람 주기
  enableTodoNotifications?: boolean; // TODO 알림 수신 여부
  customSearchConfigs?: CustomSearchConfig[]; // 커스텀 검색 설정
  customPresets?: CustomSearchConfig[]; // 사용자 정의 커스텀 검색 프리셋
}


export interface BookmarkMemo {
  bookmarkId: string;
  content: string;
  color: MemoColor;
  updatedAt: number;
}

export type MemoMap = Record<string, BookmarkMemo>;

export interface PageContent {
  bookmarkId: string;
  rawText: string;
  readableContent: string;
  scrapedAt: number;
}

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
  | { type: "IMPORT_DATA"; data: ClickBookBackupData }
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
  | { type: "UPDATE_BOOKMARK"; id: string; title: string; url: string; folderId: string; tags?: string[] }
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
  | { type: "GET_CHROME_TAB_GROUPS" }
  | { type: "SAVE_TAB_GROUP_AS_FOLDER"; groupId: number; name: string }
  | { type: "OPEN_FOLDER_AS_TAB_GROUP"; folderId: string }
  | { type: "TOGGLE_FOLDER_SECURE"; id: string }
  | { type: "UPDATE_AI_INFO"; id: string; url: string; title: string }
  | { type: "GET_TODO_BOARD" }
  | { type: "SAVE_TODO_BOARD"; data: TodoBoardData }
  | { type: "SUSPEND_TAB"; tabId: number }
  | { type: "SUSPEND_ALL_INACTIVE" }
  | { type: "UNSUSPEND_ALL" }
  | { type: "GET_SUSPEND_COUNT" }
  | { type: "GET_PAGE_CONTENTS" }
  | { type: "GET_PAGE_CONTENT"; bookmarkId: string }
  | { type: "SAVE_PAGE_CONTENT"; bookmarkId: string; rawText: string; readableContent: string }
  | { type: "DELETE_PAGE_CONTENT"; bookmarkId: string }
  | { type: "RUN_GARBAGE_COLLECTOR" }
  | { type: "GET_ORPHANED_STATS" }
  | { type: "COLLAPSE_ALL_FOLDERS" }
  | { type: "CHECK_DOMAIN_SECURE"; url: string };


export type MessageResponse<T = any> =
  | { success: true; data?: T; isSecure?: boolean }
  | { success: false; error: string; isDuplicate?: boolean; isSecure?: boolean };

// =============================
// TODO Board (Kanban) Models
// =============================

export interface TodoChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface TodoTask {
  id: string;
  content: string; // Title
  description?: string; // Detailed description
  tags?: string[];
  checklist?: TodoChecklistItem[];
  progress?: number; // 0 to 100
  completed?: boolean;
  color?: string; // Task card color
  startDate?: string; // "YYYY-MM-DD"
  dueDate?: string;   // "YYYY-MM-DD"
  dueTime?: string;   // "HH:MM"
  reminder?: "none" | "at_due" | "15m_before" | "1h_before" | "3h_before" | "1d_before";
  createdAt: number;
}

export interface TodoColumn {
  id: string;
  title: string;
  taskIds: string[];
  color?: string;
}

export interface TodoBoardData {
  tasks: Record<string, TodoTask>;
  columns: Record<string, TodoColumn>;
  columnOrder: string[];
}

// =============================
// Task Control Center Models
// =============================

export type TaskStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export type TaskCategory = "ai-organize" | "ai-tag" | "ai-clean" | "chrome-sync" | "scrape";

export interface TaskItem {
  id: string;
  category: TaskCategory;
  name: string;
  status: TaskStatus;
  progress: number;              // 0~100
  detail?: string;               // e.g. "45/66 bookmarks"
  error?: string;                // error message on failure
  startedAt?: number;
  completedAt?: number;
  result?: {
    summary: string;
    [key: string]: unknown;
  };
}

// =============================
// Page Navigation Types
// =============================

export type PageId =
  | "dashboard"
  | "folder"
  | "memo"
  | "todo"
  | "tagboard"
  | "map"
  | "github"
  | "wiki"
  | "hf"
  | "hn"
  | "taskcontrol";
