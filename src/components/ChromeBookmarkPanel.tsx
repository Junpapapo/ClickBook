import { useState, useEffect, useCallback } from "react";
import {
  ChevronRight, ChevronDown, Globe, Folder as FolderIcon,
  CheckSquare, Square, RefreshCw, Download, Upload, RotateCcw,
  Pencil, Trash2, Check, X, FileText, Plus,
} from "lucide-react";
import type { MessageResponse } from "@/shared/types";
import type { ChromePattern } from "@/shared/types";
import { useDialog } from "@/shared/useDialog";
import { useLang } from "@/shared/LanguageContext";

interface CNode { id: string; title: string; url?: string; children?: CNode[] }
type PendingChange =
  | { kind: "rename"; id: string; title: string }
  | { kind: "delete"; id: string; isFolder: boolean }
  | { kind: "move"; id: string; parentId: string; index?: number }
  | { kind: "add"; title: string; url: string; parentId: string };
interface Props { onRefresh: () => void; fullHeight?: boolean; onClose?: () => void }

export default function ChromeBookmarkPanel({ onRefresh, fullHeight = false, onClose }: Props) {
  const { t } = useLang();
  const [open, setOpen] = useState(true);
  const [tree, setTree] = useState<CNode[]>([]);
  const [rootId, setRootId] = useState("0");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragOverMode, setDragOverMode] = useState<"into" | "before" | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [pending, setPending] = useState<PendingChange[]>([]);
  const { showConfirm, DialogEl } = useDialog();
  const [textImportOpen, setTextImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [textImportBusy, setTextImportBusy] = useState(false);
  const [importAllBusy, setImportAllBusy] = useState(false);

  // Chrome パターン
  const [patterns, setPatterns] = useState<ChromePattern[]>([]);
  const [patternSectionOpen, setPatternSectionOpen] = useState(true);
  const [showPatternInput, setShowPatternInput] = useState(false);
  const [newPatternName, setNewPatternName] = useState("");
  const [patternBusy, setPatternBusy] = useState(false);
  const [patternStatus, setPatternStatus] = useState("");

  const flashPattern = (msg: string) => { setPatternStatus(msg); setTimeout(() => setPatternStatus(""), 3000); };

  const flash = (msg: string) => { setStatus(msg); setTimeout(() => setStatus(""), 2500); };

  const loadTree = useCallback(async () => {
    const res = await chrome.runtime.sendMessage({ type: "GET_CHROME_BOOKMARKS" }) as MessageResponse;
    if (res.success) {
      const root = (res.data as CNode[])[0];
      setRootId(root?.id ?? "0");
      setTree(root?.children ?? []);
    }
  }, []);

  const loadPatterns = useCallback(async () => {
    const res = await chrome.runtime.sendMessage({ type: "GET_CHROME_PATTERNS" }) as MessageResponse;
    if (res.success) setPatterns(res.data as ChromePattern[]);
  }, []);

  useEffect(() => { loadTree(); loadPatterns(); }, [loadTree, loadPatterns]);

  function collectIds(nodes: CNode[]): string[] {
    return nodes.flatMap((n) => n.url ? [n.id] : collectIds(n.children ?? []));
  }

  function collectItems(nodes: CNode[]): Array<{ url: string; title: string }> {
    return nodes.flatMap((n) =>
      n.url ? [{ url: n.url, title: n.title }] : collectItems(n.children ?? [])
    );
  }

  function buildIdMap(nodes: CNode[]): Record<string, { url: string; title: string }> {
    const map: Record<string, { url: string; title: string }> = {};
    for (const n of nodes) {
      if (n.url) map[n.id] = { url: n.url, title: n.title };
      if (n.children) Object.assign(map, buildIdMap(n.children));
    }
    return map;
  }

  function toggleCollapse(id: string) {
    setCollapsed((p) => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }

  function toggleSelect(node: CNode) {
    const ids = node.url ? [node.id] : collectIds(node.children ?? []);
    const allSel = ids.every((id) => selected.has(id));
    setSelected((p) => {
      const s = new Set(p);
      ids.forEach((id) => allSel ? s.delete(id) : s.add(id));
      return s;
    });
  }

  function toggleAll() {
    const all = collectIds(tree);
    setSelected(all.every((id) => selected.has(id)) ? new Set() : new Set(all));
  }

  async function handleBulkDelete() {
    const map = buildIdMap(tree);
    const ids = Array.from(selected).filter((id) => map[id]);
    if (!ids.length) return;
    if (!await showConfirm(
      t("chromeBulkDeleteConfirm", { n: ids.length }),
      t("chromeBulkDelete")
    )) return;
    let newTree = tree;
    for (const id of ids) newTree = applyLocalDelete(newTree, id);
    setTree(newTree);
    setPending((prev) => [
      ...prev.filter((p) => p.kind !== "add" && !ids.includes(p.id)),
      ...ids.map((id) => ({ kind: "delete" as const, id, isFolder: false })),
    ]);
    setSelected(new Set());
    flash(t("chromeBulkDeleteQueueDone", { n: ids.length }));
  }

  async function handleBulkImport() {
    const map = buildIdMap(tree);
    const items = Array.from(selected).map((id) => map[id]).filter(Boolean);
    if (!items.length) return;
    setBusy(true);
    const res = await chrome.runtime.sendMessage({ type: "BULK_IMPORT_CHROME", items }) as MessageResponse;
    setBusy(false);
    const count = res.success && res.data ? (res.data as { count: number }).count : items.length;
    flash(t("chromeBulkImportDone", { n: count }));
    setSelected(new Set());
    onRefresh();
  }

  async function handleImportAll() {
    const all = collectItems(tree);
    if (!all.length) return;
    if (!await showConfirm(t("chromeImportAllConfirm", { n: all.length }))) return;
    setBusy(true);
    setImportAllBusy(true);
    await chrome.runtime.sendMessage({ type: "BULK_IMPORT_CHROME", items: all });
    setImportAllBusy(false);
    setBusy(false);
    flash(t("chromeImportAllDone"));
    onRefresh();
  }

  async function handleTextImport() {
    const urls = Array.from(
      new Set(
        (importText.match(/https?:\/\/\S+/g) ?? [])
          .map(u => u.replace(/[)）.,、。！？'">\]]+$/, ""))
          .filter(u => u.startsWith("http"))
      )
    );
    if (!urls.length) { flash(t("chromeTextImportNoUrls")); setTextImportOpen(false); return; }
    setTextImportBusy(true);

    const items = urls.map(url => {
      try { return { url, title: new URL(url).hostname }; }
      catch (err) { console.warn("Operation failed:", err); return { url, title: url }; }
    });

    const targetParentId = tree[0]?.id || rootId;
    let newTree = tree;
    const newPending: PendingChange[] = [];

    for (const item of items) {
      const tempId = `temp-${crypto.randomUUID()}`;
      const newNode: CNode = { id: tempId, title: item.title, url: item.url };
      newTree = applyLocalAdd(newTree, targetParentId, newNode, rootId);
      newPending.push({ kind: "add", title: item.title, url: item.url, parentId: targetParentId });
    }

    setTree(newTree);
    setPending(prev => [...prev, ...newPending]);
    setTextImportBusy(false);
    setTextImportOpen(false);
    setImportText("");
    flash(t("chromeQueueRename")); // Reuse "Added to queue" message
  }


  async function handleReset() {
    if (!await showConfirm(t("chromeResetConfirm"))) return;
    const res = await chrome.runtime.sendMessage({ type: "RESTORE_CHROME_SNAPSHOT" }) as MessageResponse;
    if (res.success) { flash(t("chromeResetDone")); await loadTree(); }
    else flash(t("chromeResetNoSnapshot"));
  }

  function applyLocalRename(nodes: CNode[], id: string, title: string): CNode[] {
    return nodes.map((n) =>
      n.id === id
        ? { ...n, title }
        : n.children
        ? { ...n, children: applyLocalRename(n.children, id, title) }
        : n
    );
  }

  function applyLocalDelete(nodes: CNode[], id: string): CNode[] {
    return nodes
      .filter((n) => n.id !== id)
      .map((n) => (n.children ? { ...n, children: applyLocalDelete(n.children, id) } : n));
  }

  function applyLocalMove(currentTree: CNode[], nodeId: string, targetParentId: string, targetIndex: number | undefined, treeRootId: string): CNode[] {
    let extracted: CNode | null = null;
    function removeNode(ns: CNode[]): CNode[] {
      return ns.flatMap((n) => {
        if (n.id === nodeId) { extracted = n; return []; }
        return [n.children ? { ...n, children: removeNode(n.children) } : n];
      });
    }
    const tree1 = removeNode(currentTree);
    if (!extracted) return currentTree;
    const node = extracted as CNode;
    if (targetParentId === treeRootId) {
      const result = [...tree1];
      result.splice(targetIndex ?? result.length, 0, node);
      return result;
    }
    function insertNode(ns: CNode[]): CNode[] {
      return ns.map((n) => {
        if (n.id === targetParentId) {
          const children = [...(n.children ?? [])];
          children.splice(targetIndex ?? children.length, 0, node);
          return { ...n, children };
        }
        return n.children ? { ...n, children: insertNode(n.children) } : n;
      });
    }
    return insertNode(tree1);
  }

  function applyLocalAdd(nodes: CNode[], parentId: string, node: CNode, treeRootId: string): CNode[] {
    if (parentId === treeRootId) {
      return [...nodes, node];
    }
    return nodes.map((n) => {
      if (n.id === parentId) {
        return { ...n, children: [...(n.children ?? []), node] };
      }
      return n.children ? { ...n, children: applyLocalAdd(n.children, parentId, node, treeRootId) } : n;
    });
  }

  async function handleChromeRename(id: string, title: string) {
    if (!title.trim()) { setEditingId(null); return; }
    setTree((prev) => applyLocalRename(prev, id, title.trim()));
    setPending((prev) => [
      ...prev.filter((p) => !(p.kind === "rename" && p.id === id)),
      { kind: "rename", id, title: title.trim() },
    ]);
    setEditingId(null);
    flash(t("chromeQueueRename"));
  }

  async function handleChromeDelete(id: string, title: string, isFolder: boolean) {
    const msg = isFolder
      ? t("chromeDeleteFolderConfirm", { title })
      : t("chromeDeleteBookmarkConfirm", { title: title || "(unnamed)" });
    if (!await showConfirm(msg, t("chromeDeleteBtn"))) return;
    setTree((prev) => applyLocalDelete(prev, id));
    setPending((prev) => [
      ...prev.filter((p) => p.kind !== "add" && p.id !== id || (p.kind !== "rename" && p.kind !== "move")),
      { kind: "delete", id, isFolder },
    ]);
    flash(t("chromeQueueRename"));
  }

  async function handleWriteChrome() {
    if (!pending.length) return;
    if (!await showConfirm(t("chromeWriteConfirm", { n: pending.length }))) return;
    setBusy(true);
    for (const change of pending) {
      if (change.kind === "rename") {
        await chrome.runtime.sendMessage({ type: "RENAME_CHROME_BOOKMARK", id: change.id, title: change.title });
      } else if (change.kind === "move") {
        await chrome.runtime.sendMessage({ type: "MOVE_CHROME_BOOKMARK", id: change.id, parentId: change.parentId, index: change.index });
      } else if (change.kind === "delete") {
        await chrome.runtime.sendMessage({ type: "DELETE_CHROME_BOOKMARK", id: change.id, isFolder: change.isFolder });
      } else if (change.kind === "add") {
        await chrome.runtime.sendMessage({ type: "ADD_CHROME_BOOKMARKS", items: [{ title: change.title, url: change.url }], parentId: change.parentId });
      }
    }
    setPending([]);
    setBusy(false);
    flash(t("chromeWriteDone", { n: pending.length }));
    await loadTree();
  }

  async function handleSavePattern() {
    const name = newPatternName.trim();
    if (!name) return;
    setPatternBusy(true);
    const res = await chrome.runtime.sendMessage({ type: "SAVE_CHROME_PATTERN", name }) as MessageResponse;
    setPatternBusy(false);
    setNewPatternName("");
    setShowPatternInput(false);
    if (res.success) {
      const d = res.data as { count: number };
      flashPattern(t("chromePatternSaveDone", { name, n: d.count }));
      await loadPatterns();
    }
  }

  async function handleLoadPattern(id: string, name: string) {
    if (!await showConfirm(t("chromePatternLoadConfirm", { name }))) return;
    setPatternBusy(true);
    const res = await chrome.runtime.sendMessage({ type: "LOAD_CHROME_PATTERN", id }) as MessageResponse;
    setPatternBusy(false);
    if (res.success) {
      const d = res.data as { added: number; total: number };
      flashPattern(t("chromePatternLoadDone", { added: d.added, total: d.total }));
      await loadTree();
    }
  }

  async function handleDeletePattern(id: string, name: string) {
    if (!await showConfirm(t("chromePatternDeleteConfirm", { name }), t("chromeDeleteBtn"))) return;
    await chrome.runtime.sendMessage({ type: "DELETE_CHROME_PATTERN", id });
    await loadPatterns();
  }

  function renderNode(node: CNode, depth: number, parentId: string, indexInParent: number) {
    const isFolder = !node.url;
    const nodeIds = isFolder ? collectIds(node.children ?? []) : [node.id];
    const allSel = nodeIds.length > 0 && nodeIds.every((id) => selected.has(id));
    const someSel = !allSel && nodeIds.some((id) => selected.has(id));
    const isCollapsed = collapsed.has(node.id);
    const isEditing = editingId === node.id;
    const isDragOver = dragOverId === node.id;

    async function handleDrop(e: React.DragEvent) {
      e.preventDefault();
      e.stopPropagation();
      setDragOverId(null);
      setDragOverMode(null);
      const raw = e.dataTransfer.getData("application/x-clickbook-chrome-dnd");
      if (!raw) return;
      const { id: draggedId } = JSON.parse(raw) as { id: string };
      if (draggedId === node.id) return;
      // フォルダへのドロップ: 下寄り(45%以上)→ INTO、上寄り→ BEFORE
      const rect = e.currentTarget.getBoundingClientRect();
      const moveInto = isFolder && e.clientY >= rect.top + rect.height * 0.45;
      const targetParentId = moveInto ? node.id : parentId;
      const targetIndex = moveInto ? undefined : indexInParent;
      // ローカルツリー即時更新（UI反映）
      setTree((prev) => applyLocalMove(prev, draggedId, targetParentId, targetIndex, rootId));
      // pending キューに積む（chrome書込で実際に反映）
      setPending((prev) => [
        ...prev.filter((p) => !(p.kind === "move" && p.id === draggedId)),
        { kind: "move", id: draggedId, parentId: targetParentId, index: targetIndex },
      ]);
      flash(t("chromeMoveQueue"));
    }

    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-1 py-[3px] rounded group transition-colors
            ${isDragOver && dragOverMode === "into"
              ? "bg-indigo-50 dark:bg-indigo-900/25 ring-1 ring-inset ring-indigo-400"
              : isDragOver && dragOverMode === "before"
              ? "border-t-2 border-indigo-400 hover:bg-gray-100 dark:hover:bg-surface-800"
              : "hover:bg-gray-100 dark:hover:bg-surface-800"
            }`}
          style={{ paddingLeft: `${depth * 12 + 6}px`, paddingRight: "6px" }}
          draggable={!isEditing}
          onDoubleClick={(e) => {
            if (!isFolder && !isEditing) {
              e.stopPropagation();
              setEditingId(node.id);
              setEditingTitle(node.title);
            }
          }}
          onDragStart={(e) => {
            e.dataTransfer.setData(
              "application/x-clickbook-chrome-dnd",
              JSON.stringify({ id: node.id })
            );
            if (node.url) {
              e.dataTransfer.setData(
                "application/x-clickbook-chrome-bookmark",
                JSON.stringify({ url: node.url, title: node.title })
              );
            }
            e.dataTransfer.effectAllowed = "move";
          }}
          onDragOver={(e) => {
            if (!e.dataTransfer.types.includes("application/x-clickbook-chrome-dnd")) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            if (isFolder) {
              const rect = e.currentTarget.getBoundingClientRect();
              const mode = e.clientY < rect.top + rect.height * 0.45 ? "before" : "into";
              setDragOverId(node.id);
              setDragOverMode(mode);
            } else {
              setDragOverId(node.id);
              setDragOverMode("before");
            }
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setDragOverId(null);
              setDragOverMode(null);
            }
          }}
          onDrop={handleDrop}
        >
          <button
            onClick={(e) => { e.stopPropagation(); toggleSelect(node); }}
            className="shrink-0 text-gray-400 dark:text-gray-600 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
          >
            {allSel
              ? <CheckSquare size={10} className="text-indigo-400" />
              : someSel
              ? <CheckSquare size={10} className="text-indigo-300 opacity-50" />
              : <Square size={10} />}
          </button>

          {isFolder
            ? <button onClick={() => toggleCollapse(node.id)} className="shrink-0 text-gray-400 dark:text-gray-600">
                {isCollapsed ? <ChevronRight size={10} /> : <ChevronDown size={10} />}
              </button>
            : <span className="w-[10px] shrink-0" />}

          {isFolder
            ? <FolderIcon size={10} className="text-amber-400 shrink-0" />
            : <Globe size={10} className="text-sky-400 shrink-0" />}

          {isEditing ? (
            <input
              autoFocus
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleChromeRename(node.id, editingTitle);
                if (e.key === "Escape") setEditingId(null);
              }}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 min-w-0 ml-1 text-[11px] bg-gray-100 dark:bg-surface-700 border border-gray-300 dark:border-surface-500 rounded px-1 py-0 text-gray-800 dark:text-gray-200 outline-none focus:border-indigo-500"
            />
          ) : (
            <span className="truncate text-[11px] text-gray-600 dark:text-gray-400 flex-1 min-w-0 group-hover:text-gray-900 dark:group-hover:text-gray-200 ml-1 cursor-grab active:cursor-grabbing">
              {node.title || node.url}
            </span>
          )}

          {isEditing ? (
            <div className="flex items-center gap-0.5 shrink-0 ml-1">
              <button
                onClick={(e) => { e.stopPropagation(); handleChromeRename(node.id, editingTitle); }}
                className="p-0.5 text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <Check size={9} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setEditingId(null); }}
                className="p-0.5 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <X size={9} />
              </button>
            </div>
          ) : (
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0 ml-1 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); setEditingId(node.id); setEditingTitle(node.title); }}
                className="p-0.5 text-gray-400 dark:text-gray-600 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                title={t("chromeRenameTooltip")}
              >
                <Pencil size={9} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleChromeDelete(node.id, node.title, isFolder); }}
                className="p-0.5 text-gray-400 dark:text-gray-600 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                title={t("chromeDeleteTooltip")}
              >
                <Trash2 size={9} />
              </button>
            </div>
          )}
        </div>
        {isFolder && !isCollapsed && node.children?.map((c, i) => renderNode(c, depth + 1, node.id, i))}
      </div>
    );
  }

  const allIds = collectIds(tree);
  const selCount = Array.from(selected).filter((id) => allIds.includes(id)).length;

  return (
    <>
      {DialogEl}
      {textImportOpen && (
        <>
          <div
            className="fixed inset-0 z-[9000] bg-black/50 backdrop-blur-sm"
            onClick={() => setTextImportOpen(false)}
          />
          <div className="fixed inset-0 z-[9001] flex items-center justify-center p-4 pointer-events-none">
            <div
              className="pointer-events-auto w-full max-w-lg bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-600 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-surface-700">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-indigo-400" />
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{t("chromeTextExtractTitle")}</span>
                </div>
                <button
                  onClick={() => setTextImportOpen(false)}
                  className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                >
                  <X size={15} />
                </button>
              </div>
              <div className="px-6 py-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  {t("chromeTextExtractDesc")}
                </p>
                <textarea
                  autoFocus
                  value={importText}
                  onChange={e => setImportText(e.target.value)}
                  rows={8}
                  placeholder={t("chromeTextImportPlaceholder")}
                  className="w-full text-sm bg-gray-50 dark:bg-surface-800 border border-gray-300 dark:border-surface-600 rounded-lg px-3 py-2.5 text-gray-800 dark:text-gray-100 outline-none focus:border-indigo-500 transition-colors placeholder-gray-400 dark:placeholder-gray-600 resize-none"
                />
                <p className="mt-2 text-[11px] text-gray-400 dark:text-gray-600">
                  {t("chromeTextDetected", { n: (importText.match(/https?:\/\/\S+/g) ?? []).length })}
                </p>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 dark:border-surface-700 flex justify-end gap-2">
                <button
                  onClick={() => setTextImportOpen(false)}
                  className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-gray-100 dark:bg-surface-700 hover:bg-gray-200 dark:hover:bg-surface-600 rounded-lg transition-colors"
                >
                  {t("chromeCancel")}
                </button>
                <button
                  onClick={handleTextImport}
                  disabled={textImportBusy || !(importText.match(/https?:\/\/\S+/g) ?? []).length}
                  className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  <Download size={13} />
                  {textImportBusy ? t("chromeTextImporting") : t("chromeTextImportBtn")}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      <div className={`border-b border-gray-200 dark:border-surface-700 shrink-0 ${fullHeight ? "flex flex-col flex-1 min-h-0" : ""}`}>

      {/* タイトル（クリックで閉じる） */}
      {onClose ? (
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-surface-700 shrink-0 w-full text-left group hover:bg-gray-50 dark:hover:bg-surface-800 transition-colors"
          title={t("rankingClose")}
        >
          <Globe size={13} className="text-sky-400" />
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 flex-1">{t("chromeBookmarksTitle")}</span>
          <span className="text-[10px] text-gray-400 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">{t("rankingClose")}</span>
        </button>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-surface-700 shrink-0">
          <Globe size={13} className="text-sky-400" />
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{t("chromeBookmarksTitle")}</span>
        </div>
      )}

      {/* ── Chrome パターンバー ── */}
      <div className="border-b border-gray-200 dark:border-surface-700">
        <div className="flex items-center justify-between px-3 py-1.5">
          <button
            onClick={() => setPatternSectionOpen(v => !v)}
            className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            {patternSectionOpen ? <ChevronDown size={9} /> : <ChevronRight size={9} />}
            <span className="uppercase tracking-widest font-bold">{t("chromePatternsTitle")}</span>
            <span className="text-gray-400 dark:text-gray-700">({patterns.length})</span>
          </button>
          <button
            onClick={() => setShowPatternInput(v => !v)}
            title={t("chromePatternSaveTooltip")}
            className="flex items-center gap-0.5 text-[10px] font-medium text-white bg-indigo-600 hover:bg-indigo-500 px-2 py-0.5 rounded-full transition-colors"
          >
            <Plus size={10} />{t("chromePatternSaveBtn")}
          </button>
        </div>

        {patternSectionOpen && (
          <div className="pb-1.5 px-2 space-y-0.5">
            {patterns.map((p) => (
              <div key={p.id} className="flex items-center gap-1 group">
                <span className="flex-1 min-w-0 text-[11px] text-gray-600 dark:text-gray-400 truncate">
                  {p.name}
                  <span className="ml-1 text-[10px] text-gray-400 dark:text-gray-600">
                    ({t("itemCount", { n: p.items.length })})
                  </span>
                </span>
                <button
                  onClick={() => handleLoadPattern(p.id, p.name)}
                  disabled={patternBusy}
                  title={t("chromePatternLoadTooltip")}
                  className="shrink-0 flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-surface-700 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors disabled:opacity-40"
                >
                  <Download size={8} />{t("chromePatternLoadBtn")}
                </button>
                <button
                  onClick={() => handleDeletePattern(p.id, p.name)}
                  className="shrink-0 opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 dark:text-gray-600 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                  title={t("chromeDeleteTooltip")}
                >
                  <Trash2 size={9} />
                </button>
              </div>
            ))}
            {showPatternInput && (
              <div className="flex items-center gap-1 pt-0.5">
                <input
                  autoFocus
                  value={newPatternName}
                  onChange={e => setNewPatternName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleSavePattern(); if (e.key === "Escape") { setShowPatternInput(false); setNewPatternName(""); } }}
                  placeholder={t("patternPlaceholder")}
                  className="flex-1 min-w-0 text-[11px] bg-gray-100 dark:bg-surface-700 border border-gray-300 dark:border-surface-500 rounded px-1.5 py-0.5 text-gray-800 dark:text-gray-200 outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleSavePattern}
                  disabled={patternBusy || !newPatternName.trim()}
                  className="shrink-0 p-0.5 text-emerald-500 hover:text-emerald-400 disabled:opacity-40 transition-colors"
                >
                  <Check size={11} />
                </button>
                <button
                  onClick={() => { setShowPatternInput(false); setNewPatternName(""); }}
                  className="shrink-0 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X size={11} />
                </button>
              </div>
            )}
            {patternStatus && (
              <p className="text-[10px] text-emerald-500 dark:text-emerald-400 text-center pt-0.5">{patternStatus}</p>
            )}
          </div>
        )}
      </div>

      {/* ── Chrome ツリー ── */}
      {/* ヘッダー */}      <div className="flex items-center justify-between px-3 py-2">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          {open ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          <span className="uppercase tracking-widest font-bold">Chrome</span>
        </button>
        <button
          onClick={loadTree}
          className="text-gray-400 dark:text-gray-700 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
          title={t("chromeReloadTooltip")}
        >
          <RefreshCw size={10} />
        </button>
      </div>

      {open && (
        <>
      {/* ツリー */}
          <div className={fullHeight ? "flex-1 min-h-0 overflow-y-auto pb-1" : "max-h-44 overflow-y-auto pb-1"}>
            {tree.length === 0
              ? <p className="text-[10px] text-gray-400 dark:text-gray-700 text-center py-3">{t("chromeLoading")}</p>
              : tree.map((n, i) => renderNode(n, 0, rootId, i))}
          </div>

          {/* アクションバー */}
          <div className="px-2 py-2 border-t border-gray-200 dark:border-surface-700 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <button
                onClick={toggleAll}
                className="text-[10px] text-gray-500 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                {selCount === allIds.length && allIds.length > 0 ? t("chromeDeselectAll") : t("chromeSelectAll")}
              </button>
              <span className="text-[10px] text-gray-400 dark:text-gray-700">
                {selCount > 0 ? t("chromeSelectedCount", { n: selCount }) : ""}
              </span>
              <button
                onClick={handleBulkImport}
                disabled={selCount === 0 || busy}
                className="ml-auto flex items-center gap-1 text-[10px] px-2 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded transition-colors"
              >
                <Download size={9} />
                {busy ? t("chromeTextImporting") : t("chromeBulkImport")}
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={selCount === 0 || busy}
                title={t("chromeBulkDeleteConfirm", { n: selCount })}
                className="flex items-center gap-1 text-[10px] px-2 py-1 bg-rose-50 dark:bg-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/30 text-rose-600 dark:text-rose-400 disabled:opacity-40 disabled:cursor-not-allowed rounded transition-colors"
              >
                <Trash2 size={9} />
                {t("chromeBulkDelete")}
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleImportAll}
                disabled={busy}
                title={t("chromeImportAllConfirm", { n: allIds.length })}
                className="flex-1 flex items-center justify-center gap-1 text-[10px] py-1 rounded bg-gray-100 dark:bg-surface-700 hover:bg-gray-200 dark:hover:bg-surface-600 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors disabled:opacity-40"
              >
                {importAllBusy ? <RefreshCw size={9} className="animate-spin" /> : <Download size={9} />}
                {importAllBusy ? t("chromeTextImporting") : t("chromeImportAll")}
              </button>
              <button
                onClick={() => setTextImportOpen(true)}
                disabled={busy}
                title={t("chromeTextExtractTitle")}
                className="flex-1 flex items-center justify-center gap-1 text-[10px] py-1 rounded bg-gray-100 dark:bg-surface-700 hover:bg-gray-200 dark:hover:bg-surface-600 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                <FileText size={9} />{t("chromeImportText")}
              </button>
              <button
                onClick={handleReset}
                title={t("chromeResetTooltip")}
                className="p-1 rounded bg-gray-100 dark:bg-surface-700 hover:bg-rose-50 dark:hover:bg-rose-500/20 text-gray-500 dark:text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
              >
                <RotateCcw size={10} />
              </button>
            </div>

            {status && <p className="text-[10px] text-emerald-400 text-center">{status}</p>}

            {pending.length > 0 && (
              <div className="flex items-center gap-1 pt-0.5">
                <button
                  onClick={handleWriteChrome}
                  disabled={busy}
                  className="flex-1 flex-items-center justify-center gap-1 text-[10px] py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-white transition-colors disabled:opacity-40 font-medium"
                >
                  <Upload size={9} />
                  {t("chromeWriteBtn", { n: pending.length })}
                </button>
                <button
                  onClick={() => { setPending([]); loadTree(); }}
                  title={t("chromeCancel")}
                  className="p-1 rounded bg-gray-100 dark:bg-surface-700 hover:bg-rose-50 dark:hover:bg-rose-900/50 text-gray-400 hover:text-rose-500 transition-colors"
                >
                  <X size={10} />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
    </>
  );
}
