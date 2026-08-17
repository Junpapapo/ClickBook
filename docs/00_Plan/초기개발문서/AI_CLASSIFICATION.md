# ClickBook — AI 自動分類仕様

> 実装者向け: `src/shared/categorizer.ts` に実装する分類ロジックと、
> ドメインパターンマッチのルールベースフォールバックを定義する。

---

## 1. 分類フロー

ブックマーク保存時、Service Worker 内で以下の優先順位で分類を実行する。

```
categorize(url, title, domain) → folderId (string)
    │
    ├─ 1. Chrome Gemini Nano (window.ai.languageModel)
    │     利用可能 → URL + タイトルを渡してフォルダー ID を返す
    │     ↓ 失敗 or 利用不可
    │
    ├─ 2. ルールベース（ドメインパターンマッチ）
    │     domain がテーブルに一致 → 対応するフォルダー ID を返す
    │     ↓ 一致なし
    │
    └─ 3. "other" を返す（フォールバック）
```

**重要**: 分類結果は常にデフォルトフォルダーの ID（`"technology"`, `"design"`, ... `"other"`）を返す。
ユーザー作成フォルダーへの自動分類は行わない（手動 D&D で移動）。

---

## 2. Chrome Gemini Nano

### 2.1 API アクセス

```typescript
// Service Worker はグローバル window がないため、self を使用
const ai = (self as unknown as Record<string, unknown>).ai;

// または Service Worker では利用不可の場合がある。
// その場合は即座にルールベースへフォールバック
```

**注意**: `window.ai` は Chrome Canary の実験的 API。
Service Worker コンテキストでは `window` が存在しないため、
`globalThis.ai` または `self.ai` でアクセスを試みる。
利用不可なら `null` を返してフォールバック。

### 2.2 利用可能判定

```typescript
if (!ai || typeof ai.languageModel?.create !== "function") {
  return null; // → ルールベースへ
}
```

### 2.3 プロンプト設計

**システムプロンプト:**
```
You are a URL categorizer. Given a URL and page title, respond with exactly ONE category ID from this list:
technology, design, business, entertainment, science, sports, travel, other

Rules:
- technology: programming, software, developer tools, cloud services, IT news
- design: UI/UX, graphics, fonts, creative tools, illustration
- business: productivity, CRM, project management, finance, career
- entertainment: video, music, streaming, games, social media
- science: research, academia, journals, papers, medicine
- sports: sports news, teams, athletes, fitness
- travel: hotels, flights, tourism, maps, local guides
- other: anything that does not clearly fit above

Respond with only the category ID, nothing else.
```

**ユーザー入力:**
```
URL: {url}
Title: {title}
```

**期待出力:** カテゴリ ID のみ（1単語）。例: `technology`

### 2.4 レスポンスバリデーション

```typescript
const VALID_IDS = ["technology","design","business","entertainment","science","sports","travel","other"];

const trimmed = response.trim().toLowerCase();
if (VALID_IDS.includes(trimmed)) {
  return trimmed;
} else {
  return null; // → ルールベースへ
}
```

### 2.5 セッション管理

```typescript
const session = await ai.languageModel.create({ systemPrompt: "..." });
const response = await session.prompt("URL: ...\nTitle: ...");
session.destroy(); // 必ず破棄
```

### 2.6 エラーハンドリング

全体を `try/catch` で囲み、例外発生時は `null` を返す。
```typescript
async function classifyWithNano(url: string, title: string): Promise<string | null> {
  try {
    // ... 上記の処理
  } catch {
    return null;
  }
}
```

---

## 3. ルールベース分類

### 3.1 ドメイン正規化

```typescript
const normalized = domain.replace(/^www\./, "");
```

`www.github.com` → `github.com` に統一。

### 3.2 ドメインパターンテーブル

`DOMAIN_RULES: Record<string, string>` として `categories.ts` に定義する。

#### Technology
```
github.com, gitlab.com, stackoverflow.com, dev.to,
npmjs.com, vercel.com, netlify.com, codepen.io,
qiita.com, zenn.dev, news.ycombinator.com,
developer.mozilla.org, docs.microsoft.com,
cloud.google.com, aws.amazon.com, medium.com
```

#### Design
```
figma.com, dribbble.com, behance.net, awwwards.com,
fonts.google.com, coolors.co, unsplash.com,
adobe.com, canva.com, pexels.com
```

#### Business
```
linkedin.com, notion.so, slack.com, zoom.us,
atlassian.com, asana.com, trello.com,
hubspot.com, salesforce.com, airtable.com
```

#### Entertainment
```
youtube.com, netflix.com, spotify.com, twitch.tv,
tiktok.com, nicovideo.jp, abema.tv,
hulu.com, disneyplus.com, reddit.com
```

#### Science
```
scholar.google.com, arxiv.org, nature.com,
pubmed.ncbi.nlm.nih.gov, researchgate.net,
sciencedirect.com, jstor.org, ieee.org
```

#### Sports
```
espn.com, nba.com, fifa.com,
baseball-reference.com, nfl.com, sportskeeda.com
```

#### Travel
```
booking.com, airbnb.com, tripadvisor.com,
expedia.com, agoda.com, jalan.net,
hotels.com, kayak.com, skyscanner.com
```

### 3.3 ルックアップ

```typescript
function classifyByDomain(domain: string): string {
  const normalized = domain.replace(/^www\./, "");
  return DOMAIN_RULES[normalized] ?? DEFAULT_FOLDER_ID;
}
```

テーブルに一致しない場合は `DEFAULT_FOLDER_ID` (`"other"`) を返す。

---

## 4. メイン関数

```typescript
export async function categorize(
  url: string,
  title: string,
  domain: string
): Promise<string> {
  // 1. Gemini Nano
  const nanoResult = await classifyWithNano(url, title);
  if (nanoResult) return nanoResult;

  // 2. ルールベース
  return classifyByDomain(domain);
}
```

---

## 5. テスト観点

実装者が手動で確認すべきケース:

| URL | 期待フォルダー | 判定元 |
|---|---|---|
| `https://github.com/facebook/react` | technology | ルールベース |
| `https://www.youtube.com/watch?v=xxx` | entertainment | ルールベース (www. 除去) |
| `https://example.com/unknown-page` | other | フォールバック |
| `https://arxiv.org/abs/2301.00001` | science | ルールベース |
| `https://my-custom-blog.com/post` | other or AI判定 | Nano → フォールバック |

---

## 6. 将来の拡張ポイント

- ユーザーが独自のドメインルールを追加できる設定 UI
- 外部 AI API（OpenAI / Gemini API）への切り替えオプション
- ブックマーク内容のスクレイピング（Content Script）で精度向上
- ユーザーの手動分類履歴を学習データとしてルール自動生成
