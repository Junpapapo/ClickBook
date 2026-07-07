import React, { useState, useEffect, useRef, useMemo } from "react";
import { Book, Plus, Search, Trash2, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import type { SpringNote } from "@/shared/types";
import { getAllSpringNotes, saveSpringNote, deleteSpringNote } from "@/utils/springNoteDb";
import SpringNotePanel from "./TodoBoard/SpringNote/SpringNotePanel";
import { useLang } from "@/shared/LanguageContext";

interface SpringNoteBoardProps {
  lang?: string;
  t?: (key: string, replacements?: Record<string, any>) => string;
}

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

  // 노트 삭제 확인용 커스텀 모달 상태 추가
  const [isNoteDeleteModalOpen, setIsNoteDeleteModalOpen] = useState(false);
  const [noteIdToDelete, setNoteIdToDelete] = useState<string | null>(null);

  // 1. 드래그식 좌우 폭 조절 상태 추가 (기본 240px)
  const [sidebarWidth, setSidebarWidth] = useState<number>(240);
  const isResizing = useRef(false);
  const dragStartX = useRef<number>(0);
  const dragStartWidth = useRef<number>(0);

  useEffect(() => {
    loadNotes();
  }, []);

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
    if (sidebarWidth > 170) {
      setSidebarWidth(170);
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
      
      // 최소 170px ~ 최대 420px 로 폭 제한
      const nextWidth = Math.max(170, Math.min(420, targetWidth));
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

  const selectedNote = notes.find((n) => n.id === selectedNoteId);

  const filteredNotes = notes.filter((n) => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-row overflow-hidden bg-surface-50 dark:bg-surface-950 font-sans select-none">
      {/* Left List Pane (엠보싱 가죽 다이어리 겉커버 톤 매치) */}
      <div 
        style={{ width: `${sidebarWidth}px` }}
        className="border-r border-[#2D1E15] dark:border-[#1A1A1C] bg-[#3B281B] dark:bg-[#1E1E20] flex flex-col shrink-0 text-[#EBDCB9] transition-colors relative"
      >
        {/* Header (나의 필기장 대신 Spring Note 라고 선언) */}
        <div className="p-4 border-b border-[#2D1E15] dark:border-[#131315] flex justify-between items-center shrink-0">
          <h2 className="text-sm font-bold text-[#EBDCB9] dark:text-gray-350 flex items-center gap-1.5">
            <Book size={16} className="text-amber-500/80" />
            Spring Note
          </h2>
          <div className="flex items-center gap-1">
            {/* 사이드바 접기/펼치기 토글 단추 */}
            <button
              onClick={toggleSidebar}
              className="p-1.5 hover:bg-white/10 rounded-lg text-[#EBDCB9] dark:text-gray-400 transition-all active:scale-95 cursor-pointer border border-[#EBDCB9]/10"
              title={sidebarWidth <= 170 ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {sidebarWidth <= 170 ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
            <button
              onClick={handleCreateNote}
              className="p-1.5 hover:bg-white/10 rounded-lg text-[#EBDCB9] dark:text-gray-400 transition-all active:scale-95 cursor-pointer border border-[#EBDCB9]/10"
              title={lang === "ko" ? "새 노트" : lang === "ja" ? "新規ノート" : "New Note"}
            >
              <Plus size={14} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 py-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2 py-1.5 bg-[#2D1E15]/50 dark:bg-black/30 border border-[#2D1E15] dark:border-[#131315] focus-within:border-amber-600/70 dark:focus-within:border-surface-700 rounded-lg transition-all">
            <Search size={14} className="text-[#EBDCB9]/60" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === "ko" ? "검색..." : lang === "ja" ? "検索..." : "Search..."}
              className="bg-transparent text-xs text-[#FBF6EC] dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 outline-none w-full"
            />
          </div>
        </div>

        {/* List (가죽 다이어리 내 네임택 카드 위젯 형태로 변형하여 겉돌지 않게 가공) */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin scrollbar-thumb-white/10 dark:scrollbar-thumb-surface-800">
          {loading ? (
            <div className="text-xs text-[#EBDCB9]/50 text-center py-4">Loading...</div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-xs text-[#EBDCB9]/50 text-center py-8">
              {lang === "ko" ? "작성된 노트가 없습니다" : lang === "ja" ? "ノートがありません" : "No notebooks found"}
            </div>
          ) : (
            filteredNotes.map((note) => {
              const isActive = note.id === selectedNoteId;
              return (
                <div
                  key={note.id}
                  onClick={() => setSelectedNoteId(note.id)}
                  className={`group relative flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border shadow-sm duration-200 hover:-translate-y-[1px] hover:scale-[1.01] ${
                    isActive
                      ? "bg-[#2D1E15] text-[#FBF6EC] border-[#EADCC6]/35 shadow-inner ring-1 ring-white/5 font-bold"
                      : "bg-[#2D1E15]/30 text-gray-300 border-[#2D1E15]/50 hover:bg-[#2D1E15]/75 hover:text-white hover:border-[#EADCC6]/20"
                  }`}
                >
                  <span className="text-xs truncate pr-5">{note.title}</span>
                  <button
                    onClick={(e) => handleDeleteNote(note.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 text-gray-300 hover:text-red-400 rounded transition-all shrink-0 active:scale-90"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 마우스 드래그 좌우 너비 조절 스플리터 바 (클래식 가죽 바인더 매치) */}
      <div
        onMouseDown={startResizing}
        className="w-1.5 hover:w-2 bg-[#2D1E15]/80 hover:bg-amber-600/70 dark:bg-[#1A1A1C] dark:hover:bg-amber-500/60 cursor-col-resize shrink-0 transition-all select-none z-40 relative group"
        title="Drag to adjust width"
      >
        {/* 드래그 호버 가이드 피드백선 */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-transparent group-hover:bg-amber-400/80 transition-colors" />
      </div>

      {/* Right Main Editor Pane */}
      <div 
        className={`flex-1 h-full overflow-hidden flex flex-col min-w-0 transition-colors duration-300 ${
          selectedNote
            ? selectedNote.theme === "light" || selectedNote.theme === "grid"
              ? "bg-[#ECEFF1] dark:bg-surface-950/20"
              : selectedNote.theme === "dark"
              ? "bg-[#1E1E1E] dark:bg-surface-950"
              : "bg-[#3B281B] dark:bg-[#1E1E20]" // sepia
            : "bg-[#F5EFE6] dark:bg-surface-950/20" // 대기 상태
        }`}
      >
        {selectedNote ? (
          <SpringNotePanel
            taskId={selectedNote.id}
            onClose={() => {}}
            t={t}
            lang={lang}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8 bg-[#F5EFE6] dark:bg-surface-950/30 text-[#4A3728] dark:text-[#EBDCB9] transition-colors duration-300">
            <div className="p-4 bg-black/5 dark:bg-white/10 text-amber-500 rounded-2xl shadow-inner animate-pulse">
              <Book size={48} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#4A3728] dark:text-gray-200">
                {lang === "ko" ? "스프링 필기장" : lang === "ja" ? "スプリングノート" : "Spring Note Editor"}
              </h3>
              <p className="text-xs text-[#7A604D] dark:text-gray-400 mt-1 max-w-xs leading-normal">
                {lang === "ko" 
                  ? "노션/에버노트처럼 무제한 노트를 생성해 아이디어를 아날로그 필기로 아카이빙해 보세요." 
                  : lang === "ja" 
                  ? "ノートを作成し、アイデアをアナログライティングでアーカイブしてみましょう。" 
                  : "Create notebooks to archive your ideas and clippings with analog styled pages."}
              </p>
            </div>
            <button
              onClick={handleCreateNote}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#EBDCB9] hover:bg-[#EBDCB9]/95 text-[#3B281B] rounded-xl text-xs font-bold shadow-md shadow-black/10 active:scale-95 transition-all cursor-pointer"
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
                {lang === "ko" ? "삭제" : lang === "ja" ? "削除" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
