import { useState, useEffect, useRef, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Handle, Position, NodeToolbar, useEdges, useUpdateNodeInternals } from "@xyflow/react";
import { Plus, Pencil, Trash2, ExternalLink, Sparkles, ChevronDown, RotateCcw, Search, Languages, X, Loader2, ClipboardCheck, Lock, Unlock, Smile, FileText } from "lucide-react";
import { useMindMapActions } from "../mindmap-model";
import { IconPicker } from "@/components/IconPicker";
import { LUCIDE_ICONS_MAP } from "@/components/DynamicIcon";

const THEME_CLASSES: Record<string, { border: string; bg: string; text: string; handle: string; rootBg: string }> = {
  indigo: {
    border: "border-indigo-500 dark:border-indigo-400",
    bg: "bg-indigo-50/60 hover:bg-indigo-100/70 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50",
    text: "text-indigo-900 dark:text-indigo-200",
    handle: "!bg-indigo-500",
    rootBg: "bg-gradient-to-br from-indigo-600 to-indigo-700 dark:from-indigo-500 dark:to-indigo-700",
  },
  emerald: {
    border: "border-emerald-500 dark:border-emerald-400",
    bg: "bg-emerald-50/60 hover:bg-emerald-100/70 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50",
    text: "text-emerald-900 dark:text-emerald-200",
    handle: "!bg-emerald-500",
    rootBg: "bg-gradient-to-br from-emerald-600 to-emerald-700 dark:from-emerald-500 dark:to-emerald-700",
  },
  amber: {
    border: "border-amber-500 dark:border-amber-400",
    bg: "bg-amber-50/60 hover:bg-amber-100/70 dark:bg-amber-950/30 dark:hover:bg-amber-950/50",
    text: "text-amber-900 dark:text-amber-200",
    handle: "!bg-amber-500",
    rootBg: "bg-gradient-to-br from-amber-500 to-amber-600 dark:from-amber-400 dark:to-amber-600",
  },
  rose: {
    border: "border-rose-500 dark:border-rose-400",
    bg: "bg-rose-50/60 hover:bg-rose-100/70 dark:bg-rose-950/30 dark:hover:bg-rose-950/50",
    text: "text-rose-900 dark:text-rose-200",
    handle: "!bg-rose-500",
    rootBg: "bg-gradient-to-br from-rose-600 to-rose-700 dark:from-rose-500 dark:to-rose-700",
  },
  violet: {
    border: "border-violet-500 dark:border-violet-400",
    bg: "bg-violet-50/60 hover:bg-violet-100/70 dark:bg-violet-950/30 dark:hover:bg-violet-950/50",
    text: "text-violet-900 dark:text-violet-200",
    handle: "!bg-violet-500",
    rootBg: "bg-gradient-to-br from-violet-600 to-violet-700 dark:from-violet-500 dark:to-violet-700",
  },
  slate: {
    border: "border-slate-500 dark:border-slate-400",
    bg: "bg-slate-50/60 hover:bg-slate-100/70 dark:bg-slate-800/50 dark:hover:bg-slate-800/80",
    text: "text-slate-900 dark:text-slate-200",
    handle: "!bg-slate-500",
    rootBg: "bg-gradient-to-br from-slate-600 to-slate-700 dark:from-slate-500 dark:to-slate-700",
  }
};

const SHAPE_CLASSES: Record<string, string> = {
  "rounded-rect": "rounded-xl",
  ellipse: "",
  capsule: "rounded-full",
  octagon: "",
};

// 팔각형 SVG 폴리곤용 테마별 fill/stroke Tailwind 클래스
const OCTAGON_SVG_CLASSES: Record<string, { normal: string; root: string; draft: string }> = {
  indigo:  { normal: "fill-indigo-50/70 dark:fill-indigo-950/40 stroke-indigo-500 dark:stroke-indigo-400",  root: "fill-indigo-600 dark:fill-indigo-500",  draft: "fill-amber-50/30 dark:fill-amber-950/20 stroke-amber-400 dark:stroke-amber-500" },
  emerald: { normal: "fill-emerald-50/70 dark:fill-emerald-950/40 stroke-emerald-500 dark:stroke-emerald-400", root: "fill-emerald-600 dark:fill-emerald-500", draft: "fill-amber-50/30 dark:fill-amber-950/20 stroke-amber-400 dark:stroke-amber-500" },
  amber:   { normal: "fill-amber-50/70 dark:fill-amber-950/40 stroke-amber-500 dark:stroke-amber-400",   root: "fill-amber-500 dark:fill-amber-400",   draft: "fill-amber-50/30 dark:fill-amber-950/20 stroke-amber-400 dark:stroke-amber-500" },
  rose:    { normal: "fill-rose-50/70 dark:fill-rose-950/40 stroke-rose-500 dark:stroke-rose-400",     root: "fill-rose-600 dark:fill-rose-500",     draft: "fill-amber-50/30 dark:fill-amber-950/20 stroke-amber-400 dark:stroke-amber-500" },
  violet:  { normal: "fill-violet-50/70 dark:fill-violet-950/40 stroke-violet-500 dark:stroke-violet-400",  root: "fill-violet-600 dark:fill-violet-500",  draft: "fill-amber-50/30 dark:fill-amber-950/20 stroke-amber-400 dark:stroke-amber-500" },
  slate:   { normal: "fill-slate-50/70 dark:fill-slate-800/60 stroke-slate-500 dark:stroke-slate-400",    root: "fill-slate-600 dark:fill-slate-500",    draft: "fill-amber-50/30 dark:fill-amber-950/20 stroke-amber-400 dark:stroke-amber-500" },
};

function getShapeStyle(shape: string): CSSProperties {
  if (shape === "ellipse") return { borderRadius: "50%", paddingLeft: "1.25rem", paddingRight: "1.25rem" };
  return {};
}

const AI_MENU_ITEMS = [
  { action: "expand",    icon: Sparkles,    label: "Expand node",        desc: "하위 아이디어 자동 생성" },
  { action: "summarize", icon: ChevronDown, label: "Summarize branch",   desc: "브랜치 전체 AI 요약" },
  { action: "generate",  icon: Plus,        label: "Generate from text", desc: "텍스트로 노드 생성" },
  { action: "rewrite",   icon: RotateCcw,   label: "Rewrite node",       desc: "노드 내용 AI 재작성" },
  { action: "proofread", icon: Search,      label: "Proofread node",     desc: "맞춤법 문법 교정" },
  { action: "translate", icon: Languages,   label: "Translate",          desc: "다른 언어로 번역" },
] as const;

type AiMenuAction = typeof AI_MENU_ITEMS[number]["action"];

const TRANSLATE_LANGS = [
  { lang: "ko" as const, label: "KR 한국어" },
  { lang: "en" as const, label: "US English" },
  { lang: "ja" as const, label: "JP 日本語" },
];

const EXPAND_MODES = [
  { mode: "general" as const, label: "💡 일반 확장 (General)" },
  { mode: "pros_cons" as const, label: "⚖️ 장단점 분석 (Pros & Cons)" },
  { mode: "actions" as const, label: "✅ 실행 계획 (Actions)" },
];

export default function MindMapNode({ id, data, selected }: { id: string; data: any; selected?: boolean }) {
  const {
    label,
    shape = "rounded-rect",
    colorTheme = "indigo",
    bookmarkUrl,
    icon,
    isRoot,
    isLocked = false,
    passwordHash = "",
  } = data;

  const {
    addChild: onAddChild,
    deleteNodeTree: onDeleteNode,
    updateNodeLabel: onLabelChange,
    updateNodeLockState: onUpdateLock,
    updateNodeIcon: onUpdateIcon,
    toggleNodeExpanded: onToggleExpand,
    registerAsTodoTask: onRegisterTodo,
    handleAiAction: onAiAction,
    layoutDirection,
    editingNodeId,
    setEditingNodeId,
    memoOpenNodeId,
    setMemoOpenNodeId,
  } = useMindMapActions();

  const edges = useEdges();
  const updateNodeInternals = useUpdateNodeInternals();

  // handleDir이 바뀐면 ReactFlow 내부 핸들 레지스트리를 강제 갱신
  // 이것이 동적 핸들 position 변경 시 ReactFlow 공식 권장 방법
  useEffect(() => {
    updateNodeInternals(id);
  }, [data.handleDir, id, updateNodeInternals]);

  const isTB = layoutDirection === "TB";
  const isRL = layoutDirection === "balanced" && data.layoutDir === "RL";

  const hasChildren = edges.some((e) => e.source === id);
  const isExpanded = data.isExpanded !== false; // 기본값 true

  // 하위 서브트리 전체에 속한 숨겨진 노드 개수 계산
  const getSubtreeCount = (nodeId: string): number => {
    const visited = new Set<string>();
    const queue = [nodeId];
    let count = 0;
    while (queue.length > 0) {
      const curr = queue.shift()!;
      edges.forEach((e) => {
        if (e.source === curr && !visited.has(e.target)) {
          visited.add(e.target);
          queue.push(e.target);
          count++;
        }
      });
    }
    return count;
  };

  const hiddenCount = !isExpanded ? getSubtreeCount(id) : 0;
  // mindmap-view에서 전체 edges 기준으로 계산해 data에 주입된 값을 우선 사용
  const lockedSubtreeCount: number = isLocked ? (data.lockedSubtreeCount ?? getSubtreeCount(id)) : 0;
  const [isEditing, setIsEditing] = useState(false);
  const [editVal, setEditVal] = useState(label);
  const [showAiMenu, setShowAiMenu] = useState(false);
  const [showTranslateSub, setShowTranslateSub] = useState(false);
  const [showExpandSub, setShowExpandSub] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateText, setGenerateText] = useState("");
  const [summaryPopup, setSummaryPopup] = useState<string | null>(null);
  const aiMenuRef = useRef<HTMLDivElement>(null);

  // 이모지 피커 관련 상태 및 Ref 추가
  const [showIconPicker, setShowIconPicker] = useState(false);
  const iconPickerRef = useRef<HTMLDivElement>(null);

  // 자물쇠 모달 state
  const [showLockModal, setShowLockModal] = useState(false);
  const [lockModalMode, setLockModalMode] = useState<"set" | "unlock">("set");
  const [lockInput, setLockInput] = useState("");
  const [lockInputConfirm, setLockInputConfirm] = useState("");
  const [lockError, setLockError] = useState("");

  const handleLockClick = () => {
    setLockInput("");
    setLockInputConfirm("");
    setLockError("");
    setLockModalMode(isLocked ? "unlock" : "set");
    setShowLockModal(true);
  };

  const handleLockSubmit = () => {
    if (lockModalMode === "set") {
      if (!lockInput.trim()) { setLockError("Please enter a password."); return; }
      if (lockInput !== lockInputConfirm) { setLockError("Passwords do not match."); return; }
      onUpdateLock?.(id, true, lockInput.trim());
      setShowLockModal(false);
    } else {
      if (lockInput.trim() === passwordHash) {
        onUpdateLock?.(id, false, "");
        setShowLockModal(false);
      } else {
        setLockError("Incorrect password.");
      }
    }
  };

  useEffect(() => { setEditVal(label); }, [label]);

  useEffect(() => {
    if (editingNodeId === id) {
      setIsEditing(true);
    } else {
      setIsEditing(false);
    }
  }, [editingNodeId, id]);

  useEffect(() => {
    if (!showAiMenu) return;
    const handler = (e: MouseEvent) => {
      if (aiMenuRef.current && !aiMenuRef.current.contains(e.target as Node)) {
        setShowAiMenu(false);
        setShowTranslateSub(false);
        setShowExpandSub(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showAiMenu]);

  useEffect(() => {
    if (!showIconPicker) return;
    const handler = (e: MouseEvent) => {
      if (iconPickerRef.current && !iconPickerRef.current.contains(e.target as Node)) {
        setShowIconPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showIconPicker]);

  const handleSave = () => {
    setIsEditing(false);
    setEditingNodeId?.(null);
    if (editVal.trim() && editVal.trim() !== label) {
      onLabelChange?.(id, editVal.trim());
    } else {
      setEditVal(label);
    }
  };

  const handleAiMenuClick = async (action: AiMenuAction, extra?: string) => {
    setShowAiMenu(false);
    setShowTranslateSub(false);
    setShowExpandSub(false);

    if (action === "generate") {
      setShowGenerateModal(true);
      return;
    }

    setIsAiLoading(true);
    try {
      const result = await onAiAction?.(action, id, extra);
      if (action === "summarize" && typeof result === "string") {
        setSummaryPopup(result);
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleGenerateSubmit = async () => {
    if (!generateText.trim()) return;
    setShowGenerateModal(false);
    setIsAiLoading(true);
    try {
      await onAiAction?.("generate", id, generateText);
    } finally {
      setIsAiLoading(false);
      setGenerateText("");
    }
  };

  const theme = THEME_CLASSES[colorTheme] || THEME_CLASSES.indigo;
  const shapeClass = SHAPE_CLASSES[shape] || SHAPE_CLASSES["rounded-rect"];

  const nodeDepth = data.depth !== undefined ? data.depth : (isRoot ? 0 : 2);

  const getStyleByDepth = () => {
    if (isRoot || nodeDepth === 0) {
      return `${theme.rootBg} text-white shadow-lg shadow-black/20 border-transparent min-w-[160px] px-6 py-3 text-sm font-extrabold`;
    }
    if (data.isDraft) {
      return "border-dashed border-amber-400 dark:border-amber-500 bg-amber-50/30 hover:bg-amber-50/50 dark:bg-amber-950/20 dark:hover:bg-amber-950/30 text-amber-900 dark:text-amber-200 border-2 opacity-80 shadow-inner min-w-[120px] max-w-[220px] px-4 py-2 text-xs font-semibold";
    }
    if (nodeDepth === 1) {
      return `${theme.border} ${theme.bg} ${theme.text} border-[2.5px] shadow-md min-w-[130px] max-w-[220px] px-4 py-2.5 text-xs font-extrabold`;
    }
    // depth 2+ : 테마 배경 사용 (다크 모드 호환)
    return `${theme.border} ${theme.bg} ${theme.text} border shadow-sm min-w-[100px] max-w-[180px] px-3.5 py-1.5 text-[11px] font-semibold opacity-90`;
  };

  const rootNodeStyle = getStyleByDepth();

  // octagon: 배경/테두리를 SVG가 담당하므로 layout+폰트+글자색만 추출
  const getOctagonLayoutStyle = (): string => {
    if (isRoot || nodeDepth === 0) {
      return "min-w-[140px] px-6 py-4 text-sm font-extrabold text-white";
    }
    if (data.isDraft) {
      return `min-w-[120px] max-w-[220px] px-4 py-3 text-xs font-semibold text-amber-900 dark:text-amber-200 opacity-80`;
    }
    if (nodeDepth === 1) {
      return `${theme.text} min-w-[130px] max-w-[220px] px-4 py-3.5 text-xs font-extrabold`;
    }
    return `${theme.text} min-w-[100px] max-w-[180px] px-3.5 py-2.5 text-[11px] font-semibold opacity-90`;
  };

  const isOctagon = shape === "octagon";
  // octagon SVG 폴리곤 클래스
  const octSvgKey = data.isDraft ? "draft" : (isRoot || nodeDepth === 0) ? "root" : "normal";
  const octSvgCls = (OCTAGON_SVG_CLASSES[colorTheme] || OCTAGON_SVG_CLASSES.indigo)[octSvgKey];
  // 선택 stroke width: 선택 시 굵게
  const octStrokeW = selected ? "5" : (isRoot || nodeDepth === 0 ? "0" : nodeDepth === 1 ? "3.5" : "2");

  return (
    <>
      <NodeToolbar
        isVisible={!!selected && !isEditing}
        position={Position.Top}
        className="pb-2.5"
      >
        <div className="bg-white/95 dark:bg-surface-900/95 backdrop-blur-sm border border-gray-200/80 dark:border-surface-700/80 rounded-full shadow-lg shadow-black/10 px-3 py-1.5 flex items-center gap-2 z-50 animate-in zoom-in-95 duration-150">
          <button
            onClick={() => onAddChild?.(id)}
            className="p-1 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-surface-800 rounded-md transition-all active:scale-90 cursor-pointer"
            title="하위 노드 생성 (Tab)"
          >
            <Plus size={14} />
          </button>

          <span className="w-px h-3 bg-gray-200 dark:bg-surface-700" />

          <button
            onClick={() => setMemoOpenNodeId?.(memoOpenNodeId === id ? null : id)}
            className={`p-1 rounded-md transition-all active:scale-90 cursor-pointer ${
              memoOpenNodeId === id
                ? "text-indigo-500 hover:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20"
                : "text-gray-400 hover:text-indigo-500 dark:text-gray-500 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-surface-800"
            }`}
            title="노드 상세 메모 편집 (Side-sheet)"
          >
            <FileText size={12} className={memoOpenNodeId === id ? "text-indigo-500" : "text-gray-400"} />
          </button>

          <span className="w-px h-3 bg-gray-200 dark:bg-surface-700" />

          <button
            onClick={() => setIsEditing(true)}
            className="p-1 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-surface-800 rounded-md transition-all active:scale-90 cursor-pointer"
            title="텍스트 편집 (더블클릭)"
          >
            <Pencil size={12} />
          </button>

          <span className="w-px h-3 bg-gray-200 dark:bg-surface-700" />

          <button
            onClick={() => onRegisterTodo?.(label)}
            className="p-1 text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 rounded-md transition-all active:scale-90 cursor-pointer"
            title="클릭북 Todo에 할 일 카드로 즉시 등록"
          >
            <ClipboardCheck size={13} className="text-emerald-500 dark:text-emerald-400" />
          </button>

          <span className="w-px h-3 bg-gray-200 dark:bg-surface-700" />

          <div className="relative" ref={aiMenuRef}>
            <button
              onClick={() => { setShowAiMenu((v) => !v); setShowTranslateSub(false); setShowExpandSub(false); }}
              className="p-1 text-gray-500 hover:text-amber-500 dark:text-gray-400 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded-md transition-all active:scale-90 cursor-pointer flex items-center gap-0.5"
              title="AI 액션 메뉴"
              disabled={isAiLoading}
            >
              {isAiLoading
                ? <Loader2 size={13} className="animate-spin text-amber-500" />
                : <Sparkles size={13} className="text-amber-500 fill-amber-400/25" />
              }
            </button>

            {showAiMenu && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-700 rounded-2xl shadow-xl z-[200] overflow-hidden animate-in zoom-in-95 fade-in duration-150">
                <div className="px-3 pt-2.5 pb-1.5 border-b border-gray-100 dark:border-surface-800">
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1">
                    <Sparkles size={9} className="fill-amber-400/40" /> AI Actions
                  </span>
                </div>
                <div className="py-1.5">
                  {AI_MENU_ITEMS.map(({ action, icon: Icon, label: itemLabel, desc }) => {
                    if (action === "expand") {
                      return (
                        <div key={action} className="relative">
                          <button
                            onClick={() => setShowExpandSub((v) => !v)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors group"
                          >
                            <span className="p-1 bg-amber-100 dark:bg-amber-950/40 rounded-lg group-hover:bg-amber-200 dark:group-hover:bg-amber-900/40 transition-colors">
                              <Icon size={11} className="text-amber-600 dark:text-amber-400" />
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-gray-800 dark:text-gray-200">{itemLabel}</div>
                              <div className="text-[10px] text-gray-400 dark:text-gray-500">{desc}</div>
                            </div>
                            <ChevronDown size={10} className={`text-gray-400 transition-transform ${showExpandSub ? "rotate-180" : ""}`} />
                          </button>
                          {showExpandSub && (
                            <div className="bg-gray-50 dark:bg-surface-950 border-t border-gray-100 dark:border-surface-800">
                              {EXPAND_MODES.map(({ mode, label: modeLabel }) => (
                                <button
                                  key={mode}
                                  onClick={() => handleAiMenuClick("expand", mode)}
                                  className="w-full text-left px-8 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-amber-950/20 hover:text-amber-700 dark:hover:text-amber-400 transition-colors font-medium"
                                >
                                  {modeLabel}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }
                    if (action === "translate") {
                      return (
                        <div key={action} className="relative">
                          <button
                            onClick={() => setShowTranslateSub((v) => !v)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors group"
                          >
                            <span className="p-1 bg-amber-100 dark:bg-amber-950/40 rounded-lg group-hover:bg-amber-200 dark:group-hover:bg-amber-900/40 transition-colors">
                              <Icon size={11} className="text-amber-600 dark:text-amber-400" />
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-gray-800 dark:text-gray-200">{itemLabel}</div>
                              <div className="text-[10px] text-gray-400 dark:text-gray-500">{desc}</div>
                            </div>
                            <ChevronDown size={10} className={`text-gray-400 transition-transform ${showTranslateSub ? "rotate-180" : ""}`} />
                          </button>
                          {showTranslateSub && (
                            <div className="bg-gray-50 dark:bg-surface-950 border-t border-gray-100 dark:border-surface-800">
                              {TRANSLATE_LANGS.map(({ lang, label: langLabel }) => (
                                <button
                                  key={lang}
                                  onClick={() => handleAiMenuClick("translate", lang)}
                                  className="w-full text-left px-8 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-amber-950/20 hover:text-amber-700 dark:hover:text-amber-400 transition-colors font-medium"
                                >
                                  {langLabel}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }
                    return (
                      <button
                        key={action}
                        onClick={() => handleAiMenuClick(action as AiMenuAction)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors group"
                      >
                        <span className="p-1 bg-amber-100 dark:bg-amber-950/40 rounded-lg group-hover:bg-amber-200 dark:group-hover:bg-amber-900/40 transition-colors">
                          <Icon size={11} className="text-amber-600 dark:text-amber-400" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-gray-800 dark:text-gray-200">{itemLabel}</div>
                          <div className="text-[10px] text-gray-400 dark:text-gray-500">{desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {!isRoot && (
            <>
              <span className="w-px h-3 bg-gray-200 dark:bg-surface-700" />
              <button
                onClick={() => onDeleteNode?.(id)}
                className="p-1 text-gray-400 hover:text-rose-500 dark:text-gray-500 dark:hover:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 rounded-md transition-all active:scale-90 cursor-pointer"
                title="Delete this node and subtree"
              >
                <Trash2 size={13} />
              </button>
            </>
          )}

          <span className="w-px h-3 bg-gray-200 dark:bg-surface-700" />
          <div className="relative" ref={iconPickerRef}>
            <button
              onClick={() => setShowIconPicker((v) => !v)}
              className={`p-1 rounded-md transition-all active:scale-90 cursor-pointer ${
                icon
                  ? "text-indigo-500 hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20"
                  : "text-gray-400 hover:text-indigo-500 dark:text-gray-500 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-surface-800"
              }`}
              title="이모지/아이콘 설정"
            >
              {icon ? (
                (() => {
                  const IconComp = LUCIDE_ICONS_MAP[icon];
                  if (IconComp) return <IconComp size={13} />;
                  return <span className="text-xs leading-none">{icon}</span>;
                })()
              ) : (
                <Smile size={13} />
              )}
            </button>

            {showIconPicker && (
              <IconPicker
                onSelect={(selectedIcon) => {
                  onUpdateIcon?.(id, selectedIcon);
                  setShowIconPicker(false);
                }}
                onClose={() => setShowIconPicker(false)}
                className="mt-2 left-1/2 -translate-x-1/2"
              />
            )}
          </div>

          <span className="w-px h-3 bg-gray-200 dark:bg-surface-700" />
          <button
            onClick={handleLockClick}
            className={`p-1 rounded-md transition-all active:scale-90 cursor-pointer ${
              isLocked
                ? "text-amber-500 hover:text-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-950/20"
                : "text-gray-400 hover:text-amber-500 dark:text-gray-500 dark:hover:text-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-950/20"
            }`}
            title={isLocked ? "Unlock branch" : "Lock branch with password"}
          >
            {isLocked ? <Lock size={13} className="fill-amber-400/20" /> : <Unlock size={13} />}
          </button>
        </div>
      </NodeToolbar>

      {/* Password Modal — portal to escape ReactFlow transform context */}
      {showLockModal && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9000] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-surface-700 w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-amber-100 dark:bg-amber-950/40 rounded-xl shrink-0">
                {lockModalMode === "set" ? (
                  <Lock size={20} className="text-amber-600 dark:text-amber-400" />
                ) : (
                  <Unlock size={20} className="text-amber-600 dark:text-amber-400" />
                )}
              </div>
              <div>
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                  {lockModalMode === "set" ? "Lock Branch" : "Unlock Branch"}
                </h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {lockModalMode === "set" ? "Set a password to protect this branch and its children" : "Enter your password to reveal content"}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <input
                autoFocus
                type="password"
                value={lockInput}
                onChange={(e) => { setLockInput(e.target.value); setLockError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") { lockModalMode === "set" ? document.getElementById("lock-confirm-input")?.focus() : handleLockSubmit(); } }}
                placeholder={lockModalMode === "set" ? "Set password..." : "Enter password..."}
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-surface-800 border border-gray-200 dark:border-surface-700 rounded-xl text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
              {lockModalMode === "set" && (
                <input
                  id="lock-confirm-input"
                  type="password"
                  value={lockInputConfirm}
                  onChange={(e) => { setLockInputConfirm(e.target.value); setLockError(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleLockSubmit(); }}
                  placeholder="Confirm password..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-surface-800 border border-gray-200 dark:border-surface-700 rounded-xl text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              )}
              {lockError && (
                <p className="text-xs text-rose-500 font-semibold flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/20 px-3 py-2 rounded-lg">
                  <span>⚠️</span> {lockError}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowLockModal(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-surface-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleLockSubmit}
                className="px-5 py-2 text-sm font-bold bg-amber-500 hover:bg-amber-400 text-white rounded-xl transition-colors cursor-pointer shadow-sm"
              >
                {lockModalMode === "set" ? "🔒 Lock" : "🔓 Unlock"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {summaryPopup && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full z-[300] w-64 bg-slate-900 text-white rounded-2xl shadow-2xl p-3 text-xs leading-relaxed animate-in zoom-in-95 duration-200">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">AI 요약</span>
            <button onClick={() => setSummaryPopup(null)} className="text-gray-400 hover:text-white transition-colors">
              <X size={12} />
            </button>
          </div>
          <p className="text-gray-200">{summaryPopup}</p>
        </div>
      )}

      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-surface-700 w-full max-w-md p-5 animate-in zoom-in-95 duration-200">
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <Sparkles size={14} className="text-amber-500" /> Generate from text
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">텍스트를 입력하면 AI가 마인드맵 브랜치로 자동 변환합니다.</p>
            <textarea
              autoFocus
              value={generateText}
              onChange={(e) => setGenerateText(e.target.value)}
              placeholder="예: 우리 팀의 2분기 마케팅 전략은 SNS 광고 강화, 인플루언서 협업, 콘텐츠 SEO 최적화를 중심으로..."
              className="w-full h-28 px-3 py-2.5 bg-gray-50 dark:bg-surface-800 border border-gray-200 dark:border-surface-700 rounded-xl text-xs text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 resize-none"
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => { setShowGenerateModal(false); setGenerateText(""); }}
                className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-surface-800 rounded-lg transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={handleGenerateSubmit}
                disabled={!generateText.trim()}
                className="px-4 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors cursor-pointer"
              >
                생성하기
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        onDoubleClick={() => !isRoot && setIsEditing(true)}
        style={isOctagon ? {} : getShapeStyle(shape)}
        className={[
          "relative flex items-center justify-center cursor-pointer transition-all duration-200 select-none",
          isOctagon ? getOctagonLayoutStyle() : rootNodeStyle,
          isOctagon ? "" : shapeClass,
          selected && !isOctagon ? "ring-2 ring-offset-1 ring-indigo-400 dark:ring-indigo-300" : "",
        ].join(" ")}
      >
        {/* 팔각형 SVG 배경 레이어 — clip-path 없이 polygon으로 직접 그림 */}
        {isOctagon && (
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible", pointerEvents: "none" }}
          >
            {selected && (
              <defs>
                <filter id={`oct-glow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
            )}
            <polygon
              points="30,0 70,0 100,18 100,82 70,100 30,100 0,82 0,18"
              className={octSvgCls}
              strokeWidth={octStrokeW}
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
              filter={selected ? `url(#oct-glow-${id})` : undefined}
            />
          </svg>
        )}
        {!isRoot && (
          <Handle
            type="target"
            position={
              data.handleDir === "top" ? Position.Top :
              data.handleDir === "bottom" ? Position.Bottom :
              data.handleDir === "left" ? Position.Left :
              data.handleDir === "right" ? Position.Right :
              (isTB ? Position.Top : (isRL ? Position.Right : Position.Left))
            }
            className={`w-2 h-2 border-none ${theme.handle}`}
          />
        )}

        {isAiLoading ? (
          <div className="flex items-center gap-1.5 text-current opacity-70">
            <Loader2 size={12} className="animate-spin" />
            <span>Processing...</span>
          </div>
        ) : isEditing ? (
          <input
            autoFocus
            value={editVal}
            onChange={(e) => setEditVal(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") { setIsEditing(false); setEditingNodeId?.(null); setEditVal(label); }
            }}
            className="bg-transparent border-b border-current outline-none w-full text-center text-xs font-semibold min-w-[80px]"
          />
        ) : isLocked ? (
          <div className="flex flex-col items-center justify-center gap-1.5 py-1.5">
            <Lock size={16} className="text-amber-500" />
            <span className="whitespace-normal break-words leading-snug blur-sm select-none pointer-events-none opacity-40 text-xs">{label}</span>
            {lockedSubtreeCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-extrabold text-amber-400 bg-amber-950/40 border border-amber-700/40 px-2 py-0.5 rounded-full">
                <Lock size={9} />
                {lockedSubtreeCount}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 justify-center w-full">
            {data.memoContent && data.memoContent.trim() && (
              <span title="상세 메모 있음">
                <FileText size={11} className="shrink-0 text-indigo-500 dark:text-indigo-400/80" />
              </span>
            )}
            {icon && (
              (() => {
                const IconComp = LUCIDE_ICONS_MAP[icon];
                if (IconComp) return <IconComp size={13} className="shrink-0" />;
                return <span className="shrink-0 select-none text-[13px] leading-none">{icon}</span>;
              })()
            )}
            {bookmarkUrl && (
              <a
                href={bookmarkUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
                title={bookmarkUrl}
              >
                <ExternalLink size={11} />
              </a>
            )}
            <span className="whitespace-normal break-words leading-snug">{label}</span>
          </div>
        )}

        {isRoot ? (
          isTB ? (
            <Handle type="source" position={Position.Bottom} className={`w-2 h-2 border-none ${theme.handle}`} />
          ) : layoutDirection === "balanced" ? (
            <>
              <Handle type="source" id="left" position={Position.Left} className={`w-2 h-2 border-none ${theme.handle}`} />
              <Handle type="source" id="right" position={Position.Right} className={`w-2 h-2 border-none ${theme.handle}`} />
            </>
          ) : (
            <Handle type="source" position={Position.Right} className={`w-2 h-2 border-none ${theme.handle}`} />
          )
        ) : (
          <Handle
            type="source"
            position={isTB ? Position.Bottom : (isRL ? Position.Left : Position.Right)}
            className={`w-2 h-2 border-none ${theme.handle}`}
          />
        )}

        {/* 접기/펼치기 토글 버튼 */}
        {!isRoot && hasChildren && (() => {
          let toggleBtnClass = "";
          if (isTB) {
            toggleBtnClass = "absolute bottom-0 translate-y-1/2 left-1/2 -translate-x-1/2";
          } else if (isRL) {
            toggleBtnClass = "absolute left-0 -translate-x-1/2 top-1/2 -translate-y-1/2";
          } else {
            toggleBtnClass = "absolute right-0 translate-x-1/2 top-1/2 -translate-y-1/2";
          }

          const themeColors: Record<string, string> = {
            indigo: "bg-indigo-500 text-white hover:bg-indigo-600 hover:scale-105",
            emerald: "bg-emerald-500 text-white hover:bg-emerald-600 hover:scale-105",
            amber: "bg-amber-500 text-white hover:bg-amber-600 hover:scale-105",
            rose: "bg-rose-500 text-white hover:bg-rose-600 hover:scale-105",
            violet: "bg-violet-500 text-white hover:bg-violet-600 hover:scale-105",
            slate: "bg-slate-500 text-white hover:bg-slate-600 hover:scale-105",
          };
          const activeColor = themeColors[colorTheme] || themeColors.indigo;

          return (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand?.(id);
              }}
              className={[
                "flex items-center justify-center shadow-md font-extrabold cursor-pointer border border-white dark:border-surface-900 transition-all z-10 select-none",
                isExpanded
                  ? "w-4 h-4 rounded-full text-[9px]"
                  : hiddenCount > 0
                    ? "min-w-[22px] h-[22px] rounded-full text-[11px] px-1.5"
                    : "w-5 h-5 rounded-full text-[10px]",
                activeColor,
                toggleBtnClass
              ].join(" ")}
              title={isExpanded ? "Collapse children" : "Expand children"}
            >
              {isExpanded ? (
                "-"
              ) : (
                hiddenCount > 0 ? `+${hiddenCount}` : "+"
              )}
            </button>
          );
        })()}
      </div>
    </>
  );
}