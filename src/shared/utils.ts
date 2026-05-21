export function extractUrls(text: string): string[] {
  const raw = text.match(/https?:\/\/[^\s,\n\r<>"']+/g) ?? [];
  const cleaned = raw.map(u => u.replace(/[.,;:)>\]'"!?]+$/, ""));
  return [...new Set(cleaned)].filter(u => u.startsWith("http://") || u.startsWith("https://"));
}

import type { Message, MessageResponse } from "@/shared/types";

/**
 * Type-safe wrapper for chrome.runtime.sendMessage.
 * Ensures the message payload matches the Message union and returns a typed MessageResponse.
 */
export function sendMsg(message: Message): Promise<MessageResponse> {
  return chrome.runtime.sendMessage(message) as Promise<MessageResponse>;
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
