# ClickBook — UI 仕様

> 実装者向け: 全画面のレイアウト、各コンポーネントの責務、
> ダーク/ライトテーマ、Drag & Drop の挙動を定義する。

---

## 1. 画面構成

### 1.1 Popup（拡張アイコンクリック時）

小さなパネル（幅 288px）。2つのボタンのみ。

```
┌────────────────────────────┐
│ 📎 ClickBook               │
│                            │
│ ┌────────────────────────┐ │
│ │   このページを保存      │ │  ← indigo ボタン
│ └────────────────────────┘ │
│                            │
│  ✅ 保存しました！          │  ← ステータスメッセージ（条件表示）
│  ⚠️ このURLは保存済みです   │
│  ❌ 保存に失敗しました      │
│                            │
│ ┌────────────────────────┐ │
│ │   ブックマークを管理    │ │  ← サブボタン → newtab を開く
│ └────────────────────────┘ │
└────────────────────────────┘
```

**Popup.tsx の状態管理:**

```typescript
type Status = "idle" | "loading" | "success" | "duplicate" | "error";
```

- `idle`: 初期状態。ボタンのみ表示
- `loading`: ボタンに Loader2 スピナー表示、ボタン無効化
- `success`: 緑の CheckCircle2 + メッセージ、ボタン無効化
- `duplicate`: 黄色の AlertCircle + メッセージ
- `error`: 赤の AlertCircle + メッセージ

**管理ページを開く:**
```typescript
chrome.tabs.create({ url: chrome.runtime.getURL("newtab/index.html") });
```

### 1.2 管理ページ（専用タブ）

```
┌─────────────────────────────────────────────────────────────┐
│  🔍 検索...                    [JSON][HTML][Import] [🌙/☀️] │  ← SearchBar
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│  Sidebar     │  メインエリア                                │
│  (w-60)      │  (flex-1, overflow-y-auto, p-6)              │
│              │                                              │
│  → 階層      │  Dashboard    or    FolderView               │
│    フォルダー │                                              │
│    ツリー     │                                              │
│              │                                              │
├──────────────┴──────────────────────────────────────────────┤
```

**App.tsx の状態管理:**

```typescript
const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
const [folders, setFolders] = useState<Folder[]>([]);
const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
const [searchQuery, setSearchQuery] = useState("");
```

- `selectedFolderId === null` → Dashboard 表示
- `selectedFolderId !== null` → FolderView 表示
- `searchQuery` が非空 → bookmarks をタイトル・URL でフィルタ

**データ取得:**
- `useEffect` で初回マウント時に `GET_ALL_DATA` メッセージを送信
- `loadData()` 関数を子コンポーネントに `onRefresh` として渡す

---

## 2. コンポーネント詳細

### 2.1 Sidebar.tsx

→ 詳細は FOLDER_SYSTEM.md を参照。

**Props:**
```typescript
interface Props {
  bookmarks: Bookmark[];
  folders: Folder[];
  selectedFolderId: string | null;
  onSelect: (id: string | null) => void;
  onRefresh: () => void;
}
```

### 2.2 SearchBar.tsx

**Props:**
```typescript
interface Props {
  query: string;
  onChange: (q: string) => void;
  bookmarks: Bookmark[];
  onRefresh: () => void;
}
```

**要素（左から右）:**
1. 検索アイコン `Search` + `<input>` — リアルタイム絞り込み
2. 更新ボタン `RefreshCw`
3. JSON エクスポートボタン `Download` + "JSON"
4. HTML エクスポートボタン `Download` + "HTML"
5. インポートボタン `Upload` + "インポート"
6. **テーマ切替ボタン** `ThemeToggle` — Sun / Moon アイコン

**エクスポート:**
- JSON: `StorageData` を `Blob` → `URL.createObjectURL` → `<a>.click()`
  - ファイル名: `clickbook-export-YYYY-MM-DD.json`
- HTML: Netscape Bookmark File 形式
  - ファイル名: `clickbook-export-YYYY-MM-DD.html`

**インポート:**
- `<input type="file" accept=".json">` でファイル選択
- `JSON.parse` → `IMPORT_DATA` メッセージ送信
- 失敗時は `alert()` でエラー表示

### 2.3 BookmarkCard.tsx

**Props:**
```typescript
interface Props {
  bookmark: Bookmark;
  onDelete?: (id: string) => void;
}
```

**レイアウト:**
```
┌─────────────────────────┐
│  [OGP 画像 h-28]        │  ← ogpImage があれば表示。なければ省略
├─────────────────────────┤
│  🌐 github.com   3日前   │  ← favicon + domain + 相対日時
│  React: A JavaScript... │  ← タイトル (line-clamp-2)
│  github.com/facebook/re │  ← 短縮 URL
│                 [🔗][🗑] │  ← ホバー時のみ表示
└─────────────────────────┘
```

**Drag 対応:**
- カード全体を `draggable` にする
- `onDragStart` で `dataTransfer.setData("text/plain", bookmark.id)` + `dataTransfer.setData("application/x-clickbook-type", "bookmark")`
- **カードを Sidebar のフォルダー上にドロップすると、そのフォルダーへ移動**

**相対日時フォーマット:**
```
< 1分: "たった今"
< 60分: "{n}分前"
< 24時間: "{n}時間前"
< 30日: "{n}日前"
>= 30日: YYYY/MM/DD 形式
```

**URL 短縮:**
```
hostname + pathname（30文字超は "…" で省略）
```

### 2.4 Dashboard.tsx

**Props:**
```typescript
interface Props {
  bookmarks: Bookmark[];
  folders: Folder[];
  onSelectFolder: (id: string) => void;
  onRefresh: () => void;
}
```

**3つのセクション:**

#### フォルダーサマリー
- ルートフォルダーのみをグリッド表示（`grid-cols-4 xl:grid-cols-8`）
- 各タイル: emoji + 日本語名 + 件数
- クリック → `onSelectFolder(id)`

#### 最近追加（RecentWidget）
- bookmarks を `savedAt` 降順 → 先頭 4件
- BookmarkCard のグリッド表示（`grid-cols-2 xl:grid-cols-4`）

#### よく見るサイト（RankingWidget）
- bookmarks を `visitCount` 降順 → 先頭 5件
- リスト形式: 順位番号 + favicon + タイトル + 回数
- 1位: amber / 2位: gray / 3位: orange / 4位以降: gray-600

### 2.5 FolderView.tsx

**Props:**
```typescript
interface Props {
  bookmarks: Bookmark[];
  folders: Folder[];
  folderId: string;
  onRefresh: () => void;
}
```

**レイアウト:**
```
┌─────────────────────────────────────────┐
│  テクノロジー             12件           │  ← フォルダー名 + 件数
├─────────────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │
│  │Card  │ │Card  │ │Card  │ │Card  │   │  ← grid-cols-2 md:3 lg:4 xl:5
│  └──────┘ └──────┘ └──────┘ └──────┘   │
│  ┌──────┐ ┌──────┐                      │
│  │Card  │ │Card  │                      │
│  └──────┘ └──────┘                      │
└─────────────────────────────────────────┘
```

**空状態:**
```
📭
このフォルダーにはまだブックマークがありません。
```

**D&D ドロップ対応:**
- FolderView エリア全体をドロップゾーンとして、他フォルダーからのブックマークを受け入れ可能にしても良い（任意）

### 2.6 ThemeToggle.tsx

**Props:** なし（`useTheme()` フックを内部で使用）

```typescript
import { useTheme } from "@/shared/ThemeContext";
import { Sun, Moon } from "lucide-react";
```

- dark テーマ時: `Sun` アイコン（クリックで light へ）
- light テーマ時: `Moon` アイコン（クリックで dark へ）
- ボタンスタイル: 他の SearchBar ボタンと統一

---

## 3. テーマシステム

### 3.1 仕組み

- Tailwind の `darkMode: "class"` を使用
- `<html>` 要素に `class="dark"` を付与/除去で切り替え
- テーマ状態は `localStorage` に永続化（キー: `"clickbook_theme"`）

### 3.2 ThemeContext.tsx

```typescript
type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}
```

**ThemeProvider:**
- 初期値: `localStorage.getItem("clickbook_theme")` → なければ `"dark"`
- `useEffect` で `document.documentElement.classList` を操作
- `toggle()` で `"dark"` ↔ `"light"` を切り替え

**配置:**
- `src/newtab/main.tsx` で `<ThemeProvider>` で `<App />` をラップ
- Popup は小さいのでテーマ切替不要（常にダーク）

### 3.3 カラー設計

全コンポーネントで `bg-xxx dark:bg-xxx` のデュアルクラスを使用する。

| 用途 | Light | Dark |
|---|---|---|
| ページ背景 | `bg-surface-50` | `dark:bg-surface-950` |
| サイドバー / ヘッダー背景 | `bg-white` | `dark:bg-surface-900` |
| カード背景 | `bg-white` | `dark:bg-surface-800` |
| ボーダー | `border-gray-200` | `dark:border-surface-700` |
| テキスト主 | `text-gray-800` | `dark:text-gray-100` |
| テキスト副 | `text-gray-500` | `dark:text-gray-400` |
| テキスト薄 | `text-gray-400` | `dark:text-gray-600` |
| アクセント | `text-indigo-600` | `dark:text-indigo-400` |
| ボタン BG | `bg-indigo-600` | `dark:bg-indigo-600`（共通） |
| ホバー BG | `hover:bg-gray-50` | `dark:hover:bg-surface-800` |
| 入力フィールド | `bg-gray-100` | `dark:bg-surface-800` |
| バッジ | `bg-gray-100` | `dark:bg-surface-700` |
| シャドウ | `shadow-sm` | `dark:shadow-none` |

### 3.4 tailwind.config.js のカスタムカラー

```javascript
colors: {
  surface: {
    50:  "#f8f9fb",   // Light ページ背景
    100: "#f0f1f5",
    200: "#e2e4eb",
    300: "#cdd0da",   // Light スクロールバー
    400: "#9ea3b3",
    600: "#3a3a4e",
    700: "#2a2a3a",   // Dark ボーダー
    800: "#1e1e2a",   // Dark カード
    900: "#13131a",   // Dark サイドバー
    950: "#0a0a0f",   // Dark ページ背景
  },
}
```

---

## 4. Drag & Drop 仕様

HTML5 Drag and Drop API をネイティブ使用する。外部ライブラリは使わない。

### 4.1 ドラッグ対象

| 対象 | ドラッグ可能条件 | dataTransfer に設定 |
|---|---|---|
| BookmarkCard | 常にドラッグ可能 | `text/plain`: bookmark.id, `application/x-clickbook-type`: "bookmark" |
| Sidebar のフォルダー | `isDefault === false` のみ | `text/plain`: folder.id, `application/x-clickbook-type`: "folder" |

### 4.2 ドロップターゲット

| ターゲット | 受け入れ | 動作 |
|---|---|---|
| Sidebar のフォルダー行 | bookmark / folder | bookmark → `MOVE_BOOKMARK`, folder → `MOVE_FOLDER` |

### 4.3 ビジュアルフィードバック

- ドラッグ中にフォルダー上にホバー → `ring-2 ring-indigo-500/50 bg-indigo-500/10`
- ドラッグ離脱 → フィードバック解除

### 4.4 イベントハンドリング

```typescript
// ドラッグ開始（BookmarkCard / Sidebar フォルダー）
onDragStart(e: DragEvent) {
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", id);
  e.dataTransfer.setData("application/x-clickbook-type", type); // "bookmark" | "folder"
}

// ドロップターゲット（Sidebar フォルダー）
onDragOver(e: DragEvent) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
  setDragOverId(folderId);
}

onDragLeave() {
  setDragOverId(null);
}

onDrop(e: DragEvent, targetFolderId: string) {
  e.preventDefault();
  const id = e.dataTransfer.getData("text/plain");
  const type = e.dataTransfer.getData("application/x-clickbook-type");
  
  if (type === "bookmark") {
    sendMessage({ type: "MOVE_BOOKMARK", id, folderId: targetFolderId });
  } else if (type === "folder" && id !== targetFolderId) {
    sendMessage({ type: "MOVE_FOLDER", id, parentId: targetFolderId, order: 999 });
  }
  onRefresh();
}
```

---

## 5. レスポンシブ考慮

管理ページは Chrome の新規タブで全画面表示を想定。
最小幅は 1024px 想定で問題ない（Chrome 拡張の管理ページはリサイズ可能だが、モバイル対応は不要）。

- サイドバー: 固定幅 `w-60` (240px)
- メインエリア: `flex-1` で残りを使用
- カードグリッド: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5`
