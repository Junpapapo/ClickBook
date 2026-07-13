import type { MemoColor } from "@/shared/types";

export interface MemoData {
  bookmarkId: string;
  content: string;
  color: MemoColor;
  updatedAt: number;
}

export interface MemoState {
  currentMemo: MemoData | null;
  memoInputCache: string;
  selectedColor: MemoColor;
  isLoading: boolean;
  isSaving: boolean;
}
