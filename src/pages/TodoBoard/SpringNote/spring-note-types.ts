import type { TodoTask, NotePage, NoteObject } from "@/shared/types";

export interface SpringNotePanelProps {
  taskId: string;
  onClose: () => void;
  t: any;
  lang: string;
  isMiniMode?: boolean;
}

export interface SpringNoteToolbarProps {
  editor?: any;
  theme: "light" | "sepia" | "dark" | "grid";
  onChangeTheme: (theme: "light" | "sepia" | "dark" | "grid") => void;
  font: "serif" | "sans" | "mono" | "pretendard";
  onChangeFont: (font: "serif" | "sans" | "mono" | "pretendard") => void;
  fontSize: number;
  onChangeFontSize: (size: number) => void;
  onAddPage: () => void;
  onDeletePage: () => void;
  onToggleDrawer: () => void;
  isDrawerOpen: boolean;
  onClose: () => void;
  // --- V6 Rich Text and Table insertion ---
  onInsertTable?: () => void;
  onApplyFormatting?: (format: "bold" | "italic" | "underline" | "strikethrough" | "code" | "quote" | "bullet" | "number" | "indent" | "outdent") => void;
  isMiniMode?: boolean;
  onMaximize?: () => void;
  onApplyTextColor?: (color: string) => void;
  onApplyHighlightColor?: (color: string) => void;
  pages: any[];
  currentPageIndex: number;
  onChangePageIndex: (idx: number) => void;
  onToggleImagePopover?: () => void;
}

export interface SpringNoteBookProps {
  theme: "light" | "sepia" | "dark" | "grid";
  font: "serif" | "sans" | "mono" | "pretendard";
  fontSize: number;
  children: React.ReactNode;
}

export interface SpringNoteCanvasProps {
  pageId: string;
  taskId: string;
  objects: NoteObject[];
  onUpdateObjects: (objects: NoteObject[]) => void;
  scale?: number;
  t: any;
  theme: "light" | "sepia" | "dark" | "grid";
  selectedObjId: string | null;
  setSelectedObjId: (id: string | null) => void;
}

export interface BookmarkSelectorProps {
  onSelectBookmark: (bookmark: { title: string; url: string; id: string; favicon: string }) => void;
  onSelectMemo: (memo: {
    id: string;
    content: string;
    color: string;
    bookmarkTitle?: string;
    bookmarkUrl?: string;
    favicon?: string;
  }) => void;
  t: any;
  lang: string;
  onClose: () => void;
}
