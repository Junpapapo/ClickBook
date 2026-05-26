import type { Bookmark, Message, MessageResponse } from "@/shared/types";
import { categorize, recommendSites, expandSearchQuery, getAIModel, generateSummaryAndTags, isAIAvailable, refineMemoDraft } from "@/shared/categorizer";
import { getBookmarks, addBookmark, getAllData } from "@/shared/storage";
import { getFolderById, DOMAIN_RULES, DEFAULT_FOLDER_ID, getLocalizedFolderName } from "@/shared/categories";
import { DICT, type Lang } from "@/shared/i18n";

async function getEffectiveLanguage(): Promise<Lang> {
  try {
    const { clickbook_lang } = await chrome.storage.local.get("clickbook_lang");
    if (clickbook_lang === "en" || clickbook_lang === "ja" || clickbook_lang === "ko") {
      return clickbook_lang as Lang;
    }
  } catch (e) {
    console.error("Error fetching clickbook_lang from storage:", e);
  }

  try {
    const uiLang = chrome.i18n.getUILanguage().toLowerCase();
    if (uiLang.startsWith("ko")) return "ko";
    if (uiLang.startsWith("ja")) return "ja";
  } catch (e) {
    console.error("Error getting UI language:", e);
  }

  return "en";
}

// ============================================================
// Service Worker — Chrome MV3 Background
// ============================================================

// キーボードショートカット: Alt+S で現在のタブ을 저장
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "save-current-tab") {
    await saveActiveTab();
  }
});

// contextMenus 우클릭 메뉴 등록
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "clickbook-clip-selection",
    title: "ClickBook: Save Highlight as Memo",
    contexts: ["selection"]
  });
});

// contextMenus 우클릭 메뉴 클릭 이벤트 핸들러
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "clickbook-clip-selection") {
    await clipSelection(info.selectionText, tab);
  }
});

// Tab cache for Privacy-First Session Sweeper
async function initializeTabCache() {
  try {
    const tabs = await chrome.tabs.query({});
    const tabMap: Record<string, string> = {};
    for (const tab of tabs) {
      if (tab.id && tab.url) {
        tabMap[String(tab.id)] = tab.url;
      }
    }
    await chrome.storage.session.set({ tabUrls: tabMap });
  } catch (err) {
    console.warn("Failed to initialize tab cache:", err);
  }
}

// Initialize on startup
initializeTabCache();

chrome.tabs.onCreated.addListener(async (tab) => {
  if (tab.id && tab.url) {
    try {
      const res = await chrome.storage.session.get("tabUrls");
      const tabMap = res.tabUrls || {};
      tabMap[String(tab.id)] = tab.url;
      await chrome.storage.session.set({ tabUrls: tabMap });
    } catch (e) {
      console.warn("Failed to update tab cache on create:", e);
    }
  }
  if (tab.id && tab.active) {
    await trackTabAccessed(tab.id);
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    try {
      const res = await chrome.storage.session.get("tabUrls");
      const tabMap = res.tabUrls || {};
      tabMap[String(tabId)] = changeInfo.url;
      await chrome.storage.session.set({ tabUrls: tabMap });
    } catch (e) {
      console.warn("Failed to update tab cache on update:", e);
    }

    // URL 변경 시 보안 검사를 수행하고 크롬 툴바 배지 상태를 동적 업데이트합니다.
    await checkAndSetSecureTabIndicator(tabId, changeInfo.url);
  }
  
  if (changeInfo.status === "complete") {
    // 추가: 탭 로드 완료 및 활성화 시 시간 트래킹
    if (tab.active) {
      await trackTabAccessed(tabId);
    }

    // 2안) 보안 세션 진입 완료 토스트 알림 1회 노출
    if (tab.url) {
      const isSecure = await checkIsDomainSecure(tab.url);
      if (isSecure) {
        await injectToast(tabId, "secureSessionActiveToast");
      }
    }
  }
});

chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  try {
    const res = await chrome.storage.session.get("tabUrls");
    const tabMap = res.tabUrls || {};
    const closedUrl = tabMap[String(tabId)];

    // 추가: 활성 탭 시간 추적 데이터 삭제
    const accessRes = await chrome.storage.session.get("tabLastAccessed");
    const lastAccessedMap = accessRes.tabLastAccessed || {};
    if (lastAccessedMap[String(tabId)]) {
      delete lastAccessedMap[String(tabId)];
      await chrome.storage.session.set({ tabLastAccessed: lastAccessedMap });
    }

    if (!closedUrl) return;

    delete tabMap[String(tabId)];
    await chrome.storage.session.set({ tabUrls: tabMap });

    await handleTabClosed(closedUrl, tabMap);
  } catch (e) {
    console.warn("Failed to handle tab remove:", e);
  }
});

// 추가: 탭이 전환(Activated)될 때 시간 트래킹 및 자동 서스펜드 검사, 보안 배지 즉시 업데이트, 자동 복원(옵션) 처리
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await trackTabAccessed(activeInfo.tabId);

  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    await checkAndSetSecureTabIndicator(activeInfo.tabId, tab.url);

    // 자동 복원(clickbook_auto_resume) 활성화 시 탭 포커스 되었을 때 즉시 세션 복원
    if (tab && tab.url && tab.url.includes("suspend.html")) {
      const res = await chrome.storage.local.get("clickbook_auto_resume");
      if (res.clickbook_auto_resume === true) {
        try {
          const urlObj = new URL(tab.url);
          const originalUrl = urlObj.searchParams.get("url");
          if (originalUrl) {
            await chrome.tabs.update(activeInfo.tabId, { url: originalUrl });
          }
        } catch (urlErr) {
          console.warn("Failed to parse original url from suspend.html url:", urlErr);
        }
      }
    }
  } catch (e) {
    console.warn("Failed to update secure badge or auto-resume on tab activate:", e);
  }
});

// ── 보안 폴더 및 세션 파쇄 실시간 검사 헬퍼 ──
async function checkIsDomainSecure(url: string): Promise<boolean> {
  if (!url || (!url.startsWith("http://") && !url.startsWith("https://"))) {
    return false;
  }
  let domain = "";
  try {
    const urlObj = new URL(url);
    domain = urlObj.hostname;
  } catch (e) {
    return false;
  }

  try {
    const { getAllData } = await import("@/shared/storage");
    const data = await getAllData();
    const secureFolders = data.folders.filter(f => f.secure === true);
    if (secureFolders.length === 0) return false;

    const secureFolderIds = new Set<string>();
    function collectSecure(folderId: string) {
      secureFolderIds.add(folderId);
      const children = data.folders.filter(f => f.parentId === folderId);
      for (const child of children) {
        collectSecure(child.id);
      }
    }
    for (const sf of secureFolders) {
      collectSecure(sf.id);
    }

    const secureBookmarks = data.bookmarks.filter(b => secureFolderIds.has(b.folderId));
    return secureBookmarks.some(b => b.domain === domain);
  } catch (e) {
    return false;
  }
}

async function checkAndSetSecureTabIndicator(tabId: number, url?: string) {
  if (!url) {
    try {
      await chrome.action.setBadgeText({ text: "", tabId });
    } catch (e) {}
    return;
  }

  try {
    const isSecure = await checkIsDomainSecure(url);
    if (isSecure) {
      // 1안) 크롬 툴바 아이콘 위에 초록색 SEC 배지 표시 (탭 한정)
      await chrome.action.setBadgeText({ text: "SEC", tabId });
      await chrome.action.setBadgeBackgroundColor({ color: "#10b981", tabId });
      try {
        await chrome.action.setBadgeTextColor({ color: "#ffffff", tabId });
      } catch (e) {}
    } else {
      // 일반 탭인 경우 배지 텍스트 클리어
      await chrome.action.setBadgeText({ text: "", tabId });
    }
  } catch (err) {
    // console.warn(err);
  }
}

async function handleTabClosed(closedUrl: string, activeTabMap: Record<string, string>) {
  let closedDomain = "";
  let closedOrigin = "";
  try {
    const urlObj = new URL(closedUrl);
    closedDomain = urlObj.hostname;
    closedOrigin = urlObj.origin;
  } catch (e) {
    return;
  }

  if (!closedDomain || (!closedUrl.startsWith("http://") && !closedUrl.startsWith("https://"))) {
    return;
  }

  // 해당 도메인의 다른 탭이 브라우저에 여전히 열려 있는지 체크합니다.
  // (모든 관련 탭이 닫혀 완벽히 세션이 끝났을 때만 보안 파쇄를 수행하기 위함)
  let domainStillOpen = false;
  for (const url of Object.values(activeTabMap)) {
    try {
      const u = new URL(url);
      if (u.hostname === closedDomain) {
        domainStillOpen = true;
        break;
      }
    } catch (e) {}
  }

  if (domainStillOpen) return;

  // ── [개인정보 보호 극대화: 보안 폴더 기반 세션 자동 파쇄] ──
  // 도메인의 마지막 탭이 닫히면, 이 도메인이 '보안 폴더(Secure Folder)'에 포함되어 있는지 검사합니다.
  // 일치하는 경우 쿠키, 로컬스토리지, IndexedDB, 캐시, 세션 데이터 등을 완전 소거(Shredding)하여 
  // 기밀/금융/개인정보 데이터 유출 및 쿠키 세션 하이재킹을 원천 차단합니다.
  const { getAllData } = await import("@/shared/storage");
  const data = await getAllData();
  const secureFolders = data.folders.filter(f => f.secure === true);
  if (secureFolders.length === 0) return;

  // 재귀적으로 보안 폴더의 모든 하위 폴더 ID를 수집합니다 (하위 구조 자동 상속 보안 모델).
  const secureFolderIds = new Set<string>();
  function collectSecure(folderId: string) {
    secureFolderIds.add(folderId);
    const children = data.folders.filter(f => f.parentId === folderId);
    for (const child of children) {
      collectSecure(child.id);
    }
  }
  for (const sf of secureFolders) {
    collectSecure(sf.id);
  }

  const secureBookmarks = data.bookmarks.filter(b => secureFolderIds.has(b.folderId));
  const matchesSecure = secureBookmarks.some(b => b.domain === closedDomain);

  if (matchesSecure) {
    try {
      // chrome.browsingData API를 사용하여 해당 Origin(출처)의 세션/로컬 잔재를 '파쇄(Shred)'합니다.
      // 전체 브라우저 데이터를 삭제하는 것이 아니라, 해당 보안 도메인 전용 데이터만 정밀 타격하여 삭제하므로
      // 다른 일반 탭들의 편리성은 그대로 유지하면서 초고강도 프라이버시 보호를 달성합니다.
      await chrome.browsingData.remove(
        { origins: [closedOrigin] },
        {
          cache: true,          // 캐시 파쇄 (네트워크 요청 흔적 제거)
          cookies: true,        // 쿠키 파쇄 (활성 로그인 세션 및 추적 토큰 완전 무효화)
          fileSystems: true,    // 로컬 파일시스템 잔재 제거
          indexedDB: true,      // 오프라인 데이터베이스 IndexedDB 소거
          localStorage: true,   // HTML5 로컬 스토리지 키-값 파괴
          serviceWorkers: true, // 등록된 백그라운드 서비스 워커 등록 취소
          webSQL: true          // 레거시 WebSQL 데이터 삭제
        }
      );
      console.log(`[Privacy-First Session Sweeper] Successfully shredded and cleared browsing session data for secure origin: ${closedDomain}`);

      // 파쇄 완료 사실을 사용자에게 실시간으로 피드백하기 위해, 현재 활성화된 탭의 화면에 글래스모피즘 알림(Toast)을 주입합니다.
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab && activeTab.id) {
        await injectToast(activeTab.id, "sessionCleanedToast", closedDomain);
      }
    } catch (err) {
      console.warn("Failed to clean browsing data for secure origin:", err);
    }
  }
}

// ── 스마트 탭 서스펜더 (시간 트래킹 및 자동 절전 모드 검사) ──
async function trackTabAccessed(tabId: number) {
  try {
    const now = Date.now();
    const res = await chrome.storage.session.get("tabLastAccessed");
    const lastAccessedMap = res.tabLastAccessed || {};
    lastAccessedMap[String(tabId)] = now;
    await chrome.storage.session.set({ tabLastAccessed: lastAccessedMap });
    
    // 온디맨드 자동 절전 검사 실행
    await checkAndAutoSuspend(now, lastAccessedMap);
  } catch (e) {
    console.warn("Failed to track tab access:", e);
  }
}

async function checkAndAutoSuspend(now: number, lastAccessedMap: Record<string, number>) {
  try {
    const settings = await chrome.storage.local.get("clickbook_auto_suspend_time");
    const autoSuspendTime = settings.clickbook_auto_suspend_time || 0; // 0은 자동 절전 사용 안 함 (기본값)
    if (autoSuspendTime <= 0) return;

    const tabs = await chrome.tabs.query({});
    const thresholdMs = autoSuspendTime * 60 * 1000;
    let mapChanged = false;

    for (const tab of tabs) {
      if (!tab.id || tab.active || tab.pinned || tab.audible) continue;
      if (!tab.url || (!tab.url.startsWith("http://") && !tab.url.startsWith("https://"))) continue;
      // 이미 절전 모드인 탭은 건너뜀
      if (tab.url.includes(chrome.runtime.getURL("suspend.html"))) continue;

      const lastAccessed = lastAccessedMap[String(tab.id)];
      if (!lastAccessed) {
        lastAccessedMap[String(tab.id)] = now;
        mapChanged = true;
        continue;
      }

      if (now - lastAccessed > thresholdMs) {
        const suspendUrl = chrome.runtime.getURL(`suspend.html?url=${encodeURIComponent(tab.url)}&title=${encodeURIComponent(tab.title || '')}&favicon=${encodeURIComponent(tab.favIconUrl || '')}`);
        await chrome.tabs.update(tab.id, { url: suspendUrl });
        delete lastAccessedMap[String(tab.id)];
        mapChanged = true;
      }
    }

    if (mapChanged) {
      await chrome.storage.session.set({ tabLastAccessed: lastAccessedMap });
    }
  } catch (e) {
    console.warn("Failed to auto suspend check:", e);
  }
}


// ── AI 정리: 포트 기반 장기 연결 (MV3에서 Service Worker 슬립 방지) ──
// sendMessage와 달리 포트가 열려있는 동안 Service Worker가 슬립하지 않음
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "ai-reorganize") {
    runAIReorganizeViaPort(port);
  } else if (port.name === "ai-reorganize-other") {
    runAIReorganizeOtherViaPort(port);
  }
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
      await updateBookmark(message.id, { title: message.title, url: message.url, folderId: message.folderId, tags: message.tags });
      return { success: true };
    }
    case "ADD_BOOKMARK": {
      const { isDuplicateUrl, addBookmark } = await import("@/shared/storage");
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

      // Run AI summary and tags generation asynchronously in the background
      (async () => {
        try {
          const { generateSummaryAndTags } = await import("@/shared/categorizer");
          const aiData = await generateSummaryAndTags(message.url, message.title || message.url, "");
          if (aiData && (aiData.summary || aiData.tags)) {
            const { updateBookmark } = await import("@/shared/storage");
            await updateBookmark(bookmark.id, {
              summary: aiData.summary,
              tags: aiData.tags,
            });
          }
        } catch (err) {
          console.warn("Background AI summary failed:", err);
        }
      })();

      return { success: true, data: bookmark };
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
    case "COLLAPSE_ALL_FOLDERS": {
      const { collapseAllFolders } = await import("@/shared/storage");
      await collapseAllFolders();
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
      const result = await importData(message.data);
      return { success: true, data: result };
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
    case "ADD_CHROME_BOOKMARKS": {
      const tree = await chrome.bookmarks.getTree();
      const existingUrls = new Set(flattenChromeTree(tree).map((i) => i.url));
      const barId = message.parentId || (tree[0]?.children?.[0]?.id ?? "1");
      let added = 0;
      for (const item of message.items) {
        if (!existingUrls.has(item.url)) {
          await chrome.bookmarks.create({ parentId: barId, title: item.title, url: item.url });
          added++;
          existingUrls.add(item.url);
        }
      }
      return { success: true, data: { count: added } };
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
    case "RECOMMEND_SITES": {
      const data = await recommendSites(message.keyword, message.count);
      return { success: true, data };
    }
    case "EXPAND_SEARCH": {
      const data = await expandSearchQuery(message.query);
      return { success: true, data };
    }
    case "FACTORY_RESET": {
      const { factoryReset } = await import("@/shared/storage");
      await factoryReset();
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
    case "GET_TODO_BOARD": {
      const { getTodoBoard } = await import("@/shared/storage");
      return { success: true, data: await getTodoBoard() };
    }
    case "SAVE_TODO_BOARD": {
      const { saveTodoBoard } = await import("@/shared/storage");
      await saveTodoBoard(message.data);
      return { success: true };
    }
    case "UPDATE_AI_INFO": {
      const { updateBookmark } = await import("@/shared/storage");
      const { generateSummaryAndTags } = await import("@/shared/categorizer");
      const aiData = await generateSummaryAndTags(message.url, message.title, "");
      if (!aiData.summary && !aiData.tags) {
        return { success: false, error: "AI failed to generate summary. Please try again." };
      }
      await updateBookmark(message.id, { summary: aiData.summary, tags: aiData.tags });
      return { success: true, data: aiData };
    }
    case "AI_REORGANIZE":
    case "AI_REORGANIZE_STATUS": {
      // 포트 기반으로 처리됨 (chrome.runtime.onConnect "ai-reorganize")
      return { success: true, data: null };
    }
    case "GET_CHROME_TAB_GROUPS": {
      try {
        const currentWindow = await chrome.windows.getLastFocused();
        const groups = await chrome.tabGroups.query({ windowId: currentWindow.id });
        return { success: true, data: groups };
      } catch (e) {
        return { success: false, error: String(e) };
      }
    }
    case "SAVE_TAB_GROUP_AS_FOLDER": {
      try {
        const { createFolder, addBookmark } = await import("@/shared/storage");
        const folder = await createFolder(message.name, null, "📁");
        const tabs = await chrome.tabs.query({ groupId: message.groupId });
        let savedCount = 0;
        for (const t of tabs) {
          if (t.url && (t.url.startsWith("http://") || t.url.startsWith("https://"))) {
            const urlObj = new URL(t.url);
            const domain = urlObj.hostname;
            const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
            const bookmark: Bookmark = {
              id: crypto.randomUUID(),
              url: t.url,
              title: t.title ?? t.url,
              favicon,
              folderId: folder.id,
              domain,
              visitCount: 0,
              savedAt: Date.now()
            };
            await addBookmark(bookmark);
            savedCount++;
          }
        }
        // Close tabs in group after saving!
        const tabIds = tabs.map(t => t.id).filter((id): id is number => id !== undefined);
        if (tabIds.length > 0) {
          await chrome.tabs.remove(tabIds);
        }
        return { success: true, data: { folder, savedCount } };
      } catch (e) {
        return { success: false, error: String(e) };
      }
    }
    case "OPEN_FOLDER_AS_TAB_GROUP": {
      try {
        const { getAllData } = await import("@/shared/storage");
        const data = await getAllData();
        const folderId = message.folderId;
        const folder = data.folders.find(f => f.id === folderId);
        if (!folder) return { success: false, error: "Folder not found" };

        const targetFolderIds = await collectAllFolderIds(folderId);
        const folderBookmarks = data.bookmarks.filter(b => targetFolderIds.includes(b.folderId));
        if (folderBookmarks.length === 0) {
          return { success: false, error: "No bookmarks in this folder" };
        }

        const tabIds: number[] = [];
        for (const bm of folderBookmarks) {
          const tab = await chrome.tabs.create({ url: bm.url, active: false });
          if (tab.id) tabIds.push(tab.id);
        }

        if (tabIds.length > 0) {
          const groupId = await chrome.tabs.group({ tabIds });
          const groupTitle = folder.name;
          const groupColor = mapFolderColorToGroupColor(folder.color);
          await chrome.tabGroups.update(groupId, { title: groupTitle, color: groupColor });
        }
        return { success: true };
      } catch (e) {
        return { success: false, error: String(e) };
      }
    }
    case "TOGGLE_FOLDER_SECURE": {
      const { toggleFolderSecure } = await import("@/shared/storage");
      await toggleFolderSecure(message.id);
      return { success: true };
    }
    case "CHECK_DOMAIN_SECURE": {
      try {
        const isSecure = await checkIsDomainSecure(message.url);
        return { success: true, isSecure };
      } catch (e) {
        return { success: false, isSecure: false, error: String(e) };
      }
    }
    case "SUSPEND_TAB": {
      try {
        const tab = await chrome.tabs.get(message.tabId);
        if (tab && tab.url && !tab.url.includes(chrome.runtime.getURL("suspend.html"))) {
          const suspendUrl = chrome.runtime.getURL(`suspend.html?url=${encodeURIComponent(tab.url)}&title=${encodeURIComponent(tab.title || '')}&favicon=${encodeURIComponent(tab.favIconUrl || '')}`);
          await chrome.tabs.update(message.tabId, { url: suspendUrl });
        }
        return { success: true };
      } catch (e) {
        return { success: false, error: String(e) };
      }
    }
    case "SUSPEND_ALL_INACTIVE": {
      try {
        const tabs = await chrome.tabs.query({});
        let count = 0;
        for (const tab of tabs) {
          if (tab.id && !tab.active && !tab.pinned && tab.url && (tab.url.startsWith("http://") || tab.url.startsWith("https://")) && !tab.audible && !tab.url.includes(chrome.runtime.getURL("suspend.html"))) {
            const suspendUrl = chrome.runtime.getURL(`suspend.html?url=${encodeURIComponent(tab.url)}&title=${encodeURIComponent(tab.title || '')}&favicon=${encodeURIComponent(tab.favIconUrl || '')}`);
            await chrome.tabs.update(tab.id, { url: suspendUrl });
            count++;
          }
        }
        return { success: true, data: count };
      } catch (e) {
        return { success: false, error: String(e) };
      }
    }
    case "UNSUSPEND_ALL": {
      try {
        const tabs = await chrome.tabs.query({});
        let count = 0;
        for (const tab of tabs) {
          if (tab.id && tab.url && tab.url.includes(chrome.runtime.getURL("suspend.html"))) {
            try {
              const urlObj = new URL(tab.url);
              const originalUrl = urlObj.searchParams.get("url");
              if (originalUrl) {
                await chrome.tabs.update(tab.id, { url: originalUrl });
                count++;
              }
            } catch (err) {}
          }
        }
        return { success: true, data: count };
      } catch (e) {
        return { success: false, error: String(e) };
      }
    }
    case "GET_SUSPEND_COUNT": {
      try {
        const tabs = await chrome.tabs.query({});
        let count = 0;
        for (const tab of tabs) {
          if (tab.url && tab.url.includes(chrome.runtime.getURL("suspend.html"))) {
            count++;
          }
        }
        return { success: true, data: count };
      } catch (e) {
        return { success: false, error: String(e) };
      }
    }
    case "GET_PAGE_CONTENTS": {
      const { getPageContents } = await import("@/shared/storage");
      const data = await getPageContents();
      return { success: true, data };
    }
    case "GET_PAGE_CONTENT": {
      const { getPageContent } = await import("@/shared/storage");
      const data = await getPageContent(message.bookmarkId);
      return { success: true, data };
    }
    case "SAVE_PAGE_CONTENT": {
      const { savePageContent } = await import("@/shared/storage");
      await savePageContent(message.bookmarkId, message.rawText, message.readableContent);
      return { success: true };
    }
    case "DELETE_PAGE_CONTENT": {
      const { deletePageContent } = await import("@/shared/storage");
      await deletePageContent(message.bookmarkId);
      return { success: true };
    }
    default:
      return { success: false, error: "Unknown message type" };
  }
}

async function collectAllFolderIds(folderId: string): Promise<string[]> {
  const { getFolders } = await import("@/shared/storage");
  const folders = await getFolders();
  const ids: string[] = [folderId];
  function collect(id: string) {
    const children = folders.filter((f) => f.parentId === id);
    for (const child of children) {
      ids.push(child.id);
      collect(child.id);
    }
  }
  collect(folderId);
  return ids;
}

function mapFolderColorToGroupColor(color?: string): chrome.tabGroups.Color {
  if (!color) return "grey";
  const c = color.toLowerCase();
  if (c.includes("indigo") || c.includes("purple") || c.includes("violet") || c.includes("fuchsia")) {
    return "purple";
  }
  if (c.includes("rose") || c.includes("red")) {
    return "red";
  }
  if (c.includes("pink")) {
    return "pink";
  }
  if (c.includes("blue") || c.includes("sky")) {
    return "blue";
  }
  if (c.includes("emerald") || c.includes("green") || c.includes("teal")) {
    return "green";
  }
  if (c.includes("cyan")) {
    return "cyan";
  }
  if (c.includes("yellow") || c.includes("amber")) {
    return "yellow";
  }
  if (c.includes("orange")) {
    return "orange";
  }
  return "grey";
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

  let description = "";
  let rawText = "";
  let readableContent = "";

  try {
    const [injectionResult] = await chrome.scripting.executeScript({
      target: { tabId: tab.id! },
      func: scrapePageContent
    });
    if (injectionResult?.result) {
      const res = injectionResult.result as { description: string; rawText: string; readableContent: string };
      description = res.description;
      rawText = res.rawText;
      readableContent = res.readableContent;
    }
  } catch (err) {
    console.warn("Scraping failed inside saveActiveTab:", err);
  }

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

  // Run AI summary, tags generation, and page content saving asynchronously in the background
  (async () => {
    try {
      // 1. Save page content if available
      if (rawText || readableContent) {
        const { savePageContent } = await import("@/shared/storage");
        await savePageContent(bookmark.id, rawText, readableContent);
      }

      // 2. Generate summary & tags
      const { generateSummaryAndTags } = await import("@/shared/categorizer");
      const aiData = await generateSummaryAndTags(tab.url, tab.title ?? "", description || readableContent.slice(0, 300));
      if (aiData && (aiData.summary || aiData.tags)) {
        const { updateBookmark } = await import("@/shared/storage");
        await updateBookmark(bookmark.id, {
          summary: aiData.summary,
          tags: aiData.tags,
        });
      }
    } catch (err) {
      console.warn("Background processes failed for saveActiveTab:", err);
    }
  })();

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

  const lang = await getEffectiveLanguage();

  const localizedName = getLocalizedFolderName(folder, lang);

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

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms))
  ]);
}

/** ClickBook AI Reorganize Debug Log Helper */
async function logAIDebug(message: string, details?: any): Promise<void> {
  try {
    const r = await chrome.storage.local.get("clickbook_ai_debug_log");
    const logs = Array.isArray(r.clickbook_ai_debug_log) ? r.clickbook_ai_debug_log : [];
    
    logs.push({
      timestamp: new Date().toISOString(),
      message,
      ...(details ? { details } : {})
    });
    
    // Limit to last 50 log entries to avoid bloating storage
    if (logs.length > 50) {
      logs.shift();
    }
    
    await chrome.storage.local.set({ clickbook_ai_debug_log: logs });
  } catch (err) {
    console.error("Failed to write AI debug log:", err);
  }
}

/**
 * 로컬 AI 응답에서 JSON 객체를 높은 회복력으로 파싱
 */
function robustParseJSON(text: string): Record<string, string> | null {
  if (!text) return null;
  let cleaned = text.trim();
  
  // 1. 마크다운 코드 블록 제거 (```json 또는 ```)
  cleaned = cleaned.replace(/^```json\s*/i, "");
  cleaned = cleaned.replace(/^```\s*/i, "");
  cleaned = cleaned.replace(/\s*```$/, "");
  cleaned = cleaned.trim();
  
  // 2. 가장 첫 번째 { 와 가장 마지막 } 사이만 추출 (앞뒤의 잡담 제거)
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  // 3. 후행 쉼표(Trailing commas) 제거 (예: {"1": "A",})
  cleaned = cleaned.replace(/,\s*([\]\}])/g, "$1");

  // 4. 표준 JSON.parse 시도
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const res: Record<string, string> = {};
      for (const [k, v] of Object.entries(parsed)) {
        if (v && typeof v === "string") {
          res[k] = v;
        } else if (v !== undefined && v !== null) {
          res[k] = String(v);
        }
      }
      return res;
    }
  } catch (e) {
    // 표준 파싱 실패 시 아래 정규식 대체 파서로 넘어감
  }

  // 5. 정규식 기반 대체 파서 (줄 단위 매칭)
  const result: Record<string, string> = {};
  let found = false;
  
  const kvRegex = /(?:"|')?(\d+)(?:"|')?\s*:\s*(?:"|')([^"'\n]+)(?:"|')/g;
  let match;
  while ((match = kvRegex.exec(text)) !== null) {
    const key = match[1];
    const val = match[2].trim();
    if (key && val) {
      result[key] = val;
      found = true;
    }
  }

  if (found) {
    return result;
  }

  return null;
}

/**
 * AI가 생성한 카테고리 경로를 정규화 및 큐레이팅
 */
function curateCategoryPath(path: string): string {
  if (!path) return "";
  
  const parts = path.split("/")
    .map(p => p.trim())
    .filter(Boolean);
    
  if (parts.length === 0) return "";
  
  const curatedParts = parts.map(part => {
    if (!part) return "";
    
    const upperPart = part.toUpperCase();
    if (upperPart === "AI" || upperPart === "UI" || upperPart === "UX" || upperPart === "IT") {
      return upperPart;
    }
    
    return part
      .split(/\s+/)
      .map(word => {
        if (!word) return "";
        const lowerWord = word.toLowerCase();
        if (lowerWord === "ai") return "AI";
        if (lowerWord === "ui") return "UI";
        if (lowerWord === "ux") return "UX";
        if (lowerWord === "it") return "IT";
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(" ");
  }).filter(Boolean);
  
  if (curatedParts.length === 0) return "";
  
  const firstPart = curatedParts[0].toLowerCase();
  
  const categoryMapping: Record<string, string> = {
    "tech": "Technology",
    "technology": "Technology",
    "programming": "Technology",
    "development": "Technology",
    "coding": "Technology",
    "software": "Technology",
    "it": "Technology",
    
    "design": "Design",
    "graphics": "Design",
    "art": "Design",
    "creative": "Design",
    "ui": "Design",
    "ux": "Design",
    
    "business": "Business",
    "finance": "Business",
    "marketing": "Business",
    "productivity": "Business",
    "work": "Business",
    "career": "Business",
    
    "entertainment": "Entertainment",
    "entame": "Entertainment",
    "media": "Entertainment",
    "youtube": "Entertainment",
    "video": "Entertainment",
    "music": "Entertainment",
    "gaming": "Entertainment",
    "games": "Entertainment",
    "social": "Entertainment",
    "sns": "Entertainment",
    
    "science": "Science",
    "academic": "Science",
    "research": "Science",
    "education": "Science",
    "study": "Science",
    "math": "Science",
    
    "sports": "Sports",
    "fitness": "Sports",
    "health": "Sports",
    "gym": "Sports",
    
    "travel": "Travel",
    "tourism": "Travel",
    "hotels": "Travel",
    "trip": "Travel",
    
    "other": "Other",
    "others": "Other",
    "misc": "Other",
    "miscellaneous": "Other",
    "etc": "Other"
  };
  
  if (categoryMapping[firstPart]) {
    curatedParts[0] = categoryMapping[firstPart];
  }
  
  return curatedParts.join("/");
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
    const backupName = `AI_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
    await savePattern(backupName, data);
    if (disconnected) return;

    // 2. 잠긴 폴더의 북마크는 제외
    const lockedFolderIds = new Set(
      data.folders.filter((f) => f.locked).map((f) => f.id)
    );
    const bookmarksToProcess = data.bookmarks.filter(
      (b) => !lockedFolderIds.has(b.folderId)
    );

    await logAIDebug(`[AI Organize] Reorganization process triggered. Total bookmarks: ${data.bookmarks.length}, processing: ${bookmarksToProcess.length}`);

    // 3. AI로 각 북마크의 폴더 판별 (배치 처리)
    const { moves, aiSuccessCount, aiTotalBatches, aiSupported } = await reorganizeWithAI(
      bookmarksToProcess,
      settings.maxFolderDepth,
      settings.keepExistingFolders ? data.folders : undefined
    );
    if (disconnected) return;

    // 4. 차이가 있는 것만 이동 (필요시 새 폴더 생성)
    const { moveBookmark, createFolder } = await import("@/shared/storage");
    let movedCount = 0;

    for (const [bookmarkId, catPath] of moves) {
      const existing = data.bookmarks.find((b) => b.id === bookmarkId);
      if (!existing) continue;

      const parts = catPath.split("/").map(p => p.trim()).filter(Boolean);
      if (parts.length === 0) continue;

      // 설정에 따른 최대 깊이 제한
      const allowedParts = parts.slice(0, settings.maxFolderDepth);

      let currentParentId: string | null = null;
      let targetFolderId = existing.folderId; // 기본값

      for (let i = 0; i < allowedParts.length; i++) {
        const partName = allowedParts[i];
        
        // 부모 ID 하위에서 이름으로 폴더 찾기 (대소문자 무시)
        let folder = data.folders.find(
          f => f.parentId === currentParentId && 
               (f.name.toLowerCase() === partName.toLowerCase() || 
                (f.nameJa && f.nameJa.toLowerCase() === partName.toLowerCase()))
        );

        if (!folder) {
          // 폴더가 없으면 새로 생성
          folder = await createFolder(partName, currentParentId, "Folder");
          // 로컬 데이터 배열에도 추가해 주어야 다음 파트가 찾을 수 있음
          data.folders.push(folder);
        }

        currentParentId = folder.id;
        targetFolderId = folder.id;
      }

      if (existing.folderId !== targetFolderId) {
        await moveBookmark(bookmarkId, targetFolderId);
        movedCount++;
      }
    }

    // 빈 폴더 정리 (기본 폴더, 잠긴 폴더 제외)
    // 데이터 갱신 후 다시 읽어오기
    const updatedData = await getAllData();
    const { deleteFolder } = await import("@/shared/storage");
    
    // 폴더 삭제 로직: 자식 폴더가 없고 북마크가 없는 폴더를 찾아서 삭제 (반복적으로 수행)
    let foldersDeleted = 0;
    let keepChecking = true;
    while(keepChecking) {
      keepChecking = false;
      const currentData = await getAllData();
      for (const folder of currentData.folders) {
        if (folder.isDefault || folder.locked) continue;
        
        const hasBookmarks = currentData.bookmarks.some(b => b.folderId === folder.id);
        const hasChildren = currentData.folders.some(f => f.parentId === folder.id);
        
        if (!hasBookmarks && !hasChildren) {
          await deleteFolder(folder.id);
          foldersDeleted++;
          keepChecking = true; // 삭제 후 트리가 변했으므로 다시 검사
          break; // 현재 for 루프 탈출 후 while 다시 시작
        }
      }
    }
    
    await logAIDebug(`[AI Organize] Complete. Moved bookmarks count: ${movedCount}. Deleted empty folders: ${foldersDeleted}`);

    // 5. 완료 결과를 포트로 전송
    send({
      type: "done",
      movedCount,
      total: bookmarksToProcess.length,
      backupName,
      aiSuccessCount,
      aiTotalBatches,
      aiSupported
    });
  } catch (err) {
    console.error("AI reorganize error:", err);
    await logAIDebug(`[AI Organize] Critical process exception: ${String(err)}`);
    send({ type: "error", error: String(err) });
  }
}

async function runAIReorganizeOtherViaPort(port: chrome.runtime.Port): Promise<void> {
  let disconnected = false;
  port.onDisconnect.addListener(() => { disconnected = true; });

  const send = (msg: object) => {
    if (disconnected) return;
    try { port.postMessage(msg); } catch (_) { }
  };

  try {
    send({ type: "running" });

    const data = await getAllData();
    if (disconnected) return;

    // Only process bookmarks currently in the 'other' folder
    const bookmarksToProcess = data.bookmarks.filter(b => b.folderId === DEFAULT_FOLDER_ID);
    if (bookmarksToProcess.length === 0) {
      send({ type: "done", movedCount: 0 });
      return;
    }

    const { getSettings } = await import("@/shared/storage");
    const settings = await getSettings();

    // Use existing folders as hint, excluding 'other'
    const existingFolders = data.folders.filter(f => f.id !== DEFAULT_FOLDER_ID);
    
    // Call AI function
    const { moves } = await reorganizeWithAI(bookmarksToProcess, settings.maxFolderDepth, existingFolders);
    if (disconnected) return;

    const { moveBookmark } = await import("@/shared/storage");
    let movedCount = 0;

    for (const [bookmarkId, catPath] of moves) {
      const existing = data.bookmarks.find(b => b.id === bookmarkId);
      if (!existing || existing.folderId !== DEFAULT_FOLDER_ID) continue;

      const parts = catPath.split("/").map(p => p.trim()).filter(Boolean);
      if (parts.length === 0) continue;

      // We ONLY move to existing folders. We do NOT create new ones.
      const topCategory = parts[0].toLowerCase();
      const match = existingFolders.find(f => 
        f.name.toLowerCase() === topCategory || 
        (f.nameJa && f.nameJa.toLowerCase() === topCategory)
      );

      if (match) {
        await moveBookmark(bookmarkId, match.id);
        movedCount++;
      }
    }

    send({ type: "done", movedCount });
  } catch (err) {
    console.error("AI reorganize other error:", err);
    send({ type: "error", error: String(err) });
  }
}

/**
 * AI + 도메인 룰 기반 재분류
 */
async function reorganizeWithAI(
  bookmarks: import("@/shared/types").Bookmark[],
  _maxFolderDepth = 3,
  existingFolders?: import("@/shared/types").Folder[]
): Promise<{
  moves: Map<string, string>;
  aiSuccessCount: number;
  aiTotalBatches: number;
  aiSupported: boolean;
}> {
  const result = new Map<string, string>();
  const stats = {
    moves: result,
    aiSuccessCount: 0,
    aiTotalBatches: 0,
    aiSupported: false
  };

  if (bookmarks.length === 0) return stats;

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

  const aiAvailable = await isAIAvailable();
  if (!aiAvailable) {
    await logAIDebug(`[AI Organize] AI is not available/enabled. Skipping AI and returning domain rules.`);
    return stats;
  }

  // ── Step 2: AI 세션 생성 시도 (실패해도 Step1 결과로 종료) ──
  const folderNames = existingFolders ? existingFolders.map((f) => f.nameJa || f.name) : [];
  const folderHint = folderNames.length > 0
    ? ` Try to use these existing folders if they fit: [${folderNames.join(", ")}]. If you must create a new one, make it a BROAD category, not a specific one.`
    : ` Create a few BROAD categories (e.g., "Gaming", "Development", "Finance"). Do NOT create micro-categories.`;

  let session: { prompt: (s: string) => Promise<string>; destroy: () => void } | null = null;
  try {
    const lm = await getAIModel();
    if (lm && typeof lm.create === "function") {
      session = await withTimeout(
        (lm.create as (opts?: unknown) => Promise<typeof session>)(),
        15000
      );
    }
  } catch (err) {
    await logAIDebug(`[AI Organize] AI session creation failed. Falling back to domain rules. Error: ${String(err)}`);
    return stats; // Step1 결과 그대로 반환 (aiSupported = false)
  }

  if (!session) {
    await logAIDebug(`[AI Organize] AI model is unavailable. Falling back to domain rules.`);
    return stats;
  }

  stats.aiSupported = true;

  // ── Step 3: AI로 10개씩 배치 처리 → 성공 시 결과 덮어쓰기 ──
  const BATCH_SIZE = 10;
  const totalBatches = Math.ceil(bookmarks.length / BATCH_SIZE);
  stats.aiTotalBatches = totalBatches;

  for (let i = 0; i < bookmarks.length; i += BATCH_SIZE) {
    const batch = bookmarks.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    
    try {
      const lines = batch
        .map((bm, idx) => `${idx + 1}. ${bm.title} | ${bm.url}`)
        .join("\n");

      const promptText = `System: You are a strict data categorization API. You group bookmarks into broad categories. You output ONLY a JSON object mapping the input number to the category name. No markdown, no conversational text.

Task: Categorize the following bookmarks into a hierarchy.
${folderHint}
CRITICAL: Do NOT create a unique category for every site. Group similar sites together. You can create subfolders using a slash (/). Example: "Technology/AI" or "Entertainment/Gaming".
You MUST output ONLY a valid JSON object mapping the input number to the category name.

Example:
Input:
1. GitHub | https://github.com
2. OpenAI | https://openai.com
Output:
{"1": "Technology/Development", "2": "Technology/AI"}

Input:
${lines}
Output:`;

      await logAIDebug(`[AI Organize] Batch ${batchNum}/${totalBatches} sending. Bookmarks in batch: ${batch.length}`);

      // 배치당 최대 60초 (충분한 시간 부여)
      const response = await withTimeout(session.prompt(promptText), 60000);
      
      const parsed = robustParseJSON(response);
      if (parsed) {
        let appliedInBatch = 0;
        for (let j = 0; j < batch.length; j++) {
          const rawCat = parsed[String(j + 1)];
          if (rawCat && typeof rawCat === "string" && rawCat.trim().length > 0) {
            const curated = curateCategoryPath(rawCat);
            if (curated && curated.toLowerCase() !== "other") {
              result.set(batch[j].id, curated);
              appliedInBatch++;
            }
          }
        }
        stats.aiSuccessCount++;
        await logAIDebug(`[AI Organize] Batch ${batchNum}/${totalBatches} parsed successfully. Mapped ${appliedInBatch}/${batch.length} bookmarks. Response: "${response.substring(0, 150).replace(/\n/g, " ")}..."`);
      } else {
        await logAIDebug(`[AI Organize] Batch ${batchNum}/${totalBatches} response parsing failed. Raw response: "${response.substring(0, 300).replace(/\n/g, " ")}..."`);
      }
    } catch (err) {
      await logAIDebug(`[AI Organize] Batch ${batchNum}/${totalBatches} failed with error: ${String(err)}`);
    }
  }

  session.destroy();
  return stats;
}

// ── Feature 2: Highlight Context-Menu Snip & Refinement ──────

async function clipSelection(selectionText: string | undefined, tab?: chrome.tabs.Tab) {
  if (!selectionText || !selectionText.trim()) return;
  if (!tab || !tab.id) {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    tab = activeTab;
  }
  if (!tab || !tab.id || !tab.url) return;

  try {
    const { bookmark, isNew } = await saveTabForClipping(tab);
    
    const { getMemos, saveMemo } = await import("@/shared/storage");
    const memos = await getMemos();
    const existingMemo = memos[bookmark.id];
    let content = `• ${selectionText.trim()}`;
    if (existingMemo && existingMemo.content) {
      content = `${existingMemo.content}\n• ${selectionText.trim()}`;
    }
    
    // Save raw snippet first
    await saveMemo(bookmark.id, content, "purple");

    const lang = await getEffectiveLanguage();
    
    const aiEnabled = await isAIAvailable();
    if (aiEnabled) {
      // Inject "Saved Highlight! AI refining note..." toast
      await injectToast(tab.id, "toastHighlightSaved");

      const refined = await refineMemoDraft(content, lang);
      if (refined.aiUsed && refined.draft) {
        await saveMemo(bookmark.id, refined.draft, "purple");
        // Inject "AI refined your clipping note!" toast
        await injectToast(tab.id, "toastHighlightRefined");
      } else {
        await injectToast(tab.id, "toastHighlightRefineFailed");
      }
    } else {
      await injectToast(tab.id, "toastHighlightRefineFailed");
    }
  } catch (err) {
    console.error("Failed to clip selection:", err);
  }
}

async function saveTabForClipping(tab: chrome.tabs.Tab): Promise<{ bookmark: Bookmark; isNew: boolean }> {
  if (!tab.url) {
    throw new Error("Could not get tab URL");
  }
  if (!tab.url.startsWith("http://") && !tab.url.startsWith("https://")) {
    throw new Error("Only http/https URLs can be saved");
  }

  const existing = await getBookmarks();
  const found = existing.find((b) => b.url === tab.url);
  if (found) {
    return { bookmark: found, isNew: false };
  }

  const url = new URL(tab.url);
  const domain = url.hostname;
  const { folderId } = await categorize(tab.url, tab.title ?? "", domain);
  const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

  let description = "";
  let rawText = "";
  let readableContent = "";

  try {
    const [injectionResult] = await chrome.scripting.executeScript({
      target: { tabId: tab.id! },
      func: scrapePageContent
    });
    if (injectionResult?.result) {
      const res = injectionResult.result as { description: string; rawText: string; readableContent: string };
      description = res.description;
      rawText = res.rawText;
      readableContent = res.readableContent;
    }
  } catch (err) {
    console.warn("Scraping failed inside saveTabForClipping:", err);
  }

  const bookmark: Bookmark = {
    id: crypto.randomUUID(),
    url: tab.url,
    title: tab.title ?? tab.url ?? "Untitled",
    favicon,
    folderId,
    domain,
    visitCount: 0,
    savedAt: Date.now(),
  };

  await addBookmark(bookmark);

  // Run AI summary, tags generation, and page content saving asynchronously in the background
  (async () => {
    try {
      if (rawText || readableContent) {
        const { savePageContent } = await import("@/shared/storage");
        await savePageContent(bookmark.id, rawText, readableContent);
      }

      const { generateSummaryAndTags } = await import("@/shared/categorizer");
      const aiData = await generateSummaryAndTags(tab.url, tab.title ?? "", description || readableContent.slice(0, 300));
      if (aiData && (aiData.summary || aiData.tags)) {
        const { updateBookmark } = await import("@/shared/storage");
        await updateBookmark(bookmark.id, {
          summary: aiData.summary,
          tags: aiData.tags,
        });
      }
    } catch (err) {
      console.warn("Background processes failed for saveTabForClipping:", err);
    }
  })();

  return { bookmark, isNew: true };
}

async function injectToast(tabId: number, localeKey: string, replacement?: string) {
  try {
    const lang = await getEffectiveLanguage();
    const dict = DICT[lang] ?? DICT.en;
    let message = dict[localeKey as keyof typeof DICT.en] ?? dict.toastHighlightSaved;
    if (replacement) {
      message = message.replace("{domain}", replacement);
    }

    await chrome.scripting.executeScript({
      target: { tabId },
      args: [message],
      func: (msg) => {
        let toast = document.getElementById("clickbook-snip-toast");
        if (!toast) {
          toast = document.createElement("div");
          toast.id = "clickbook-snip-toast";
          
          Object.assign(toast.style, {
            position: "fixed",
            bottom: "24px",
            right: "24px",
            backgroundColor: "rgba(15, 12, 30, 0.85)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(139, 92, 246, 0.4)",
            boxShadow: "0 10px 30px -3px rgba(139, 92, 246, 0.25), 0 4px 6px -2px rgba(139, 92, 246, 0.1)",
            borderRadius: "12px",
            padding: "14px 20px",
            color: "#ffffff",
            fontSize: "14px",
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontWeight: "500",
            zIndex: "999999999",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
            transform: "translateY(100px) scale(0.9)",
            opacity: "0",
          });

          const icon = document.createElement("div");
          icon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>`;
          toast.appendChild(icon);

          const textSpan = document.createElement("span");
          textSpan.id = "clickbook-snip-toast-text";
          toast.appendChild(textSpan);

          document.body.appendChild(toast);
        }

        const textSpan = toast.querySelector("#clickbook-snip-toast-text");
        if (textSpan) {
          textSpan.textContent = msg;
        }

        setTimeout(() => {
          if (toast) {
            toast.style.transform = "translateY(0) scale(1)";
            toast.style.opacity = "1";
          }
        }, 10);

        const timeoutId = (toast as any)._timeoutId;
        if (timeoutId) clearTimeout(timeoutId);

        (toast as any)._timeoutId = setTimeout(() => {
          if (toast) {
            toast.style.transform = "translateY(50px) scale(0.95)";
            toast.style.opacity = "0";
            setTimeout(() => {
              toast?.remove();
            }, 400);
          }
        }, 4000);
      }
    });
  } catch (err) {
    console.warn("Failed to inject toast:", err);
  }
}

function scrapePageContent(): { description: string; rawText: string; readableContent: string } {
  const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute("content") || "";

  // Helper to check if element is visible
  function isVisible(el: HTMLElement): boolean {
    if (!el.offsetParent && el.tagName.toLowerCase() !== "body") return false;
    const style = window.getComputedStyle(el);
    return style.display !== "none" && style.visibility !== "hidden" && !el.hasAttribute("hidden");
  }

  // Clone document body
  const clone = document.body.cloneNode(true) as HTMLElement;
  const originalElements = Array.from(document.body.querySelectorAll("*")) as HTMLElement[];
  const cloneElements = Array.from(clone.querySelectorAll("*")) as HTMLElement[];

  // Remove invisible and blacklisted tags from clone
  const tagsToRemove = ["script", "style", "head", "nav", "footer", "header", "form", "iframe", "noscript", "svg", "button", "aside"];
  
  // Since querySelectorAll('*') returns elements in the same order, we can map clone elements to original elements
  for (let i = 0; i < cloneElements.length; i++) {
    const cloneEl = cloneElements[i];
    const origEl = originalElements[i];
    const tagName = cloneEl.tagName.toLowerCase();
    
    if (tagsToRemove.includes(tagName)) {
      cloneEl.remove();
    } else if (origEl && !isVisible(origEl)) {
      cloneEl.remove();
    }
  }

  // Extract raw text for indexing (FTS)
  const rawTextFull = clone.innerText || clone.textContent || "";
  const words = rawTextFull
    .toLowerCase()
    .replace(/[^\w\s\uac00-\ud7a3\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, " ") // English, Korean, Japanese, Chinese characters
    .split(/\s+/)
    .filter(w => w.length > 1);
  const rawText = words.slice(0, 10000).join(" "); // Cap at 10,000 words

  // Extract readable markdown-like content
  let readableMarkdown = "";
  const traverse = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        readableMarkdown += text + " ";
      }
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const el = node as HTMLElement;
    const tagName = el.tagName.toLowerCase();

    if (["h1", "h2", "h3", "h4", "h5", "h6"].includes(tagName)) {
      const level = tagName[1];
      const hashes = "#".repeat(parseInt(level, 10));
      readableMarkdown += `\n\n${hashes} ${el.textContent?.trim()}\n\n`;
    } else if (tagName === "p") {
      readableMarkdown += `\n\n${el.textContent?.trim()}\n\n`;
    } else if (tagName === "li") {
      readableMarkdown += `\n- ${el.textContent?.trim()}\n`;
    } else if (tagName === "pre" || tagName === "code") {
      readableMarkdown += `\n\`\`\`\n${el.textContent?.trim()}\n\`\`\`\n`;
    } else if (tagName === "br") {
      readableMarkdown += "\n";
    } else {
      // Traverse children
      for (const child of Array.from(node.childNodes)) {
        traverse(child);
      }
    }
  };

  traverse(clone);

  // Post-process markdown (collapse multiple empty lines)
  let readableContent = readableMarkdown
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();

  // Cap readable content to 50,000 chars
  if (readableContent.length > 50000) {
    readableContent = readableContent.slice(0, 50000) + "\n\n...[Truncated for offline reader]";
  }

  return {
    description: metaDesc,
    rawText,
    readableContent: readableContent || rawTextFull.slice(0, 1000).trim()
  };
}
