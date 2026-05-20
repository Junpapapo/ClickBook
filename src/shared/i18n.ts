// ============================================================
// i18n — Translation dictionary (EN / JA / KO)
// Simple words (Save, Cancel, Delete, Export, Import, JSON,
// HTML, AI, URL, Pattern …) stay in English across all locales.
// ============================================================

export type Lang = "en" | "ja" | "ko";

const en = {
  // ── Time formats ──────────────────────────────────────────
  pageTitle: "ClickBook — Bookmark Manager",
  timeJustNow: "just now",
  timeMinAgo: "{n} min ago",
  timeHourAgo: "{n}h ago",
  timeDayAgo: "{n}d ago",
  timeLocale: "en-US",

  // ── Search bar ───────────────────────────────────────────
  searchPlaceholder: "Search by title or URL...",
  bulkImportTitle: "Bulk import URLs from text",
  bulkImportDesc:
    "Paste text containing URLs. Supports newlines, commas, and spaces. http/https URLs are auto-extracted and saved.",
  bulkImportDetected: "{n} URL(s) detected",
  bulkImportAuto: "Auto-detecting URLs",
  bulkImportResult: "{saved} saved · {skipped} skipped (duplicates)",
  bulkImportBtn: "Bulk Import",
  bulkImporting: "Importing...",
  bulkImportPlaceholder: "https://example.com\nhttps://...",

  // ── Sidebar ──────────────────────────────────────────────
  dashboard: "Dashboard",
  memoBoard: "Memos",
  aiOrganize: "AI Organize",
  aiNotAvailable: "Chrome AI (Gemini Nano) is not available",
  aiOrganizeTooltip:
    "AI classifies all sites and organizes them into folders\nCurrent state is auto-backed up before running",
  aiOrganizing: "Organizing...",
  aiConfirmMsg:
    "AI will automatically classify all sites and assign them to folders. Current state will be auto-backed up before running. Continue?",
  aiConfirmBtn: "Run AI Organize",
  aiResult: "{moved} / {total} sites organized",

  // ── Folder operations ────────────────────────────────────
  folderNamePlaceholder: "Folder name...",
  subfolderNamePlaceholder: "New subfolder name...",
  maxDepthError:
    "Cannot create: max folder depth ({n}) reached. Change in settings.",
  folderDeleteConfirm: "Delete this folder?",
  folderDeleteWithBookmarks:
    "This folder has {n} site(s). They will be moved to \"Other\" on delete. Continue?",
  lockTooltip: "Lock folder (skipped in AI organize)",
  unlockTooltip: "Unlock folder",
  addSubfolderTooltip: "Add subfolder",
  maxDepthTooltip: "Max {n} levels",
  renameTooltip: "Rename",
  deleteTooltip: "Delete",
  doubleClickRename: "Double-click to rename",

  // ── Dashboard ────────────────────────────────────────────
  folders: "Folders",
  dashboardLockTooltip: "Lock (skipped in AI organize)",
  dashboardUnlockTooltip: "Unlock",
  dashboardRenameTooltip: "Rename",

  // ── Recent widget ────────────────────────────────────────
  recentTitle: "Recently Added",
  recommendTitle: "AI Recommended Sites",
  recentEmpty: "No bookmarks yet.",

  // ── Ranking widget ───────────────────────────────────────
  rankingTitle: "Top Sites",
  rankingEmpty: "No data.",
  rankingVisits: "{n}×",
  rankingFooter: "Visit count increases when you open a bookmark.",
  rankingClose: "Click to close",

  // ── FolderView ───────────────────────────────────────────
  back: "Back",
  itemCount: "{n} items",
  sortDate: "Date",
  sortName: "Name",
  sortVisits: "Visits",
  createSubfolderTooltip: "Create subfolder",
  moveTray: "Move to another folder (drag & drop)",
  folderEmpty: "This folder is empty.",
  addSite: "Add site",
  subfolders: "Subfolders",
  collapse: "Collapse",
  expand: "Expand",
  folderBookmarks: "Bookmarks in this folder",
  subfolderBookmarks: "Bookmarks in subfolders",
  doubleClickEditName: "Double-click to edit name",

  // ── Memo (popover in BookmarkCard) ───────────────────────
  memo: "Memo",
  deleteMemoTooltip: "Delete memo",
  memoPlaceholder: "Enter memo...",
  clickToEdit: "Click to edit",
  editMemoTooltip: "Edit memo",
  addMemoTooltip: "Add memo",

  // ── MemoBoard ────────────────────────────────────────────
  memoTitle: "Memo Board",
  memoCount: "{n} items",
  addMemo: "Add memo",
  memoEmpty: "No memos yet.",
  memoEmptyDesc:
    "Hover over a bookmark card and click the memo icon to add a memo.",

  // ── BookmarkCard ─────────────────────────────────────────
  openTooltip: "Open",
  editTooltip: "Edit",
  deleteBookmarkTooltip: "Delete",

  // ── BookmarkEditPanel ────────────────────────────────────
  editSiteTitle: "Edit site",
  addSiteTitle: "Add site",
  urlLabel: "URL",
  titleLabel: "Title",
  folderLabel: "Folder",
  titleOptionalPlaceholder: "Optional (URL will be used)",
  urlRequired: "Please enter a URL",
  urlInvalid: "Please enter an http/https URL",
  urlDuplicate: "This URL is already registered",
  saveFailed: "Failed to save",
  deleteConfirm: "Delete \"{title}\"?",
  editOpenTooltip: "Open",

  // ── Pattern bar ──────────────────────────────────────────
  patternPlaceholder: "Pattern name...",
  patternLoadConfirm:
    "Switch to this pattern. Current state will be overwritten. Continue?",

  // ── Import error ─────────────────────────────────────────
  importFailed:
    "Import failed. Please select a valid ClickBook JSON file.",

  // ── RightPanelBar ────────────────────────────────────────
  rankingPanelLabel: "Top Sites",
  editPanelLabel: "Edit Site",
  chromePanelLabel: "Chrome Bookmarks",

  // ── Settings ─────────────────────────────────────────────
  settingsTitle: "Settings",
  settingsDataManagement: "Data Management",
  settingsDisplay: "Display",
  settingsFolders: "Folders",
  settingsAI: "AI Organize",
  settingsLanguage: "Language",
  settingsChromePanelLabel: "Chrome Panel (Sidebar)",
  settingsChromePanelDesc: "Show Chrome bookmarks panel in sidebar",
  exportJson: "JSON Export",
  exportHtml: "HTML Export",
  importBtn: "Import",
  closeBtn: "Close",
  saveBtn: "Save",
  confirmBtn: "Continue",
  cancelBtn: "Cancel",
  githubRanking: "GitHub Ranking",
  githubRankingMenuDesc: "Show GitHub ranking menu in sidebar and popup.",
  addRootFolderTooltip: "Add root folder",
  dropToOrganize: "Drop bookmarks on folders to organize",
  aiOrganizeDone: "✓ AI Organize done",
  backupPrefix: "Backup: ",
  settingsRecentCountLabel: "Recently added count",
  settingsRecentCountDesc:
    "Number of items shown in \"Recently Added\" on dashboard",

  // ── GitHubRanking ──────────────────────────────────────────
  githubRankingTitle: "GitHub Real-time Ranking",
  githubRankingDesc: "Explore the most starred repositories on GitHub in real-time.",
  githubSearchPlaceholder: "e.g., react stars:>50000",
  searchBtn: "Search",
  apiLimitTitle: "GitHub Real-time Search & API Rate Limits",
  apiLimitDesc: "Data is fetched via GitHub Search API. Unauthenticated requests are limited to 10 per minute (max 60/hr) per IP. Frequent filters or custom searches may temporarily block access.",
  langRankingLabel: "Ranking by Language",
  dateFilterLabel: "Date Filter (Created)",
  dateAll: "All Time",
  dateWeek: "Last 1 week",
  dateMonth: "Last 1 month",
  errorFetch: "Error occurred while fetching data.",
  errorLimit: "GitHub API rate limit exceeded or error occurred.",
  thRank: "Rank",
  thProject: "Project",
  thLang: "Language",
  thDesc: "Description",
  thCommit: "Last Commit",
  noDesc: "No description",
  loadingGithub: "Fetching GitHub data...",
  noResult: "No repositories to display.",
  settingsRankingCountLabel: "Top sites count",
  settingsRankingCountDesc: "Number of items shown in the \"Top Sites\" ranking",
  settingsMaxDepthLabel: "Max folder depth",
  settingsMaxDepthDesc:
    "Max nesting depth in sidebar and AI organize (1–5)",
  settingsKeepFoldersLabel: "Keep existing folders",
  settingsKeepFoldersDesc:
    "ON: Don't delete or rename existing folders (new ones can still be created)",
  settingsSaving: "Saving...",

  // ── Chrome Bookmark Panel ─────────────────────────────
  chromeBookmarksTitle: "Chrome Bookmarks",
  chromePatternsTitle: "Patterns",
  chromePatternSaveTooltip: "Save current Chrome bookmarks as a pattern",
  chromePatternSaveBtn: "Save",
  chromePatternLoadTooltip: "Import to Chrome (adds missing URLs)",
  chromePatternLoadBtn: "Import",
  chromeReloadTooltip: "Reload",
  chromeLoading: "Loading...",
  chromeSelectAll: "Select All",
  chromeDeselectAll: "Deselect All",
  chromeSelectedCount: "{n} selected",
  chromeBulkImport: "Bulk Import",
  chromeBulkDelete: "Bulk Delete",
  chromeImportAll: "Import All",
  chromeImportText: "Text",
  chromeResetTooltip: "Reset to state before sync",
  chromeWriteBtn: "Write to Chrome ({n})",
  chromeCancel: "Cancel",
  chromeRenameTooltip: "Rename",
  chromeDeleteTooltip: "Delete",
  chromeTextExtractTitle: "Extract URLs from text",
  chromeTextExtractDesc: "Paste text containing URLs. http/https URLs are auto-extracted and added to Chrome.",
  chromeTextDetected: "{n} URL(s) detected",
  chromeTextImportPlaceholder: "e.g.,\nhttps://example.com\nhttps://github.com/...",
  chromeTextImporting: "Importing...",
  chromeTextImportBtn: "Import",
  chromeBulkDeleteConfirm: "Add {n} selected bookmarks to the deletion queue?\nThey will be actually applied by clicking the 'Write to Chrome' button. Continue?",
  chromeBulkDeleteQueueDone: "Added {n} bookmarks to the deletion queue",
  chromeBulkImportDone: "Imported {n} bookmarks",
  chromeImportAllConfirm: "Import all {n} Chrome bookmarks to ClickBook? Continue?",
  chromeImportAllDone: "Imported all bookmarks",
  chromeTextImportNoUrls: "No URLs found",
  chromeSyncConfirm: "Sync bookmarks changed in ClickBook to Chrome (adds, renames, deletes)? Continue?",
  chromeSyncDone: "Added {added} · Updated {updated} · Deleted {deleted}",
  chromeSyncSuccess: "Written to Chrome successfully",
  chromeResetConfirm: "Restore Chrome bookmarks to the state before sync? Continue?",
  chromeResetDone: "Reset complete",
  chromeResetNoSnapshot: "No snapshot available",
  chromeQueueRename: "Added rename to queue - click 'Write to Chrome' to apply",
  chromeDeleteFolderConfirm: "Delete folder '{title}' and all its contents? Continue?",
  chromeDeleteBookmarkConfirm: "Delete '{title}'? Continue?",
  chromeDeleteBtn: "Delete",
  chromeWriteConfirm: "Write {n} changes to Chrome? Continue?",
  chromeWriteDone: "Written {n} changes to Chrome",
  chromePatternSaveDone: "Saved pattern '{name}' ({n} items)",
  chromePatternLoadConfirm: "Import pattern '{name}' to Chrome (adds missing URLs only)? Continue?",
  chromePatternLoadDone: "Added {added} / Total {total}",
  chromePatternDeleteConfirm: "Delete pattern '{name}'?",
  chromeMoveQueue: "Added move to queue — click 'Write to Chrome' to apply",


  // ── Popup ─────────────────────────────────────────────────
  popupBookmarkSection: "Bookmark Manager",
  popupSave: "Save Site",
  popupBulkSave: "Save All Tabs",
  popupBulkSaveTitle: "Save all active tabs (http/https only)",
  popupTextImportTitle: "Extract URLs from text and save",
  popupMemoTitle: "Add memo to this page",
  popupManageTitle: "Manage bookmarks",
  popupSettingsTitle: "Settings",
  popupTheme: "Theme",
  popupLight: "Light",
  popupDark: "Dark",
  popupTextImportMenu: "Text URL Import",
  popupChromePanelMenu: "Chrome Bookmark Panel",
  popupAiAvailableTitle: "Gemini Nano (AI classification) available",
  popupAiUnavailableTitle: "AI unavailable — rule-based classification",
  popupSaved: "Saved!",
  popupDuplicate: "This URL is already saved.",
  popupSaveFailed: "Save failed.",
  popupError: "An error occurred.",
  popupBulkResult: "{saved} saved · {skipped} skipped (duplicates)",
  popupUrlCopySection: "Copy URL",
  popupBrowserDataSection: "Clear Browser Data",
  popupClearDone: "Done!",
  popupHardReloadTitle: "Super Reload (Ctrl+F5) — Force reload ignoring cache",
  popupAiNote: "Gemini Nano requires Chrome 128+ Dev/Canary + flag enabled",
  popupRuleBased: "Rule-based",
  popupTextImportPanel: "Extract URLs from text and register",
  popupTextDetected: "{n} URLs detected",
  popupTextAutoDetect: "URLs will be auto-detected",
  popupTextImporting: "Registering...",
  popupTextImportBtn: "Bulk Register",
  popupTextResult: "{saved} registered · {skipped} skipped (duplicates)",
  popupMemoPanel: "Page Memo",
  popupMemoPlaceholder: "Enter memo...",
  popupMemoAutoBookmark: "* The site will also be bookmarked automatically when saved",
  popupMemoSaved: "Saved!",
  popupMemoSave: "Save",
  popupCacheLabel: "Cache",
  popupDownloadsLabel: "Downloads",
  popupHistoryLabel: "History",
  popupStorageLabel: "Storage",
  popupPasswordsLabel: "Passwords",
  copySimpleDesc: "Copy title and URL in one line",
  copyBreaklineDesc: "Copy title and URL with line break",
  copyUrlDesc: "Copy URL only",
  copyMarkdownDesc: "Markdown link format",
  copyBacklogDesc: "Backlog Wiki format",

  // ── Phase 3 ───────────────────────────────────────────────
  onboardingTitle: "Welcome to ClickBook!",
  onboardingStep1Title: "1-Click Save",
  onboardingStep1Desc: "Save the current tab instantly by clicking the extension icon.",
  onboardingStep2Title: "AI Organization",
  onboardingStep2Desc: "Use Gemini Nano to auto-categorize your bookmarks. Click 'AI Organize' to sort everything.",
  onboardingStep3Title: "Hierarchy & Drag-and-Drop",
  onboardingStep3Desc: "Manage nested folders intuitively with drag-and-drop support.",
  onboardingStartBtn: "Get Started",
  settingsStorageUsage: "Storage Usage",
  settingsStorageUsageDesc: "Local storage used by ClickBook",
  settingsShortcuts: "Keyboard Shortcuts",
  settingsShortcutSave: "Save Current Tab (Alt+S)",
};

const ja: typeof en = {
  // ── Time formats ──────────────────────────────────────────
  pageTitle: "ClickBook — ブックマーク管理",
  timeJustNow: "たった今",
  timeMinAgo: "{n}分前",
  timeHourAgo: "{n}時間前",
  timeDayAgo: "{n}日前",
  timeLocale: "ja-JP",

  // ── Search bar ───────────────────────────────────────────
  searchPlaceholder: "タイトル・URLで検索...",
  bulkImportTitle: "テキストから URL を一括登録",
  bulkImportDesc:
    "URL を含むテキストを貼り付けてください。改行・カンマ・スペース区切りに対応し、http/https で始まる URL を自動抽出して登録します。",
  bulkImportDetected: "{n} 件の URL を検出",
  bulkImportAuto: "URL を自動検出します",
  bulkImportResult: "{saved} 件登録 · {skipped} 件スキップ（重複）",
  bulkImportBtn: "一括登録",
  bulkImporting: "登録中...",
  bulkImportPlaceholder: "例：\nhttps://example.com\nhttps://github.com/..., https://zenn.dev/...\n\nMarkdown や HTML が混じっていても OK",

  // ── Sidebar ──────────────────────────────────────────────
  dashboard: "ダッシュボード",
  memoBoard: "メモ",
  aiOrganize: "AI 整理",
  aiNotAvailable: "Chrome AI (Gemini Nano) が利用できません",
  aiOrganizeTooltip:
    "AIが全サイトを自動分類してフォルダーに振り分けます\n実行前に現在の状態を自動バックアップします",
  aiOrganizing: "整理中...",
  aiConfirmMsg:
    "AIが全てのサイトを自動分類しフォルダーに振り分けます。実行前に現在の状態をパターンとして自動バックアップします。続けますか？",
  aiConfirmBtn: "AI整理を実行",
  aiResult: "{moved} / {total} 件を整理しました",

  // ── Folder operations ────────────────────────────────────
  folderNamePlaceholder: "フォルダー名...",
  subfolderNamePlaceholder: "新しいサブフォルダー名...",
  maxDepthError:
    "最大フォルダー段階数（{n}）を超えるため作成できません。設定から段階数を変更できます。",
  folderDeleteConfirm: "このフォルダーを削除しますか？",
  folderDeleteWithBookmarks:
    "このフォルダーには {n} 件のサイトがあります。削除すると「その他」に移動されます。続けますか？",
  lockTooltip: "フォルダーをロック（AI整理でスキップされます）",
  unlockTooltip: "ロックを解除",
  addSubfolderTooltip: "サブフォルダーを追加",
  maxDepthTooltip: "最大{n}段階まで",
  renameTooltip: "名前を変更",
  deleteTooltip: "削除",
  doubleClickRename: "ダブルクリックで名前を変更",

  // ── Dashboard ────────────────────────────────────────────
  folders: "フォルダー",
  dashboardLockTooltip: "ロック（AI整理でスキップ）",
  dashboardUnlockTooltip: "ロックを解除",
  dashboardRenameTooltip: "名前を変更",

  // ── Recent widget ────────────────────────────────────────
  recentTitle: "最近追加",
  recommendTitle: "AI おすすめサイト",
  recentEmpty: "まだブックマークがありません。",

  // ── Ranking widget ───────────────────────────────────────
  rankingTitle: "よく見るサイト",
  rankingEmpty: "データがありません。",
  rankingVisits: "{n}回",
  rankingFooter: "ブックマークを開くと訪問回数が増えます",
  rankingClose: "クリックして閉じる",

  // ── FolderView ───────────────────────────────────────────
  back: "戻る",
  itemCount: "{n} 件",
  sortDate: "追加日",
  sortName: "名前順",
  sortVisits: "訪問回数",
  createSubfolderTooltip: "サブフォルダーを作成",
  moveTray: "他のフォルダーへ移動（ドラッグ＆ドロップ）",
  folderEmpty: "このフォルダーにはまだ何もありません。",
  addSite: "サイトを追加",
  subfolders: "サブフォルダー",
  collapse: "折り畳む",
  expand: "展開",
  folderBookmarks: "このフォルダーのブックマーク",
  subfolderBookmarks: "サブフォルダー内のブックマーク",
  doubleClickEditName: "ダブルクリックで名前を編集",

  // ── Memo (popover in BookmarkCard) ───────────────────────
  memo: "メモ",
  deleteMemoTooltip: "メモを削除",
  memoPlaceholder: "メモを入力...",
  clickToEdit: "クリックして編集",
  editMemoTooltip: "メモを編集",
  addMemoTooltip: "メモを追加",

  // ── MemoBoard ────────────────────────────────────────────
  memoTitle: "メモボード",
  memoCount: "{n} 件",
  addMemo: "メモを追加",
  memoEmpty: "メモがありません",
  memoEmptyDesc:
    "ブックマークカードにホバーしてメモアイコンをクリックするとメモを追加できます",

  // ── BookmarkCard ─────────────────────────────────────────
  openTooltip: "開く",
  editTooltip: "編集",
  deleteBookmarkTooltip: "削除",

  // ── BookmarkEditPanel ────────────────────────────────────
  editSiteTitle: "サイトを編集",
  addSiteTitle: "サイトを追加",
  urlLabel: "URL",
  titleLabel: "タイトル",
  folderLabel: "フォルダー",
  titleOptionalPlaceholder: "省略可（URLをそのまま使用）",
  urlRequired: "URLを入力してください",
  urlInvalid: "http/https の URL を入力してください",
  urlDuplicate: "このURLは登録済みです",
  saveFailed: "保存に失敗しました",
  deleteConfirm: "「{title}」を削除しますか？",
  editOpenTooltip: "開く",

  // ── Pattern bar ──────────────────────────────────────────
  patternPlaceholder: "パターン名...",
  patternLoadConfirm:
    "このパターンに切り替えます。現在の状態は上書きされます。続けますか？",

  // ── Import error ─────────────────────────────────────────
  importFailed:
    "インポートに失敗しました。有効な ClickBook JSON ファイルを選択してください。",

  // ── RightPanelBar ────────────────────────────────────────
  rankingPanelLabel: "よく見るサイト",
  editPanelLabel: "サイト編集",
  chromePanelLabel: "Chrome ブックマーク",

  // ── Settings ─────────────────────────────────────────────
  settingsTitle: "設定",
  settingsDataManagement: "データ管理",
  settingsDisplay: "表示",
  settingsFolders: "フォルダー",
  settingsAI: "AI 整理",
  settingsLanguage: "言語",
  settingsChromePanelLabel: "Chrome パネル（サイドバー）",
  settingsChromePanelDesc: "サイドバーにChromeブックマークのパネルを表示します",
  exportJson: "JSON エクスポート",
  exportHtml: "HTML エクスポート",
  importBtn: "インポート",
  closeBtn: "閉じる",
  saveBtn: "保存",
  confirmBtn: "続ける",
  cancelBtn: "キャンセル",
  githubRanking: "GitHub ランキング",
  githubRankingMenuDesc: "サイドバーメニューとポップアップにGitHubランキングメニューを表示します。",
  addRootFolderTooltip: "ルートフォルダーを追加",
  dropToOrganize: "フォルダーにドロップして整理",
  aiOrganizeDone: "✓ AI整理完了",
  backupPrefix: "バックアップ: ",
  settingsRecentCountLabel: "最近追加の表示数",
  settingsRecentCountDesc: "ダッシュボードの「最近追加」に表示する件数",

  // ── GitHubRanking ──────────────────────────────────────────
  githubRankingTitle: "GitHub リアルタイムランキング",
  githubRankingDesc: "GitHubで最もスターの多いリポジトリをリアルタイムで検索できます。",
  githubSearchPlaceholder: "例: react stars:>50000",
  searchBtn: "検索",
  apiLimitTitle: "GitHubリアルタイム検索とAPI制限について",
  apiLimitDesc: "このページのデータはGitHub Search API経由で取得しています。未認証リクエストはIPごとに1時間60回に制限されています。頻繁なフィルター変更などは一時的に制限される場合があります。",
  langRankingLabel: "言語別ランキング",
  dateFilterLabel: "期間フィルター (作成日)",
  dateAll: "全期間",
  dateWeek: "直近1週間",
  dateMonth: "直近1ヶ月",
  errorFetch: "データの取得中にエラーが発生しました。",
  errorLimit: "GitHub APIの制限に達したか、エラーが発生しました。",
  thRank: "順位",
  thProject: "プロジェクト名",
  thLang: "言語",
  thDesc: "説明",
  thCommit: "最近のコミット",
  noDesc: "説明なし",
  loadingGithub: "GitHubデータを取得中...",
  noResult: "表示するリポジトリがありません。",
  settingsRankingCountLabel: "よく見るサイトの表示数",
  settingsRankingCountDesc: "「よく見るサイト」ランキングに表示する件数",
  settingsMaxDepthLabel: "最大フォルダー段階数",
  settingsMaxDepthDesc: "サイドバーとAI整理での最大ネスト深度（1〜5）",
  settingsKeepFoldersLabel: "既存フォルダーを変更しない",
  settingsKeepFoldersDesc:
    "ON: 既存フォルダーを削除・名称変更しない（新規作成は可能）",
  settingsSaving: "保存中...",

  // ── Chrome Bookmark Panel ─────────────────────────────
  chromeBookmarksTitle: "Chrome ブックマーク",
  chromePatternsTitle: "パターン",
  chromePatternSaveTooltip: "現在のChromeブックマークをパターンとして保存",
  chromePatternSaveBtn: "保存",
  chromePatternLoadTooltip: "Chromeへ取込（不足URLを追加）",
  chromePatternLoadBtn: "取込",
  chromeReloadTooltip: "再読み込み",
  chromeLoading: "読み込み中...",
  chromeSelectAll: "全選択",
  chromeDeselectAll: "全解除",
  chromeSelectedCount: "{n}件選択中",
  chromeBulkImport: "一括登録",
  chromeBulkDelete: "一括削除",
  chromeImportAll: "全件取込",
  chromeImportText: "テキスト",
  chromeResetTooltip: "シンク前の状態にリセット",
  chromeWriteBtn: "chrome書込 ({n}件)",
  chromeCancel: "キャンセル",
  chromeRenameTooltip: "名前変更",
  chromeDeleteTooltip: "削除",
  chromeTextExtractTitle: "テキストからURL抽出",
  chromeTextExtractDesc: "URLを含むテキストを貼り付けてください。http/https で始まるURLを自動抽出して Chrome ブックマークに追加します。",
  chromeTextDetected: "検出URL数: {n}件",
  chromeTextImportPlaceholder: "例：\nhttps://example.com\nhttps://github.com/...",
  chromeTextImporting: "登録中...",
  chromeTextImportBtn: "登録する",
  chromeBulkDeleteConfirm: "選択した {n} 件を削除キューに追加します。\n「chrome書込」ボタンで実際に反映されます。続けますか？",
  chromeBulkDeleteQueueDone: "{n} 件を削除キューに追加しました",
  chromeBulkImportDone: "{n}件を登録しました",
  chromeImportAllConfirm: "Chrome全{n}件をClickBookへ取込みます。続けますか？",
  chromeImportAllDone: "全件を取込みました",
  chromeTextImportNoUrls: "URLが見つかりませんでした",
  chromeSyncConfirm: "ClickBookで変更したブックマークをChromeへ同期します（追加・タイトル変更・削除）。続けますか？",
  chromeSyncDone: "追加 {added} · 更新 {updated} · 削除 {deleted}",
  chromeSyncSuccess: "Chromeへ書き込みました",
  chromeResetConfirm: "Chromeブックマークをシンク前の状態に戻します。続けますか？",
  chromeResetDone: "リセット完了",
  chromeResetNoSnapshot: "スナップショットがありません",
  chromeQueueRename: "変更をキューに追加— chrome書込で反映",
  chromeDeleteFolderConfirm: "フォルダー「{title}」とその中身をすべて削除します。続けますか？",
  chromeDeleteBookmarkConfirm: "「{title}」を削除しますか？",
  chromeDeleteBtn: "削除する",
  chromeWriteConfirm: "{n}件の変更をChromeに書き込みます。続けますか？",
  chromeWriteDone: "{n}件をChromeに書き込みました",
  chromePatternSaveDone: "「{name}」を保存しました（{n}件）",
  chromePatternLoadConfirm: "パターン「{name}」をChromeに取込みます（不足URLのみ追加）。続けますか？",
  chromePatternLoadDone: "追加 {added}件 / 合計 {total}件",
  chromePatternDeleteConfirm: "パターン「{name}」を削除しますか？",
  chromeMoveQueue: "移動をキューに追加 — chrome書込で反映",


  // ── Popup ─────────────────────────────────────────────────
  popupBookmarkSection: "ブックマーク管理",
  popupSave: "サイト保存",
  popupBulkSave: "活性タブ一括保存",
  popupBulkSaveTitle: "すべての活性タブを一括保存（http/https のみ）",
  popupTextImportTitle: "テキストから URL を抽出して一括登録",
  popupMemoTitle: "このページにメモを追加",
  popupManageTitle: "ブックマークを管理",
  popupSettingsTitle: "設定",
  popupTheme: "テーマ",
  popupLight: "ライト",
  popupDark: "ダーク",
  popupTextImportMenu: "テキスト URL インポート",
  popupChromePanelMenu: "Chrome ブックマークパネル",
  popupAiAvailableTitle: "Gemini Nano (AI分類) 利用可能",
  popupAiUnavailableTitle: "AI利用不可 — ルールベース分類を使用",
  popupSaved: "保存しました！",
  popupDuplicate: "このURLはすでに保存済みです。",
  popupSaveFailed: "保存に失敗しました。",
  popupError: "エラーが発生しました。",
  popupBulkResult: "{saved}件保存 · {skipped}件スキップ（重複）",
  popupUrlCopySection: "URL をコピー",
  popupBrowserDataSection: "ブラウザデータを削除",
  popupClearDone: "完了！",
  popupHardReloadTitle: "スーパーリロード（Ctrl+F5）— キャッシュを無視して強制再読み込み",
  popupAiNote: "Gemini Nano は Chrome 128+ Dev/Canary +フラグ有効化必要",
  popupRuleBased: "ルールベース",
  popupTextImportPanel: "テキストから URL を抽出して登録",
  popupTextDetected: "{n} 件の URL を検出",
  popupTextAutoDetect: "URL を自動検出します",
  popupTextImporting: "登録中...",
  popupTextImportBtn: "一括登録",
  popupTextResult: "{saved}件登録 · {skipped}件スキップ（重複）",
  popupMemoPanel: "ページメモ",
  popupMemoPlaceholder: "メモを入力...",
  popupMemoAutoBookmark: "※ 保存時にサイトも自動でブックマーク登録されます",
  popupMemoSaved: "保存済み！",
  popupMemoSave: "保存",
  popupCacheLabel: "キャッシュ",
  popupDownloadsLabel: "ダウンロード履歴",
  popupHistoryLabel: "閲覧履歴",
  popupStorageLabel: "ストレージ",
  popupPasswordsLabel: "パスワード",
  copySimpleDesc: "タイトル URL を1行でコピー",
  copyBreaklineDesc: "タイトルとURLを改行してコピー",
  copyUrlDesc: "URLのみコピー",
  copyMarkdownDesc: "Markdown リンク形式",
  copyBacklogDesc: "Backlog Wiki 形式",

  // ── Phase 3 ───────────────────────────────────────────────
  onboardingTitle: "ClickBook へようこそ！",
  onboardingStep1Title: "1クリック保存",
  onboardingStep1Desc: "拡張機能アイコンをクリックするだけで、現在のタブを即座に保存できます。",
  onboardingStep2Title: "AI 自動整理",
  onboardingStep2Desc: "Gemini Nano を使用してブックマークを自動分類します。「AI整理」をクリックして全体を整理しましょう。",
  onboardingStep3Title: "階層フォルダー ＆ ドラッグ＆ドロップ",
  onboardingStep3Desc: "ドラッグ＆ドロップによる直感的な操作で、ネストされたフォルダーを管理できます。",
  onboardingStartBtn: "はじめる",
  settingsStorageUsage: "ストレージ使用量",
  settingsStorageUsageDesc: "ClickBook が使用しているローカルストレージ",
  settingsShortcuts: "キーボードショートカット",
  settingsShortcutSave: "現在のタブを保存 (Alt+S)",
};

const ko: typeof en = {
  // ── Time formats ──────────────────────────────────────────
  pageTitle: "ClickBook — 북마크 관리",
  timeJustNow: "방금 전",
  timeMinAgo: "{n}분 전",
  timeHourAgo: "{n}시간 전",
  timeDayAgo: "{n}일 전",
  timeLocale: "ko-KR",

  // ── Search bar ───────────────────────────────────────────
  searchPlaceholder: "제목 또는 URL로 검색...",
  bulkImportTitle: "텍스트에서 URL 일괄 등록",
  bulkImportDesc:
    "URL이 포함된 텍스트를 붙여 넣으세요. 줄바꿈·쉼표·공백 구분을 지원하며 http/https URL을 자동으로 추출하여 등록합니다.",
  bulkImportDetected: "URL {n}개 감지됨",
  bulkImportAuto: "URL을 자동으로 감지합니다",
  bulkImportResult: "{saved}개 등록 · {skipped}개 건너뜀 (중복)",
  bulkImportBtn: "일괄 등록",
  bulkImporting: "등록 중...",
  bulkImportPlaceholder: "https://example.com\nhttps://...",

  // ── Sidebar ──────────────────────────────────────────────
  dashboard: "대시보드",
  memoBoard: "메모",
  aiOrganize: "AI 정리",
  aiNotAvailable: "Chrome AI (Gemini Nano)를 사용할 수 없습니다",
  aiOrganizeTooltip:
    "AI가 모든 사이트를 자동 분류하여 폴더에 배치합니다\n실행 전 현재 상태를 자동으로 백업합니다",
  aiOrganizing: "정리 중...",
  aiConfirmMsg:
    "AI가 모든 사이트를 자동 분류하여 폴더에 배치합니다. 실행 전 현재 상태를 자동으로 백업합니다. 계속하시겠습니까?",
  aiConfirmBtn: "AI 정리 실행",
  aiResult: "{moved} / {total}개 정리 완료",

  // ── Folder operations ────────────────────────────────────
  folderNamePlaceholder: "폴더 이름...",
  subfolderNamePlaceholder: "새 하위 폴더 이름...",
  maxDepthError:
    "최대 폴더 깊이({n})를 초과하여 생성할 수 없습니다. 설정에서 깊이를 변경할 수 있습니다.",
  folderDeleteConfirm: "이 폴더를 삭제하시겠습니까?",
  folderDeleteWithBookmarks:
    "이 폴더에 사이트가 {n}개 있습니다. 삭제하면 「기타」로 이동됩니다. 계속하시겠습니까?",
  lockTooltip: "폴더 잠금 (AI 정리 시 건너뜀)",
  unlockTooltip: "잠금 해제",
  addSubfolderTooltip: "하위 폴더 추가",
  maxDepthTooltip: "최대 {n}단계",
  renameTooltip: "이름 변경",
  deleteTooltip: "삭제",
  doubleClickRename: "더블 클릭으로 이름 변경",

  // ── Dashboard ────────────────────────────────────────────
  folders: "폴더",
  dashboardLockTooltip: "잠금 (AI 정리 시 건너뜀)",
  dashboardUnlockTooltip: "잠금 해제",
  dashboardRenameTooltip: "이름 변경",

  // ── Recent widget ────────────────────────────────────────
  recentTitle: "최근 추가",
  recommendTitle: "AI 추천 검색 결과",
  recentEmpty: "아직 북마크가 없습니다.",

  // ── Ranking widget ───────────────────────────────────────
  rankingTitle: "자주 보는 사이트",
  rankingEmpty: "데이터가 없습니다.",
  rankingVisits: "{n}회",
  rankingFooter: "북마크를 열면 방문 횟수가 증가합니다",
  rankingClose: "클릭하여 닫기",

  // ── FolderView ───────────────────────────────────────────
  back: "뒤로",
  itemCount: "{n}개",
  sortDate: "추가일",
  sortName: "이름순",
  sortVisits: "방문 횟수",
  createSubfolderTooltip: "하위 폴더 만들기",
  moveTray: "다른 폴더로 이동 (드래그 & 드롭)",
  folderEmpty: "이 폴더에는 아직 아무것도 없습니다.",
  addSite: "사이트 추가",
  subfolders: "하위 폴더",
  collapse: "접기",
  expand: "펼치기",
  folderBookmarks: "이 폴더의 북마크",
  subfolderBookmarks: "하위 폴더의 북마크",
  doubleClickEditName: "더블 클릭으로 이름 편집",

  // ── Memo (popover in BookmarkCard) ───────────────────────
  memo: "메모",
  deleteMemoTooltip: "메모 삭제",
  memoPlaceholder: "메모 입력...",
  clickToEdit: "클릭하여 편집",
  editMemoTooltip: "메모 편집",
  addMemoTooltip: "메모 추가",

  // ── MemoBoard ────────────────────────────────────────────
  memoTitle: "메모 보드",
  memoCount: "{n}개",
  addMemo: "메모 추가",
  memoEmpty: "메모가 없습니다",
  memoEmptyDesc:
    "북마크 카드에 마우스를 올리고 메모 아이콘을 클릭하면 메모를 추가할 수 있습니다",

  // ── BookmarkCard ─────────────────────────────────────────
  openTooltip: "열기",
  editTooltip: "편집",
  deleteBookmarkTooltip: "삭제",

  // ── BookmarkEditPanel ────────────────────────────────────
  editSiteTitle: "사이트 편집",
  addSiteTitle: "사이트 추가",
  urlLabel: "URL",
  titleLabel: "제목",
  folderLabel: "폴더",
  titleOptionalPlaceholder: "생략 가능 (URL을 그대로 사용)",
  urlRequired: "URL을 입력해 주세요",
  urlInvalid: "http/https URL을 입력해 주세요",
  urlDuplicate: "이 URL은 이미 등록되어 있습니다",
  saveFailed: "저장에 실패했습니다",
  deleteConfirm: "「{title}」을 삭제하시겠습니까?",
  editOpenTooltip: "열기",

  // ── Pattern bar ──────────────────────────────────────────
  patternPlaceholder: "패턴 이름...",
  patternLoadConfirm:
    "이 패턴으로 전환합니다. 현재 상태는 덮어씌워집니다. 계속하시겠습니까?",

  // ── Import error ─────────────────────────────────────────
  importFailed:
    "가져오기에 실패했습니다. 유효한 ClickBook JSON 파일을 선택해 주세요.",

  // ── RightPanelBar ────────────────────────────────────────
  rankingPanelLabel: "자주 보는 사이트",
  editPanelLabel: "사이트 편집",
  chromePanelLabel: "Chrome 북마크",

  // ── Settings ─────────────────────────────────────────────
  settingsTitle: "설정",
  settingsDataManagement: "데이터 관리",
  settingsDisplay: "표시",
  settingsFolders: "폴더",
  settingsAI: "AI 정리",
  settingsLanguage: "언어",
  settingsChromePanelLabel: "Chrome 패널 (사이드바)",
  settingsChromePanelDesc: "사이드바에 Chrome 북마크 패널을 표시합니다.",
  exportJson: "JSON 내보내기",
  exportHtml: "HTML 내보내기",
  importBtn: "가져오기",
  closeBtn: "닫기",
  saveBtn: "저장",
  confirmBtn: "계속하기",
  cancelBtn: "취소",
  githubRanking: "GitHub 랭킹",
  githubRankingMenuDesc: "사이드바 메뉴 및 팝업에 GitHub 랭킹 메뉴를 표시합니다.",
  addRootFolderTooltip: "루트 폴더 추가",
  dropToOrganize: "폴더에 드롭하여 정리",
  aiOrganizeDone: "✓ AI 정리 완료",
  backupPrefix: "백업: ",
  settingsRecentCountLabel: "최근 추가 표시 수",
  settingsRecentCountDesc: "대시보드의 「최근 추가」에 표시할 개수",

  // ── GitHubRanking ──────────────────────────────────────────
  githubRankingTitle: "GitHub 실시간 랭킹",
  githubRankingDesc: "GitHub에서 가장 많은 스타를 받은 글로벌 인기 리포지토리 목록을 실시간으로 탐색하세요.",
  githubSearchPlaceholder: "예: react stars:>50000",
  searchBtn: "검색",
  apiLimitTitle: "GitHub 실시간 검색 및 한도 제약 안내",
  apiLimitDesc: "이 페이지의 모든 데이터는 실시간 GitHub Search API를 통해 가져옵니다. 비인증 API 요청은 IP당 시간당 10회 (최대 60회)로 엄격하게 제한됩니다. 필터 변경이나 커스텀 검색을 너무 자주 실행하면 API Rate Limit에 도달하여 일시적으로 조회가 차단될 수 있습니다.",
  langRankingLabel: "프로그래밍 언어별 랭킹",
  dateFilterLabel: "기간 필터 (생성일 기준)",
  dateAll: "전체 기간",
  dateWeek: "최근 1주일",
  dateMonth: "최근 1개월",
  errorFetch: "데이터를 가져오는 중 오류가 발생했습니다.",
  errorLimit: "GitHub API 한도 초과 또는 오류가 발생했습니다.",
  thRank: "순위",
  thProject: "프로젝트명",
  thLang: "언어",
  thDesc: "설명",
  thCommit: "최근 커밋",
  noDesc: "설명 없음",
  loadingGithub: "GitHub 데이터를 가져오는 중...",
  noResult: "표시할 리포지토리 결과가 없습니다.",
  settingsRankingCountLabel: "자주 보는 사이트 표시 수",
  settingsRankingCountDesc: "「자주 보는 사이트」 순위에 표시할 개수",
  settingsMaxDepthLabel: "최대 폴더 깊이",
  settingsMaxDepthDesc: "사이드바 및 AI 정리의 최대 중첩 깊이 (1~5)",
  settingsKeepFoldersLabel: "기존 폴더 유지",
  settingsKeepFoldersDesc:
    "ON: 기존 폴더를 삭제하거나 이름을 변경하지 않음 (새 폴더는 생성 가능)",
  settingsSaving: "저장 중...",

  // ── Chrome Bookmark Panel ─────────────────────────────
  chromeBookmarksTitle: "Chrome 북마크",
  chromePatternsTitle: "패턴",
  chromePatternSaveTooltip: "현재 Chrome 북마크를 패턴으로 저장",
  chromePatternSaveBtn: "저장",
  chromePatternLoadTooltip: "Chrome으로 가져오기 (누락된 URL 추가)",
  chromePatternLoadBtn: "가져오기",
  chromeReloadTooltip: "새로고침",
  chromeLoading: "불러오는 중...",
  chromeSelectAll: "전체 선택",
  chromeDeselectAll: "전체 해제",
  chromeSelectedCount: "{n}개 선택됨",
  chromeBulkImport: "일괄 등록",
  chromeBulkDelete: "일괄 삭제",
  chromeImportAll: "전체 가져오기",
  chromeImportText: "텍스트",
  chromeResetTooltip: "동기화 전 상태로 리셋",
  chromeWriteBtn: "Chrome에 쓰기 ({n}개)",
  chromeCancel: "취소",
  chromeRenameTooltip: "이름 변경",
  chromeDeleteTooltip: "삭제",
  chromeTextExtractTitle: "텍스트에서 URL 추출",
  chromeTextExtractDesc: "URL이 포함된 텍스트를 붙여넣으세요. http/https URL을 자동으로 추출하여 Chrome 북마크에 추가합니다.",
  chromeTextDetected: "감지된 URL 수: {n}개",
  chromeTextImportPlaceholder: "예시:\nhttps://example.com\nhttps://github.com/...",
  chromeTextImporting: "등록 중...",
  chromeTextImportBtn: "등록하기",
  chromeBulkDeleteConfirm: "선택한 {n}개를 삭제 대기열에 추가하시겠습니까?\n'Chrome에 쓰기' 버튼을 클릭하면 실제 반영됩니다. 계속하시겠습니까?",
  chromeBulkDeleteQueueDone: "{n}개를 삭제 대기열에 추가했습니다",
  chromeBulkImportDone: "{n}개를 등록했습니다",
  chromeImportAllConfirm: "Chrome의 전체 {n}개 북마크를 ClickBook으로 가져오시겠습니까? 계속하시겠습니까?",
  chromeImportAllDone: "전체 북마크를 가져왔습니다",
  chromeTextImportNoUrls: "URL을 찾지 못했습니다",
  chromeSyncConfirm: "ClickBook에서 변경한 북마크를 Chrome에 동기화하시겠습니까 (추가, 이름 변경, 삭제)? 계속하시겠습니까?",
  chromeSyncDone: "추가 {added} · 수정 {updated} · 삭제 {deleted}",
  chromeSyncSuccess: "Chrome에 반영했습니다",
  chromeResetConfirm: "Chrome 북마크를 동기화 전 상태로 되돌리시겠습니까? 계속하시겠습니까?",
  chromeResetDone: "리셋 완료",
  chromeResetNoSnapshot: "스냅샷이 없습니다",
  chromeQueueRename: "이름 변경을 대기열에 추가 - 'Chrome에 쓰기'로 반영",
  chromeDeleteFolderConfirm: "폴더 '{title}'과 그 안의 모든 내용을 삭제하시겠습니까? 계속하시겠습니까?",
  chromeDeleteBookmarkConfirm: "'{title}'을(를) 삭제하시겠습니까?",
  chromeDeleteBtn: "삭제하기",
  chromeWriteConfirm: "{n}개의 변경 사항을 Chrome에 반영하시겠습니까? 계속하시겠습니까?",
  chromeWriteDone: "{n}개의 변경 사항을 Chrome에 반영했습니다",
  chromePatternSaveDone: "패턴 '{name}'을(를) 저장했습니다 ({n}개)",
  chromePatternLoadConfirm: "패턴 '{name}'을(를) Chrome으로 가져오시겠습니까 (누락된 URL만 추가)? 계속하시겠습니까?",
  chromePatternLoadDone: "추가 {added}개 / 전체 {total}개",
  chromePatternDeleteConfirm: "패턴 '{name}'을(를) 삭제하시겠습니까?",
  chromeMoveQueue: "이동을 대기열에 추가 — 'Chrome에 쓰기'로 반영",


  // ── Popup ─────────────────────────────────────────────────
  popupBookmarkSection: "북마크 관리",
  popupSave: "사이트 저장",
  popupBulkSave: "활성 탭 일괄 저장",
  popupBulkSaveTitle: "모든 활성 탭 일괄 저장 (http/https만)",
  popupTextImportTitle: "텍스트에서 URL을 추출하여 일괄 등록",
  popupMemoTitle: "이 페이지에 메모 추가",
  popupManageTitle: "북마크 관리",
  popupSettingsTitle: "설정",
  popupTheme: "테마",
  popupLight: "라이트",
  popupDark: "다크",
  popupTextImportMenu: "텍스트 URL 가져오기",
  popupChromePanelMenu: "Chrome 북마크 패널",
  popupAiAvailableTitle: "Gemini Nano (AI 분류) 사용 가능",
  popupAiUnavailableTitle: "AI 사용 불가 — 규칙 기반 분류 사용",
  popupSaved: "저장했습니다!",
  popupDuplicate: "이 URL은 이미 저장되어 있습니다.",
  popupSaveFailed: "저장에 실패했습니다.",
  popupError: "오류가 발생했습니다.",
  popupBulkResult: "{saved}개 저장 · {skipped}개 건너뜀 (중복)",
  popupUrlCopySection: "URL 복사",
  popupBrowserDataSection: "브라우저 데이터 삭제",
  popupClearDone: "완료!",
  popupHardReloadTitle: "강제 새로고침 (Ctrl+F5) — 캐시를 무시하고 강제 재로드",
  popupAiNote: "Gemini Nano는 Chrome 128+ Dev/Canary + 플래그 활성화 필요",
  popupRuleBased: "규칙 기반",
  popupTextImportPanel: "텍스트에서 URL을 추출하여 등록",
  popupTextDetected: "URL {n}개 감지됨",
  popupTextAutoDetect: "URL을 자동으로 감지합니다",
  popupTextImporting: "등록 중...",
  popupTextImportBtn: "일괄 등록",
  popupTextResult: "{saved}개 등록 · {skipped}개 건너뜀 (중복)",
  popupMemoPanel: "페이지 메모",
  popupMemoPlaceholder: "메모 입력...",
  popupMemoAutoBookmark: "※ 저장 시 사이트도 자동으로 북마크 등록됩니다",
  popupMemoSaved: "저장 완료!",
  popupMemoSave: "저장",
  popupCacheLabel: "캐시",
  popupDownloadsLabel: "다운로드 기록",
  popupHistoryLabel: "방문 기록",
  popupStorageLabel: "저장소",
  popupPasswordsLabel: "비밀번호",
  copySimpleDesc: "제목 URL을 한 줄로 복사",
  copyBreaklineDesc: "제목과 URL을 줄바꿈하여 복사",
  copyUrlDesc: "URL만 복사",
  copyMarkdownDesc: "Markdown 링크 형식",
  copyBacklogDesc: "Backlog Wiki 형식",

  // ── Phase 3 ───────────────────────────────────────────────
  onboardingTitle: "ClickBook에 오신 것을 환영합니다!",
  onboardingStep1Title: "1클릭 저장",
  onboardingStep1Desc: "확장 프로그램 아이콘을 클릭하여 현재 탭을 즉시 저장하세요.",
  onboardingStep2Title: "AI 자동 정리",
  onboardingStep2Desc: "Gemini Nano를 사용하여 북마크를 자동 분류합니다. 'AI 정리'를 클릭하여 전체를 정리해 보세요.",
  onboardingStep3Title: "계층형 폴더 & 드래그 앤 드롭",
  onboardingStep3Desc: "드래그 앤 드롭으로 중첩된 폴더를 직관적으로 관리할 수 있습니다.",
  onboardingStartBtn: "시작하기",
  settingsStorageUsage: "저장소 사용량",
  settingsStorageUsageDesc: "ClickBook이 사용하는 로컬 저장소",
  settingsShortcuts: "키보드 단축키",
  settingsShortcutSave: "현재 탭 저장 (Alt+S)",
};

const DICT: Record<Lang, typeof en> = { en, ja, ko };

// ── Browser language detection ────────────────────────────

export function detectBrowserLang(): Lang {
  const nav = navigator.language ?? navigator.languages?.[0] ?? "en";
  const base = nav.split("-")[0].toLowerCase();
  if (base === "ja") return "ja";
  if (base === "ko") return "ko";
  return "en";
}

// ── Translation function factory ──────────────────────────

export function createT(lang: Lang) {
  const dict = DICT[lang] ?? DICT.en;
  return function t(
    key: keyof typeof en,
    vars?: Record<string, string | number>
  ): string {
    let str: string = dict[key] ?? DICT.en[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      }
    }
    return str;
  };
}

export type TFunction = ReturnType<typeof createT>;
