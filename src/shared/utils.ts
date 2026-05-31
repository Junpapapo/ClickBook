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
export async function sendMsg(message: Message, retries = 3, initialDelay = 150): Promise<MessageResponse> {
  let delay = initialDelay;
  for (let i = 0; i < retries; i++) {
    try {
      return await (chrome.runtime.sendMessage(message) as Promise<MessageResponse>);
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      const isConnectionError = 
        errMsg.includes("Could not establish connection") ||
        errMsg.includes("Receiving end does not exist") ||
        errMsg.includes("message port closed");
      
      if (isConnectionError && i < retries - 1) {
        console.warn(`[ClickBook] sendMsg failed (${errMsg}). Retrying in ${delay}ms... (${i + 1}/${retries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
        continue;
      }
      
      console.error(`[ClickBook] sendMsg failed permanently after ${i + 1} attempts:`, err);
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
