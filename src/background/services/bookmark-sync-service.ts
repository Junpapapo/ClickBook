import type { Bookmark, Folder, StorageData, MessageResponse } from "@/shared/types";
import { getBookmarks, addBookmark } from "@/shared/storage";
import { checkAndSetSecureTabIndicator } from "./security-service";
import { categorize } from "@/shared/categorizer";
import { getEffectiveLanguage } from "./helpers/lang-helper";
import { getLocalizedFolderName } from "@/shared/categories";

const CHROME_SYNC_KEY = "clickbook_chrome_last_sync";

export async function saveActiveTab(): Promise<MessageResponse> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab) {
    return { success: false, error: "No active tab found" };
  }
  if (!tab.url) {
    return { success: false, error: "Could not get tab URL" };
  }
  if (!tab.url.startsWith("http://") && !tab.url.startsWith("https://")) {
    return { success: false, error: "Only http/https URLs can be saved" };
  }

  const url = new URL(tab.url);
  const domain = url.hostname;

  const folderId = "other";
  const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  const bookmarkId = crypto.randomUUID();

  const bookmark: Bookmark = {
    id: bookmarkId,
    url: tab.url,
    title: tab.title ?? tab.url ?? "Untitled",
    favicon,
    ogpImage: undefined,
    folderId,
    domain,
    visitCount: 0,
    savedAt: Date.now(),
  };

  const { saveBookmarkTransaction, getFolders } = await import("@/shared/storage");
  const { folder, isDuplicate } = await saveBookmarkTransaction(bookmark);

  if (isDuplicate) {
    return { success: false, error: "URL already saved", isDuplicate: true };
  }

  try {
    if (tab.id && tab.url) {
      await checkAndSetSecureTabIndicator(tab.id, tab.url);
    }
  } catch(e) {}

  (async () => {
    try {
      let description = "";
      let rawText = "";
      let readableContent = "";

      try {
        const injectPromise = chrome.scripting.executeScript({
          target: { tabId: tab.id! },
          func: scrapePageContent
        });
        const [injectionResult] = await Promise.race([
          injectPromise,
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Scraping timeout")), 3000))
        ]) as any;

        if (injectionResult?.result) {
          const res = injectionResult.result as { description: string; rawText: string; readableContent: string };
          description = res.description;
          rawText = res.rawText;
          readableContent = res.readableContent;
        }
      } catch (err) {
        console.warn("Background scraping failed or timed out:", err);
      }

      if (rawText || readableContent) {
        const { savePageContent } = await import("@/shared/storage");
        await savePageContent(bookmarkId, rawText, readableContent);
      }

      const folders = await getFolders();
      const classifyResult = await categorize(tab.url!, tab.title ?? "", domain, folders);
      
      let finalFolderId = "other";
      let folderChanged = false;
      if (classifyResult && classifyResult.folderId !== "other") {
        finalFolderId = classifyResult.folderId;
        folderChanged = true;
      }

      const { generateSummaryAndTags } = await import("@/shared/categorizer");
      const aiData = await generateSummaryAndTags(
        tab.url!,
        tab.title ?? "",
        description || readableContent.slice(0, 300)
      );

      const updates: { folderId?: string; summary?: string; tags?: string[] } = {};
      if (folderChanged) {
        updates.folderId = finalFolderId;
      }
      if (aiData && (aiData.summary || aiData.tags)) {
        if (aiData.summary) updates.summary = aiData.summary;
        if (aiData.tags) updates.tags = aiData.tags;
      }

      if (Object.keys(updates).length > 0) {
        const { updateBookmark } = await import("@/shared/storage");
        await updateBookmark(bookmarkId, updates);

        try {
          const { getFolderById, getLocalizedFolderName } = await import("@/shared/categories");
          const updatedFolder = await getFolderById(finalFolderId);
          const lang = await getEffectiveLanguage();
          chrome.runtime.sendMessage({
            type: "BOOKMARK_AI_UPDATED",
            bookmarkId,
            folderName: updatedFolder ? getLocalizedFolderName(updatedFolder, lang) : finalFolderId,
            method: classifyResult ? classifyResult.method : "fallback",
            summary: aiData?.summary,
            tags: aiData?.tags
          });
        } catch (e) {
        }
      }
    } catch (err) {
      console.warn("Background processes failed for saveActiveTab:", err);
    }
  })();

  return { success: true, data: { bookmark, folderName: folder.name, method: "rules" } };
}

export async function addNewBookmarkWithAI(url: string, title: string, folderId: string): Promise<MessageResponse> {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return { success: false, error: "Please enter an http/https URL" };
  }
  const parsedUrl = new URL(url);
  const domain = parsedUrl.hostname;
  const bookmarkId = crypto.randomUUID();
  
  const bookmark: Bookmark = {
    id: bookmarkId,
    url,
    title: title || url,
    favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
    folderId,
    domain,
    visitCount: 0,
    savedAt: Date.now(),
  };

  const { saveBookmarkTransaction } = await import("@/shared/storage");
  const { isDuplicate } = await saveBookmarkTransaction(bookmark);
  if (isDuplicate) {
    return { success: false, error: "This URL is already registered", isDuplicate: true };
  }

  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab && activeTab.id && activeTab.url === url) {
      await checkAndSetSecureTabIndicator(activeTab.id, activeTab.url);
    }
  } catch (e) {}

  (async () => {
    try {
      const { generateSummaryAndTags } = await import("@/shared/categorizer");
      const aiData = await generateSummaryAndTags(url, title || url, "");
      if (aiData && (aiData.summary || aiData.tags)) {
        const { updateBookmark } = await import("@/shared/storage");
        await updateBookmark(bookmarkId, {
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

export function flattenChromeTree(
  nodes: chrome.bookmarks.BookmarkTreeNode[]
): Array<{ url: string; title: string }> {
  const result: Array<{ url: string; title: string }> = [];
  for (const n of nodes) {
    if (n.url) result.push({ url: n.url, title: n.title });
    if (n.children) result.push(...flattenChromeTree(n.children));
  }
  return result;
}

export async function bulkImport(
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
    const folderId = fixedFolderId ?? "other";

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
    const { addBookmarks, getFolders } = await import("@/shared/storage");
    await addBookmarks(newBookmarks);

    (async () => {
      try {
        const folders = await getFolders();
        const { categorize, generateSummaryAndTags } = await import("@/shared/categorizer");
        const { updateBookmark } = await import("@/shared/storage");

        console.log(`[Background AI Bulk] Starting background processing for ${newBookmarks.length} bookmarks...`);

        for (const bm of newBookmarks) {
          try {
            const classifyResult = await categorize(bm.url, bm.title, bm.domain, folders);
            let finalFolderId = bm.folderId;
            let folderChanged = false;
            if (classifyResult && classifyResult.folderId !== bm.folderId) {
              finalFolderId = classifyResult.folderId;
              folderChanged = true;
            }

            const aiData = await generateSummaryAndTags(bm.url, bm.title, "");

            const updates: { folderId?: string; summary?: string; tags?: string[] } = {};
            if (folderChanged) {
              updates.folderId = finalFolderId;
            }
            if (aiData && (aiData.summary || aiData.tags)) {
              if (aiData.summary) updates.summary = aiData.summary;
              if (aiData.tags) updates.tags = aiData.tags;
            }

            if (Object.keys(updates).length > 0) {
              await updateBookmark(bm.id, updates);
            }
          } catch (itemErr) {
            console.warn(`[Background AI Bulk] Failed for bookmark "${bm.title}":`, itemErr);
          }
        }
        console.log(`[Background AI Bulk] Finished background processing for ${newBookmarks.length} bookmarks.`);
      } catch (err) {
        console.error("[Background AI Bulk] Critical error in bulk processing chain:", err);
      }
    })();
  }
  return newBookmarks.length;
}

export async function getChromeSyncBaseline(): Promise<Array<{ url: string; title: string }>> {
  const result = await chrome.storage.local.get(CHROME_SYNC_KEY);
  return result[CHROME_SYNC_KEY]?.bookmarks ?? [];
}

export async function saveChromeSyncBaseline(bookmarks: Bookmark[]): Promise<void> {
  await chrome.storage.local.set({
    [CHROME_SYNC_KEY]: {
      bookmarks: bookmarks.map((b) => ({ url: b.url, title: b.title })),
      syncedAt: Date.now(),
    },
  });
}

export async function syncToChrome(
  data: StorageData
): Promise<{ added: number; updated: number; deleted: number }> {
  const baseline = await getChromeSyncBaseline();
  const baselineMap = new Map(baseline.map((b) => [b.url, b.title]));
  const currentMap = new Map(data.bookmarks.map((b) => [b.url, b]));

  let added = 0, updated = 0, deleted = 0;

  for (const [url, bm] of currentMap) {
    const prevTitle = baselineMap.get(url);
    if (prevTitle === undefined) {
      const parentId = await findOrCreateChromeFolder(bm.folderId, data);
      await chrome.bookmarks.create({ parentId, title: bm.title, url });
      added++;
    } else if (prevTitle !== bm.title) {
      const results = await chrome.bookmarks.search({ url });
      for (const r of results) {
        if (!r.url) continue;
        await chrome.bookmarks.update(r.id, { title: bm.title });
        updated++;
        break;
      }
    }
  }

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

  await saveChromeSyncBaseline(data.bookmarks);

  return { added, updated, deleted };
}

export async function findOrCreateChromeFolder(
  folderId: string,
  data: StorageData
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

export async function restoreFromSnapshot(snapshot: chrome.bookmarks.BookmarkTreeNode[]): Promise<void> {
  const snap = snapshot[0]?.children?.find((n) => n.id === "1");
  if (!snap) return;

  const cur = await chrome.bookmarks.getTree();
  const bar = cur[0]?.children?.find((n) => n.id === "1");
  for (const child of bar?.children ?? []) {
    try { await chrome.bookmarks.removeTree(child.id); } catch (err) { console.warn("Operation failed:", err); }
  }

  for (const node of snap.children ?? []) await restoreNode(node, "1");
}

export async function restoreNode(node: chrome.bookmarks.BookmarkTreeNode, parentId: string): Promise<void> {
  if (node.url) {
    await chrome.bookmarks.create({ parentId, title: node.title, url: node.url });
  } else {
    const f = await chrome.bookmarks.create({ parentId, title: node.title });
    for (const child of node.children ?? []) await restoreNode(child, f.id);
  }
}

export async function saveTabGroupAsFolder(groupId: number, name: string): Promise<MessageResponse> {
  const { createFolder, saveBookmarkTransaction } = await import("@/shared/storage");
  const folder = await createFolder(name, null, "📂");
  const tabs = await chrome.tabs.query({ groupId });
  let added = 0;
  for (const t of tabs) {
    if (t.url && (t.url.startsWith("http://") || t.url.startsWith("https://"))) {
      const parsedUrl = new URL(t.url);
      const domain = parsedUrl.hostname;
      const bookmark: Bookmark = {
        id: crypto.randomUUID(),
        url: t.url,
        title: t.title || t.url,
        favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
        folderId: folder.id,
        domain,
        visitCount: 0,
        savedAt: Date.now(),
      };
      const { isDuplicate } = await saveBookmarkTransaction(bookmark);
      if (!isDuplicate) added++;
    }
  }
  return { success: true, data: { folder, count: added } };
}

export async function openFolderAsTabGroup(folderId: string): Promise<MessageResponse> {
  const { getFolderById } = await import("@/shared/categories");
  const f = await getFolderById(folderId);
  if (!f) return { success: false, error: "Folder not found" };
  const allBms = await getBookmarks();
  const folderBms = allBms.filter(b => b.folderId === folderId);
  if (folderBms.length === 0) return { success: false, error: "No bookmarks in folder" };

  const tabIds: number[] = [];
  for (const bm of folderBms) {
    try {
      const tab = await chrome.tabs.create({ url: bm.url, active: false });
      if (tab.id) tabIds.push(tab.id);
    } catch (e) {}
  }
  if (tabIds.length > 0) {
    const groupId = await chrome.tabs.group({ tabIds });
    
    const mapColor = (c?: string) => {
      if (!c) return "grey";
      const normalized = c.toLowerCase();
      if (normalized === "gray" || normalized === "grey") return "grey";
      if (normalized === "blue") return "blue";
      if (normalized === "red") return "red";
      if (normalized === "yellow") return "yellow";
      if (normalized === "green") return "green";
      if (normalized === "pink") return "pink";
      if (normalized === "purple") return "purple";
      if (normalized === "cyan") return "cyan";
      if (normalized === "orange") return "orange";
      return "grey";
    };
    const color = mapColor(f.color);
    await chrome.tabGroups.update(groupId, { title: f.name, color });
  }
  return { success: true };
}

export async function loadChromePattern(patternId: string): Promise<MessageResponse> {
  const { getChromePatterns } = await import("@/shared/storage");
  const patterns = await getChromePatterns();
  const pattern = patterns.find((p) => p.id === patternId);
  if (!pattern) return { success: false, error: "Pattern not found" };
  const tree = await chrome.bookmarks.getTree();
  const existingUrls = new Set(flattenChromeTree(tree).map((i) => i.url));
  const barId = tree[0]?.children?.[0]?.id ?? "1";
  let added = 0;
  for (const item of pattern.items) {
    if (!existingUrls.has(item.url)) {
      await chrome.bookmarks.create({ parentId: barId, title: item.title, url: item.url });
      added++;
      existingUrls.add(item.url);
    }
  }
  return { success: true, data: { added, total: pattern.items.length } };
}

export function scrapePageContent(): { description: string; rawText: string; readableContent: string } {
  const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute("content") || "";

  function isVisible(el: HTMLElement): boolean {
    if (!el.offsetParent && el.tagName.toLowerCase() !== "body") return false;
    const style = window.getComputedStyle(el);
    return style.display !== "none" && style.visibility !== "hidden" && !el.hasAttribute("hidden");
  }

  const clone = document.body.cloneNode(true) as HTMLElement;

  const tagsToRemove = ["script", "style", "noscript", "iframe", "svg", "header", "footer", "nav"];
  tagsToRemove.forEach(tag => {
    const els = clone.querySelectorAll(tag);
    els.forEach(el => el.remove());
  });

  const allElements = clone.getElementsByTagName("*");
  for (let i = allElements.length - 1; i >= 0; i--) {
    const el = allElements[i] as HTMLElement;
    if (!isVisible(el)) {
      el.remove();
    }
  }

  const rawText = (clone.textContent || "").replace(/\s+/g, " ").trim();

  const contentTags = ["p", "h1", "h2", "h3", "h4", "h5", "h6", "article"];
  const readableElements: string[] = [];
  contentTags.forEach(tag => {
    const els = clone.querySelectorAll(tag);
    els.forEach(el => {
      const text = (el.textContent || "").trim();
      if (text.length > 20) {
        readableElements.push(text);
      }
    });
  });

  const readableContent = readableElements.join("\n\n").trim();

  return {
    description: metaDesc.slice(0, 200),
    rawText: rawText.slice(0, 10000),
    readableContent: readableContent.slice(0, 5000),
  };
}
