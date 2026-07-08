import dagre from "dagre";
import type { Node, Edge } from "@xyflow/react";
import type { MindMapNodeData } from "./mindmap-types";

const nodeWidth = 200;
const nodeHeight = 50;

/**
 * dagre를 활용하여 마인드맵 노드들의 수평/수직/균형(양방향 방사) 트리 레이아웃을 자동 계산합니다.
 */
export function getLayoutedElements(
  nodes: Node<MindMapNodeData>[],
  rawEdges: Edge[],
  direction: "LR" | "TB" | "balanced" = "balanced"
): { nodes: Node<MindMapNodeData>[]; edges: Edge[] } {
  if (nodes.length === 0) return { nodes, edges: rawEdges };

  // 고아 엣지(존재하지 않는 노드를 가리키는 엣지) 필터링
  const nodeIds = new Set(nodes.map(n => n.id));
  const edges = rawEdges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));

  // 0. 각 노드/엣지의 hidden 여부 계산
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const hiddenCache = new Map<string, boolean>();

  const checkHidden = (id: string): boolean => {
    if (hiddenCache.has(id)) return hiddenCache.get(id)!;
    const node = nodeMap.get(id);
    if (!node || !node.data.parentId) {
      hiddenCache.set(id, false);
      return false;
    }
    const parentId = node.data.parentId;
    const parent = nodeMap.get(parentId);
    if (!parent) {
      hiddenCache.set(id, false);
      return false;
    }
    // 부모 노드가 명시적으로 접혔거나(isExpanded === false), 부모 자체가 숨김 상태인 경우
    if (parent.data.isExpanded === false) {
      hiddenCache.set(id, true);
      return true;
    }
    const parentHidden = checkHidden(parentId);
    hiddenCache.set(id, parentHidden);
    return parentHidden;
  };

  // 모든 노드에 hidden 속성 설정
  const processedNodes = nodes.map((n) => {
    const isHidden = checkHidden(n.id);
    return {
      ...n,
      hidden: isHidden,
    };
  });

  const processedNodeMap = new Map(processedNodes.map((n) => [n.id, n]));

  // 엣지도 소스/타겟 노드 중 하나라도 hidden이면 hidden 처리
  const processedEdges = edges.map((e) => {
    const sourceNode = processedNodeMap.get(e.source);
    const targetNode = processedNodeMap.get(e.target);
    const isHidden = !!(sourceNode?.hidden || targetNode?.hidden);
    return {
      ...e,
      hidden: isHidden,
    };
  });

  // 레이아웃 계산 대상은 화면에 표시 중인 노드/엣지로만 한정
  const visibleNodes = processedNodes.filter((n) => !n.hidden);
  const visibleEdges = processedEdges.filter((e) => !e.hidden);

  let layoutedVisible: { nodes: Node<MindMapNodeData>[]; edges: Edge[] };

  // 1. Balanced 양방향 밸런스 정렬 (SWOT 및 일반 브레인스톰용)
  if (direction === "balanced") {
    const rootNode = visibleNodes.find(n => n.id === "root");
    if (!rootNode) {
      layoutedVisible = runUnidirectionalLayout(visibleNodes, visibleEdges, "LR");
    } else {
      // 루트의 직계 자식 노드 ID 추출
      const rootChildren = visibleEdges.filter(e => e.source === "root").map(e => e.target);

      const leftRootIds: string[] = [];
      const rightRootIds: string[] = [];

      // SWOT 템플릿(s, w, o, t)일 때 좌측과 우측 분기 분배 고정
      const hasSwot = rootChildren.some(id => ["s", "w", "o", "t"].includes(id));
      if (hasSwot) {
        rootChildren.forEach(id => {
          if (id === "s" || id === "w") {
            leftRootIds.push(id);
          } else {
            rightRootIds.push(id);
          }
        });
      } else {
        // 일반 마인드맵의 경우 홀수 인덱스는 좌측, 짝수 인덱스는 우측 분배
        rootChildren.forEach((id, index) => {
          if (index % 2 === 1) {
            leftRootIds.push(id);
          } else {
            rightRootIds.push(id);
          }
        });
      }

      // 각 직계 자식 서브트리에 매달린 모든 자손 노드 ID 수집기
      const collectSubtree = (startIds: string[]) => {
        const visited = new Set<string>(startIds);
        const queue = [...startIds];
        while (queue.length > 0) {
          const curr = queue.shift()!;
          visibleEdges.forEach(e => {
            if (e.source === curr && !visited.has(e.target)) {
              visited.add(e.target);
              queue.push(e.target);
            }
          });
        }
        return visited;
      };

      const leftNodeIds = collectSubtree(leftRootIds);
      const rightNodeIds = collectSubtree(rightRootIds);

      // 루트 직계 자식 중 좌우에 배정되지 않은 노드(orphan direct child) 처리
      rootChildren.forEach((id, index) => {
        if (!leftNodeIds.has(id) && !rightNodeIds.has(id)) {
          if (index % 2 === 1) {
            leftRootIds.push(id);
            leftNodeIds.add(id);
            collectSubtree([id]).forEach(cid => leftNodeIds.add(cid));
          } else {
            rightRootIds.push(id);
            rightNodeIds.add(id);
            collectSubtree([id]).forEach(cid => rightNodeIds.add(cid));
          }
        }
      });

      // 우측 서브트리 정렬 (LR 수평 정렬)
      const rightSubNodes = visibleNodes.filter(n => rightNodeIds.has(n.id));
      const rightSubEdges = visibleEdges.filter(e => rightNodeIds.has(e.source) && rightNodeIds.has(e.target));
      const rightLayout = runUnidirectionalLayout(rightSubNodes, rightSubEdges, "LR");

      // 좌측 서브트리 정렬 (LR 정렬 후 반대 방향 X축 반전으로 RL 효과 구현)
      const leftSubNodes = visibleNodes.filter(n => leftNodeIds.has(n.id));
      const leftSubEdges = visibleEdges.filter(e => leftNodeIds.has(e.source) && leftNodeIds.has(e.target));
      const leftLayout = runUnidirectionalLayout(leftSubNodes, leftSubEdges, "LR");

      // 최종 배치 맵핑
      const layoutedNodesMap = new Map<string, Node<MindMapNodeData>>();
      
      // 루트 노드는 중심 (0, 0)
      layoutedNodesMap.set("root", {
        ...rootNode,
        position: { x: 0, y: 0 },
        data: { ...rootNode.data, layoutDir: "balanced" } as any
      });

      // 우측 서브트리 노드 배치 (오른쪽으로 밀어주기)
      rightLayout.nodes.forEach(node => {
        layoutedNodesMap.set(node.id, {
          ...node,
          position: {
            x: node.position.x + 200,
            y: node.position.y
          },
          data: { ...node.data, layoutDir: "LR" } as any
        });
      });

      // 좌측 서브트리 노드 배치 (X축 대칭 반전 및 왼쪽으로 밀어주기)
      leftLayout.nodes.forEach(node => {
        layoutedNodesMap.set(node.id, {
          ...node,
          position: {
            x: -node.position.x - 200,
            y: node.position.y
          },
          data: { ...node.data, layoutDir: "RL" } as any
        });
      });

      // 소속되지 않은 외톨이 노드 처리
      visibleNodes.forEach(node => {
        if (!layoutedNodesMap.has(node.id)) {
          layoutedNodesMap.set(node.id, {
            ...node,
            position: { x: 0, y: 150 },
            data: { ...node.data, layoutDir: "LR" } as any
          });
        }
      });

      const finalVisibleNodes = visibleNodes.map(n => layoutedNodesMap.get(n.id)!);
      const mappedVisibleEdges = visibleEdges.map(edge => {
        if (edge.source === "root") {
          if (leftNodeIds.has(edge.target)) {
            return { ...edge, sourceHandle: "left" };
          }
          if (rightNodeIds.has(edge.target)) {
            return { ...edge, sourceHandle: "right" };
          }
        }
        return edge;
      });
      
      layoutedVisible = { nodes: finalVisibleNodes, edges: mappedVisibleEdges };
    }
  } else {
    // 2. 단방향(LR 또는 TB) 정렬
    layoutedVisible = runUnidirectionalLayout(visibleNodes, visibleEdges, direction);
  }

  // 최종 배치 맵핑 생성 (보이는 노드 기준)
  const finalNodesMap = new Map<string, Node<MindMapNodeData>>();
  layoutedVisible.nodes.forEach(n => finalNodesMap.set(n.id, n));

  // 표시 중인 조상의 최종 위치(좌표)를 가져오는 헬퍼 함수
  const getVisibleAncestorPosition = (nodeId: string): { x: number; y: number } => {
    let currId = nodeId;
    const visited = new Set<string>();
    while (currId) {
      if (visited.has(currId)) break;
      visited.add(currId);

      const currNode = processedNodeMap.get(currId);
      if (!currNode) break;

      // 만약 보이는 노드 목록에 존재한다면 그 위치를 반환
      const layoutedNode = finalNodesMap.get(currId);
      if (layoutedNode) {
        return layoutedNode.position;
      }

      if (!currNode.data.parentId) break;
      currId = currNode.data.parentId;
    }
    return { x: 0, y: 0 };
  };

  // 숨겨진 노드들을 돌며 조상 좌표로 수렴시키고 전체 목록 빌드
  const finalNodes = processedNodes.map(node => {
    if (node.hidden) {
      const ancestorPos = getVisibleAncestorPosition(node.id);
      return {
        ...node,
        position: { ...ancestorPos }
      };
    }
    return finalNodesMap.get(node.id)!;
  });

  const hiddenEdges = processedEdges.filter(e => e.hidden);
  const finalEdges = [...layoutedVisible.edges, ...hiddenEdges];

  return {
    nodes: finalNodes,
    edges: finalEdges
  };
}

/**
 * 헬퍼: 단방향 dagre 정렬 로직 실행
 */
function runUnidirectionalLayout(
  nodes: Node<MindMapNodeData>[],
  edges: Edge[],
  dir: "LR" | "TB"
): { nodes: Node<MindMapNodeData>[]; edges: Edge[] } {
  if (nodes.length === 0) return { nodes, edges };

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: dir,
    nodesep: dir === "LR" ? 25 : 40,
    ranksep: dir === "LR" ? 80 : 60,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  try {
    dagre.layout(dagreGraph);
  } catch (e) {
    console.error("Dagre layout error:", e);
    return { nodes, edges };
  }

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    if (!nodeWithPosition) return node;
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
      data: { ...node.data, layoutDir: dir } as any
    };
  });

  const cleanEdges = edges.map((e) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { sourceHandle, targetHandle, ...rest } = e;
    return rest;
  });

  return { nodes: layoutedNodes, edges: cleanEdges };
}

/**
 * 특정 부모 노드에 새로운 자식 노드 정보를 추가하여 새 Node와 Edge 배열을 반환합니다.
 */
export function createChildNode(
  parentId: string,
  label: string,
  currentNodes: Node<MindMapNodeData>[],
  currentEdges: Edge[],
  defaultShape: "rounded-rect" | "ellipse" | "capsule" = "rounded-rect",
  defaultColor: "indigo" | "emerald" | "amber" | "rose" | "slate" | "violet" = "indigo",
  layoutDirection: "LR" | "TB" | "balanced" = "balanced"
): { nodes: Node<MindMapNodeData>[]; edges: Edge[] } {
  const newId = `node-${Date.now()}`;
  const parentNode = currentNodes.find((n) => n.id === parentId);
  const parentColor = parentNode?.data.colorTheme || defaultColor;
  const parentEdgeColor = parentNode?.data.edgeColorTheme || parentColor;
  const parentDepth = parentNode?.data.depth !== undefined ? (parentNode.data.depth as number) : 0;

  // 부모의 기존 자식 수 계산 (겹침 방지 오프셋용)
  const existingChildCount = currentEdges.filter((e) => e.source === parentId).length;
  const parentPos = parentNode?.position ?? { x: 0, y: 0 };

  // 레이아웃 방향별 오프셋 계산
  let offsetX = 0;
  let offsetY = 0;
  if (layoutDirection === "TB") {
    offsetX = (existingChildCount - Math.floor(existingChildCount / 2)) * 200 * (existingChildCount % 2 === 0 ? 1 : -1);
    offsetY = 160;
  } else if (layoutDirection === "LR") {
    offsetX = 220;
    offsetY = existingChildCount * 90;
  } else {
    // balanced: 부모 오른쪽으로 fan-out
    offsetX = 220;
    const half = Math.ceil(existingChildCount / 2);
    offsetY = existingChildCount % 2 === 0
      ? -(half * 80)
      : half * 80;
  }

  const newNode: Node<MindMapNodeData> = {
    id: newId,
    type: "mindmapNode",
    data: {
      label,
      shape: defaultShape,
      colorTheme: parentEdgeColor,
      parentId,
      depth: parentDepth + 1,
    },
    position: {
      x: parentPos.x + offsetX,
      y: parentPos.y + offsetY,
    },
  };

  const newEdge: Edge = {
    id: `edge-${parentId}->${newId}`,
    source: parentId,
    target: newId,
    type: "smoothstep",
    style: { stroke: getHexColorByTheme(parentEdgeColor), strokeWidth: 2 },
  };

  return {
    nodes: [...currentNodes, newNode],
    edges: [...currentEdges, newEdge],
  };
}

/**
 * 테마 컬러 키를 헥사코드로 치환합니다.
 */
export function getHexColorByTheme(theme: string): string {
  switch (theme) {
    case "indigo": return "#6366f1";
    case "emerald": return "#10b981";
    case "amber": return "#f59e0b";
    case "rose": return "#f43f5e";
    case "violet": return "#8b5cf6";
    case "slate":
    default:
      return "#64748b";
  }
}
