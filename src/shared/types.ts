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
  patterns?: Pattern[];
  chromePatterns?: ChromePattern[];
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

export interface BuddyConfig {
  enabled: boolean;
  buddyId: string;             // "owl" | "cat" | "fox" ...
  buddyType?: "basic" | "premium" | "hidden"; // 캐릭터 등급 타입
  buddyName?: string;          // 버디의 고유 이름
  theme?: "midnight" | "cozy" | "sky" | "sweet" | "fresh" | "carbon" | "cyber"; // 버디 보조창 및 다이얼 테마
  targetLanguage?: string;     // 드래그/빠른 번역 기본 대상 언어 ("ko", "en", "ja"...)
  size: number;                // 64~192px (기본 96)
  animationInterval: number;   // 500~3000ms (기본 1000)
  position: { x: number; y: number }; // % 기반 위치 (드래그 저장)
  opacity: number;             // 0.3~1.0
  hiddenSites: string[];       // 숨김 처리된 도메인 리스트
  enabledMenuItems: string[];  // 활성 메뉴 아이템 ID
  isPomodoroMode?: boolean;    // 집중/휴식 뽀모도로 기능 활성화 여부
  isReversePomodoro?: boolean;  // 뽀모도로 리버스 모드 활성화 여부
  isSoundEnabled?: boolean;    // 타이머 완료 시 효과음 재생 여부
  isDndMode?: boolean;         // 집중 시 주변 요소 흐리게 처리하는 방해 금지 모드 여부
  asmrType?: "off" | "rain" | "metronome"; // 집중 시 재생할 백색 소음 종류
  aiPromptPresets?: string[];  // 사용자가 정의한 커스텀 AI 질문 프리셋 목록
  timerSize?: "S" | "M" | "L"; // 타이머 숫자 크기 (S: 소, M: 중, L: 대)
  timerColor?: "default" | "purple" | "blue" | "mint" | "rose" | "yellow" | "white" | "orange"; // 타이머 숫자 색상
  showDragMenu?: boolean;      // 드래그 시 나오는 팝업 메뉴 표시 여부
  timerCompleteTheme?: "night" | "forest" | "ocean" | "fireplace" | "sunset" | "yoga" | "gallery" | "breath" | "comic_random" | "comic1" | "comic2" | "comic3" | "comic4" | "comic5" | "comic6" | "comic7" | "comic8" | "comic9" | "comic10" | "comic11" | "comic12" | "comic13" | "comic14" | "comic15" | "comic16" | "comic17" | "comic18" | "random"; // 타이머 완료 시 효과 테마
  restRandomTheme?: boolean;   // 휴식 클릭 시 완료테마 랜덤 적용 여부
  focusRandomTheme?: boolean;  // 집중 완료 시 효과 테마 랜덤 적용 여부
  galleryOfflineMode?: boolean; // 명화 갤러리 로컬 이미지 우선(오프라인) 모드 여부
  level?: number;              // 버디의 레벨 (기본 1)
  xp?: number;                 // 누적 경험치 (기본 0)
  unlockedBuddies?: string[];  // 해금된 캐릭터 ID 리스트
  revealHidden?: boolean;      // Reveal All 토글 - 모든 히든 캐릭터 강제 표시
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
  holidayCountry?: "auto" | "KR" | "JP" | "US" | "off"; // 공휴일 표시 국가 설정
  buddyConfig?: BuddyConfig;   // 버디 설정 추가
}


export interface AnchoredMemo {
  id: string;
  anchorText: string;
  content: string;
  color: MemoColor;
  updatedAt: number;
}

export interface BookmarkMemo {
  bookmarkId: string;
  content: string;
  color: MemoColor;
  updatedAt: number;
  anchoredMemos?: AnchoredMemo[];
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
  | { type: "BUDDY_TRANSLATE"; text: string; srcLang: string; targetLang: string; actionType?: "translate" | "summary" | "vocab" }
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
  | { type: "CHECK_DOMAIN_SECURE"; url: string }
  | { type: "GET_BUDDY_CONFIG" }
  | { type: "SAVE_BUDDY_CONFIG"; config: BuddyConfig }
  | { type: "BUDDY_SAVE_BOOKMARK"; url: string; title: string }
  | { type: "BUDDY_SAVE_MEMO"; url: string; content: string; color: MemoColor }
  | { type: "BUDDY_HIDE_SITE"; domain: string }
  | { type: "BUDDY_UNHIDE_SITE"; domain: string }
  | { type: "BUDDY_CHECK_BOOKMARK"; url: string }
  | { type: "BUDDY_ASK_AI"; text: string; context?: string }
  | { type: "BUDDY_GET_MEMO"; url: string }
  | { type: "BUDDY_DELETE_MEMO"; url: string }
  | { type: "BUDDY_GET_ALL_MEMOS" };


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

export interface NoteObject {
  id: string;
  type: "image" | "bookmark-memo" | "table";
  x: number;          // 캔버스 가로 비율 (%)
  y: number;          // 캔버스 세로 px
  width: number;
  height: number;
  rotation?: number;  // 회전각 (-180 ~ 180deg)
  content: string;    // imageId 또는 bookmarkId
  metadata?: {
    title?: string;
    url?: string;
    favicon?: string;
    memoColor?: string;
    fontSize?: number;
    fontFamily?: "serif" | "sans" | "mono";
    tableData?: string[][];
    tableRows?: number;
    tableCols?: number;
    borderColor?: string;   // 외곽선 색상 (예: "indigo", "rose" 등 또는 CSS 값)
    borderWidth?: number;   // 외곽선 두께 (px)
    flipH?: boolean;        // 좌우 반전
    flipV?: boolean;        // 상하 반전
  };
}

export interface NotePage {
  id: string;
  pageNumber: number;
  text: string;
  objects: NoteObject[];
}

export interface TodoTask {
  id: string;
  content: string; // Title
  icon?: string;   // Icon or emoji name
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
  recurrence?: "none" | "daily" | "weekly" | "monthly"; // 반복 일정 설정
  isHoliday?: boolean; // 사용자가 수동 설정한 휴일 여부
  type?: "todo" | "event" | "holiday"; // 일정 종류 (할 일, 이벤트, 휴일)
  location?: string; // 장소 (이벤트 타입용)
  createdAt: number;
}

export interface SpringNote {
  id: string;
  title: string;
  pages: NotePage[];
  theme: "light" | "sepia" | "dark" | "grid";
  font: "serif" | "sans" | "mono" | "pretendard";
  fontSize: number;
  createdAt: number;
  updatedAt: number;
  associatedTaskId?: string;
  customDate?: string; // 사용자가 편집 가능한 날짜 필드
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
  | "taskcontrol"
  | "calendar"
  | "mindmap"
  | "springnote";
