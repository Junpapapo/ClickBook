import React, { useState, useEffect, useRef } from "react";
import { 
  Plus, 
  Trash2, 
  FolderOpen, 
  Maximize2,
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Code,
  Highlighter,
  Heading1,
  Heading2,
  Pilcrow,
  List,
  ListOrdered,
  ListTodo,
  Code2,
  Quote,
  Minus,
  Indent as IndentIcon,
  Outdent as OutdentIcon,
  Table as TableIcon,
  Eraser,
  Undo2,
  Redo2,
  Baseline,
  Paperclip,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ChevronDown,
  ImagePlus,
  Link as LinkIcon,
  Check,
  ExternalLink,
  StickyNote
} from "lucide-react";
import type { SpringNoteToolbarProps } from "../spring-note-types";

export default function SpringNoteToolbar({
  editor,
  theme,
  onChangeTheme,
  font,
  onChangeFont,
  fontSize,
  onChangeFontSize,
  onAddPage,
  onDeletePage,
  onToggleDrawer,
  isDrawerOpen,
  onClose,
  onInsertTable,
  onInsertMemo,
  isMiniMode,
  onMaximize,
  onApplyTextColor,
  onApplyHighlightColor,
  pages,
  currentPageIndex,
  onChangePageIndex,
  onToggleImagePopover,
}: SpringNoteToolbarProps) {
  // 색상 토글 팝오버 상태
  const [showColorPopover, setShowColorPopover] = useState(false);
  // 헤딩 & 리스트 드롭다운 상태 추가
  const [showHeadingDropdown, setShowHeadingDropdown] = useState(false);
  const [showListDropdown, setShowListDropdown] = useState(false);
  // 링크 팝오버 관련 상태
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  useEffect(() => {
    if (showLinkPopover && editor) {
      setLinkUrl(editor.getAttributes("link").href || "");
    }
  }, [showLinkPopover, editor]);

  const handleApplyLink = () => {
    if (!editor) return;
    if (linkUrl.trim() === "") {
      editor.chain().focus().unsetLink().run();
    } else {
      let formattedUrl = linkUrl.trim();
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = `https://${formattedUrl}`;
      }
      editor.chain().focus().setLink({ href: formattedUrl }).run();
    }
    setShowLinkPopover(false);
  };

  const handleUnlink = () => {
    if (!editor) return;
    editor.chain().focus().unsetLink().run();
    setShowLinkPopover(false);
  };

  // 문서 전역 클릭 핸들러 (팝오버 외부 영역 클릭 시에만 닫히도록 완벽 보완)
  useEffect(() => {
    const handleDocumentClick = () => {
      setShowColorPopover(false);
      setShowHeadingDropdown(false);
      setShowListDropdown(false);
      setShowLinkPopover(false);
    };
    window.addEventListener("click", handleDocumentClick);
    return () => {
      window.removeEventListener("click", handleDocumentClick);
    };
  }, []);

  const isLightTheme = theme === "light" || theme === "grid";

  // 테마별 컨테이너 스타일 정의
  const containerClass = isLightTheme
    ? "bg-[#F3F4F6] text-gray-800 border-b border-gray-250/80"
    : theme === "sepia"
    ? "bg-[#EADCC6] text-[#4A3728] border-b border-[#D8C6AC]"
    : "bg-[#1E1E20] border-b border-[#131315] text-gray-200";

  // 테마별 내부 서브 패널 스타일
  const subPanelClass = isLightTheme
    ? "bg-white border border-gray-250/80 shadow-sm"
    : theme === "sepia"
    ? "bg-[#FBF6EC] border border-[#D8C6AC] text-[#4A3728]"
    : "bg-[#2D2D30] border border-[#3E3E42]";

  // 테마별 일반 버튼 스타일
  const btnClass = isLightTheme
    ? "text-gray-655 hover:text-gray-900 hover:bg-gray-150"
    : theme === "sepia"
    ? "text-[#7A604D] hover:text-[#4A3728] hover:bg-[#EFE7D8]"
    : "text-gray-300 hover:text-white hover:bg-white/5";

  // 테마별 세퍼레이터 구분선 스타일
  const dividerClass = isLightTheme
    ? "w-px h-4 bg-gray-250/85 shrink-0"
    : theme === "sepia"
    ? "w-px h-4 bg-[#D8C6AC] shrink-0"
    : "w-px h-4 bg-surface-750 shrink-0";

  // Tiptap 에디터의 활성화 여부를 스타일 클래스로 리턴해주는 헬퍼
  const getActiveBtnClass = (name: string, attributes?: Record<string, any>) => {
    if (!editor) return "text-gray-400 opacity-50 pointer-events-none";
    const isActive = editor.isActive(name, attributes);
    if (isActive) {
      return isLightTheme
        ? "bg-amber-500/10 text-amber-800 font-extrabold border border-amber-500/25 shadow-inner scale-[0.97]"
        : theme === "sepia"
        ? "bg-[#7A604D]/15 text-[#4A3728] font-extrabold border border-[#7A604D]/25 shadow-inner scale-[0.97]"
        : "bg-amber-500/20 text-[#EBDCB9] font-extrabold border border-amber-500/35 shadow-inner scale-[0.97]";
    }
    return btnClass;
  };

  // TextAlign의 활성화 여부를 스타일 클래스로 리턴해주는 헬퍼
  const getAlignBtnClass = (alignment: "left" | "center" | "right" | "justify") => {
    if (!editor) return "text-gray-400 opacity-50 pointer-events-none";
    let isActive = false;
    if (alignment === "left") {
      isActive = editor.isActive({ textAlign: "left" }) || (
        !editor.isActive({ textAlign: "center" }) &&
        !editor.isActive({ textAlign: "right" }) &&
        !editor.isActive({ textAlign: "justify" })
      );
    } else {
      isActive = editor.isActive({ textAlign: alignment });
    }
    if (isActive) {
      return isLightTheme
        ? "bg-amber-500/10 text-amber-800 font-extrabold border border-amber-500/25 shadow-inner scale-[0.97]"
        : "bg-amber-500/20 text-[#EBDCB9] font-extrabold border border-amber-500/35 shadow-inner scale-[0.97]";
    }
    return btnClass;
  };

  return (
    <div 
      className={`flex flex-col gap-1.5 px-4 py-1.5 transition-colors duration-300 shadow-sm select-none shrink-0 w-full overflow-visible z-30 ${containerClass}`}
      onClick={(e) => {
        // 툴바 내부 영역 클릭 시 window click 핸들러가 터져 팝오버가 꺼지는 현상 원천 차단
        e.stopPropagation();
      }}
    >
      {/* 1열: 테마(Themes), 글꼴(Fonts) 선택 및 전체 페이지네이션 */}
      <div className="flex flex-nowrap items-center justify-between w-full gap-2 shrink-0">
        <div className="flex flex-nowrap items-center gap-2">
          {/* Themes */}
          <div className={`flex items-center p-0.5 rounded-lg border transition-all duration-300 ${subPanelClass}`}>
            {(["light", "sepia", "dark", "grid"] as const).map((t) => {
              const isSelected = theme === t;
              let btnStyle = "";
              if (isSelected) {
                btnStyle = isLightTheme
                  ? "bg-amber-500/10 text-amber-800 shadow-sm font-bold border border-amber-500/20"
                  : "bg-[#EADCC6]/20 dark:bg-white/10 text-white shadow-sm font-bold border border-[#EADCC6]/15";
              } else {
                btnStyle = isLightTheme ? "text-gray-500 hover:text-gray-900" : "text-gray-300 hover:text-white";
              }
              return (
                <button
                  key={t}
                  onClick={() => onChangeTheme(t)}
                  className={`px-2 py-0.5 text-[11px] font-semibold rounded transition-all capitalize ${btnStyle}`}
                >
                  {t}
                </button>
              );
            })}
          </div>

          {/* Fonts */}
          <div className={`flex items-center p-0.5 rounded-lg border transition-all duration-300 ${subPanelClass}`}>
            {(["serif", "sans", "mono", "pretendard"] as const).map((f) => {
              const isSelected = font === f;
              let btnStyle = "";
              if (isSelected) {
                btnStyle = isLightTheme
                  ? "bg-amber-500/10 text-amber-800 shadow-sm font-bold border border-amber-500/20"
                  : "bg-[#EADCC6]/20 dark:bg-white/10 text-white shadow-sm font-bold border border-[#EADCC6]/15";
              } else {
                btnStyle = isLightTheme ? "text-gray-500 hover:text-gray-900" : "text-gray-300 hover:text-white";
              }
              return (
                <button
                  key={f}
                  onClick={() => onChangeFont(f)}
                  className={`px-2 py-0.5 text-[11px] font-semibold rounded transition-all capitalize ${btnStyle}`}
                >
                  {f}
                </button>
              );
            })}
          </div>

          {/* Font Size */}
          <div className={`flex items-center p-0.5 rounded-lg border transition-all duration-300 ${subPanelClass}`}>
            <button
              type="button"
              onClick={() => onChangeFontSize(Math.max(12, fontSize - 1))}
              className={`w-6 py-0.5 text-xs font-bold rounded transition-all text-center ${
                isLightTheme ? "text-gray-600 hover:text-gray-900 hover:bg-gray-150" : "text-gray-300 hover:text-white hover:bg-white/10"
              }`}
              title="Decrease Font Size"
            >
              A-
            </button>
            <span className={`px-1 text-[10px] font-mono font-bold select-none ${isLightTheme ? "text-gray-600" : "text-gray-400"}`}>
              {fontSize}
            </span>
            <button
              type="button"
              onClick={() => onChangeFontSize(Math.min(26, fontSize + 1))}
              className={`w-6 py-0.5 text-xs font-bold rounded transition-all text-center ${
                isLightTheme ? "text-gray-600 hover:text-gray-900 hover:bg-gray-150" : "text-gray-300 hover:text-white hover:bg-white/10"
              }`}
              title="Increase Font Size"
            >
              A+
            </button>
          </div>
        </div>

        {/* Page Actions & Library Toggle Group */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Toggle Library Drawer */}
          <button
            type="button"
            onClick={onToggleDrawer}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border transition-all shrink-0 ${
              isDrawerOpen
                ? isLightTheme
                  ? "bg-amber-500/20 border-amber-500/35 text-amber-900"
                  : "bg-[#EADCC6]/25 border-[#EADCC6]/35 text-white"
                : isLightTheme
                ? "bg-white border-gray-250/80 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                : "bg-[#2D1E15]/50 dark:bg-surface-900 border-[#2D1E15] dark:border-surface-700 text-[#EBDCB9]/80 hover:bg-white/10 hover:text-white"
            }`}
            title="Import Bookmark or Memo"
          >
            <FolderOpen size={12} />
            <span>Library</span>
          </button>

          {/* 페이지 색인 탭 [ 1 | 2 | 3 | + | - ] */}
          <div className={`flex items-center p-0.5 rounded-lg border gap-1 shrink-0 transition-colors duration-300 ${subPanelClass}`}>
            {pages.map((p, idx) => {
              const isActive = currentPageIndex === idx;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onChangePageIndex(idx)}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all ${
                    isActive
                      ? isLightTheme
                        ? "bg-amber-500/10 text-amber-800 font-extrabold shadow-sm border border-amber-500/25"
                        : "bg-[#EADCC6]/25 text-white font-extrabold shadow-sm border border-[#EADCC6]/20"
                      : isLightTheme
                      ? "text-gray-400 hover:text-gray-700"
                      : "text-gray-400 hover:text-white"
                  }`}
                  title={`Go to Page ${idx + 1}`}
                >
                  {idx + 1}
                </button>
              );
            })}
            
            <div className={`w-px h-3 mx-0.5 shrink-0 ${isLightTheme ? "bg-gray-250/80" : "bg-[#231710] dark:bg-surface-750"}`} />

            {/* 새 페이지 추가 (+) */}
            <button
              type="button"
              onClick={onAddPage}
              className={`p-1 rounded transition-all shrink-0 ${
                isLightTheme ? "text-amber-600 hover:text-amber-700 hover:bg-gray-100" : "text-amber-500 hover:text-amber-400 hover:bg-white/10"
              }`}
              title="Add New Page"
            >
              <Plus size={10} />
            </button>

            {/* 현재 페이지 삭제 (-) */}
            <button
              type="button"
              onClick={onDeletePage}
              className={`p-1 rounded transition-all shrink-0 ${
                isLightTheme ? "text-gray-400 hover:text-red-500 hover:bg-red-50" : "text-gray-400 hover:text-red-400 hover:bg-red-500/20"
              }`}
              title="Delete Current Page"
            >
              <Trash2 size={10} />
            </button>
          </div>

          {/* Maximize button */}
          {isMiniMode && onMaximize && (
            <>
              <div className="w-px h-5 bg-[#2D1E15] dark:bg-surface-700/60 mx-0.5 shrink-0" />
              <button
                type="button"
                onClick={onMaximize}
                className="p-1 text-[#EBDCB9]/75 hover:text-amber-400 hover:bg-white/10 rounded-lg transition-all shrink-0"
                title="Open in Full Workspace"
              >
                <Maximize2 size={13} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2열: 풍부한 WYSIWYG 편집 아이콘 툴바 (flex-wrap 및 overflow-visible 적용으로 팝오버 잘림 차단) */}
      {editor && (
        <div className={`flex flex-wrap items-center p-1 rounded-lg border gap-1.5 w-full overflow-visible shrink-0 transition-colors duration-300 ${subPanelClass}`}>
          {/* 그룹 1: 기본 글꼴 데코레이션 */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-1 rounded transition-all ${getActiveBtnClass("bold")}`}
              title="Bold (Ctrl+B)"
            >
              <Bold size={13} />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-1 rounded transition-all ${getActiveBtnClass("italic")}`}
              title="Italic (Ctrl+I)"
            >
              <Italic size={13} />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`p-1 rounded transition-all ${getActiveBtnClass("underline")}`}
              title="Underline (Ctrl+U)"
            >
              <Underline size={13} />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`p-1 rounded transition-all ${getActiveBtnClass("strike")}`}
              title="Strikethrough"
            >
              <Strikethrough size={13} />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleCode().run()}
              className={`p-1 rounded transition-all ${getActiveBtnClass("code")}`}
              title="Inline Code"
            >
              <Code size={13} />
            </button>

            {/* 링크 삽입 및 수정 팝오버 단추 */}
            <div className="relative flex items-center shrink-0">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLinkPopover(!showLinkPopover);
                  setShowColorPopover(false);
                  setShowHeadingDropdown(false);
                  setShowListDropdown(false);
                }}
                className={`p-1 rounded transition-all ${
                  showLinkPopover
                    ? isLightTheme
                      ? "bg-amber-500/20 text-amber-900 border border-amber-500/35"
                      : "bg-amber-500/25 text-white border border-amber-500/35"
                    : editor.isActive("link")
                    ? "bg-amber-500/10 text-amber-800 dark:text-[#EBDCB9]"
                    : btnClass
                }`}
                title="Link"
              >
                <LinkIcon size={13} />
              </button>

              {showLinkPopover && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className={`absolute top-full left-0 mt-1.5 p-1.5 rounded-lg shadow-2xl flex items-center gap-1 z-50 animate-in fade-in slide-in-from-top-1 duration-100 border ${
                    isLightTheme ? "bg-white border-gray-200 text-gray-800" : "bg-[#1e1e20] border-white/10 text-gray-200"
                  }`}
                >
                  <input
                    type="text"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleApplyLink();
                      }
                    }}
                    placeholder="https://..."
                    className={`w-36 rounded px-2 py-0.5 text-[11px] outline-none transition-colors border ${
                      isLightTheme
                        ? "bg-gray-50 border-gray-250 text-gray-800 focus:border-amber-500/50"
                        : "bg-white/5 border-white/10 text-gray-200 focus:border-amber-500/50"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleApplyLink}
                    className={`p-1 rounded transition-colors shrink-0 ${
                      isLightTheme ? "hover:bg-gray-100 text-amber-600" : "hover:bg-white/10 text-amber-400"
                    }`}
                    title="Apply"
                  >
                    <Check size={12} />
                  </button>
                  {editor.isActive("link") && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          const href = editor.getAttributes("link").href;
                          if (href) window.open(href, "_blank", "noopener,noreferrer");
                        }}
                        className={`p-1 rounded transition-colors shrink-0 ${
                          isLightTheme ? "hover:bg-gray-100 text-gray-600" : "hover:bg-white/10 text-gray-300"
                        }`}
                        title="Open Link"
                      >
                        <ExternalLink size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={handleUnlink}
                        className={`p-1 rounded transition-colors shrink-0 ${
                          isLightTheme ? "hover:bg-red-50 text-red-500" : "hover:bg-red-500/20 text-red-400"
                        }`}
                        title="Remove Link"
                      >
                        <Trash2 size={12} />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className={dividerClass} />

          {/* 그룹 2: 이미지 첨부(Add) & 글자 색상(Baseline) & 드로잉(Palette) */}
          <div className="flex items-center gap-1 shrink-0 relative">
            {/* Add 이미지 Upload 드롭다운 토글 */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                onToggleImagePopover?.();
                setShowColorPopover(false);
                setShowHeadingDropdown(false);
                setShowListDropdown(false);
              }}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border shrink-0 active:scale-95 transition-all ${
                isLightTheme
                  ? "bg-white border-gray-250/80 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  : "bg-[#2D1E15]/50 dark:bg-surface-900 border-[#2D1E15] dark:border-surface-700 text-[#EBDCB9]/80 hover:bg-white/10 hover:text-white"
              }`}
              title="Attach Image"
            >
              <ImagePlus size={13} />
              <span>Add</span>
              <ChevronDown size={10} className="opacity-70" />
            </button>

            {/* A 밑줄 색상 아이콘 */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowColorPopover(!showColorPopover);
              }}
              className={`p-1 rounded transition-all ${
                showColorPopover 
                  ? isLightTheme
                    ? "bg-amber-500/20 text-amber-900 border border-amber-500/35"
                    : "bg-amber-500/25 text-white border border-amber-500/35" 
                  : editor.isActive("textStyle") || editor.isActive("highlight")
                  ? isLightTheme
                    ? "bg-amber-500/10 text-amber-800"
                    : "bg-amber-500/10 text-[#EBDCB9]"
                  : btnClass
              }`}
              title="Text & Highlight Colors"
            >
              <Baseline size={13} />
            </button>

            {/* 그림 그리기(드로잉) 노드 생성 아이콘 */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                editor.chain().focus().insertContent({ type: "drawing" }).run();
              }}
              className={`p-1 rounded transition-all active:scale-95 ${btnClass}`}
              title="Insert Drawing Sketchpad"
            >
              <Palette size={13} />
            </button>

            {/* 통합 색상 선택기 팝오버 */}
            {showColorPopover && (
              <div 
                className={`absolute top-full left-0 mt-1.5 flex flex-col p-2.5 rounded-xl shadow-xl border gap-2.5 z-50 animate-in fade-in duration-100 min-w-56 ${
                  isLightTheme ? "bg-white border-gray-200/80 text-gray-800 shadow-xl" : "bg-slate-900 dark:bg-surface-950 border-white/10 text-gray-200"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                {/* 1) Text Color Section */}
                <div className="flex flex-col gap-1">
                  <span className={`text-[9px] font-bold uppercase tracking-wide ${isLightTheme ? "text-gray-500" : "text-gray-400"}`}>Text Color</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { key: "default", val: "#374151", desc: "Default" },
                      { key: "#ef4444", val: "#ef4444", desc: "Red" },
                      { key: "#f97316", val: "#f97316", desc: "Orange" },
                      { key: "#eab308", val: "#eab308", desc: "Yellow" },
                      { key: "#22c55e", val: "#22c55e", desc: "Green" },
                      { key: "#3b82f6", val: "#3b82f6", desc: "Blue" },
                      { key: "#a855f7", val: "#a855f7", desc: "Purple" },
                    ].map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (c.key === "default") {
                            editor.chain().focus().unsetColor().run();
                          } else {
                            editor.chain().focus().setColor(c.key).run();
                          }
                          setShowColorPopover(false);
                        }}
                        style={{ backgroundColor: c.val }}
                        className="w-4 h-4 rounded-full hover:scale-125 transition-transform border border-white/20 active:scale-90"
                        title={c.desc}
                      />
                    ))}
                  </div>
                </div>

                <div className={`w-full h-px ${isLightTheme ? "bg-gray-150" : "bg-white/10"}`} />

                {/* 2) Highlight Color Section */}
                <div className="flex flex-col gap-1">
                  <span className={`text-[9px] font-bold uppercase tracking-wide ${isLightTheme ? "text-gray-500" : "text-gray-400"}`}>Highlight Color</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { key: "default", val: "transparent", desc: "Clear" },
                      { key: "#fee2e2", val: "#fee2e2", desc: "Light Red" },
                      { key: "#ffedd5", val: "#ffedd5", desc: "Light Orange" },
                      { key: "#fef9c3", val: "#fef9c3", desc: "Light Yellow" },
                      { key: "#dcfce7", val: "#dcfce7", desc: "Light Green" },
                      { key: "#dbeafe", val: "#dbeafe", desc: "Light Blue" },
                      { key: "#f3e8ff", val: "#f3e8ff", desc: "Light Purple" },
                    ].map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (c.key === "default") {
                            editor.chain().focus().unsetHighlight().run();
                          } else {
                            editor.chain().focus().toggleHighlight({ color: c.key }).run();
                          }
                          setShowColorPopover(false);
                        }}
                        style={{ backgroundColor: c.val === "transparent" ? (isLightTheme ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.15)") : c.val }}
                        className="w-4 h-4 rounded-full hover:scale-125 transition-transform border border-white/20 active:scale-90"
                        title={c.desc}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={dividerClass} />

          {/* 그룹 3: 헤딩 스타일 드롭다운 */}
          <div className="flex items-center gap-0.5 shrink-0 relative">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                setShowHeadingDropdown(!showHeadingDropdown);
                setShowColorPopover(false);
                setShowListDropdown(false);
              }}
              className={`flex items-center gap-0.5 px-2.5 py-1 text-xs font-bold rounded-lg border transition-all shrink-0 active:scale-95 ${
                editor.isActive("heading")
                  ? isLightTheme
                    ? "bg-amber-500/20 border-amber-500/35 text-amber-900 font-extrabold"
                    : "bg-[#EADCC6]/25 border-[#EADCC6]/35 text-white"
                  : isLightTheme
                  ? "bg-white border-gray-250/80 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  : "bg-[#2D1E15]/50 dark:bg-surface-900 border-[#2D1E15] dark:border-surface-700 text-[#EBDCB9]/80 hover:bg-white/10 hover:text-white"
              }`}
              title="Heading Styles"
            >
              <span>
                {editor.isActive("heading", { level: 1 }) ? "H1" :
                 editor.isActive("heading", { level: 2 }) ? "H2" :
                 editor.isActive("heading", { level: 3 }) ? "H3" :
                 editor.isActive("heading", { level: 4 }) ? "H4" : "H"}
              </span>
              <ChevronDown size={10} className="opacity-70" />
            </button>

            {showHeadingDropdown && (
              <div
                className={`absolute top-full left-0 mt-1.5 flex flex-col p-1.5 rounded-xl shadow-xl border gap-0.5 z-50 animate-in fade-in duration-100 min-w-[140px] ${
                  isLightTheme ? "bg-white border-gray-200 text-gray-800" : "bg-slate-900 dark:bg-surface-950 border-white/10"
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                {[1, 2, 3, 4].map((level) => {
                  const isActive = editor.isActive("heading", { level });
                  return (
                    <button
                      key={level}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        editor.chain().focus().toggleHeading({ level }).run();
                        setShowHeadingDropdown(false);
                      }}
                      className={`flex items-center gap-2.5 px-2.5 py-1.5 text-left text-[11px] font-bold rounded-lg transition-all ${
                        isActive
                          ? isLightTheme
                            ? "bg-amber-500/15 text-amber-900 font-extrabold"
                            : "bg-amber-500/20 text-white font-extrabold"
                          : isLightTheme
                          ? "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                          : "text-gray-300 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span className="text-[10px] text-gray-500 font-extrabold min-w-[15px] uppercase">H{level}</span>
                      <span>Heading {level}</span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    editor.chain().focus().clearNodes().setParagraph().run();
                    setShowHeadingDropdown(false);
                  }}
                  className={`flex items-center gap-2.5 px-2.5 py-1.5 text-left text-[11px] font-bold rounded-lg transition-all ${
                    editor.isActive("paragraph") && !editor.isActive("heading")
                      ? isLightTheme
                        ? "bg-amber-500/15 text-amber-900 font-extrabold"
                        : "bg-amber-500/20 text-white font-extrabold"
                      : isLightTheme
                      ? "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      : "text-gray-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="text-[10px] text-gray-500 font-extrabold min-w-[15px] uppercase">¶</span>
                  <span>Paragraph</span>
                </button>
              </div>
            )}
          </div>

          <div className="w-px h-4 bg-[#231710] dark:bg-surface-750 shrink-0" />

          {/* 그룹 4: 리스트 스타일 드롭다운 및 코드블록 단독 버튼 */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="relative shrink-0">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowListDropdown(!showListDropdown);
                  setShowColorPopover(false);
                  setShowHeadingDropdown(false);
                }}
                className={`flex items-center gap-0.5 px-2.5 py-1 text-xs font-bold rounded-lg border transition-all shrink-0 active:scale-95 ${
                  editor.isActive("bulletList") || editor.isActive("orderedList") || editor.isActive("taskList")
                    ? isLightTheme
                      ? "bg-amber-500/20 border-amber-500/35 text-amber-900 font-extrabold"
                      : "bg-[#EADCC6]/25 border-[#EADCC6]/35 text-white"
                    : isLightTheme
                    ? "bg-white border-gray-250/80 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    : "bg-[#2D1E15]/50 dark:bg-surface-900 border-[#2D1E15] dark:border-surface-700 text-[#EBDCB9]/80 hover:bg-white/10 hover:text-white"
                }`}
                title="List Styles"
              >
                {editor.isActive("orderedList") ? (
                  <ListOrdered size={13} />
                ) : editor.isActive("taskList") ? (
                  <ListTodo size={13} />
                ) : (
                  <List size={13} />
                )}
                <ChevronDown size={10} className="opacity-70" />
              </button>

              {showListDropdown && (
                <div
                  className={`absolute top-full left-0 mt-1.5 flex flex-col p-1.5 rounded-xl shadow-xl border gap-0.5 z-50 animate-in fade-in duration-100 min-w-[140px] ${
                    isLightTheme ? "bg-white border-gray-200 text-gray-800" : "bg-slate-900 dark:bg-surface-950 border-white/10"
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      editor.chain().focus().toggleBulletList().run();
                      setShowListDropdown(false);
                    }}
                    className={`flex items-center gap-2.5 px-2.5 py-1.5 text-left text-[11px] font-bold rounded-lg transition-all ${
                      editor.isActive("bulletList")
                        ? isLightTheme
                          ? "bg-amber-500/15 text-amber-900 font-extrabold"
                          : "bg-amber-500/20 text-white font-extrabold"
                        : isLightTheme
                        ? "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        : "text-gray-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <List size={13} className="text-gray-400" />
                    <span>Bullet List</span>
                  </button>

                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      editor.chain().focus().toggleOrderedList().run();
                      setShowListDropdown(false);
                    }}
                    className={`flex items-center gap-2.5 px-2.5 py-1.5 text-left text-[11px] font-bold rounded-lg transition-all ${
                      editor.isActive("orderedList")
                        ? isLightTheme
                          ? "bg-amber-500/15 text-amber-900 font-extrabold"
                          : "bg-amber-500/20 text-white font-extrabold"
                        : isLightTheme
                        ? "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        : "text-gray-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <ListOrdered size={13} className="text-gray-400" />
                    <span>Ordered List</span>
                  </button>

                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      editor.chain().focus().toggleTaskList().run();
                      setShowListDropdown(false);
                    }}
                    className={`flex items-center gap-2.5 px-2.5 py-1.5 text-left text-[11px] font-bold rounded-lg transition-all ${
                      editor.isActive("taskList")
                        ? isLightTheme
                          ? "bg-amber-500/15 text-amber-900 font-extrabold"
                          : "bg-amber-500/20 text-white font-extrabold"
                        : isLightTheme
                        ? "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        : "text-gray-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <ListTodo size={13} className="text-gray-400" />
                    <span>Task List</span>
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={`p-1 rounded transition-all ${getActiveBtnClass("codeBlock")}`}
              title="Code Block"
            >
              <Code2 size={13} />
            </button>
          </div>

          <div className={dividerClass} />

          {/* 그룹 5: 인용구 및 구분선 */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={`p-1 rounded transition-all ${getActiveBtnClass("blockquote")}`}
              title="Blockquote"
            >
              <Quote size={13} />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              className="p-1 rounded transition-all text-gray-300 hover:text-white hover:bg-white/5"
              title="Horizontal Divider"
            >
              <Minus size={13} />
            </button>
          </div>

          <div className={dividerClass} />

          {/* 그룹 5.5: 텍스트 정렬 (Align) */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              className={`p-1 rounded transition-all ${getAlignBtnClass("left")}`}
              title="Align Left"
            >
              <AlignLeft size={13} />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().setTextAlign("center").run()}
              className={`p-1 rounded transition-all ${getAlignBtnClass("center")}`}
              title="Align Center"
            >
              <AlignCenter size={13} />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              className={`p-1 rounded transition-all ${getAlignBtnClass("right")}`}
              title="Align Right"
            >
              <AlignRight size={13} />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().setTextAlign("justify").run()}
              className={`p-1 rounded transition-all ${getAlignBtnClass("justify")}`}
              title="Align Justify"
            >
              <AlignJustify size={13} />
            </button>
          </div>

          <div className={dividerClass} />

          {/* 그룹 6: 들여쓰기 / 내어쓰기 */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => editor.commands.outdent()}
              className={`p-1 rounded transition-all ${btnClass}`}
              title="Decrease Indent"
            >
              <OutdentIcon size={13} />
            </button>
            <button
              type="button"
              onClick={() => editor.commands.indent()}
              className={`p-1 rounded transition-all ${btnClass}`}
              title="Increase Indent"
            >
              <IndentIcon size={13} />
            </button>
          </div>

          <div className={dividerClass} />

          {/* 그룹 7: 인라인 표 및 메모 */}
          <div className="flex items-center gap-0.5 shrink-0">
            {/* 표 삽입 */}
            <button
              type="button"
              onClick={onInsertTable}
              className={`p-1 rounded transition-all ${btnClass}`}
              title="Insert Inline Table (3x3)"
            >
              <TableIcon size={13} />
            </button>

            {/* 메모 글상자 삽입 */}
            <button
              type="button"
              onClick={onInsertMemo}
              className={`p-1 rounded transition-all ${btnClass}`}
              title="Insert Note Sticky Memo"
            >
              <StickyNote size={13} />
            </button>

            {/* 표가 현재 선택되어 활성화된 상태일 때만 드러나는 동적 행/열 편집 도구 */}
            {editor.isActive("table") && (
              <div className="flex items-center bg-amber-500/10 border border-amber-500/30 rounded px-1 py-0.5 gap-1.5 ml-1.5 animate-in fade-in slide-in-from-left-1 duration-150 shrink-0">
                <button
                  type="button"
                  onClick={() => editor.chain().focus().addColumnAfter().run()}
                  className="px-1.5 py-0.5 text-[8.5px] font-extrabold text-amber-500 hover:text-white hover:bg-amber-500/20 rounded transition-all uppercase"
                  title="Add Column After"
                >
                  +Col
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().addRowAfter().run()}
                  className="px-1.5 py-0.5 text-[8.5px] font-extrabold text-amber-500 hover:text-white hover:bg-amber-500/20 rounded transition-all uppercase"
                  title="Add Row After"
                >
                  +Row
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().deleteColumn().run()}
                  className="px-1.5 py-0.5 text-[8.5px] font-extrabold text-red-400 hover:text-white hover:bg-red-500/20 rounded transition-all uppercase"
                  title="Delete Column"
                >
                  -Col
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().deleteRow().run()}
                  className="px-1.5 py-0.5 text-[8.5px] font-extrabold text-red-400 hover:text-white hover:bg-red-500/20 rounded transition-all uppercase"
                  title="Delete Row"
                >
                  -Row
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().deleteTable().run()}
                  className="px-1.5 py-0.5 text-[8.5px] font-extrabold text-red-500 hover:bg-red-500 hover:text-white rounded transition-all uppercase shrink-0"
                  title="Delete Table"
                >
                  Del Tab
                </button>
              </div>
            )}

            {/* 이미지가 현재 선택되어 활성화된 상태일 때만 드러나는 동적 크기 및 정렬 조작 도구 */}
            {editor.isActive("image") && (
              <div className="flex items-center bg-amber-500/10 border border-amber-500/30 rounded px-1.5 py-0.5 gap-1.5 ml-1.5 animate-in fade-in slide-in-from-left-1 duration-150 shrink-0 text-[9px] font-extrabold text-gray-300">
                <span className="text-[8.5px] uppercase mr-0.5 select-none text-amber-500">Img Width</span>
                {["25%", "50%", "75%", "100%"].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      editor.commands.updateAttributes("image", { width: size });
                    }}
                    className="px-1.5 py-0.5 rounded hover:text-white hover:bg-amber-500/20 text-amber-400 font-extrabold transition-all"
                  >
                    {size}
                  </button>
                ))}

                <div className="w-px h-3 bg-amber-500/30 mx-1" />

                <span className="text-[8.5px] uppercase mr-0.5 select-none text-amber-500">Align</span>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    editor.commands.updateAttributes("image", { align: "left" });
                  }}
                  className="p-0.5 hover:text-white hover:bg-amber-500/20 text-amber-400 rounded transition-all"
                  title="Align Image Left"
                >
                  <AlignLeft size={11} />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    editor.commands.updateAttributes("image", { align: "center" });
                  }}
                  className="p-0.5 hover:text-white hover:bg-amber-500/20 text-amber-400 rounded transition-all"
                  title="Align Image Center"
                >
                  <AlignCenter size={11} />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    editor.commands.updateAttributes("image", { align: "right" });
                  }}
                  className="p-0.5 hover:text-white hover:bg-amber-500/20 text-amber-400 rounded transition-all"
                  title="Align Image Right"
                >
                  <AlignRight size={11} />
                </button>
              </div>
            )}
          </div>

          <div className={dividerClass} />

          {/* 그룹 8: 서식 지우기, 실행 취소, 다시 실행 */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
              className={`p-1 rounded transition-all hover:text-red-400 ${btnClass}`}
              title="Clear Formatting"
            >
              <Eraser size={13} />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className={`p-1 rounded transition-all disabled:opacity-30 disabled:pointer-events-none ${btnClass}`}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={13} />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className={`p-1 rounded transition-all disabled:opacity-30 disabled:pointer-events-none ${btnClass}`}
              title="Redo (Ctrl+Y)"
            >
              <Redo2 size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
