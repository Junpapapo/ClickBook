import type { ChatState } from "./chat-types";

// 싱글톤 상태 객체
const state: ChatState = {
  messages: [],
  chatInputCache: "",
  isGenerating: false,
  pendingAutoSend: false,
};

type ChatStateListener = (state: ChatState) => void;
const listeners = new Set<ChatStateListener>();

export function getChatState(): ChatState {
  return { ...state };
}

// 상태 업데이트 및 리스너 전파
export function updateChatState(updates: Partial<ChatState>): void {
  Object.assign(state, updates);
  listeners.forEach((listener) => {
    try {
      listener({ ...state });
    } catch (e) {
      console.error("[Chat State] Listener execution failed:", e);
    }
  });
}

// 상태 변경 구독
export function subscribeChatState(listener: ChatStateListener): () => void {
  listeners.add(listener);
  try {
    listener({ ...state });
  } catch (e) {
    console.error("[Chat State] Initial subscriber execution failed:", e);
  }
  return () => {
    listeners.delete(listener);
  };
}
