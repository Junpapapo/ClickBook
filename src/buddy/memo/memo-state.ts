import type { MemoState } from "./memo-types";

const state: MemoState = {
  currentMemo: null,
  memoInputCache: "",
  selectedColor: "yellow",
  isLoading: false,
  isSaving: false,
};

type MemoStateListener = (state: MemoState) => void;
const listeners = new Set<MemoStateListener>();

export function getMemoState(): MemoState {
  return { ...state };
}

export function updateMemoState(updates: Partial<MemoState>): void {
  Object.assign(state, updates);
  listeners.forEach((listener) => {
    try {
      listener({ ...state });
    } catch (e) {
      console.error("[Memo State] Listener execution failed:", e);
    }
  });
}

export function subscribeMemoState(listener: MemoStateListener): () => void {
  listeners.add(listener);
  try {
    listener({ ...state });
  } catch (e) {
    console.error("[Memo State] Initial subscriber execution failed:", e);
  }
  return () => {
    listeners.delete(listener);
  };
}
