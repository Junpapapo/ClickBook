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

// AI 객체 및 모델 인스턴스 획득 (환경별 호환성 통합 및 가짜 감지 방지)
async function getAIModel() {
  try {
    const glob = (typeof window !== "undefined" ? window : (typeof self !== "undefined" ? self : globalThis)) as any;
    
    // 1. 최신 표준인 ai.languageModel 우선 확인
    let lm = glob.ai?.languageModel;
    
    // 2. 없으면 구형/실험적 LanguageModel 확인
    if (!lm && typeof glob.LanguageModel !== "undefined") {
      lm = glob.LanguageModel;
    }

    if (!lm || typeof lm.create !== "function") return null;

    // 3. Capabilities API 가 있다면 엄격하게 체크
    if (typeof lm.capabilities === "function") {
      try {
        const caps = await lm.capabilities();
        if (!caps || caps.available === "no") return null;
      } catch (e) {
        // 호출 실패 시, 크롬 환경이 아니면 가짜일 확률 높음
        if (!glob.chrome) return null;
      }
    } else {
      // capabilities 가 없는데 크롬 환경도 아니면 OFF 로 판단 (false positive 방지)
      if (!glob.chrome) return null;
    }

    return lm;
  } catch (e) {
    return null;
  }
}

// AI 가 이용 가능한지 확인 (UI 표시용)
export async function isAIAvailable(): Promise<boolean> {
  const lm = await getAIModel();
  return !!lm;
}

// Chrome Gemini Nano で分類を試みる
async function classifyWithNano(
  url: string,
  title: string
): Promise<string | null> {
  try {
    const lm = await getAIModel();
    if (!lm) return null;

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
    return null;
  }
}

// 사용자의 서술형 검색어를 핵심 키워드 리스트로 확장 (시맨틱 검색 보조)
export async function expandSearchQuery(query: string): Promise<string[]> {
  if (!query.trim() || query.length < 2) return [];
  try {
    const lm = await getAIModel();
    if (!lm) return [query];

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
    const lm = await getAIModel();
    if (!lm) return [];

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

    // JSON 추출
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
    } catch (parseErr) { /* ignore */ }
    return [];
  } catch (err) {
    return [];
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

