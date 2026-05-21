# ClickBook

> **1クリックでタブを保存し、AIが自動でフォルダーへ分類する Chrome 拡張機能**
> **A Chrome extension that saves tabs with 1-click and auto-categorizes them using AI**

[English version](./README.md) | [日本語版](./README.ja.md) | [한국어판](./README.ko.md)

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

---

## ライセンス

MIT
