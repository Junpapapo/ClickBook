import type { Bookmark, Message, MessageResponse } from "@/shared/types";
import { categorize } from "@/shared/categorizer";
import { getBookmarks, addBookmark, getAllData } from "@/shared/storage";
import { getFolderById, DOMAIN_RULES, DEFAULT_FOLDER_ID } from "@/shared/categories";

// ============================================================
// Service Worker — Chrome MV3 Background
// ============================================================

// キーボードショートカット: Alt+S で現在のタブを保存
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "save-current-tab") {
    await saveActiveTab();
  }
});

// ── AI 정리: 포트 기반 장기 연결 (MV3에서 Service Worker 슬립 방지) ──
// sendMessage와 달리 포트가 열려있는 동안 Service Worker가 슬립하지 않음
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "ai-reorganize") return;
  runAIReorganizeViaPort(port);
});

chrome.runtime.onMessage.addListener(
  (message: Message, _sender, sendResponse) => {
    handleMessage(message)
      .then((response) => sendResponse(response))
      .catch((err) =>
        sendResponse({ success: false, error: String(err) } satisfies MessageResponse)
      );
    return true;
  }
);

async function handleMessage(message: Message): Promise<MessageResponse> {
  switch (message.type) {
    case "SAVE_TAB":
      return await saveActiveTab();
    case "GET_BOOKMARKS": {
      const bookmarks = await getBookmarks();
      return { success: true, data: bookmarks };
    }
    case "GET_ALL_DATA": {
      const allData = await getAllData();
      return { success: true, data: allData };
    }
    case "DELETE_BOOKMARK": {
      const { deleteBookmark } = await import("@/shared/storage");
      await deleteBookmark(message.id);
      return { success: true };
    }
    case "UPDATE_BOOKMARK": {
      const { updateBookmark, isDuplicateUrl } = await import("@/shared/storage");
      if (message.url) {
        const dup = await isDuplicateUrl(message.url, message.id);
        if (dup) return { success: false, error: "This URL is already saved", isDuplicate: true };
      }
      await updateBookmark(message.id, { title: message.title, url: message.url, folderId: message.folderId });
      return { success: true };
    }
    case "ADD_BOOKMARK": {
      const { isDuplicateUrl } = await import("@/shared/storage");
      const dup = await isDuplicateUrl(message.url);
      if (dup) return { success: false, error: "This URL is already registered", isDuplicate: true };
      if (!message.url.startsWith("http://") && !message.url.startsWith("https://")) {
        return { success: false, error: "Please enter an http/https URL" };
      }
      const parsedUrl = new URL(message.url);
      const domain = parsedUrl.hostname;
      const bookmark: Bookmark = {
        id: crypto.randomUUID(),
        url: message.url,
        title: message.title || message.url,
        favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
        folderId: message.folderId,
        domain,
        visitCount: 0,
        savedAt: Date.now(),
      };
      await addBookmark(bookmark);
      return { success: true };
    }
    case "INCREMENT_VISIT": {
      const { incrementVisitCount } = await import("@/shared/storage");
      await incrementVisitCount(message.id);
      return { success: true };
    }
    case "MOVE_BOOKMARK": {
      const { moveBookmark } = await import("@/shared/storage");
      await moveBookmark(message.id, message.folderId);
      return { success: true };
    }
    case "CREATE_FOLDER": {
      const { createFolder } = await import("@/shared/storage");
      const folder = await createFolder(message.name, message.parentId, message.icon);
      return { success: true, data: folder };
    }
    case "RENAME_FOLDER": {
      const { renameFolder } = await import("@/shared/storage");
      await renameFolder(message.id, message.name, message.icon);
      return { success: true };
    }
    case "MOVE_FOLDER": {
      const { moveFolder } = await import("@/shared/storage");
      await moveFolder(message.id, message.parentId, message.order);
      return { success: true };
    }
    case "DELETE_FOLDER": {
      const { deleteFolder } = await import("@/shared/storage");
      await deleteFolder(message.id);
      return { success: true };
    }
    case "TOGGLE_FOLDER": {
      const { toggleFolderCollapsed } = await import("@/shared/storage");
      await toggleFolderCollapsed(message.id);
      return { success: true };
    }
    case "TOGGLE_FOLDER_LOCK": {
      const { toggleFolderLock } = await import("@/shared/storage");
      await toggleFolderLock(message.id);
      return { success: true };
    }
    case "EXPORT_DATA": {
      const { exportData } = await import("@/shared/storage");
      const data = await exportData();
      return { success: true, data };
    }
    case "IMPORT_DATA": {
      const { importData } = await import("@/shared/storage");
      await importData(message.data);
      return { success: true };
    }
    // ── Chrome Bookmarks ──────────────────────────────────
    case "GET_CHROME_BOOKMARKS": {
      const tree = await chrome.bookmarks.getTree();
      return { success: true, data: tree };
    }
    case "RENAME_CHROME_BOOKMARK": {
      await chrome.bookmarks.update(message.id, { title: message.title });
      return { success: true };
    }
    case "MOVE_CHROME_BOOKMARK": {
      await chrome.bookmarks.move(message.id, {
        parentId: message.parentId,
        ...(message.index !== undefined ? { index: message.index } : {}),
      });
      return { success: true };
    }
    case "DELETE_CHROME_BOOKMARK": {
      try {
        if (message.isFolder) {
          await chrome.bookmarks.removeTree(message.id);
        } else {
          await chrome.bookmarks.remove(message.id);
        }
      } catch (e) {
        return { success: false, error: String(e) };
      }
      return { success: true };
    }
    case "SAVE_CHROME_SNAPSHOT": {
      const { saveChromeSnapshot } = await import("@/shared/storage");
      const tree = await chrome.bookmarks.getTree();
      await saveChromeSnapshot(tree);
      return { success: true };
    }
    case "RESTORE_CHROME_SNAPSHOT": {
      const { getChromeSnapshot } = await import("@/shared/storage");
      const snapshot = await getChromeSnapshot();
      if (!snapshot) return { success: false, error: "No snapshot available" };
      await restoreFromSnapshot(snapshot);
      return { success: true };
    }
    case "SYNC_TO_CHROME": {
      const { saveChromeSnapshot } = await import("@/shared/storage");
      const tree = await chrome.bookmarks.getTree();
      await saveChromeSnapshot(tree);
      const data = await getAllData();
      const stats = await syncToChrome(data);
      return { success: true, data: stats };
    }
    case "BULK_IMPORT_CHROME": {
      const count = await bulkImport(message.items, message.folderId);
      // インポートしたブックマークを「シンク済み」として記録（再Push防止）
      const afterImport = await getAllData();
      await saveChromeSyncBaseline(afterImport.bookmarks);
      return { success: true, data: { count } };
    }
    // ── Patterns ──────────────────────────────────────────
    case "GET_PATTERNS": {
      const { getPatterns } = await import("@/shared/storage");
      return { success: true, data: await getPatterns() };
    }
    case "SAVE_PATTERN": {
      const { savePattern } = await import("@/shared/storage");
      const data = await getAllData();
      return { success: true, data: await savePattern(message.name, data) };
    }
    case "LOAD_PATTERN": {
      const { loadPattern } = await import("@/shared/storage");
      await loadPattern(message.id);
      return { success: true };
    }
    case "DELETE_PATTERN": {
      const { deletePattern } = await import("@/shared/storage");
      await deletePattern(message.id);
      return { success: true };
    }
    // ── Chrome Patterns ────────────────────────────────────
    case "GET_CHROME_PATTERNS": {
      const { getChromePatterns } = await import("@/shared/storage");
      return { success: true, data: await getChromePatterns() };
    }
    case "SAVE_CHROME_PATTERN": {
      const { saveChromePattern } = await import("@/shared/storage");
      const tree = await chrome.bookmarks.getTree();
      const items = flattenChromeTree(tree);
      await saveChromePattern(message.name, items);
      return { success: true, data: { count: items.length } };
    }
    case "LOAD_CHROME_PATTERN": {
      const { getChromePatterns } = await import("@/shared/storage");
      const patterns = await getChromePatterns();
      const pattern = patterns.find((p) => p.id === message.id);
      if (!pattern) return { success: false, error: "Pattern not found" };
      const tree = await chrome.bookmarks.getTree();
      const existingUrls = new Set(flattenChromeTree(tree).map((i) => i.url));
      const barId = tree[0]?.children?.[0]?.id ?? "1";
      let added = 0;
      for (const item of pattern.items) {
        if (!existingUrls.has(item.url)) {
          await chrome.bookmarks.create({ parentId: barId, title: item.title, url: item.url });
          added++;
        }
      }
      return { success: true, data: { added, total: pattern.items.length } };
    }
    case "DELETE_CHROME_PATTERN": {
      const { deleteChromePattern } = await import("@/shared/storage");
      await deleteChromePattern(message.id);
      return { success: true };
    }
    case "GET_MEMOS": {
      const { getMemos } = await import("@/shared/storage");
      return { success: true, data: await getMemos() };
    }
    case "SAVE_MEMO": {
      const { saveMemo } = await import("@/shared/storage");
      await saveMemo(message.bookmarkId, message.content, message.color);
      return { success: true };
    }
    case "DELETE_MEMO": {
      const { deleteMemo } = await import("@/shared/storage");
      await deleteMemo(message.bookmarkId);
      return { success: true };
    }
    case "GET_SETTINGS": {
      const { getSettings } = await import("@/shared/storage");
      return { success: true, data: await getSettings() };
    }
    case "SAVE_SETTINGS": {
      const { saveSettings } = await import("@/shared/storage");
      await saveSettings(message.settings);
      return { success: true };
    }
    case "AI_REORGANIZE":
    case "AI_REORGANIZE_STATUS": {
      // 포트 기반으로 처리됨 (chrome.runtime.onConnect "ai-reorganize")
      return { success: true, data: null };
    }
    default:
      return { success: false, error: "Unknown message type" };
  }
}

// ── SAVE_TAB ──────────────────────────────────────────────

async function saveActiveTab(): Promise<MessageResponse> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // tab 自体が undefined、または url が空の場合（chrome://... など）を明示的に弾く
  if (!tab) {
    return { success: false, error: "No active tab found" };
  }
  if (!tab.url) {
    return { success: false, error: "Could not get tab URL" };
  }
  if (!tab.url.startsWith("http://") && !tab.url.startsWith("https://")) {
    return { success: false, error: "Only http/https URLs can be saved" };
  }

  const existing = await getBookmarks();
  const isDuplicate = existing.some((b) => b.url === tab.url);
  if (isDuplicate) {
    return { success: false, error: "URL already saved", isDuplicate: true };
  }

  const url = new URL(tab.url);
  const domain = url.hostname;
  const { folderId, method } = await categorize(tab.url, tab.title ?? "", domain);
  const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

  const bookmark: Bookmark = {
    id: crypto.randomUUID(),
    url: tab.url,
    title: tab.title ?? tab.url ?? "Untitled",
    favicon,
    ogpImage: undefined,
    folderId,
    domain,
    visitCount: 0,
    savedAt: Date.now(),
  };

  await addBookmark(bookmark);

  const { getFolders } = await import("@/shared/storage");
  const folders = await getFolders();
  const folder = getFolderById(folders, folderId);
  return { success: true, data: { bookmark, folderName: folder.name, method } };
}

// ── Chrome Sync Helpers ───────────────────────────────────

function flattenChromeTree(
  nodes: chrome.bookmarks.BookmarkTreeNode[]
): Array<{ url: string; title: string }> {
  const result: Array<{ url: string; title: string }> = [];
  for (const n of nodes) {
    if (n.url) result.push({ url: n.url, title: n.title });
    if (n.children) result.push(...flattenChromeTree(n.children));
  }
  return result;
}

async function bulkImport(
  items: Array<{ url: string; title: string }>,
  fixedFolderId?: string
): Promise<number> {
  const existing = await getBookmarks();
  const existingUrls = new Set(existing.map((b) => b.url));
  const newBookmarks: Bookmark[] = [];

  for (const item of items) {
    if (!item.url || existingUrls.has(item.url)) continue;
    if (!item.url.startsWith("http://") && !item.url.startsWith("https://")) continue;

    const url = new URL(item.url);
    const domain = url.hostname;
    const folderId = fixedFolderId ?? (await categorize(item.url, item.title, domain)).folderId;

    newBookmarks.push({
      id: crypto.randomUUID(),
      url: item.url,
      title: item.title || item.url,
      favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      folderId,
      domain,
      visitCount: 0,
      savedAt: Date.now(),
    });
    existingUrls.add(item.url);
  }

  if (newBookmarks.length > 0) {
    const { addBookmarks } = await import("@/shared/storage");
    await addBookmarks(newBookmarks);
  }
  return newBookmarks.length;
}

// ── Chrome Sync Baseline ──────────────────────────────────

const CHROME_SYNC_KEY = "clickbook_chrome_last_sync";

async function getChromeSyncBaseline(): Promise<Array<{ url: string; title: string }>> {
  const result = await chrome.storage.local.get(CHROME_SYNC_KEY);
  return result[CHROME_SYNC_KEY]?.bookmarks ?? [];
}

async function saveChromeSyncBaseline(bookmarks: import("@/shared/types").Bookmark[]): Promise<void> {
  await chrome.storage.local.set({
    [CHROME_SYNC_KEY]: {
      bookmarks: bookmarks.map((b) => ({ url: b.url, title: b.title })),
      syncedAt: Date.now(),
    },
  });
}

/**
 * 差分シンク: 前回シンク時との差分（追加・タイトル変更・削除）だけを Chrome へ適用する。
 * Chrome のブックマークバーを丸ごと置き換えることはしない。
 */
async function syncToChrome(
  data: import("@/shared/types").StorageData
): Promise<{ added: number; updated: number; deleted: number }> {
  const baseline = await getChromeSyncBaseline();
  const baselineMap = new Map(baseline.map((b) => [b.url, b.title]));
  const currentMap = new Map(data.bookmarks.map((b) => [b.url, b]));

  let added = 0, updated = 0, deleted = 0;

  // 追加 / タイトル変更
  for (const [url, bm] of currentMap) {
    const prevTitle = baselineMap.get(url);
    if (prevTitle === undefined) {
      // 新規追加: 対応する Chrome フォルダーを探して登録
      const parentId = await findOrCreateChromeFolder(bm.folderId, data);
      await chrome.bookmarks.create({ parentId, title: bm.title, url });
      added++;
    } else if (prevTitle !== bm.title) {
      // タイトル変更
      const results = await chrome.bookmarks.search({ url });
      for (const r of results) {
        if (!r.url) continue;
        await chrome.bookmarks.update(r.id, { title: bm.title });
        updated++;
        break;
      }
    }
  }

  // 削除: 前回シンク時にあったが今はない URL
  for (const [url] of baselineMap) {
    if (!currentMap.has(url)) {
      const results = await chrome.bookmarks.search({ url });
      for (const r of results) {
        if (!r.url) continue;
        try { await chrome.bookmarks.remove(r.id); } catch (err) { console.warn("Operation failed:", err); }
        deleted++;
        break;
      }
    }
  }

  // 今回のシンク結果を次回の基準として保存
  await saveChromeSyncBaseline(data.bookmarks);

  return { added, updated, deleted };
}

/** Chrome ブックマークバー直下でフォルダーを探し、なければ作成して ID を返す */
async function findOrCreateChromeFolder(
  folderId: string,
  data: import("@/shared/types").StorageData
): Promise<string> {
  const folder = data.folders.find((f) => f.id === folderId);
  if (!folder) return "1";

  const { clickbook_lang } = await chrome.storage.local.get("clickbook_lang");
  const lang = clickbook_lang || "en";

  let localizedName = folder.name;
  if (lang === "ja" && folder.nameJa) {
    localizedName = folder.nameJa;
  } else if (lang === "ko") {
    const koNames: Record<string, string> = {
      technology: "테크놀로지",
      design: "디자인",
      business: "비즈니스",
      entertainment: "엔터테인먼트",
      science: "과학",
      sports: "스포츠",
      travel: "여행",
      other: "기타",
    };
    if (koNames[folder.id]) localizedName = koNames[folder.id];
  }

  const barChildren = await chrome.bookmarks.getChildren("1");
  const existing = barChildren.find((c) => !c.url && c.title === localizedName);
  if (existing) return existing.id;

  const created = await chrome.bookmarks.create({ parentId: "1", title: localizedName });
  return created.id;
}

async function restoreFromSnapshot(snapshot: chrome.bookmarks.BookmarkTreeNode[]): Promise<void> {
  const snap = snapshot[0]?.children?.find((n) => n.id === "1");
  if (!snap) return;

  const cur = await chrome.bookmarks.getTree();
  const bar = cur[0]?.children?.find((n) => n.id === "1");
  for (const child of bar?.children ?? []) {
    try { await chrome.bookmarks.removeTree(child.id); } catch (err) { console.warn("Operation failed:", err); }
  }

  for (const node of snap.children ?? []) await restoreNode(node, "1");
}

async function restoreNode(node: chrome.bookmarks.BookmarkTreeNode, parentId: string): Promise<void> {
  if (node.url) {
    await chrome.bookmarks.create({ parentId, title: node.title, url: node.url });
  } else {
    const f = await chrome.bookmarks.create({ parentId, title: node.title });
    for (const child of node.children ?? []) await restoreNode(child, f.id);
  }
}


// ── AI Reorganize Helper ──────────────────────────────────

const AI_REORGANIZE_CATEGORIES = new Set([
  "technology", "design", "business", "entertainment",
  "science", "sports", "travel", "other",
]);

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms))
  ]);
}

/**
 * 포트 기반 AI 정리 실행
 * 포트가 열려있는 동안 MV3 Service Worker가 슬립하지 않으므로
 * 장시간 AI 처리도 중단 없이 완료할 수 있음
 */
async function runAIReorganizeViaPort(port: chrome.runtime.Port): Promise<void> {
  let disconnected = false;
  port.onDisconnect.addListener(() => { disconnected = true; });

  const send = (msg: object) => {
    if (disconnected) return;
    try { port.postMessage(msg); } catch (_) { /* 포트가 닫힌 경우 무시 */ }
  };

  try {
    send({ type: "running" });

    const data = await getAllData();
    if (disconnected) return;

    const { getSettings, savePattern } = await import("@/shared/storage");
    const settings = await getSettings();

    // 1. 실행 전 현재 상태를 패턴으로 백업
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const backupName = `AI Organize Backup ${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    await savePattern(backupName, data);
    if (disconnected) return;

    // 2. 잠긴 폴더의 북마크는 제외
    const lockedFolderIds = new Set(
      data.folders.filter((f) => f.locked).map((f) => f.id)
    );
    const bookmarksToProcess = data.bookmarks.filter(
      (b) => !lockedFolderIds.has(b.folderId)
    );

    // 3. AI로 각 북마크의 폴더 판별 (배치 처리)
    const moves = await reorganizeWithAI(
      bookmarksToProcess,
      settings.maxFolderDepth,
      settings.keepExistingFolders ? data.folders : undefined
    );
    if (disconnected) return;

    // 4. 차이가 있는 것만 이동
    const { moveBookmark } = await import("@/shared/storage");
    let movedCount = 0;
    for (const [bookmarkId, newFolderId] of moves) {
      const existing = data.bookmarks.find((b) => b.id === bookmarkId);
      if (existing && existing.folderId !== newFolderId) {
        await moveBookmark(bookmarkId, newFolderId);
        movedCount++;
      }
    }

    // 5. 완료 결과를 포트로 전송
    send({ type: "done", movedCount, total: data.bookmarks.length, backupName });
  } catch (err) {
    console.error("AI reorganize error:", err);
    send({ type: "error", error: String(err) });
  }
}




/**
 * AI + 도메인 룰 기반 재분류
 *
 * 설계 원칙:
 * 1. 먼저 도메인 룰로 전체 결과를 즉시 초기화 (동기, 빠름, 절대 실패 없음)
 * 2. AI는 그 위에 선택적으로 개선만 함
 * → AI가 완전히 실패/타임아웃해도 항상 결과 반환, 절대 무한 대기 없음
 *
 * 주의: fallback에서 categorize()를 쓰면 내부에서 타임아웃 없이 AI를 재시도하므로
 * 절대 사용 금지 — 도메인 룰 직접 참조
 */
async function reorganizeWithAI(
  bookmarks: import("@/shared/types").Bookmark[],
  _maxFolderDepth = 3,
  existingFolders?: import("@/shared/types").Folder[]
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (bookmarks.length === 0) return result;

  // ── Step 1: 도메인 룰로 전체 즉시 초기화 (동기, 타임아웃 없음) ──
  function domainCategory(domain: string): string {
    const normalized = domain.replace(/^www\./, "");
    if (DOMAIN_RULES[normalized]) return DOMAIN_RULES[normalized];
    const parts = normalized.split(".");
    for (let i = 1; i < parts.length - 1; i++) {
      const parent = parts.slice(i).join(".");
      if (DOMAIN_RULES[parent]) return DOMAIN_RULES[parent];
    }
    return DEFAULT_FOLDER_ID;
  }

  for (const bm of bookmarks) {
    result.set(bm.id, domainCategory(bm.domain));
  }
  console.log(`[AI Organize] Step1: domain rules applied for ${bookmarks.length} bookmarks`);

  // ── Step 2: AI 세션 생성 시도 (실패해도 Step1 결과로 종료) ──
  const folderHint = existingFolders && existingFolders.length > 0
    ? ` Prefer: ${existingFolders.map((f) => f.nameJa || f.name).join(", ")}.`
    : "";

  let session: { prompt: (s: string) => Promise<string>; destroy: () => void } | null = null;
  try {
    const w = self as any;
    const lm = w.ai?.languageModel || w.LanguageModel;
    if (lm && typeof lm.create === "function") {
      session = await withTimeout(
        (lm.create as (opts: unknown) => Promise<typeof session>)({
          systemPrompt:
            `You are a bookmark categorizer. Given a numbered list of bookmarks, respond with a JSON array of category IDs in the SAME ORDER. Each must be one of: technology, design, business, entertainment, science, sports, travel, other.${folderHint} Respond ONLY with the JSON array. Example: ["technology","other"]`,
        }),
        15000
      );
      console.log("[AI Organize] Step2: AI session created");
    }
  } catch (err) {
    console.warn("[AI Organize] Session creation failed, using domain rules only:", err);
    return result; // Step1 결과 그대로 반환
  }

  if (!session) {
    console.log("[AI Organize] No AI available, using domain rules");
    return result;
  }

  // ── Step 3: AI로 10개씩 배치 처리 → 성공 시 결과 덮어쓰기 ──
  // 실패해도 Step1의 도메인 룰 결과가 이미 있으므로 절대 무한 대기 없음
  const BATCH_SIZE = 10;
  let aiBatchSuccess = 0;

  for (let i = 0; i < bookmarks.length; i += BATCH_SIZE) {
    const batch = bookmarks.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    try {
      const lines = batch
        .map((bm, idx) => `${idx + 1}. ${bm.title} | ${bm.url}`)
        .join("\n");

      // 배치당 최대 30초 (10개 × 3초)
      const response = await withTimeout(session.prompt(lines), 30000);

      const jsonMatch = response.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        const parsed: unknown[] = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed) && parsed.length === batch.length) {
          for (let j = 0; j < batch.length; j++) {
            const cat = String(parsed[j]).trim().toLowerCase();
            if (AI_REORGANIZE_CATEGORIES.has(cat)) {
              result.set(batch[j].id, cat); // AI 결과로 덮어쓰기
            }
            // 유효하지 않으면 Step1의 도메인 룰 결과 유지
          }
          aiBatchSuccess++;
          console.log(`[AI Organize] Batch ${batchNum} OK`);
        }
      }
    } catch (err) {
      console.warn(`[AI Organize] Batch ${batchNum} failed (domain rules kept):`, err);
      // 이 배치는 Step1의 도메인 룰 결과 유지 — 추가 AI 재시도 없음
    }
  }

  console.log(`[AI Organize] Done. AI batches succeeded: ${aiBatchSuccess}/${Math.ceil(bookmarks.length / BATCH_SIZE)}`);
  session.destroy();
  return result;
}

