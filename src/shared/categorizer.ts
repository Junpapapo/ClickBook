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

// ── AI 환경 설정 ─────────────────────────────────────────
// 최초 실행 시 실제 세션을 열어 자동 체크 → 결과 저장
// 이후에는 팝업에서 수동으로 ON/OFF 전환 가능
// 설정값은 chrome.storage.local("clickbook_ai_enabled")에 저장
// ─────────────────────────────────────────────────────────

const AI_ENABLED_KEY = "clickbook_ai_enabled";

/** 글로벌 객체에서 languageModel 참조를 가져옴 (경량) */
export async function getAIModel() {
  try {
    const glob = (typeof window !== "undefined" ? window : (typeof self !== "undefined" ? self : globalThis)) as any;
    let lm = glob.ai?.languageModel;
    if (!lm && typeof glob.LanguageModel !== "undefined") {
      lm = glob.LanguageModel;
    }
    if (!lm || typeof lm.create !== "function") return null;
    return lm;
  } catch {
    return null;
  }
}

/** 실제로 세션을 열고 간단한 프롬프트를 보내서 AI 사용 가능 여부를 검증 */
export async function verifyAISession(): Promise<boolean> {
  try {
    const lm = await getAIModel();
    if (!lm) return false;

    const session = await Promise.race([
      (lm.create as (opts: unknown) => Promise<{ prompt: (s: string) => Promise<string>; destroy: () => void }>)({
        systemPrompt: "Reply with OK only.",
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000)),
    ]);

    const response = await Promise.race([
      session.prompt("ping"),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000)),
    ]);
    session.destroy();

    return !!response && response.trim().length > 0;
  } catch {
    return false;
  }
}

/**
 * AI 사용이 활성화되어 있는지 확인
 * - 최초 (값 없음): 실제 세션으로 자동 체크하여 결과 저장
 * - 이후: 저장된 수동 설정값 반환
 */
export async function isAIAvailable(): Promise<boolean> {
  try {
    const result = await chrome.storage.local.get(AI_ENABLED_KEY);

    // 이미 설정값이 있으면 그대로 반환 (수동 설정 우선)
    if (result[AI_ENABLED_KEY] !== undefined) {
      return result[AI_ENABLED_KEY] === true;
    }
  } catch {
    return false;
  }

  // 최초 실행: AI 객체 주입 대기 후 실제 테스트
  if (typeof window !== "undefined") {
    await new Promise(r => setTimeout(r, 300));
  }

  const available = await verifyAISession();

  // 결과 저장 (이후 수동 토글의 초기값이 됨)
  try {
    await chrome.storage.local.set({ [AI_ENABLED_KEY]: available });
  } catch { /* 무시 */ }

  return available;
}

/** AI 활성화 상태를 설정 */
export async function setAIEnabled(enabled: boolean): Promise<void> {
  await chrome.storage.local.set({ [AI_ENABLED_KEY]: enabled });
}

// Chrome Gemini Nano で分類を試みる
async function classifyWithNano(
  url: string,
  title: string
): Promise<string | null> {
  try {
    const lm = await getAIModel();
    if (!lm) return null;

    const session = await (lm.create as (opts?: unknown) => Promise<{ prompt: (s: string) => Promise<string>; destroy: () => void }>)();

    const promptText = `System: You are a URL categorizer. Given a URL and page title, respond with exactly ONE category ID from this list:
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

URL: ${url}
Title: ${title}`;

    const response: string = await session.prompt(promptText);
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

    const session = await (lm.create as (opts?: unknown) => Promise<{ prompt: (s: string) => Promise<string>; destroy: () => void }>)();

    const promptText = `System: You are a search assistant. Given a user's natural language query, extract 5-8 core keywords, synonyms, and related terms in both English and the user's language. 
Output ONLY a JSON array of strings. No markdown, no conversational text.

User query: "${query}"`;

    const response: string = await session.prompt(promptText);
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

    const session = await (lm.create as (opts?: unknown) => Promise<{ prompt: (s: string) => Promise<string>; destroy: () => void }>)();

    const promptText = `System: You are a helpful assistant. Your task is to recommend top websites for a given keyword.
You MUST output ONLY a valid JSON array of objects. Each object must have "title" and "url" keys.
Do not include any explanations, markdown code blocks, or conversational text.

Task: Provide exactly ${count} popular websites for the keyword "${keyword}".
Output format: [{"title": "...", "url": "..."}]
Output:`;

    const response: string = await session.prompt(promptText);
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

// 북마크에 대한 1~2줄 요약 및 3개의 핵심 키워드(태그) 생성
export async function generateSummaryAndTags(
  url: string,
  title: string,
  description: string
): Promise<{ summary?: string; tags?: string[] }> {
  try {
    const { clickbook_ai_enabled } = await chrome.storage.local.get("clickbook_ai_enabled");
    if (clickbook_ai_enabled === false) return {};

    const lm = await getAIModel();
    if (!lm) return {};

    const session = await (lm.create as (opts?: unknown) => Promise<{ prompt: (s: string) => Promise<string>; destroy: () => void }>)();

    const promptText = `Task: Summarize the given webpage.
Provide a 1-2 sentence summary (in the same language as the title) and exactly 3 broad keyword tags (ALWAYS in English, lowercase).
Output ONLY a valid JSON object. No markdown, no conversational text.
Format: {"summary": "...", "tags": ["tag1", "tag2", "tag3"]}

URL: ${url}
Title: ${title}
Description: ${description}
Output:`;

    const response = await session.prompt(promptText);
    session.destroy();

    let jsonStr = response.trim();
    const startIdx = jsonStr.indexOf("{");
    const endIdx = jsonStr.lastIndexOf("}");
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      jsonStr = jsonStr.substring(startIdx, endIdx + 1);
    }

    const parsed = JSON.parse(jsonStr);
    return {
      summary: parsed.summary,
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 3) : undefined,
    };
  } catch (err) {
    console.warn("AI summary failed:", err);
    return {};
  }
}


