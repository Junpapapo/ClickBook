export function extractUrls(text: string): string[] {
  const raw = text.match(/https?:\/\/[^\s,\n\r<>"']+/g) ?? [];
  const cleaned = raw.map(u => u.replace(/[.,;:)>\]'"!?]+$/, ""));
  return [...new Set(cleaned)].filter(u => u.startsWith("http://") || u.startsWith("https://"));
}

import type { Message, MessageResponse } from "@/shared/types";

/**
 * Type-safe wrapper for chrome.runtime.sendMessage with robust error handling and automatic retry.
 * Prevents "Could not establish connection. Receiving end does not exist" on startup or wake-up.
 */
export async function sendMsg(message: Message, retries = 3, delay = 150): Promise<MessageResponse> {
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
