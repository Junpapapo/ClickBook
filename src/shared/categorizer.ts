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

    const session = await (lm.create as (opts?: unknown) => Promise<{ prompt: (s: string) => Promise<string>; destroy: () => void }>)({
      expectedOutputs: [{ type: "text", languages: ["en", "ja", "es"] }]
    });

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

    const session = await (lm.create as (opts?: unknown) => Promise<{ prompt: (s: string) => Promise<string>; destroy: () => void }>)({
      expectedOutputs: [{ type: "text", languages: ["en", "ja", "es"] }]
    });

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

    const session = await (lm.create as (opts?: unknown) => Promise<{ prompt: (s: string) => Promise<string>; destroy: () => void }>)({
      expectedOutputs: [{ type: "text", languages: ["en", "ja", "es"] }]
    });

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

    const session = await (lm.create as (opts?: unknown) => Promise<{ prompt: (s: string) => Promise<string>; destroy: () => void }>)({
      expectedOutputs: [{ type: "text", languages: ["en", "ja", "es"] }]
    });

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
    const { clickbook_ai_enabled } = await chrome.storage.local.get("clickbook_ai_enabled");
    if (clickbook_ai_enabled === false) return { draft: fallback, aiUsed: false };

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
    const { clickbook_ai_enabled } = await chrome.storage.local.get("clickbook_ai_enabled");
    if (clickbook_ai_enabled === false) return { draft: originalMemo, aiUsed: false };

    const lm = await getAIModel();
    if (!lm) return { draft: originalMemo, aiUsed: false };

    const langInstruction =
      lang === "ko" ? "반드시 한국어로 작성하세요." :
      lang === "ja" ? "必ず日本語で記述してください。" :
      "Write in English.";

    const systemPrompt = "You are a knowledgeable but extremely concise note-taking assistant. You organize memos and add useful context, but you always write in short, punchy bullet points like a cheat sheet.";

    const prompt = `Please enhance and organize the following memo.

Rules:
- Organize into clear, extremely concise bullet points (use "• " prefix).
- If the memo implies a need for information (e.g., "Japanese address system"), add a brief fact or context to help the user.
- DO NOT be overly verbose. Keep explanations to 1-2 short sentences max.
- The total output should be no more than 3-5 bullet points.
- DO NOT use conversational filler (e.g., "Here is the memo", "I understand").
- ${langInstruction}
- Output ONLY the enhanced memo text.

Original Memo:
"""
${originalMemo}
"""

Enhanced Memo:`;

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

        try {
          const session = await (lm.create as (opts?: unknown) => Promise<{ prompt: (s: string) => Promise<string>; destroy: () => void }>)({
            expectedOutputs: [{ type: "text", languages: ["en", "ja", "es"] }]
          });
          const raw: string = await session.prompt(prompt);
          session.destroy();
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
  } catch { /* AI init failed */ }

  // ── 규칙 기반 Fallback (AI 불가 시 항상 실제 분석) ──────────
  return { groups: _ruleBasedGroups(bookmarks, lang), aiUsed: false };
}