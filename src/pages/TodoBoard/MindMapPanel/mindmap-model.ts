import { useState, useEffect, useCallback, useRef } from "react";
import type { Node, Edge } from "@xyflow/react";
import { useNodesState, useEdgesState } from "@xyflow/react";
import type { MindMapNodeData, MindMapData, MindMapMeta, NodeShape, ColorTheme } from "./mindmap-types";
import { getLayoutedElements, createChildNode, getHexColorByTheme } from "./mindmap-utils";
import { buildTemplateData } from "./mindmap-fs";
import { isAIAvailable } from "@/shared/categorizer/ai-service";
import {
  aiExpand,
  aiSummarizeBranch,
  aiGenerateFromText,
  aiRewriteNode,
  aiProofreadNode,
  aiTranslateNode,
  type TranslateLang,
} from "./mindmap-ai-actions";

export function useMindMapState(taskId: string, _onClose: () => void) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<MindMapNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // File System & Quick Load State (가상 로컬 스토리지 전용)
  const [fileList, setFileList] = useState<MindMapMeta[]>([]);
  const [activeFileName, setActiveFileName] = useState<string>("");
  const [layoutDirection, setLayoutDirection] = useState<"LR" | "TB" | "balanced">("balanced");
  const [isAiExpanding, setIsAiExpanding] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  // AI 요약 결과 — 브랜치 요약 시 노드 위에 표시하기 위해
  const [aiSummaryResult, setAiSummaryResult] = useState<{ nodeId: string; text: string } | null>(null);
  // Generate from text 입력 모달
  const [generateTextModal, setGenerateTextModal] = useState<{ open: boolean; nodeId: string }>({ open: false, nodeId: "" });
  // Translate 언어 선택 상태
  const [translateModal, setTranslateModal] = useState<{ open: boolean; nodeId: string }>({ open: false, nodeId: "" });

  // 마인드맵용 메모 상태
  const [memoContent, setMemoContent] = useState("");
  const [memoColor, setMemoColor] = useState<ColorTheme>("indigo");

  const saveTimeoutRef = useRef<any>(null);

  // Stale Closure 방지를 위해 항상 최신 상태를 담아둘 Refs
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const selectedNodeIdRef = useRef(selectedNodeId);
  const layoutDirectionRef = useRef(layoutDirection);
  const memoContentRef = useRef(memoContent);
  const memoColorRef = useRef(memoColor);

  useEffect(() => {
    nodesRef.current = nodes;
    edgesRef.current = edges;
    selectedNodeIdRef.current = selectedNodeId;
    layoutDirectionRef.current = layoutDirection;
    memoContentRef.current = memoContent;
    memoColorRef.current = memoColor;
  }, [nodes, edges, selectedNodeId, layoutDirection, memoContent, memoColor]);




  const bindNodeActions = useCallback((node: any, _unused?: any) => {
    return node;
  }, []);

  // 가상 스토리지 파일 목록 새로고침
  const refreshFileList = useCallback(async () => {
    chrome.storage.local.get(null).then((res) => {
      const metas: MindMapMeta[] = [];
      Object.keys(res).forEach((key) => {
        if (key.startsWith("todo_mindmap_virtual_")) {
          metas.push({
            fileName: key.replace("todo_mindmap_virtual_", "") + ".json",
            updatedAt: res[key].updatedAt || Date.now(),
          });
        }
      });
      setFileList(metas.sort((a, b) => b.updatedAt - a.updatedAt));
    });
  }, []);

  useEffect(() => {
    refreshFileList();
  }, [refreshFileList]);




  // 실시간 저장 (Debounced Save)
  const saveMapData = useCallback((
    currentNodes: Node<MindMapNodeData>[],
    currentEdges: Edge[],
    customDir?: "LR" | "TB" | "balanced",
    customMemoContent?: string,
    customMemoColor?: ColorTheme
  ) => {
    if (!activeFileName) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    const dirToSave = customDir || layoutDirection;
    const memoContentToSave = customMemoContent !== undefined ? customMemoContent : memoContentRef.current;
    const memoColorToSave = customMemoColor !== undefined ? customMemoColor : memoColorRef.current;

    saveTimeoutRef.current = setTimeout(async () => {
      const cleanNodes = currentNodes.map(({ data, ...node }) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { onLabelChange, onAddChild, onDeleteNode, onAiExpand, onAiAction, ...restData } = data as any;
        return { ...node, data: restData };
      });

      const rawData: MindMapData = {
        taskId,
        nodes: cleanNodes as any,
        edges: currentEdges,
        direction: dirToSave,
        memo: {
          content: memoContentToSave,
          color: memoColorToSave
        }
      };

      try {
        const key = `todo_mindmap_virtual_${activeFileName.replace(".json", "")}`;
        await chrome.storage.local.set({
          [key]: { ...rawData, updatedAt: Date.now() },
        });
      } catch (err) {
        console.warn("Failed to auto-save mindmap:", err);
      }
    }, 800);
  }, [activeFileName, taskId, layoutDirection]);

  // 정렬 방향 실시간 변경 및 저장
  const changeLayoutDirection = useCallback((newDir: "LR" | "TB" | "balanced") => {
    setLayoutDirection(newDir);
    const { nodes: layoutedN, edges: layoutedE } = getLayoutedElements(nodes, edges, newDir);
    const reboundN = layoutedN.map(bindNodeActions);
    setNodes(reboundN);
    setEdges([...layoutedE]);
    saveMapData(reboundN, layoutedE, newDir);
  }, [nodes, edges, saveMapData, setNodes, setEdges]);

  // 노드 이름 변경
  const updateNodeLabel = useCallback((nodeId: string, newLabel: string) => {
    setNodes((nds) => {
      const next = nds.map((n) => {
        if (n.id === nodeId) return { ...n, data: { ...n.data, label: newLabel } };
        return n;
      }).map(bindNodeActions);
      setTimeout(() => {
        setEdges((eds) => {
          saveMapData(next, eds);
          return eds;
        });
      }, 0);
      return next;
    });
  }, [saveMapData, setEdges, setNodes]);

  // 노드 잠금/해제 상태 변경
  const updateNodeLockState = useCallback((nodeId: string, isLocked: boolean, passwordHash?: string) => {
    setNodes((nds) => {
      const next = nds.map((n) => {
        if (n.id === nodeId) {
          return { 
            ...n, 
            data: { 
              ...n.data, 
              isLocked, 
              passwordHash 
            } 
          };
        }
        return n;
      }).map(bindNodeActions);
      setTimeout(() => {
        setEdges((eds) => {
          saveMapData(next, eds);
          return eds;
        });
      }, 0);
      return next;
    });
  }, [saveMapData, setEdges, setNodes]);

  // 노드 모양 변경
  const updateNodeShape = (shape: NodeShape) => {
    if (!selectedNodeId) return;
    setNodes((nds) => {
      const next = nds.map((n) => {
        if (n.id === selectedNodeId) return { ...n, data: { ...n.data, shape } };
        return n;
      }).map(bindNodeActions);
      saveMapData(next, edges);
      return next;
    });
  };

  // 노드 테마 변경
  const updateNodeTheme = (theme: ColorTheme) => {
    if (!selectedNodeId) return;
    setNodes((nds) => {
      const next = nds.map((n) => {
        if (n.id === selectedNodeId) return { ...n, data: { ...n.data, colorTheme: theme } };
        return n;
      }).map(bindNodeActions);
      setEdges((eds) => {
        const nextEds = eds.map((e) => {
          if (e.source === selectedNodeId) {
            return { ...e, style: { ...e.style, stroke: getHexColorByTheme(theme) } };
          }
          return e;
        });
        saveMapData(next, nextEds);
        return nextEds;
      });
      return next;
    });
  };

  // 자식 노드 추가
  const addChild = useCallback((targetId?: string) => {
    const activeId = targetId || selectedNodeIdRef.current;
    if (!activeId) return;

    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;

    const parentNode = currentNodes.find((n) => n.id === activeId);
    const parentShape = parentNode?.data.shape || "rounded-rect";
    const parentTheme = parentNode?.data.colorTheme || "indigo";

    const { nodes: nextNodes, edges: nextEdges } = createChildNode(
      activeId,
      "새 아이디어",
      currentNodes,
      currentEdges,
      parentShape,
      parentTheme
    );

    const mappedNodes = nextNodes.map(bindNodeActions);
    // TB/LR/balanced 현재 방향을 그대로 유지하여 확장
    const effectiveDir = layoutDirectionRef.current;
    const { nodes: layoutedN, edges: layoutedE } = getLayoutedElements(mappedNodes, nextEdges, effectiveDir);
    
    setNodes(layoutedN);
    setEdges(layoutedE);
    saveMapData(layoutedN, layoutedE);
  }, [saveMapData, setNodes, setEdges]);

  // 노드 및 서브트리 일괄 삭제
  const deleteNodeTree = useCallback((targetId?: string) => {
    const activeId = targetId || selectedNodeIdRef.current;
    if (!activeId || activeId === "root") return;

    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;

    // 템플릿의 최상단 고정 카테고리인 경우 노드 자체는 삭제하지 않고 자식들만 삭제함
    const activeNode = currentNodes.find((n) => n.id === activeId);
    const isStatic = activeNode?.data?.isStatic === true;

    const childIds = new Set<string>();
    const findChildren = (pid: string) => {
      currentEdges.forEach((e) => {
        if (e.source === pid) {
          childIds.add(e.target);
          findChildren(e.target);
        }
      });
    };

    if (isStatic) {
      findChildren(activeId);
    } else {
      childIds.add(activeId);
      findChildren(activeId);
    }

    const nextNodes = currentNodes.filter((n) => !childIds.has(n.id));
    const nextEdges = currentEdges.filter((e) => !childIds.has(e.source) && !childIds.has(e.target));

    const mappedNodes = nextNodes.map(bindNodeActions);
    const { nodes: layoutedN, edges: layoutedE } = getLayoutedElements(mappedNodes, nextEdges, layoutDirectionRef.current);
    
    setNodes(layoutedN);
    setEdges(layoutedE);
    saveMapData(layoutedN, layoutedE);

    if (activeId === selectedNodeIdRef.current && !isStatic) {
      setSelectedNodeId(null);
    }
  }, [saveMapData, setNodes, setEdges, setSelectedNodeId]);

  // 노드 접기/펼치기 토글 기능
  const toggleNodeExpanded = useCallback((nodeId: string) => {
    setNodes((nds) => {
      const next = nds.map((n) => {
        if (n.id === nodeId) {
          return {
            ...n,
            data: {
              ...n.data,
              isExpanded: n.data.isExpanded === false ? true : false,
            },
          };
        }
        return n;
      }).map(bindNodeActions);

      // 접힌 상태를 바탕으로 즉시 레이아웃을 다시 계산하여 화면 갱신
      setTimeout(() => {
        setEdges((eds) => {
          const { nodes: layoutedN, edges: layoutedE } = getLayoutedElements(next, eds, layoutDirectionRef.current);
          setNodes(layoutedN);
          setEdges(layoutedE);
          saveMapData(layoutedN, layoutedE);
          return layoutedE;
        });
      }, 0);

      return next;
    });
  }, [saveMapData, setNodes, setEdges, bindNodeActions]);

  // 특정 노드를 클릭북의 Todo 할 일로 등록
  const registerAsTodoTask = useCallback(async (nodeLabelText: string) => {
    try {
      const res = await chrome.runtime.sendMessage({ type: "GET_TODO_BOARD" });
      if (!res || !res.success || !res.data) {
        throw new Error("Todo 보드 데이터를 불러올 수 없습니다.");
      }

      const todoData = res.data;
      const firstColId = todoData.columnOrder[0];
      if (!firstColId) {
        throw new Error("할 일을 등록할 Todo 컬럼이 존재하지 않습니다.");
      }

      const newTaskId = `task-${Date.now()}`;
      const newTask = {
        id: newTaskId,
        content: nodeLabelText.trim(),
        createdAt: Date.now(),
      };

      const firstCol = todoData.columns[firstColId];
      const updatedTodoData = {
        ...todoData,
        tasks: {
          ...todoData.tasks,
          [newTaskId]: newTask,
        },
        columns: {
          ...todoData.columns,
          [firstColId]: {
            ...firstCol,
            taskIds: [...firstCol.taskIds, newTaskId],
          },
        },
      };

      await chrome.runtime.sendMessage({ type: "SAVE_TODO_BOARD", data: updatedTodoData });

      setAiError("성공적으로 Todo 보드에 할 일로 등록되었습니다!");
      setTimeout(() => {
        setAiError(null);
      }, 3000);

    } catch (err: any) {
      console.error("Failed to register task:", err);
      setAiError(`Todo 등록 실패: ${err?.message || err}`);
    }
  }, [setAiError]);

  // 마인드맵을 Markdown 포맷 개요로 변환하여 내보내기
  const exportMapToMarkdown = useCallback(async () => {
    if (!activeFileName || nodes.length === 0) return;
    try {
      const nodeMap = new Map(nodes.map((n) => [n.id, n]));
      const childrenMap = new Map<string, string[]>();

      edges.forEach((e) => {
        const parentList = childrenMap.get(e.source) || [];
        parentList.push(e.target);
        childrenMap.set(e.source, parentList);
      });

      const rootNode = nodes.find((n) => n.id === "root") || nodes[0];
      let markdownText = `# ${rootNode.data.label}\n\n`;

      const buildMarkdown = (nodeId: string, depth: number) => {
        const children = childrenMap.get(nodeId) || [];
        children.forEach((childId) => {
          const childNode = nodeMap.get(childId);
          if (!childNode) return;

          const indent = "  ".repeat(depth);
          markdownText += `${indent}- ${childNode.data.label}\n`;
          buildMarkdown(childId, depth + 1);
        });
      };

      buildMarkdown(rootNode.id, 0);

      const blob = new Blob([markdownText], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeFileName.replace(".json", "")}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.warn("Markdown export failed:", err);
    }
  }, [activeFileName, nodes, edges]);

  // 외부 드래그 앤 드롭 북마크 연결
  const addBookmarkNode = useCallback((bookmarkTitle: string, bookmarkUrl: string, position: { x: number; y: number }) => {
    const parentId = selectedNodeIdRef.current || "root";
    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;

    const parentNode = currentNodes.find((n) => n.id === parentId);
    const parentColor = parentNode?.data.colorTheme || "indigo";

    const newId = `node-bm-${Date.now()}`;
    const newNode: Node<MindMapNodeData> = {
      id: newId,
      type: "mindmapNode",
      data: {
        label: bookmarkTitle,
        shape: "rounded-rect",
        colorTheme: parentColor,
        bookmarkUrl,
        parentId,
      } as any,
      position,
    };

    const newEdge: Edge = {
      id: `edge-${parentId}->${newId}`,
      source: parentId,
      target: newId,
      type: "smoothstep",
      style: { stroke: getHexColorByTheme(parentColor), strokeWidth: 2 },
    };

    const nextNodes = [...currentNodes, newNode].map(bindNodeActions);
    const nextEdges = [...currentEdges, newEdge];

    const { nodes: layoutedN, edges: layoutedE } = getLayoutedElements(nextNodes, nextEdges, layoutDirectionRef.current);
    setNodes(layoutedN);
    setEdges(layoutedE);
    saveMapData(layoutedN, layoutedE);
  }, [saveMapData, setNodes, setEdges]);

  // AI 통합 액션 핸들러 (6가지 AI 기능 처리)
  const handleAiAction = useCallback(async (
    action: string,
    targetId?: string,
    extraPayload?: string
  ) => {
    const activeId = targetId || selectedNodeIdRef.current;
    if (!activeId) return;

    setIsAiExpanding(true);
    setAiError(null);
    setAiSummaryResult(null);

    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;

    try {
      const available = await isAIAvailable();
      if (!available) {
        setAiError("Local Gemini Nano가 활성화되지 않았습니다. chrome://flags에서 최신 로컬 모델을 활성화해 주세요.");
        return;
      }

      if (action === "expand") {
        // 1. Expand: 하위 아이디어 3~4개 자동 생성 (extraPayload = "general" | "pros_cons" | "actions")
        const expandMode = (extraPayload as any) || "general";
        const { newNodes, newEdges } = await aiExpand(activeId, currentNodes, currentEdges, expandMode);
        const next = [...currentNodes, ...newNodes].map(bindNodeActions);
        const nextE = [...currentEdges, ...newEdges];
        const { nodes: lN, edges: lE } = getLayoutedElements(next, nextE, layoutDirectionRef.current);
        setNodes(lN); setEdges(lE);
        saveMapData(lN, lE);

      } else if (action === "summarize") {
        // 2. Summarize: 브랜치 전체 요약 → 팝업으로 표시 및 메모 자동 연동
        const summary = await aiSummarizeBranch(activeId, currentNodes, currentEdges);
        setAiSummaryResult({ nodeId: activeId, text: summary });

        const targetNode = currentNodes.find(n => n.id === activeId);
        const nodeLabel = targetNode?.data.label || "아이디어";

        setMemoContent((prev) => {
          const nextMemo = prev
            ? `${prev}\n\n🤖 [${nodeLabel} 요약]\n${summary}`
            : `🤖 [${nodeLabel} 요약]\n${summary}`;
          
          setTimeout(() => {
            saveMapData(nodesRef.current, edgesRef.current, layoutDirectionRef.current, nextMemo);
          }, 0);
          
          return nextMemo;
        });

      } else if (action === "generate") {
        // 3. Generate from text: 텍스트 → 브랜치 (extraPayload = 입력 텍스트)
        if (!extraPayload?.trim()) return;
        const { newNodes, newEdges } = await aiGenerateFromText(extraPayload, activeId, currentNodes);
        const next = [...currentNodes, ...newNodes].map(bindNodeActions);
        const nextE = [...currentEdges, ...newEdges];
        const { nodes: lN, edges: lE } = getLayoutedElements(next, nextE, layoutDirectionRef.current);
        setNodes(lN); setEdges(lE);
        saveMapData(lN, lE);

      } else if (action === "rewrite") {
        // 4. Rewrite: 노드 텍스트 재작성
        const targetNode = currentNodes.find((n) => n.id === activeId);
        if (!targetNode) return;
        const rewritten = await aiRewriteNode(targetNode.data.label);
        updateNodeLabel(activeId, rewritten);

      } else if (action === "proofread") {
        // 5. Proofread: 맞춤법 교정
        const targetNode = currentNodes.find((n) => n.id === activeId);
        if (!targetNode) return;
        const corrected = await aiProofreadNode(targetNode.data.label);
        updateNodeLabel(activeId, corrected);

      } else if (action === "translate") {
        // 6. Translate: 언어 번역 (extraPayload = 'ko' | 'en' | 'ja')
        const targetNode = currentNodes.find((n) => n.id === activeId);
        if (!targetNode || !extraPayload) return;
        const translated = await aiTranslateNode(targetNode.data.label, extraPayload as TranslateLang);
        updateNodeLabel(activeId, translated);
      }

    } catch (e: any) {
      console.warn(`AI action '${action}' failed:`, e);
      if (e?.message === "AI_UNAVAILABLE") {
        setAiError("Local Gemini Nano가 활성화되지 않았습니다. chrome://flags에서 최신 로컬 모델을 활성화해 주세요.");
      } else if (e?.message === "AI_TIMEOUT") {
        setAiError("AI 응답 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.");
      } else {
        setAiError(`AI 오류: ${e?.message || "알 수 없는 오류"}`);
      }
    } finally {
      setIsAiExpanding(false);
    }
  }, [saveMapData, setNodes, setEdges, updateNodeLabel]);

  // JSON 파일 가져오기 (Import)
  const importMapFromJson = async (fileName: string, jsonContent: string) => {
    try {
      const parsed = JSON.parse(jsonContent);
      if (!parsed.nodes || !Array.isArray(parsed.nodes)) {
        throw new Error("올바른 마인드맵 데이터 형식이 아닙니다.");
      }

      const cleanName = fileName.trim().replace(".json", "").replace(/[\/\\?%*:|"<>. ]/g, "_");
      const finalFileName = `${cleanName}.json`;
      const key = `todo_mindmap_virtual_${cleanName}`;
      
      const finalData = {
        taskId: parsed.taskId || "global_workspace",
        nodes: parsed.nodes,
        edges: parsed.edges || [],
        direction: parsed.direction || "balanced",
        updatedAt: Date.now()
      };

      await chrome.storage.local.set({ [key]: finalData });
      await refreshFileList();
      await loadMapContent(finalFileName);
      setAiError(null);
    } catch (e) {
      console.warn("Import failed:", e);
      setAiError("마인드맵 파일 분석에 실패했습니다. 올바른 JSON 규격인지 확인해 주세요.");
    }
  };

  // JSON 파일 내보내기 (Export)
  const exportMapToJson = async () => {
    if (!activeFileName) return;
    try {
      const key = `todo_mindmap_virtual_${activeFileName.replace(".json", "")}`;
      const res = await chrome.storage.local.get(key);
      const data = res[key];
      if (!data) return;

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      a.download = activeFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn("Export failed:", e);
    }
  };

  // 가상 파일 삭제 기능
  const deleteMapFile = async (fileName: string) => {
    try {
      const key = `todo_mindmap_virtual_${fileName.replace(".json", "")}`;
      await chrome.storage.local.remove(key);
      if (activeFileName === fileName) {
        setNodes([]);
        setEdges([]);
        setActiveFileName("");
        setSelectedNodeId(null);
      }
      await refreshFileList();
    } catch (e) {
      console.warn("Delete file failed:", e);
    }
  };

  // 가상 파일 이름 변경 기능
  const renameMapFile = async (oldFileName: string, newName: string) => {
    try {
      const cleanOldName = oldFileName.replace(".json", "");
      const cleanNewName = newName.trim().replace(/[\/\\?%*:|"<>. ]/g, "_");
      if (!cleanNewName) return;

      const oldKey = `todo_mindmap_virtual_${cleanOldName}`;
      const newKey = `todo_mindmap_virtual_${cleanNewName}`;

      const res = await chrome.storage.local.get(oldKey);
      const data = res[oldKey];
      if (!data) return;

      // 루트 노드 텍스트도 같이 변경
      if (data.nodes && Array.isArray(data.nodes)) {
        data.nodes = data.nodes.map((node: any) => {
          if (node.id === "root") {
            return { ...node, data: { ...node.data, label: newName.trim() } };
          }
          return node;
        });
      }

      // 새 파일 저장 및 기존 파일 삭제
      await chrome.storage.local.set({ [newKey]: { ...data, updatedAt: Date.now() } });
      await chrome.storage.local.remove(oldKey);

      await refreshFileList();

      // 현재 파일인 경우, 활성 파일명을 교체하고 새로 로드
      if (activeFileName === oldFileName) {
        const newFileName = `${cleanNewName}.json`;
        await loadMapContent(newFileName);
      }
    } catch (e) {
      console.warn("Rename file failed:", e);
    }
  };


  // 마인드맵 데이터 읽기 (Load)
  const loadMapContent = useCallback(async (fileName: string) => {
    if (!fileName) return;
    try {
      const key = `todo_mindmap_virtual_${fileName.replace(".json", "")}`;
      const res = await chrome.storage.local.get(key);
      const data = res[key] as MindMapData | undefined;

      if (data && Array.isArray(data.nodes)) {
        const initialDir = data.direction || "balanced";
        const processedNodes = data.nodes.map((n) => bindNodeActions(n, initialDir));
        // 겹침 방지를 위해 불러온 즉시 강제로 전체 레이아웃 정렬을 재계산하여 깔끔하게 배치
        const { nodes: layoutedN, edges: layoutedE } = getLayoutedElements(processedNodes, data.edges || [], initialDir);
        setNodes(layoutedN);
        setEdges(layoutedE);
        setLayoutDirection(initialDir);
        setActiveFileName(fileName);
        setSelectedNodeId(null);
        setAiError(null);
        setMemoContent(data.memo?.content || "");
        setMemoColor(data.memo?.color || "indigo");
      }
    } catch (e: any) {
      console.error("Failed to load mindmap file from local storage:", e);
      setAiError("마인드맵 파일을 불러오는데 실패했습니다: " + (e?.message || e));
    }
  }, [setNodes, setEdges, bindNodeActions]);

  // 새로운 마인드맵 생성 (템플릿 적용 지원)
  const createNewMap = useCallback(async (templateId?: string, customName?: string) => {
    let rawName = customName;
    if (!rawName) {
      rawName = `Mindmap_${Date.now()}`;
    }
    const cleanName = rawName.trim().replace(/[\/\\?%*:|"<>. ]/g, "_");
    const fileName = `${cleanName}.json`;

    // 템플릿에 맞추어 마인드맵 초기 트리 빌드
    const initialData = buildTemplateData(templateId || "brainstorm", rawName.trim());
    const initialDir = initialData.direction || "balanced";
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(initialData.nodes, initialData.edges, initialDir);
    
    const finalData = {
      taskId: initialData.taskId,
      nodes: layoutedNodes,
      edges: layoutedEdges,
      direction: initialDir,
      updatedAt: Date.now()
    };

    try {
      const key = `todo_mindmap_virtual_${cleanName}`;
      await chrome.storage.local.set({
        [key]: finalData,
      });
      await refreshFileList();
      await loadMapContent(fileName);
    } catch (e) {
      console.error("Failed to create new mindmap file in storage:", e);
    }
  }, [refreshFileList, loadMapContent]);

  // 메모 직접 변경 저장 핸들러
  const updateMemo = useCallback((content: string, color: ColorTheme) => {
    setMemoContent(content);
    setMemoColor(color);
    saveMapData(nodesRef.current, edgesRef.current, layoutDirectionRef.current, content, color);
  }, [saveMapData]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return {
    nodes,
    edges,
    selectedNodeId,
    setSelectedNodeId,
    memoContent,
    setMemoContent,
    memoColor,
    setMemoColor,
    updateMemo,
    onNodesChange,
    onEdgesChange,
    isAiExpanding,
    aiError,
    setAiError,
    aiSummaryResult,
    setAiSummaryResult,
    generateTextModal,
    setGenerateTextModal,
    translateModal,
    setTranslateModal,
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
    selectedNodeLabel: selectedNode?.data.label || "",
    selectedNodeShape: selectedNode?.data.shape || "rounded-rect",
    selectedNodeTheme: selectedNode?.data.colorTheme || "indigo",
  };
}

// ── React Context for Mind Map Actions ───────────────────
import { createContext, useContext } from "react";

export interface MindMapActions {
  addChild: (targetId?: string) => void;
  deleteNodeTree: (targetId?: string) => void;
  updateNodeLabel: (nodeId: string, newLabel: string) => void;
  updateNodeLockState: (nodeId: string, isLocked: boolean, passwordHash?: string) => void;
  toggleNodeExpanded: (nodeId: string) => void;
  registerAsTodoTask: (nodeLabelText: string) => Promise<void>;
  handleAiAction: (action: string, targetId?: string, extraPayload?: string) => Promise<any>;
  layoutDirection: "LR" | "TB" | "balanced";
}

export const MindMapActionsContext = createContext<MindMapActions | null>(null);

export function useMindMapActions() {
  const context = useContext(MindMapActionsContext);
  if (!context) {
    throw new Error("useMindMapActions must be used within a MindMapActionsProvider");
  }
  return context;
}
