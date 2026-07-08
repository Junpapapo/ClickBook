import React, { useState, useEffect, useRef, useMemo } from "react";
import { Book, BookOpen, Plus, Search, Trash2, ArrowLeft, ChevronLeft, ChevronRight, Keyboard } from "lucide-react";
import type { SpringNote } from "@/shared/types";
import { getAllSpringNotes, saveSpringNote, deleteSpringNote } from "@/utils/springNoteDb";
import SpringNotePanel from "./TodoBoard/SpringNote/SpringNotePanel";
import SpringNoteShortcutGuide from "./TodoBoard/SpringNote/components/SpringNoteShortcutGuide";
import { useLang } from "@/shared/LanguageContext";
import { useTheme } from "@/shared/ThemeContext";

interface SpringNoteBoardProps {
  lang?: string;
  t?: (key: string, replacements?: Record<string, any>) => string;
}

interface NoteColorMap {
  text: string;
  bgLight: string;
  bgDark: string;
  bgSepia: string;
  borderLight: string;
  borderDark: string;
  borderSepia: string;
  borderLightActive: string;
  borderDarkActive: string;
  borderSepiaActive: string;
  bgLightActive: string;
  bgDarkActive: string;
  bgSepiaActive: string;
}

const NOTE_COLORS: NoteColorMap[] = [
  {
    // Mustard Yellow
    text: "text-amber-600 dark:text-amber-400",
    bgLight: "bg-amber-500/[0.03] hover:bg-amber-500/[0.07]",
    bgDark: "bg-amber-500/[0.02] hover:bg-amber-500/[0.05]",
    bgSepia: "bg-amber-800/[0.03] hover:bg-amber-800/[0.07]",
    borderLight: "border-amber-500/10 hover:border-amber-500/25",
    borderDark: "border-amber-400/5 hover:border-amber-400/15",
    borderSepia: "border-amber-700/5 hover:border-amber-700/15",
    borderLightActive: "border-amber-400 shadow-sm",
    borderDarkActive: "border-amber-500/35 shadow-sm",
    borderSepiaActive: "border-amber-600/60 shadow-sm",
    bgLightActive: "bg-amber-500/10 text-amber-900 dark:text-amber-300",
    bgDarkActive: "bg-amber-500/15 text-amber-200",
    bgSepiaActive: "bg-amber-700/10 text-[#4A3728]"
  },
  {
    // Rose Red
    text: "text-rose-600 dark:text-rose-400",
    bgLight: "bg-rose-500/[0.03] hover:bg-rose-500/[0.07]",
    bgDark: "bg-rose-500/[0.02] hover:bg-rose-500/[0.05]",
    bgSepia: "bg-rose-800/[0.03] hover:bg-rose-800/[0.07]",
    borderLight: "border-rose-500/10 hover:border-rose-500/25",
    borderDark: "border-rose-400/5 hover:border-rose-400/15",
    borderSepia: "border-rose-700/5 hover:border-rose-700/15",
    borderLightActive: "border-rose-400 shadow-sm",
    borderDarkActive: "border-rose-500/35 shadow-sm",
    borderSepiaActive: "border-rose-600/60 shadow-sm",
    bgLightActive: "bg-rose-500/10 text-rose-900 dark:text-rose-300",
    bgDarkActive: "bg-rose-500/15 text-rose-200",
    bgSepiaActive: "bg-rose-700/10 text-[#4A3728]"
  },
  {
    // Cerulean Blue
    text: "text-blue-600 dark:text-blue-400",
    bgLight: "bg-blue-500/[0.03] hover:bg-blue-500/[0.07]",
    bgDark: "bg-blue-500/[0.02] hover:bg-blue-500/[0.05]",
    bgSepia: "bg-blue-800/[0.03] hover:bg-blue-800/[0.07]",
    borderLight: "border-blue-500/10 hover:border-blue-500/25",
    borderDark: "border-blue-400/5 hover:border-blue-400/15",
    borderSepia: "border-blue-700/5 hover:border-blue-700/15",
    borderLightActive: "border-blue-400 shadow-sm",
    borderDarkActive: "border-blue-500/35 shadow-sm",
    borderSepiaActive: "border-blue-600/60 shadow-sm",
    bgLightActive: "bg-blue-500/10 text-blue-900 dark:text-blue-300",
    bgDarkActive: "bg-blue-500/15 text-blue-200",
    bgSepiaActive: "bg-blue-700/10 text-[#4A3728]"
  },
  {
    // Emerald Green
    text: "text-emerald-600 dark:text-emerald-400",
    bgLight: "bg-emerald-500/[0.03] hover:bg-emerald-500/[0.07]",
    bgDark: "bg-emerald-500/[0.02] hover:bg-emerald-500/[0.05]",
    bgSepia: "bg-emerald-800/[0.03] hover:bg-emerald-800/[0.07]",
    borderLight: "border-emerald-500/10 hover:border-emerald-500/25",
    borderDark: "border-emerald-400/5 hover:border-emerald-400/15",
    borderSepia: "border-emerald-700/5 hover:border-emerald-700/15",
    borderLightActive: "border-emerald-400 shadow-sm",
    borderDarkActive: "border-emerald-500/35 shadow-sm",
    borderSepiaActive: "border-emerald-600/60 shadow-sm",
    bgLightActive: "bg-emerald-500/10 text-emerald-900 dark:text-emerald-300",
    bgDarkActive: "bg-emerald-500/15 text-emerald-200",
    bgSepiaActive: "bg-emerald-700/10 text-[#4A3728]"
  },
  {
    // Violet Purple
    text: "text-purple-600 dark:text-purple-400",
    bgLight: "bg-purple-500/[0.03] hover:bg-purple-500/[0.07]",
    bgDark: "bg-purple-500/[0.02] hover:bg-purple-500/[0.05]",
    bgSepia: "bg-purple-800/[0.03] hover:bg-purple-800/[0.07]",
    borderLight: "border-purple-500/10 hover:border-purple-500/25",
    borderDark: "border-purple-400/5 hover:border-purple-400/15",
    borderSepia: "border-purple-700/5 hover:border-purple-700/15",
    borderLightActive: "border-purple-400 shadow-sm",
    borderDarkActive: "border-purple-500/35 shadow-sm",
    borderSepiaActive: "border-purple-600/60 shadow-sm",
    bgLightActive: "bg-purple-500/10 text-purple-900 dark:text-purple-300",
    bgDarkActive: "bg-purple-500/15 text-purple-200",
    bgSepiaActive: "bg-purple-700/10 text-[#4A3728]"
  },
  {
    // Tangerine Orange
    text: "text-orange-600 dark:text-orange-400",
    bgLight: "bg-orange-500/[0.03] hover:bg-orange-500/[0.07]",
    bgDark: "bg-orange-500/[0.02] hover:bg-orange-500/[0.05]",
    bgSepia: "bg-orange-800/[0.03] hover:bg-orange-800/[0.07]",
    borderLight: "border-orange-500/10 hover:border-orange-500/25",
    borderDark: "border-orange-400/5 hover:border-orange-400/15",
    borderSepia: "border-orange-700/5 hover:border-orange-700/15",
    borderLightActive: "border-orange-400 shadow-sm",
    borderDarkActive: "border-orange-500/35 shadow-sm",
    borderSepiaActive: "border-orange-600/60 shadow-sm",
    bgLightActive: "bg-orange-500/10 text-orange-900 dark:text-orange-300",
    bgDarkActive: "bg-orange-500/15 text-orange-200",
    bgSepiaActive: "bg-orange-700/10 text-[#4A3728]"
  }
];

const getNoteColor = (noteId: string): NoteColorMap => {
  let hash = 0;
  for (let i = 0; i < noteId.length; i++) {
    hash = noteId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % NOTE_COLORS.length;
  return NOTE_COLORS[index];
};

export default function SpringNoteBoard({
  lang: propLang,
  t: propT,
}: SpringNoteBoardProps) {
  const context = useLang();
  // props로 주어지면 그걸 쓰고, 없으면 전역 useLang Context를 참조하여 번역 신뢰성 확보
  const lang = propLang || context.lang || "ko";
  const t = propT || context.t || ((key: string) => key);

  const [notes, setNotes] = useState<SpringNote[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isShortcutGuideOpen, setIsShortcutGuideOpen] = useState(false);

  // 노트 삭제 확인용 커스텀 모달 상태 추가
  const [isNoteDeleteModalOpen, setIsNoteDeleteModalOpen] = useState(false);
  const [noteIdToDelete, setNoteIdToDelete] = useState<string | null>(null);

  // 1. 드래그식 좌우 폭 조절 상태 추가 (기본 240px)
  const [sidebarWidth, setSidebarWidth] = useState<number>(240);
  const isResizing = useRef(false);
  const dragStartX = useRef<number>(0);
  const dragStartWidth = useRef<number>(0);

  const { theme: systemTheme } = useTheme();

  useEffect(() => {
    loadNotes();
  }, []);

  // 시스템 테마 변경 시 현재 선택된 노트 테마 자동 연동
  useEffect(() => {
    if (!selectedNoteId || loading) return;
    const targetTheme = systemTheme === "light" ? "grid" : "dark";
    
    const currentNote = notes.find((n) => n.id === selectedNoteId);
    if (currentNote && currentNote.theme !== targetTheme) {
      setNotes((prev) =>
        prev.map((n) => (n.id === selectedNoteId ? { ...n, theme: targetTheme } : n))
      );
      
      const updatedNote = { ...currentNote, theme: targetTheme, updatedAt: Date.now() };
      saveSpringNote(updatedNote).catch((err) =>
        console.warn("Failed to save theme sync from system:", err)
      );
    }
  }, [systemTheme, selectedNoteId, loading]);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const all = await getAllSpringNotes();
      setNotes(all);

      // 킵해놓은 활성화 노트가 있다면 최우선 세팅
      const activeNoteId = localStorage.getItem("clickbook_active_spring_note_id");
      if (activeNoteId) {
        setSelectedNoteId(activeNoteId);
        localStorage.removeItem("clickbook_active_spring_note_id");
      } else if (all.length > 0 && !selectedNoteId) {
        setSelectedNoteId(all[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async () => {
    const defaultTitle =
      lang === "ko"
        ? `새 스프링 노트 #${notes.length + 1}`
        : lang === "ja"
        ? `新しいノート #${notes.length + 1}`
        : `New Spring Note #${notes.length + 1}`;

    const newNote: SpringNote = {
      id: `note-${Date.now()}`,
      title: defaultTitle,
      pages: [
        {
          id: `page-${Date.now()}`,
          pageNumber: 1,
          text: "",
          objects: [],
        },
      ],
      theme: "sepia",
      font: "pretendard",
      fontSize: 16,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      await saveSpringNote(newNote);
      setNotes((prev) => [newNote, ...prev]);
      setSelectedNoteId(newNote.id);
    } catch (err) {
      console.error(err);
    }
  };

  // 노트 삭제 버튼 클릭 시 모달 기동
  const handleDeleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNoteIdToDelete(id);
    setIsNoteDeleteModalOpen(true);
  };

  // 커스텀 모달에서 삭제 최종 확정 시 작동
  const confirmDeleteNote = async () => {
    if (!noteIdToDelete) return;
    try {
      await deleteSpringNote(noteIdToDelete);
      setNotes((prev) => prev.filter((n) => n.id !== noteIdToDelete));
      if (selectedNoteId === noteIdToDelete) {
        setSelectedNoteId(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsNoteDeleteModalOpen(false);
      setNoteIdToDelete(null);
    }
  };

  // 마우스 드래그 좌우 너비 조절 리스너 연동 (시작 오프셋 저장으로 튐 버그 완전 차단)
  const startResizing = (mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    isResizing.current = true;
    dragStartX.current = mouseDownEvent.clientX;
    dragStartWidth.current = sidebarWidth;
  };

  // 사이드바 일괄 최소화/복구 토글 헬퍼
  const toggleSidebar = () => {
    if (sidebarWidth > 100) {
      setSidebarWidth(64);
    } else {
      setSidebarWidth(240);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      // 마우스가 클릭 시점 대비 이동한 물리적 거리를 산출하여 가산
      const deltaX = e.clientX - dragStartX.current;
      const targetWidth = dragStartWidth.current + deltaX;
      
      // 최소 64px ~ 최대 420px 로 폭 제한
      const nextWidth = Math.max(64, Math.min(420, targetWidth));
      setSidebarWidth(nextWidth);
    };

    const handleMouseUp = () => {
      isResizing.current = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [sidebarWidth]);

  const isCollapsed = sidebarWidth <= 100;

  const selectedNote = notes.find((n) => n.id === selectedNoteId);

  const filteredNotes = notes.filter((n) => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const noteTheme = selectedNote?.theme || (systemTheme === "light" ? "light" : "dark");

  // 테마별 사이드바 스타일 정의
  const sidebarClass = 
    noteTheme === "light" || noteTheme === "grid"
      ? "bg-[#F5F5F7] text-gray-700 border-r border-gray-200 flex flex-col shrink-0 transition-colors relative animate-in slide-in-from-left duration-300"
      : noteTheme === "dark"
      ? "bg-[#1E1E20] text-gray-200 border-r border-[#131315] flex flex-col shrink-0 transition-colors relative animate-in slide-in-from-left duration-300"
      : "bg-[#EFE7D8] text-[#4A3728] border-r border-[#D8C6AC] flex flex-col shrink-0 transition-colors relative animate-in slide-in-from-left duration-300"; // sepia

  const sidebarHeaderClass = 
    noteTheme === "light" || noteTheme === "grid"
      ? "p-4 border-b border-gray-200 flex justify-between items-center shrink-0"
      : noteTheme === "dark"
      ? "p-4 border-b border-[#131315] flex justify-between items-center shrink-0"
      : "p-4 border-b border-[#D8C6AC] flex justify-between items-center shrink-0"; // sepia

  const sidebarTitleClass = 
    noteTheme === "light" || noteTheme === "grid"
      ? "text-sm font-bold text-gray-800 flex items-center gap-1.5"
      : noteTheme === "dark"
      ? "text-sm font-bold text-gray-200 flex items-center gap-1.5"
      : "text-sm font-bold text-[#4A3728] flex items-center gap-1.5"; // sepia

  const sidebarBtnClass = 
    noteTheme === "light" || noteTheme === "grid"
      ? "p-1.5 hover:bg-gray-200/80 rounded-lg text-gray-600 transition-all active:scale-95 cursor-pointer border border-gray-200"
      : noteTheme === "dark"
      ? "p-1.5 hover:bg-white/10 rounded-lg text-gray-400 transition-all active:scale-95 cursor-pointer border border-white/5"
      : "p-1.5 hover:bg-[#E2D0B6] rounded-lg text-[#4A3728] transition-all active:scale-95 cursor-pointer border border-[#D8C6AC]/50"; // sepia

  const searchContainerClass = 
    noteTheme === "light" || noteTheme === "grid"
      ? "flex items-center gap-1.5 px-2 py-1.5 bg-gray-200/40 border border-gray-250/70 focus-within:border-indigo-500 rounded-lg transition-all"
      : noteTheme === "dark"
      ? "flex items-center gap-1.5 px-2 py-1.5 bg-black/30 border border-[#131315] focus-within:border-surface-700 rounded-lg transition-all"
      : "flex items-center gap-1.5 px-2 py-1.5 bg-[#FBF6EC]/50 border border-[#D8C6AC] focus-within:border-[#7A604D] rounded-lg transition-all"; // sepia

  const searchInputClass = 
    noteTheme === "light" || noteTheme === "grid"
      ? "bg-transparent text-xs text-gray-800 placeholder-gray-400 outline-none w-full"
      : noteTheme === "dark"
      ? "bg-transparent text-xs text-gray-200 placeholder-gray-500 outline-none w-full"
      : "bg-transparent text-xs text-[#4A3728] placeholder-[#7A604D]/40 outline-none w-full"; // sepia

  const searchIconColor = 
    noteTheme === "light" || noteTheme === "grid"
      ? "text-gray-400"
      : noteTheme === "dark"
      ? "text-gray-500"
      : "text-[#7A604D]/60"; // sepia

  const getListItemClass = (isActive: boolean) => {
    const base = "group relative flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border shadow-sm duration-200 hover:-translate-y-[1px] hover:scale-[1.01]";
    if (noteTheme === "light" || noteTheme === "grid") {
      return `${base} ${
        isActive
          ? "bg-white text-indigo-700 border-indigo-150 shadow-inner font-bold"
          : "bg-white/40 text-gray-600 border-gray-200/50 hover:bg-white hover:text-gray-800"
      }`;
    } else if (noteTheme === "dark") {
      return `${base} ${
        isActive
          ? "bg-[#2B2B2E] text-white border-white/5 shadow-inner font-bold"
          : "bg-[#2B2B2E]/30 text-gray-400 border-transparent hover:bg-[#2B2B2E]/75 hover:text-white"
      }`;
    } else {
      // sepia
      return `${base} ${
        isActive
          ? "bg-[#FBF6EC] text-[#4A3728] border-[#D8C6AC] shadow-inner font-bold"
          : "bg-[#FBF6EC]/35 text-[#7A604D] border-[#D8C6AC]/40 hover:bg-[#FBF6EC] hover:text-[#4A3728]"
      }`;
    }
  };

  const splitterClass = 
    noteTheme === "light" || noteTheme === "grid"
      ? "w-1.5 hover:w-2 bg-gray-200 hover:bg-indigo-500/50 cursor-col-resize shrink-0 transition-all select-none z-40 relative group"
      : noteTheme === "dark"
      ? "w-1.5 hover:w-2 bg-[#1A1A1C] hover:bg-amber-500/60 cursor-col-resize shrink-0 transition-all select-none z-40 relative group"
      : "w-1.5 hover:w-2 bg-[#D8C6AC] hover:bg-[#7A604D]/60 cursor-col-resize shrink-0 transition-all select-none z-40 relative group"; // sepia

  return (
    <div className="h-full flex flex-row overflow-hidden bg-surface-50 dark:bg-surface-950 font-sans select-none">
      {/* Left List Pane */}
      <div 
        style={{ width: `${sidebarWidth}px` }}
        className={sidebarClass}
      >
        {/* Header */}
        <div className={`${sidebarHeaderClass} ${isCollapsed ? "justify-center px-1" : ""}`}>
          {!isCollapsed && (
            <div 
              onClick={toggleSidebar}
              className="flex items-center cursor-pointer hover:opacity-80 active:scale-[0.98] transition-all"
              title="Collapse Sidebar"
            >
              <div className="p-1.5 rounded-lg bg-[#6366f1] text-white shrink-0 shadow-sm flex items-center justify-center mr-2">
                <BookOpen size={13} strokeWidth={2.2} />
              </div>
              <h2 className={sidebarTitleClass}>Spring Note</h2>
            </div>
          )}
          <div className={`flex items-center gap-1 ${isCollapsed ? "flex-col w-full justify-center" : ""}`}>
            {isCollapsed && (
              /* 사이드바 접기/펼치기 토글 단추 */
              <button
                onClick={toggleSidebar}
                className="w-8 h-8 flex items-center justify-center bg-[#6366f1] hover:bg-[#5558e6] text-white rounded-lg shadow-md transition-all duration-200 active:scale-90 hover:scale-105 cursor-pointer"
                title="Expand Sidebar"
              >
                <BookOpen size={15} strokeWidth={2.2} />
              </button>
            )}
            {!isCollapsed && (
              <button
                onClick={handleCreateNote}
                className={sidebarBtnClass}
                title={lang === "ko" ? "새 노트" : lang === "ja" ? "新規ノート" : "New Note"}
              >
                <Plus size={14} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        {!isCollapsed && (
          <div className="px-3 py-2 shrink-0">
            <div className={searchContainerClass}>
              <Search size={14} className={searchIconColor} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === "ko" ? "검색..." : lang === "ja" ? "検索..." : "Search..."}
                className={searchInputClass}
              />
            </div>
          </div>
        )}

        {/* List */}
        <div className={`flex-1 overflow-y-auto ${isCollapsed ? "p-1.5 space-y-2" : "p-3 space-y-2.5"} scrollbar-thin scrollbar-thumb-white/10 dark:scrollbar-thumb-surface-800`}>
          {loading ? (
            !isCollapsed ? (
              <div className="text-xs text-[#EBDCB9]/50 text-center py-4">Loading...</div>
            ) : (
              <div className="flex justify-center py-2 animate-pulse">
                <Book size={14} className="text-gray-500" />
              </div>
            )
          ) : filteredNotes.length === 0 ? (
            !isCollapsed && (
              <div className="text-xs text-[#EBDCB9]/50 text-center py-8">
                {lang === "ko" ? "작성된 노트가 없습니다" : lang === "ja" ? "ノート가 없습니다" : "No notebooks found"}
              </div>
            )
          ) : (
            filteredNotes.map((note) => {
              const isActive = note.id === selectedNoteId;
              const c = getNoteColor(note.id);
              return isCollapsed ? (
                <div
                  key={note.id}
                  onClick={() => setSelectedNoteId(note.id)}
                  className={`flex justify-center items-center p-2.5 rounded-lg cursor-pointer transition-all border duration-200 hover:scale-[1.05] ${
                    noteTheme === "light" || noteTheme === "grid"
                      ? isActive
                        ? `${c.bgLightActive} ${c.borderLightActive}`
                        : "bg-white/40 text-gray-550 border-gray-105 hover:bg-white hover:border-gray-300"
                      : noteTheme === "dark"
                      ? isActive
                        ? `${c.bgDarkActive} ${c.borderDarkActive}`
                        : "bg-[#2B2B2E]/30 text-gray-550 border-transparent hover:bg-[#2B2B2E]/70 hover:border-white/10"
                      : isActive // sepia
                      ? `${c.bgSepiaActive} ${c.borderSepiaActive}`
                      : "bg-[#FBF6EC]/35 text-[#7A604D]/70 border-[#D8C6AC]/20 hover:bg-[#FBF6EC] hover:text-[#D8C6AC]/30"
                  }`}
                  title={note.title}
                >
                  <Book size={15} className={`${c.text} shrink-0`} />
                </div>
              ) : (
                <div
                  key={note.id}
                  onClick={() => setSelectedNoteId(note.id)}
                  className={`group relative flex items-center justify-between p-2.5 px-3.5 rounded-xl cursor-pointer transition-all border shadow-sm duration-200 hover:-translate-y-[0.5px] hover:scale-[1.005] ${
                    noteTheme === "light" || noteTheme === "grid"
                      ? isActive
                        ? `${c.bgLightActive} ${c.borderLightActive} font-extrabold text-indigo-950`
                        : `${c.bgLight} ${c.borderLight} text-gray-655 hover:text-gray-900`
                      : noteTheme === "dark"
                      ? isActive
                        ? `${c.bgDarkActive} ${c.borderDarkActive} font-extrabold text-white`
                        : `${c.bgDark} ${c.borderDark} text-gray-400 hover:text-white`
                      : isActive // sepia
                      ? `${c.bgSepiaActive} ${c.borderSepiaActive} font-extrabold text-[#4A3728]`
                      : `${c.bgSepia} ${c.borderSepia} text-[#7A604D] hover:text-[#4A3728]`
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Book size={13} className={`${c.text} shrink-0`} />
                    <span className="text-xs truncate pr-2 font-bold">{note.title}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteNote(note.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 text-gray-450 hover:text-red-400 rounded transition-all shrink-0 active:scale-90"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer for Help/Shortcuts */}
        <div className={
          noteTheme === "light" || noteTheme === "grid"
            ? `border-t border-gray-250/80 flex items-center justify-between shrink-0 bg-gray-100/30 ${isCollapsed ? "p-1.5" : "p-2"}`
            : noteTheme === "dark"
            ? `border-t border-[#131315] flex items-center justify-between shrink-0 bg-black/10 ${isCollapsed ? "p-1.5" : "p-2"}`
            : `border-t border-[#D8C6AC] flex items-center justify-between shrink-0 bg-[#E2D0B6]/20 ${isCollapsed ? "p-1.5" : "p-2"}`
        }>
          <button
            onClick={() => setIsShortcutGuideOpen(true)}
            className={`w-full flex items-center justify-center transition-all active:scale-[0.98] cursor-pointer border ${
              isCollapsed ? "p-1.5 rounded-lg" : "gap-1.5 py-1 px-3 text-xs font-extrabold rounded-lg"
            } ${
              noteTheme === "light" || noteTheme === "grid"
                ? "bg-white hover:bg-gray-50 border-gray-200 text-gray-600 hover:text-gray-955 shadow-sm"
                : noteTheme === "dark"
                ? "bg-[#2B2B2E]/30 hover:bg-[#2B2B2E]/70 border-white/5 text-gray-400 hover:text-white shadow-sm"
                : "bg-[#FBF6EC]/35 hover:bg-[#FBF6EC] border-[#D8C6AC]/30 text-[#7A604D] hover:text-[#4A3728] shadow-sm"
            }`}
            title={lang === "ko" ? "가이드" : "Guide"}
          >
            <Keyboard size={12} className={isCollapsed ? "scale-110" : ""} />
            {!isCollapsed && <span>{lang === "ko" ? "가이드" : "Guide"}</span>}
          </button>
        </div>
      </div>

      {/* 마우스 드래그 좌우 너비 조절 스플리터 바 */}
      <div
        onMouseDown={startResizing}
        className={splitterClass}
        title="Drag to adjust width"
      >
        {/* 드래그 호버 가이드 피드백선 */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-transparent group-hover:bg-amber-400/80 transition-colors" />
      </div>

      {/* Right Main Editor Pane */}
      <div 
        className={`flex-1 h-full overflow-hidden flex flex-col min-w-0 transition-colors duration-300 ${
          noteTheme === "light" || noteTheme === "grid"
            ? "bg-[#ECEFF1] dark:bg-surface-950/20"
            : noteTheme === "dark"
            ? "bg-[#1E1E1E] dark:bg-surface-950"
            : "bg-[#3B281B] dark:bg-[#1E1E20]" // sepia
        }`}
      >
        {selectedNote ? (
          <SpringNotePanel
            taskId={selectedNote.id}
            onClose={() => {}}
            onThemeChange={(newTheme) => {
              setNotes((prev) =>
                prev.map((n) => (n.id === selectedNote.id ? { ...n, theme: newTheme } : n))
              );
            }}
            t={t}
            lang={lang}
          />
        ) : (
          <div className={`flex-1 flex flex-col items-center justify-center gap-4 text-center p-8 transition-colors duration-300 ${
            noteTheme === "light" || noteTheme === "grid"
              ? "bg-[#ECEFF1] text-gray-800"
              : noteTheme === "dark"
              ? "bg-[#1E1E1E] text-gray-200"
              : "bg-[#3B281B] text-[#EBDCB9]" // sepia
          }`}>
            <div className={`p-4 rounded-2xl shadow-inner animate-pulse ${
              noteTheme === "light" || noteTheme === "grid"
                ? "bg-gray-200 text-amber-600"
                : noteTheme === "dark"
                ? "bg-white/5 text-amber-500"
                : "bg-black/15 text-amber-500"
            }`}>
              <Book size={48} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className={`text-base font-bold ${
                noteTheme === "light" || noteTheme === "grid"
                  ? "text-gray-800"
                  : noteTheme === "dark"
                  ? "text-gray-150"
                  : "text-[#FBF6EC]"
              }`}>
                {lang === "ko" ? "스프링 필기장" : lang === "ja" ? "スプリングノート" : "Spring Note Editor"}
              </h3>
              <p className={`text-xs mt-1 max-w-xs leading-normal ${
                noteTheme === "light" || noteTheme === "grid"
                  ? "text-gray-500"
                  : noteTheme === "dark"
                  ? "text-gray-400"
                  : "text-[#7A604D]"
              }`}>
                {lang === "ko" 
                  ? "노션/에버노트처럼 무제한 노트를 생성해 아이디어를 아날로그 필기로 아카이빙해 보세요." 
                  : lang === "ja" 
                  ? "ノートを作成し、アイデア를 아날로그 라이팅으로 아카이빙해보세요." 
                  : "Create notebooks to archive your ideas and clippings with analog styled pages."}
              </p>
            </div>
            <button
              onClick={handleCreateNote}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-black/10 active:scale-95 transition-all cursor-pointer ${
                noteTheme === "light" || noteTheme === "grid"
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                  : noteTheme === "dark"
                  ? "bg-[#2B2B2E] hover:bg-[#2B2B2E]/90 text-white border border-white/5"
                  : "bg-[#EBDCB9] hover:bg-[#EBDCB9]/95 text-[#3B281B]"
              }`}
            >
              <Plus size={14} strokeWidth={2.5} />
              {lang === "ko" ? "새 노트 만들기" : lang === "ja" ? "新規ノート作成" : "Create New Notebook"}
            </button>
          </div>
        )}
      {/* V6: 수려한 다이어리 감성의 노트 삭제 확인 커스텀 모달 */}
      {isNoteDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-[#3B281B] dark:bg-[#1E1E20] border border-[#2D1E15] dark:border-[#2D2D30] rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200 text-[#EBDCB9]">
            <h3 className="text-sm font-bold text-[#FBF6EC] dark:text-gray-150 mb-2">
              {lang === "ko" ? "스프링 노트 삭제" : lang === "ja" ? "ノート削除の確認" : "Delete Note Confirm"}
            </h3>
            <p className="text-xs text-gray-300 dark:text-gray-400 mb-6 leading-relaxed">
              {lang === "ko" 
                ? "정말로 이 노트를 영구적으로 삭제하시겠습니까?\n작성된 모든 페이지와 객체가 사라집니다."
                : lang === "ja"
                ? "本当にこのノートを永久に削除しますか？\n作成されたすべてのページとオブジェクトが失われます。"
                : "Are you sure you want to delete this note?\nAll pages and objects will be permanently lost."}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsNoteDeleteModalOpen(false);
                  setNoteIdToDelete(null);
                }}
                className="flex-1 py-2 text-xs font-bold text-[#EBDCB9] bg-white/10 hover:bg-white/15 active:scale-95 transition-all rounded-xl border border-white/5 cursor-pointer"
              >
                {lang === "ko" ? "취소" : lang === "ja" ? "キャンセル" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={confirmDeleteNote}
                className="flex-1 py-2 text-xs font-bold text-[#3B281B] bg-red-400 hover:bg-red-500 active:scale-95 transition-all rounded-xl shadow-md shadow-red-900/10 cursor-pointer"
              >
                {lang === "ko" ? "삭제" : lang === "ja" ? "삭제" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* 스프링노트 전용 단축키 가이드 모달 */}
      {isShortcutGuideOpen && (
        <SpringNoteShortcutGuide 
          onClose={() => setIsShortcutGuideOpen(false)} 
          lang={lang}
        />
      )}
    </div>
  );
}
