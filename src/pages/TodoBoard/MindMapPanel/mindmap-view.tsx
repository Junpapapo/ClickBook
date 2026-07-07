import { useEffect, useRef, useCallback, useState } from "react";
import { 
  ReactFlow, 
  MiniMap, 
  Background, 
  Panel,
  ReactFlowProvider,
  useReactFlow,
  Node
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { X, StickyNote, Copy, Trash2, BookOpen, Edit3, ChevronDown, ChevronUp, Sparkles, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import {
  MEMO_DOT,
  MEMO_CARD_BG as MEMO_CARD_CLS,
  MEMO_ACCENT,
  MEMO_TEXTAREA_BG,
} from "@/shared/colors";
import { refineMemoDraft } from "@/shared/categorizer";
import { useLang } from "@/shared/LanguageContext";
import type { ColorTheme } from "./mindmap-types";
import { useMindMapState, MindMapActionsContext } from "./mindmap-model";
import MindMapNode from "./components/MindMapNode";
import QuickLoadSelector from "./components/QuickLoadSelector";
import NodeToolbar from "./components/NodeToolbar";
import TemplateSelector from "./components/TemplateSelector";
import ImportModal from "./components/ImportModal";
import ConfirmDeleteModal from "./components/ConfirmDeleteModal";
import RenameModal from "./components/RenameModal";

const nodeTypes = {
  mindmapNode: MindMapNode
};

interface Props {
  taskId: string;
  taskTitle: string;
  onClose: () => void;
}

function MindMapCanvas({ taskId, taskTitle, onClose }: Props) {
  const { t } = useLang();
  const { screenToFlowPosition, fitView, zoomIn, zoomOut } = useReactFlow();
  const reactFlowRef = useRef<HTMLDivElement>(null);
  
  const {
    nodes,
    edges,
    selectedNodeId,
    setSelectedNodeId,
    onNodesChange,
    onEdgesChange,
    isAiExpanding,
    aiError,
    setAiError,
    aiSummaryResult,
    setAiSummaryResult,
    fileList,
    activeFileName,
    layoutDirection,
    changeLayoutDirection,
    loadMapContent,
    createNewMap,
    refreshFileList,
    updateNodeShape,
    updateNodeTheme,
    updateNodeLabel,
    updateNodeLockState,
    addChild,
    deleteNodeTree,
    toggleNodeExpanded,
    registerAsTodoTask,
    exportMapToMarkdown,
    addBookmarkNode,
    handleAiAction,
    importMapFromJson,
    exportMapToJson,
    deleteMapFile,
    renameMapFile,
    saveMapData,
    selectedNodeLabel,
    selectedNodeShape,
    selectedNodeTheme,
    memoContent,
    memoColor,
    updateMemo
  } = useMindMapState(taskId, onClose);

  const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);

  const hasAutoLoadedRef = useRef(false);

  // 첫 연동 시 activeFileName이 없고 파일 리스트가 존재하면 첫 번째 파일을 로드해 줌 (최초 1회만 실행하도록 제어)
  useEffect(() => {
    if (hasAutoLoadedRef.current) return;
    if (!activeFileName && fileList.length > 0) {
      hasAutoLoadedRef.current = true;
      loadMapContent(fileList[0].fileName);
    }
  }, [fileList, activeFileName, loadMapContent]);

  // 파일 전환(불러오기) 및 신규 생성 시 화면에 딱 맞게 정렬(fitView) 실행
  useEffect(() => {
    if (activeFileName && nodes.length > 0) {
      const timer = setTimeout(() => {
        fitView({ duration: 500, padding: 0.15 });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [activeFileName, fitView, nodes.length]);

  // 단축키 제어 (Tab: 자식 노드 생성, Delete/Backspace: 삭제)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
      return;
    }

    if (!selectedNodeId) return;

    if (e.key === "Tab") {
      e.preventDefault();
      addChild();
    } else if (e.key === "Delete" || e.key === "Backspace") {
      if (selectedNodeId !== "root") {
        e.preventDefault();
        deleteNodeTree();
      }
    }
  }, [selectedNodeId, addChild, deleteNodeTree]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNodeId(node.id);
  }, [setSelectedNodeId]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();

    let bookmarkTitle = "";
    let bookmarkUrl = "";

    try {
      const rawData = e.dataTransfer.getData("application/reactflow");
      if (rawData) {
        const parsed = JSON.parse(rawData);
        bookmarkTitle = parsed.title || "";
        bookmarkUrl = parsed.url || "";
      } else {
        const textData = e.dataTransfer.getData("text/plain");
        if (textData.startsWith("http")) {
          bookmarkUrl = textData;
          bookmarkTitle = "Linked Link";
        } else {
          const parsed = JSON.parse(textData);
          bookmarkTitle = parsed.title || parsed.label || "";
          bookmarkUrl = parsed.url || "";
        }
      }
    } catch {
      bookmarkUrl = e.dataTransfer.getData("url") || e.dataTransfer.getData("text/uri-list") || "";
      bookmarkTitle = "Dropped Bookmark";
    }

    if (!bookmarkUrl) return;

    const flowPosition = screenToFlowPosition({
      x: e.clientX,
      y: e.clientY
    });

    addBookmarkNode(bookmarkTitle, bookmarkUrl, flowPosition);
  }, [screenToFlowPosition, addBookmarkNode]);

  const triggerAutoFit = useCallback(() => {
    fitView({ duration: 600, padding: 0.15 });
  }, [fitView]);

  // 이미지 저장 (PNG) — 최적화: 폰트 fetch 스킵, toBlob 사용
  const [isSavingImage, setIsSavingImage] = useState(false);
  const exportMapToImage = useCallback(async () => {
    if (isSavingImage) return;
    // viewport 대신 전체 renderer를 캡처해 현재 화면 그대로 저장
    const el = reactFlowRef.current?.querySelector(".react-flow__renderer") as HTMLElement | null;
    if (!el) return;
    setIsSavingImage(true);
    try {
      const isDark = document.documentElement.classList.contains("dark");
      const blob = await import("html-to-image").then(({ toBlob }) =>
        toBlob(el, {
          backgroundColor: isDark ? "#0f172a" : "#f8fafc",
          pixelRatio: 1.5,
          skipFonts: true,          // 폰트 fetch 스킵 → 최대 병목 제거
          cacheBust: false,
          filter: (node: Element) => {
            // ReactFlow 컨트롤 UI(줌버튼, 미니맵 등)는 제외하고 순수 캔버스만 캡처
            if (node.classList?.contains("react-flow__controls")) return false;
            if (node.classList?.contains("react-flow__attribution")) return false;
            return true;
          },
        })
      );
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeFileName?.replace(".json", "") ?? "mindmap"}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) {
      console.error("Image export failed:", e);
    } finally {
      setIsSavingImage(false);
    }
  }, [activeFileName, isSavingImage]);

  // 노드 드래그가 멈추었을 때 변경된 위치 좌표를 실시간으로 저장
  const onNodeDragStop = useCallback(() => {
    saveMapData(nodes, edges);
  }, [nodes, edges, saveMapData]);

  return (
    <MindMapActionsContext.Provider value={{ addChild, deleteNodeTree, updateNodeLabel, updateNodeLockState, toggleNodeExpanded, registerAsTodoTask, handleAiAction, layoutDirection }}>
      <div
        ref={reactFlowRef}
        onDragOver={onDragOver}
        onDrop={onDrop}
        className="w-full h-full flex flex-col bg-gray-50 dark:bg-surface-950 border-l border-gray-200 dark:border-surface-800 relative"
      >
      {/* AI Error Toast Banner */}
      {aiError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 z-[100] animate-in slide-in-from-top-4 duration-300">
          <span>⚠️ {aiError}</span>
          <button 
            onClick={() => setAiError(null)}
            className="p-1 hover:bg-white/15 rounded-lg transition-colors ml-2 cursor-pointer"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* AI Summary Result Banner */}
      {aiSummaryResult && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 max-w-sm w-full bg-amber-950/95 border border-amber-700/50 text-amber-100 text-xs px-4 py-3 rounded-2xl shadow-xl flex items-start gap-2.5 z-[100] animate-in slide-in-from-top-4 duration-300 mx-4">
          <span className="text-amber-400 mt-0.5 shrink-0">✨</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-amber-300 text-[10px] uppercase tracking-wider mb-1">{t("mindmapAiSummaryTitle")}</p>
            <p className="leading-relaxed">{aiSummaryResult.text}</p>
          </div>
          <button 
            onClick={() => setAiSummaryResult(null)}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors shrink-0 cursor-pointer"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* AI Expansion Loader Card Overlay */}
      {isAiExpanding && (
        <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px] flex items-center justify-center z-[90] pointer-events-none">
          <div className="bg-slate-900/90 dark:bg-surface-900/90 border border-white/10 dark:border-surface-800/80 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3.5 max-w-sm mx-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-white">{t("mindmapAiAnalyzing")}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{t("mindmapAiAnalyzingDesc")}</p>
            </div>
          </div>
        </div>
      )}

      {/* Combined One-line Header & Controller */}
      <div className="flex items-center justify-between gap-4 p-3 bg-white dark:bg-surface-900 border-b border-gray-200 dark:border-surface-850 shrink-0 select-none">
        {/* Left: Brand & File Title */}
        <div className="min-w-0 flex items-center gap-2">
          <div className="p-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-500 shrink-0">
            <StickyNote size={14} />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-widest block leading-none" title="MIND MAP EDITOR">
              {taskTitle || "MIND MAP EDITOR"}
            </span>
            <h2 className="text-xs font-black text-gray-800 dark:text-gray-100 truncate mt-0.5 leading-none">
              {activeFileName ? activeFileName.replace(".json", "") : "No Map Loaded"}
            </h2>
          </div>
        </div>

        {/* Right: Integrated Actions Selector */}
        <div className="flex-1 flex justify-end min-w-0">
          <QuickLoadSelector
            fileList={fileList}
            activeFileName={activeFileName}
            onSelectFile={loadMapContent}
            onImportClick={() => setIsImportModalOpen(true)}
            onExportClick={exportMapToJson}
            onExportMarkdownClick={exportMapToMarkdown}
            onExportImageClick={exportMapToImage}
            isSavingImage={isSavingImage}
            onDeleteClick={() => setIsDeleteModalOpen(true)}
            onRenameClick={() => setIsRenameModalOpen(true)}
            onCreateNewMap={() => setIsTemplateSelectorOpen(true)}
            onRefreshList={refreshFileList}
          />
        </div>
      </div>

      {/* Main Flow Canvas */}
      <div className="flex-1 relative min-h-0 bg-slate-50 dark:bg-surface-950">
        {activeFileName ? (() => {
          const visibleNodes = (() => {
            const lockedIds = new Set<string>();
            nodes.forEach((n) => {
              if (n.data?.isLocked) {
                lockedIds.add(n.id);
              }
            });

            if (lockedIds.size === 0) return nodes;

            // 전체 edges 기준으로 하위 노드 ID 집합 계산
            const nodesToHide = new Set<string>();
            const findDescendants = (pid: string) => {
              edges.forEach((e) => {
                if (e.source === pid && !nodesToHide.has(e.target)) {
                  nodesToHide.add(e.target);
                  findDescendants(e.target);
                }
              });
            };

            // 잠긴 노드별로 하위 카운트를 계산해 data에 주입
            const lockedCountMap = new Map<string, number>();
            lockedIds.forEach((lid) => {
              const before = nodesToHide.size;
              findDescendants(lid);
              lockedCountMap.set(lid, nodesToHide.size - before);
            });

            return nodes
              .filter((n) => !nodesToHide.has(n.id))
              .map((n) => {
                if (lockedCountMap.has(n.id)) {
                  return { ...n, data: { ...n.data, lockedSubtreeCount: lockedCountMap.get(n.id) } };
                }
                return n;
              });
          })();

          const visibleEdges = (() => {
            const nodeIds = new Set(visibleNodes.map((n) => n.id));
            return edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));
          })();

          return (
            <ReactFlow
              nodes={visibleNodes}
              edges={visibleEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              onNodeDragStop={onNodeDragStop}
              nodeTypes={nodeTypes}
              deleteKeyCode={null}
              selectionKeyCode={null}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              minZoom={0.2}
              maxZoom={1.5}
              className="[&_.react-flow__controls]:dark:bg-surface-800"
            >
              <MiniMap 
              pannable
              zoomable
              nodeColor={(n) => {
                if (n.data?.isRoot) return "#6366f1";
                const colorMap: Record<string, string> = {
                  indigo: "#818cf8",
                  emerald: "#34d399",
                  amber: "#fbbf24",
                  rose: "#fb7185",
                  violet: "#a78bfa",
                  slate: "#94a3b8",
                };
                return colorMap[n.data?.colorTheme as string] || "#f8fafc";
              }}
              maskColor="rgba(0,0,0, 0.05)"
              className="dark:bg-surface-800 !border-gray-200 dark:!border-surface-700 rounded-lg shadow-sm"
            />
            <Background color="#cbd5e1" gap={16} size={1} />
            
            {/* Rich Floating Toolbar */}
            <Panel position="bottom-center" className="mb-4">
              <div className="bg-slate-900/95 dark:bg-surface-950/95 backdrop-blur-md border border-white/10 dark:border-surface-800/80 px-4 py-2.5 rounded-full shadow-lg shadow-black/30 flex items-center gap-3 text-white text-xs font-semibold">
                <button 
                  onClick={() => zoomOut({ duration: 300 })}
                  className="hover:text-indigo-400 dark:hover:text-indigo-300 active:scale-95 transition-all px-2.5 py-1 rounded-md hover:bg-white/5 cursor-pointer"
                >
                  Zoom Out
                </button>
                <span className="w-px h-3.5 bg-white/20" />
                <button 
                  onClick={() => zoomIn({ duration: 300 })}
                  className="hover:text-indigo-400 dark:hover:text-indigo-300 active:scale-95 transition-all px-2.5 py-1 rounded-md hover:bg-white/5 cursor-pointer"
                >
                  Zoom In
                </button>
                <span className="w-px h-3.5 bg-white/20" />
                <button 
                  onClick={triggerAutoFit}
                  className="hover:text-indigo-400 dark:hover:text-indigo-300 active:scale-95 transition-all px-2.5 py-1 rounded-md hover:bg-white/5 cursor-pointer"
                >
                  Fit View
                </button>
                <span className="w-px h-3.5 bg-white/20" />
                <button 
                  onClick={() => {
                    const nextDir = 
                      layoutDirection === "balanced" 
                        ? "LR" 
                        : layoutDirection === "LR" 
                          ? "TB" 
                          : "balanced";
                    changeLayoutDirection(nextDir);
                  }}
                  className="flex items-center gap-1.5 hover:text-indigo-400 dark:hover:text-indigo-300 active:scale-95 transition-all px-2.5 py-1 rounded-md hover:bg-white/5 cursor-pointer"
                >
                  {layoutDirection === "balanced" 
                    ? "🌀 Balanced" 
                    : layoutDirection === "LR" 
                      ? "➡️ Horizontal" 
                      : "⬇️ Vertical"
                  }
                </button>
              </div>
            </Panel>
            </ReactFlow>
          );
        })() : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-gray-400 dark:text-gray-500">
            <span className="text-3xl">📂</span>
            <p className="text-sm font-semibold">{t("mindmapSelectOrCreate")}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setIsTemplateSelectorOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium shadow-sm transition-colors cursor-pointer"
              >
                Create New Map
              </button>
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-lg text-xs font-medium shadow-sm transition-colors cursor-pointer"
              >
                Import JSON
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Editor Tool / Operations panel */}
      {activeFileName && (
        <div className="p-3 bg-white dark:bg-surface-900 border-t border-gray-200 dark:border-surface-800 shrink-0">
          <NodeToolbar
            selectedNodeId={selectedNodeId}
            selectedNodeLabel={selectedNodeLabel}
            selectedNodeShape={selectedNodeShape}
            selectedNodeTheme={selectedNodeTheme}
            onUpdateShape={updateNodeShape}
            onUpdateTheme={updateNodeTheme}
            onUpdateLabel={updateNodeLabel}
          />
        </div>
      )}

      {/* Template Selector Modal */}
      {isTemplateSelectorOpen && (
        <TemplateSelector
          onSelect={(templateId, title) => {
            setIsTemplateSelectorOpen(false);
            createNewMap(templateId, title);
          }}
          onClose={() => setIsTemplateSelectorOpen(false)}
        />
      )}

      {/* Custom Import Modal (가져오기 팝업) */}
      {isImportModalOpen && (
        <ImportModal
          onImport={(fileName, content) => {
            setIsImportModalOpen(false);
            importMapFromJson(fileName, content);
          }}
          onClose={() => setIsImportModalOpen(false)}
        />
      )}

      {/* Custom Delete Confirm Modal (삭제 확인 팝업) */}
      {isDeleteModalOpen && activeFileName && (
        <ConfirmDeleteModal
          fileName={activeFileName}
          onConfirm={() => deleteMapFile(activeFileName)}
          onClose={() => setIsDeleteModalOpen(false)}
        />
      )}

      {/* Custom Rename Modal (이름 변경 팝업) */}
      {isRenameModalOpen && activeFileName && (
        <RenameModal
          fileName={activeFileName}
          onConfirm={(newName) => renameMapFile(activeFileName, newName)}
          onClose={() => setIsRenameModalOpen(false)}
        />
      )}

      {/* MindMap 전용 메모 위젯 */}
      {activeFileName && (
        <MindMapMemoWidget
          content={memoContent}
          color={memoColor}
          onUpdate={updateMemo}
        />
      )}
    </div>
    </MindMapActionsContext.Provider>
  );
}

export default function MindMapPanel(props: Props) {
  return (
    <ReactFlowProvider>
      <MindMapCanvas {...props} />
    </ReactFlowProvider>
  );
}

// ── MindMap 전용 메모 위젯 ───────────────────────────────────
function MindMapMemoWidget({
  content,
  color,
  onUpdate
}: {
  content: string;
  color: ColorTheme;
  onUpdate: (content: string, color: ColorTheme) => void;
}) {
  const { t, lang } = useLang();
  const [isOpen, setIsOpen] = useState(false); // 기본은 접혀진 상태로 공간 보존
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(content);
  const [isRefining, setIsRefining] = useState(false);

  useEffect(() => {
    setText(content);
  }, [content]);

  const handleTextChange = (val: string) => {
    setText(val);
    onUpdate(val, color);
  };

  const handleColorChange = (newColor: ColorTheme) => {
    onUpdate(text, newColor);
  };

  const handleRefine = async () => {
    if (!text.trim() || isRefining) return;
    setIsRefining(true);
    try {
      const res = await refineMemoDraft(text, lang);
      if (res.aiUsed) {
        setText(res.draft);
        onUpdate(res.draft, color);
      }
    } catch (e) {
      console.warn("Refine memo draft failed:", e);
    } finally {
      setIsRefining(false);
    }
  };

  // 마인드맵 ColorTheme과 메모장 전용 colors.ts 키 매핑
  const themeToMemoColor = (theme: ColorTheme): "yellow" | "pink" | "blue" | "green" | "purple" => {
    const map: Record<string, "yellow" | "pink" | "blue" | "green" | "purple"> = {
      indigo: "blue",
      emerald: "green",
      amber: "yellow",
      rose: "pink",
      violet: "purple",
      slate: "purple"
    };
    return map[theme] || "blue";
  };

  const memoColorKey = themeToMemoColor(color);

  return (
    <div className={`border-t border-gray-200 dark:border-surface-800 transition-all duration-300 shadow-md shrink-0 flex flex-col ${MEMO_CARD_CLS[memoColorKey] || "bg-blue-50"}`}>
      {/* 컬러 액센트 탑 바 */}
      <div className={`h-1 w-full ${MEMO_ACCENT[memoColorKey] || "bg-blue-500"}`} />
      
      {/* 헤더 바 */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 flex items-center justify-between cursor-pointer select-none bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
          <StickyNote size={14} className="text-amber-500" />
          <span className="text-xs font-extrabold tracking-wide">{t("mindmapNotesTitle")}</span>
          {content.trim() && (
            <span className="text-[10px] bg-slate-900/10 dark:bg-white/10 px-1.5 py-0.5 rounded-full font-bold text-gray-600 dark:text-gray-300">
              {content.length} chars
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-gray-500">
          {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </div>
      </div>

      {/* 펼쳐졌을 때의 바디 */}
      {isOpen && (
        <div className="p-3 pt-2 flex flex-col gap-2.5 animate-in slide-in-from-bottom-2 duration-200">
          {/* 에디팅 툴바 */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            {/* 컬러 도트 선택기 */}
            <div className="flex items-center gap-1.5 bg-white/50 dark:bg-black/20 px-2 py-1 rounded-lg border border-black/5 dark:border-white/5">
              {(["yellow", "pink", "blue", "green", "purple"] as const).map((c) => {
                const memoToTheme = (mCol: "yellow" | "pink" | "blue" | "green" | "purple"): ColorTheme => {
                  const reverseMap: Record<"yellow" | "pink" | "blue" | "green" | "purple", ColorTheme> = {
                    blue: "indigo",
                    green: "emerald",
                    yellow: "amber",
                    pink: "rose",
                    purple: "violet"
                  };
                  return reverseMap[mCol] || "indigo";
                };
                const themeVal = memoToTheme(c);
                return (
                  <button
                    key={c}
                    onClick={() => handleColorChange(themeVal)}
                    className={`w-3.5 h-3.5 rounded-full ${MEMO_DOT[c]} transition-all cursor-pointer ${
                      c === memoColorKey
                        ? "ring-2 ring-offset-1 ring-gray-400 dark:ring-gray-500 dark:ring-offset-transparent scale-110"
                        : "opacity-60 hover:opacity-100"
                    }`}
                  />
                );
              })}
            </div>

            {/* 유틸리티 액션 버튼 */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-[11px] px-2.5 py-1 rounded-lg border border-gray-200 dark:border-surface-700 bg-white hover:bg-gray-50 dark:bg-surface-800 dark:hover:bg-surface-750 font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm text-gray-700 dark:text-gray-200"
                title={isEditing ? "Preview Markdown" : "Edit Note"}
              >
                {isEditing ? <BookOpen size={12} /> : <Edit3 size={12} />}
                <span>{isEditing ? "View" : "Edit"}</span>
              </button>

              <button
                onClick={handleRefine}
                disabled={!text.trim() || isRefining}
                className="text-[11px] px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-950 bg-indigo-50/50 hover:bg-indigo-50 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1.5 disabled:opacity-40 transition-all cursor-pointer shadow-sm"
                title="Refine with AI"
              >
                {isRefining ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                <span>AI Refine</span>
              </button>

              <button
                onClick={() => {
                  if (text) navigator.clipboard.writeText(text);
                }}
                disabled={!text.trim()}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-surface-700 bg-white hover:bg-gray-50 dark:bg-surface-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 disabled:opacity-40 transition-all cursor-pointer shadow-sm"
                title="Copy to Clipboard"
              >
                <Copy size={12.5} />
              </button>

              <button
                onClick={() => handleTextChange("")}
                disabled={!text.trim()}
                className="p-1.5 rounded-lg border border-rose-100 dark:border-rose-950 bg-rose-50/50 hover:bg-rose-50 dark:bg-rose-950/20 text-rose-500 disabled:opacity-40 transition-all cursor-pointer shadow-sm"
                title="Clear All"
              >
                <Trash2 size={12.5} />
              </button>
            </div>
          </div>

          {/* 텍스트 영역 또는 마크다운 렌더러 */}
          <div className="w-full">
            {isEditing ? (
              <textarea
                value={text}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder={t("mindmapNotesPlaceholder")}
                rows={5}
                className={`w-full text-xs rounded-xl border border-gray-200 dark:border-surface-800 px-3 py-2.5 resize-y outline-none leading-relaxed shadow-sm ${MEMO_TEXTAREA_BG[memoColorKey] || "bg-white"} text-gray-850 dark:text-gray-200 placeholder-gray-400 focus:ring-1 focus:ring-indigo-500/20`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    setIsEditing(false);
                  }
                }}
              />
            ) : (
              <div 
                onClick={() => setIsEditing(true)}
                className={`w-full text-xs rounded-xl px-4 py-3.5 leading-relaxed border border-gray-200/50 dark:border-surface-800/20 min-h-[100px] max-h-[250px] overflow-y-auto cursor-text ${MEMO_TEXTAREA_BG[memoColorKey] || "bg-white"} text-gray-800 dark:text-gray-200 shadow-inner`}
              >
                {text.trim() ? (
                  <div className="prose dark:prose-invert max-w-none text-xs break-all prose-headings:text-[11px] prose-headings:font-bold prose-headings:mt-1 prose-headings:mb-1.5 prose-p:my-1 prose-ul:my-1 prose-li:my-0.5">
                    <ReactMarkdown>{text}</ReactMarkdown>
                  </div>
                ) : (
                  <span className="text-gray-400 dark:text-gray-500 italic">
                    {t("mindmapNoNotes")}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
