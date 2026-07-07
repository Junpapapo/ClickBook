import type { Node, Edge } from "@xyflow/react";
import type { MindMapNodeData, MindMapData } from "./mindmap-types";
import { getHexColorByTheme } from "./mindmap-utils";

// 템플릿별 마인드맵 노드 트리 빌드 헬퍼
export function buildTemplateData(templateId: string, title: string): MindMapData {
  const rootNode: Node<MindMapNodeData> = {
    id: "root",
    type: "mindmapNode",
    data: { label: title, shape: "capsule", colorTheme: "indigo", isRoot: true },
    position: { x: 0, y: 0 }
  };

  const nodes: Node<MindMapNodeData>[] = [rootNode];
  const edges: Edge[] = [];

  const addBranch = (id: string, label: string, color: any = "indigo") => {
    nodes.push({
      id,
      type: "mindmapNode",
      data: { label, shape: "rounded-rect", colorTheme: color, parentId: "root", isStatic: true },
      position: { x: 0, y: 0 }
    });
    edges.push({
      id: `edge-root->${id}`,
      source: "root",
      target: id,
      type: "smoothstep",
      style: { stroke: getHexColorByTheme(color), strokeWidth: 2 }
    });
  };

  const addChildBranch = (parentId: string, id: string, label: string, color: any = "indigo") => {
    nodes.push({
      id,
      type: "mindmapNode",
      data: { label, shape: "rounded-rect", colorTheme: color, parentId, isStatic: true },
      position: { x: 0, y: 0 }
    });
    edges.push({
      id: `edge-${parentId}->${id}`,
      source: parentId,
      target: id,
      type: "smoothstep",
      style: { stroke: getHexColorByTheme(color), strokeWidth: 1.5 }
    });
  };

  switch (templateId) {
    case "swot":
      addBranch("s", "Strengths", "emerald");
      addBranch("w", "Weaknesses", "rose");
      addBranch("o", "Opportunities", "amber");
      addBranch("t", "Threats", "violet");
      break;
    case "project_plan":
      addBranch("goals", "Goals", "indigo");
      addBranch("scope", "Scope", "emerald");
      addBranch("timeline", "Timeline", "amber");
      addBranch("team", "Team", "violet");
      addBranch("risks", "Risks", "rose");
      break;
    case "weekly_planner":
      addBranch("mon", "Monday", "indigo");
      addBranch("tue", "Tuesday", "indigo");
      addBranch("wed", "Wednesday", "indigo");
      addBranch("thu", "Thursday", "indigo");
      addBranch("fri", "Friday", "emerald");
      addBranch("sat", "Saturday", "amber");
      addBranch("sun", "Sunday", "rose");
      break;
    case "meeting_notes":
      addBranch("agenda", "Agenda", "indigo");
      addBranch("decisions", "Decisions", "emerald");
      addBranch("actions", "Action Items", "violet");
      addBranch("notes", "General Notes", "slate");
      break;
    case "pros_cons":
      addBranch("pros", "Pros", "emerald");
      addBranch("cons", "Cons", "rose");
      break;
    case "study_notes":
      addBranch("concepts", "Concepts", "indigo");
      addBranch("defs", "Definitions", "emerald");
      addBranch("examples", "Examples", "amber");
      break;
    case "okrs":
      addBranch("obj1", "Objective 1", "indigo");
      addChildBranch("obj1", "kr1_1", "Key Result 1.1", "emerald");
      addChildBranch("obj1", "kr1_2", "Key Result 1.2", "emerald");

      addBranch("obj2", "Objective 2", "violet");
      addChildBranch("obj2", "kr2_1", "Key Result 2.1", "amber");
      addChildBranch("obj2", "kr2_2", "Key Result 2.2", "amber");
      break;
    case "org_chart":
      addBranch("exec", "Executives", "indigo");
      addChildBranch("exec", "ceo", "CEO", "indigo");
      addChildBranch("exec", "board", "Board of Directors", "indigo");

      addBranch("depts", "Departments", "slate");
      addChildBranch("depts", "rnd", "R&D Team", "emerald");
      addChildBranch("depts", "sales", "Sales & Marketing", "amber");
      addChildBranch("depts", "hr", "HR & Admin", "rose");
      break;
    case "timeline":
      addBranch("p1", "Phase 1", "indigo");
      addBranch("p2", "Phase 2", "emerald");
      addBranch("p3", "Phase 3", "amber");
      addBranch("done", "Complete", "violet");
      break;
    case "fishbone":
      addBranch("man", "Manpower", "indigo");
      addBranch("mach", "Machine", "emerald");
      addBranch("mat", "Material", "amber");
      addBranch("meth", "Method", "rose");
      addBranch("meas", "Measurement", "violet");
      addBranch("env", "Mother Nature", "slate");
      break;
    case "brainstorm":
      addBranch("topic", "Topic", "indigo");
      addBranch("ideas", "Ideas", "violet");
      addBranch("questions", "Questions", "amber");
      addBranch("actions", "Action Items", "emerald");
      break;
    case "blank":
    default:
      break;
  }

  let direction: "LR" | "TB" | "balanced" = "balanced";
  if (templateId === "org_chart") {
    direction = "TB";
  } else if (templateId === "timeline" || templateId === "fishbone") {
    direction = "LR";
  }
  return { taskId: "global_workspace", nodes, edges, direction };
}
