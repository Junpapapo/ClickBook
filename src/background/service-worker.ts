import type { Message, MessageResponse } from "@/shared/types";
import { migratePageContents, runGarbageCollector } from "@/shared/storage";

import { updateBadgeCount, checkTodoReminders } from "./services/todo-service";
import { checkAndSetSecureTabIndicator, checkIsDomainSecure } from "./services/security-service";
import { initializeTabCache, handleTabClosed, trackTabAccessed } from "./services/suspend-service";
import { runAutoTagViaPort, runAIReorganizeViaPort, runAIReorganizeOtherViaPort } from "./services/ai-port-service";
import { saveActiveTab } from "./services/bookmark-sync-service";
import { clipSelection } from "./services/clip-service";
import { updateGCAlarm } from "./services/helpers/alarm-helper";
import { handleMessage } from "./services/message-router";
import { syncDeclarativeRules, setupAdBlockRulesSyncAlarm, updateEasyListRules } from "./services/adblock";


// ============================================================
// Service Worker — Chrome MV3 Background (Entry & Router)
// ============================================================

// 키보드숏컷: Alt+S 로 현재 활성 탭 저장
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

// 백그라운드 구동 시 1회성 초기화 및 마이그레이션 작업
async function initializeBackground() {
  await initializeTabCache();

  try {
    await migratePageContents();
  } catch (err) {
    console.warn("Failed during migratePageContents:", err);
  }

  try {
    const { getSettings } = await import("@/shared/storage");
    const settings = await getSettings();
    const interval = settings.gcInterval ?? "daily";

    const existingAlarm = await chrome.alarms.get("clickbook-gc-alarm");
    if (interval === "off") {
      if (existingAlarm) {
        await chrome.alarms.clear("clickbook-gc-alarm");
      }
    } else {
      const periodInMinutes = interval === "weekly" ? 10080 : 1440;
      if (!existingAlarm || existingAlarm.periodInMinutes !== periodInMinutes) {
        await chrome.alarms.clear("clickbook-gc-alarm");
        await chrome.alarms.create("clickbook-gc-alarm", {
          delayInMinutes: existingAlarm ? 1440 : 5,
          periodInMinutes
        });
      }
    }
  } catch (err) {
    console.warn("Failed to register GC alarm:", err);
  }

  try {
    const { getTodoBoard } = await import("@/shared/storage");
    const todoBoard = await getTodoBoard();
    await updateBadgeCount(todoBoard);
  } catch (err) {
    console.warn("Failed to initialize badge count:", err);
  }

  try {
    const existingAlarm = await chrome.alarms.get("clickbook-todo-reminder-alarm");
    if (!existingAlarm) {
      await chrome.alarms.create("clickbook-todo-reminder-alarm", {
        delayInMinutes: 1,
        periodInMinutes: 1
      });
      console.log("[Todo Alarm] Registered clickbook-todo-reminder-alarm (1 min)");
    }
  } catch (err) {
    console.warn("Failed to register todo reminder alarm:", err);
  }

  // AI 모델 웜업 (Preload)
  try {
    const { preloadAIModel } = await import("@/shared/categorizer/ai-service");
    preloadAIModel().catch((err) => console.warn("[AI Preload in initBackground Failed]:", err));
  } catch (err) {
    console.warn("Failed to load preloadAIModel in background init:", err);
  }

  // AdBlock DNR rules initialization
  try {
    await syncDeclarativeRules();
    await setupAdBlockRulesSyncAlarm();
  } catch (err) {
    console.warn("Failed to sync declarative rules on init:", err);
  }
}

// Initialize on startup
initializeBackground().catch(err => {
  console.error("Critical error during background initialization:", err);
});

// 알람 이벤트 리스너 등록
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "clickbook-gc-alarm") {
    try {
      await runGarbageCollector();
    } catch (err) {
      console.warn("Garbage collection failed in alarm listener:", err);
    }
  } else if (alarm.name === "clickbook-todo-reminder-alarm") {
    await checkTodoReminders();
  } else if (alarm.name === "clickbook-adblock-update-alarm") {
    try {
      await updateEasyListRules();
    } catch (err) {
      console.warn("Adblock rules update alarm failed:", err);
    }
  }
});

// 크롬 탭 생성, 갱신, 삭제, 활성화 리스너
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

    await checkAndSetSecureTabIndicator(tabId, changeInfo.url);
  }
  
  if (changeInfo.status === "complete") {
    if (tab.active) {
      await trackTabAccessed(tabId);
    }

    if (tab.url) {
      const isSecure = await checkIsDomainSecure(tab.url);
      if (isSecure) {
        const { injectToast } = await import("./services/helpers/toast-helper");
        await injectToast(tabId, "secureSessionActiveToast");
      }
    }
  }
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  try {
    const res = await chrome.storage.session.get("tabUrls");
    const tabMap = res.tabUrls || {};
    const closedUrl = tabMap[String(tabId)];

    const accessRes = await chrome.storage.session.get("tabLastAccessed");
    const lastAccessedMap = accessRes.tabLastAccessed || {};
    if (lastAccessedMap[String(tabId)]) {
      delete lastAccessedMap[String(tabId)];
      await chrome.storage.session.set({ tabLastAccessed: lastAccessedMap });
    }

    if (!closedUrl) return;

    delete tabMap[String(tabId)];
    await chrome.storage.session.set({ tabUrls: tabMap });

    await handleTabClosed(closedUrl);
  } catch (e) {
    console.warn("Failed to handle tab remove:", e);
  }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await trackTabAccessed(activeInfo.tabId);

  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    await checkAndSetSecureTabIndicator(activeInfo.tabId, tab.url);

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

// 포트 기반 장기 연결 리스너
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "ai-reorganize") {
    runAIReorganizeViaPort(port);
  } else if (port.name === "ai-reorganize-other") {
    runAIReorganizeOtherViaPort(port);
  } else if (port.name === "auto-tag") {
    runAutoTagViaPort(port);
  }
});

// 메시지 핸들러
chrome.runtime.onMessage.addListener(
  (message: Message, sender, sendResponse) => {
    handleMessage(message, sender)
      .then(async (response) => {
        if (response.success && (response as any)._shouldReinit) {
          try {
            await initializeBackground();
          } catch (e) {
            console.warn("Failed to reinitialize background after factory reset:", e);
          }
        }
        sendResponse(response);
      })
      .catch((err) =>
        sendResponse({ success: false, error: String(err) } satisfies MessageResponse)
      );
    return true;
  }
);
