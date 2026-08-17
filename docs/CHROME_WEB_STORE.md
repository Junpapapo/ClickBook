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

#### English Description
```text
🚀 Tired of messy bookmarks? 
Stop organizing manually. Meet ClickBook.
Powered by built-in on-device AI, ClickBook locally transforms your browser into a highly organized digital brain—keeping your data entirely private.

  By leveraging Google Chrome's built-in AI (Gemini Nano), ClickBook automatically reads, analyzes, and
  categorizes your web content—without sending a single byte of data to external servers.

  ---
  🌟 SMART AI FEATURES

  🧠 Gemini Nano AI Auto-Sorting
  • Harnesses local 'window.ai' to analyze URLs and titles instantly.
  • Categorizes bookmarks into 8 smart folders: Technology, Design, Business, Entertainment, Science, Sports, Travel, and Other.

  🧹 AI Duplicate Cleaner
  • Identify and clean up redundant or similar bookmarks using semantic analysis. Keep your workspace lean and relevant.

  📝 AI Memo Copilot & Clipper
  • Smart Highlight: Right-click any text to save it as an AI-refined memo.
  • Note Assistant: AI automatically drafts summaries and suggests actionable "TODO" items from your saved pages.

  ---
  ⚡ PRODUCTIVITY SUITE

  ✅ Integrated Todo Board
  • Manage tasks with a Kanban-style board.
  • Get real-time overdue alerts via the browser badge and system notifications.

  📖 Distraction-Free Reader Mode
  • Read bookmarked pages in a clean, customizable environment (Light/Sepia/Dark).
  • Features a dynamic Table of Contents and "Save to Memo" capability.

  🗺️ Visual Bookmark Map
  • Visualize your digital archive with a node-link diagram. Discover connections between your saved resources. 

  📂 Tab Group Mastery
  • Save entire Chrome Tab Groups into folders with one click.
  • Restore folders back into native, color-coded Chrome Tab Groups instantly.

  ---
  🔒 PRIVACY & PERFORMANCE FIRST

   1. 100% Offline & Private: No external API keys, no network requests, and zero server logins.
      Everything—including the AI—runs locally on your machine.
   2. FTS Body Search: Ultra-fast full-text search across titles, tags, and even the scraped body content of
      your pages.
   3. Smart Tab Suspender: Automatically suspends inactive tabs to save up to 90% of RAM, keeping your browser fast.
   4. Privacy Session Sweeper: Designate "Secure Folders" to automatically shred cookies and history when closing sensitive tabs.

  ---
  🛠️ HOW TO ENABLE CHROME BUILT-IN AI (GEMINI NANO)

  To unlock the automated AI features, ensure your Google Chrome (v127+) is set up for local AI:
   1. Go to chrome://flags/#optimization-guide-on-device-model -> Set to "Enabled (BypassPrefRequirement)".     
   2. Go to chrome://flags/#prompt-api-for-gemini-nano -> Set to "Enabled".
   3. Relaunch Chrome. The browser will download the model automatically!
  (Note: A rule-based smart fallback system is active if Gemini Nano is not yet ready.)

  ---
  Bring order to your browser chaos. Install ClickBook today and experience the future of digital knowledge management!
```

#### 日本語版説明 (※文章の途中での改行なし)
```text
🚀 煩雑なブックマークにお悩みですか？
手動での整理はもう不要です。ClickBookにお任せください。
内蔵されたオンデバイスAIを搭載したClickBookは、データを完全にプライベートに保ちながら、ブラウザを高度に整理されたデジタル脳へとローカルで変換します。

  Google Chromeの内蔵AI（Gemini Nano）を活用することで、外部サーバーにデータを1バイトも送信することなく、ウェブコンテンツを自動的に読み取り、分析し、分類します。

  ---
  🌟 スマートなAI機能

  🧠 Gemini Nano AI自動分類
  • ローカルの「window.ai」を利用して、URLとタイトルを瞬時に分析します。
  • ブックマークを「技術」、「デザイン」、「ビジネス」、「エンターテインメント」、「科学」、「スポーツ」、「旅行」、「その他」の8つのスマートフォルダに自動的に分類します。

  🧹 AI重複クリーナー
  • セマンティック分析を利用して、重複または類似したブックマークを特定しクリーンアップします。ワークスペースを常に軽量かつ適切に維持します。

  📝 AIメモコパイロット＆クリッパー
  • スマートハイライト：ウェブページ上の任意のテキストを右クリックするだけで、AIが洗練したメモとして保存します。
  • ノートアシスタント：保存したページからAIが要約を自動で下書きし、実行可能な「TODO」項目を提案します。

  ---
  ⚡ 生産性スイート

  ✅ 統合Todoボード
  • カンバン方式のボードでタスクを管理します。
  • ブラウザバッジやシステム通知を介して、リアルタイムで期限超過のアラートを受け取れます。

  📖 集中できる読書モード
  • 広告や煩雑なレイアウトのない、クリーンでカスタマイズ可能な環境（ライト/セピア/ダーク）でブックマークしたページを読めます。
  • 動的な目次（TOC）生成と「メモへ保存」機能を備えています。

  🗺️ ビジュアルブックマークマップ
  • フォルダとブックマークの構造をインタラクティブなノードリンク図で視覚化し、保存したリソース間のつながりを発見できます。

  📂 タブグループ同期
  • ワンクリックでChromeのタブグループ全体をフォルダに保存します。
  • フォルダの色や名前を維持したまま、Chromeの純正タブグループとして即座に復元します。

  ---
  🔒 プライバシー＆パフォーマンス優先

   1. 100%オフライン＆プライベート：外部APIキーやネットワークリクエスト、サーバーログインは一切不要です。AIを含むすべてがローカルマシン上で動作します。
   2. FTS本文検索：タイトル、タグ、さらにはスクラップしたページの本文コンテンツ全体を対象に、超高速な全文検索を実行します。
   3. スマートタブサスペンダー：非アクティブなタブを自動的に一時停止してメモリ（RAM）消費量を最大90%削減し、ブラウザの高速動作を維持します。
   4. プライバシーセッションシュレッダー：機密性の高いフォルダを「保護フォルダ」に指定することで、タブを閉じた際にクッキーや履歴を自動で完全に消去します。

  ---
  🛠️ CHROME内蔵AI（GEMINI NANO）の有効化方法

  自動化されたAI機能を利用するには、Google Chrome（v127以降）がローカルAI用に設定されていることを確認してください。
   1. chrome://flags/#optimization-guide-on-device-model にアクセスし、「Enabled (BypassPrefRequirement)」に設定します。
   2. chrome://flags/#prompt-api-for-gemini-nano にアクセスし、「Enabled」に設定します。
   3. Chromeを再起動します。ブラウザが自動的にモデルをダウンロードします。
  （注意：Gemini Nanoの準備が整っていない場合は、ルールベースのスマートなフォールバックシステムが動作します。）

  ---
  ブラウザの乱雑さを解消しましょう。今すぐClickBookをインストールして、未来のデジタルナレッジ管理を体験してください！
```

#### 한국어판 설명
```text
🚀 복잡한 북마크 때문에 고민이신가요?
더 이상 수동으로 정리하지 마세요. ClickBook이 해결해 드립니다.
기기 내장 로컬 AI를 탑재한 ClickBook은, 데이터를 완전히 안전하게 보관하면서 귀하의 브라우저를 스마트하게 정리된 디지털 지식 창고로 변화시킵니다.

  Google Chrome의 내장 AI(Gemini Nano)를 활용하여 외부 서버로 단 1바이트의 데이터도 전송하지 않고 웹페이지 콘텐츠를 자동으로 읽고, 분석하고, 분류합니다.

  ---
  🌟 스마트 AI 기능

  🧠 Gemini Nano AI 자동 분류
  • 로컬 기기의 'window.ai'를 활용하여 URL과 제목을 실시간으로 분석합니다.
  • 북마크를 기술, 디자인, 비즈니스, 엔터테인먼트, 과학, 스포츠, 여행, 기타 등 8개의 스마트 폴더로 자동 분류합니다.

  🧹 AI 중복 클리너
  • AI 기반 유사성 분석을 통해 중복되거나 유사한 북마크를 감지하고 정리하여 워크스페이스를 항상 쾌적하게 유지합니다.

  📝 AI 메모 코파일럿 & 클리퍼
  • 스마트 하이라이트: 웹페이지 텍스트를 드래그한 후 우클릭 메뉴를 통해 저장하면 AI가 요약한 고품질 메모가 즉시 저장됩니다.
  • 노트 어시턴트: 저장된 페이지의 내용을 분석해 AI가 요약을 작성하고 실행 가능한 할 일(TODO) 목록을 알아서 생성해 줍니다.

  ---
  ⚡ 생산성 도구 세트

  ✅ 통합 Todo 보드
  • 칸반(Kanban) 스타일의 보드로 할 일을 편리하게 관리합니다.
  • 브라우저 배지 및 시스템 알림을 통해 할 일 마감일 초과 알림을 실시간으로 받습니다.

  📖 오프라인 몰입형 독서 모드
  • 광고나 난잡한 레이아웃이 제거된 깔끔한 화면(라이트/세피아/다크 테마)에서 글자 크기와 폰트를 변경하며 기사를 읽을 수 있습니다.
  • 본문 구조를 분석한 자동 목차(TOC)와 '메모로 즉시 저장' 기능을 지원합니다.

  🗺️ 비주얼 북마크 맵
  • 전체 폴더와 북마크의 구조를 시각적인 마인드맵 형태로 감상하고 리소스 간의 연결 고리를 손쉽게 탐색합니다.

  📂 탭 그룹 완벽 동기화
  • 현재 열려 있는 Chrome 순정 탭 그룹을 한 번에 클릭북 폴더로 백업합니다.
  • 폴더 메뉴에서 색상과 이름을 그대로 유지한 채 Chrome 순정 탭 그룹으로 즉시 재생성 및 복원합니다.

  ---
  🔒 프라이버시 및 성능 최우선

   1. 100% 오프라인 & 로컬 동작: 외부 API 키나 네트워크 요청, 가입 절차가 전혀 필요하지 않습니다. AI를 포함한 모든 기능이 오직 로컬 환경에서만 안전하게 실행됩니다.
   2. FTS 본문 기반 전체 검색: 제목, 주소, 태그뿐만 아니라 백그라운드에 저장된 웹페이지 본문 전체 텍스트를 대상으로 초고속 검색 기능을 지원합니다.
   3. 스마트 탭 절전 모드: 오디오 재생 탭 등은 제외하고 사용하지 않는 백그라운드 탭을 일시 정지시켜 메모리(RAM) 소모량을 최대 90% 아낍니다.
   4. 개인정보 세션 파쇄기: '보안 폴더'로 지정된 탭을 닫으면 연동된 사이트의 쿠키, 로컬스토리지, 캐시, 방문 흔적을 흔적 없이 자동 소거합니다.

  ---
  🛠️ Chrome 내장 AI (Gemini Nano) 활성화 방법

  자동화된 AI 기능을 사용하려면 Google Chrome(v127 이상) 브라우저가 다음과 같이 설정되어 있어야 합니다:
   1. chrome://flags/#optimization-guide-on-device-model 페이지 접속 -> Set to "Enabled (BypassPrefRequirement)"
   2. chrome://flags/#prompt-api-for-gemini-nano 페이지 접속 -> Set to "Enabled"
   3. 크롬을 완전히 재시작하면 브라우저가 AI 모델을 자동으로 다운로드합니다.
  (※ AI를 아직 사용할 수 없는 환경인 경우, 규칙 기반의 스마트 폴백 시스템이 즉시 안전하게 작동합니다.)

  ---
  브라우저의 혼란을 끝내세요. 지금 ClickBook을 설치하고 혁신적인 개인 지식 관리를 경험해 보세요!
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
