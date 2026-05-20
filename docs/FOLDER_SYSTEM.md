# ClickBook — 階層フォルダーシステム仕様

> 実装者向け: `src/shared/categories.ts` で定義するフォルダーシードデータ、
> ツリー構築ロジック、および Sidebar のフォルダー操作仕様を定義する。

---

## 1. 概要

ClickBook のフォルダーは **無限階層のツリー構造** をサポートする。
デフォルトで 8 カテゴリがルートフォルダーとして存在し、
ユーザーは任意の場所にサブフォルダーを作成できる。

```
📂 Technology          ← デフォルト (isDefault: true, 削除不可)
   📂 Frontend         ← ユーザー作成サブフォルダー
      📂 React         ← さらにネスト可能
   📂 Backend
📂 Design              ← デフォルト
📂 Business            ← デフォルト
   📂 自社プロジェクト  ← ユーザー作成
📂 ...
📂 Other               ← デフォルト (フォールバック先)
```

---

## 2. categories.ts の責務

### 2.1 DEFAULT_FOLDERS

初回起動時のシードデータ。`Folder[]` 型。
→ 詳細は DATA_MODEL.md のデフォルトフォルダー表を参照。

### 2.2 DOMAIN_RULES

ルールベース分類用のドメイン → フォルダーID マッピング。

```typescript
export const DOMAIN_RULES: Record<string, string> = {
  "github.com": "technology",
  "figma.com": "design",
  // ... 全パターンは AI_CLASSIFICATION.md 参照
};
```

### 2.3 DEFAULT_FOLDER_ID

```typescript
export const DEFAULT_FOLDER_ID = "other";
```

分類できなかったブックマークのフォールバック先。

### 2.4 getFolderById()

```typescript
export const getFolderById = (folders: Folder[], id: string): Folder =>
  folders.find((f) => f.id === id) ??
  folders.find((f) => f.id === DEFAULT_FOLDER_ID) ??
  DEFAULT_FOLDERS.find((f) => f.id === DEFAULT_FOLDER_ID)!;
```

引数に `folders` 配列を受け取る（ストレージから取得した最新データ）。
ID が見つからない場合は "other" にフォールバック。

### 2.5 buildFolderTree()

フラットな `Folder[]` 配列からツリー構造を構築するヘルパー。

```typescript
export interface FolderTreeNode {
  folder: Folder;
  children: FolderTreeNode[];
  bookmarkCount: number;  // 子孫フォルダーのブックマーク数も含む累計
}

export function buildFolderTree(
  folders: Folder[],
  bookmarkCounts: Record<string, number>  // folderId → 直接のブックマーク数
): FolderTreeNode[];
```

**アルゴリズム:**

1. `folders` を `order` 昇順でソート
2. 各フォルダーを `FolderTreeNode` に変換し、Map に格納
3. `parentId` に基づいて親ノードの `children` に追加。`parentId` が null または存在しない場合はルートへ
4. 再帰的にブックマーク数を子 → 親へ加算

---

## 3. フォルダー操作仕様

### 3.1 作成

- **トリガー**: サイドバーの「+」ボタン（ルート作成）または各フォルダーのホバーメニュー（サブフォルダー作成）
- **入力**: インライン入力フィールド + Enter で確定 / Escape でキャンセル
- **データ**: `name` = ユーザー入力値、`nameJa` = 同値、`icon` = "FolderOpen"、`color` = "indigo"
- **order**: 同階層の末尾（既存の最大 order + 1）
- **メッセージ**: `CREATE_FOLDER { name, parentId }`

### 3.2 リネーム

- **トリガー**: フォルダーのホバーメニュー → 鉛筆アイコン
- **UI**: フォルダー名がインライン入力フィールドに変わる
- **確定**: Enter → `RENAME_FOLDER { id, name }`
- **キャンセル**: Escape
- **制約**: デフォルトフォルダーもリネーム可能（`isDefault` は名前変更を禁止しない）

### 3.3 移動（D&D）

- **トリガー**: フォルダーをドラッグして別のフォルダーにドロップ
- **メッセージ**: `MOVE_FOLDER { id, parentId: ドロップ先ID, order: 999 }`
- **制約**:
  - デフォルトフォルダーはドラッグ不可（`draggable={!f.isDefault}`）
  - 自分自身の子孫への移動は禁止（循環防止）→ storage.ts 側でバリデーション
  - ルートへの移動は `parentId: null`

### 3.4 削除

- **トリガー**: フォルダーのホバーメニュー → ゴミ箱アイコン
- **制約**: `isDefault: true` のフォルダーは削除ボタン非表示
- **動作**:
  1. 子孫フォルダーの ID を再帰的に収集
  2. 該当フォルダー + 子孫のブックマークを全て `"other"` へ移動
  3. 該当フォルダー + 子孫を folders から削除
- **メッセージ**: `DELETE_FOLDER { id }`

### 3.5 折り畳み

- **トリガー**: フォルダー行の矢印アイコン（ChevronRight / ChevronDown）をクリック
- **動作**: `collapsed` を反転。子フォルダーの表示/非表示を切り替え
- **メッセージ**: `TOGGLE_FOLDER { id }`
- **条件**: 子フォルダーがあるときのみ矢印を表示

---

## 4. サイドバー フォルダーツリー UI

### レイアウト

```
┌──────────────────────────┐
│  ClickBook          [42] │  ← ロゴ + 総ブックマーク数
├──────────────────────────┤
│  🏠 ダッシュボード        │  ← selectedFolderId === null
├──────────────────────────┤
│  FOLDERS              [+]│  ← セクションヘッダー + ルート作成ボタン
│                          │
│  ⚬ テクノロジー      12  │  ← depth=0
│  ≡ ▸ ⚬ Frontend      5  │  ← depth=1, ドラッグハンドル + 折り畳み矢印
│  ≡   ⚬ React         2  │  ← depth=2
│  ⚬ デザイン           8  │
│  ⚬ ビジネス           3  │
│  ...                     │
│  ⚬ その他             1  │
├──────────────────────────┤
│  Drop bookmarks on       │  ← フッターヒント
│  folders to organize     │
└──────────────────────────┘
```

### 各行の要素（左から右）

1. **ドラッグハンドル** `GripVertical` — ホバー時のみ表示、`isDefault` は非表示
2. **折り畳み矢印** `ChevronRight` / `ChevronDown` — 子がある場合のみ
3. **カラードット** — フォルダーの `color` に対応した丸い点
4. **フォルダー名** — クリックで選択
5. **件数バッジ** — 子孫含む累計ブックマーク数
6. **アクションメニュー（ホバー時）**:
   - `FolderPlus` サブフォルダー追加
   - `Pencil` リネーム（`isDefault` 以外のみ）
   - `Trash2` 削除（`isDefault` 以外のみ）

### インデント

`paddingLeft: depth * 16 + 8` px。depth はツリーの深さ（ルート=0）。

### D&D ドロップフィードバック

ドラッグ中のフォルダー/ブックマークがフォルダー上にあるとき:
- `ring-2 ring-indigo-500/50 bg-indigo-500/10` をドロップターゲットに適用

---

## 5. ブックマークのフォルダー表示

### 選択フォルダーのブックマーク取得ロジック

フォルダー選択時、**そのフォルダーと子孫フォルダー全て**のブックマークを表示する。

```typescript
function getBookmarksForFolder(folderId: string): Bookmark[] {
  // 1. folderId + 全子孫フォルダーの ID を収集
  const descendantIds = new Set<string>([folderId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const f of folders) {
      if (f.parentId && descendantIds.has(f.parentId) && !descendantIds.has(f.id)) {
        descendantIds.add(f.id);
        changed = true;
      }
    }
  }
  // 2. これらの ID に属するブックマークをフィルタ
  return bookmarks.filter((b) => descendantIds.has(b.folderId));
}
```

---

## 6. 実装上の注意

- `categories.ts` に `CATEGORIES` 配列は存在しない。`DEFAULT_FOLDERS` を使うこと
- `Bookmark.categoryId` は存在しない。`Bookmark.folderId` を使うこと
- フォルダーの CRUD は全て Service Worker 経由で行い、直接 storage.ts を UI から呼ばない
- buildFolderTree のブックマーク数は「直接の件数 + 全子孫の件数」を累計する
