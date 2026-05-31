import dagre from "dagre";
import type { Folder, Bookmark, BookmarkMemo, MemoColor } from "@/shared/types";
import type { Node, Edge } from "@xyflow/react";
import { getLocalizedFolderName } from "@/shared/categories";

const nodeWidth = 220;
const nodeHeight = 60; // Approximate

export function getLayoutedElements(
  folders: Folder[],
  bookmarks: Bookmark[],
  memos: Record<string, BookmarkMemo>,
  expandedFolderIds: Set<string>,
  lang: "en" | "ja" | "ko",
  onRenameBookmark?: (id: string, newTitle: string) => void,
  onDeleteBookmark?: (id: string) => void,
  onMemoChange?: (id: string, content: string, color: MemoColor) => void,
  onDeleteMemo?: (id: string) => void,
  layoutDir: "LR" | "TB" = "LR",
  bookmarkMode: "HIDE" | "COLLAPSED" | "EXPANDED" = "EXPANDED",
  expandedBookmarkFolderIds: Set<string> = new Set(),
  onToggleSubfolders?: (id: string) => void,
  onToggleBookmarks?: (id: string) => void,
  onRenameFolder?: (id: string, newName: string) => void,
  searchQuery: string = ""
) {
  const q = searchQuery.trim().toLowerCase();
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ 
    rankdir: layoutDir, 
    nodesep: layoutDir === "LR" ? 25 : 50, 
    ranksep: layoutDir === "LR" ? 150 : 80 
  });

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const rootId = "root";
  nodes.push({
    id: rootId,
    type: "folder",
    data: { 
      label: lang === "ko" ? "나의 북마크" : lang === "ja" ? "マイブックマーク" : "My Bookmarks", 
      icon: "🏠", 
      isExpanded: expandedFolderIds.has(rootId), 
      isRoot: true,
      layoutDir,
      folderId: "root",
      onToggleSubfolders,
      onToggleBookmarks,
      onRenameFolder,
      isHighlighted: false
    },
    position: { x: 0, y: 0 },
  });
  dagreGraph.setNode(rootId, { width: nodeWidth, height: nodeHeight });

  const foldersByParent = new Map<string, Folder[]>();
  const topLevelFolders: Folder[] = [];
  
  folders.forEach((f) => {
    if (!f.parentId) {
      topLevelFolders.push(f);
    } else {
      const children = foldersByParent.get(f.parentId) || [];
      children.push(f);
      foldersByParent.set(f.parentId, children);
    }
  });

  const bookmarksByFolder = new Map<string, Bookmark[]>();
  bookmarks.forEach((b) => {
    const arr = bookmarksByFolder.get(b.folderId) || [];
    arr.push(b);
    bookmarksByFolder.set(b.folderId, arr);
  });

  function traverse(parentId: string, parentNodeId: string) {
    const isSubfoldersExpanded = expandedFolderIds.has(parentNodeId);
    
    if (isSubfoldersExpanded) {
      const children = parentId === "root" ? topLevelFolders : (foldersByParent.get(parentId) || []);
      
      children.sort((a, b) => a.order - b.order).forEach((f) => {
        const nodeId = `folder-${f.id}`;
        const count = bookmarksByFolder.get(f.id)?.length || 0;
        const isBookmarksExpanded = 
          bookmarkMode === "EXPANDED" ? expandedFolderIds.has(nodeId) :
          bookmarkMode === "COLLAPSED" ? expandedBookmarkFolderIds.has(nodeId) : false;
        
        const folderLabel = getLocalizedFolderName(f, lang);
        const isFolderHighlighted = q !== "" && folderLabel.toLowerCase().includes(q);
        nodes.push({
          id: nodeId,
          type: "folder",
          data: { 
            label: folderLabel, 
            icon: f.icon || "📁", 
            isExpanded: expandedFolderIds.has(nodeId),
            isBookmarksExpanded,
            count,
            folderId: f.id,
            layoutDir,
            onToggleSubfolders,
            onToggleBookmarks,
            onRenameFolder,
            isHighlighted: isFolderHighlighted
          },
          position: { x: 0, y: 0 },
        });
        dagreGraph.setNode(nodeId, { width: nodeWidth, height: nodeHeight });
        
        edges.push({
          id: `${parentNodeId}->${nodeId}`,
          source: parentNodeId,
          target: nodeId,
          type: "smoothstep",
          animated: true,
          style: { stroke: "#818cf8", strokeWidth: 2 }
        });
        dagreGraph.setEdge(parentNodeId, nodeId);
        
        traverse(f.id, nodeId);
      });
    }

    const shouldShowBookmarks = 
      bookmarkMode === "EXPANDED" ? isSubfoldersExpanded :
      bookmarkMode === "COLLAPSED" ? expandedBookmarkFolderIds.has(parentNodeId) : false;

    if (shouldShowBookmarks && parentId !== "root") {
      const marks = bookmarksByFolder.get(parentId) || [];
      marks.sort((a, b) => b.savedAt - a.savedAt).forEach((b) => {
        const nodeId = `bookmark-${b.id}`;
        const memo = memos[b.id];
        const isBookmarkHighlighted = q !== "" && b.title.toLowerCase().includes(q);
        nodes.push({
          id: nodeId,
          type: "bookmark",
          data: { 
            id: b.id,
            title: b.title,
            url: b.url,
            favicon: b.favicon,
            onRename: onRenameBookmark,
            onDelete: onDeleteBookmark,
            onMemoChange,
            onDeleteMemo,
            memo,
            layoutDir,
            isHighlighted: isBookmarkHighlighted
          },
          position: { x: 0, y: 0 },
        });
        dagreGraph.setNode(nodeId, { width: nodeWidth, height: 45 });
        
        edges.push({
          id: `${parentNodeId}->${nodeId}`,
          source: parentNodeId,
          target: nodeId,
          type: "default",
          style: { stroke: "#cbd5e1", strokeWidth: 1.5 }
        });
        dagreGraph.setEdge(parentNodeId, nodeId);
      });
    }
  }

  traverse("root", rootId);

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.position = {
      x: nodeWithPosition.x - nodeWithPosition.width / 2,
      y: nodeWithPosition.y - nodeWithPosition.height / 2,
    };
  });

  return { nodes, edges };
}
