/**
 * mindmap-ai-actions.ts
 * 마인드맵 전용 AI 액션 모듈 — 6가지 AI 기능(Expand, Summarize, Generate, Rewrite, Proofread, Translate)
 * Gemini Nano (chrome.ai) 기반, ai-service.ts 패턴과 일치
 */

import type { Node, Edge } from "@xyflow/react";
import type { MindMapNodeData } from "./mindmap-types";
import { getAIModel, isAIAvailable } from "@/shared/categorizer/ai-service";
import { getHexColorByTheme } from "./mindmap-utils";

// ──────────────────────────────────────────────────
// 헬퍼: 타임아웃 래퍼
// ──────────────────────────────────────────────────
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("AI_TIMEOUT")), ms)
    ),
  ]);
}

// ──────────────────────────────────────────────────
// 헬퍼: AI 세션 생성
// ──────────────────────────────────────────────────
async function createSession(systemPrompt: string): Promise<any> {
  const lm = await getAIModel();
  if (!lm) throw new Error("AI_UNAVAILABLE");

  const session = await withTimeout(
    (lm.create as (opts: unknown) => Promise<any>)({
      systemPrompt,
      expectedOutputs: [{ type: "text", languages: ["en", "ja"] }],
      temperature: 0.7,
      topK: 40,
    }),
    15000
  );
  return session;
}

// ──────────────────────────────────────────────────
// 헬퍼: JSON 배열 파싱 (markdown 코드블록 포함 대응)
// ──────────────────────────────────────────────────
function parseJsonArray(raw: string): string[] {
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/```(?:json)?\s*/gi, "").replace(/```\s*$/g, "");
  const sIdx = cleaned.indexOf("[");
  const eIdx = cleaned.lastIndexOf("]");
  if (sIdx !== -1 && eIdx > sIdx) {
    cleaned = cleaned.substring(sIdx, eIdx + 1);
  }
  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) throw new Error("Not an array");
  return parsed.map((item: unknown) => String(item).trim()).filter(Boolean);
}

// ──────────────────────────────────────────────────
// 헬퍼: 브랜치 전체 라벨 수집
// ──────────────────────────────────────────────────
export function collectBranchLabels(
  rootId: string,
  nodes: Node<MindMapNodeData>[],
  edges: Edge[]
): string[] {
  const labels: string[] = [];
  const visited = new Set<string>();
  const queue = [rootId];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (visited.has(curr)) continue;
    visited.add(curr);

    const node = nodes.find((n) => n.id === curr);
    if (node?.data.label) labels.push(node.data.label);

    edges.forEach((e) => {
      if (e.source === curr && !visited.has(e.target)) {
        queue.push(e.target);
      }
    });
  }
  return labels;
}

// ──────────────────────────────────────────────────
// 헬퍼: 루트 노드부터 대상 노드까지의 계층적 라벨 경로 수집
// ──────────────────────────────────────────────────
export function getContextPath(
  nodeId: string,
  nodes: Node<MindMapNodeData>[]
): string {
  const path: string[] = [];
  let curr = nodes.find((n) => n.id === nodeId);
  const visited = new Set<string>();

  while (curr) {
    if (visited.has(curr.id)) break;
    visited.add(curr.id);

    path.unshift(curr.data.label);
    const pId = curr.data.parentId;
    if (!pId) break;
    curr = nodes.find((n) => n.id === pId);
  }
  return path.join(" > ");
}

export type ExpandMode = "general" | "pros_cons" | "actions";

// ──────────────────────────────────────────────────
// 1. Expand node — 하위 아이디어 자동 생성 (3가지 모드 지원)
// ──────────────────────────────────────────────────
export async function aiExpand(
  nodeId: string,
  nodes: Node<MindMapNodeData>[],
  _edges: Edge[],
  mode: ExpandMode = "general"
): Promise<{ newNodes: Node<MindMapNodeData>[]; newEdges: Edge[] }> {
  const aiAvailable = await isAIAvailable();
  if (!aiAvailable) throw new Error("AI_UNAVAILABLE");

  const targetNode = nodes.find((n) => n.id === nodeId);
  if (!targetNode) throw new Error("Node not found");

  const contextPath = getContextPath(nodeId, nodes);

  let systemPrompt = "";
  let prompt = "";

  if (mode === "pros_cons") {
    systemPrompt = "You are a balanced analytical assistant. Based on the topic hierarchy and current keyword, generate exactly 2 advantages (Pros) and 2 drawbacks/risks (Cons) to evaluate the idea. Output ONLY a valid JSON object with no extra text.";
    prompt = `Analyze the following idea under the context path. Output ONLY a valid JSON object in this exact format:
{
  "pros": ["Advantage 1", "Advantage 2"],
  "cons": ["Drawback/Risk 1", "Drawback/Risk 2"]
}

Generate exactly 2 pros and 2 cons in the same language as the input. Keep each item short (under 8 words). Output ONLY the JSON with no markdown, no explanation.

Context Path: ${contextPath}
Idea: "${targetNode.data.label}"
Output:`;
  } else if (mode === "actions") {
    systemPrompt = "You are an execution-oriented action planner. Based on the topic hierarchy and current keyword, generate concrete, actionable next steps (Action Items). Output ONLY a valid JSON array of strings in the same language.";
    prompt = `Generate exactly 3 or 4 practical and actionable tasks (Action Items) to achieve the current goal under the context path. Keep each task concise and action-oriented (under 8 words). Output ONLY a valid JSON array of strings in the same language. No markdown, no explanation.

Context Path: ${contextPath}
Current Goal: "${targetNode.data.label}"
Output:`;
  } else {
    // general
    systemPrompt = "You are a creative ideation assistant. When given a keyword or idea with its parent hierarchy context, you generate practical sub-ideas as a JSON array of strings. Output ONLY valid JSON with no extra text.";
    prompt = `Generate exactly 3 or 4 practical sub-ideas or sub-topics for the following idea under the context path. Output ONLY a valid JSON array of strings in the same language. No markdown, no explanation.

Context Path: ${contextPath}
Idea: "${targetNode.data.label}"
Output:`;
  }

  const session = await createSession(systemPrompt);

  try {
    const response: string = await withTimeout(session.prompt(prompt), 18000);
    
    const newNodes: Node<MindMapNodeData>[] = [];
    const newEdges: Edge[] = [];

    if (mode === "pros_cons") {
      let cleaned = response.trim().replace(/```(?:json)?\s*/gi, "").replace(/```\s*$/g, "");
      const sIdx = cleaned.indexOf("{");
      const eIdx = cleaned.lastIndexOf("}");
      if (sIdx !== -1 && eIdx > sIdx) {
        cleaned = cleaned.substring(sIdx, eIdx + 1);
      }
      const parsed = JSON.parse(cleaned) as { pros: string[]; cons: string[] };
      const pros = Array.isArray(parsed.pros) ? parsed.pros : [];
      const cons = Array.isArray(parsed.cons) ? parsed.cons : [];

      let index = 0;

      // Pros 추가 (emerald 테마)
      pros.slice(0, 3).forEach((item) => {
        const newId = `node-ai-expand-${Date.now()}-${index++}`;
        newNodes.push({
          id: newId,
          type: "mindmapNode",
          data: {
            label: String(item).trim(),
            shape: "rounded-rect",
            colorTheme: "emerald",
            parentId: nodeId,
          },
          position: { ...targetNode.position },
        });
        newEdges.push({
          id: `edge-${nodeId}->${newId}`,
          source: nodeId,
          target: newId,
          type: "smoothstep",
          style: { stroke: getHexColorByTheme("emerald"), strokeWidth: 2 },
        });
      });

      // Cons 추가 (rose 테마)
      cons.slice(0, 3).forEach((item) => {
        const newId = `node-ai-expand-${Date.now()}-${index++}`;
        newNodes.push({
          id: newId,
          type: "mindmapNode",
          data: {
            label: String(item).trim(),
            shape: "rounded-rect",
            colorTheme: "rose",
            parentId: nodeId,
          },
          position: { ...targetNode.position },
        });
        newEdges.push({
          id: `edge-${nodeId}->${newId}`,
          source: nodeId,
          target: newId,
          type: "smoothstep",
          style: { stroke: getHexColorByTheme("rose"), strokeWidth: 2 },
        });
      });

    } else {
      // general & actions
      const list = parseJsonArray(response);

      list.slice(0, 4).forEach((item, idx) => {
        const newId = `node-ai-expand-${Date.now()}-${idx}`;
        newNodes.push({
          id: newId,
          type: "mindmapNode",
          data: {
            label: item,
            shape: "rounded-rect",
            colorTheme: targetNode.data.colorTheme,
            parentId: nodeId,
          },
          position: { ...targetNode.position },
        });
        newEdges.push({
          id: `edge-${nodeId}->${newId}`,
          source: nodeId,
          target: newId,
          type: "smoothstep",
          style: { stroke: getHexColorByTheme(targetNode.data.colorTheme), strokeWidth: 2 },
        });
      });
    }

    return { newNodes, newEdges };
  } finally {
    session.destroy();
  }
}

// ──────────────────────────────────────────────────
// 2. Summarize branch — 브랜치 전체를 1~2문장으로 요약
// ──────────────────────────────────────────────────
export async function aiSummarizeBranch(
  nodeId: string,
  nodes: Node<MindMapNodeData>[],
  edges: Edge[]
): Promise<string> {
  const aiAvailable = await isAIAvailable();
  if (!aiAvailable) throw new Error("AI_UNAVAILABLE");

  const labels = collectBranchLabels(nodeId, nodes, edges);
  if (labels.length === 0) throw new Error("No content to summarize");

  const session = await createSession(
    "You are a concise summarization assistant. Summarize the given list of mind map nodes into 1-2 sentences. Match the language of the input. Output ONLY the summary text with no preamble."
  );

  try {
    const prompt = `Summarize the following mind map branch into 1-2 sentences. Keep the same language as the input.

Topics: ${labels.join(", ")}
Summary:`;

    const response: string = await withTimeout(session.prompt(prompt), 15000);
    return response.trim();
  } finally {
    session.destroy();
  }
}

// ──────────────────────────────────────────────────
// 3. Generate from text — 텍스트에서 브랜치 자동 생성
// ──────────────────────────────────────────────────
export interface GeneratedTree {
  root: string;
  branches: Array<{
    label: string;
    children?: string[];
  }>;
}

export async function aiGenerateFromText(
  text: string,
  parentNodeId: string,
  nodes: Node<MindMapNodeData>[],
): Promise<{ newNodes: Node<MindMapNodeData>[]; newEdges: Edge[] }> {
  const aiAvailable = await isAIAvailable();
  if (!aiAvailable) throw new Error("AI_UNAVAILABLE");

  const parentNode = nodes.find((n) => n.id === parentNodeId);
  const parentColor = parentNode?.data.colorTheme || "indigo";

  const session = await createSession(
    "You are a mind map generator. Convert free text into a structured tree of topics and sub-topics. Output ONLY valid JSON with no extra text."
  );

  try {
    const prompt = `Convert the following text into a mind map structure. Output ONLY a valid JSON object in this exact format:
{
  "branches": [
    { "label": "Main Topic 1", "children": ["Sub 1", "Sub 2"] },
    { "label": "Main Topic 2", "children": ["Sub 3"] }
  ]
}

Generate 2-4 branches with 0-3 children each. Match the language of the input text.

Text:
"""
${text.slice(0, 800)}
"""
Output:`;

    const response: string = await withTimeout(session.prompt(prompt), 20000);

    let cleaned = response.trim().replace(/```(?:json)?\s*/gi, "").replace(/```\s*$/g, "");
    const sIdx = cleaned.indexOf("{");
    const eIdx = cleaned.lastIndexOf("}");
    if (sIdx !== -1 && eIdx > sIdx) cleaned = cleaned.substring(sIdx, eIdx + 1);

    const parsed: GeneratedTree = JSON.parse(cleaned);

    const newNodes: Node<MindMapNodeData>[] = [];
    const newEdges: Edge[] = [];
    const basePos = parentNode?.position || { x: 0, y: 0 };

    (parsed.branches || []).slice(0, 4).forEach((branch, bIdx) => {
      const branchId = `node-ai-gen-${Date.now()}-b${bIdx}`;
      newNodes.push({
        id: branchId,
        type: "mindmapNode",
        data: {
          label: String(branch.label).trim(),
          shape: "rounded-rect",
          colorTheme: parentColor,
          parentId: parentNodeId,
        },
        position: { ...basePos },
      });
      newEdges.push({
        id: `edge-${parentNodeId}->${branchId}`,
        source: parentNodeId,
        target: branchId,
        type: "smoothstep",
        style: { stroke: getHexColorByTheme(parentColor), strokeWidth: 2 },
      });

      (branch.children || []).slice(0, 3).forEach((child, cIdx) => {
        const childId = `node-ai-gen-${Date.now()}-b${bIdx}-c${cIdx}`;
        newNodes.push({
          id: childId,
          type: "mindmapNode",
          data: {
            label: String(child).trim(),
            shape: "rounded-rect",
            colorTheme: parentColor,
            parentId: branchId,
          },
          position: { ...basePos },
        });
        newEdges.push({
          id: `edge-${branchId}->${childId}`,
          source: branchId,
          target: childId,
          type: "smoothstep",
          style: { stroke: getHexColorByTheme(parentColor), strokeWidth: 1.5 },
        });
      });
    });

    return { newNodes, newEdges };
  } finally {
    session.destroy();
  }
}

// ──────────────────────────────────────────────────
// 4. Rewrite node — 노드 텍스트 개선 재작성
// ──────────────────────────────────────────────────
export async function aiRewriteNode(nodeLabel: string): Promise<string> {
  const aiAvailable = await isAIAvailable();
  if (!aiAvailable) throw new Error("AI_UNAVAILABLE");

  const session = await createSession(
    "You are a professional editor specializing in mind map content. Rewrite the given text to be clearer and more concise (under 8 words). Output ONLY the rewritten text, no quotes, no explanation."
  );

  try {
    const prompt = `Rewrite this mind map node to be clearer and more concise (keep under 8 words, same language):

Original: "${nodeLabel}"
Rewritten:`;

    const response: string = await withTimeout(session.prompt(prompt), 12000);
    return response.trim().replace(/^["']|["']$/g, "");
  } finally {
    session.destroy();
  }
}

// ──────────────────────────────────────────────────
// 5. Proofread node — 맞춤법·문법 교정
// ──────────────────────────────────────────────────
export async function aiProofreadNode(nodeLabel: string): Promise<string> {
  const aiAvailable = await isAIAvailable();
  if (!aiAvailable) throw new Error("AI_UNAVAILABLE");

  const session = await createSession(
    "You are a proofreader. Correct spelling and grammar mistakes in the given text. Keep the same language and meaning. Output ONLY the corrected text with no quotes or explanation."
  );

  try {
    const prompt = `Proofread and correct this text (same language, keep meaning):

"${nodeLabel}"
Corrected:`;

    const response: string = await withTimeout(session.prompt(prompt), 12000);
    return response.trim().replace(/^["']|["']$/g, "");
  } finally {
    session.destroy();
  }
}

// ──────────────────────────────────────────────────
// 6. Translate node — 언어 번역
// ──────────────────────────────────────────────────
export type TranslateLang = "ko" | "en" | "ja";

export async function aiTranslateNode(
  nodeLabel: string,
  targetLang: TranslateLang
): Promise<string> {
  const aiAvailable = await isAIAvailable();
  if (!aiAvailable) throw new Error("AI_UNAVAILABLE");

  const langName =
    targetLang === "ko" ? "Korean (한국어)" :
    targetLang === "ja" ? "Japanese (日本語)" :
    "English";

  const session = await createSession(
    `You are a professional translator. Translate text into ${langName}. Output ONLY the translated text with no quotes or explanation.`
  );

  try {
    const prompt = `Translate into ${langName}:

"${nodeLabel}"
Translation:`;

    const response: string = await withTimeout(session.prompt(prompt), 12000);
    return response.trim().replace(/^["']|["']$/g, "");
  } finally {
    session.destroy();
  }
}
