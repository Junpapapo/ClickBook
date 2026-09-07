export function extractUrls(text: string): string[] {
  const raw = text.match(/https?:\/\/[^\s,\n\r<>"']+/g) ?? [];
  const cleaned = raw.map(u => {
    let cleanedUrl = u;
    while (cleanedUrl.length > 0) {
      const lastChar = cleanedUrl[cleanedUrl.length - 1];
      if (/[.,;:'"!?]/.test(lastChar)) {
        cleanedUrl = cleanedUrl.slice(0, -1);
        continue;
      }
      if (lastChar === ")") {
        const openCount = (cleanedUrl.match(/\(/g) || []).length;
        const closeCount = (cleanedUrl.match(/\)/g) || []).length;
        if (openCount >= closeCount) {
          break;
        }
        cleanedUrl = cleanedUrl.slice(0, -1);
        continue;
      }
      if (lastChar === "]") {
        const openCount = (cleanedUrl.match(/\[/g) || []).length;
        const closeCount = (cleanedUrl.match(/\]/g) || []).length;
        if (openCount >= closeCount) {
          break;
        }
        cleanedUrl = cleanedUrl.slice(0, -1);
        continue;
      }
      if (lastChar === "}") {
        const openCount = (cleanedUrl.match(/\{/g) || []).length;
        const closeCount = (cleanedUrl.match(/\}/g) || []).length;
        if (openCount >= closeCount) {
          break;
        }
        cleanedUrl = cleanedUrl.slice(0, -1);
        continue;
      }
      break;
    }
    return cleanedUrl;
  });
  return [...new Set(cleaned)].filter(u => u.startsWith("http://") || u.startsWith("https://"));
}

import type { Message, MessageResponse } from "@/shared/types";

/**
 * Type-safe wrapper for chrome.runtime.sendMessage with robust error handling and automatic retry.
 * Prevents "Could not establish connection. Receiving end does not exist" on startup or wake-up.
 */
export async function sendMsg(message: Message, retries = 5, initialDelay = 200): Promise<MessageResponse> {
  // Check if Chrome extension runtime context is valid
  if (typeof chrome === "undefined" || !chrome.runtime?.id) {
    return { success: false, error: "Extension context invalidated or unavailable" };
  }

  let delay = initialDelay;
  for (let i = 0; i < retries; i++) {
    try {
      return await (chrome.runtime.sendMessage(message) as Promise<MessageResponse>);
    } catch (err: any) {
      const errMsg = err?.message || String(err);

      // If context was invalidated (e.g., extension updated/reloaded), stop retrying immediately
      if (errMsg.includes("Extension context invalidated") || !chrome.runtime?.id) {
        return { success: false, error: "Extension context invalidated" };
      }

      const isConnectionError = 
        errMsg.includes("Could not establish connection") ||
        errMsg.includes("Receiving end does not exist") ||
        errMsg.includes("message port closed");
      
      if (isConnectionError && i < retries - 1) {
        // Use console.debug instead of console.warn to avoid cluttering chrome://extensions error UI
        console.debug(`[ClickBook] Service worker waking up... retrying in ${delay}ms (${i + 1}/${retries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * 2, 1600);
        continue;
      }
      
      // Log final failure only when all retries are exhausted
      console.warn(`[ClickBook] sendMsg failed after ${i + 1} attempts:`, errMsg);
      return { success: false, error: errMsg };
    }
  }
  return { success: false, error: "Max retries exceeded without response" };
}

export function formatLastUpdated(timestamp: number): string {
  if (!timestamp) return "";
  const d = new Date(timestamp);
  const MM = String(d.getMonth() + 1).padStart(2, "0");
  const DD = String(d.getDate()).padStart(2, "0");
  const HH = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${MM}-${DD} ${HH}:${mm}`;
}

import { lazy, type ComponentType } from "react";

export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries = 2,
  interval = 400
): React.LazyExoticComponent<T> {
  return lazy(() =>
    new Promise<{ default: T }>((resolve, reject) => {
      function attempt(remaining: number) {
        factory()
          .then(resolve)
          .catch((error) => {
            if (remaining > 0) {
              setTimeout(() => {
                attempt(remaining - 1);
              }, interval);
            } else {
              const isChunkLoadFailed =
                error?.name === "ChunkLoadError" ||
                /Failed to fetch dynamically imported module/i.test(error?.message || "");
              if (isChunkLoadFailed && typeof window !== "undefined") {
                const reloadKey = "cb_lazy_reload_ts";
                const lastReload = parseInt(sessionStorage.getItem(reloadKey) || "0", 10);
                if (Date.now() - lastReload > 10000) {
                  sessionStorage.setItem(reloadKey, Date.now().toString());
                  window.location.reload();
                  return;
                }
              }
              reject(error);
            }
          });
      }
      attempt(retries);
    })
  );
}
