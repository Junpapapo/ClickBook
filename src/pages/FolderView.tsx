import { useState, useRef } from "react";
import { ChevronLeft, FolderOpen, FolderPlus, MoveRight, Check, X, Plus, ChevronsUp, ChevronsDown } from "lucide-react";
import BookmarkCard from "@/components/BookmarkCard";
import { EditModal } from "@/components/BookmarkEditPanel";
import { getFolderById, buildFolderTree } from "@/shared/categories";
import type { Bookmark, Folder, MemoMap, MessageResponse } from "@/shared/types";
import { FOLDER_COLOR_DOT as COLOR_DOT, FOLDER_COLOR_TEXT as COLOR_TEXT } from "@/shared/colors";
import { useLang } from "@/shared/LanguageContext";

interface Props {
  bookmarks: Bookmark[];
  folders: Folder[];
  folderId: string;
  memos: MemoMap;
  onBack: () => void;
  onSelectFolder: (id: string) => void;
  onRefresh: () => void;
}

function isEmoji(s: string) { return !!s && !/^[A-Za-z0-9_]+$/.test(s); }

export default function FolderView({ bookmarks, folders, folderId, memos, onBack, onSelectFolder, onRefresh }: Props) {
  const { t } = useLang();
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [editingBookmark, setEditingBookmark] = useState<import("@/shared/types").Bookmark | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [sortKey, setSortKey] = useState<"savedAt" | "title" | "visitCount">("savedAt");
  const [subFoldersCollapsed, setSubFoldersCollapsed] = useState(false);
  const [showSubFolderInput, setShowSubFolderInput] = useState(false);
  const [newSubFolderName, setNewSubFolderName] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);
  const subFolderInputRef = useRef<HTMLInputElement>(null);

  const folder = getFolderById(folders, folderId);

  // 直接の子フォルダー
  const childFolders = folders
    .filter((f) => f.parentId === folderId)
    .sort((a, b) => a.order - b.order);

  // 移動先候補: 現在のフォルダー以外の全フォルダー (表示順)
  const otherFolders = folders
    .filter((f) => f.id !== folderId)
    .sort((a, b) => a.order - b.order);

  const bookmarkCounts = bookmarks.reduce<Record<string, number>>((acc, b) => {
    acc[b.folderId] = (acc[b.folderId] ?? 0) + 1;
    return acc;
  }, {});
  const tree = buildFolderTree(folders, bookmarkCounts);

  function getCount(id: string): number {
    function findNode(nodes: ReturnType<typeof buildFolderTree>): number {
      for (const n of nodes) {
        if (n.folder.id === id) return n.bookmarkCount;
        const found = findNode(n.children);
        if (found >= 0) return found;
      }
      return 0;
    }
    return findNode(tree);
  }

  // 子孫フォルダーID一覧を BFS で列挙（folderId 自身は含まない）
  const descendantFolderIds = (() => {
    const ids = new Set<string>();
    const queue = [folderId];
    while (queue.length) {
      const cur = queue.shift()!;
      for (const f of folders) {
        if (f.parentId === cur) {
          ids.add(f.id);
          queue.push(f.id);
        }
      }
    }
    return ids;
  })();

  const sortFn = (a: import("@/shared/types").Bookmark, b: import("@/shared/types").Bookmark) =>
    sortKey === "title" ? a.title.localeCompare(b.title, "ja")
    : sortKey === "visitCount" ? b.visitCount - a.visitCount
    : b.savedAt - a.savedAt;

  const directBookmarks = bookmarks
    .filter((b) => b.folderId === folderId)
    .sort(sortFn);

  // 子孫フォルダーに属するブックマーク（明示的に階層から算出）
  const descendantBookmarks = bookmarks
    .filter((b) => descendantFolderIds.has(b.folderId))
    .sort(sortFn);

  async function handleDelete(id: string) {
    const response = (await chrome.runtime.sendMessage({
      type: "DELETE_BOOKMARK",
      id,
    })) as MessageResponse;
    if (response.success) onRefresh();
  }

  function startEditName() {
    setNameValue(folder.name);
    setEditingName(true);
    setTimeout(() => nameInputRef.current?.focus(), 30);
  }

  async function commitEditName() {
    const v = nameValue.trim();
    if (v && v !== folder.name) {
      await chrome.runtime.sendMessage({ type: "RENAME_FOLDER", id: folderId, name: v });
      onRefresh();
    }
    setEditingName(false);
  }

  async function handleDropToFolder(e: React.DragEvent, targetFolderId: string) {
    e.preventDefault();
    setDragOverFolderId(null);
    const bookmarkId = e.dataTransfer.getData("text/plain");
    const type = e.dataTransfer.getData("application/x-clickbook-type");
    if (!bookmarkId || type !== "bookmark") return;
    await chrome.runtime.sendMessage({ type: "MOVE_BOOKMARK", id: bookmarkId, folderId: targetFolderId });
    onRefresh();
  }

  async function handleCreateSubFolder() {
    const name = newSubFolderName.trim();
    if (!name) return;
    await chrome.runtime.sendMessage({ type: "CREATE_FOLDER", name, parentId: folderId, icon: "📁" });
    setNewSubFolderName("");
    setShowSubFolderInput(false);
    onRefresh();
  }

  const isEmpty = bookmarks.length === 0 && childFolders.length === 0;

  return (
    <div className="bg-white dark:bg-surface-800 rounded-2xl border border-gray-100 dark:border-surface-700 shadow-sm dark:shadow-none p-6 pb-8">
      {showAddModal && (
        <EditModal
          mode="add"
          folders={folders}
          defaultFolderId={folderId}
          onSaved={() => { setShowAddModal(false); onRefresh(); }}
          onDeleted={() => setShowAddModal(false)}
          onClose={() => setShowAddModal(false)}
        />
      )}
      {editingBookmark && (
        <EditModal
          mode="edit"
          bookmark={editingBookmark}
          folders={folders}
          onSaved={() => { setEditingBookmark(null); onRefresh(); }}
          onDeleted={() => { setEditingBookmark(null); onRefresh(); }}
          onClose={() => setEditingBookmark(null)}
        />
      )}
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-gray-400 hover:text-indigo-400 transition-colors text-sm"
        >
          <ChevronLeft size={18} />
          <span>{t("back")}</span>
        </button>
        <span className="text-gray-400 dark:text-gray-600">/</span>
        {editingName ? (
          <div className="flex items-center gap-1.5">
            <input
              ref={nameInputRef}
              value={nameValue}
              onChange={e => setNameValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") commitEditName();
                if (e.key === "Escape") setEditingName(false);
              }}
              onBlur={commitEditName}
              className="text-xl font-bold bg-transparent border-b-2 border-indigo-500 text-gray-800 dark:text-gray-100 outline-none min-w-0 w-48"
            />
            <button onMouseDown={e => { e.preventDefault(); commitEditName(); }} className="text-emerald-500 hover:text-emerald-400">
              <Check size={16} />
            </button>
            <button onMouseDown={e => { e.preventDefault(); setEditingName(false); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <X size={16} />
            </button>
          </div>
        ) : (
          <h2
            className="text-xl font-bold text-gray-800 dark:text-gray-100 cursor-text select-none"
            onDoubleClick={startEditName}
            title="ダブルクリックで名前を編集"
          >
            {folder.name}
          </h2>
        )}
        <span className="text-sm text-gray-500">{t("itemCount", { n: bookmarks.length })}</span>

        {/* 右側コントロール群 */}
        <div className="ml-auto flex items-center gap-2">
          {/* ソートコントロール */}
          {bookmarks.length > 1 && (
            <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-surface-700 rounded-lg p-0.5">
              {(["savedAt", "title", "visitCount"] as const).map((key) => (
                <button
                  key={key}
                  onClick={() => setSortKey(key)}
                  className={`text-[10px] px-2 py-1 rounded-md font-medium transition-colors ${
                    sortKey === key
                      ? "bg-white dark:bg-surface-600 text-indigo-600 dark:text-indigo-300 shadow-sm"
                      : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  }`}
                >
                  {key === "savedAt" ? t("sortDate") : key === "title" ? t("sortName") : t("sortVisits")}
                </button>
              ))}
            </div>
          )}

          {/* サブフォルダー作成 */}
          <button
            onClick={() => {
              setShowSubFolderInput(v => !v);
              setTimeout(() => subFolderInputRef.current?.focus(), 30);
            }}
            title={t("createSubfolderTooltip")}
            className={`p-1.5 rounded-lg transition-colors ${
              showSubFolderInput
                ? "text-indigo-500 bg-indigo-50 dark:bg-indigo-500/15"
                : "text-gray-400 dark:text-gray-600 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-surface-700"
            }`}
          >
            <FolderPlus size={17} />
          </button>
        </div>
      </div>

      {/* サブフォルダー作成入力行 */}
      {showSubFolderInput && (
        <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 rounded-xl">
          <FolderPlus size={14} className="text-indigo-400 shrink-0" />
          <input
            ref={subFolderInputRef}
            value={newSubFolderName}
            onChange={e => setNewSubFolderName(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") handleCreateSubFolder();
              if (e.key === "Escape") { setShowSubFolderInput(false); setNewSubFolderName(""); }
            }}
            placeholder={t("subfolderNamePlaceholder")}
            className="flex-1 text-sm bg-transparent outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600"
          />
          <button
            onClick={handleCreateSubFolder}
            disabled={!newSubFolderName.trim()}
            className="text-emerald-500 hover:text-emerald-400 disabled:opacity-40 transition-colors"
          >
            <Check size={15} />
          </button>
          <button
            onClick={() => { setShowSubFolderInput(false); setNewSubFolderName(""); }}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* フォルダー移動トレイ */}
      {otherFolders.length > 0 && (
        <div className="mb-6 p-3 rounded-xl bg-gray-50 dark:bg-surface-800/60 border border-gray-200 dark:border-surface-700">
          <div className="flex items-center gap-1.5 mb-2">
            <MoveRight size={11} className="text-gray-400" />
            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">
              {t("moveTray")}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {otherFolders.map((f) => (
              <div
                key={f.id}
                onDragOver={(e) => { e.preventDefault(); setDragOverFolderId(f.id); }}
                onDragLeave={() => setDragOverFolderId(null)}
                onDrop={(e) => handleDropToFolder(e, f.id)}
                onClick={() => onSelectFolder(f.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs cursor-pointer select-none transition-all duration-150 ${
                  dragOverFolderId === f.id
                    ? "border-indigo-400 bg-indigo-500/20 text-indigo-300 scale-105 shadow-lg"
                    : "border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-gray-500 dark:text-gray-400 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:text-indigo-500 dark:hover:text-indigo-300"
                }`}
              >
                {isEmoji(f.icon) ? (
                  <span className="text-xs leading-none">{f.icon}</span>
                ) : (
                  <span className={`w-2 h-2 rounded-full shrink-0 ${COLOR_DOT[f.color] ?? "bg-gray-400"}`} />
                )}
                <span className="truncate max-w-[100px]">{f.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400 dark:text-gray-600">
          <span className="text-4xl mb-3">📭</span>
          <p className="text-sm mb-5">{t("folderEmpty")}</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors"
          >
            <Plus size={13} />
            {t("addSite")}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* サブフォルダー */}
          {childFolders.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-600 font-semibold">
                  {t("subfolders")}
                </h3>
                <button
                  onClick={() => setSubFoldersCollapsed(v => !v)}
                  title={subFoldersCollapsed ? t("expand") : t("collapse")}
                  className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-600 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                >
                  {subFoldersCollapsed ? <ChevronsDown size={13} /> : <ChevronsUp size={13} />}
                  <span>{subFoldersCollapsed ? t("expand") : t("collapse")}</span>
                </button>
              </div>
              {!subFoldersCollapsed && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {childFolders.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => onSelectFolder(f.id)}
                      className="flex flex-col items-center gap-1.5 p-3 bg-gray-50 dark:bg-surface-700 hover:bg-gray-100 dark:hover:bg-surface-600 border border-gray-200 dark:border-surface-600 hover:border-indigo-300 dark:hover:border-indigo-500/30 rounded-xl transition-all shadow-sm dark:shadow-none"
                    >
                      <FolderOpen size={20} className={COLOR_TEXT[f.color] ?? "text-gray-400"} />
                      <span className="text-[11px] text-gray-600 dark:text-gray-400 truncate w-full text-center">
                        {f.name}
                      </span>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {getCount(f.id)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* このフォルダー直下のブックマーク */}
          {directBookmarks.length > 0 && (
            <section>
              {childFolders.length > 0 && (
                <h3 className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-600 font-semibold mb-3">
                  {t("folderBookmarks")}
                </h3>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {directBookmarks.map((b) => (
                  <BookmarkCard key={b.id} bookmark={b} memo={memos[b.id]} onDelete={handleDelete} onEdit={setEditingBookmark} onMemoChange={onRefresh} />
                ))}
              </div>
            </section>
          )}

          {/* 子孫フォルダーのブックマーク */}
          {childFolders.length > 0 && descendantBookmarks.length > 0 && (
            <section>
              <h3 className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-600 font-semibold mb-3">
                {t("subfolderBookmarks")}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {descendantBookmarks.map((b) => (
                  <BookmarkCard key={b.id} bookmark={b} memo={memos[b.id]} onDelete={handleDelete} onEdit={setEditingBookmark} onMemoChange={onRefresh} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

