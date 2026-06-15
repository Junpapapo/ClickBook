import type { StorageData, Bookmark } from "@/shared/types";

export function checkIsDomainSecureWithData(url: string, data: StorageData): boolean {
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
}

export function checkIsUrlBookmarkedWithData(url: string, bookmarks: Bookmark[]): boolean {
  if (!url || (!url.startsWith("http://") && !url.startsWith("https://"))) {
    return false;
  }
  const normalize = (u: string) => {
    try {
      const p = new URL(u);
      return p.origin + p.pathname.replace(/\/$/, '') + p.search;
    } catch {
      return u.split('#')[0].replace(/\/$/, '');
    }
  };
  
  const target = normalize(url);
  return bookmarks.some(b => normalize(b.url) === target);
}

export async function checkIsDomainSecure(url: string): Promise<boolean> {
  try {
    const { getAllData } = await import("@/shared/storage");
    const data = await getAllData();
    return checkIsDomainSecureWithData(url, data);
  } catch (e) {
    return false;
  }
}

export async function checkAndSetSecureTabIndicator(tabId: number, url?: string) {
  if (!url) {
    try {
      await chrome.action.setBadgeText({ text: "", tabId });
    } catch (e) {}
    return;
  }

  try {
    const { getAllData } = await import("@/shared/storage");
    const data = await getAllData();
    
    const isSecure = checkIsDomainSecureWithData(url, data);
    if (isSecure) {
      await chrome.action.setBadgeText({ text: "SEC", tabId });
      await chrome.action.setBadgeBackgroundColor({ color: "#10b981", tabId });
      try {
        await chrome.action.setBadgeTextColor({ color: "#ffffff", tabId });
      } catch (e) {}
    } else {
      const isBookmarked = checkIsUrlBookmarkedWithData(url, data.bookmarks);
      if (isBookmarked) {
        await chrome.action.setBadgeText({ text: "ON", tabId });
        await chrome.action.setBadgeBackgroundColor({ color: "#6366f1", tabId });
        try {
          await chrome.action.setBadgeTextColor({ color: "#ffffff", tabId });
        } catch (e) {}
      } else {
        await chrome.action.setBadgeText({ text: "", tabId });
      }
    }
  } catch (err) {
    // console.warn(err);
  }
}
