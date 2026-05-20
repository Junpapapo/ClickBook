# ClickBook

> **1クリックでタブを保存し、AIが自動でフォルダーへ分類する Chrome 拡張機能**
> **A Chrome extension that saves tabs with 1-click and auto-categorizes them using AI**

[English version below](#english-version) | [日本語版](#日本語版)

## 日本語版

Chrome Manifest V3 で構築したブックマーク管理ツール。拡張アイコンをクリックするだけでアクティブタブを即時保存し、Chrome 内蔵 AI（Gemini Nano）またはルールベースフォールバックにより 8 カテゴリへ自動振り分けする。管理は専用ダッシュボードタブで行う。

---

## スクリーンショット

| Popup | 管理ダッシュボード |
|---|---|
| 拡張アイコンクリックで即時保存 | 専用タブで階層フォルダー管理 |

---

## 特徴

| # | 機能 | 説明 |
|---|---|---|
| 1 | **1クリック保存** | 拡張アイコンクリック → アクティブタブを即時保存 |
| 2 | **AI 自動分類** | Chrome Gemini Nano（`window.ai`）で URL・タイトルを解析し最適なフォルダーへ振り分け |
| 3 | **AI 自動整理** | サイドバーの「AI自動整理」ボタンで全登録サイトを一括再分類（実行前にパターンバックアップを自動保存） |
| 4 | **階層フォルダー** | 無限ネスト対応。作成・リネーム・移動・削除・絵文字アイコン設定 |
| 5 | **Drag & Drop** | ブックマーク → フォルダー、フォルダー → フォルダー の直感的な移動 |
| 6 | **パターン保存** | 現在のフォルダー＋ブックマーク構成をスナップショットとして保存・復元 |
| 7 | **Chrome ブックマーク連携** | Chrome ブックマークのインポート・エクスポート・同期 |
| 8 | **ダーク / ライトテーマ** | トグルで切り替え。`localStorage` で永続化 |
| 9 | **完全オフライン** | `chrome.storage.local` による完全ローカル動作（外部サーバー不要） |

---

## 技術スタック

| 区分 | 技術 | バージョン |
|---|---|---|
| UI | React | 18.x |
| 言語 | TypeScript | 5.x（strict mode） |
| スタイル | Tailwind CSS | 3.x（`darkMode: "class"`） |
| ビルド | Vite | 5.x |
| 拡張機能ビルド | vite-plugin-web-extension | 4.x |
| アイコン | lucide-react | 0.400.x |
| Manifest | Chrome Manifest V3 | — |
| ストレージ | chrome.storage.local | 上限 10MB |
| AI | Chrome Gemini Nano | `window.ai.languageModel`（実験的 API） |
| D&D | HTML5 Drag and Drop API | ライブラリ不使用 |

---

## ディレクトリ構成

```
ClickBook/
├── manifest.json              # Chrome 拡張機能マニフェスト (MV3)
├── vite.config.ts             # Vite + vite-plugin-web-extension 設定
├── tailwind.config.js
├── tsconfig.json
├── public/
│   └── icons/                 # 拡張アイコン (16/48/128px)
├── src/
│   ├── background/
│   │   └── service-worker.ts  # MV3 バックグラウンド。全メッセージハンドラー
│   ├── components/
│   │   ├── Sidebar.tsx        # 階層フォルダーツリー + AI自動整理ボタン
│   │   ├── BookmarkCard.tsx   # ブックマークカード（D&D 対応）
│   │   ├── BookmarkEditPanel.tsx
│   │   ├── ChromeBookmarkPanel.tsx
│   │   ├── PatternBar.tsx     # パターン保存・復元バー
│   │   ├── RankingWidget.tsx
│   │   ├── RecentWidget.tsx
│   │   ├── SearchBar.tsx
│   │   └── ThemeToggle.tsx
│   ├── newtab/
│   │   ├── App.tsx            # 管理ダッシュボード（専用タブ）
│   │   ├── index.html
│   │   └── main.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx      # ホーム画面（全ブックマーク一覧）
│   │   └── FolderView.tsx     # フォルダー別ビュー
│   ├── popup/
│   │   ├── Popup.tsx          # 拡張アイコンクリック時の小パネル
│   │   ├── index.html
│   │   └── main.tsx
│   └── shared/
│       ├── categories.ts      # デフォルトフォルダー定義・ドメインルール
│       ├── categorizer.ts     # AI 分類ロジック（Gemini Nano + ルールベース）
│       ├── storage.ts         # chrome.storage.local CRUD
│       ├── types.ts           # 型定義・メッセージ型
│       ├── ThemeContext.tsx
│       └── useDialog.tsx      # 確認ダイアログフック
└── docs/
    ├── GUIDELINES.md          # 開発ガイドライン
    ├── DATA_MODEL.md          # 型定義・ストレージ設計
    ├── FOLDER_SYSTEM.md       # 階層フォルダー仕様
    ├── UI_SPEC.md             # UI・レイアウト仕様
    └── AI_CLASSIFICATION.md   # AI 分類仕様
```

---

## セットアップ

### 前提条件

- **Node.js** 18 以上
- **Google Chrome** 最新版（AI 機能を使う場合は Canary 推奨）

### インストール・ビルド

```bash
# リポジトリをクローン
git clone https://github.com/your-name/clickbook.git
cd clickbook

# 依存関係をインストール
npm install

# 本番ビルド（dist/ が生成される）
npm run build

# 開発モード（ファイル変更を監視してリビルド）
npm run dev
```

### Chrome への読み込み

1. Chrome で `chrome://extensions` を開く
2. 右上の「デベロッパー モード」をオン
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. ビルドで生成された `dist/` フォルダーを選択

---

## AI 自動整理（重要機能）

### 概要

サイドバーの「**AI自動整理**」ボタンをクリックすると、登録済みの全ブックマークを AI が再分類して最適なフォルダーへ移動します。

### 分類フロー（1ブックマーク保存時）

```
categorize(url, title, domain)
    │
    ├─ 1. Chrome Gemini Nano で分類（window.ai.languageModel）
    │      └─ 成功 → フォルダー ID を返す
    │      └─ 失敗 / 利用不可 ↓
    │
    ├─ 2. ルールベース（ドメインパターンマッチ）
    │      └─ 一致 → フォルダー ID を返す
    │      └─ 不一致 ↓
    │
    └─ 3. "other"（フォールバック）
```

### AI 自動整理フロー（一括）

```
「AI自動整理」ボタンクリック
    │
    ├─ 確認ダイアログ表示
    │
    ├─ 現在の状態をパターン（バックアップ）として自動保存
    │   例: "AI整理バックアップ 2026/05/20 14:30"
    │
    ├─ Gemini Nano セッションを1つ作成（全ブックマークで再利用）
    │
    ├─ 各ブックマークに AI 分類を実行（差分のみ移動）
    │
    └─ 完了通知（移動件数・バックアップパターン名を表示）
```

> **注意**: Gemini Nano は Chrome の実験的 API です。
> 利用不可の場合、ボタンは自動的に無効化（"利用不可" バッジ表示）されます。

### Gemini Nano とは

Chrome に**内蔵**されたオンデバイス AI モデルです。以下の特徴があります：

- 外部サーバーへの通信なし — **完全ローカル推論**
- API キー・課金不要
- `window.ai.languageModel` API（Chrome 組み込み）でアクセス
- 利用不可の場合はルールベース分類に**自動フォールバック**

### Gemini Nano を有効にする

1. **Chrome Canary** をインストール（推奨）  
   通常版 Chrome でも有効化できる場合があります。
   ```
   https://www.google.com/chrome/canary/
   ```

2. フラグ ① を開き **Enabled BypassPerfRequirement** に設定
   ```
   chrome://flags/#optimization-guide-on-device-model
   ```

3. フラグ ② を開き **Enabled** に設定
   ```
   chrome://flags/#prompt-api-for-gemini-nano
   ```

4. Chrome を再起動後、モデルのダウンロードを確認
   ```
   chrome://components
   ```
   「Optimization Guide On Device Model」のバージョンが `0.0.0.0` の場合は「アップデートを確認」をクリック。モデルは数百 MB あるためダウンロードに時間がかかることがあります。

5. DevTools（F12） Console で利用可否を確認
   ```javascript
   (await window.ai.languageModel.capabilities()).available
   // "readily"      → 利用可能（ClickBook の AI ボタンが有効化される）
   // "after-download" → モデルダウンロード中。しばらく待つ
   // "no"           → フラグ未設定または非対応バージョン
   ```

---

## デフォルトフォルダー（8カテゴリ）

| ID | 表示名 | 対象サイト例 |
|---|---|---|
| `technology` | テクノロジー | GitHub, Stack Overflow, MDN |
| `design` | デザイン | Figma, Dribbble, Behance |
| `business` | ビジネス | Notion, Slack, LinkedIn |
| `entertainment` | エンタメ | YouTube, Netflix, Twitch |
| `science` | サイエンス | arXiv, PubMed, Nature |
| `sports` | スポーツ | ESPN, BBC Sport |
| `travel` | トラベル | Booking.com, Airbnb |
| `other` | その他 | 上記に該当しないもの |

---

## 主要メッセージ一覧（Service Worker）

| メッセージ | 説明 |
|---|---|
| `SAVE_TAB` | アクティブタブを保存（AI 分類つき） |
| `GET_ALL_DATA` | 全データ（ブックマーク＋フォルダー）を取得 |
| `ADD_BOOKMARK` | ブックマークを手動追加 |
| `DELETE_BOOKMARK` | ブックマーク削除 |
| `MOVE_BOOKMARK` | ブックマークをフォルダーへ移動 |
| `UPDATE_BOOKMARK` | ブックマーク情報を更新 |
| `CREATE_FOLDER` | フォルダーを作成 |
| `RENAME_FOLDER` | フォルダーをリネーム |
| `MOVE_FOLDER` | フォルダーを別の親フォルダーへ移動 |
| `DELETE_FOLDER` | フォルダーを削除（子も再帰的に削除） |
| `SAVE_PATTERN` | 現在の状態をパターンとして保存 |
| `LOAD_PATTERN` | パターンを復元 |
| `DELETE_PATTERN` | パターンを削除 |
| `AI_REORGANIZE` | 全ブックマークを AI で一括再分類（バックアップ自動保存） |
| `SYNC_TO_CHROME` | Chrome ブックマークへ差分同期 |

---

## 開発ドキュメント

詳細仕様は `docs/` フォルダーを参照してください。

| ドキュメント | 内容 |
|---|---|
| [GUIDELINES.md](docs/GUIDELINES.md) | 開発全体の方針・規約・フェーズ計画 |
| [DATA_MODEL.md](docs/DATA_MODEL.md) | 型定義・ストレージ設計・メッセージング仕様 |
| [FOLDER_SYSTEM.md](docs/FOLDER_SYSTEM.md) | 階層フォルダーの設計・CRUD・ツリー構築 |
| [UI_SPEC.md](docs/UI_SPEC.md) | レイアウト・コンポーネント・テーマ・D&D 仕様 |
| [AI_CLASSIFICATION.md](docs/AI_CLASSIFICATION.md) | Gemini Nano・ルールベース分類・ドメインパターン |

---

## ライセンス

MIT

---

## English Version

A Chrome Manifest V3 extension for bookmark management. Save active tabs instantly by clicking the extension icon, and let Chrome's built-in AI (Gemini Nano) or rule-based fallback categorize them into 8 default folders. Manage your bookmarks in a dedicated dashboard tab.

### Features
1. **One-click save**: Instantly save the active tab by clicking the extension icon.
2. **AI Auto-Categorization**: Uses Chrome Gemini Nano (`window.ai`) to parse URL/Title and sort into the best folder.
3. **AI Bulk Reorganize**: Re-classify all saved bookmarks at once with an automatic backup snapshot.
4. **Hierarchical Folders**: Infinite nesting, creation, renaming, moving, and emoji icon setting.
5. **Drag & Drop**: Intuitive Drag & Drop for reordering bookmarks and folders.
6. **Pattern Snapshots**: Save and restore your entire folder/bookmark layout as a snapshot.
7. **Chrome Bookmark Sync**: Import, export, and sync with Chrome native bookmarks.
8. **Dark / Light Theme**: Toggle via UI, persists in `localStorage`.
9. **Fully Offline**: All operations use `chrome.storage.local` with zero external server dependencies.

### Installation
1. Clone the repository and run `npm install`.
2. Build the project using `npm run build`.
3. Load the generated `dist/` directory in Chrome via `chrome://extensions` -> "Load unpacked".

### License
MIT
