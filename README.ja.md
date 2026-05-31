# ClickBook

> **1クリックでタブを保存し、AIが自動でフォルダーへ分類する Chrome 拡張機能**
> **A Chrome extension that saves tabs with 1-click and auto-categorizes them using AI**

[English version](./README.md) | [日本語版](./README.ja.md) | [한국어판](./README.ko.md)

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/junpa)

## 日本語版

Chrome Manifest V3 で構築したブックマーク管理ツール。拡張アイコンをクリックするだけでアクティブタブを即時保存し、Chrome 内蔵 AI（Gemini Nano）またはルールベースフォールバックにより自動分類します。管理は専用ダッシュボードタブで行います。

---

## スクリーンショット

| Popup | 管理ダッシュボード |
|---|---|
| 拡張アイコンクリックで即時保存 | 専用タブで階層フォルダー管理 |

---

## 特徴

| # | 特徴 | 説明 |
|---|---|---|
| 1 | **1クリック保存** | 拡張アイコンクリック → アクティブタブを即時保存 |
| 2 | **AI 自動分類** | Chrome Gemini Nano（`window.ai`）で URL・タイトルを解析し最適なフォルダーへ振り分け |
| 3 | **AI 自動整理** | サイドバーの「AI自動整理」ボタンで全登録サイトを一括再分類（実行前にパターンバックアップを自動保存） |
| 4 | **自動タグ付け** | タグのないブックマークに AI が自動でタグを生成・保存。AI 利用不可時はドメイン/タイトルベースのルールタグにフォールバック |
| 5 | **タスクコントロールセンター** | バックグラウンド AI タスク（AI自動整理・自動タグ付け）をリアルタイムで一画面管理。進捗バー表示、AI 同時実行 1 件制限（Concurrency Guard）、完了 3 秒後に自動削除、失敗は手動解除まで維持 |
| 6 | **AI タグクラウド** | 折りたたみ可能なインタラクティブ HSL タグクラウド。タグフィルタリング、重複タグのマージ、インラインタグ編集、タグクラウドページのヘッダーから直接自動タグ付けも実行可能 |
| 7 | **階層フォルダー** | 無限ネスト対応。作成・ネーム・移動・削除・絵文字アイコン設定可能 |
| 8 | **Drag & Drop** | ブックマーク ➡ フォルダー、フォルダー ➡ フォルダーの直感的な移動 |
| 9 | **パターン保存** | 現在のフォルダー＋ブックマーク構成をスナップショットとして保存・復元 |
| 10 | **Chrome ブックマーク連携** | Chrome ブックマークのインポート・エクスポート・同期 |
| 11 | **ダーク / ライトテーマ** | トグルで切り替え。`localStorage` で永続化 |
| 12 | **完全オフライン** | `chrome.storage.local` による完全ローカル動作（外部サーバー不要） |
| 13 | **多言語対応** | Chrome i18n API により英語・韓国語・日本語に完全対応 |
| 14 | **AI ハイライト切り取り (Premium)** | ウェブページをドラッグして右クリックすると、ローカル AI がユーザーのブラウザ言語に合わせて要約したマルチリンガルメモを自動保存 |
| 15 | **スマートタブセーバー (Premium)** | 非アクティブなバックグラウンドタブを自動的に一時停止（スリープ）して、RAM を最大 90% 節約（オーディオ再生タブなどは保護、ホバーで自動復元対応） |
| 16 | **タブグループの双方向同期 (Premium)** | アクティブな Chrome タブグループをフォルダにワンクリックでバックアップし、逆に ClickBook フォルダを名前とカラーを維持したまま Chrome 純正タブグループに即座に復元 |
| 17 | **個人情報保護セッション自動消去 (Premium)** | 機密・金融などのフォルダを「保護フォルダー」に指定すると、タブを閉じた瞬間にそのドメインのクッキー・キャッシュ・ローカルストレージ・履歴を完全自動消去 |
| 18 | **FTS 本文全文検索 (Premium)** | ブックマーク保存時にバックグラウンドで本文を抽出・広告クリーニングして保存し、空白区切りの多重ワード（AND）による超高速全文リアルタイム一致検索を提供 |
| 19 | **オフライン読書 & Zen リーダー (Premium)** | 広告やノイズのない洗練された専用読書ビューワー。長文メモ用 Zen Reader モードも搭載。ライト/セピア/ダークテーマ、フォント/サイズ変更、自動抽出目次（TOC）ナビゲーション、スクロール進捗バー完備 |
| 20 | **AI クリーナー** | AIによる重複検出で、重複したブックマークを見つけて整理します。 |
| 21 | **ビジュアルブックマークマップ** | フォルダとブックマークの全体構造を、インタラクティブなノードベースのマインドマップ形式で表示します。 |
| 22 | **トレンドランキング** | GitHubのトレンドリポジトリ、Hugging Faceモデル、Hacker News、Wikipediaのトレンドを確認できるダッシュボードを内蔵。 |
| 23 | **生産性ボード** | かんばん方式のTODOボードとメモ管理システムを統合。 |
| 24 | **AI サイト推薦** | Chrome Gemini Nanoを活用し、キーワードに基づくスマートなサイト推薦機能を提供します。 |

---

## 技術スタック

| 区分 | 技術 | バージョン |
|---|---|---|
| UI | React | 18.x |
| 言語 | TypeScript | 5.x（strict mode） |
| スタイル | Tailwind CSS | 3.x（`darkMode: "class"`） |
| Build Tool | Vite | 5.x |
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
├── docs/
│   └── TASK_CONTROL_CENTER.md # タスクコントロールセンター設計ドキュメント
├── public/
│   ├── _locales/              # 多言語メッセージフォルダ (en, ko, ja)
│   ├── icons/                 # 拡張アイコン (16/48/128px)
│   ├── help.html              # ヘルプページ (英語)
│   ├── help.ko.html           # ヘルプページ (韓国語)
│   ├── help.ja.html           # ヘルプページ (日本語)
│   └── privacy.html           # プライバシーポリシーページ
├── src/
│   ├── background/
│   │   └── service-worker.ts  # MV3 バックグラウンド（AI自動整理・自動タグ付けポートハンドラー）
│   ├── components/
│   │   ├── Sidebar.tsx        # 階層フォルダーツリー + AI整理(80%) + 自動タグ(20%) ボタン + タスクコントロールメニュー
│   │   ├── BookmarkCard.tsx   # ブックマークカード（D&D 対応）
│   │   ├── BookmarkEditPanel.tsx
│   │   ├── ChromeBookmarkPanel.tsx
│   │   ├── PatternBar.tsx     # パターン保存・復元バー
│   │   ├── RankingWidget.tsx
│   │   ├── RecentWidget.tsx
│   │   ├── SearchBar.tsx
│   │   └── ThemeToggle.tsx
│   ├── newtab/
│   │   ├── App.tsx            # 管理ダッシュボード（専用タブ）+ ページルーティング
│   │   ├── index.html
│   │   └── main.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx      # ホーム画面（全ブックマーク一覧）
│   │   ├── FolderView.tsx     # フォルダー別ビュー
│   │   ├── TagBoard.tsx       # AI タグクラウド・タグフィルター・マージ・自動タグ付け
│   │   ├── TaskControlPage.tsx # タスクコントロールセンター — AI タスクリアルタイムモニター
│   │   ├── TodoBoard.tsx      # カンバン式 TODO ボード
│   │   ├── MemoBoard.tsx      # メモ管理ボード
│   │   ├── BookmarkMap.tsx    # ビジュアルブックマークマップ
│   │   ├── GitHubRanking.tsx  # GitHub トレンド
│   │   ├── HFRanking.tsx      # Hugging Face AI トレンド
│   │   ├── HNRanking.tsx      # Hacker News トレンド
│   │   └── WikiRanking.tsx    # Wikipedia トレンド
│   ├── popup/
│   │   ├── Popup.tsx          # 拡張アイコンクリック時の小パネル
│   │   ├── index.html
│   │   └── main.tsx
│   └── shared/
│       ├── categories.ts      # デフォルトフォルダー定義・ドメインルール
│       ├── categorizer.ts     # AI 分類ロジック（Gemini Nano + ルールベース）
│       ├── storage.ts         # chrome.storage.local CRUD
│       ├── types.ts           # 型定義（TaskItem 含む）
│       ├── useTaskQueue.ts    # タスクキュー React フック（Concurrency Guard・自動削除）
│       ├── i18n.ts            # 翻訳辞書（EN / JA / KO）
│       ├── LanguageContext.tsx
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
git clone https://github.com/Junpapapo/ClickBook.git
cd ClickBook

# 依存関係をインストール
npm install

# 本番ビルド（dist/ が生成される）
npm run build

# 開発モード（ファイル変更を監視してリビルド）
npm run dev
```

### Chrome への読み込み

1. Chrome で `chrome://extensions` を開く
2. 右上の **デベロッパーモード** を有効化
3. **パッケージ化されていない拡張機能を読み込む** をクリック
4. ビルドで生成された `dist/` フォルダを選択

---

## AI 機能

### AI 自動整理

サイドバーの **「AI自動整理」** ボタン（80% 幅）をクリックすると、3 段階パイプラインで全ブックマークを再分類します:

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

### 自動タグ付け

サイドバーの **自動タグ** ボタン（アイコンのみ、20% 幅）またはタグクラウドページヘッダーのボタンをクリックすると、タグのないブックマークに自動でタグを付与します:

```
autoTag(bookmark)
    │
    ├─ 1. generateSummaryAndTags() — Gemini Nano でタグ生成
    │      └─ タグ返却 → updateBookmark() でストレージに保存
    │      └─ タグなし / 失敗 ↓
    │
    └─ 2. generateFallbackTags() — ドメインマップ + タイトルキーワード抽出
           └─ タグ返却 → updateBookmark() でストレージに保存
```

### タスクコントロールセンター

サイドバーの **「Task Control」** メニューで開きます。全 AI バックグラウンドタスクをここで管理します:

- **Concurrency Guard**: AI タスクは同時 1 件のみ実行。追加タスクはキュー登録
- **リアルタイム進捗**: `chrome.runtime.connect` ポートメッセージによるリアルタイム更新
- **自動削除**: 完了タスクは 3 秒後に自動消滅
- **エラー維持**: 失敗タスクは手動解除またはリトライするまで表示維持

---

## デフォルトフォルダー（8 カテゴリ）

| ID | 名前 | 例 |
|---|---|---|
| `technology` | テクノロジー | GitHub, Stack Overflow, MDN |
| `design` | デザイン | Figma, Dribbble, Behance |
| `business` | ビジネス | Notion, Slack, LinkedIn |
| `entertainment` | エンタメ | YouTube, Netflix, Twitch |
| `science` | サイエンス | arXiv, PubMed, Nature |
| `sports` | スポーツ | ESPN, BBC Sport |
| `travel` | トラベル | Booking.com, Airbnb |
| `other` | その他 | 上記に該当しないサイト |

---

## お問い合わせ・サポート

ご質問、ご提案、またはバグ報告がある場合は、以下のチャネルをご利用ください。

- [GitHub Issues](https://github.com/Junpapapo/ClickBook/issues): バグ報告や機能提案。
- [GitHub Discussions](https://github.com/Junpapapo/ClickBook/discussions): 一般的な質問やコミュニティの対話。
- メール: [junpapapo@gmail.com](mailto:junpapapo@gmail.com)

---

## ライセンス

MIT
