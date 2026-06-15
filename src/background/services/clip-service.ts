import type { Bookmark } from "@/shared/types";
import { getBookmarks, addBookmark } from "@/shared/storage";
import { categorize, refineMemoDraft, isAIAvailable } from "@/shared/categorizer";
import { getEffectiveLanguage } from "./helpers/lang-helper";
import { injectToast } from "./helpers/toast-helper";
import { scrapePageContent } from "./bookmark-sync-service";

const currentlySavingUrls = new Set<string>();

export async function clipSelection(selectionText: string | undefined, tab?: chrome.tabs.Tab): Promise<void> {
  if (!selectionText || !selectionText.trim()) return;
  if (!tab || !tab.id) {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    tab = activeTab;
  }
  if (!tab || !tab.id || !tab.url) return;

  try {
    const { bookmark } = await saveTabForClipping(tab);
    
    const { getMemos, saveMemo } = await import("@/shared/storage");
    const memos = await getMemos();
    const existingMemo = memos[bookmark.id];
    let content = `• ${selectionText.trim()}`;
    if (existingMemo && existingMemo.content) {
      content = `${existingMemo.content}\n• ${selectionText.trim()}`;
    }
    
    await saveMemo(bookmark.id, content, "purple");

    const lang = await getEffectiveLanguage();
    
    const aiEnabled = await isAIAvailable();
    if (aiEnabled) {
      await injectToast(tab.id, "toastHighlightSaved");

      const refined = await refineMemoDraft(content, lang);
      if (refined.aiUsed && refined.draft) {
        await saveMemo(bookmark.id, refined.draft, "purple");
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

export async function saveTabForClipping(tab: chrome.tabs.Tab): Promise<{ bookmark: Bookmark; isNew: boolean }> {
  if (!tab.url) {
    throw new Error("Could not get tab URL");
  }
  if (!tab.url.startsWith("http://") && !tab.url.startsWith("https://")) {
    throw new Error("Only http/https URLs can be saved");
  }

  if (currentlySavingUrls.has(tab.url)) {
    throw new Error("This URL is already being saved");
  }

  const existing = await getBookmarks();
  const found = existing.find((b) => b.url === tab.url);
  if (found) {
    return { bookmark: found, isNew: false };
  }

  currentlySavingUrls.add(tab.url);

  try {
    const url = new URL(tab.url);
    const domain = url.hostname;
    const { getFolders } = await import("@/shared/storage");
    const folders = await getFolders();
    const { folderId } = await categorize(tab.url, tab.title ?? "", domain, folders);
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

    (async () => {
      try {
        if (rawText || readableContent) {
          const { savePageContent } = await import("@/shared/storage");
          await savePageContent(bookmark.id, rawText, readableContent);
        }

        const { generateSummaryAndTags } = await import("@/shared/categorizer");
        const aiData = await generateSummaryAndTags(tab.url!, tab.title ?? "", description || readableContent.slice(0, 300));
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
  } finally {
    currentlySavingUrls.delete(tab.url);
  }
}
