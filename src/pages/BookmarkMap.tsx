import { useState, useEffect, useCallback } from "react";
import { 
  ReactFlow, 
  MiniMap, 
  Background, 
  useNodesState, 
  useEdgesState,
  NodeMouseHandler,
  ReactFlowProvider,
  useReactFlow,
  useOnViewportChange,
  Panel,
  Node,
  Edge
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Bookmark, Folder, BookmarkMemo } from "@/shared/types";
import { useLang } from "@/shared/LanguageContext";
import { getLayoutedElements } from "@/utils/mapLayout";
import { FolderNode, BookmarkNode } from "@/components/MapNodes";

const nodeTypes = {
  folder: FolderNode,
  bookmark: BookmarkNode,
};

interface Props {
  bookmarks: Bookmark[];
  folders: Folder[];
  memos: Record<string, BookmarkMemo>;
  onRefresh: () => void;
}

function MapControls({ layoutDir, onToggleLayout }: { layoutDir: "LR"|"TB", onToggleLayout: () => void }) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const { lang } = useLang();
  
  return (
    <Panel position="bottom-center" className="flex items-center gap-2 bg-white/90 dark:bg-surface-800/90 backdrop-blur-md p-2 rounded-xl shadow-lg border border-gray-200 dark:border-surface-700">
      <button onClick={() => zoomOut({ duration: 300 })} className="px-3 py-1.5 text-sm font-medium bg-gray-100 dark:bg-surface-700 hover:bg-gray-200 dark:hover:bg-surface-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors">
        {lang === "ko" ? "축소" : lang === "ja" ? "縮小" : "Zoom Out"}
      </button>
      <button onClick={() => zoomIn({ duration: 300 })} className="px-3 py-1.5 text-sm font-medium bg-gray-100 dark:bg-surface-700 hover:bg-gray-200 dark:hover:bg-surface-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors">
        {lang === "ko" ? "확대" : lang === "ja" ? "拡大" : "Zoom In"}
      </button>
      <div className="w-px h-6 bg-gray-300 dark:bg-surface-600 mx-1"></div>
      <button onClick={() => fitView({ duration: 800, padding: 0.2 })} className="px-3 py-1.5 text-sm font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-colors">
        {lang === "ko" ? "자동 정렬" : lang === "ja" ? "自動整列" : "Fit View"}
      </button>
      <div className="w-px h-6 bg-gray-300 dark:bg-surface-600 mx-1"></div>
      <button onClick={onToggleLayout} className="px-3 py-1.5 text-sm font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-colors flex items-center gap-1.5">
        {layoutDir === "LR" 
          ? (lang === "ko" ? "➡️ 수평" : lang === "ja" ? "➡️ 水平" : "➡️ Horizontal") 
          : (lang === "ko" ? "⬇️ 수직" : lang === "ja" ? "⬇️ 垂直" : "⬇️ Vertical")}
      </button>
    </Panel>
  );
}

function MapToolbar({ 
  onExpandDepth, 
  bookmarkMode,
  onBookmarkModeChange,
  searchQuery,
  onSearchChange,
  onSearchCommit
}: { 
  onExpandDepth: (depth: number) => void,
  bookmarkMode: "HIDE" | "COLLAPSED" | "EXPANDED",
  onBookmarkModeChange: (mode: "HIDE" | "COLLAPSED" | "EXPANDED") => void,
  searchQuery: string,
  onSearchChange: (q: string) => void,
  onSearchCommit: () => void
}) {
  const { lang } = useLang();
  return (
    <Panel position="top-right" className="flex flex-col gap-2 bg-white/90 dark:bg-surface-800/90 backdrop-blur-md p-3 rounded-xl shadow-lg border border-gray-200 dark:border-surface-700 pointer-events-auto mt-4 mr-4">
      {/* Search */}
      <div className="flex items-center gap-2 bg-gray-100 dark:bg-surface-700 rounded-lg px-2 py-1.5">
        <span className="text-gray-400 text-sm">🔍</span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onSearchCommit(); }}
          placeholder={lang === "ko" ? "폴더/북마크 검색..." : lang === "ja" ? "検索..." : "Search..."}
          className="bg-transparent outline-none text-xs text-gray-700 dark:text-gray-200 placeholder-gray-400 w-36"
        />
        {searchQuery && (
          <button onClick={() => onSearchChange("")} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs leading-none">✕</button>
        )}
      </div>
      <div className="w-full h-px bg-gray-200 dark:bg-surface-700"></div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
          {lang === "ko" ? "북마크 표시" : lang === "ja" ? "ブックマーク表示" : "Show Bookmarks"}
        </span>
        <div className="flex items-center gap-1">
          <button onClick={() => onBookmarkModeChange("HIDE")} className={`px-2 py-1 text-xs font-medium rounded transition-colors ${bookmarkMode === "HIDE" ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'bg-gray-100 text-gray-600 dark:bg-surface-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-surface-600'}`}>
            {lang === "ko" ? "숨김" : lang === "ja" ? "非表示" : "Hide"}
          </button>
          <button onClick={() => onBookmarkModeChange("COLLAPSED")} className={`px-2 py-1 text-xs font-medium rounded transition-colors ${bookmarkMode === "COLLAPSED" ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'bg-gray-100 text-gray-600 dark:bg-surface-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-surface-600'}`}>
            {lang === "ko" ? "전부 닫기" : lang === "ja" ? "全て閉じる" : "Close All"}
          </button>
          <button onClick={() => onBookmarkModeChange("EXPANDED")} className={`px-2 py-1 text-xs font-medium rounded transition-colors ${bookmarkMode === "EXPANDED" ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'bg-gray-100 text-gray-600 dark:bg-surface-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-surface-600'}`}>
            {lang === "ko" ? "전부 펼치기" : lang === "ja" ? "全て展開" : "Expand All"}
          </button>
        </div>
      </div>
      <div className="w-full h-px bg-gray-200 dark:bg-surface-700"></div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
          {lang === "ko" ? "폴더 펼침" : lang === "ja" ? "フォルダ展開" : "Expand"}
        </span>
        <div className="flex items-center gap-1">
          <button onClick={() => onExpandDepth(1)} className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-surface-700 hover:bg-gray-200 dark:hover:bg-surface-600 text-gray-700 dark:text-gray-300 rounded transition-colors">
            {lang === "ko" ? "1단계" : lang === "ja" ? "1段階" : "Level 1"}
          </button>
          <button onClick={() => onExpandDepth(2)} className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-surface-700 hover:bg-gray-200 dark:hover:bg-surface-600 text-gray-700 dark:text-gray-300 rounded transition-colors">
            {lang === "ko" ? "2단계" : lang === "ja" ? "2段階" : "Level 2"}
          </button>
          <button onClick={() => onExpandDepth(Infinity)} className="px-2 py-1 text-xs font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded transition-colors">
            {lang === "ko" ? "전체" : lang === "ja" ? "全展開" : "All"}
          </button>
        </div>
      </div>
    </Panel>
  );
}

const MAP_STATE_KEY = "clickbook_map_state";

function BookmarkMapContent({ bookmarks, folders, memos, onRefresh }: Props) {
  const { lang, t } = useLang();
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [layoutDir, setLayoutDir] = useState<"LR"|"TB">("LR");
  const [bookmarkMode, setBookmarkMode] = useState<"HIDE" | "COLLAPSED" | "EXPANDED">("EXPANDED");
  const [searchQuery, setSearchQuery] = useState("");
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(new Set());
  const [expandedBookmarkFolderIds, setExpandedBookmarkFolderIds] = useState<Set<string>>(new Set());
  const [initialViewport, setInitialViewport] = useState<{ x: number, y: number, zoom: number } | null>(null);
  const { setCenter } = useReactFlow();

  // Load state on mount
  useEffect(() => {
    chrome.storage.local.get(MAP_STATE_KEY).then(res => {
      const state = res[MAP_STATE_KEY];
      if (state) {
        if (state.expandedFolderIds) setExpandedFolderIds(new Set(state.expandedFolderIds));
        if (state.expandedBookmarkFolderIds) setExpandedBookmarkFolderIds(new Set(state.expandedBookmarkFolderIds));
        if (state.layoutDir) setLayoutDir(state.layoutDir);
        if (state.bookmarkMode) setBookmarkMode(state.bookmarkMode);
        if (state.viewport) setInitialViewport(state.viewport);
      } else {
        const s = new Set<string>(["root"]);
        folders.filter(f => !f.parentId).forEach(f => s.add(`folder-${f.id}`));
        setExpandedFolderIds(s);
      }
      setIsLoaded(true);
    });
  }, []); // Only run once on mount

  // Save layout & toggle state
  useEffect(() => {
    if (!isLoaded) return;
    chrome.storage.local.get(MAP_STATE_KEY).then(res => {
      const prev = res[MAP_STATE_KEY] || {};
      chrome.storage.local.set({ 
        [MAP_STATE_KEY]: { 
          ...prev, 
          expandedFolderIds: Array.from(expandedFolderIds),
          expandedBookmarkFolderIds: Array.from(expandedBookmarkFolderIds),
          layoutDir,
          bookmarkMode
        } 
      });
    });
  }, [expandedFolderIds, expandedBookmarkFolderIds, layoutDir, bookmarkMode, isLoaded]);

  // Save viewport state when user finishes dragging/zooming
  useOnViewportChange({
    onEnd: (viewport) => {
      if (!isLoaded) return;
      chrome.storage.local.get(MAP_STATE_KEY).then(res => {
        const prev = res[MAP_STATE_KEY] || {};
        chrome.storage.local.set({ [MAP_STATE_KEY]: { ...prev, viewport } });
      });
    }
  });

  const expandToDepth = useCallback((depth: number) => {
    const newSet = new Set<string>(["root"]);
    
    const foldersByParent = new Map<string, Folder[]>();
    folders.forEach(f => {
      const arr = foldersByParent.get(f.parentId || "root") || [];
      arr.push(f);
      foldersByParent.set(f.parentId || "root", arr);
    });

    if (depth >= 1) {
      const level1 = foldersByParent.get("root") || [];
      level1.forEach(f => newSet.add(`folder-${f.id}`));
      
      if (depth >= 2) {
        level1.forEach(f => {
          const level2 = foldersByParent.get(f.id) || [];
          level2.forEach(child => newSet.add(`folder-${child.id}`));
        });
      }
    }
    
    if (depth === Infinity) {
      folders.forEach(f => newSet.add(`folder-${f.id}`));
    }
    
    setExpandedFolderIds(newSet);
    setExpandedBookmarkFolderIds(new Set()); // Reset manual bookmarks on programmatic expand
  }, [folders]);

  const onRenameBookmark = useCallback(async (id: string, newTitle: string) => {
    await chrome.runtime.sendMessage({
      type: "UPDATE_BOOKMARK",
      id,
      title: newTitle
    });
    onRefresh();
  }, [onRefresh]);

  const onRenameFolder = useCallback(async (id: string, newName: string) => {
    await chrome.runtime.sendMessage({
      type: "RENAME_FOLDER",
      id,
      name: newName
    });
    onRefresh();
  }, [onRefresh]);

  const onDeleteBookmark = useCallback(async (id: string) => {
    await chrome.runtime.sendMessage({ type: "DELETE_BOOKMARK", id });
    onRefresh();
  }, [onRefresh]);

  const onMemoChange = useCallback(async (id: string, content: string, color: any) => {
    await chrome.runtime.sendMessage({ type: "SAVE_MEMO", bookmarkId: id, content, color });
    onRefresh();
  }, [onRefresh]);

  const onDeleteMemo = useCallback(async (id: string) => {
    await chrome.runtime.sendMessage({ type: "DELETE_MEMO", bookmarkId: id });
    onRefresh();
  }, [onRefresh]);

  const onToggleSubfolders = useCallback((folderId: string) => {
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      const id = `folder-${folderId}`;
      if (folderId === "root") {
        if (next.has("folder-root")) next.delete("folder-root");
        else next.add("folder-root");
        return next;
      }
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const onToggleBookmarks = useCallback((folderId: string) => {
    setBookmarkMode((prev) => (prev === "HIDE" ? "COLLAPSED" : prev));
    setExpandedBookmarkFolderIds((prev) => {
      const next = new Set(prev);
      const id = `folder-${folderId}`;
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleBookmarkModeChange = useCallback((mode: "HIDE" | "COLLAPSED" | "EXPANDED") => {
    setBookmarkMode(mode);
    if (mode === "COLLAPSED" || mode === "HIDE") {
      setExpandedBookmarkFolderIds(new Set()); // Reset manually expanded bookmarks
    }
  }, []);

  useEffect(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      folders,
      bookmarks,
      memos,
      expandedFolderIds,
      lang,
      onRenameBookmark,
      onDeleteBookmark,
      onMemoChange,
      onDeleteMemo,
      layoutDir,
      bookmarkMode,
      expandedBookmarkFolderIds,
      onToggleSubfolders,
      onToggleBookmarks,
      onRenameFolder,
      searchQuery
    );
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [folders, bookmarks, memos, expandedFolderIds, lang, onRenameBookmark, onDeleteBookmark, onMemoChange, onDeleteMemo, layoutDir, bookmarkMode, expandedBookmarkFolderIds, onToggleSubfolders, onToggleBookmarks, onRenameFolder, searchQuery, setNodes, setEdges]);

  const handleSearchCommit = useCallback(() => {
    if (!searchQuery.trim()) return;
    const q = searchQuery.trim().toLowerCase();
    const matched = nodes.find(n =>
      (n.data.label as string)?.toLowerCase().includes(q) ||
      (n.data.title as string)?.toLowerCase().includes(q)
    );
    if (matched && matched.position) {
      setCenter(matched.position.x + 110, matched.position.y + 30, { zoom: 1.2, duration: 600 });
    }
  }, [searchQuery, nodes, setCenter]);

  const onNodeClick: NodeMouseHandler = useCallback(() => {
    // Left empty because toggles are handled by node internals
  }, []);

  if (!isLoaded) {
    return <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-50 dark:bg-surface-950">Loading map state...</div>;
  }

  return (
    <div className="w-full h-full relative bg-gray-50 dark:bg-surface-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        defaultViewport={initialViewport || undefined}
        fitView={!initialViewport}
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={1.5}
        className="[&_.react-flow__controls]:dark:bg-surface-800 [&_.react-flow__controls-button]:dark:bg-surface-800 [&_.react-flow__controls-button]:dark:text-gray-300 [&_.react-flow__controls-button]:dark:border-surface-600"
      >
        <MapToolbar 
          onExpandDepth={expandToDepth} 
          bookmarkMode={bookmarkMode} 
          onBookmarkModeChange={handleBookmarkModeChange}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchCommit={handleSearchCommit}
        />
        <MapControls layoutDir={layoutDir} onToggleLayout={() => setLayoutDir(d => d === "LR" ? "TB" : "LR")} />
        <MiniMap 
          pannable
          zoomable
          nodeStrokeColor={(n) => {
            if (n.type === 'folder') return '#818cf8';
            return '#cbd5e1';
          }}
          nodeColor={(n) => {
            if (n.type === 'folder') return '#e0e7ff';
            return '#f8fafc';
          }}
          maskColor="rgba(0,0,0, 0.1)"
          className="dark:bg-surface-800 !border-gray-200 dark:!border-surface-700 rounded-lg shadow-sm"
        />
        <Background color="#94a3b8" gap={16} size={1} />
      </ReactFlow>
      
      <div className="absolute top-4 left-4 bg-white/80 dark:bg-surface-900/80 backdrop-blur-md px-4 py-3 rounded-xl shadow-sm border border-gray-200 dark:border-surface-700 pointer-events-none">
        <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200">🗺️ {t("bookmarkMap") || "Bookmark Map"}</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {lang === "ko" ? "폴더 노드를 클릭하여 하위 북마크를 펼치거나 접을 수 있습니다." : 
           lang === "ja" ? "フォルダをクリックして展開・折りたたみができます。" : 
           "Click folder nodes to expand or collapse bookmarks."}
        </p>
      </div>
    </div>
  );
}

export default function BookmarkMap(props: Props) {
  return (
    <ReactFlowProvider>
      <BookmarkMapContent {...props} />
    </ReactFlowProvider>
  );
}
