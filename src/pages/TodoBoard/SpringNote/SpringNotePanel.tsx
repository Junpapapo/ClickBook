import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "@/shared/ThemeContext";
import { ListTodo } from "lucide-react";
import type { NotePage, NoteObject, SpringNote } from "@/shared/types";
import type { SpringNotePanelProps } from "./spring-note-types";
import SpringNoteToolbar from "./components/SpringNoteToolbar";
import SpringNoteBook from "./components/SpringNoteBook";
import SpringNoteCanvas from "./components/SpringNoteCanvas";
import BookmarkSelector from "./components/BookmarkSelector";
import { saveSpringNoteImage, getSpringNote, saveSpringNote } from "@/utils/springNoteDb";
import { compressImage, markdownToHtml } from "./spring-note-utils";
import { SlashCommandExtension } from "./components/SlashCommandExtension";
import type { SlashCommandState } from "./components/SlashCommandExtension";
import SlashCommandMenu from "./components/SlashCommandMenu";
import { isAIAvailable } from "@/shared/categorizer";

// Tiptap WYSIWYG 에디터 관련 임포트 추가
import { useEditor, EditorContent } from "@tiptap/react";
import { DOMParser } from "@tiptap/pm/model";
import { Extension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";

// Tiptap 공식 테이블 익스텐션 임포트
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";

// Tiptap 할 일 목록(체크박스) 익스텐션 임포트
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";

// Tiptap 공식 이미지 익스텐션 임포트 (네이밍 충돌 방지를 위해 TiptapImage로 명명)
import TiptapImage from "@tiptap/extension-image";

// Tiptap 공식 이미지 익스텐션을 상속하여 width 및 align(정렬) 애트리뷰트를 확장 지원하는 ResizableImage 선언
const ResizableImage = TiptapImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: "100%",
        renderHTML: (attributes) => {
          return {
            width: attributes.width,
          };
        },
        parseHTML: (element) => element.getAttribute("width") || "100%",
      },
      align: {
        default: "center", // left, center, right
        renderHTML: (attributes) => {
          let margin = "0 auto";
          if (attributes.align === "left") {
            margin = "0 auto 0 0";
          } else if (attributes.align === "right") {
            margin = "0 0 0 auto";
          }
          return {
            style: `width: ${attributes.width || "100%"}; max-width: 100%; height: auto; display: block; margin: ${margin};`,
          };
        },
        parseHTML: (element) => {
          const style = element.getAttribute("style") || "";
          if (style.includes("margin: 0 auto 0 0")) return "left";
          if (style.includes("margin: 0 0 0 auto")) return "right";
          return "center";
        },
      },
    };
  },
});

// Tiptap 커스텀 드로잉 노드 익스텐션 임포트
import DrawingNode from "./components/DrawingNode";

// 문단 들여쓰기 / 내어쓰기 커스텀 익스텐션 구현
const Indent = Extension.create({
  name: "indent",
  addOptions() {
    return {
      types: ["paragraph", "heading", "blockquote"],
      indentSize: 24,
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            renderHTML: (attributes) => {
              if (!attributes.indent) return {};
              return {
                style: `margin-left: ${attributes.indent * this.options.indentSize}px;`,
              };
            },
            parseHTML: (element) => {
              const marginLeft = element.style.marginLeft;
              const value = marginLeft ? parseInt(marginLeft, 10) : 0;
              return value ? Math.round(value / this.options.indentSize) : 0;
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      indent: () => ({ tr, state, dispatch }) => {
        const { selection } = state;
        let isModified = false;
        tr.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
          if (this.options.types.includes(node.type.name)) {
            const indent = (node.attrs.indent || 0) + 1;
            tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              indent,
            });
            isModified = true;
          }
        });
        if (isModified && dispatch) dispatch(tr);
        return isModified;
      },
      outdent: () => ({ tr, state, dispatch }) => {
        const { selection } = state;
        let isModified = false;
        tr.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
          if (this.options.types.includes(node.type.name)) {
            const indent = Math.max(0, (node.attrs.indent || 0) - 1);
            tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              indent,
            });
            isModified = true;
          }
        });
        if (isModified && dispatch) dispatch(tr);
        return isModified;
      },
    } as any;
  },
});

export default function SpringNotePanel({
  taskId,
  onClose,
  t,
  lang,
  isMiniMode = false,
  onThemeChange,
}: SpringNotePanelProps) {
  const { theme: systemTheme } = useTheme();
  const [pages, setPages] = useState<NotePage[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [theme, setTheme] = useState<"light" | "sepia" | "dark" | "grid">("sepia");
  const [font, setFont] = useState<"serif" | "sans" | "mono" | "pretendard">("pretendard");
  const [fontSize, setFontSize] = useState<number>(16);
  const [noteTitle, setNoteTitle] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // 슬래시 커맨드 + AI 상태
  const [slashState, setSlashState] = useState<SlashCommandState>({
    active: false, query: "", range: { from: 0, to: 0 }, rect: null,
  });
  const [aiAvailable, setAiAvailableLocal] = useState(false);
  
  // 페이지 삭제 커스텀 모달 상태 추가
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // 사용자 수동 편집 및 저장 가능한 날짜 텍스트 상태 추가
  const [noteDateText, setNoteDateText] = useState("");

  // 선택된 오브젝트 ID 상태 (캔버스 밖 클릭 시 강제 해제용)
  const [selectedObjId, setSelectedObjId] = useState<string | null>(null);

  // 할 일(TodoTask) 연동 키 보존 상태
  const [associatedTaskId, setAssociatedTaskId] = useState<string | undefined>(undefined);

  // 에디터 컨테이너 및 이미지 인풋 레퍼런스
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 에디터 스크롤 동기화 연동 상태
  const [editorScrollHeight, setEditorScrollHeight] = useState(500);

  const updateScrollDimensions = () => {
    if (editorContainerRef.current) {
      setEditorScrollHeight(editorContainerRef.current.scrollHeight);
    }
  };

  const handleScroll = () => {
    updateScrollDimensions();
  };

  // 이미지 포커스 플로팅 업로드 위젯 상태
  const [showImagePopover, setShowImagePopover] = useState(false);
  const [popoverCoords, setPopoverCoords] = useState<{ top: number; left: number } | null>(null);
  
  // 이미지 업로딩 상태 타입 정의
  interface UploadingFile {
    id: string;
    name: string;
    size: string;
    progress: number;
  }
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const uploadIntervals = useRef<Record<string, NodeJS.Timeout>>({});

  // 컴포넌트 언마운트 시 업로드 타이머들 강제 해제
  useEffect(() => {
    return () => {
      Object.values(uploadIntervals.current).forEach(clearInterval);
    };
  }, []);

  // 전역 클릭 시 이미지 드롭다운 위젯 자동 닫기 (이벤트 전파 방지 처리 활용)
  useEffect(() => {
    const handleGlobalClick = () => {
      setShowImagePopover(false);
    };
    window.addEventListener("click", handleGlobalClick);
    return () => {
      window.removeEventListener("click", handleGlobalClick);
    };
  }, []);

  const currentPage = pages[currentPageIndex] || pages[0];
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  // Tiptap 용 인덱스 추적 ref (클로저 갇힘 방지)
  const currentPageIndexRef = useRef(currentPageIndex);
  useEffect(() => {
    currentPageIndexRef.current = currentPageIndex;
  }, [currentPageIndex]);

  // 전역 AI 활성화 상태 로드 (팝업의 "AI ON/OFF" 설정값 재사용)
  useEffect(() => {
    isAIAvailable().then(setAiAvailableLocal).catch(() => setAiAvailableLocal(false));
    // storage 변경 이벤트 감지
    const handler = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (changes["clickbook_ai_enabled"]) {
        setAiAvailableLocal(changes["clickbook_ai_enabled"].newValue === true);
      }
    };
    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }, []);

  // V6: 시스템 테마(라이트/다크) 변경 감지하여 노트 테마 자동 동기화
  useEffect(() => {
    if (loading) return;
    const targetTheme = systemTheme === "light" ? "grid" : "dark";
    if (theme !== targetTheme) {
      setTheme(targetTheme);
    }
  }, [systemTheme, loading]);



  // Tiptap 에디터 인스턴스 초기화
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({
        placeholder: t("springNotePastePlaceholder") || "Write text here or paste images...",
        emptyEditorClass: "is-editor-empty",
      }),
      Indent,
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right", "justify"],
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      // TaskItem: nodeView에서 li/label에 인라인 스타일 직접 주입 (크롬 확장 CSS 주입 순서 문제 우회)
      TaskItem.extend({
        addNodeView() {
          return ({ node, HTMLAttributes, getPos, editor }) => {
            const listItem = document.createElement("li");
            const checkboxWrapper = document.createElement("label");
            const checkboxStyler = document.createElement("span");
            const checkbox = document.createElement("input");
            const content = document.createElement("div");

            // li: flex row 강제 인라인 스타일
            listItem.style.cssText = "display:flex !important; flex-direction:row !important; align-items:flex-start !important; list-style:none !important; padding:0 !important; margin:0 0 4px 0 !important; gap:6px !important;";
            // label: inline-flex, block 방지
            checkboxWrapper.style.cssText = "display:inline-flex !important; align-items:center !important; flex-shrink:0 !important; margin-top:3px !important; float:none !important;";
            // span (checkboxStyler): 숨김 처리 (시각적으로 불필요)
            checkboxStyler.style.cssText = "display:none !important;";
            // input checkbox
            checkbox.style.cssText = "width:14px !important; height:14px !important; margin:0 !important; cursor:pointer !important; accent-color:#6366f1 !important;";
            // content div: flex-grow
            content.style.cssText = "flex:1 1 auto !important; min-width:0 !important;";

            checkboxWrapper.contentEditable = "false";
            checkbox.type = "checkbox";
            checkbox.addEventListener("mousedown", (event) => event.preventDefault());
            checkbox.addEventListener("change", (event) => {
              if (!editor.isEditable) {
                checkbox.checked = !checkbox.checked;
                return;
              }
              const { checked } = event.target as HTMLInputElement;
              if (typeof getPos === "function") {
                editor
                  .chain()
                  .focus(undefined, { scrollIntoView: false })
                  .command(({ tr }) => {
                    const position = getPos();
                    if (typeof position !== "number") return false;
                    const currentNode = tr.doc.nodeAt(position);
                    tr.setNodeMarkup(position, undefined, {
                      ...currentNode?.attrs,
                      checked,
                    });
                    return true;
                  })
                  .run();
              }
            });

            // HTMLAttributes 적용 (data-type="taskItem" 포함)
            Object.entries(HTMLAttributes).forEach(([key, value]) => {
              listItem.setAttribute(key, value);
            });
            listItem.dataset.checked = String(node.attrs.checked);
            checkbox.checked = node.attrs.checked;

            checkboxWrapper.append(checkbox, checkboxStyler);
            listItem.append(checkboxWrapper, content);

            return {
              dom: listItem,
              contentDOM: content,
              update: (updatedNode) => {
                if (updatedNode.type !== this.type) return false;
                listItem.dataset.checked = String(updatedNode.attrs.checked);
                checkbox.checked = updatedNode.attrs.checked;
                return true;
              },
            };
          };
        },
      }).configure({
        nested: true,
      }),
      ResizableImage,
      DrawingNode,
      SlashCommandExtension.configure({
        onStateChange: (state) => setSlashState(state),
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "spring-note-link",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
    ],
    content: "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setPages((prevPages) =>
        prevPages.map((p, idx) =>
          idx === currentPageIndexRef.current ? { ...p, text: html } : p
        )
      );
    },
    editorProps: {
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (items) {
          let hasImage = false;
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) {
              hasImage = true;
              break;
            }
          }
          if (hasImage) {
            handleTiptapPaste(event);
            return true; // 이미지는 가로채서 수동으로 캔버스 오브젝트로 배치
          }
        }

        // 일반 텍스트 붙여넣기 시 불필요하게 단락이 쪼개지며 빈 줄이 다수 들어가는 오류 해결
        const rawText = event.clipboardData?.getData("text/plain");
        if (rawText) {
          // 붙여넣은 텍스트에 마크다운 표 구조가 포함되어 있다면 HTML 테이블로 변환하여 주입
          const hasTable = /\|.+\|\s*\r?\n\s*\|[ :|-]+\|/.test(rawText);
          if (hasTable) {
            const htmlContent = markdownToHtml(rawText);
            const parser = DOMParser.fromSchema(view.state.schema);
            const dom = document.createElement("div");
            dom.innerHTML = htmlContent;
            const slice = parser.parseSlice(dom);
            const transaction = view.state.tr.replaceSelection(slice);
            view.dispatch(transaction);
            return true;
          }

          // 끝부분의 불필요한 연속 개행 문자열 제거
          const text = rawText.replace(/[\r\n]+$/, "");
          // 개행(줄바꿈)이 포함되지 않은 순수 단어/한 줄 텍스트인 경우
          // HTML 구조로 해석되어 블록 태그로 쪼개지는 대신, 현재 커서에 인라인 텍스트로 즉시 안전 삽입
          if (text && !/[\r\n]/.test(text)) {
            view.dispatch(view.state.tr.insertText(text));
            return true;
          }
        }
        return false; // 멀티라인 텍스트나 복잡한 리치 텍스트 서식은 Tiptap 기본 핸들러가 처리하도록 위임
      },
      transformPastedText: (text) => {
        // 3개 이상 연속된 개행(\n\n\n+)을 최대 2개(\n\n)로 제어하여 불필요한 빈 줄 누적 차단
        return text.replace(/\n{3,}/g, "\n\n");
      },
      transformPastedHTML: (html) => {
        let cleaned = html;
        // 블록 태그 사이의 무의미한 개행 문자를 완전히 제거하여 ProseMirror가 빈 단락으로 오인하는 현상 차단
        cleaned = cleaned.replace(/(<\/p>|<\/div>|<\/li>|<\/ul>|<\/ol>)\s*[\r\n]+\s*(<p>|<div>|<li>|<ul>|<ol>)/gi, "$1$2");
        // 연속된 빈 단락 <p><br></p> 혹은 빈 div 래퍼들을 최대 1개 수준으로 정제
        cleaned = cleaned.replace(/(<p>\s*<br\s*\/?>\s*<\/p>){2,}/gi, "<p><br></p>");
        cleaned = cleaned.replace(/(<p>\s*<\/p>){2,}/gi, "<p></p>");
        cleaned = cleaned.replace(/(<div>\s*<br\s*\/?>\s*<\/div>){2,}/gi, "<div><br></div>");
        return cleaned;
      },
      attributes: {
        class: "w-full h-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 leading-relaxed font-inherit min-h-[350px]",
      },
    },
  });

  // V6: 에디터 높이 감지 및 캔버스 스크롤 동기화 연동
  useEffect(() => {
    updateScrollDimensions();
    const timer = setTimeout(updateScrollDimensions, 100);
    return () => clearTimeout(timer);
  }, [pages, currentPageIndex, editor?.getHTML()]);

  // 날짜 스탬프 포맷팅 헬퍼 함수
  const getFormattedDate = () => {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    };
    return date.toLocaleDateString(lang === "ko" ? "ko-KR" : lang === "ja" ? "ja-JP" : "en-US", options);
  };

  // 밝은 배경(라이트/세피아)에서 어두운 글자색을 엄격히 고정하기 위한 헬퍼
  const getThemeTextClass = () => {
    if (theme === "light" || theme === "grid") return "!text-black";
    if (theme === "sepia") return "!text-[#4A3728]";
    return "!text-gray-200"; // dark
  };

  // 종이 테마에 상응하는 날짜용 차분한 전용 글자색 획득
  const getDateColorClass = () => {
    if (theme === "light" || theme === "grid") return "text-gray-400 dark:text-gray-500";
    if (theme === "sepia") return "text-[#7A604D]"; // 세피아 전용 어두운 브라운
    return "text-gray-500"; // dark 테마
  };

  // 1. IndexedDB 데이터 로드 및 초기화
  useEffect(() => {
    let active = true;
    async function loadData() {
      setLoading(true);
      try {
        const noteData = await getSpringNote(taskId);
        if (!active) return;

        if (noteData) {
          setPages(noteData.pages || []);
          setTheme(noteData.theme || "sepia");
          setFont(noteData.font || "sans");
          setFontSize(noteData.fontSize || 16);
          setNoteTitle(noteData.title || "");
          setAssociatedTaskId(noteData.associatedTaskId);

          if (noteData.customDate !== undefined) {
            setNoteDateText(noteData.customDate);
          } else {
            const loadedDate = new Date(noteData.createdAt || Date.now());
            const options: Intl.DateTimeFormatOptions = {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "long",
              hour: "numeric",
              minute: "2-digit",
              hour12: true
            };
            const formatted = loadedDate.toLocaleDateString(lang === "ko" ? "ko-KR" : lang === "ja" ? "ja-JP" : "en-US", options);
            setNoteDateText(formatted);
          }
        } else {
          // 존재하지 않을 경우 자동 생성
          const isGlobal = taskId === "global";
          const initDate = new Date();
          const options: Intl.DateTimeFormatOptions = {
            year: "numeric",
            month: "long",
            day: "numeric",
            weekday: "long",
            hour: "numeric",
            minute: "2-digit",
            hour12: true
          };
          const formattedInit = initDate.toLocaleDateString(lang === "ko" ? "ko-KR" : lang === "ja" ? "ja-JP" : "en-US", options);

          const newNote: SpringNote = {
            id: taskId,
            title: isGlobal
              ? lang === "ko" ? "나의 종합 필기장" : lang === "ja" ? "私の総合メモ帳" : "My Global Scratchpad"
              : lang === "ko" ? "연동 태스크 노트" : lang === "ja" ? "タスク連動メモ" : "Task Linked Notebook",
            pages: [
              {
                id: `page-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
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
            customDate: formattedInit,
          };
          await saveSpringNote(newNote);
          if (!active) return;
          setPages(newNote.pages);
          setTheme(newNote.theme);
          setFont(newNote.font);
          setFontSize(newNote.fontSize);
          setNoteTitle(newNote.title);
          setNoteDateText(formattedInit);
          setAssociatedTaskId(newNote.associatedTaskId);
        }
      } catch (err) {
        console.error("Failed to load SpringNote:", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadData();
    return () => {
      active = false;
    };
  }, [taskId, lang]);

  // 페이지 이동 및 초기화 시 Tiptap 에디터 내용 동기화 (Undo 히스토리에 영향 주지 않도록 setContent)
  useEffect(() => {
    if (loading || pages.length === 0 || !editor) return;
    const targetText = currentPage?.text || "";
    if (editor.getHTML() !== targetText) {
      editor.commands.setContent(targetText, false);
    }
  }, [currentPageIndex, loading, editor, currentPage?.text]);

  // 2. 디바운스 자동 저장
  useEffect(() => {
    if (loading || pages.length === 0) return;

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);

    autoSaveTimer.current = setTimeout(async () => {
      try {
        const noteToSave: SpringNote = {
          id: taskId,
          title: noteTitle,
          pages,
          theme,
          font,
          fontSize,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          customDate: noteDateText,
          associatedTaskId,
        };
        await saveSpringNote(noteToSave);
        // 부모에게도 최신 테마 상태 전파하여 사이드바 실시간 동기화
        onThemeChange?.(theme);
      } catch (err) {
        console.warn("Failed to auto-save spring note:", err);
      }
    }, 500);

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [pages, theme, font, fontSize, noteTitle, noteDateText, associatedTaskId, loading, taskId, onThemeChange]);

  if (loading || pages.length === 0) {
    return (
      <div className="flex-grow flex items-center justify-center bg-gray-55/10 dark:bg-surface-900/10">
        <span className="text-xs text-gray-400">Loading Note...</span>
      </div>
    );
  }

  // 페이지 추가
  const handleAddPage = () => {
    const newPage: NotePage = {
      id: `page-${Date.now()}`,
      pageNumber: pages.length + 1,
      text: "",
      objects: [],
    };
    const newPages = [...pages, newPage];
    setPages(newPages);
    setCurrentPageIndex(newPages.length - 1);
  };

  // 페이지 삭제 모달 호출
  const handleDeletePage = () => {
    if (pages.length <= 1) return;
    setIsDeleteModalOpen(true);
  };

  // 실제 페이지 삭제 실행
  const confirmDeletePage = () => {
    setIsDeleteModalOpen(false);
    if (pages.length <= 1) return;

    const newPages = pages
      .filter((_, idx) => idx !== currentPageIndex)
      .map((p, idx) => ({ ...p, pageNumber: idx + 1 }));

    setPages(newPages);
    setCurrentPageIndex(Math.max(0, currentPageIndex - 1));
  };

  // V6: 클릭한 가로 격자선(줄눈) 위치에서 바로 필기를 시작할 수 있게 개행 보조 핸들러
  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // 에디터 지면 클릭 시 캔버스 오브젝트 선택 해제
    setSelectedObjId(null);

    // 캔버스 오브젝트나 다른 하위 요소를 직접 조작한 경우는 무시
    if (e.target !== e.currentTarget || !editor) return;

    const editorDom = editor.view.dom as HTMLDivElement;
    if (!editorDom) return;

    const lineHeight = 28; // 가로 줄눈선 높이
    const rect = editorDom.getBoundingClientRect();
    const clickY = e.clientY - rect.top + editorDom.scrollTop;
    const targetLineIdx = Math.floor(clickY / lineHeight);

    let childNodes = Array.from(editorDom.childNodes);
    // 빈 텍스트 노드 정제
    if (childNodes.length === 1 && childNodes[0].nodeType === Node.TEXT_NODE && childNodes[0].textContent === "") {
      childNodes = [];
    }

    const currentLineCount = childNodes.length > 0 ? childNodes.length : 1;

    // 현재 기입된 줄보다 더 아랫줄 빈 영역을 클릭했을 때 작동
    if (targetLineIdx >= currentLineCount) {
      const neededNewLines = targetLineIdx - currentLineCount + 1;
      let appendHtml = "";
      for (let i = 0; i < neededNewLines; i++) {
        appendHtml += "<p><br></p>";
      }

      const updatedHtml = editor.getHTML() + appendHtml;
      editor.commands.setContent(updatedHtml, false);

      setTimeout(() => {
        editor.commands.focus("end");
      }, 20);
    }
  };

  // Tiptap 에디터 Props로 등록할 비동기 이미지 붙여넣기 래퍼
  const handleTiptapPaste = async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf("image") !== -1) {
        const file = item.getAsFile();
        if (!file) continue;

        try {
          const compressedBlob = await compressImage(file);
          const imageId = `img-${crypto.randomUUID()}`;
          
          await saveSpringNoteImage(imageId, compressedBlob);

          const newObj: NoteObject = {
            id: `obj-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            type: "image",
            content: imageId,
            x: 25,
            y: 80 + Math.random() * 40,
            width: 220,
            height: 160,
            rotation: 0,
            metadata: {
              borderWidth: 1,
              borderColor: "default",
            },
          };

          handleUpdateObjects([...currentPage.objects, newObj]);
        } catch (err) {
          console.warn("Failed to process paste image:", err);
        }
      }
    }
  };

  // 캔버스 오브젝트 변경
  const handleUpdateObjects = (newObjects: NoteObject[]) => {
    const updatedPages = pages.map((p, idx) =>
      idx === currentPageIndex ? { ...p, objects: newObjects } : p
    );
    setPages(updatedPages);
  };

  // 겹치지 않게 순차적으로 비껴가며 계단식 위치(x, y)를 연산하는 함수
  const getNextObjectPosition = (width: number, height: number) => {
    const existing = currentPage.objects;
    if (existing.length === 0) {
      return { x: 30, y: 80 };
    }
    
    const lastObj = existing[existing.length - 1];
    const count = existing.length;
    const stepX = 25;
    const stepY = 30;
    
    let newX = lastObj.x + stepX;
    let newY = lastObj.y + stepY;
    
    // 화면 바깥으로 너무 나가지 않도록 내측 순환
    if (newX > 320) {
      newX = 30 + (count % 3) * 15;
    }
    if (newY > 380) {
      newY = 80 + (count % 4) * 20;
    }
    
    return { x: newX, y: newY };
  };

  // 북마크 라이브러리 드로어에서 선택 시
  const handleSelectBookmark = (bm: { title: string; url: string; id: string; favicon: string }) => {
    const defaultWidth = 320;
    const defaultHeight = 80;
    const { x, y } = getNextObjectPosition(defaultWidth, defaultHeight);

    const newObj: NoteObject = {
      id: `obj-${Date.now()}`,
      type: "bookmark-memo",
      content: bm.url,
      x,
      y,
      width: defaultWidth, // 가로 너비 확장 (와이드)
      height: defaultHeight, // 세로 높이 최적화
      rotation: 0,
      metadata: {
        title: bm.title,
        url: bm.url,
        favicon: bm.favicon,
      },
    };
    handleUpdateObjects([...currentPage.objects, newObj]);
  };

  // 메모 라이브러리 드로어에서 선택 시
  const handleSelectMemo = (memo: {
    id: string;
    content: string;
    color: string;
    bookmarkTitle?: string;
    bookmarkUrl?: string;
    favicon?: string;
  }) => {
    const defaultWidth = 190;
    const defaultHeight = 145;
    const { x, y } = getNextObjectPosition(defaultWidth, defaultHeight);

    const newObj: NoteObject = {
      id: `obj-${Date.now()}`,
      type: "bookmark-memo",
      content: memo.content,
      x,
      y,
      width: defaultWidth,
      height: defaultHeight,
      rotation: 0,
      metadata: {
        title: "Saved Memo",
        memoColor: memo.color,
        bookmarkId: memo.id,
        bookmarkTitle: memo.bookmarkTitle,
        bookmarkUrl: memo.bookmarkUrl,
        favicon: memo.favicon,
      },
    };
    handleUpdateObjects([...currentPage.objects, newObj]);
  };

  // 이미지 포커스 기준 플로팅 위젯 토글 및 상대좌표 계산
  const handleToggleImagePopover = () => {
    if (showImagePopover) {
      setShowImagePopover(false);
      return;
    }

    if (!editor) return;
    
    const { from } = editor.state.selection;
    try {
      const coords = editor.view.coordsAtPos(from);
      const containerRect = editorContainerRef.current?.getBoundingClientRect();
      if (containerRect && coords) {
        // 커서 바로 밑에 플로팅 (좌표 보정 및 스크롤 감안)
        const top = coords.bottom - containerRect.top + (editorContainerRef.current?.scrollTop || 0) + 8;
        
        const cursorX = coords.left - containerRect.left;
        // 위젯 너비가 420px이므로 중심 정렬 시 -210px 이지만, 
        // 왼쪽 바인더 링 스프링 영역(약 40px) 침범을 회피하기 위해 최소 55px 띄우도록 설계
        let left = cursorX - 210;
        if (left < 55) {
          left = 55;
        }
        // 우측 화면 잘림 방지
        const maxLeft = containerRect.width - 440;
        if (left > maxLeft) {
          left = Math.max(55, maxLeft);
        }

        setPopoverCoords({ top, left });
        setShowImagePopover(true);
      } else {
        setPopoverCoords({ top: 120, left: 55 });
        setShowImagePopover(true);
      }
    } catch (err) {
      setPopoverCoords({ top: 120, left: 55 });
      setShowImagePopover(true);
    }
  };

  // 이미지 파일 업로드 프로세싱 및 가상 진행률(로딩 슬라이드) 관리
  const processFiles = (files: File[]) => {
    if (!editor) return;
    if (files.length === 0) return;

    if (files.length > 3) {
      alert("Maximum 3 files can be uploaded at once.");
      return;
    }

    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds the 5MB limit.`);
        return;
      }
      if (!file.type.startsWith("image/")) {
        alert(`File "${file.name}" is not a valid image file.`);
        return;
      }

      const uploadId = `upload-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
      
      const newUpload = {
        id: uploadId,
        name: file.name,
        size: (file.size / 1024).toFixed(2) + " KB",
        progress: 10
      };

      setUploadingFiles((prev) => [...prev, newUpload]);

      // 가상 프로그래스바 시뮬레이션
      const interval = setInterval(() => {
        setUploadingFiles((prev) => {
          const updated = prev.map((f) => {
            if (f.id === uploadId) {
              const nextProgress = f.progress + Math.floor(Math.random() * 15) + 8;
              if (nextProgress >= 100) {
                clearInterval(interval);
                delete uploadIntervals.current[uploadId];

                // 100% 도달 시 에디터에 안전하게 이미지 삽입
                const reader = new FileReader();
                reader.onload = () => {
                  editor.commands.focus();
                  editor.commands.insertContent({
                    type: "image",
                    attrs: { src: reader.result as string },
                  });
                };
                reader.readAsDataURL(file);

                // 업로드 완료 후 리스트에서 잠시 후 제거
                setTimeout(() => {
                  setUploadingFiles((curr) => curr.filter((item) => item.id !== uploadId));
                }, 600);

                return { ...f, progress: 100 };
              }
              return { ...f, progress: nextProgress };
            }
            return f;
          });

          // 모든 업로딩 대상이 100% 완료되면 드롭다운 자동 닫기
          const allDone = updated.every((uf) => uf.progress >= 100);
          if (allDone) {
            setTimeout(() => {
              setShowImagePopover(false);
            }, 850);
          }

          return updated;
        });
      }, 120);

      uploadIntervals.current[uploadId] = interval;
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    processFiles(files);
    e.target.value = ""; // 리셋
  };

  const handleImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove("border-amber-500", "bg-amber-500/5");
    const files = e.dataTransfer.files ? Array.from(e.dataTransfer.files) : [];
    processFiles(files);
  };

  const handleCancelUpload = (id: string) => {
    if (uploadIntervals.current[id]) {
      clearInterval(uploadIntervals.current[id]);
      delete uploadIntervals.current[id];
    }
    setUploadingFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // V6: contentEditable 전용 execCommand WYSIWYG 서식 적용 -> Tiptap API 서식 적용으로 마이그레이션
  const handleApplyFormatting = (format: "bold" | "italic" | "underline" | "strikethrough" | "code" | "quote" | "bullet" | "number" | "indent" | "outdent") => {
    if (!editor) return;
    editor.focus();

    if (format === "bold") {
      editor.chain().focus().toggleBold().run();
    } else if (format === "italic") {
      editor.chain().focus().toggleItalic().run();
    } else if (format === "underline") {
      editor.chain().focus().toggleUnderline().run();
    } else if (format === "strikethrough") {
      editor.chain().focus().toggleStrike().run();
    } else if (format === "code") {
      editor.chain().focus().toggleCode().run();
    } else if (format === "quote") {
      editor.chain().focus().toggleBlockquote().run();
    } else if (format === "bullet") {
      editor.chain().focus().toggleBulletList().run();
    } else if (format === "number") {
      editor.chain().focus().toggleOrderedList().run();
    } else if (format === "indent") {
      editor.commands.indent();
    } else if (format === "outdent") {
      editor.commands.outdent();
    }
  };

  // V6: contentEditable 용 텍스트 색상 변경 -> Tiptap TextStyle/Color API 적용
  const handleApplyTextColor = (colorCode: string) => {
    if (!editor) return;
    editor.focus();

    if (colorCode === "default") {
      editor.chain().focus().unsetColor().run();
    } else {
      editor.chain().focus().setColor(colorCode).run();
    }
  };

  // V6: contentEditable 용 형광펜 하이라이트 색상 변경 -> Tiptap Highlight API 적용
  const handleApplyHighlightColor = (colorCode: string) => {
    if (!editor) return;
    editor.focus();

    if (colorCode === "default") {
      editor.chain().focus().unsetHighlight().run();
    } else {
      editor.chain().focus().toggleHighlight({ color: colorCode }).run();
    }
  };

  // V6: 동적 테이블(Table) 오브젝트 생성 후 캔버스 기입 -> Tiptap 본문 내 내장 테이블 삽입으로 고도화
  const handleInsertTable = () => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  // V6: 미니 사이드 드로어 상태 극대화(Maximize) 핸들러
  const handleMaximize = () => {
    localStorage.setItem("clickbook_active_spring_note_id", taskId);
    window.dispatchEvent(new CustomEvent("OPEN_SPRING_NOTE"));
    onClose();
  };

  return (
    <div className="flex-grow flex flex-col h-full bg-gray-55/10 dark:bg-surface-900/10 border-l border-gray-150 dark:border-white/5 overflow-hidden animate-in fade-in duration-300">
      {/* 슬래시(/) 커맨드 메뉴 — Portal로 body에 렌더링 */}
      {editor && slashState.active && (
        <SlashCommandMenu
          editor={editor}
          slashState={slashState}
          aiAvailable={aiAvailable}
          t={t}
        />
      )}
      {/* 1. 상단 제어 바 */}
      <SpringNoteToolbar
        editor={editor || undefined}
        theme={theme}
        onChangeTheme={setTheme}
        font={font}
        onChangeFont={setFont}
        fontSize={fontSize}
        onChangeFontSize={setFontSize}
        onAddPage={handleAddPage}
        onDeletePage={handleDeletePage}
        onToggleDrawer={() => setIsDrawerOpen(!isDrawerOpen)}
        isDrawerOpen={isDrawerOpen}
        onClose={onClose}
        onInsertTable={handleInsertTable}
        onApplyFormatting={handleApplyFormatting}
        onApplyTextColor={handleApplyTextColor}
        onApplyHighlightColor={handleApplyHighlightColor}
        isMiniMode={isMiniMode}
        onMaximize={handleMaximize}
        pages={pages}
        currentPageIndex={currentPageIndex}
        onChangePageIndex={setCurrentPageIndex}
        onToggleImagePopover={handleToggleImagePopover}
      />

      <div className="flex-grow flex w-full overflow-hidden relative">
        {/* 2. 메인 바인더 제본 래퍼 */}
        <SpringNoteBook theme={theme} font={font} fontSize={fontSize}>
          <div 
            className="w-full flex-grow flex flex-col relative min-h-full" 
            style={{
              transform: isMiniMode ? "scale(0.92)" : "none",
              transformOrigin: "top left",
            }}
          >
            {/* 제목 기입 (글꼴 크기 증폭 및 Notion 스타일로 보완) */}
            <input
              type="text"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              onClick={() => setSelectedObjId(null)}
              placeholder="Untitled Notebook"
              className={`w-full bg-transparent border-none outline-none font-bold text-2xl ${getThemeTextClass()} placeholder-gray-350 dark:placeholder-gray-600 mb-1 focus:ring-0 z-20 focus:outline-none pl-10 pr-2`}
            />

            {/* 노트 제목과 본문을 나누는 얇은 경계선 및 작성 일자 타임스탬프 (편집 가능한 input 텍스트 필드로 구현) */}
            <div className="pl-10 pr-2 mb-3.5 z-20 shrink-0">
              <div className="w-full h-px bg-gray-200 dark:bg-surface-700/60 mb-2" />
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  value={noteDateText}
                  onChange={(e) => setNoteDateText(e.target.value)}
                  onClick={() => setSelectedObjId(null)}
                  placeholder={lang === "ko" ? "날짜를 입력하세요..." : lang === "ja" ? "日付を入力してください..." : "Enter date..."}
                  className={`flex-1 bg-transparent border-none outline-none text-[11px] ${getDateColorClass()} font-medium p-0 focus:ring-0 focus:outline-none select-text cursor-text`}
                />
                
                {/* TODO 연동 태그 클릭 이동 배지 */}
                {associatedTaskId && (
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent("OPEN_TODO_BOARD"))}
                    className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-extrabold text-amber-600 bg-amber-500/10 hover:bg-amber-500/20 dark:text-[#EBDCB9] dark:bg-amber-500/15 dark:hover:bg-amber-500/35 border border-amber-500/20 rounded-md transition-all active:scale-95 cursor-pointer shrink-0 select-none"
                    title={lang === "ko" ? "연동된 TODO로 이동" : lang === "ja" ? "連動したTODOへ移動" : "Go to Linked TODO"}
                  >
                    <ListTodo size={10} strokeWidth={2.5} className="text-amber-500" />
                    <span>TODO</span>
                  </button>
                )}
              </div>
            </div>

            {/* Tiptap 기반 WYSIWYG 에디터 영역 */}
            <div 
              ref={editorContainerRef}
              onClick={handleEditorClick}
              onScroll={handleScroll}
              className="w-full flex-grow z-10 pl-10 pr-2 min-h-[350px] overflow-y-auto cursor-text relative"
              style={{ minHeight: "350px" }}
            >
              {/* 캔버스 자유 오브젝트 레이어 */}
              <SpringNoteCanvas
                pageId={currentPage.id}
                taskId={taskId}
                objects={currentPage.objects}
                onUpdateObjects={handleUpdateObjects}
                t={t}
                theme={theme}
                selectedObjId={selectedObjId}
                setSelectedObjId={setSelectedObjId}
                scale={isMiniMode ? 0.92 : 1}
                scrollHeight={editorScrollHeight}
              />

              <EditorContent
                editor={editor}
                className={`w-full h-full bg-transparent border-none outline-none resize-none focus:ring-0 leading-relaxed font-inherit ${getThemeTextClass()} focus:outline-none z-10 relative`}
              />

              {/* 숨겨진 로컬 이미지 인풋 */}
              <input 
                type="file" 
                ref={fileInputRef} 
                accept="image/*" 
                multiple
                className="hidden" 
                onChange={handleImageUpload} 
              />

              {/* 커서 포커스 기반 플로팅 이미지 업로드 위젯 */}
              {showImagePopover && popoverCoords && (
                <div
                  style={{
                    top: `${popoverCoords.top}px`,
                    left: `${popoverCoords.left}px`,
                  }}
                  className="absolute bg-[#1E1E20] dark:bg-surface-950 p-4.5 rounded-2xl shadow-2xl border border-white/10 flex flex-col gap-3.5 z-50 animate-in fade-in zoom-in-95 duration-150 w-[420px] select-none"
                  onClick={(e) => {
                    // 드롭다운 내부 클릭 시 전역 클릭 리스너로 닫히는 현상 차단
                    e.stopPropagation();
                  }}
                >
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add("border-amber-500", "bg-amber-500/5");
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove("border-amber-500", "bg-amber-500/5");
                    }}
                    onDrop={handleImageDrop}
                    onClick={() => {
                      setTimeout(() => {
                        fileInputRef.current?.click();
                      }, 0);
                    }}
                    className="flex flex-col items-center justify-center border-2 border-dashed border-gray-650 dark:border-surface-700 hover:border-amber-500 rounded-xl p-10 cursor-pointer transition-all gap-3.5"
                  >
                    <div className="p-3 bg-purple-500/10 text-purple-400 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-cloud-upload">
                        <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                        <path d="M12 12v9" />
                        <path d="m16 16-4-4-4 4" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-200">
                        <span className="underline text-amber-400 font-extrabold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-400 mt-1.5">
                        Maximum 3 files, 5MB each.
                      </p>
                    </div>
                  </div>

                  {/* 업로딩 로딩 슬라이드 (진행률 표시) 목록 */}
                  {uploadingFiles.length > 0 && (
                    <div className="flex flex-col gap-2 border-t border-white/5 pt-2.5 max-h-48 overflow-y-auto">
                      {uploadingFiles.map((uf) => (
                        <div
                          key={uf.id}
                          className="relative overflow-hidden border border-white/10 bg-slate-950/80 p-2.5 rounded-xl flex items-center justify-between gap-3 text-[#EBDCB9]"
                        >
                          {/* 진행률 배경 채우기 바 */}
                          <div
                            className="absolute left-0 top-0 bottom-0 bg-purple-600/20 transition-all duration-150"
                            style={{ width: `${uf.progress}%` }}
                          />

                          <div className="flex items-center gap-2 z-10 min-w-0 flex-1">
                            <div className="p-1.5 bg-purple-500/15 text-purple-400 rounded-lg shrink-0">
                              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-cloud-upload">
                                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                                <path d="M12 12v9" />
                                <path d="m16 16-4-4-4 4" />
                              </svg>
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-[10px] font-bold text-gray-200 truncate">{uf.name}</span>
                              <span className="text-[8.5px] font-semibold text-gray-500">{uf.size}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 z-10 shrink-0">
                            <span className="text-[10px] font-extrabold text-blue-400">{uf.progress}%</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelUpload(uf.id);
                              }}
                              className="p-0.5 hover:bg-white/10 text-gray-450 hover:text-white rounded transition-colors"
                              title="Cancel Upload"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
                                <path d="M18 6 6 18" />
                                <path d="m6 6 12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </SpringNoteBook>

        {/* 3. 기존 북마크/메모 라이브러리 드로어 */}
        {isDrawerOpen && (
          <BookmarkSelector
            onSelectBookmark={handleSelectBookmark}
            onSelectMemo={handleSelectMemo}
            t={t}
            lang={lang}
            onClose={() => setIsDrawerOpen(false)}
          />
        )}
      </div>

      {/* 4. V6: 수려한 다이어리 감성의 페이지 삭제 확인 커스텀 모달 */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-[#3B281B] dark:bg-[#1E1E20] border border-[#2D1E15] dark:border-[#2D2D30] rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200 text-[#EBDCB9]">
            <h3 className="text-sm font-bold text-[#FBF6EC] dark:text-gray-150 mb-2">
              {lang === "ko" ? "페이지 삭제 확인" : lang === "ja" ? "ページ削除の確認" : "Delete Page Confirm"}
            </h3>
            <p className="text-xs text-gray-300 dark:text-gray-400 mb-6 leading-relaxed">
              {lang === "ko" 
                ? "정말로 현재 페이지를 삭제하시겠습니까?\n작성된 모든 오브젝트와 텍스트가 사라집니다."
                : lang === "ja"
                ? "本当にこのページを削除しますか？\n作成されたすべてのオブジェクトとテキストが失われます。"
                : "Are you sure you want to delete this page?\nAll written objects and text will be permanently lost."}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-2 text-xs font-bold text-[#EBDCB9] bg-white/10 hover:bg-white/15 active:scale-95 transition-all rounded-xl border border-white/5 cursor-pointer"
              >
                {lang === "ko" ? "취소" : lang === "ja" ? "キャンセル" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={confirmDeletePage}
                className="flex-1 py-2 text-xs font-bold text-[#3B281B] bg-red-400 hover:bg-red-500 active:scale-95 transition-all rounded-xl shadow-md shadow-red-900/10 cursor-pointer"
              >
                {lang === "ko" ? "삭제" : lang === "ja" ? "삭제" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
