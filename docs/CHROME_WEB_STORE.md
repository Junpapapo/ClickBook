# Chrome ウェブストア登録ガイド

## 1. 事前準備

### 開発者アカウント

- [ ] [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) にログイン
- [ ] 初回のみ **登録料 $5（一回限り）** を支払う
- [ ] デベロッパー名・メールアドレスを登録

### ビルド成果物

- [ ] `npm run build` で `dist/` を生成
- [ ] `dist/` フォルダーを **ZIP 圧縮**（`dist.zip` 等）
  ```bash
  cd dist && zip -r ../clickbook.zip . && cd ..
  ```
- [ ] ZIP に `manifest.json` がルート直下にあることを確認

---

## 2. ストア掲載情報

### 基本情報

| 項目 | 内容 |
|---|---|
| **拡張機能名** | ClickBook |
| **概要（132文字以内）** | Save, organize, and manage bookmarks by category with one click. Includes browsing data cleanup tools. |
| **詳細説明** | 下記参照 |
| **カテゴリ** | Productivity（生産性向上） |
| **言語** | 英語 / 日本語 / 韓国語 |

### 詳細説明（ストア掲載用ドラフト）

```
ClickBook — Smart Bookmark Manager

Save any tab with a single click. ClickBook automatically categorizes your bookmarks into folders using Chrome's built-in AI (Gemini Nano) or rule-based fallback.

✦ Features:
• One-click save — Click the extension icon to instantly bookmark the current tab
• AI auto-categorization — Automatically sorts bookmarks into the best folder
• AI bulk reorganize — Re-classify all bookmarks at once with automatic backup
• Hierarchical folders — Unlimited nesting with emoji icons, drag & drop reordering
• Pattern snapshots — Save and restore your entire bookmark + folder layout
• Chrome bookmark sync — Import, export, and sync with Chrome's native bookmarks
• Memo notes — Attach colored sticky notes to any bookmark
• Bulk import — Save all open tabs or paste multiple URLs at once
• Export/Import — JSON and HTML export with timestamped filenames
• Visit ranking — Track your most-visited bookmarks
• Browsing data cleanup — Clear cache, cookies, history, and more
• Dark / Light theme — Toggle with one click
• Multi-language — English, Japanese, Korean

✦ Privacy:
• 100% offline — All data stored locally via chrome.storage.local
• No external servers — Zero network requests, no analytics, no tracking
• Your data never leaves your browser

✦ Keyboard shortcut:
• Alt+S — Save current tab instantly
```

### アイコン・スクリーンショット

| 素材 | 仕様 | 状態 |
|---|---|---|
| **ストアアイコン** | 128×128 PNG | ✅ `public/icons/icon128.png` を使用可 |
| **スクリーンショット** | 1280×800 または 640×400 PNG/JPEG（1〜5枚） | ❌ **要作成** |
| **プロモーション用タイル（小）** | 440×280 PNG（任意） | ✅ `docs/promo_small_440x280.png` |
| **プロモーション用タイル（大）** | 920×680 PNG（任意） | ✅ `docs/promo_large_920x680.png` |
| **マーキー画像** | 1400×560 PNG（任意） | ✅ `docs/promo_marquee_1400x560.png` |

#### スクリーンショット撮影ガイド

最低 1 枚、推奨 3〜5 枚:

1. **ポップアップ画面** — ワンクリック保存の様子
2. **ダッシュボード全体** — フォルダーツリー＋ブックマーク一覧
3. **AI 自動分類** — 分類結果が表示されている状態
4. **メモ機能** — カラーメモが付いたブックマーク
5. **ダークモード** — ダーク表示の全体画面

---

## 3. プライバシー関連

### プライバシーへの取り組み（Developer Dashboard で入力）

| 質問 | 回答 |
|---|---|
| **単一目的の説明** | ブックマークの保存・整理・管理を行う拡張機能 |
| **個人情報の収集** | **しない** |
| **データの販売** | **しない** |
| **データの利用目的以外の使用** | **しない** |
| **リモートコードの使用** | **しない** |

### 権限の正当性説明（審査で問われた場合）

| 権限 | 用途 |
|---|---|
| `activeTab` | ユーザーがアイコンをクリックした際に、現在のタブの URL・タイトルを取得して保存する |
| `storage` | ブックマーク・フォルダー・設定・パターンをローカルに保存する |
| `tabs` | 全タブの一括インポート機能で、開いているすべてのタブ情報を取得する |
| `bookmarks` | Chrome ネイティブブックマークのインポート・エクスポート・同期を行う |
| `browsingData` | ユーザーが明示的に操作するブラウジングデータクリーンアップ機能を提供する |

### プライバシーポリシー

`browsingData` や `bookmarks` 等の機密権限を使用しているため、プライバシーポリシーの URL が求められる。
本リポジトリのルートに `PRIVACY_POLICY.md` を作成済み。

#### 公開方法

| 方法 | 手順 | URL 例 |
|---|---|---|
| **① GitHub リポジトリ（最も手軽）** | リポジトリを public にして Markdown の URL を貼る | `https://github.com/USERNAME/ClickBook/blob/main/PRIVACY_POLICY.md` |
| **② GitHub Pages（より正式）** | Settings → Pages で公開。HTML 版を用意するとベスト | `https://USERNAME.github.io/ClickBook/privacy-policy.html` |
| **③ 外部サービス** | Notion 公開ページ、Google Sites 等で無料ホスティング | 任意の URL |

> **おすすめ: 方法①** — Chrome ウェブストアは GitHub の Markdown URL でも受け付ける。
> リポジトリが private の場合は方法②か③を使うこと。

#### 手順（方法①の場合）

1. GitHub にリポジトリを push（public）
2. `PRIVACY_POLICY.md` が含まれていることを確認
3. Developer Dashboard の「プライバシーポリシー」欄に以下を入力:
   ```
   https://github.com/USERNAME/ClickBook/blob/main/PRIVACY_POLICY.md
   ```
4. `USERNAME` を自分の GitHub ユーザー名に置換

---

## 4. 提出チェックリスト

### 必須

- [ ] ZIP ファイル（`dist/` を圧縮）
- [ ] ストアアイコン 128×128
- [ ] スクリーンショット 1〜5 枚（1280×800 or 640×400）
- [ ] 詳細説明テキスト
- [ ] カテゴリ選択
- [ ] 言語設定
- [ ] プライバシーへの取り組み入力
- [ ] 単一目的の説明

### 推奨

- [ ] プライバシーポリシー URL
- [ ] プロモーション用タイル画像
- [ ] 多言語ストア掲載（日本語・韓国語の説明文）

---

## 5. 公開後

- [ ] 審査完了まで通常 **数時間〜数日**
- [ ] リジェクトされた場合はメールで理由が届くので修正して再提出
- [ ] バージョン更新時は `manifest.json` の `version` を上げて再度 ZIP をアップロード
- [ ] 現在の version: `0.1.0` → 正式公開時は `1.0.0` に変更を推奨

---

## 6. よくあるリジェクト理由と対策

| 理由 | 対策 |
|---|---|
| 権限が過剰 | `<all_urls>` は削除済み ✅ |
| 説明が不十分 | 詳細説明に全機能を記載 ✅ |
| スクリーンショットなし | **要作成** |
| プライバシーポリシー不備 | 上記テンプレートで作成 |
| 単一目的でない | 「ブックマーク管理 + 付随するクリーンアップ機能」として説明 |
