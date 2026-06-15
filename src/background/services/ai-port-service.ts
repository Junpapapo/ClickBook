import { getAllData } from "@/shared/storage";
import { reorganizeWithAI } from "@/shared/categorizer";
import { logAIDebug, flushAIDebugLogs } from "./helpers/logger-helper";
import { DEFAULT_FOLDER_ID } from "@/shared/categories";

export async function runAutoTagViaPort(port: chrome.runtime.Port): Promise<void> {
  let disconnected = false;
  port.onDisconnect.addListener(() => { disconnected = true; });

  const send = (msg: object) => {
    if (disconnected) return;
    try { port.postMessage(msg); } catch (_) { /* port closed */ }
  };

  try {
    send({ type: "running" });

    const data = await getAllData();
    if (disconnected) return;

    const untagged = data.bookmarks.filter(
      (b) => !b.tags || b.tags.length === 0
    );

    if (untagged.length === 0) {
      send({ type: "done", tagged: 0, total: 0 });
      return;
    }

    const total = untagged.length;
    let tagged = 0;
    let failed = 0;

    const { generateSummaryAndTags } = await import("@/shared/categorizer");
    const { updateBookmark } = await import("@/shared/storage");

    for (let i = 0; i < untagged.length; i++) {
      if (disconnected) return;

      const bm = untagged[i];
      const progress = Math.round(((i + 1) / total) * 100);

      try {
        const aiData = await generateSummaryAndTags(bm.url, bm.title, bm.summary || "");

        if (aiData.tags && aiData.tags.length > 0) {
          const updates: Record<string, unknown> = { tags: aiData.tags };
          if (!bm.summary && aiData.summary) {
            updates.summary = aiData.summary;
          }
          await updateBookmark(bm.id, updates);
          tagged++;
        } else {
          const fallbackTags = generateFallbackTags(bm.url, bm.title);
          if (fallbackTags.length > 0) {
            await updateBookmark(bm.id, { tags: fallbackTags });
            tagged++;
          } else {
            failed++;
          }
        }
      } catch (err) {
        console.warn(`[Auto Tag] Failed for "${bm.title}":`, err);
        try {
          const fallbackTags = generateFallbackTags(bm.url, bm.title);
          if (fallbackTags.length > 0) {
            await updateBookmark(bm.id, { tags: fallbackTags });
            tagged++;
          } else {
            failed++;
          }
        } catch {
          failed++;
        }
      }

      send({
        type: "progress",
        progress,
        detail: `${i + 1}/${total}`,
        tagged,
      });
    }

    send({
      type: "done",
      tagged,
      total,
      failed,
    });
  } catch (err) {
    console.error("[Auto Tag] Critical error:", err);
    send({ type: "error", error: String(err) });
  }
}

export function generateFallbackTags(url: string, title: string): string[] {
  const tags: string[] = [];
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace(/^www\./, "");

    const domainTagMap: Record<string, string[]> = {
      "github.com": ["github", "development"],
      "stackoverflow.com": ["stackoverflow", "programming"],
      "youtube.com": ["youtube", "video"],
      "medium.com": ["medium", "blog"],
      "dev.to": ["dev", "blog"],
      "twitter.com": ["twitter", "social"],
      "x.com": ["twitter", "social"],
      "reddit.com": ["reddit", "community"],
      "wikipedia.org": ["wikipedia", "reference"],
      "notion.so": ["notion", "productivity"],
      "figma.com": ["figma", "design"],
      "dribbble.com": ["dribbble", "design"],
      "npmjs.com": ["npm", "javascript"],
      "vercel.com": ["vercel", "deployment"],
      "netlify.com": ["netlify", "deployment"],
      "aws.amazon.com": ["aws", "cloud"],
      "cloud.google.com": ["gcp", "cloud"],
      "azure.microsoft.com": ["azure", "cloud"],
      "docs.google.com": ["google-docs", "productivity"],
      "kaggle.com": ["kaggle", "data-science"],
      "arxiv.org": ["arxiv", "research"],
      "huggingface.co": ["huggingface", "ai"],
    };

    for (const [d, t] of Object.entries(domainTagMap)) {
      if (domain === d || domain.endsWith(`.${d}`)) {
        tags.push(...t);
        break;
      }
    }

    const shortDomain = domain.split(".").slice(0, -1).join(".");
    if (shortDomain.length <= 12 && !tags.includes(shortDomain)) {
      tags.push(shortDomain);
    }

    const stopWords = new Set(["the","a","an","of","in","to","for","and","or","is","are","how","what","with","on","at","by","from"]);
    const titleWords = title
      .toLowerCase()
      .replace(/[^a-z0-9\s\uAC00-\uD7A3\u3040-\u30FF]/g, " ")
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));

    if (titleWords.length > 0) {
      const sorted = [...new Set(titleWords)].sort((a, b) => b.length - a.length);
      const candidate = sorted[0];
      if (candidate && !tags.includes(candidate)) {
        tags.push(candidate);
      }
    }
  } catch { /* ignore URL parse errors */ }

  return tags.slice(0, 3);
}

export async function runAIReorganizeViaPort(port: chrome.runtime.Port): Promise<void> {
  // 포트 연결 즉시 비동기로 AI 모델을 사전 로드(웜업)하여 디바이스 지연 시간을 방지합니다.
  import("@/shared/categorizer/ai-service").then(({ preloadAIModel }) => {
    preloadAIModel().catch(err => console.warn("[AI Preload Warmup Failed]:", err));
  });

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

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const backupName = `AI_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
    await savePattern(backupName, data);
    if (disconnected) return;

    const lockedFolderIds = new Set(
      data.folders.filter((f) => f.locked).map((f) => f.id)
    );
    const bookmarksToProcess = data.bookmarks.filter(
      (b) => !lockedFolderIds.has(b.folderId)
    );

    await logAIDebug(`[AI Organize] Reorganization process triggered. Total bookmarks: ${data.bookmarks.length}, processing: ${bookmarksToProcess.length}`);

    const { moves, aiSuccessCount, aiTotalBatches, aiSupported } = await reorganizeWithAI(
      bookmarksToProcess,
      settings.maxFolderDepth,
      settings.keepExistingFolders ? data.folders : undefined,
      (progress, detail) => {
        send({
          type: "progress",
          progress,
          detail,
        });
      },
      () => disconnected
    );
    if (disconnected) return;

    const { moveBookmark, createFolder } = await import("@/shared/storage");
    let movedCount = 0;

    for (const [bookmarkId, catPath] of moves) {
      const existing = data.bookmarks.find((b) => b.id === bookmarkId);
      if (!existing) continue;

      const parts = catPath.split("/").map(p => p.trim()).filter(Boolean);
      if (parts.length === 0) continue;

      const allowedParts = parts.slice(0, settings.maxFolderDepth);

      let currentParentId: string | null = null;
      let targetFolderId = existing.folderId;

      for (let i = 0; i < allowedParts.length; i++) {
        const partName = allowedParts[i];
        
        let folder = data.folders.find(
          f => f.parentId === currentParentId && 
               (f.name.toLowerCase() === partName.toLowerCase() || 
                (f.nameJa && f.nameJa.toLowerCase() === partName.toLowerCase()))
        );

        if (!folder) {
          folder = await createFolder(partName, currentParentId, "Folder");
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

    const { deleteEmptyFolders } = await import("@/shared/storage");
    const foldersDeleted = await deleteEmptyFolders();
    
    await logAIDebug(`[AI Organize] Complete. Moved bookmarks count: ${movedCount}. Deleted empty folders: ${foldersDeleted}`);

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
  } finally {
    await flushAIDebugLogs();
  }
}

export async function runAIReorganizeOtherViaPort(port: chrome.runtime.Port): Promise<void> {
  // 포트 연결 즉시 비동기로 AI 모델을 사전 로드(웜업)하여 디바이스 지연 시간을 방지합니다.
  import("@/shared/categorizer/ai-service").then(({ preloadAIModel }) => {
    preloadAIModel().catch(err => console.warn("[AI Preload Warmup Failed]:", err));
  });

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

    const bookmarksToProcess = data.bookmarks.filter(b => b.folderId === DEFAULT_FOLDER_ID);
    if (bookmarksToProcess.length === 0) {
      send({ type: "done", movedCount: 0 });
      return;
    }

    const { getSettings } = await import("@/shared/storage");
    const settings = await getSettings();

    const existingFolders = data.folders.filter(f => f.id !== DEFAULT_FOLDER_ID);
    
    const { moves } = await reorganizeWithAI(
      bookmarksToProcess, 
      settings.maxFolderDepth, 
      existingFolders,
      undefined,
      () => disconnected
    );
    if (disconnected) return;

    const { moveBookmark } = await import("@/shared/storage");
    let movedCount = 0;

    for (const [bookmarkId, catPath] of moves) {
      const existing = data.bookmarks.find(b => b.id === bookmarkId);
      if (!existing || existing.folderId !== DEFAULT_FOLDER_ID) continue;

      const parts = catPath.split("/").map(p => p.trim()).filter(Boolean);
      if (parts.length === 0) continue;

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
  } finally {
    await flushAIDebugLogs();
  }
}
