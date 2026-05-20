# ClickBook — 開発ガイドライン

> **他のドキュメントとセットで参照すること。**
> 本ファイルはプロジェクト全体の概要・技術選定・規約・実装フェーズを定義する。
> 各詳細仕様は個別ドキュメントに分離している。

## 関連ドキュメント

| ドキュメント | 内容 |
|---|---|
| [DATA_MODEL.md](./DATA_MODEL.md) | 型定義・ストレージ設計・メッセージング仕様 |
| [FOLDER_SYSTEM.md](./FOLDER_SYSTEM.md) | 階層フォルダーの設計・CRUD・ツリー構築 |
| [UI_SPEC.md](./UI_SPEC.md) | レイアウト・コンポーネント・テーマ・D&D 仕様 |
| [AI_CLASSIFICATION.md](./AI_CLASSIFICATION.md) | Gemini Nano・ルールベース分類・ドメインパターン |

---

## 1. プロジェクト概要

**ClickBook** は Chrome 拡張機能（Manifest V3）。
拡張機能アイコンをクリックするだけでアクティブタブを保存し、Chrome 内蔵 AI（Gemini Nano）またはルールベースフォールバックにより、自動でカテゴリフォルダーへ分類・管理する。

### コアコンセプト

| # | コンセプト | 説明 |
|---|---|---|
| 1 | **1クリック保存** | アイコンクリック → アクティブタブのみ即時保存 |
| 2 | **自動カテゴリ分類** | AI / ルールベースで 8 デフォルトフォルダーへ振り分け |
| 3 | **階層フォルダー管理** | 親子フォルダー構造。ユーザーが自由に作成・移動・リネーム可能 |
| 4 | **ダーク / ライトテーマ** | `class` ベースの切り替え。localStorage で永続化 |
| 5 | **Drag & Drop** | ブックマーク → フォルダー、フォルダー → フォルダー の移動 |
| 6 | **美しい管理 UI** | 専用タブで開くダッシュボード型管理画面 |
| 7 | **完全オフライン** | chrome.storage.local による完全ローカル完結 |

---

## 2. 技術スタック

| 区分 | 技術 | バージョン | 備考 |
|---|---|---|---|
| UI | React | 18.x | 関数コンポーネント + Hooks のみ |
| 言語 | TypeScript | 5.x | strict mode 必須 |
| スタイル | Tailwind CSS | 3.x | `darkMode: "class"` |
| ビルド | Vite | 5.x | |
| 拡張機能 | vite-plugin-web-extension | latest | popup / newtab / service-worker を統合管理 |
| D&D | HTML5 Drag and Drop API | ― | ネイティブ API 使用（外部ライブラリ不要） |
| アイコン | lucide-react | latest | |
| Manifest | Chrome Manifest V3 | ― | |
| ストレージ | chrome.storage.local | ― | 上限 10MB |
| AI | Chrome Gemini Nano | ― | `window.ai.languageModel` (実験的 API) |

### npm 依存関係

```json
{
  "dependencies": {
    "lucide-react": "^0.400.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/chrome": "^0.0.268",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.39",
    "tailwindcss": "^3.4.6",
    "typescript": "^5.5.3",
    "vite": "^5.3.4",
    "vite-plugin-web-extension": "^4.1.1"
  }
}
```

> **Note**: @dnd-kit は使用しない。HTML5 Drag and Drop API をネイティブで使用する。

---

## 3. プロジェクト構成

```
ClickBook/
├── docs/
│   ├── GUIDELINES.md            # 本文書
│   ├── DATA_MODEL.md            # 型・ストレージ・メッセージング
│   ├── FOLDER_SYSTEM.md         # 階層フォルダー仕様
│   ├── UI_SPEC.md               # UI・テーマ・D&D 仕様
│   └── AI_CLASSIFICATION.md     # AI 分類ロジック
├── public/
│   └── icons/                   # 拡張機能アイコン (16, 48, 128px)
├── src/
│   ├── background/
│   │   └── service-worker.ts    # メッセージハンドラー・タブ保存・分類
│   ├── popup/
│   │   ├── index.html
│   │   ├── main.tsx
│   │   └── Popup.tsx            # 保存ボタン + 管理ページへのリンク
│   ├── newtab/
│   │   ├── index.html
│   │   ├── main.tsx
│   │   └── App.tsx              # メインレイアウト・状態管理
│   ├── pages/
│   │   ├── Dashboard.tsx        # ホーム: フォルダー概要 + 最近追加 + ランキング
│   │   └── FolderView.tsx       # フォルダー内ブックマーク一覧 + D&D
│   ├── components/
│   │   ├── Sidebar.tsx          # 階層フォルダーツリー + D&D + CRUD
│   │   ├── BookmarkCard.tsx     # ブックマーク1件のカード（ドラッグ可能）
│   │   ├── SearchBar.tsx        # 検索 + エクスポート / インポート + テーマ切替
│   │   ├── RankingWidget.tsx    # よく見るサイト TOP5
│   │   ├── RecentWidget.tsx     # 最近追加ブックマーク
│   │   └── ThemeToggle.tsx      # ダーク / ライト切替ボタン
│   └── shared/
│       ├── types.ts             # 全型定義
│       ├── categories.ts        # デフォルトフォルダー定義 + ドメインルール + ツリーヘルパー
│       ├── storage.ts           # chrome.storage.local CRUD ヘルパー
│       ├── categorizer.ts       # Nano AI → ルールベース 分類ロジック
│       └── ThemeContext.tsx      # React Context によるテーマ管理
├── manifest.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
└── package.json
```

---

## 4. コーディング規約

### TypeScript / React

- 関数コンポーネント + React Hooks のみ（class component 禁止）
- Props は `interface Props {}` で定義。`FC<Props>` は使わず `function Component(props: Props)` 形式
- `any` 型の使用禁止。`unknown` + 型ガードを使う
- 非同期処理は `async/await`（Promise チェーン禁止）
- エラーは `try/catch` でハンドリングし、`console.error` 出力 + フォールバック

### ファイル命名

- コンポーネント: PascalCase（`BookmarkCard.tsx`）
- ユーティリティ: camelCase（`storage.ts`）
- 型定義: camelCase（`types.ts`）

### スタイリング

- 全スタイルは Tailwind CSS のユーティリティクラスのみ。CSS ファイルへの直接記述は `global.css` の `@layer base` 内に限定
- ダーク / ライト対応は `dark:` プレフィックスで記述（例: `bg-white dark:bg-surface-800`）
- カスタムカラーは `surface-*` 系のみ `tailwind.config.js` に定義

### chrome.storage.local

- 直接アクセス禁止。必ず `src/shared/storage.ts` のヘルパー経由で操作
- ストレージキーは `"clickbook_data"` 1つに統一

### セキュリティ

- `innerHTML` / `dangerouslySetInnerHTML` 使用禁止（XSS 対策）
- 外部 URL を開く場合は `window.open(url, "_blank", "noopener,noreferrer")`
- URL スキーム検証: `http://` または `https://` のみ保存可能
- API Key 等の機密情報はコードにハードコードしない
- インポート JSON のバリデーション: `Array.isArray(data.bookmarks)` を必ず検証

---

## 5. 実装フェーズ

> 各フェーズ内のタスクは上から順に実装すること。
> 前フェーズの完了が次フェーズの前提条件となる。

### Phase 1 — プロジェクト基盤

| # | ファイル | タスク |
|---|---|---|
| 1 | `package.json` | 依存関係定義 + `npm install` |
| 2 | `vite.config.ts` | popup / newtab / service-worker エントリー設定 |
| 3 | `manifest.json` | MV3 マニフェスト作成 |
| 4 | `tailwind.config.js` | `darkMode: "class"` + `surface-*` カスタムカラー |
| 5 | `postcss.config.js` | Tailwind + Autoprefixer |
| 6 | `tsconfig.json` | strict + パスエイリアス `@/*` |
| 7 | `src/styles/global.css` | Tailwind ディレクティブ + ベーススタイル |
| 8 | `src/shared/types.ts` | → DATA_MODEL.md 参照 |
| 9 | `src/shared/categories.ts` | → FOLDER_SYSTEM.md 参照 |

### Phase 2 — コア機能

| # | ファイル | タスク |
|---|---|---|
| 10 | `src/shared/storage.ts` | Bookmark CRUD + Folder CRUD + Export/Import |
| 11 | `src/shared/categorizer.ts` | → AI_CLASSIFICATION.md 参照 |
| 12 | `src/background/service-worker.ts` | 全メッセージハンドラー + タブ保存 |

### Phase 3 — テーマ

| # | ファイル | タスク |
|---|---|---|
| 13 | `src/shared/ThemeContext.tsx` | React Context + localStorage 永続化 |
| 14 | `src/components/ThemeToggle.tsx` | Sun/Moon アイコン切替ボタン |

### Phase 4 — Popup UI

| # | ファイル | タスク |
|---|---|---|
| 15 | `src/popup/index.html` | エントリー HTML |
| 16 | `src/popup/main.tsx` | React マウント |
| 17 | `src/popup/Popup.tsx` | 保存ボタン（重複警告）+ 管理ページリンク |

### Phase 5 — 管理ページ

| # | ファイル | タスク |
|---|---|---|
| 18 | `src/newtab/index.html` | エントリー HTML |
| 19 | `src/newtab/main.tsx` | React マウント + ThemeProvider |
| 20 | `src/newtab/App.tsx` | → UI_SPEC.md 参照 |
| 21 | `src/components/Sidebar.tsx` | → UI_SPEC.md + FOLDER_SYSTEM.md 参照 |
| 22 | `src/components/BookmarkCard.tsx` | → UI_SPEC.md 参照 |
| 23 | `src/components/SearchBar.tsx` | → UI_SPEC.md 参照 |
| 24 | `src/pages/Dashboard.tsx` | → UI_SPEC.md 参照 |
| 25 | `src/components/RecentWidget.tsx` | → UI_SPEC.md 参照 |
| 26 | `src/components/RankingWidget.tsx` | → UI_SPEC.md 参照 |
| 27 | `src/pages/FolderView.tsx` | → UI_SPEC.md 参照 |

### Phase 6 — Drag & Drop

| # | ファイル | タスク |
|---|---|---|
| 28 | `Sidebar.tsx` | フォルダー間 D&D（フォルダーを別の親へ移動） |
| 29 | `BookmarkCard.tsx` | ブックマークをドラッグ可能にする |
| 30 | `FolderView.tsx` | ブックマークを別フォルダーへドロップ |

### Phase 7 — エクスポート / インポート

| # | ファイル | タスク |
|---|---|---|
| 31 | `SearchBar.tsx` | JSON エクスポート / HTML エクスポート / JSON インポート |

---

## 6. 検証チェックリスト

- [ ] `npm run build` でエラーなくビルド完了
- [ ] Chrome 拡張管理画面 (`chrome://extensions`) でパッケージ読み込み成功
- [ ] 拡張アイコンクリック → Popup 表示 → 保存ボタンでアクティブタブ保存
- [ ] 保存されたブックマークが正しいフォルダーに分類される
- [ ] 重複 URL 保存時に警告メッセージが表示される
- [ ] `chrome://` や `about:blank` など内部 URL は保存拒否される
- [ ] 管理ページでダッシュボード（最近追加 + ランキング + フォルダー概要）が表示される
- [ ] サイドバーでフォルダーをクリック → 該当フォルダーのブックマーク一覧が表示される
- [ ] サブフォルダー作成 → 親フォルダーの下にネストされる
- [ ] フォルダーリネーム → サイドバーに即反映
- [ ] フォルダー削除 → 中のブックマークが「その他」へ移動
- [ ] ブックマークカードをフォルダーへドラッグ&ドロップ → フォルダー変更が保存される
- [ ] フォルダーを別のフォルダーへドラッグ&ドロップ → 階層変更が保存される
- [ ] 検索バーでタイトル・URL の絞り込みが即時反映される
- [ ] ダーク / ライトテーマ切替が即時反映され、リロード後も維持される
- [ ] JSON エクスポート → ファイルがダウンロードされる
- [ ] JSON インポート → 全データが復元される
- [ ] デフォルトフォルダー（8種）は削除不可

---

## 7. スコープ外（将来の拡張候補）

- Chrome Sync（`chrome.storage.sync`）によるデバイス間同期
- ブラウザ履歴との連携
- タグ機能
- 共有・公開機能
- 外部 AI API（OpenAI / Gemini API）連携の設定画面
- OGP 画像の自動取得（Content Script 経由）
- ブックマークの並び替え（日時 / タイトル / 訪問回数）
- フォルダーのアイコン・カラー変更 UI
