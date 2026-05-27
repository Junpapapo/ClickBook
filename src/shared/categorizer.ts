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
        expectedOutputs: [{ type: "text", languages: ["en", "ja", "es"] }]
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

let cachedAIAvailable: boolean | null = null;

try {
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes) => {
      if (changes[AI_ENABLED_KEY]) {
        cachedAIAvailable = changes[AI_ENABLED_KEY].newValue === true;
      }
    });
  }
} catch { /* 무시 */ }

/**
 * AI 사용이 활성화되어 있는지 확인
 * - 최초 (값 없음): 실제 세션으로 자동 체크하여 결과 저장
 * - 이후: 저장된 수동 설정값 반환
 */
export async function isAIAvailable(): Promise<boolean> {
  if (cachedAIAvailable !== null) {
    return cachedAIAvailable;
  }
  try {
    const result = await chrome.storage.local.get(AI_ENABLED_KEY);

    // 이미 설정값이 있으면 그대로 반환 (수동 설정 우선)
    if (result[AI_ENABLED_KEY] !== undefined) {
      cachedAIAvailable = result[AI_ENABLED_KEY] === true;
      return cachedAIAvailable;
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

  cachedAIAvailable = available;
  return available;
}

/** AI 활성화 상태를 설정 */
export async function setAIEnabled(enabled: boolean): Promise<void> {
  cachedAIAvailable = enabled;
  await chrome.storage.local.set({ [AI_ENABLED_KEY]: enabled });
}

// Chrome Gemini Nano で分類を試みる
async function classifyWithNano(
  url: string,
  title: string
): Promise<string | null> {
  let session: any = null;
  try {
    const aiAvailable = await isAIAvailable();
    if (!aiAvailable) return null;

    const lm = await getAIModel();
    if (!lm) return null;

    session = await Promise.race([
      (lm.create as (opts?: unknown) => Promise<{ prompt: (s: string) => Promise<string>; destroy: () => void }>)({
        expectedOutputs: [{ type: "text", languages: ["en", "ja", "es"] }]
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000))
    ]);

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

    const response: string = await Promise.race([
      session.prompt(promptText),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000))
    ]);
    const trimmed = response.trim().toLowerCase();

    return isValidCategoryId(trimmed) ? trimmed : null;
  } catch (err) {
    return null;
  } finally {
    if (session && typeof session.destroy === "function") {
      try {
        session.destroy();
      } catch { /* ignore */ }
    }
  }
}

// 사용자의 서술형 검색어를 핵심 키워드 리스트로 확장 (시맨틱 검색 보조)
export async function expandSearchQuery(query: string): Promise<string[]> {
  if (!query.trim() || query.length < 2) return [];
  try {
    const aiAvailable = await isAIAvailable();
    if (!aiAvailable) return [query];
  } catch {
    return [query];
  }

  let session: any = null;
  try {
    const lm = await getAIModel();
    if (!lm) return [query];

    session = await Promise.race([
      (lm.create as (opts?: unknown) => Promise<{ prompt: (s: string) => Promise<string>; destroy: () => void }>)({
        expectedOutputs: [{ type: "text", languages: ["en", "ja", "es"] }]
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000))
    ]);

    const promptText = `System: You are a search assistant. Given a user's natural language query, extract 5-8 core keywords, synonyms, and related terms in both English and the user's language. 
Output ONLY a JSON array of strings. No markdown, no conversational text.

User query: "${query}"`;

    const response: string = await Promise.race([
      session.prompt(promptText),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000))
    ]);

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
  } finally {
    if (session && typeof session.destroy === "function") {
      try {
        session.destroy();
      } catch { /* ignore */ }
    }
  }
}

// AI 가 키워드에 근접한 베스트 사이트 추천 (추천 검색용)
export async function recommendSites(keyword: string, count = 6): Promise<Array<{ title: string; url: string }>> {
  if (!keyword.trim()) return [];
  try {
    const aiAvailable = await isAIAvailable();
    if (!aiAvailable) return [];
  } catch {
    return [];
  }

  let session: any = null;
  try {
    const lm = await getAIModel();
    if (!lm) return [];

    session = await Promise.race([
      (lm.create as (opts?: unknown) => Promise<{ prompt: (s: string) => Promise<string>; destroy: () => void }>)({
        expectedOutputs: [{ type: "text", languages: ["en", "ja", "es"] }]
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000))
    ]);

    const promptText = `System: You are a helpful assistant. Your task is to recommend top websites for a given keyword.
You MUST output ONLY a valid JSON array of objects. Each object must have "title" and "url" keys.
Do not include any explanations, markdown code blocks, or conversational text.

Task: Provide exactly ${count} popular websites for the keyword "${keyword}".
Output format: [{"title": "...", "url": "..."}]
Output:`;

    const response: string = await Promise.race([
      session.prompt(promptText),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000))
    ]);

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
  } finally {
    if (session && typeof session.destroy === "function") {
      try {
        session.destroy();
      } catch { /* ignore */ }
    }
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
    const aiAvailable = await isAIAvailable();
    if (!aiAvailable) return {};

    const lm = await getAIModel();
    if (!lm) return {};

    let session: any = null;
    try {
      session = await Promise.race([
        (lm.create as (opts?: unknown) => Promise<{ prompt: (s: string) => Promise<string>; destroy: () => void }>)({
          expectedOutputs: [{ type: "text", languages: ["en", "ja", "es"] }]
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000))
      ]);

      const promptText = `Task: Summarize the given webpage.
Provide a 1-2 sentence summary (in the same language as the title) and exactly 3 broad keyword tags (ALWAYS in English, lowercase).
Output ONLY a valid JSON object. No markdown, no conversational text.
Format: {"summary": "...", "tags": ["tag1", "tag2", "tag3"]}

URL: ${url}
Title: ${title}
Description: ${description}
Output:`;

      const response = await Promise.race([
        session.prompt(promptText),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000))
      ]);

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
    } finally {
      if (session && typeof session.destroy === "function") {
        try {
          session.destroy();
        } catch { /* ignore */ }
      }
    }
  } catch (err) {
    return {};
  }
}

// ── AI 메모 초안 생성 (AI Notes Copilot) ──────────────────

/**
 * 북마크 정보를 바탕으로 메모 초안을 생성합니다.
 * AI 사용 불가 시 summary/tags 기반 fallback 제공.
 */
export async function generateMemoDraft(
  url: string,
  title: string,
  summary: string | undefined,
  tags: string[] | undefined,
  lang: "en" | "ja" | "ko"
): Promise<{ draft: string; aiUsed: boolean }> {
  const fallback = buildFallbackDraft(title, url, summary, tags, lang);

  try {
    const aiAvailable = await isAIAvailable();
    if (!aiAvailable) return { draft: fallback, aiUsed: false };

    const lm = await getAIModel();
    if (!lm) return { draft: fallback, aiUsed: false };

    const langInstruction =
      lang === "ko" ? "반드시 한국어로 작성하세요." :
      lang === "ja" ? "必ず日本語で記述してください。" :
      "Write in English.";

    const context = [
      `Title: ${title}`,
      `URL: ${url}`,
      summary ? `Page description: ${summary}` : "",
      tags?.length ? `Topics: ${tags.join(", ")}` : "",
    ].filter(Boolean).join("\n");

    const systemPrompt = "You are a pure text transformation engine. You strictly follow formatting instructions and output ONLY the requested text without any conversational filler, pleasantries, or responses to the content.";

    const prompt = `Based on the webpage info below, write a concise memo draft.

Rules:
- 2–4 short bullet points (use "• " prefix).
- Focus on what's useful to remember or action items.
- End with an optional "📌 TODO:" line if applicable.
- ${langInstruction}
- Output ONLY the memo text. No preamble, no conversational filler (e.g., "네, 알겠습니다").

Webpage info:
"""
${context}
"""

Memo draft:`;

    const session = await (lm.create as any)({
      systemPrompt: systemPrompt
    });

    const response = await Promise.race([
      session.prompt(prompt),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 15000)),
    ]);
    session.destroy();

    const draft = response?.trim();
    if (!draft || draft.length < 10) return { draft: fallback, aiUsed: false };

    return { draft, aiUsed: true };
  } catch (err) {
    console.error("AI Generate Memo Error:", err);
    return { draft: fallback, aiUsed: false };
  }
}

/**
 * 기존 메모 내용을 바탕으로 AI가 내용을 정리하고 다듬어줍니다.
 */
export async function refineMemoDraft(
  originalMemo: string,
  lang: "en" | "ja" | "ko"
): Promise<{ draft: string; aiUsed: boolean }> {
  try {
    const aiAvailable = await isAIAvailable();
    if (!aiAvailable) return { draft: originalMemo, aiUsed: false };

    const lm = await getAIModel();
    if (!lm) return { draft: originalMemo, aiUsed: false };

    let systemPrompt = "You are an insightful and extremely concise expert note-taking assistant. You organize memos and supplement them with professional opinions, creative ideas, and useful context, using short, punchy bullet points.";
    let prompt = "";

    if (lang === "ko") {
      systemPrompt = "당신은 통찰력 있고 매우 간결한 전문 메모 작성 도우미입니다. 글머리 기호(•)를 사용하여 메모를 구성하고 전문적인 의견, 창의적인 아이디어 및 유용한 맥락을 보완합니다.";
      prompt = `다음 메모 내용을 개선하고 구조화하여 정리해 주세요.

규칙:
- 반드시 한국어(Korean)로 작성하세요. 다른 언어(영어 등)를 절대 사용하지 마십시오.
- 내용을 명확하고 매우 간결한 글머리 기호(• )로 정리하세요.
- 메모의 의도를 분석하여, 주제와 관련된 짧은 전문가 의견, 전략적 아이디어 또는 유용한 실용적 맥락을 덧붙이세요.
- 불필요하게 장황하지 않게 하십시오. 전문가 통찰은 최대 1~2개의 짧고 강력한 문장으로 한정하세요.
- 전체 출력은 3~6개의 글머리 기호로 구성되도록 하십시오.
- 대화체 서두(예: "여기에 정리된 메모가 있습니다", "이해했습니다")는 절대 출력하지 마십시오.
- 오직 개선된 메모 본문만 출력하고, 불필요한 설명은 제외하십시오.

기존 메모 내용:
"""
${originalMemo}
"""

개선된 메모:`;
    } else if (lang === "ja") {
      systemPrompt = "あなたは洞察力があり、非常に簡潔な専門メモ作成アシスタントです。箇条書き（•）を使用してメモを整理し、専門的な意見、創造的なアイデア、役立つコンテキストを補完します。";
      prompt = `以下のメモ内容を改善し、構造化して整理してください。

ルール：
- 必ず日本語で記述してください。他の言語（英語など）を絶対に使用しないでください。
- 内容を明確かつ非常に簡潔な箇条書き（• ）で整理してください。
- メモの意図を分析し、トピックに関連する短い専門家の意見、戦略的なアイデア、または実用的なコンテキストを追加してください。
- 不要に冗長にしないでください。専門的な洞察は最大1〜2文の短く効果的な文章にしてください。
- 出力全体は3〜6個の箇条書きに収めてください。
- 会話的な前置き（例：「以下は整理されたメモです」、「理解しました」など）は絶対に出力しないでください。
- 改善されたメモのテキストのみを出力し、余計な解説は除外してください。

元のメモ内容:
"""
${originalMemo}
"""

改善されたメモ:`;
    } else {
      prompt = `Please enhance and organize the following memo.

Rules:
- Organize into clear, extremely concise bullet points (use "• " prefix).
- Analyze the intent: supplement the memo with brief expert opinions, strategic ideas, or practical context relevant to the topic.
- DO NOT be overly verbose. Keep your expert insights to 1-2 short, impactful sentences max.
- The total output should be no more than 3-6 bullet points.
- DO NOT use conversational filler (e.g., "Here is the memo", "I understand").
- Write in English.
- Output ONLY the enhanced memo text.

Original Memo:
"""
${originalMemo}
"""

Enhanced Memo:`;
    }

    const session = await (lm.create as any)({
      systemPrompt: systemPrompt
    });

    const response = await Promise.race([
      session.prompt(prompt),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 15000)),
    ]);
    session.destroy();

    const draft = response?.trim();
    if (!draft || draft.length < 5) return { draft: originalMemo, aiUsed: false };

    return { draft, aiUsed: true };
  } catch (err) {
    console.error("AI Refine Error:", err);
    return { draft: originalMemo, aiUsed: false };
  }
}

function buildFallbackDraft(
  title: string,
  url: string,
  summary: string | undefined,
  tags: string[] | undefined,
  lang: "en" | "ja" | "ko"
): string {
  const lines: string[] = [];
  if (summary) {
    lines.push(`• ${summary}`);
  } else {
    try {
      const domain = new URL(url).hostname.replace(/^www\./, "");
      const domainLine =
        lang === "ko" ? `• ${domain} 에서 저장한 북마크입니다.` :
        lang === "ja" ? `• ${domain} からブックマークしたページです。` :
        `• Bookmarked from ${domain}.`;
      lines.push(domainLine);
    } catch {
      lines.push(`• ${title}`);
    }
  }
  if (tags?.length) {
    const tagLine =
      lang === "ko" ? `• 관련 주제: ${tags.join(", ")}` :
      lang === "ja" ? `• 関連トピック: ${tags.join(", ")}` :
      `• Topics: ${tags.join(", ")}`;
    lines.push(tagLine);
  }
  const todoLine =
    lang === "ko" ? "📌 TODO: 나중에 다시 확인할 것" :
    lang === "ja" ? "📌 TODO: あとで確認する" :
    "📌 TODO: Review this later";
  lines.push(todoLine);
  return lines.join("\n");
}

// ── AI 북마크 중복 그룹 검출 ──────────────────────────────

export interface DuplicateGroup {
  reason: string;
  ids: string[];
}

export interface FindDuplicateResult {
  groups: DuplicateGroup[];
  /** true = Gemini Nano 사용, false = 규칙 기반 fallback */
  aiUsed: boolean;
}

// ── 규칙 기반 fallback: 도메인 + 타이틀 Jaccard 유사도 ────

function _domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function _titleJaccard(a: string, b: string): number {
  const STOP = new Set(["the","a","an","of","in","to","for","and","or","is","are","how","what","with","on","at","using","get","use","your","you","my","we","our"]);
  const tok = (s: string) =>
    s.toLowerCase()
      .replace(/[^a-z0-9\s\uAC00-\uD7A3\u3040-\u30FF]/g, " ")
      .split(/\s+/)
      .filter(w => w.length > 2 && !STOP.has(w));
  const sa = new Set(tok(a));
  const sb = new Set(tok(b));
  if (!sa.size || !sb.size) return 0;
  const inter = [...sa].filter(w => sb.has(w)).length;
  return inter / new Set([...sa, ...sb]).size;
}

function _ruleBasedGroups(
  bookmarks: Array<{ id: string; title: string; url: string }>,
  lang: string
): DuplicateGroup[] {
  const groups: DuplicateGroup[] = [];
  const used = new Set<string>();

  // Stage 1: same domain
  const byDomain = new Map<string, Array<{ id: string; title: string; url: string }>>();
  for (const bm of bookmarks) {
    const d = _domainOf(bm.url);
    if (!byDomain.has(d)) byDomain.set(d, []);
    byDomain.get(d)!.push(bm);
  }
  for (const [domain, items] of byDomain) {
    if (items.length < 2) continue;
    const ids = items.map(b => b.id);
    const reason =
      lang === "ko" ? `동일 도메인 (${domain}) 북마크 ${items.length}개` :
      lang === "ja" ? `同じドメイン (${domain}) に ${items.length} 件` :
      `${items.length} bookmarks from the same domain (${domain})`;
    groups.push({ reason, ids });
    ids.forEach(id => used.add(id));
  }

  // Stage 2: similar titles from different domains
  const rest = bookmarks.filter(b => !used.has(b.id));
  const paired = new Set<string>();
  for (let i = 0; i < rest.length; i++) {
    for (let j = i + 1; j < rest.length; j++) {
      const a = rest[i], b = rest[j];
      if (paired.has(a.id) || paired.has(b.id)) continue;
      const sim = _titleJaccard(a.title, b.title);
      if (sim >= 0.45) {
        const pct = Math.round(sim * 100);
        const reason =
          lang === "ko" ? `유사한 주제 (제목 유사도 ${pct}%)` :
          lang === "ja" ? `類似トピック (タイトル類似度 ${pct}%)` :
          `Similar topic (title similarity ${pct}%)`;
        groups.push({ reason, ids: [a.id, b.id] });
        paired.add(a.id);
        paired.add(b.id);
      }
    }
  }

  return groups;
}

/**
 * 북마크 목록에서 의미론적으로 유사한 그룹을 반환합니다.
 *
 * - Gemini Nano 사용 가능 시: AI 분석 우선
 * - AI 불가 / 실패 시: 도메인 + 타이틀 유사도 규칙으로 fallback
 *   → 항상 실제 결과를 반환합니다 (절대 빈 배열을 silent return하지 않음)
 */
export async function findDuplicateGroups(
  bookmarks: Array<{ id: string; title: string; url: string }>,
  lang: string = "en"
): Promise<FindDuplicateResult> {
  if (bookmarks.length < 2) return { groups: [], aiUsed: false };

  // ── AI 시도 ────────────────────────────────────────────────
  try {
    const aiAvailable = await isAIAvailable();
    if (aiAvailable) {
      const lm = await getAIModel();

      if (lm) {
      const BATCH = 50;
      const all: DuplicateGroup[] = [];
      const seq2id = new Map<number, string>();
      let ok = false;

      for (let s = 0; s < bookmarks.length; s += BATCH) {
        const batch = bookmarks.slice(s, s + BATCH);
        batch.forEach((b, i) => seq2id.set(s + i + 1, b.id));

        const lines = batch.map((b, i) => `${s + i + 1}. ${b.title} | ${b.url}`).join("\n");
        const langHint =
          lang === "ko" ? "유사성 이유(reason)는 반드시 한국어로 작성하세요." :
          lang === "ja" ? "類似の理由(reason)は必ず日本語で記述してください。" :
          "Write the similarity reason in English.";

        const prompt = `System: You are an information consolidation assistant.
Given a numbered list of bookmarked page titles and URLs, identify groups of bookmarks that are HIGHLY redundant or cover the exact same technical topic.
Output ONLY a valid JSON array. No markdown, no explanations outside the JSON.
Each object: {"reason": "brief description", "ids": [seq_number, ...]}
If no similar groups exist, output: []
${langHint}

Bookmarks:
${lines}

Output:`;

        let session: any = null;
        try {
          session = await Promise.race([
            (lm.create as (opts?: unknown) => Promise<{ prompt: (s: string) => Promise<string>; destroy: () => void }>)({
              expectedOutputs: [{ type: "text", languages: ["en", "ja", "es"] }]
            }),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000))
          ]);
          const raw: string = await Promise.race([
            session.prompt(prompt),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 15000))
          ]);
          ok = true;

          let js = raw.trim();
          const si = js.indexOf("["), ei = js.lastIndexOf("]");
          if (si !== -1 && ei > si) js = js.slice(si, ei + 1);

          const parsed = JSON.parse(js);
          if (Array.isArray(parsed)) {
            for (const item of parsed) {
              if (item && typeof item.reason === "string" && Array.isArray(item.ids) && item.ids.length >= 2) {
                const ids = item.ids.map((n: number) => seq2id.get(Number(n))).filter((id): id is string => !!id);
                if (ids.length >= 2) all.push({ reason: item.reason, ids });
              }
            }
          }
        } catch { /* batch failed, skip */ }
        finally {
          if (session && typeof session.destroy === "function") {
            try {
              session.destroy();
            } catch { /* ignore */ }
          }
        }
      }

      if (ok) {
        const uniqueGroups: DuplicateGroup[] = [];
        const used = new Set<string>();
        for (const g of all) {
          const validIds = g.ids.filter(id => !used.has(id));
          if (validIds.length >= 2) {
            validIds.forEach(id => used.add(id));
            uniqueGroups.push({ reason: g.reason, ids: validIds });
          }
        }
        return { groups: uniqueGroups, aiUsed: true };
      }
    }
    }
  } catch { /* AI init failed */ }

  // ── 규칙 기반 Fallback (AI 불가 시 항상 실제 분석) ──────────
  return { groups: _ruleBasedGroups(bookmarks, lang), aiUsed: false };
}

// ── AI 유사 태그 그룹 검출 ─────────────────────────────────

export interface SimilarTagGroup {
  reason: string;
  tags: string[];          // 유사 태그 전체 목록
  suggestedMaster: string; // AI 추천 마스터 태그 (병합 대상)
}

export interface FindSimilarTagsResult {
  groups: SimilarTagGroup[];
  aiUsed: boolean;
}

// ── Rule-based: 레벤슈타인 거리 ──────────────────────────────

function _levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function _isSimilarTag(a: string, b: string): boolean {
  if (a === b) return false;
  // 레벤슈타인 거리 ≤ 2
  if (_levenshtein(a, b) <= 2) return true;
  // 공통 접두사가 두 문자열 모두의 50% 이상
  let common = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] !== b[i]) break;
    common++;
  }
  if (common >= Math.max(a.length, b.length) * 0.5 && common >= 3) return true;
  // 단수/복수 (tools ↔ tool, libraries ↔ library)
  if (a + "s" === b || b + "s" === a) return true;
  if (a.endsWith("ies") && b + "ies" === a.replace(/y$/, "ies")) return true;
  if (b.endsWith("ies") && a + "ies" === b.replace(/y$/, "ies")) return true;
  return false;
}

function _ruleBasedTagGroups(
  tags: Array<{ name: string; count: number }>,
  lang: string
): SimilarTagGroup[] {
  const groups: SimilarTagGroup[] = [];
  const used = new Set<string>();

  for (let i = 0; i < tags.length; i++) {
    if (used.has(tags[i].name)) continue;
    const similar: string[] = [tags[i].name];
    for (let j = i + 1; j < tags.length; j++) {
      if (used.has(tags[j].name)) continue;
      if (_isSimilarTag(tags[i].name, tags[j].name)) {
        similar.push(tags[j].name);
      }
    }
    if (similar.length < 2) continue;
    similar.forEach(t => used.add(t));
    // 가장 사용 빈도가 높은 태그를 마스터로 추천
    const sorted = [...similar].sort((a, b) => {
      const ca = tags.find(t => t.name === a)?.count ?? 0;
      const cb = tags.find(t => t.name === b)?.count ?? 0;
      return cb - ca;
    });
    const master = sorted[0];
    const reason =
      lang === "ko" ? `철자가 유사한 태그: ${similar.map(t => `#${t}`).join(", ")}` :
      lang === "ja" ? `スペルが類似したタグ: ${similar.map(t => `#${t}`).join(", ")}` :
      `Similar spelling: ${similar.map(t => `#${t}`).join(", ")}`;
    groups.push({ reason, tags: similar, suggestedMaster: master });
  }

  return groups;
}

/**
 * 태그 목록에서 의미론적으로 유사한 그룹을 반환합니다.
 *
 * - Gemini Nano 사용 가능 시: AI 시맨틱 분석 우선
 * - AI 불가 / 실패 시: 레벤슈타인 + 접두사 + 단수/복수 규칙으로 fallback
 */
export async function findSimilarTagGroups(
  tags: Array<{ name: string; count: number }>,
  lang: string = "en"
): Promise<FindSimilarTagsResult> {
  if (tags.length < 2) return { groups: [], aiUsed: false };

  // ── AI 시도 ────────────────────────────────────────────────
  try {
    const aiAvailable = await isAIAvailable();
    if (aiAvailable) {
      const lm = await getAIModel();
      if (lm) {
        const tagList = tags.map(t => `#${t.name} (used ${t.count}x)`).join(", ");
        const langHint =
          lang === "ko" ? "유사성 이유(reason)는 반드시 한국어로 작성하세요." :
          lang === "ja" ? "類似の理由(reason)は必ず日本語で記述してください。" :
          "Write the similarity reason in English.";

        const prompt = `System: You are a tag consolidation assistant.
Given a list of bookmark tags, identify groups of tags that are semantically similar or redundant (e.g., typos, abbreviations, synonyms, singular/plural).
Output ONLY a valid JSON array. No markdown, no explanations.
Each object: {"reason": "brief description", "tags": ["tag1", "tag2"], "suggestedMaster": "best_tag"}
- "tags": all similar tag names (without #)
- "suggestedMaster": the tag from the group that best represents the concept (consider usage count)
If no similar groups, output: []
${langHint}

Tags: ${tagList}

Output:`;

        let session: any = null;
        try {
          session = await Promise.race([
            (lm.create as (opts?: unknown) => Promise<{ prompt: (s: string) => Promise<string>; destroy: () => void }>)({
              expectedOutputs: [{ type: "text", languages: ["en", "ja", "es"] }]
            }),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000))
          ]);
          const raw: string = await Promise.race([
            session.prompt(prompt),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 15000))
          ]);

          let js = raw.trim();
          const si = js.indexOf("["), ei = js.lastIndexOf("]");
          if (si !== -1 && ei > si) js = js.slice(si, ei + 1);

          const parsed = JSON.parse(js);
          if (Array.isArray(parsed) && parsed.length >= 0) {
            const validGroups: SimilarTagGroup[] = [];
            const usedTags = new Set<string>();
            for (const item of parsed) {
              if (
                item &&
                typeof item.reason === "string" &&
                Array.isArray(item.tags) &&
                item.tags.length >= 2 &&
                typeof item.suggestedMaster === "string"
              ) {
                const validTags = item.tags
                  .map((t: unknown) => String(t).toLowerCase().trim())
                  .filter((t: string) => tags.some(tag => tag.name === t) && !usedTags.has(t));
                if (validTags.length >= 2) {
                  const master = tags.some(t => t.name === item.suggestedMaster)
                    ? item.suggestedMaster
                    : validTags[0];
                  validTags.forEach((t: string) => usedTags.add(t));
                  validGroups.push({ reason: item.reason, tags: validTags, suggestedMaster: master });
                }
              }
            }
            return { groups: validGroups, aiUsed: true };
          }
        } catch { /* AI batch failed */ }
        finally {
          if (session && typeof session.destroy === "function") {
            try { session.destroy(); } catch { /* ignore */ }
          }
        }
      }
    }
  } catch { /* AI init failed */ }

  // ── 규칙 기반 Fallback ──────────────────────────────────────
  return { groups: _ruleBasedTagGroups(tags, lang), aiUsed: false };
}