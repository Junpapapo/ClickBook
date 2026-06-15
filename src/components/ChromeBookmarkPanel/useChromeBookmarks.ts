import { useState, useEffect, useCallback } from "react";
import type { MessageResponse } from "@/shared/types";
import { useLang } from "@/shared/LanguageContext";
import { useDialog } from "@/shared/useDialog";

export interface CNode {
  id: string;
  title: string;
  url?: string;
  children?: CNode[];
}

export type PendingChange =
  | { kind: "rename"; id: string; title: string }
  | { kind: "delete"; id: string; isFolder: boolean }
  | { kind: "move"; id: string; parentId: string; index?: number }
  | { kind: "add"; title: string; url: string; parentId: string };

interface UseChromeBookmarksProps {
  onRefresh: () => void;
}

export function useChromeBookmarks({ onRefresh }: UseChromeBookmarksProps) {
  const { t } = useLang();
  const { showConfirm, DialogEl } = useDialog();

  const [tree, setTree] = useState<CNode[]>([]);
  const [rootId, setRootId] = useState("0");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [pending, setPending] = useState<PendingChange[]>([]);
  const [treeLoading, setTreeLoading] = useState(false);

  const flash = (msg: string) => {
    setStatus(msg);
    setTimeout(() => setStatus(""), 2500);
  };

  const loadTree = useCallback(async () => {
    setTreeLoading(true);
    try {
      const res = (await chrome.runtime.sendMessage({
        type: "GET_CHROME_BOOKMARKS",
      })) as MessageResponse;
      if (res.success) {
        const root = (res.data as CNode[])[0];
        setRootId(root?.id ?? "0");
        setTree(root?.children ?? []);
      }
    } finally {
      setTreeLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  function collectIds(nodes: CNode[]): string[] {
    return nodes.flatMap((n) => (n.url ? [n.id] : collectIds(n.children ?? [])));
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
    setCollapsed((p) => {
      const s = new Set(p);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }

  function toggleSelect(node: CNode) {
    const ids = node.url ? [node.id] : collectIds(node.children ?? []);
    const allSel = ids.every((id) => selected.has(id));
    setSelected((p) => {
      const s = new Set(p);
      ids.forEach((id) => (allSel ? s.delete(id) : s.add(id)));
      return s;
    });
  }

  function toggleAll() {
    const all = collectIds(tree);
    setSelected(all.every((id) => selected.has(id)) ? new Set() : new Set(all));
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

  function applyLocalMove(
    currentTree: CNode[],
    nodeId: string,
    targetParentId: string,
    targetIndex: number | undefined,
    treeRootId: string
  ): CNode[] {
    let extracted: CNode | null = null;
    function removeNode(ns: CNode[]): CNode[] {
      return ns.flatMap((n) => {
        if (n.id === nodeId) {
          extracted = n;
          return [];
        }
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

  const handleMoveNode = useCallback((draggedId: string, targetParentId: string, targetIndex: number | undefined) => {
    setTree((prev) => applyLocalMove(prev, draggedId, targetParentId, targetIndex, rootId));
    setPending((prev) => [
      ...prev.filter((p) => !(p.kind === "move" && p.id === draggedId)),
      { kind: "move", id: draggedId, parentId: targetParentId, index: targetIndex },
    ]);
    flash(t("chromeMoveQueue"));
  }, [rootId, t]);

  async function handleBulkDelete() {
    const map = buildIdMap(tree);
    const ids = Array.from(selected).filter((id) => map[id]);
    if (!ids.length) return;
    if (
      !(await showConfirm(
        t("chromeBulkDeleteConfirm", { n: ids.length }),
        t("chromeBulkDelete")
      ))
    )
      return;
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
    const items = Array.from(selected)
      .map((id) => map[id])
      .filter(Boolean);
    if (!items.length) return;
    setBusy(true);
    const res = (await chrome.runtime.sendMessage({
      type: "BULK_IMPORT_CHROME",
      items,
    })) as MessageResponse;
    setBusy(false);
    const count = res.success && res.data ? (res.data as { count: number }).count : items.length;
    flash(t("chromeBulkImportDone", { n: count }));
    setSelected(new Set());
    onRefresh();
  }

  async function handleImportAll() {
    const all = collectItems(tree);
    if (!all.length) return;
    if (!(await showConfirm(t("chromeImportAllConfirm", { n: all.length })))) return;
    setBusy(true);
    await chrome.runtime.sendMessage({ type: "BULK_IMPORT_CHROME", items: all });
    setBusy(false);
    flash(t("chromeImportAllDone"));
    onRefresh();
  }

  async function handleTextImport(importText: string, onImportSuccess: () => void) {
    const urls = Array.from(
      new Set(
        (importText.match(/https?:\/\/\S+/g) ?? [])
          .map((u) => u.replace(/[)）.,、。！？'">\]]+$/, ""))
          .filter((u) => u.startsWith("http"))
      )
    );
    if (!urls.length) {
      flash(t("chromeTextImportNoUrls"));
      return;
    }

    const items = urls.map((url) => {
      try {
        return { url, title: new URL(url).hostname };
      } catch (err) {
        console.warn("Operation failed:", err);
        return { url, title: url };
      }
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
    setPending((prev) => [...prev, ...newPending]);
    onImportSuccess();
    flash(t("chromeQueueRename"));
  }

  async function handleReset() {
    if (!(await showConfirm(t("chromeResetConfirm")))) return;
    const res = (await chrome.runtime.sendMessage({
      type: "RESTORE_CHROME_SNAPSHOT",
    })) as MessageResponse;
    if (res.success) {
      flash(t("chromeResetDone"));
      await loadTree();
    } else flash(t("chromeResetNoSnapshot"));
  }

  async function handleChromeRename(id: string, title: string) {
    if (!title.trim()) {
      setEditingId(null);
      return;
    }
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
    if (!(await showConfirm(msg, t("chromeDeleteBtn")))) return;
    setTree((prev) => applyLocalDelete(prev, id));
    setPending((prev) => [
      ...prev.filter(
        (p) => (p.kind !== "add" && p.id !== id) || (p.kind !== "rename" && p.kind !== "move")
      ),
      { kind: "delete", id, isFolder },
    ]);
    flash(t("chromeQueueRename"));
  }

  async function handleWriteChrome() {
    if (!pending.length) return;
    if (!(await showConfirm(t("chromeWriteConfirm", { n: pending.length })))) return;
    setBusy(true);
    for (const change of pending) {
      if (change.kind === "rename") {
        await chrome.runtime.sendMessage({ type: "RENAME_CHROME_BOOKMARK", id: change.id, title: change.title });
      } else if (change.kind === "move") {
        await chrome.runtime.sendMessage({
          type: "MOVE_CHROME_BOOKMARK",
          id: change.id,
          parentId: change.parentId,
          index: change.index,
        });
      } else if (change.kind === "delete") {
        await chrome.runtime.sendMessage({
          type: "DELETE_CHROME_BOOKMARK",
          id: change.id,
          isFolder: change.isFolder,
        });
      } else if (change.kind === "add") {
        await chrome.runtime.sendMessage({
          type: "ADD_CHROME_BOOKMARKS",
          items: [{ title: change.title, url: change.url }],
          parentId: change.parentId,
        });
      }
    }
    const totalCount = pending.length;
    setPending([]);
    setBusy(false);
    flash(t("chromeWriteDone", { n: totalCount }));
    await loadTree();
  }

  return {
    tree,
    rootId,
    collapsed,
    selected,
    busy,
    status,
    editingId,
    setEditingId,
    editingTitle,
    setEditingTitle,
    pending,
    setPending,
    treeLoading,
    loadTree,
    toggleCollapse,
    toggleSelect,
    toggleAll,
    handleMoveNode,
    handleBulkDelete,
    handleBulkImport,
    handleImportAll,
    handleTextImport,
    handleReset,
    handleChromeRename,
    handleChromeDelete,
    handleWriteChrome,
    DialogEl,
    collectIds,
  };
}
