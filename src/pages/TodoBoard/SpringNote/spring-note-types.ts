import type { NotePage, NoteObject } from "@/shared/types";

export type { NoteObject, NotePage };

export type SpringNoteTheme = "light" | "sepia" | "dark" | "grid" | "sage" | "dot";

export interface SpringNotePanelProps {
  taskId: string;
  onClose: () => void;
  t: any;
  lang: string;
  isMiniMode?: boolean;
  onThemeChange?: (theme: SpringNoteTheme) => void;
}

export interface SpringNoteToolbarProps {
  editor?: any;
  theme: SpringNoteTheme;
  onChangeTheme: (theme: SpringNoteTheme) => void;
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
  onInsertMemo?: () => void;
  onApplyFormatting?: (format: "bold" | "italic" | "underline" | "strikethrough" | "code" | "quote" | "bullet" | "number" | "indent" | "outdent") => void;
  isMiniMode?: boolean;
  onMaximize?: () => void;
  onApplyTextColor?: (color: string) => void;
  onApplyHighlightColor?: (color: string) => void;
  pages: any[];
  currentPageIndex: number;
  onChangePageIndex: (idx: number) => void;
  onToggleImagePopover?: () => void;
  onOpenExport?: () => void;
}

export interface SpringNoteBookProps {
  theme: SpringNoteTheme;
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
  theme: SpringNoteTheme;
  selectedObjId: string | null;
  setSelectedObjId: (id: string | null) => void;
  scrollHeight?: number;
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
