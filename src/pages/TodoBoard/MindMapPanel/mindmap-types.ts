import type { Node, Edge } from "@xyflow/react";

export type NodeShape = "rounded-rect" | "ellipse" | "capsule" | "octagon";

export type ColorTheme = "indigo" | "emerald" | "amber" | "rose" | "slate" | "violet";

export type TemplateId =
  | "blank"
  | "brainstorm"
  | "swot"
  | "project_plan"
  | "weekly_planner"
  | "meeting_notes"
  | "pros_cons"
  | "study_notes"
  | "okrs"
  | "fishbone"
  | "timeline"
  | "org_chart";

export type AiAction =
  | "expand"
  | "summarize"
  | "generate"
  | "rewrite"
  | "proofread"
  | "translate";

export interface MindMapNodeData extends Record<string, unknown> {
  label: string;
  shape: NodeShape;
  colorTheme: ColorTheme;
  edgeColorTheme?: ColorTheme;
  bookmarkUrl?: string;
  icon?: string;
  isRoot?: boolean;
  isExpanded?: boolean;
  parentId?: string;
  depth?: number;
  isStatic?: boolean;
  isLocked?: boolean;
  passwordHash?: string;
  memoContent?: string;
  memoColor?: ColorTheme;
  isDraft?: boolean;
  handleDir?: "top" | "bottom" | "left" | "right";
}

export interface MindMapMemo {
  content: string;
  color: ColorTheme;
}

export interface MindMapData {
  taskId: string;
  nodes: Node<MindMapNodeData>[];
  edges: Edge[];
  direction?: "LR" | "TB" | "balanced";
  memo?: MindMapMemo;
  isManualLayout?: boolean;
}

export interface MindMapMeta {
  fileName: string;
  updatedAt: number;
  taskId?: string;
}
