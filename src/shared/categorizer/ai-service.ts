import type { Bookmark, BookmarkMemo, Folder } from "../types";
import { CATEGORY_IDS, isValidCategoryId } from "./rules";
import type { SimilarTagGroup, FindSimilarTagsResult } from "./rules";
import { ruleBasedTagGroups } from "./rules";
import { classifyByDomain } from "./rules";
import { DEFAULT_FOLDER_ID } from "../categories";

const AI_ENABLED_KEY = "clickbook_ai_enabled";
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

export async function getAIModel() {
  try {
    const glob = (typeof window !== "undefined" ? window : (typeof self !== "undefined" ? self : globalThis)) as any;
    let lm = glob.ai?.languageModel;
    if (!lm && glob.chrome?.ai?.languageModel) {
      lm = glob.chrome.ai.languageModel;
    }
    if (!lm && glob.chrome?.aiOriginTrial?.languageModel) {
      lm = glob.chrome.aiOriginTrial.languageModel;
    }
    if (!lm && typeof glob.LanguageModel !== "undefined") {
      lm = glob.LanguageModel;
    }
    if (!lm || typeof lm.create !== "function") return null;
    return lm;
  } catch {
    return null;
  }
}

let preloadedSession: any = null;

export async function preloadAIModel(): Promise<void> {
  try {
    if (preloadedSession) return;
    const lm = await getAIModel();
    const aiAvailable = await isAIAvailable();
    if (lm && aiAvailable) {
      console.log("[AI Warmup] Preloading language model in background...");
      preloadedSession = await (lm.create as (opts: unknown) => Promise<any>)({
        systemPrompt: "You are a bookmark categorizer. Given a numbered list of bookmarks, respond with a JSON array of category IDs in the SAME ORDER. Each must be one of: technology, design, business, entertainment, science, sports, travel, other. Respond ONLY with the JSON array. Example: [\"technology\",\"other\"]",
        expectedOutputs: [{ type: "text", languages: ["en", "ja", "ko"] }],
        temperature: 0.1,
        topK: 3
      });
      console.log("[AI Warmup] Preload complete.");
    }
  } catch (err) {
    console.warn("[AI Warmup] Preload session creation failed:", err);
    preloadedSession = null;
  }
}

export async function verifyAISession(): Promise<boolean> {
  try {
    const lm = await getAIModel();
    if (!lm) return false;

    const session = await Promise.race([
      (lm.create as (opts: unknown) => Promise<{ prompt: (s: string) => Promise<string>; destroy: () => void }>)({
        systemPrompt: "Reply with OK only.",
        expectedOutputs: [{ type: "text", languages: ["en", "ja", "ko"] }]
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

export async function isAIAvailable(): Promise<boolean> {
  if (cachedAIAvailable !== null) {
    return cachedAIAvailable;
  }
  try {
    const result = await chrome.storage.local.get(AI_ENABLED_KEY);
    if (result[AI_ENABLED_KEY] !== undefined) {
      cachedAIAvailable = result[AI_ENABLED_KEY] === true;
      return cachedAIAvailable;
    }
  } catch {
    return false;
  }

  if (typeof window !== "undefined") {
    await new Promise(r => setTimeout(r, 300));
  }

  const available = await verifyAISession();
  try {
    await chrome.storage.local.set({ [AI_ENABLED_KEY]: available });
  } catch { /* 무시 */ }

  cachedAIAvailable = available;
  return available;
}

export async function setAIEnabled(enabled: boolean): Promise<void> {
  cachedAIAvailable = enabled;
  await chrome.storage.local.set({ [AI_ENABLED_KEY]: enabled });
}

export async function classifyWithNano(
  url: string,
  title: string,
  existingFolders?: Array<{ id: string; name: string; nameJa?: string; nameKo?: string }>
): Promise<string | null> {
  let session: any = null;
  try {
    const aiAvailable = await isAIAvailable();
    if (!aiAvailable) return null;

    const lm = await getAIModel();
    if (!lm) return null;

    session = await Promise.race([
      (lm.create as (opts?: unknown) => Promise<{ prompt: (s: string) => Promise<string>; destroy: () => void }>)({
        expectedOutputs: [{ type: "text", languages: ["en", "ja", "ko"] }],
        temperature: 0.1,
        topK: 3
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 15000))
    ]);

    const folderNames = existingFolders ? existingFolders.map((f) => f.nameKo || f.name) : [];
    const folderListStr = folderNames.length > 0 ? folderNames.join(", ") : CATEGORY_IDS.join(", ");

    const promptText = `System: You are a URL categorizer. Given a URL and page title, respond with exactly ONE category from this list:
${folderListStr}

CRITICAL: If the site is about games, gaming, consoles, gaming database, gaming tools, or gaming communities, and a suitable folder exists, classify it as "Entertainment" or a gaming-related folder.
Respond with only the category name from the list, nothing else. Do not add punctuation.

URL: ${url}
Title: ${title}`;

    const response: string = await Promise.race([
      session.prompt(promptText),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000))
    ]);
    const trimmed = response.trim();
    const trimmedLower = trimmed.toLowerCase();

    if (existingFolders && existingFolders.length > 0) {
      for (const f of existingFolders) {
        const names = [f.name, f.nameJa, f.nameKo].filter(Boolean) as string[];
        for (const n of names) {
          const regex = new RegExp(`\\b${n}\\b`, 'i');
          if (regex.test(trimmed) || trimmedLower.includes(n.toLowerCase())) {
            return f.id;
          }
        }
      }
    } else {
      for (const cat of CATEGORY_IDS) {
        const regex = new RegExp(`\\b${cat}\\b`, 'i');
        if (regex.test(trimmedLower)) {
          return cat;
        }
      }
    }

    const synonymMap: Record<string, string[]> = {
      technology: ["테크", "기술", "개발", "코딩", "프로그래밍", "software", "programming", "code", "it", "テクノロジー", "開発", "技術", "プログラミング"],
      design: ["디자인", "미술", "예술", "그림", "일러스트", "ui", "ux", "art", "design", "デザイン", "美術", "イラスト"],
      business: ["비즈니스", "업무", "금융", "재테크", "생산성", "career", "finance", "productivity", "commerce", "ビジネス", "業務", "金融", "生産性"],
      entertainment: ["엔터테인먼트", "엔터", "대중문화", "게임", "game", "gaming", "영화", "음악", "youtube", "유튜브", "넷플릭스", "소셜", "sns", "social", "entertainment", "エンタメ", "ゲーム", "映画", "音楽"],
      science: ["과학", "연구", "학술", "의학", "건강", "논문", "research", "science", "medicine", "health", "サイエンス", "科学", "研究", "論文", "医学"],
      sports: ["스포츠", "운동", "피트니스", "축구", "야구", "농구", "sports", "fitness", "soccer", "baseball", "sports", "スポーツ", "運動", "フィットネス"],
      travel: ["여행", "관광", "지도", "호텔", "항공", "travel", "tourism", "map", "flight", "トラベル", "旅行", "観光", "地図", "ホテル"],
      other: ["기타", "아더", "other", "その他", "雑多"]
    };

    for (const [catId, synonyms] of Object.entries(synonymMap)) {
      for (const syn of synonyms) {
        if (trimmedLower.includes(syn.toLowerCase())) {
          if (existingFolders) {
            const found = existingFolders.find((f) => f.id === catId);
            if (found) return found.id;
          }
          return catId;
        }
      }
    }

    const matchedCat = isValidCategoryId(trimmedLower) ? trimmedLower : null;
    if (matchedCat && existingFolders) {
      const found = existingFolders.find((f) => f.id === matchedCat);
      return found ? found.id : null;
    }
    return matchedCat;
  } catch (err) {
    console.error("[classifyWithNano] AI classification failed:", err);
    try {
      chrome.storage.local.set({ clickbook_ai_error: `classifyWithNano_error: ${String(err)}` });
    } catch (_) {}
    return null;
  } finally {
    if (session && typeof session.destroy === "function") {
      try {
        session.destroy();
      } catch { /* ignore */ }
    }
  }
}

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
        expectedOutputs: [{ type: "text", languages: ["en", "ja", "ko"] }],
        temperature: 0.1,
        topK: 3
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
        expectedOutputs: [{ type: "text", languages: ["en", "ja", "ko"] }],
        temperature: 0.1,
        topK: 3
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
          expectedOutputs: [{ type: "text", languages: ["en", "ja", "ko"] }],
          temperature: 0.1,
          topK: 3
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

export async function generateMemoDraft(
  url: string,
  title: string,
  summary: string | undefined,
  tags: string[] | undefined,
  lang: "en" | "ja" | "ko"
): Promise<{ draft: string; aiUsed: boolean }> {
  let detectedLang = lang;
  const textToAnalyze = `${title || ""} ${summary || ""}`;
  if (/[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(textToAnalyze)) {
    detectedLang = "ko";
  } else if (/[\u3040-\u309F\u30A0-\u30FF]/.test(textToAnalyze)) {
    detectedLang = "ja";
  }

  const fallback = buildFallbackDraft(title, url, summary, tags, detectedLang);

  try {
    const aiAvailable = await isAIAvailable();
    if (!aiAvailable) return { draft: fallback, aiUsed: false };

    const lm = await getAIModel();
    if (!lm) return { draft: fallback, aiUsed: false };

    const langInstruction =
      detectedLang === "ko" ? "반드시 한국어로 작성하세요." :
      detectedLang === "ja" ? "必ず日本語で記述してください。" :
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
      systemPrompt: systemPrompt,
      expectedOutputs: [{ type: "text", languages: ["en", "ja", "ko"] }]
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

export async function refineMemoDraft(
  originalMemo: string,
  lang: "en" | "ja" | "ko"
): Promise<{ draft: string; aiUsed: boolean }> {
  try {
    const aiAvailable = await isAIAvailable();
    if (!aiAvailable) return { draft: originalMemo, aiUsed: false };

    const lm = await getAIModel();
    if (!lm) return { draft: originalMemo, aiUsed: false };

    let detectedLang = lang;
    if (/[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(originalMemo)) {
      detectedLang = "ko";
    } else if (/[\u3040-\u309F\u30A0-\u30FF]/.test(originalMemo)) {
      detectedLang = "ja";
    }

    let systemPrompt = "You are an insightful and extremely concise expert note-taking assistant. You organize memos and supplement them with professional opinions, creative ideas, and useful context, using short, punchy bullet points.";
    let prompt = "";

    if (detectedLang === "ko") {
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
    } else if (detectedLang === "ja") {
      systemPrompt = "あなたは洞察力があり、非常に簡潔な専門メモ作成アシスタントです。箇条書き（•）を使用してメモを整理し、専門的な意見、創造的なアイデア、役立つコンテキストを補完します。";
      prompt = `以下のメモ内容を改善し、構造化して整理してください。

ルール：
- 必ず日本語で記述してください。다른 언어(영어 등)를 절대 사용하지 마세요.
- 内容を明確かつ非常に簡潔な箇条書き（• ）で整理してください。
- メモの意図を分析し、トピックに関連する短い専門家の意見、戦略的なアイデア、または実用的なコンテキストを追加してください。
- 不要に冗長にしないでください。専門的な洞察は最大1〜2文の短く効果的な文章にしてください。
- 出力全体は3〜6個の箇条書きに収めてください。
- 会話的な前置き（例：「以下は整理されたメモです」、「理解しました」など）は絶対に出力しないでください。
- 改善されたメモのテキストのみを出力し、余計な解説は除外してください。

元のメモ 내용:
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
      systemPrompt: systemPrompt,
      expectedOutputs: [{ type: "text", languages: ["en", "ja", "ko"] }]
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

export async function findSimilarTagGroups(
  tags: Array<{ name: string; count: number }>,
  lang: string = "en"
): Promise<FindSimilarTagsResult> {
  if (tags.length < 2) return { groups: [], aiUsed: false };

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
              expectedOutputs: [{ type: "text", languages: ["en", "ja", "ko"] }],
              temperature: 0.1,
              topK: 3
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

  return { groups: ruleBasedTagGroups(tags, lang), aiUsed: false };
}

// ── AI Reorganize Helper ──────────────────────────────────

const AI_REORGANIZE_CATEGORIES = new Set([
  "technology", "design", "business", "entertainment",
  "science", "sports", "travel", "other",
]);

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms))
  ]);
}

export async function reorganizeWithAI(
  bookmarks: Bookmark[],
  _maxFolderDepth = 3,
  existingFolders?: Folder[],
  onProgress?: (progress: number, detail: string) => void,
  isDisconnected?: () => boolean
): Promise<{
  moves: Map<string, string>;
  aiSuccessCount: number;
  aiTotalBatches: number;
  aiSupported: boolean;
}> {
  const result = new Map<string, string>();
  if (bookmarks.length === 0) {
    return { moves: result, aiSuccessCount: 0, aiTotalBatches: 0, aiSupported: false };
  }

  // Step 1: 도메인 룰로 전체 즉시 초기화
  for (const bm of bookmarks) {
    // Bookmark에 domain이 있으면 쓰고, 없으면 URL 파싱
    let domainVal = (bm as any).domain;
    if (!domainVal && bm.url) {
      try {
        domainVal = new URL(bm.url).hostname;
      } catch {
        domainVal = "";
      }
    }
    result.set(bm.id, classifyByDomain(domainVal || ""));
  }

  // Step 2: AI 세션 시도
  const folderHint = existingFolders && existingFolders.length > 0
    ? ` Prefer: ${existingFolders.map((f) => f.nameJa || f.name).join(", ")}.`
    : "";

  const lm = await getAIModel();
  const aiAvailable = await isAIAvailable();
  const aiSupported = !!(lm && aiAvailable);

  if (!aiSupported) {
    return { moves: result, aiSuccessCount: 0, aiTotalBatches: 0, aiSupported };
  }

  // Step 3: 배치 처리
  const BATCH_SIZE = 5;
  let aiSuccessCount = 0;
  const aiTotalBatches = Math.ceil(bookmarks.length / BATCH_SIZE);

  for (let i = 0; i < bookmarks.length; i += BATCH_SIZE) {
    if (isDisconnected && isDisconnected()) {
      break;
    }
    const batch = bookmarks.slice(i, i + BATCH_SIZE);

    if (onProgress) {
      const percent = Math.round((i / bookmarks.length) * 100);
      onProgress(percent, `${i}/${bookmarks.length}`);
    }

    let session: any = null;
    try {
      // 0. 진행 로그 추가
      try {
        const r = await chrome.storage.local.get("clickbook_ai_debug_log");
        let logs = Array.isArray(r.clickbook_ai_debug_log) ? r.clickbook_ai_debug_log : [];
        logs.push({
          timestamp: new Date().toISOString(),
          message: `[AI Organize] Batch loop start: idx ${i}, size ${batch.length}`
        });
        if (logs.length > 50) logs = logs.slice(logs.length - 50);
        await chrome.storage.local.set({ clickbook_ai_debug_log: logs });
      } catch (_) {}

      // 세션 생성 헬퍼 함수
      const createSession = async () => {
        return await withTimeout(
          (lm.create as (opts: unknown) => Promise<any>)({
            systemPrompt: `You are a bookmark categorizer. Given a numbered list of bookmarks, respond with a JSON array of category IDs in the SAME ORDER. Each must be one of: technology, design, business, entertainment, science, sports, travel, other.${folderHint} Respond ONLY with the JSON array. Example: ["technology","other"]`,
            expectedOutputs: [{ type: "text", languages: ["en", "ja", "ko"] }],
            temperature: 0.1,
            topK: 3
          }),
          25000
        );
      };

      if (i === 0 && preloadedSession) {
        console.log("[AI Organize] Reusing preloaded session for the first batch.");
        session = preloadedSession;
        preloadedSession = null;
        try {
          const r = await chrome.storage.local.get("clickbook_ai_debug_log");
          let logs = Array.isArray(r.clickbook_ai_debug_log) ? r.clickbook_ai_debug_log : [];
          logs.push({
            timestamp: new Date().toISOString(),
            message: `[AI Organize] Reused preloadedSession successfully.`
          });
          if (logs.length > 50) logs = logs.slice(logs.length - 50);
          await chrome.storage.local.set({ clickbook_ai_debug_log: logs });
        } catch (_) {}
      } else {
        try {
          session = await createSession();
        } catch (sessErr: any) {
          const sessMsg = sessErr instanceof Error ? `${sessErr.message}\n${sessErr.stack}` : String(sessErr);
          throw new Error(`Failed to create language model session: ${sessMsg}`);
        }
      }

      const lines = batch
        .map((bm, idx) => `${idx + 1}. ${bm.title} | ${bm.url}`)
        .join("\n");

      // 모델이 횡설수설하며 인사말/설명을 하지 못하도록 지시사항을 강하게 못박음
      const promptText = `Task: Categorize these ${batch.length} bookmarks.
Bookmarks to organize:
${lines}

CRITICAL RULES:
1. Respond with ONLY a valid JSON array of category strings, like: ["technology", "other", "sports"]
2. The JSON array must contain EXACTLY ${batch.length} elements, corresponding to the bookmarks above.
3. Each string must be one of: technology, design, business, entertainment, science, sports, travel, other.
4. DO NOT write any introduction (e.g., "Okay, here's the breakdown..."), explanations, code block ticks (\`\`\`), or markdown formatting.
Output JSON:`;

      // prompt 실행 로그
      try {
        const r = await chrome.storage.local.get("clickbook_ai_debug_log");
        let logs = Array.isArray(r.clickbook_ai_debug_log) ? r.clickbook_ai_debug_log : [];
        logs.push({
          timestamp: new Date().toISOString(),
          message: `[AI Organize] Sending prompt: ${promptText.slice(0, 150)}...`
        });
        if (logs.length > 50) logs = logs.slice(logs.length - 50);
        await chrome.storage.local.set({ clickbook_ai_debug_log: logs });
      } catch (_) {}

      let response: string;
      try {
        response = await withTimeout(session.prompt(promptText), 35000);
      } catch (promptErr: any) {
        console.warn("[AI Organize] First prompt try failed, attempting session recreate & retry:", promptErr);
        try {
          if (session) {
            try { session.destroy(); } catch (_) {}
          }
          session = await createSession();
          response = await withTimeout(session.prompt(promptText), 35000);
          console.log("[AI Organize] Retry prompt call succeeded.");
        } catch (retryErr: any) {
          const retryMsg = retryErr instanceof Error ? `${retryErr.message}\n${retryErr.stack}` : String(retryErr);
          throw new Error(`AI prompt retry failed: ${retryMsg}`);
        }
      }

      // prompt 완료 로그
      try {
        const r = await chrome.storage.local.get("clickbook_ai_debug_log");
        let logs = Array.isArray(r.clickbook_ai_debug_log) ? r.clickbook_ai_debug_log : [];
        logs.push({
          timestamp: new Date().toISOString(),
          message: `[AI Organize] Received AI response: ${response.slice(0, 200)}...`
        });
        if (logs.length > 50) logs = logs.slice(logs.length - 50);
        await chrome.storage.local.set({ clickbook_ai_debug_log: logs });
      } catch (_) {}

      let parsedCategories: string[] = [];
      let parseSuccess = false;

      // 1. 표준 JSON 파싱 시도
      const jsonMatch = response.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed)) {
            parsedCategories = parsed.map(c => String(c).trim().toLowerCase());
            if (parsedCategories.length === batch.length) {
              parseSuccess = true;
            }
          }
        } catch (e) {
          console.warn("[AI Organize] JSON parsing failed, trying text extraction fallback:", e);
        }
      }

      // 2. Fallback: 텍스트 매칭으로 유효한 카테고리 단어 추출
      if (!parseSuccess) {
        const cleanedResponse = response.toLowerCase();
        const matches = cleanedResponse.match(/(technology|design|business|entertainment|science|sports|travel|other)/g) || [];
        
        if (matches.length > 0) {
          parsedCategories = [...matches];
          while (parsedCategories.length < batch.length) {
            parsedCategories.push("other");
          }
          if (parsedCategories.length > batch.length) {
            parsedCategories = parsedCategories.slice(0, batch.length);
          }
          parseSuccess = true;
          console.log(`[AI Organize] Successfully recovered batch with text extraction:`, parsedCategories);
        }
      }

      // 3. 추출 성공 시 결과 매핑
      if (parseSuccess && parsedCategories.length === batch.length) {
        for (let j = 0; j < batch.length; j++) {
          const cat = parsedCategories[j];
          if (AI_REORGANIZE_CATEGORIES.has(cat)) {
            result.set(batch[j].id, cat);
          }
        }
        aiSuccessCount++;
      } else {
        console.warn(`[AI Organize] Batch parsing failed. Raw response:`, response);
        try {
          const r = await chrome.storage.local.get("clickbook_ai_debug_log");
          let logs = Array.isArray(r.clickbook_ai_debug_log) ? r.clickbook_ai_debug_log : [];
          logs.push({
            timestamp: new Date().toISOString(),
            message: `[AI Organize] Batch parsing failed. Raw response: ${response}`
          });
          if (logs.length > 50) logs = logs.slice(logs.length - 50);
          await chrome.storage.local.set({ 
            clickbook_ai_debug_log: logs,
            clickbook_ai_error: `parsing_failed: Raw response had ${parsedCategories.length} items but batch needed ${batch.length}. Response: ${response}`
          });
        } catch (_) {}
      }
    } catch (err: any) {
      console.warn(`[AI Organize] Batch failed due to error/timeout (domain rules kept):`, err);
      try {
        const errMsg = err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
        const r = await chrome.storage.local.get("clickbook_ai_debug_log");
        let logs = Array.isArray(r.clickbook_ai_debug_log) ? r.clickbook_ai_debug_log : [];
        logs.push({
          timestamp: new Date().toISOString(),
          message: `[AI Organize] Batch failed: ${errMsg}`
        });
        if (logs.length > 50) logs = logs.slice(logs.length - 50);
        await chrome.storage.local.set({ 
          clickbook_ai_debug_log: logs,
          clickbook_ai_error: `reorganize_batch_error: ${errMsg}` 
        });
      } catch (_) {}
    } finally {
      if (session) {
        try {
          session.destroy();
        } catch { /* ignore */ }
      }
    }
    // 각 배치 연산 사이에 쿨다운 딜레이 부여
    await new Promise(r => setTimeout(r, 200));
  }

  if (onProgress && (!isDisconnected || !isDisconnected())) {
    onProgress(100, `${bookmarks.length}/${bookmarks.length}`);
  }

  return { moves: result, aiSuccessCount, aiTotalBatches, aiSupported };
}
