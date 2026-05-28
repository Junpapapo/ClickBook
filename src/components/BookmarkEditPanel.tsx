import { useState } from "react";
import { Pencil, Trash2, Plus, X, Search, Save, ExternalLink, FolderOpen, Copy, Check } from "lucide-react";
import type { Bookmark, Folder, MessageResponse } from "@/shared/types";
import { useDialog } from "@/shared/useDialog";
import { useLang } from "@/shared/LanguageContext";
import { getLocalizedFolderName } from "@/shared/categories";

interface Props {
  bookmarks: Bookmark[];
  folders: Folder[];
  onRefresh: () => void;
  onClose: () => void;
}

type ModalMode = "edit" | "add";

type Status = { type: "ok" | "err" | "warn"; text: string } | null;

function isEmoji(s: string) { return !!s && !/^[A-Za-z0-9_]+$/.test(s); }

function folderLabel(f: Folder, lang: string) {
  return (isEmoji(f.icon) ? f.icon + " " : "") + getLocalizedFolderName(f, lang);
}

// ── 編集/追加モーダル ─────────────────────────────────────────
export interface ModalProps {
  mode: ModalMode;
  bookmark?: Bookmark;
  folders: Folder[];
  defaultFolderId?: string;
  onSaved: () => void;
  onDeleted: () => void;
  onClose: () => void;
}

export function EditModal({ mode, bookmark, folders, defaultFolderId, onSaved, onDeleted, onClose }: ModalProps) {
  const { showConfirm, DialogEl } = useDialog();
  const { t, lang } = useLang();

  const [title, setTitle] = useState(bookmark?.title ?? "");
  const [url, setUrl] = useState(bookmark?.url ?? "");
  const [folderId, setFolderId] = useState(bookmark?.folderId ?? defaultFolderId ?? folders[0]?.id ?? "");
  const [tags, setTags] = useState<string[]>(bookmark?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [copied, setCopied] = useState(false);

  function flash(type: Status["type"], text: string) {
    setStatus({ type, text });
    setTimeout(() => setStatus(null), 3000);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }

  const addTag = () => {
    const val = tagInput.trim().toLowerCase();
    if (val && !tags.includes(val)) {
      setTags([...tags, val]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  async function handleSave() {
    const trimUrl = url.trim();
    const trimTitle = title.trim() || trimUrl;
    if (!trimUrl) { flash("err", t("urlRequired")); return; }
    if (!trimUrl.startsWith("http://") && !trimUrl.startsWith("https://")) {
      flash("err", t("urlInvalid")); return;
    }
    setSaving(true);
    let res: MessageResponse;
    if (mode === "edit" && bookmark) {
      res = await chrome.runtime.sendMessage({
        type: "UPDATE_BOOKMARK",
        id: bookmark.id,
        title: trimTitle,
        url: trimUrl,
        folderId,
        tags,
      }) as MessageResponse;
    } else {
      res = await chrome.runtime.sendMessage({
        type: "ADD_BOOKMARK",
        url: trimUrl,
        title: trimTitle,
        folderId,
      }) as MessageResponse;
    }
    setSaving(false);
    if (res.success) {
      onSaved();
    } else if (res.isDuplicate) {
      flash("warn", t("urlDuplicate"));
    } else {
      flash("err", t("saveFailed"));
    }
  }

  async function handleDelete() {
    if (!bookmark) return;
    if (!await showConfirm(t("deleteConfirm", { title: bookmark.title }), t("deleteTooltip"))) return;
    await chrome.runtime.sendMessage({ type: "DELETE_BOOKMARK", id: bookmark.id });
    onDeleted();
  }

  const currentFolder = folders.find(f => f.id === folderId);

  return (
    <>
      {DialogEl}
      {/* バックドロップ */}
      <div
        className="fixed inset-0 z-[9000] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* モーダル本体 */}
      <div className="fixed inset-0 z-[9001] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-xl bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-600 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* ヘッダー */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-surface-700">
            <div className="flex items-center gap-2.5">
              {mode === "edit" ? (
                <>
                  {bookmark && (
                    <img
                      src={bookmark.favicon}
                      alt=""
                      width={20}
                      height={20}
                      className="rounded shrink-0"
                      onError={e => (e.currentTarget.style.display = "none")}
                    />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{t("editSiteTitle")}</p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate max-w-[300px]">{bookmark?.domain}</p>
                  </div>
                </>
              ) : (
                <>
                  <Plus size={18} className="text-indigo-400" />
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{t("addSiteTitle")}</p>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {mode === "edit" && bookmark && (
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-gray-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                  title={t("editOpenTooltip")}
                >
                  <ExternalLink size={15} />
                </a>
              )}
              <button
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* フォーム */}
          <div className="px-6 py-5 space-y-4">
            {/* ステータス */}
            {status && (
              <div className={`px-3 py-2 rounded-lg text-sm ${
                status.type === "ok" ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400" :
                status.type === "warn" ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400" :
                "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400"
              }`}>
                {status.text}
              </div>
            )}

            {/* URL */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                {t("urlLabel")} {mode === "add" && <span className="text-rose-500">*</span>}
              </label>
              <div className="relative group/url">
                <input
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleSave(); }}
                  placeholder="https://..."
                  autoFocus={mode === "add"}
                  className="w-full text-sm bg-gray-50 dark:bg-surface-800 border border-gray-300 dark:border-surface-600 rounded-lg pl-3 pr-10 py-2.5 text-gray-800 dark:text-gray-100 outline-none focus:border-indigo-500 transition-colors placeholder-gray-400 dark:placeholder-gray-600"
                />
                <button
                  onClick={handleCopy}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-gray-100 dark:hover:bg-surface-700 rounded-md transition-colors"
                  title={t("popupUrlCopySection")}
                >
                  {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            {/* 타이틀 */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{t("titleLabel")}</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                autoFocus={mode === "edit"}
                placeholder={mode === "add" ? t("titleOptionalPlaceholder") : ""}
                className="w-full text-sm bg-gray-50 dark:bg-surface-800 border border-gray-300 dark:border-surface-600 rounded-lg px-3 py-2.5 text-gray-800 dark:text-gray-100 outline-none focus:border-indigo-500 transition-colors placeholder-gray-450 dark:placeholder-gray-600"
              />
            </div>

            {/* 태그 */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{t("tagsLabel") || "Tags"}</label>
              <div className="flex flex-wrap gap-1.5 p-2.5 bg-gray-50 dark:bg-surface-800 border border-gray-300 dark:border-surface-600 rounded-lg min-h-[42px]">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium rounded border border-emerald-100 dark:border-emerald-500/20"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-emerald-800 dark:hover:text-emerald-200 transition-colors"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    } else if (e.key === "," || e.key === " ") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  onBlur={addTag}
                  placeholder={tags.length === 0 ? "Add tags..." : ""}
                  className="flex-1 min-w-[60px] bg-transparent text-sm text-gray-800 dark:text-gray-100 outline-none placeholder-gray-450 dark:placeholder-gray-600"
                />
              </div>
            </div>

            {/* フォルダー */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{t("folderLabel")}</label>
              <div className="relative">
                <select
                  value={folderId}
                  onChange={e => setFolderId(e.target.value)}
                  className="w-full text-sm bg-gray-50 dark:bg-surface-800 border border-gray-300 dark:border-surface-600 rounded-lg px-3 py-2.5 text-gray-800 dark:text-gray-100 outline-none focus:border-indigo-500 transition-colors appearance-none"
                >
                  {folders.map(f => (
                    <option key={f.id} value={f.id}>{folderLabel(f, lang)}</option>
                  ))}
                </select>
                <FolderOpen size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
              </div>
              {currentFolder && (
                <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-600">
                  Current: {folderLabel(currentFolder, lang)}
                </p>
              )}
            </div>
          </div>

          {/* フッター */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-surface-700 flex items-center justify-between">
            {mode === "edit" ? (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-rose-400 hover:bg-rose-900/30 transition-colors"
              >
                <Trash2 size={14} />
                Delete
              </button>
            ) : <div />}
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-gray-100 dark:bg-surface-700 hover:bg-gray-200 dark:hover:bg-surface-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <Save size={14} />
                {saving ? "Saving..." : mode === "add" ? "Add" : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── サイドパネル（一覧＋検索） ────────────────────────────────
export default function BookmarkEditPanel({ bookmarks, folders, onRefresh, onClose }: Props) {
  const { t } = useLang();
  const [query, setQuery] = useState("");
  const [modalMode, setModalMode] = useState<ModalMode>("edit");
  const [modalBookmark, setModalBookmark] = useState<Bookmark | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [lastMsg, setLastMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const filtered = query
    ? bookmarks.filter(b =>
        b.title.toLowerCase().includes(query.toLowerCase()) ||
        b.domain.toLowerCase().includes(query.toLowerCase()) ||
        b.url.toLowerCase().includes(query.toLowerCase())
      )
    : bookmarks;

  function openEdit(b: Bookmark) {
    setModalMode("edit");
    setModalBookmark(b);
    setModalOpen(true);
  }

  function openAdd() {
    setModalMode("add");
    setModalBookmark(undefined);
    setModalOpen(true);
  }

  function handleSaved() {
    setModalOpen(false);
    setLastMsg({ type: "ok", text: modalMode === "add" ? "Added" : "Saved" });
    setTimeout(() => setLastMsg(null), 3000);
    onRefresh();
  }

  function handleDeleted() {
    setModalOpen(false);
    setLastMsg({ type: "ok", text: "Deleted" });
    setTimeout(() => setLastMsg(null), 3000);
    onRefresh();
  }

  return (
    <>
      {modalOpen && (
        <EditModal
          mode={modalMode}
          bookmark={modalBookmark}
          folders={folders}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
          onClose={() => setModalOpen(false)}
        />
      )}

      <div className="w-72 h-full flex flex-col border-l border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-900">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-surface-700 shrink-0">
          {/* タイトル（クリックで閉じる） */}
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-left group hover:opacity-75 transition-opacity"
            title={t("editOpenTooltip")}
          >
            <Pencil size={13} className="text-indigo-400" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t("editPanelLabel")}</span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-surface-700 rounded px-1.5 py-0.5">
              {bookmarks.length}
            </span>
          </button>
          <button
            onClick={openAdd}
            title={t("addSiteTitle")}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-surface-700 transition-colors"
          >
            <Plus size={12} />{t("addSite")}
          </button>
        </div>

        {/* 検索 */}
        <div className="px-3 py-2 border-b border-gray-200 dark:border-surface-700 shrink-0">
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-surface-800 rounded-lg px-2.5 py-1.5">
            <Search size={12} className="text-gray-400 dark:text-gray-500 shrink-0" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="flex-1 bg-transparent text-xs text-gray-700 dark:text-gray-200 outline-none placeholder-gray-400 dark:placeholder-gray-600"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400">
                <X size={10} />
              </button>
            )}
          </div>
        </div>

        {/* フラッシュメッセージ */}
        {lastMsg && (
          <div className={`mx-3 mt-2 px-3 py-1.5 rounded text-xs shrink-0 ${
            lastMsg.type === "ok" ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400" : "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400"
          }`}>
            {lastMsg.text}
          </div>
        )}

        {/* ブックマーク一覧 */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {filtered.length === 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-600 text-center py-10">
              {query ? "Not found" : "No bookmarks"}
            </p>
          )}
          {filtered.map(b => (
            <button
              key={b.id}
              onClick={() => openEdit(b)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-surface-800 transition-colors border-l-2 border-transparent hover:border-indigo-500 group"
            >
              <img
                src={b.favicon}
                alt=""
                width={14}
                height={14}
                className="rounded-sm shrink-0"
                onError={e => (e.currentTarget.style.display = "none")}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-300 truncate group-hover:text-gray-900 dark:group-hover:text-gray-100">{b.title}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-600 truncate">{b.domain}</p>
              </div>
              <Pencil size={10} className="shrink-0 text-gray-300 dark:text-gray-700 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" />
            </button>
          ))}
        </div>

        {/* ヒント */}
        <div className="px-4 py-2 border-t border-gray-200 dark:border-surface-700 shrink-0">
          <p className="text-[10px] text-gray-400 dark:text-gray-600 text-center">Click to open edit modal</p>
        </div>
      </div>
    </>
  );
}

