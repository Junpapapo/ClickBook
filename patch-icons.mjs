import { readFileSync, writeFileSync } from "fs";

// ── 1. types.ts: CREATE_FOLDER / RENAME_FOLDER に icon? を追加 ──
let types = readFileSync("src/shared/types.ts", "utf8");
types = types.replace(
  "| { type: \"CREATE_FOLDER\"; name: string; parentId: string | null }",
  "| { type: \"CREATE_FOLDER\"; name: string; parentId: string | null; icon?: string }"
);
types = types.replace(
  "| { type: \"RENAME_FOLDER\"; id: string; name: string }",
  "| { type: \"RENAME_FOLDER\"; id: string; name: string; icon?: string }"
);
writeFileSync("src/shared/types.ts", types);
console.log("✓ types.ts");

// ── 2. storage.ts: createFolder / renameFolder に icon 引数追加 ──
let storage = readFileSync("src/shared/storage.ts", "utf8");
storage = storage.replace(
  `export async function createFolder(
  name: string,
  parentId: string | null
): Promise<Folder> {
  const data = await readStorage();
  const siblings = data.folders.filter((f) => f.parentId === parentId);
  const maxOrder = siblings.reduce((max, f) => Math.max(max, f.order), -1);

  const folder: Folder = {
    id: crypto.randomUUID(),
    name,
    nameJa: name,
    icon: "FolderOpen",`,
  `export async function createFolder(
  name: string,
  parentId: string | null,
  icon = "📁"
): Promise<Folder> {
  const data = await readStorage();
  const siblings = data.folders.filter((f) => f.parentId === parentId);
  const maxOrder = siblings.reduce((max, f) => Math.max(max, f.order), -1);

  const folder: Folder = {
    id: crypto.randomUUID(),
    name,
    nameJa: name,
    icon,`
);
storage = storage.replace(
  `export async function renameFolder(
  id: string,
  name: string
): Promise<void> {
  const data = await readStorage();
  data.folders = data.folders.map((f) =>
    f.id === id ? { ...f, name, nameJa: name } : f
  );`,
  `export async function renameFolder(
  id: string,
  name: string,
  icon?: string
): Promise<void> {
  const data = await readStorage();
  data.folders = data.folders.map((f) =>
    f.id === id ? { ...f, name, nameJa: name, ...(icon ? { icon } : {}) } : f
  );`
);
writeFileSync("src/shared/storage.ts", storage);
console.log("✓ storage.ts");

// ── 3. service-worker.ts: icon を storage 関数へ渡す ──
let sw = readFileSync("src/background/service-worker.ts", "utf8");
sw = sw.replace(
  `      const folder = await createFolder(message.name, message.parentId);`,
  `      const folder = await createFolder(message.name, message.parentId, message.icon);`
);
sw = sw.replace(
  `      await renameFolder(message.id, message.name);`,
  `      await renameFolder(message.id, message.name, message.icon);`
);
writeFileSync("src/background/service-worker.ts", sw);
console.log("✓ service-worker.ts");

// ── 4. Sidebar.tsx: アイコンピッカーを追加 ──
let sidebar = readFileSync("src/components/Sidebar.tsx", "utf8");

// 4a. ICONS 定数 + 状態を追加（COLOR_DOT の直後）
sidebar = sidebar.replace(
  `export default function Sidebar({`,
  `const FOLDER_ICONS = [
  "📁","📂","🗂️","💼","📚","📖","📝","📌","🏠",
  "⭐","🔧","🎮","🎨","🎵","🎬","📷","🎯","💡",
  "🔬","📊","🌐","🚀","💻","📱","🔒","🛡️","❤️",
  "💙","💚","🌟","🏷️","🎁","📋","🔑","🌈","⚡",
];

function IconPicker({ onSelect }: { onSelect: (icon: string) => void }) {
  return (
    <div className="absolute left-0 top-full mt-1 z-50 bg-surface-800 border border-surface-600 rounded-lg p-1.5 grid grid-cols-9 gap-0.5 shadow-xl">
      {FOLDER_ICONS.map((ic) => (
        <button
          key={ic}
          type="button"
          onClick={() => onSelect(ic)}
          className="text-sm leading-none p-1 rounded hover:bg-surface-700 transition-colors"
        >
          {ic}
        </button>
      ))}
    </div>
  );
}

export default function Sidebar({`
);

// 4b. 状態変数を追加（dragType の直後）
sidebar = sidebar.replace(
  `  const dragItemId = useRef<string | null>(null);
  const dragType = useRef<"folder" | "bookmark" | null>(null);`,
  `  const dragItemId = useRef<string | null>(null);
  const dragType = useRef<"folder" | "bookmark" | null>(null);
  const [newFolderIcon, setNewFolderIcon] = useState("📁");
  const [renameIcon, setRenameIcon] = useState("📁");
  const [showPicker, setShowPicker] = useState<"create" | "rename" | null>(null);`
);

// 4c. handleCreateFolder に icon を渡す
sidebar = sidebar.replace(
  `    await chrome.runtime.sendMessage({
      type: "CREATE_FOLDER",
      name,
      parentId: creatingUnder === false ? null : creatingUnder,
    });
    setCreatingUnder(false);
    setNewFolderName("");`,
  `    await chrome.runtime.sendMessage({
      type: "CREATE_FOLDER",
      name,
      parentId: creatingUnder === false ? null : creatingUnder,
      icon: newFolderIcon,
    });
    setCreatingUnder(false);
    setNewFolderName("");
    setNewFolderIcon("📁");
    setShowPicker(null);`
);

// 4d. handleRename に icon を渡す
sidebar = sidebar.replace(
  `    await chrome.runtime.sendMessage({ type: "RENAME_FOLDER", id: renamingId, name });
    setRenamingId(null);
    setRenameValue("");`,
  `    await chrome.runtime.sendMessage({ type: "RENAME_FOLDER", id: renamingId, name, icon: renameIcon });
    setRenamingId(null);
    setRenameValue("");
    setShowPicker(null);`
);

// 4e. フォルダーツリーのアイコン表示：color dot の代わりに emoji
sidebar = sidebar.replace(
  `          <span className={\`w-2 h-2 rounded-full shrink-0 \${dotColor}\`} />`,
  `          {f.icon && !f.icon.startsWith("Folder") ? (
            <span className="text-sm leading-none shrink-0">{f.icon}</span>
          ) : (
            <span className={\`w-2 h-2 rounded-full shrink-0 \${dotColor}\`} />
          )}`
);

// 4f. リネームフォームにアイコンボタンを追加
sidebar = sidebar.replace(
  `          ) : (
            <span
              className="truncate flex-1 min-w-0"
              onClick={() => onSelect(f.id)}
            >
              {f.nameJa}
            </span>
          )}`,
  `          ) : (
            <span
              className="truncate flex-1 min-w-0"
              onClick={() => onSelect(f.id)}
            >
              {f.nameJa}
            </span>
          )}`
);

// 4g. リネームフォームのアイコンピッカーを input の前に追加
sidebar = sidebar.replace(
  `          {isRenaming ? (
            <div className="flex items-center gap-1 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename();
                  if (e.key === "Escape") setRenamingId(null);
                }}
                className="flex-1 min-w-0 bg-surface-700 border border-surface-600 rounded px-1.5 py-0.5 text-xs text-gray-200 outline-none focus:border-indigo-500"
              />`,
  `          {isRenaming ? (
            <div className="relative flex items-center gap-1 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => { setRenameIcon(f.icon ?? "📁"); setShowPicker(showPicker === "rename" ? null : "rename"); }}
                className="shrink-0 text-sm leading-none hover:bg-surface-700 rounded p-0.5 transition-colors"
              >
                {renameIcon || f.icon || "📁"}
              </button>
              {showPicker === "rename" && (
                <IconPicker onSelect={(ic) => { setRenameIcon(ic); setShowPicker(null); }} />
              )}
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename();
                  if (e.key === "Escape") { setRenamingId(null); setShowPicker(null); }
                }}
                className="flex-1 min-w-0 bg-surface-700 border border-surface-600 rounded px-1.5 py-0.5 text-xs text-gray-200 outline-none focus:border-indigo-500"
              />`
);

// 4h. フォルダー作成フォーム（サブフォルダー）にアイコンピッカーを追加
sidebar = sidebar.replace(
  `        {creatingUnder === f.id && (
          <div
            className="flex items-center gap-1 mx-1.5 my-1 rounded-lg bg-surface-800 px-2 py-1.5"
            style={{ paddingLeft: \`\${(depth + 1) * 16 + 8}px\` }}
          >
            <input
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateFolder();
                if (e.key === "Escape") setCreatingUnder(false);
              }}
              placeholder="フォルダー名..."
              className="flex-1 min-w-0 bg-surface-700 border border-surface-600 rounded px-2 py-1 text-xs text-gray-200 placeholder-gray-600 outline-none focus:border-indigo-500"
            />`,
  `        {creatingUnder === f.id && (
          <div
            className="flex items-center gap-1 mx-1.5 my-1 rounded-lg bg-surface-800 px-2 py-1.5 relative"
            style={{ paddingLeft: \`\${(depth + 1) * 16 + 8}px\` }}
          >
            <button
              type="button"
              onClick={() => setShowPicker(showPicker === "create" ? null : "create")}
              className="shrink-0 text-sm leading-none hover:bg-surface-700 rounded p-0.5 transition-colors"
            >
              {newFolderIcon}
            </button>
            {showPicker === "create" && (
              <IconPicker onSelect={(ic) => { setNewFolderIcon(ic); setShowPicker(null); }} />
            )}
            <input
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateFolder();
                if (e.key === "Escape") { setCreatingUnder(false); setShowPicker(null); }
              }}
              placeholder="フォルダー名..."
              className="flex-1 min-w-0 bg-surface-700 border border-surface-600 rounded px-2 py-1 text-xs text-gray-200 placeholder-gray-600 outline-none focus:border-indigo-500"
            />`
);

// 4i. ルートフォルダー作成フォームにもアイコンピッカーを追加
sidebar = sidebar.replace(
  `      {creatingUnder === null && (
        <div className="flex items-center gap-1 mx-1.5 mb-1 rounded-lg bg-surface-800 px-3 py-1.5">
          <input
            autoFocus
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateFolder();
              if (e.key === "Escape") setCreatingUnder(false);
            }}
            placeholder="フォルダー名..."
            className="flex-1 min-w-0 bg-surface-700 border border-surface-600 rounded px-2 py-1 text-xs text-gray-200 placeholder-gray-600 outline-none focus:border-indigo-500"
          />`,
  `      {creatingUnder === null && (
        <div className="relative flex items-center gap-1 mx-1.5 mb-1 rounded-lg bg-surface-800 px-3 py-1.5">
          <button
            type="button"
            onClick={() => setShowPicker(showPicker === "create" ? null : "create")}
            className="shrink-0 text-sm leading-none hover:bg-surface-700 rounded p-0.5 transition-colors"
          >
            {newFolderIcon}
          </button>
          {showPicker === "create" && (
            <IconPicker onSelect={(ic) => { setNewFolderIcon(ic); setShowPicker(null); }} />
          )}
          <input
            autoFocus
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateFolder();
              if (e.key === "Escape") { setCreatingUnder(false); setShowPicker(null); }
            }}
            placeholder="フォルダー名..."
            className="flex-1 min-w-0 bg-surface-700 border border-surface-600 rounded px-2 py-1 text-xs text-gray-200 placeholder-gray-600 outline-none focus:border-indigo-500"
          />`
);

writeFileSync("src/components/Sidebar.tsx", sidebar);
console.log("✓ Sidebar.tsx");
console.log("All done!");
