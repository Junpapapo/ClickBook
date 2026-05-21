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
    // console.warn("Operation failed:", err);
    return null;
  }
}

// 사용자의 서술형 검색어를 핵심 키워드 리스트로 확장 (시맨틱 검색 보조)
export async function expandSearchQuery(query: string): Promise<string[]> {
  if (!query.trim() || query.length < 2) return [];
  try {
    const glob = (self as any) ?? (globalThis as any);
    const lm = glob.ai?.languageModel || glob.LanguageModel;
    if (!lm || typeof lm.create !== "function") return [];

    const session = await (lm.create as (opts: unknown) => Promise<{ prompt: (s: string) => Promise<string>; destroy: () => void }>)({
      systemPrompt: `You are a search assistant. Given a user's natural language query, extract 5-8 core keywords, synonyms, and related terms in both English and the user's language. 
Output ONLY a JSON array of strings. No markdown, no conversational text.`,
    });

    const response: string = await session.prompt(
      `User query: "${query}"`
    );
    session.destroy();

    const jsonMatch = response.match(/\[[\s\S]*?\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) {
        return [...new Set([query, ...parsed.map(s => String(s).toLowerCase().trim())])];
      }
    }
    return [query];
  } catch (err) {
    return [query];
  }
}

// AI 가 키워드에 근접한 베스트 사이트 추천 (추천 검색용)
export async function recommendSites(keyword: string, count = 6): Promise<Array<{ title: string; url: string }>> {
  if (!keyword.trim()) return [];
  try {
    const glob = (self as any) ?? (globalThis as any);
    const lm = glob.ai?.languageModel || glob.LanguageModel;
    if (!lm || typeof lm.create !== "function") return [];

    const session = await (lm.create as (opts: unknown) => Promise<{ prompt: (s: string) => Promise<string>; destroy: () => void }>)({
      systemPrompt: `You are a helpful assistant. Your task is to recommend top websites for a given keyword.
You MUST output ONLY a valid JSON array of objects. Each object must have "title" and "url" keys.
Do not include any explanations, markdown code blocks, or conversational text.`,
    });

    const response: string = await session.prompt(
      `Task: Provide exactly ${count} popular websites for the keyword "${keyword}".
Output format: [{"title": "...", "url": "..."}]
Output:`
    );
    session.destroy();

    if (!response || !response.trim()) return [];

    // JSON 추출 (코드 블록이나 잡설 제거)
    let jsonStr = response.trim();
    const startIdx = jsonStr.indexOf("[");
    const endIdx = jsonStr.lastIndexOf("]");
    
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      jsonStr = jsonStr.substring(startIdx, endIdx + 1);
    }

    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        return parsed
          .filter(item => item && typeof item === "object" && item.title && item.url)
          .map(item => ({ 
            title: String(item.title).trim(), 
            url: String(item.url).trim() 
          }))
          .filter(item => item.url.startsWith("http"))
          .slice(0, count);
      }
    } catch (parseErr) {
      // 파싱 실패 시 원본 로그 (디버깅용으로 유지했다가 나중에 제거 가능)
      // console.warn("[AI Recommend] Raw:", response);
    }
    return [];
  } catch (err) {
    return [];
  }
}

// AI 가 이용 가능한지 확인 (환경별 호환성 및 안정성 강화)
export async function isAIAvailable(): Promise<boolean> {
  try {
    const glob = (typeof window !== "undefined" ? window : self) as any;
    
    // 1. AI 객체 또는 기존 LanguageModel 접근 시도
    const ai = glob.ai;
    const lm = ai?.languageModel || glob.LanguageModel;
    
    if (!lm) return false;

    // 2. Capabilities API 가 있는 경우 (최신 크롬)
    if (typeof lm.capabilities === "function") {
      try {
        const caps = await lm.capabilities();
        // 'no' 인 경우만 명확하게 이용 불가로 판단
        // 'readily', 'after-download' 모두 일단 기능을 시도해볼 수 있는 상태로 간주
        return caps.available !== "no";
      } catch (e) {
        // capabilities() 호출 자체가 실패하더라도 create 가 있다면 시도 허용
        return typeof lm.create === "function";
      }
    }

    // 3. Capabilities 는 없지만 create 가 있는 경우 (이전 버전 호환성)
    return typeof lm.create === "function";
  } catch (err) {
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

