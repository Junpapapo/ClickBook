import type { Message, MessageResponse } from "@/shared/types";
import { recommendSites, expandSearchQuery } from "@/shared/categorizer";
import { getBookmarks, getAllData, runGarbageCollector } from "@/shared/storage";

import { updateBadgeCount } from "./todo-service";
import { checkAndSetSecureTabIndicator, checkIsDomainSecure } from "./security-service";
import { suspendTab, suspendAllInactive, unsuspendAll, getSuspendCount } from "./suspend-service";
import { 
  saveActiveTab, 
  bulkImport, 
  syncToChrome, 
  restoreFromSnapshot, 
  flattenChromeTree, 
  saveChromeSyncBaseline, 
  addNewBookmarkWithAI, 
  saveTabGroupAsFolder, 
  openFolderAsTabGroup, 
  loadChromePattern 
} from "./bookmark-sync-service";
import { updateGCAlarm } from "./helpers/alarm-helper";

export async function handleMessage(message: Message): Promise<MessageResponse> {
  switch (message.type) {
    case "SAVE_TAB":
      return await saveActiveTab();
    case "GET_BOOKMARKS": {
      return { success: true, data: await getBookmarks() };
    }
    case "GET_ALL_DATA": {
      return { success: true, data: await getAllData() };
    }
    case "DELETE_BOOKMARK": {
      const { deleteBookmark } = await import("@/shared/storage");
      await deleteBookmark(message.id);
      try {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (activeTab && activeTab.id) await checkAndSetSecureTabIndicator(activeTab.id, activeTab.url);
      } catch (e) {}
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
      return await addNewBookmarkWithAI(message.url, message.title, message.folderId);
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
      if (!snapshot) return { success: false, error: "No snapshot found" };
      await restoreFromSnapshot(snapshot);
      return { success: true };
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
      const afterImport = await getAllData();
      await saveChromeSyncBaseline(afterImport.bookmarks);
      return { success: true, data: { count } };
    }
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
      return await loadChromePattern(message.id);
    }
    case "DELETE_CHROME_PATTERN": {
      const { deleteChromePattern } = await import("@/shared/storage");
      await deleteChromePattern(message.id);
      return { success: true };
    }
    case "SYNC_TO_CHROME": {
      const data = await getAllData();
      const result = await syncToChrome(data);
      return { success: true, data: result };
    }
    case "GET_SETTINGS": {
      const { getSettings } = await import("@/shared/storage");
      return { success: true, data: await getSettings() };
    }
    case "SAVE_SETTINGS": {
      const { saveSettings } = await import("@/shared/storage");
      await saveSettings(message.settings);
      if (message.settings.gcInterval !== undefined) {
        await updateGCAlarm(message.settings.gcInterval);
      }
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
      const sites = await recommendSites(message.keyword, message.count ?? 6);
      return { success: true, data: sites };
    }
    case "EXPAND_SEARCH": {
      const keywords = await expandSearchQuery(message.query);
      return { success: true, data: keywords };
    }
    case "FACTORY_RESET": {
      // For factory reset, we might want to clear alarms, clear storage and reinitialize.
      // To avoid circular dependencies with initializeBackground, we can trigger it by returning
      // a flag or we can trigger it dynamically.
      // However, we can also perform factoryReset operations directly.
      const { factoryReset } = await import("@/shared/storage");
      await factoryReset();
      await chrome.alarms.clearAll();
      await chrome.storage.session.clear();
      // Since initializeBackground is in service-worker, we return a special status
      // so service-worker knows it should re-run initializeBackground.
      return { success: true, _shouldReinit: true };
    }
    case "GET_CHROME_TAB_GROUPS": {
      const groups = await chrome.tabGroups.query({});
      return { success: true, data: groups };
    }
    case "SAVE_TAB_GROUP_AS_FOLDER": {
      return await saveTabGroupAsFolder(message.groupId, message.name);
    }
    case "OPEN_FOLDER_AS_TAB_GROUP": {
      return await openFolderAsTabGroup(message.folderId);
    }
    case "TOGGLE_FOLDER_SECURE": {
      const { toggleFolderSecure } = await import("@/shared/storage");
      await toggleFolderSecure(message.id);
      return { success: true };
    }
    case "UPDATE_AI_INFO": {
      const { updateBookmark } = await import("@/shared/storage");
      await updateBookmark(message.id, { title: message.title, url: message.url });
      return { success: true };
    }
    case "GET_TODO_BOARD": {
      const { getTodoBoard } = await import("@/shared/storage");
      return { success: true, data: await getTodoBoard() };
    }
    case "SAVE_TODO_BOARD": {
      const { saveTodoBoard } = await import("@/shared/storage");
      await saveTodoBoard(message.data);
      await updateBadgeCount(message.data);
      return { success: true };
    }
    case "SUSPEND_TAB": {
      return await suspendTab(message.tabId);
    }
    case "SUSPEND_ALL_INACTIVE": {
      return await suspendAllInactive();
    }
    case "UNSUSPEND_ALL": {
      return await unsuspendAll();
    }
    case "GET_SUSPEND_COUNT": {
      return await getSuspendCount();
    }
    case "GET_PAGE_CONTENTS": {
      const { getPageContents } = await import("@/shared/storage");
      return { success: true, data: await getPageContents() };
    }
    case "GET_PAGE_CONTENT": {
      const { getPageContent } = await import("@/shared/storage");
      return { success: true, data: await getPageContent(message.bookmarkId) };
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
    case "RUN_GARBAGE_COLLECTOR": {
      await runGarbageCollector();
      return { success: true };
    }
    case "GET_ORPHANED_STATS": {
      const { getOrphanedContentStats } = await import("@/shared/storage");
      return { success: true, data: await getOrphanedContentStats() };
    }
    case "CHECK_DOMAIN_SECURE": {
      const isSecure = await checkIsDomainSecure(message.url);
      return { success: true, isSecure };
    }
    case "PRELOAD_AI": {
      const { preloadAIModel } = await import("@/shared/categorizer/ai-service");
      preloadAIModel().catch(err => console.warn("[AI Preload Error in Router]:", err));
      return { success: true };
    }
    default:
      return { success: false, error: "Unknown message type" };
  }
}
