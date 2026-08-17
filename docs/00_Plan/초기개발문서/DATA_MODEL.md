# ClickBook — データモデル & メッセージング仕様

> 実装者向け: `src/shared/types.ts` に定義する全型と、
> Service Worker ↔ Popup / Newtab 間のメッセージプロトコルを定義する。

---

## 1. Bookmark

ブックマーク1件を表す。

```typescript
export interface Bookmark {
  id: string;          // crypto.randomUUID() で生成
  url: string;         // 完全 URL（例: "https://github.com/facebook/react"）
  title: string;       // ページタイトル（tab.title）
  favicon: string;     // Google Favicon API: https://www.google.com/s2/favicons?domain={domain}&sz=64
  ogpImage?: string;   // OGP 画像 URL（将来実装。現時点では undefined）
  folderId: string;    // 所属する Folder.id
  domain: string;      // URL のホスト名（例: "github.com"）
  visitCount: number;  // ブックマークを開いた回数（初期値 0）
  savedAt: number;     // Date.now() タイムスタンプ
}
```

### 制約

- `url` は `http://` または `https://` で始まること（chrome:// 等は保存不可）
- `id` はグローバルユニーク（crypto.randomUUID）
- `folderId` は必ず存在する `Folder.id` を参照すること
- 同一 `url` の重複保存は禁止（保存前にチェック）

---

## 2. Folder

階層フォルダーを表す。親子関係で無限ネスト可能。

```typescript
export interface Folder {
  id: string;              // デフォルトは固定文字列（"technology" 等）、ユーザー作成は crypto.randomUUID()
  name: string;            // 英語名（表示にも使用可能）
  nameJa: string;          // 日本語名（UI 表示用。ユーザー作成時は name と同値）
  icon: string;            // lucide-react アイコン名（例: "Code2", "FolderOpen"）
  color: string;           // Tailwind カラー名（例: "blue", "indigo"）
  parentId: string | null; // 親フォルダーの ID。null = ルートレベル
  order: number;           // 同じ parentId 内でのソート順（0 始まり、昇順）
  isDefault: boolean;      // true = デフォルト8フォルダー（削除不可・isDefault 変更不可）
  collapsed: boolean;      // サイドバーでの折り畳み状態
  createdAt: number;       // Date.now()。デフォルトフォルダーは 0
}
```

### デフォルトフォルダー（8種）

初回起動時にストレージが空の場合、以下をシードデータとして書き込む。

| id | name | nameJa | icon | color | order |
|---|---|---|---|---|---|
| `technology` | Technology | テクノロジー | Code2 | blue | 0 |
| `design` | Design | デザイン | Palette | purple | 1 |
| `business` | Business | ビジネス | Briefcase | amber | 2 |
| `entertainment` | Entertainment | エンタメ | Tv | rose | 3 |
| `science` | Science | サイエンス | FlaskConical | cyan | 4 |
| `sports` | Sports | スポーツ | Trophy | green | 5 |
| `travel` | Travel | トラベル | Plane | sky | 6 |
| `other` | Other | その他 | Folder | gray | 7 |

すべて `parentId: null`, `isDefault: true`, `collapsed: false`, `createdAt: 0`。

### 階層ルール

- ネストの深さ制限なし（UI 上は indent で表現）
- フォルダー削除時、子フォルダーも再帰的に削除
- 削除されたフォルダー内のブックマークは `"other"` フォルダーへ移動
- 自分自身を自分の子孫に移動する操作は禁止（循環防止）

---

## 3. StorageData

chrome.storage.local に保存するトップレベル構造。

```typescript
export type StorageData = {
  bookmarks: Bookmark[];
  folders: Folder[];
};
```

- ストレージキー: `"clickbook_data"`
- 読み取り時に `folders` が存在しない場合、デフォルトフォルダーで初期化する
- chrome.storage.local の上限は 10MB。通常利用では到達しない想定

---

## 4. メッセージング仕様

Popup / Newtab → Service Worker 間は `chrome.runtime.sendMessage` で通信する。
Service Worker は `chrome.runtime.onMessage.addListener` で受信し、
非同期レスポンスを返す（`return true` 必須）。

### メッセージ型

```typescript
export type Message =
  | { type: "SAVE_TAB" }
  | { type: "GET_BOOKMARKS" }
  | { type: "GET_ALL_DATA" }
  | { type: "DELETE_BOOKMARK"; id: string }
  | { type: "MOVE_BOOKMARK"; id: string; folderId: string }
  | { type: "CREATE_FOLDER"; name: string; parentId: string | null }
  | { type: "RENAME_FOLDER"; id: string; name: string }
  | { type: "MOVE_FOLDER"; id: string; parentId: string | null; order: number }
  | { type: "DELETE_FOLDER"; id: string }
  | { type: "TOGGLE_FOLDER"; id: string }
  | { type: "EXPORT_DATA" }
  | { type: "IMPORT_DATA"; data: StorageData };
```

### レスポンス型

```typescript
export type MessageResponse =
  | { success: true; data?: unknown }
  | { success: false; error: string; isDuplicate?: boolean };
```

### メッセージ詳細

| メッセージ | 送信元 | 動作 | レスポンス data |
|---|---|---|---|
| `SAVE_TAB` | Popup | アクティブタブの URL/タイトル取得 → 重複チェック → AI 分類 → 保存 | 保存した `Bookmark` オブジェクト |
| `GET_BOOKMARKS` | Newtab | 全ブックマーク取得 | `Bookmark[]` |
| `GET_ALL_DATA` | Newtab | 全データ取得（bookmarks + folders） | `StorageData` |
| `DELETE_BOOKMARK` | Newtab | 指定 ID のブックマーク削除 | なし |
| `MOVE_BOOKMARK` | Newtab | ブックマークの folderId を変更 | なし |
| `CREATE_FOLDER` | Newtab | 新規フォルダー作成（name + parentId） | 作成した `Folder` |
| `RENAME_FOLDER` | Newtab | フォルダー名変更（name → name & nameJa） | なし |
| `MOVE_FOLDER` | Newtab | フォルダーの parentId と order を変更 | なし |
| `DELETE_FOLDER` | Newtab | フォルダー + 子孫を削除、中のブックマークは "other" へ | なし |
| `TOGGLE_FOLDER` | Newtab | フォルダーの collapsed を反転 | なし |
| `EXPORT_DATA` | Newtab | 全ストレージデータを返す | `StorageData` |
| `IMPORT_DATA` | Newtab | 受け取った StorageData でストレージを上書き | なし |

### SAVE_TAB フロー詳細

```
1. chrome.tabs.query({ active: true, currentWindow: true })
2. tab.url が http:// / https:// でなければ → error "Cannot save this type of URL"
3. 既存ブックマークと URL 一致チェック → 一致したら → error + isDuplicate: true
4. URL から domain を抽出（new URL(url).hostname）
5. categorize(url, title, domain) で folderId を決定
   → AI_CLASSIFICATION.md 参照
6. favicon URL を生成: https://www.google.com/s2/favicons?domain={domain}&sz=64
7. Bookmark オブジェクト生成（visitCount: 0, savedAt: Date.now()）
8. storage.addBookmark() で先頭に追加
9. success + data: bookmark を返す
```

---

## 5. storage.ts ヘルパー関数一覧

| 関数 | 引数 | 戻り値 | 説明 |
|---|---|---|---|
| `getBookmarks()` | — | `Promise<Bookmark[]>` | 全ブックマーク取得 |
| `getAllData()` | — | `Promise<StorageData>` | bookmarks + folders 取得 |
| `addBookmark(b)` | `Bookmark` | `Promise<void>` | 先頭に追加 |
| `deleteBookmark(id)` | `string` | `Promise<void>` | ID で削除 |
| `moveBookmark(id, folderId)` | `string, string` | `Promise<void>` | folderId を変更 |
| `getFolders()` | — | `Promise<Folder[]>` | 全フォルダー取得 |
| `createFolder(name, parentId)` | `string, string\|null` | `Promise<Folder>` | 新規作成。order は同階層の末尾 |
| `renameFolder(id, name)` | `string, string` | `Promise<void>` | name と nameJa を更新 |
| `moveFolder(id, parentId, order)` | `string, string\|null, number` | `Promise<void>` | 親と順序を変更 |
| `deleteFolder(id)` | `string` | `Promise<void>` | isDefault=true は無視。子孫も再帰削除。ブックマークは "other" へ |
| `toggleFolderCollapsed(id)` | `string` | `Promise<void>` | collapsed を反転 |
| `exportData()` | — | `Promise<StorageData>` | 全データ返却 |
| `importData(data)` | `StorageData` | `Promise<void>` | バリデーション後に上書き |

### 内部実装ルール

- `readStorage()`: ストレージから読み込み、folders が無ければデフォルトフォルダーで初期化
- `writeStorage(data)`: `chrome.storage.local.set({ clickbook_data: data })`
- 全関数は `readStorage()` → 変更 → `writeStorage()` の流れ
