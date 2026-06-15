import type { MessageResponse } from "@/shared/types";
import { injectToast } from "./helpers/toast-helper";

// Tab cache for Privacy-First Session Sweeper
export async function initializeTabCache(): Promise<void> {
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

export async function handleTabClosed(closedUrl: string): Promise<void> {
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
  let domainStillOpen = false;
  const openTabs = await chrome.tabs.query({});
  for (const tab of openTabs) {
    if (tab.url) {
      try {
        const u = new URL(tab.url);
        if (u.hostname === closedDomain) {
          domainStillOpen = true;
          break;
        }
      } catch (e) {}
    }
  }

  if (domainStillOpen) return;

  // ── [개인정보 보호 극대화: 보안 폴더 기반 세션 자동 파쇄] ──
  const { getAllData } = await import("@/shared/storage");
  const data = await getAllData();
  const secureFolders = data.folders.filter(f => f.secure === true);
  if (secureFolders.length === 0) return;

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
      await chrome.browsingData.remove(
        { origins: [closedOrigin] },
        {
          cache: true,
          cookies: true,
          fileSystems: true,
          indexedDB: true,
          localStorage: true,
          serviceWorkers: true,
          webSQL: true
        }
      );
      console.log(`[Privacy-First Session Sweeper] Successfully shredded and cleared browsing session data for secure origin: ${closedDomain}`);

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
export async function trackTabAccessed(tabId: number): Promise<void> {
  try {
    const now = Date.now();
    const res = await chrome.storage.session.get(["tabLastAccessed", "lastSuspendCheckTime"]);
    const lastAccessedMap = res.tabLastAccessed || {};
    const lastCheck = res.lastSuspendCheckTime || 0;
    
    lastAccessedMap[String(tabId)] = now;
    
    const sessionUpdate: Record<string, any> = { tabLastAccessed: lastAccessedMap };
    
    let runCheck = false;
    if (now - lastCheck >= 30000) {
      sessionUpdate.lastSuspendCheckTime = now;
      runCheck = true;
    }
    
    await chrome.storage.session.set(sessionUpdate);
    
    if (runCheck) {
      await checkAndAutoSuspend(now, lastAccessedMap);
    }
  } catch (e) {
    console.warn("Failed to track tab access:", e);
  }
}

export async function checkAndAutoSuspend(now: number, lastAccessedMap: Record<string, number>): Promise<void> {
  try {
    const settings = await chrome.storage.local.get("clickbook_auto_suspend_time");
    const autoSuspendTime = settings.clickbook_auto_suspend_time || 0;
    if (autoSuspendTime <= 0) return;

    const tabs = await chrome.tabs.query({});
    const thresholdMs = autoSuspendTime * 60 * 1000;
    let mapChanged = false;

    for (const tab of tabs) {
      if (!tab.id || tab.active || tab.pinned || tab.audible) continue;
      if (!tab.url || (!tab.url.startsWith("http://") && !tab.url.startsWith("https://"))) continue;
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

export async function suspendTab(tabId: number): Promise<MessageResponse> {
  const tab = await chrome.tabs.get(tabId);
  if (tab && tab.url && !tab.url.includes("suspend.html")) {
    const suspendUrl = chrome.runtime.getURL(`suspend.html?url=${encodeURIComponent(tab.url)}&title=${encodeURIComponent(tab.title || '')}&favicon=${encodeURIComponent(tab.favIconUrl || '')}`);
    await chrome.tabs.update(tabId, { url: suspendUrl });
  }
  return { success: true };
}

export async function suspendAllInactive(): Promise<MessageResponse> {
  const tabs = await chrome.tabs.query({});
  let count = 0;
  for (const tab of tabs) {
    if (tab.id && !tab.active && !tab.pinned && !tab.audible && tab.url && (tab.url.startsWith("http://") || tab.url.startsWith("https://")) && !tab.url.includes("suspend.html")) {
      const suspendUrl = chrome.runtime.getURL(`suspend.html?url=${encodeURIComponent(tab.url)}&title=${encodeURIComponent(tab.title || '')}&favicon=${encodeURIComponent(tab.favIconUrl || '')}`);
      await chrome.tabs.update(tab.id, { url: suspendUrl });
      count++;
    }
  }
  return { success: true, data: { count } };
}

export async function unsuspendAll(): Promise<MessageResponse> {
  const tabs = await chrome.tabs.query({});
  let count = 0;
  for (const tab of tabs) {
    if (tab.id && tab.url && tab.url.includes("suspend.html")) {
      try {
        const urlObj = new URL(tab.url);
        const originalUrl = urlObj.searchParams.get("url");
        if (originalUrl) {
          await chrome.tabs.update(tab.id, { url: originalUrl });
          count++;
        }
      } catch (e) {}
    }
  }
  return { success: true, data: { count } };
}

export async function getSuspendCount(): Promise<MessageResponse> {
  const tabs = await chrome.tabs.query({});
  const suspended = tabs.filter(t => t.url && t.url.includes("suspend.html")).length;
  return { success: true, data: { count: suspended } };
}
