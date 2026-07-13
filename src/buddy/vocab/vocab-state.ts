import type { VocabState } from "./vocab-types";

const state: VocabState = {
  items: [],
  viewMode: "list",
  isLoading: false,
  currentCardIndex: 0,
  showMeaning: false,
  quizQuestion: null,
  selectedChoice: null,
  isAnswered: false,
  quizScore: 0,
};

type VocabStateListener = (state: VocabState) => void;
const listeners = new Set<VocabStateListener>();

export function getVocabState(): VocabState {
  return { ...state };
}

export function updateVocabState(updates: Partial<VocabState>): void {
  Object.assign(state, updates);
  listeners.forEach((listener) => {
    try {
      listener({ ...state });
    } catch (e) {
      console.error("[Vocab State] Listener execution failed:", e);
    }
  });
}

export function subscribeVocabState(listener: VocabStateListener): () => void {
  listeners.add(listener);
  try {
    listener({ ...state });
  } catch (e) {
    console.error("[Vocab State] Initial subscriber execution failed:", e);
  }
  return () => {
    listeners.delete(listener);
  };
}
