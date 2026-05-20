import { DOMAIN_RULES, DEFAULT_FOLDER_ID } from "./categories";

// ============================================================
// カテゴリ自動分類ロジック
// 優先順位: Chrome Gemini Nano → ルールベース → "other"
// ============================================================

const CATEGORY_IDS = [
  "technology",
  "design",
  "business",
  "entertainment",
  "science",
  "sports",
  "travel",
  "other",
] as const;

type CategoryId = (typeof CATEGORY_IDS)[number];

export type ClassifyMethod = "ai" | "rules" | "fallback";

export type ClassifyResult = {
  folderId: string;
  method: ClassifyMethod;
};

function isValidCategoryId(value: string): value is CategoryId {
  return CATEGORY_IDS.includes(value as CategoryId);
}

// ルールベース分類（サブドメイン対応）
function classifyByDomain(domain: string): string {
  const normalized = domain.replace(/^www\./, "");
  if (DOMAIN_RULES[normalized]) return DOMAIN_RULES[normalized];
  // サブドメインを順に除去して親ドメインで再チェック
  const parts = normalized.split(".");
  for (let i = 1; i < parts.length - 1; i++) {
    const parent = parts.slice(i).join(".");
    if (DOMAIN_RULES[parent]) return DOMAIN_RULES[parent];
  }
  return DEFAULT_FOLDER_ID;
}

// Chrome Gemini Nano で分類を試みる（Service Worker 対応: self.ai を使用）
async function classifyWithNano(
  url: string,
  title: string
): Promise<string | null> {
  try {
    const glob = (self as any) ?? (globalThis as any);
    const lm = glob.ai?.languageModel || glob.LanguageModel;
    if (!lm || typeof lm.create !== "function") return null;

    const session = await (lm.create as (opts: unknown) => Promise<{ prompt: (s: string) => Promise<string>; destroy: () => void }>)({
      systemPrompt: `You are a URL categorizer. Given a URL and page title, respond with exactly ONE category ID from this list:
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

Respond with only the category ID, nothing else.`,
    });

    const response: string = await session.prompt(
      `URL: ${url}\nTitle: ${title}`
    );
    const trimmed = response.trim().toLowerCase();
    session.destroy();

    return isValidCategoryId(trimmed) ? trimmed : null;
  } catch (err) {
    console.warn("Operation failed:", err);
    return null;
  }
}

// AI が利用可能かどうかを確認（Popup/Newtab から呼び出し用）
export function isAIAvailable(): boolean {
  try {
    const w = (typeof window !== "undefined" ? window : self) as any;
    const lm = w.ai?.languageModel || w.LanguageModel;
    return !!lm && (typeof lm === "object" || typeof lm === "function");
  } catch (err) {
    console.warn("Operation failed:", err);
    return false;
  }
}

// メイン分類関数
export async function categorize(
  url: string,
  title: string,
  domain: string
): Promise<ClassifyResult> {
  // 1. Gemini Nano を試みる
  const nanoResult = await classifyWithNano(url, title);
  if (nanoResult) return { folderId: nanoResult, method: "ai" };

  // 2. ルールベースフォールバック
  const ruleResult = classifyByDomain(domain);
  const method: ClassifyMethod = ruleResult !== DEFAULT_FOLDER_ID ? "rules" : "fallback";
  return { folderId: ruleResult, method };
}

