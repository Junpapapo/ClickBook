import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronLeft, FolderOpen, FolderPlus, MoveRight, Check, X, Plus, ChevronsUp, ChevronsDown, Pencil, Trash2, Sparkles, Shield, Layers } from "lucide-react";
import BookmarkCard from "@/components/BookmarkCard";
import { EditModal } from "@/components/BookmarkEditPanel";
import { getFolderById, buildFolderTree, DEFAULT_FOLDER_ID, getLocalizedFolderName } from "@/shared/categories";
import { FolderIcon } from "@/components/DynamicIcon";
import { IconPicker } from "@/components/IconPicker";
import type { Bookmark, Folder, MemoMap, MessageResponse } from "@/shared/types";
import { FOLDER_COLOR_DOT as COLOR_DOT, FOLDER_COLOR_TEXT as COLOR_TEXT } from "@/shared/colors";
import { useLang } from "@/shared/LanguageContext";
import { useTheme } from "@/shared/ThemeContext";
import { useDialog } from "@/shared/useDialog";
import { sendMsg } from "@/shared/utils";

// ── 모던 대시보드 공통 컴포넌트 ──────────────────────────────
import WallpaperBackground from "@/components/dashboard/WallpaperBackground";
import ModernHeroHeader from "@/components/dashboard/ModernHeroHeader";

interface Props {
  bookmarks: Bookmark[];
  folders: Folder[];
  folderId: string;
  memos: MemoMap;
  onBack: () => void;
  onSelectFolder: (id: string) => void;
  onRefresh: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onOpenSettings?: () => void;
  onOpenGuide?: () => void;
}

export default function FolderView({
  bookmarks,
  folders,
  folderId,
  memos,
  onBack,
  onSelectFolder,
  onRefresh,
  searchQuery = "",
  onSearchChange,
  onOpenSettings,
  onOpenGuide,
}: Props) {
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const { showConfirm, DialogEl } = useDialog();

  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [sortKey, setSortKey] = useState<"savedAt" | "title" | "visitCount">("savedAt");
  const [subFoldersCollapsed, setSubFoldersCollapsed] = useState(false);
  const [showSubFolderInput, setShowSubFolderInput] = useState(false);
  const [newSubFolderName, setNewSubFolderName] = useState("");
  const [aiAvailable, setAiAvailable] = useState(false);
  const [isOrganizingOther, setIsOrganizingOther] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const subFolderInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function checkAI() {
      try {
        if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
          const result = await chrome.storage.local.get("clickbook_ai_enabled");
          setAiAvailable(result.clickbook_ai_enabled === true);
        }
      } catch (e) {
        setAiAvailable(false);
      }
    }
    checkAI();

    const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.clickbook_ai_enabled) {
        setAiAvailable(changes.clickbook_ai_enabled.newValue === true);
      }
    };
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener(listener);
      return () => chrome.storage.onChanged.removeListener(listener);
    }
  }, []);

  useEffect(() => {
    if (editingName) {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }
  }, [editingName]);

  useEffect(() => {
    if (showSubFolderInput) {
      subFolderInputRef.current?.focus();
    }
  }, [showSubFolderInput]);

  useEffect(() => {
    if (renamingFolderId) {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }
  }, [renamingFolderId]);

  const folder = getFolderById(folders, folderId);
  if (!folder) return null;

  async function handleDeleteFolder(id: string, _name: string) {
    const count = getCount(id);
    const msg =
      count > 0
        ? t("folderDeleteWithBookmarks", { n: count })
        : t("folderDeleteConfirm");
    if (!(await showConfirm(msg, t("deleteTooltip"), t("cancelBtn"), "warn"))) return;
    await sendMsg({ type: "DELETE_FOLDER", id });
    onRefresh();
  }

  function startRenameSubFolder(f: Folder) {
    setRenameValue(f.name);
    setRenamingFolderId(f.id);
  }

  async function commitRenameSubFolder(id: string, original: string) {
    const v = renameValue.trim();
    if (v && v !== original) {
      await sendMsg({ type: "RENAME_FOLDER", id, name: v });
      onRefresh();
    }
    setRenamingFolderId(null);
  }

  // 직접 자식 폴더 목록
  const childFolders = useMemo(() => {
    return folders
      .filter((f) => f.parentId === folderId)
      .sort((a, b) => a.order - b.order);
  }, [folders, folderId]);

  // 이동 대상 후보 폴더 목록
  const otherFolders = useMemo(() => {
    return folders
      .filter((f) => f.id !== folderId)
      .sort((a, b) => {
        if (a.id === "other") return -1;
        if (b.id === "other") return 1;
        return a.order - b.order;
      });
  }, [folders, folderId]);

  const { folderCumulativeCounts } = useMemo(() => {
    const counts = bookmarks.reduce<Record<string, number>>((acc, b) => {
      acc[b.folderId] = (acc[b.folderId] ?? 0) + 1;
      return acc;
    }, {});
    const tNodes = buildFolderTree(folders, counts);

    const cumulativeCounts: Record<string, number> = {};
    function traverse(nodes: typeof tNodes) {
      for (const n of nodes) {
        cumulativeCounts[n.folder.id] = n.bookmarkCount;
        traverse(n.children);
      }
    }
    traverse(tNodes);

    return { folderCumulativeCounts: cumulativeCounts };
  }, [bookmarks, folders]);

  const getCount = (id: string) => folderCumulativeCounts[id] ?? 0;

  // 자손 폴더 ID 목록 (BFS)
  const descendantFolderIds = useMemo(() => {
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
  }, [folders, folderId]);

  const jaCollator = useMemo(() => new Intl.Collator("ja"), []);

  const { directBookmarks, descendantBookmarks } = useMemo(() => {
    const sortFn = (a: Bookmark, b: Bookmark) =>
      sortKey === "title"
        ? jaCollator.compare(a.title, b.title)
        : sortKey === "visitCount"
        ? b.visitCount - a.visitCount
        : b.savedAt - a.savedAt;

    const direct = bookmarks
      .filter((b) => b.folderId === folderId)
      .sort(sortFn);

    const descendant = bookmarks
      .filter((b) => descendantFolderIds.has(b.folderId))
      .sort(sortFn);

    return { directBookmarks: direct, descendantBookmarks: descendant };
  }, [bookmarks, folderId, descendantFolderIds, sortKey, jaCollator]);

  async function handleDelete(id: string) {
    const response = (await sendMsg({
      type: "DELETE_BOOKMARK",
      id,
    })) as MessageResponse;
    if (response && response.success) onRefresh();
  }

  function startEditName() {
    setNameValue(folder.name);
    setEditingName(true);
  }

  async function commitEditName() {
    const v = nameValue.trim();
    if (v && v !== folder.name) {
      await sendMsg({ type: "RENAME_FOLDER", id: folderId, name: v, icon: folder.icon });
      onRefresh();
    }
    setEditingName(false);
  }

  async function handleIconChange(ic: string) {
    if (ic === folder.icon) return;
    await sendMsg({ type: "RENAME_FOLDER", id: folderId, name: folder.name, icon: ic });
    onRefresh();
    setShowIconPicker(false);
  }

  async function handleDropToFolder(e: React.DragEvent, targetFolderId: string) {
    e.preventDefault();
    setDragOverFolderId(null);
    const bookmarkId = e.dataTransfer.getData("text/plain");
    const type = e.dataTransfer.getData("application/x-clickbook-type");
    if (!bookmarkId || type !== "bookmark") return;

    const bookmark = bookmarks.find((b) => b.id === bookmarkId);
    if (bookmark && bookmark.folderId === targetFolderId) {
      return;
    }

    await sendMsg({ type: "MOVE_BOOKMARK", id: bookmarkId, folderId: targetFolderId });
    onRefresh();
  }

  async function handleCreateSubFolder() {
    const name = newSubFolderName.trim();
    if (!name) return;
    await sendMsg({ type: "CREATE_FOLDER", name, parentId: folderId, icon: "📁" });
    setNewSubFolderName("");
    setShowSubFolderInput(false);
    onRefresh();
  }

  async function handleAIOrganizeOther() {
    if (!aiAvailable || isOrganizingOther || directBookmarks.length === 0) return;
    setIsOrganizingOther(true);
    let resolved = false;
    try {
      if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.connect) {
        const port = chrome.runtime.connect({ name: "ai-reorganize-other" });
        port.onMessage.addListener((msg) => {
          if (msg.type === "running") {
            // progress
          } else if (msg.type === "done") {
            resolved = true;
            setIsOrganizingOther(false);
            port.disconnect();
            onRefresh();
          } else if (msg.type === "error") {
            resolved = true;
            setIsOrganizingOther(false);
            port.disconnect();
          }
        });
        port.onDisconnect.addListener(() => {
          if (!resolved) {
            setIsOrganizingOther(false);
            onRefresh();
          }
        });
      }
    } catch (err) {
      setIsOrganizingOther(false);
    }
  }

  const isEmpty = directBookmarks.length === 0 && childFolders.length === 0;

  return (
    <WallpaperBackground isDarkMode={isDarkMode}>
      <div className="flex flex-col gap-5 max-w-[1440px] w-full mx-auto pb-12 px-2 sm:px-6 select-none">
        {DialogEl}

        {/* ── 1. 상단 히어로 & 통합 검색창 & 유틸리티 툴바 (대시보드와 100% 동일) ── */}
        <ModernHeroHeader
          searchQuery={searchQuery}
          onSearchChange={(q) => onSearchChange?.(q)}
          onSearchSubmit={(q) => {
            if (q.trim()) onSearchChange?.(q);
          }}
          onOpenSettings={onOpenSettings}
          onOpenGuide={onOpenGuide}
        />

        {showAddModal && (
          <EditModal
            mode="add"
            folders={folders}
            defaultFolderId={folderId}
            onSaved={() => {
              setShowAddModal(false);
              onRefresh();
            }}
            onDeleted={() => setShowAddModal(false)}
            onClose={() => setShowAddModal(false)}
          />
        )}
        {editingBookmark && (
          <EditModal
            mode="edit"
            bookmark={editingBookmark}
            folders={folders}
            onSaved={() => {
              setEditingBookmark(null);
              onRefresh();
            }}
            onDeleted={() => {
              setEditingBookmark(null);
              onRefresh();
            }}
            onClose={() => setEditingBookmark(null)}
          />
        )}

        {/* ── 2. 메인 폴더 작업 캔버스 (글래스모피즘) ── */}
        <div className="bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-white/10 shadow-figma-lg p-4 sm:p-6">
          {/* ── 폴더 헤더 & 액션 ── */}
          <div className="flex items-center gap-2.5 mb-5 flex-wrap select-none pb-3 border-b border-slate-200/60 dark:border-slate-800/80">
            <button
              onClick={onBack}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-700 text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 border border-slate-200/60 dark:border-slate-700/60 transition-all text-xs font-bold shadow-2xs cursor-pointer"
            >
              <ChevronLeft size={16} />
              <span>{t("back")}</span>
            </button>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <div className="relative flex items-center">
              <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                title="Change Icon"
              >
                <FolderIcon iconName={folder.icon || "📁"} size={22} className="text-[22px] text-slate-700 dark:text-slate-200" />
              </button>
              {showIconPicker && (
                <IconPicker onSelect={handleIconChange} onClose={() => setShowIconPicker(false)} className="left-0 mt-2 z-50" />
              )}
            </div>
            {editingName ? (
              <div className="flex items-center gap-1.5">
                <input
                  ref={nameInputRef}
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitEditName();
                    if (e.key === "Escape") setEditingName(false);
                  }}
                  onBlur={commitEditName}
                  className="text-lg font-bold bg-transparent border-b-2 border-indigo-500 text-slate-800 dark:text-slate-100 outline-none min-w-0 w-48"
                />
                <button onMouseDown={(e) => { e.preventDefault(); commitEditName(); }} className="text-emerald-500 hover:text-emerald-400 cursor-pointer">
                  <Check size={15} />
                </button>
                <button onMouseDown={(e) => { e.preventDefault(); setEditingName(false); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                  <X size={15} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2
                  className="text-lg font-bold text-slate-800 dark:text-slate-100 cursor-text select-none tracking-tight"
                  onDoubleClick={startEditName}
                  title={t("doubleClickEditName")}
                >
                  {getLocalizedFolderName(folder, lang)}
                </h2>
                {folder?.secure && (
                  <div
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 shadow-2xs cursor-help"
                    title={t("secureFolderTooltip")}
                  >
                    <Shield size={10} className="fill-emerald-500/15" />
                    <span>{t("secureFolder")}</span>
                  </div>
                )}
              </div>
            )}
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">{t("itemCount", { n: directBookmarks.length })}</span>

            {/* ── 우측 액션 버튼들 ── */}
            <div className="ml-auto flex items-center gap-2">
              {bookmarks.length > 1 && (
                <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl p-0.5 border border-slate-200/60 dark:border-slate-700/60">
                  {(["savedAt", "title", "visitCount"] as const).map((key) => (
                    <button
                      key={key}
                      onClick={() => setSortKey(key)}
                      className={`text-[10.5px] px-2 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                        sortKey === key
                          ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold"
                          : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      }`}
                    >
                      {key === "savedAt" ? t("sortDate") : key === "title" ? t("sortName") : t("sortVisits")}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => sendMsg({ type: "OPEN_FOLDER_AS_TAB_GROUP", folderId })}
                title={t("openAsTabGroup")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/90 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 hover:border-indigo-400 text-indigo-600 dark:text-indigo-400 transition-all shadow-2xs cursor-pointer"
              >
                <Layers size={13} />
                <span>{t("openAsTabGroup")}</span>
              </button>

              {folderId !== DEFAULT_FOLDER_ID && (
                <button
                  onClick={() => sendMsg({ type: "TOGGLE_FOLDER_SECURE", id: folderId }).then(() => onRefresh())}
                  title={folder?.secure ? t("secureToggleOff") : t("secureToggleOn")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all shadow-2xs cursor-pointer ${
                    folder?.secure
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50 hover:bg-emerald-100/50"
                      : "bg-white text-slate-700 border-slate-200/90 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-600 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-emerald-950/20 dark:hover:border-emerald-800/40 dark:hover:text-emerald-400"
                  }`}
                >
                  <Shield size={13} className={folder?.secure ? "text-emerald-500 fill-emerald-500/15" : "text-emerald-500"} />
                  <span>{t("secureFolder")}</span>
                </button>
              )}

              {folderId === DEFAULT_FOLDER_ID && (
                <button
                  onClick={handleAIOrganizeOther}
                  disabled={isOrganizingOther || directBookmarks.length === 0}
                  title={t("aiOrganizeTooltip")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all border shadow-2xs cursor-pointer ${
                    isOrganizingOther
                      ? "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800/50"
                      : directBookmarks.length === 0
                      ? "opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700"
                      : "bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50 hover:border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800"
                  }`}
                >
                  <Sparkles size={13} className={isOrganizingOther ? "animate-pulse text-indigo-500" : "text-indigo-500"} />
                  {isOrganizingOther ? t("aiOrganizing") : t("aiOrganize")}
                </button>
              )}

              <button
                onClick={() => setShowSubFolderInput((v) => !v)}
                title={t("createSubfolderTooltip")}
                className={`p-1.5 rounded-xl transition-all border shadow-2xs cursor-pointer ${
                  showSubFolderInput
                    ? "text-indigo-600 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-400"
                    : "text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border-slate-200/90 dark:border-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300"
                }`}
              >
                <FolderPlus size={15} />
              </button>
            </div>
          </div>

          {/* ── 서브폴더 생성 인풋 ── */}
          {showSubFolderInput && (
            <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 rounded-2xl">
              <FolderPlus size={14} className="text-indigo-500 shrink-0" />
              <input
                ref={subFolderInputRef}
                value={newSubFolderName}
                onChange={(e) => setNewSubFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateSubFolder();
                  if (e.key === "Escape") {
                    setShowSubFolderInput(false);
                    setNewSubFolderName("");
                  }
                }}
                placeholder={t("subfolderNamePlaceholder")}
                className="flex-1 text-sm bg-transparent outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400"
              />
              <button
                onClick={handleCreateSubFolder}
                disabled={!newSubFolderName.trim()}
                className="text-emerald-500 hover:text-emerald-400 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <Check size={15} />
              </button>
              <button
                onClick={() => {
                  setShowSubFolderInput(false);
                  setNewSubFolderName("");
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {/* ── 폴더 이동 트레이 (MOVE TO ANOTHER FOLDER) ── */}
          {otherFolders.length > 0 && (
            <div className="mb-6 p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800/60">
              <div className="flex items-center gap-1.5 mb-2 px-1">
                <MoveRight size={11} className="text-slate-400" />
                <span className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold">
                  {t("moveTray")}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {otherFolders.map((f) => {
                  const isOther = f.id === "other";
                  const isHoverOrDrag = dragOverFolderId === f.id;

                  const baseClasses = isOther
                    ? "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-bold cursor-pointer select-none transition-all duration-150 "
                    : "flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-semibold cursor-pointer select-none transition-all duration-150 ";

                  const stateClasses = isHoverOrDrag
                    ? "border-indigo-500 bg-indigo-500/20 text-indigo-400 scale-105 shadow-md"
                    : isOther
                    ? "border-amber-300 dark:border-amber-500/50 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 hover:border-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 shadow-2xs";

                  return (
                    <div
                      key={f.id}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverFolderId(f.id);
                      }}
                      onDragLeave={() => setDragOverFolderId(null)}
                      onDrop={(e) => handleDropToFolder(e, f.id)}
                      onClick={() => onSelectFolder(f.id)}
                      className={baseClasses + stateClasses}
                    >
                      <FolderIcon
                        iconName={f.icon}
                        size={isOther ? 14 : 12}
                        className={`${isOther ? "text-sm" : "text-xs"} leading-none`}
                        fallbackColorClass={COLOR_DOT[f.color] ?? "bg-slate-400"}
                      />
                      <span className="truncate max-w-[120px]">{getLocalizedFolderName(f, lang)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── 본문 (비어있음 / 서브폴더 & 북마크 카드 그리드) ── */}
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-600">
              <span className="text-4xl mb-3">📭</span>
              <p className="text-sm mb-4 font-medium">{t("folderEmpty")}</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <Plus size={13} />
                <span>{t("addSite")}</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-7">
              {/* 1. 서브폴더 섹션 */}
              {childFolders.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                        {t("subfolders")}
                      </h3>
                      <button
                        onClick={() => setShowSubFolderInput((v) => !v)}
                        title={t("createSubfolderTooltip")}
                        className={`p-1 rounded-lg transition-colors cursor-pointer ${
                          showSubFolderInput
                            ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/15"
                            : "text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        <FolderPlus size={13} />
                      </button>
                    </div>
                    <button
                      onClick={() => setSubFoldersCollapsed((v) => !v)}
                      title={subFoldersCollapsed ? t("expand") : t("collapse")}
                      className="flex items-center gap-1 text-[10.5px] text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer font-medium"
                    >
                      {subFoldersCollapsed ? <ChevronsDown size={13} /> : <ChevronsUp size={13} />}
                      <span>{subFoldersCollapsed ? t("expand") : t("collapse")}</span>
                    </button>
                  </div>

                  {!subFoldersCollapsed && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                      {childFolders.map((f) => {
                        const isRenaming = renamingFolderId === f.id;
                        const isDragOver = dragOverFolderId === f.id;
                        const baseClass =
                          "group relative flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all shadow-2xs cursor-pointer select-none ";
                        const stateClass = isDragOver
                          ? "bg-indigo-50 dark:bg-indigo-900/40 border-2 border-indigo-500 scale-[1.02]"
                          : "bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-400";

                        return (
                          <div
                            key={f.id}
                            className={baseClass + stateClass}
                            onClick={() => {
                              if (!isRenaming) onSelectFolder(f.id);
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              setDragOverFolderId(f.id);
                            }}
                            onDragLeave={() => setDragOverFolderId(null)}
                            onDrop={(e) => handleDropToFolder(e, f.id)}
                          >
                            {f.secure && !isRenaming && (
                              <span className="absolute top-1.5 left-1.5" title={t("secureFolderTooltip")}>
                                <Shield size={10} className="text-emerald-500 fill-emerald-500/20" />
                              </span>
                            )}
                            {!isRenaming && (
                              <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startRenameSubFolder(f);
                                  }}
                                  className="p-1 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all cursor-pointer"
                                  title={t("renameTooltip")}
                                >
                                  <Pencil size={10} className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400" />
                                </button>
                                {f.id !== DEFAULT_FOLDER_ID && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteFolder(f.id, f.name);
                                    }}
                                    className="p-1 rounded-md hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all cursor-pointer"
                                    title={t("deleteTooltip")}
                                  >
                                    <Trash2 size={10} className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400" />
                                  </button>
                                )}
                              </div>
                            )}
                            <FolderOpen size={20} className={COLOR_TEXT[f.color] ?? "text-slate-400"} />
                            {isRenaming ? (
                              <div className="flex flex-col items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                                <input
                                  ref={renameInputRef}
                                  value={renameValue}
                                  onChange={(e) => setRenameValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") commitRenameSubFolder(f.id, f.name);
                                    if (e.key === "Escape") setRenamingFolderId(null);
                                  }}
                                  onBlur={() => commitRenameSubFolder(f.id, f.name)}
                                  className="w-full text-center text-[11px] bg-transparent border-b border-indigo-500 text-slate-800 dark:text-slate-100 outline-none"
                                />
                                <div className="flex items-center gap-1">
                                  <button
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      commitRenameSubFolder(f.id, f.name);
                                    }}
                                    className="text-emerald-500 hover:text-emerald-400"
                                  >
                                    <Check size={12} />
                                  </button>
                                  <button
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      setRenamingFolderId(null);
                                    }}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate w-full text-center">
                                  {getLocalizedFolderName(f, lang)}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                                  {getCount(f.id)}
                                </span>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              )}

              {/* 2. 현재 폴더 직하의 북마크 카드 그리드 */}
              {directBookmarks.length > 0 && (
                <section>
                  {childFolders.length > 0 && (
                    <h3 className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold mb-3 px-1">
                      {t("folderBookmarks")}
                    </h3>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
                    {directBookmarks.map((b) => (
                      <BookmarkCard
                        key={b.id}
                        bookmark={b}
                        memo={memos[b.id]}
                        onDelete={handleDelete}
                        onEdit={setEditingBookmark}
                        onMemoChange={onRefresh}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* 3. 자손 폴더의 북마크 카드 그리드 */}
              {childFolders.length > 0 && descendantBookmarks.length > 0 && (
                <section>
                  <h3 className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold mb-3 px-1">
                    {t("subfolderBookmarks")}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
                    {descendantBookmarks.map((b) => {
                      const subFolder = folders.find((f) => f.id === b.folderId);
                      const subFolderName = subFolder ? getLocalizedFolderName(subFolder, lang) : undefined;
                      return (
                        <BookmarkCard
                          key={b.id}
                          bookmark={b}
                          memo={memos[b.id]}
                          folderName={subFolderName}
                          onDelete={handleDelete}
                          onEdit={setEditingBookmark}
                          onMemoChange={onRefresh}
                        />
                      );
                    })}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </WallpaperBackground>
  );
}
