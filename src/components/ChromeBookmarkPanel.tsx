import { useState } from "react";
import {
  ChevronRight, ChevronDown, Globe, Folder as FolderIcon,
  CheckSquare, Square, RefreshCw, Download, RotateCcw,
  Pencil, Trash2, Check, X, FileText,
} from "lucide-react";
import ProgressBar from "./ProgressBar";
import { useLang } from "@/shared/LanguageContext";
import { useChromeBookmarks } from "./ChromeBookmarkPanel/useChromeBookmarks";
import type { CNode } from "./ChromeBookmarkPanel/useChromeBookmarks";
import ChromePatternSection from "./ChromeBookmarkPanel/ChromePatternSection";

interface Props {
  onRefresh: () => void;
  fullHeight?: boolean;
  onClose?: () => void;
}

export default function ChromeBookmarkPanel({ onRefresh, fullHeight = false, onClose }: Props) {
  const { t } = useLang();
  const [open, setOpen] = useState(true);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragOverMode, setDragOverMode] = useState<"into" | "before" | null>(null);

  // 모달 텍스트 입력창 상태
  const [textImportOpen, setTextImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [textImportBusy, setTextImportBusy] = useState(false);

  const {
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
  } = useChromeBookmarks({ onRefresh });

  const allIds = collectIds(tree);
  const selCount = Array.from(selected).filter((id) => allIds.includes(id)).length;

  async function triggerTextImport() {
    setTextImportBusy(true);
    await handleTextImport(importText, () => {
      setImportText("");
      setTextImportOpen(false);
    });
    setTextImportBusy(false);
  }

  function renderNode(node: CNode, depth: number, parentId: string, indexInParent: number) {
    const isFolder = !node.url;
    const nodeIds = isFolder ? collectIds(node.children ?? []) : [node.id];
    const allSel = nodeIds.length > 0 && nodeIds.every((id) => selected.has(id));
    const someSel = !allSel && nodeIds.some((id) => selected.has(id));
    const isNodeCollapsed = collapsed.has(node.id);
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

      const rect = e.currentTarget.getBoundingClientRect();
      const moveInto = isFolder && e.clientY >= rect.top + rect.height * 0.45;
      const targetParentId = moveInto ? node.id : parentId;
      const targetIndex = moveInto ? undefined : indexInParent;

      handleMoveNode(draggedId, targetParentId, targetIndex);
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
            className="shrink-0 text-gray-400 dark:text-gray-600 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors cursor-pointer"
          >
            {allSel
              ? <CheckSquare size={10} className="text-indigo-400" />
              : someSel
              ? <CheckSquare size={10} className="text-indigo-300 opacity-50" />
              : <Square size={10} />}
          </button>

          {isFolder
            ? <button onClick={() => toggleCollapse(node.id)} className="shrink-0 text-gray-400 dark:text-gray-600 cursor-pointer">
                {isNodeCollapsed ? <ChevronRight size={10} /> : <ChevronDown size={10} />}
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
                className="p-0.5 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
              >
                <Check size={9} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setEditingId(null); }}
                className="p-0.5 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors cursor-pointer"
              >
                <X size={9} />
              </button>
            </div>
          ) : (
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0 ml-1 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); setEditingId(node.id); setEditingTitle(node.title); }}
                className="p-0.5 text-gray-400 dark:text-gray-600 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                title={t("chromeRenameTooltip")}
              >
                <Pencil size={9} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleChromeDelete(node.id, node.title, isFolder); }}
                className="p-0.5 text-gray-400 dark:text-gray-600 hover:text-rose-500 dark:hover:text-rose-400 transition-colors cursor-pointer"
                title={t("chromeDeleteTooltip")}
              >
                <Trash2 size={9} />
              </button>
            </div>
          )}
        </div>
        {isFolder && !isNodeCollapsed && node.children?.map((c, i) => renderNode(c, depth + 1, node.id, i))}
      </div>
    );
  }

  return (
    <>
      <ProgressBar isLoading={treeLoading} />
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
                  className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-surface-700 rounded-lg transition-colors cursor-pointer"
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
                  className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-gray-100 dark:bg-surface-700 hover:bg-gray-200 dark:hover:bg-surface-600 rounded-lg transition-colors cursor-pointer"
                >
                  {t("chromeCancel")}
                </button>
                <button
                  onClick={triggerTextImport}
                  disabled={textImportBusy || !(importText.match(/https?:\/\/\S+/g) ?? []).length}
                  className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
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
        {/* 타이틀 */}
        {onClose ? (
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-surface-700 shrink-0 w-full text-left group hover:bg-gray-50 dark:hover:bg-surface-800 transition-colors cursor-pointer"
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

        {/* Chrome 패턴 동기화 컴포넌트 */}
        <ChromePatternSection onPatternLoad={loadTree} />

        {/* Chrome 북마크 트리 */}
        <div className="flex items-center justify-between px-3 py-2">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 transition-colors cursor-pointer"
          >
            {open ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
            <span className="uppercase tracking-widest font-bold">Chrome</span>
          </button>
          <button
            onClick={loadTree}
            className="text-gray-400 dark:text-gray-700 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            title={t("chromeReloadTooltip")}
          >
            <RefreshCw size={10} />
          </button>
        </div>

        {open && (
          <>
            <div className={fullHeight ? "flex-1 min-h-0 overflow-y-auto pb-1" : "max-h-44 overflow-y-auto pb-1"}>
              {tree.length === 0
                ? <p className="text-[10px] text-gray-400 dark:text-gray-700 text-center py-3">{t("chromeLoading")}</p>
                : tree.map((n, i) => renderNode(n, 0, rootId, i))}
            </div>

            {/* 액션 바 */}
            <div className="px-2 py-2 border-t border-gray-200 dark:border-surface-700 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={toggleAll}
                  className="text-[10px] text-gray-500 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 transition-colors cursor-pointer"
                >
                  {selCount === allIds.length && allIds.length > 0 ? t("chromeDeselectAll") : t("chromeSelectAll")}
                </button>
                <span className="text-[10px] text-gray-400 dark:text-gray-700">
                  {selCount > 0 ? t("chromeSelectedCount", { n: selCount }) : ""}
                </span>
                <button
                  onClick={handleBulkImport}
                  disabled={selCount === 0 || busy}
                  className="ml-auto flex items-center gap-1 text-[10px] px-2 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded transition-colors cursor-pointer"
                >
                  <Download size={9} />
                  {busy ? t("chromeTextImporting") : t("chromeBulkImport")}
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={selCount === 0 || busy}
                  title={t("chromeBulkDeleteConfirm", { n: selCount })}
                  className="flex items-center gap-1 text-[10px] px-2 py-1 bg-rose-50 dark:bg-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/30 text-rose-600 dark:text-rose-400 disabled:opacity-40 disabled:cursor-not-allowed rounded transition-colors cursor-pointer"
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
                  className="flex-1 flex items-center justify-center gap-1 text-[10px] py-1 rounded bg-gray-100 dark:bg-surface-700 hover:bg-gray-200 dark:hover:bg-surface-600 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors disabled:opacity-40 cursor-pointer"
                >
                  <Download size={9} />
                  {t("chromeImportAll")}
                </button>
                <button
                  onClick={() => setTextImportOpen(true)}
                  disabled={busy}
                  title={t("chromeTextExtractTitle")}
                  className="flex-1 flex items-center justify-center gap-1 text-[10px] py-1 rounded bg-gray-100 dark:bg-surface-700 hover:bg-gray-200 dark:hover:bg-surface-600 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors cursor-pointer"
                >
                  <FileText size={9} />
                  {t("chromeImportText")}
                </button>
                <button
                  onClick={handleReset}
                  title={t("chromeResetTooltip")}
                  className="p-1 rounded bg-gray-100 dark:bg-surface-700 hover:bg-rose-50 dark:hover:bg-rose-500/20 text-gray-500 dark:text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors cursor-pointer"
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
                    className="flex-1 flex items-center justify-center gap-1 text-[10px] py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-white transition-colors disabled:opacity-40 font-medium cursor-pointer"
                  >
                    <Download size={9} />
                    {t("chromeWriteBtn", { n: pending.length })}
                  </button>
                  <button
                    onClick={() => { setPending([]); loadTree(); }}
                    title={t("chromeCancel")}
                    className="p-1 rounded bg-gray-100 dark:bg-surface-700 hover:bg-rose-50 dark:hover:bg-rose-900/50 text-gray-400 hover:text-rose-500 transition-colors cursor-pointer"
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
