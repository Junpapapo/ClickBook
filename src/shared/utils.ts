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
