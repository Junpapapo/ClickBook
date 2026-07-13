export interface VocabItem {
  id: string; // 메모의 bookmarkId (저장된 URL)
  word: string; // 원문
  pronunciation: string; // 발음
  meaning: string; // 뜻
  nuance: string; // 뉘앙스/예문
  updatedAt: number;
}

export type VocabViewMode = "list" | "review" | "quiz";

export interface VocabState {
  items: VocabItem[];
  viewMode: VocabViewMode;
  isLoading: boolean;
  
  // 플래시 카드 상태
  currentCardIndex: number;
  showMeaning: boolean;
  
  // 퀴즈 상태
  quizQuestion: {
    correctItem: VocabItem;
    choices: string[]; // 4지선다 뜻 리스트
  } | null;
  selectedChoice: string | null; // 사용자가 선택한 뜻
  isAnswered: boolean;
  quizScore: number;
}
