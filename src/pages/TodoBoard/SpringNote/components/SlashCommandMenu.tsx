import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import type { Editor } from "@tiptap/react";
import {
  Sparkles, MessageSquare, Type, Heading1, Heading2, Heading3,
  List, ListOrdered, ListTodo, Quote, Code, Table, Minus,
} from "lucide-react";
import type { SlashCommandState } from "./SlashCommandExtension";
import { SLASH_PLUGIN_KEY } from "./SlashCommandExtension";
import AiInlinePrompt from "./AiInlinePrompt";

interface CommandItem {
  id: string;
  labelKey: string; // 다국어 키
  descKey: string;  // 다국어 키
  icon: React.ReactNode;
  section: "AI" | "Style" | "Insert";
  aiType?: "continue" | "ask";
  action?: (editor: Editor) => void;
}

const buildCommands = (): CommandItem[] => [
  {
    id: "continue-writing",
    labelKey: "springNoteAiContinueWriting",
    descKey: "springNoteAiContinueDesc",
    icon: <Sparkles size={13} className="text-violet-400" />,
    section: "AI",
    aiType: "continue",
  },
  {
    id: "ask-ai",
    labelKey: "springNoteAiAsk",
    descKey: "springNoteAiAskDesc",
    icon: <MessageSquare size={13} className="text-violet-400" />,
    section: "AI",
    aiType: "ask",
  },
  {
    id: "text",
    labelKey: "Text", // 스타터킷 기본은 영어 고정 혹은 직접 전달 가능
    descKey: "Text",
    icon: <Type size={13} className="text-gray-400" />,
    section: "Style",
    action: (e) => e.chain().focus().setParagraph().run(),
  },
  {
    id: "h1",
    labelKey: "Heading 1",
    descKey: "Heading 1",
    icon: <Heading1 size={13} className="text-gray-400" />,
    section: "Style",
    action: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    id: "h2",
    labelKey: "Heading 2",
    descKey: "Heading 2",
    icon: <Heading2 size={13} className="text-gray-400" />,
    section: "Style",
    action: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    id: "h3",
    labelKey: "Heading 3",
    descKey: "Heading 3",
    icon: <Heading3 size={13} className="text-gray-400" />,
    section: "Style",
    action: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    id: "bullet",
    labelKey: "Bullet List",
    descKey: "Bullet List",
    icon: <List size={13} className="text-gray-400" />,
    section: "Style",
    action: (e) => e.chain().focus().toggleBulletList().run(),
  },
  {
    id: "ordered",
    labelKey: "Numbered List",
    descKey: "Numbered List",
    icon: <ListOrdered size={13} className="text-gray-400" />,
    section: "Style",
    action: (e) => e.chain().focus().toggleOrderedList().run(),
  },
  {
    id: "task",
    labelKey: "To-do List",
    descKey: "To-do List",
    icon: <ListTodo size={13} className="text-gray-400" />,
    section: "Style",
    action: (e) => e.chain().focus().toggleTaskList().run(),
  },
  {
    id: "blockquote",
    labelKey: "Blockquote",
    descKey: "Blockquote",
    icon: <Quote size={13} className="text-gray-400" />,
    section: "Style",
    action: (e) => e.chain().focus().toggleBlockquote().run(),
  },
  {
    id: "code-block",
    labelKey: "Code Block",
    descKey: "Code Block",
    icon: <Code size={13} className="text-gray-400" />,
    section: "Style",
    action: (e) => e.chain().focus().toggleCodeBlock().run(),
  },
  {
    id: "table",
    labelKey: "Table",
    descKey: "Table",
    icon: <Table size={13} className="text-gray-400" />,
    section: "Insert",
    action: (e) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
  {
    id: "separator",
    labelKey: "Separator",
    descKey: "Separator",
    icon: <Minus size={13} className="text-gray-400" />,
    section: "Insert",
    action: (e) => e.chain().focus().setHorizontalRule().run(),
  },
];

interface Props {
  editor: Editor;
  slashState: SlashCommandState;
  aiAvailable: boolean;
  t: (key: string, replacements?: Record<string, any>) => string;
}

export default function SlashCommandMenu({ editor, slashState, aiAvailable, t }: Props) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [aiMode, setAiMode] = useState<"continue" | "ask" | null>(null);
  const isKeyboardNavRef = useRef(false);
  const ignoreMouseUntil = useRef(0);
  const lastMouseCoords = useRef<{ x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  // 번역 실패 시를 대비한 하드코딩 폴백 딕셔너리
  const getTranslated = useCallback((key: string): string => {
    const translation = t(key);
    // 만약 번역이 안 되어 키 이름이 그대로 나오거나 없는 경우 폴백
    if (!translation || translation === key) {
      const browserLang = navigator.language?.toLowerCase() || "en";
      const isKo = browserLang.startsWith("ko");
      const isJa = browserLang.startsWith("ja");

      const fallbacks: Record<string, { ko: string; ja: string; en: string }> = {
        springNoteAiContinueWriting: {
          ko: "AI 이어 쓰기",
          ja: "AI Continue Writing",
          en: "Continue Writing",
        },
        springNoteAiAsk: {
          ko: "AI에게 질문",
          ja: "Ask AI",
          en: "Ask AI",
        },
        springNoteAiContinueDesc: {
          ko: "AI가 내용을 이어서 작성합니다",
          ja: "AIが内容を続けて執筆します",
          en: "AI naturally continues writing the text",
        },
        springNoteAiAskDesc: {
          ko: "AI에게 무엇이든 질문합니다",
          ja: "AIに何でも質問します",
          en: "Ask AI anything to generate or format text",
        },
      };

      if (fallbacks[key]) {
        return isKo ? fallbacks[key].ko : isJa ? fallbacks[key].ja : fallbacks[key].en;
      }
    }
    return translation || key;
  }, [t]);

  const commands = buildCommands();
  const filtered = commands.filter((c) => {
    if (!slashState.query) return true;
    const q = slashState.query.toLowerCase();
    const resolvedLabel = getTranslated(c.labelKey);
    return resolvedLabel.toLowerCase().includes(q) || c.id.includes(q);
  });

  const closeMenu = useCallback(() => {
    const { view } = editor;
    view.dispatch(
      view.state.tr.setMeta(SLASH_PLUGIN_KEY, {
        active: false, query: "", range: { from: 0, to: 0 }, rect: null,
      })
    );
  }, [editor]);

  const executeCommand = useCallback((item: CommandItem) => {
    const { view } = editor;
    const current = SLASH_PLUGIN_KEY.getState(view.state);
    const range = current?.range ?? slashState.range;

    editor.chain().focus().deleteRange(range).run();

    if (item.aiType) {
      setAiMode(item.aiType);
      return;
    }
    item.action?.(editor);
    closeMenu();
  }, [editor, slashState.range, closeMenu]);

  useEffect(() => {
    const handler = (e: Event) => {
      const key = (e as CustomEvent<string>).detail;
      isKeyboardNavRef.current = true;
      if (key === "ArrowDown") {
        setSelectedIdx((prev) => (prev + 1) % filtered.length);
      } else if (key === "ArrowUp") {
        setSelectedIdx((prev) => (prev - 1 + filtered.length) % filtered.length);
      } else if (key === "Enter") {
        const item = filtered[selectedIdx];
        if (item) executeCommand(item);
      }
    };
    document.addEventListener("slashMenuKey", handler);
    return () => document.removeEventListener("slashMenuKey", handler);
  }, [filtered, selectedIdx, executeCommand]);

  useEffect(() => {
    if (!isKeyboardNavRef.current) return;
    isKeyboardNavRef.current = false;
    const btn = itemRefs.current.get(selectedIdx);
    if (btn) {
      ignoreMouseUntil.current = Date.now() + 200;
      btn.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIdx]);

  useEffect(() => {
    setSelectedIdx(0);
  }, [slashState.query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        if (!aiMode) closeMenu();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [closeMenu, aiMode]);

  useEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const stopProp = (e: WheelEvent) => e.stopPropagation();
    el.addEventListener("wheel", stopProp, { passive: true });
    return () => el.removeEventListener("wheel", stopProp);
  }, []);

  const rect = slashState.rect;
  const menuStyle: React.CSSProperties = rect
    ? {
        position: "fixed",
        top: Math.min(rect.bottom + 4, window.innerHeight - 360),
        left: Math.max(8, Math.min(rect.left, window.innerWidth - 440)),
        zIndex: 9999,
      }
    : { display: "none" };

  const sections: Array<"AI" | "Style" | "Insert"> = ["AI", "Style", "Insert"];

  const content = (
    <div ref={menuRef} style={menuStyle}>
      {aiMode ? (
        <AiInlinePrompt
          editor={editor}
          aiType={aiMode}
          aiAvailable={aiAvailable}
          t={t}
          onClose={() => { setAiMode(null); closeMenu(); }}
        />
      ) : (
        <div className="w-56 rounded-xl shadow-2xl border border-white/10 bg-[#1e1e20]/96 backdrop-blur-md overflow-hidden">
          <div className="px-3 py-2 border-b border-white/8">
            <span className="text-[10px] text-gray-500 font-mono">
              {slashState.query ? `/${slashState.query}` : "/Filter..."}
            </span>
          </div>

          <div className="overflow-y-auto max-h-72 py-1">
            {sections.map((section) => {
              const items = filtered.filter((c) => c.section === section);
              if (items.length === 0) return null;
              return (
                <div key={section}>
                  <p className="px-3 pt-2 pb-0.5 text-[10px] font-semibold uppercase tracking-widest text-gray-600">
                    {section}
                  </p>
                  {items.map((item) => {
                    const globalIdx = filtered.indexOf(item);
                    const isSelected = globalIdx === selectedIdx;
                    const isAiItem = item.section === "AI";
                    const resolvedLabel = getTranslated(item.labelKey);

                    return (
                      <button
                        key={item.id}
                        type="button"
                        ref={(el) => {
                          if (el) itemRefs.current.set(globalIdx, el);
                          else itemRefs.current.delete(globalIdx);
                        }}
                        onMouseMove={(e) => {
                          if (Date.now() < ignoreMouseUntil.current) return;
                          const { clientX: x, clientY: y } = e;
                          const last = lastMouseCoords.current;
                          if (last && last.x === x && last.y === y) return;
                          lastMouseCoords.current = { x, y };
                          setSelectedIdx(globalIdx);
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          executeCommand(item);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-left transition-colors duration-75 ${
                          isSelected ? "bg-white/10" : "hover:bg-white/5"
                        }`}
                      >
                        <span className="shrink-0 w-5 h-5 flex items-center justify-center">
                          {item.icon}
                        </span>
                        <span className={`text-[12px] font-medium leading-tight ${
                          isAiItem
                            ? aiAvailable
                              ? "text-violet-300"
                              : "text-violet-400/50"
                            : "text-gray-200"
                        }`}>
                          {resolvedLabel}
                          {isAiItem && !aiAvailable && (
                            <span className="ml-1.5 text-[9px] text-gray-600 font-normal">AI OFF</span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}

            {filtered.length === 0 && (
              <p className="px-3 py-4 text-center text-[11px] text-gray-500">No results</p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(content, document.body);
}
