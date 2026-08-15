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
    <Panel position="bottom-center" className="flex items-center gap-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1.5 rounded-xl shadow-lg border border-slate-200/90 dark:border-slate-800 select-none">
      <button onClick={() => zoomOut({ duration: 300 })} className="px-2.5 py-1 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-all shadow-2xs cursor-pointer">
        {lang === "ko" ? "축소" : lang === "ja" ? "縮小" : "Zoom Out"}
      </button>
      <button onClick={() => zoomIn({ duration: 300 })} className="px-2.5 py-1 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-all shadow-2xs cursor-pointer">
        {lang === "ko" ? "확대" : lang === "ja" ? "拡大" : "Zoom In"}
      </button>
      <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-0.5" />
      <button onClick={() => fitView({ duration: 800, padding: 0.2 })} className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-all shadow-2xs cursor-pointer border border-indigo-200/60 dark:border-indigo-800/40">
        {lang === "ko" ? "자동 정렬" : lang === "ja" ? "自動整列" : "Fit View"}
      </button>
      <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-0.5" />
      <button onClick={onToggleLayout} className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-all shadow-2xs flex items-center gap-1 cursor-pointer border border-indigo-200/60 dark:border-indigo-800/40">
        {layoutDir === "LR" 
          ? (lang === "ko" ? "수평 ➡️" : lang === "ja" ? "水平 ➡️" : "Horizontal ➡️") 
          : (lang === "ko" ? "수직 ⬇️" : lang === "ja" ? "垂直 ⬇️" : "Vertical ⬇️")}
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
    <Panel position="top-right" className="flex flex-col gap-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 rounded-xl shadow-lg border border-slate-200/90 dark:border-slate-800 pointer-events-auto mt-3 mr-3 select-none">
      {/* Search */}
      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg px-2.5 py-1.5 border border-slate-200/60 dark:border-slate-700/60">
        <span className="text-slate-400 text-xs">🔍</span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onSearchCommit(); }}
          placeholder={lang === "ko" ? "폴더/북마크 검색..." : lang === "ja" ? "検索..." : "Search..."}
          className="bg-transparent outline-none text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 w-36"
        />
        {searchQuery && (
          <button onClick={() => onSearchChange("")} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs leading-none">✕</button>
        )}
      </div>
      <div className="w-full h-px bg-slate-200 dark:bg-slate-800" />
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          {lang === "ko" ? "북마크 표시" : lang === "ja" ? "ブックマーク表示" : "Show Bookmarks"}
        </span>
        <div className="flex items-center gap-1">
          <button onClick={() => onBookmarkModeChange("HIDE")} className={`px-2 py-0.5 text-[11px] font-semibold rounded transition-all ${bookmarkMode === "HIDE" ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700'}`}>
            {lang === "ko" ? "숨김" : lang === "ja" ? "非表示" : "Hide"}
          </button>
          <button onClick={() => onBookmarkModeChange("COLLAPSED")} className={`px-2 py-0.5 text-[11px] font-semibold rounded transition-all ${bookmarkMode === "COLLAPSED" ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700'}`}>
            {lang === "ko" ? "닫기" : lang === "ja" ? "閉じる" : "Close"}
          </button>
          <button onClick={() => onBookmarkModeChange("EXPANDED")} className={`px-2 py-0.5 text-[11px] font-semibold rounded transition-all ${bookmarkMode === "EXPANDED" ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700'}`}>
            {lang === "ko" ? "펼치기" : lang === "ja" ? "展開" : "Expand"}
          </button>
        </div>
      </div>
      <div className="w-full h-px bg-slate-200 dark:bg-slate-800" />
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          {lang === "ko" ? "폴더 펼침" : lang === "ja" ? "フォルダ展開" : "Expand"}
        </span>
        <div className="flex items-center gap-1">
          <button onClick={() => onExpandDepth(1)} className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded transition-all">
            {lang === "ko" ? "1단계" : lang === "ja" ? "1段階" : "1"}
          </button>
          <button onClick={() => onExpandDepth(2)} className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded transition-all">
            {lang === "ko" ? "2단계" : lang === "ja" ? "2段階" : "2"}
          </button>
          <button onClick={() => onExpandDepth(Infinity)} className="px-2 py-0.5 text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded transition-all border border-indigo-200/60 dark:border-indigo-800/40">
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
