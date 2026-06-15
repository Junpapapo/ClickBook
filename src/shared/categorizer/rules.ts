import { DOMAIN_RULES, DEFAULT_FOLDER_ID } from "../categories";

export const CATEGORY_IDS = [
  "technology",
  "design",
  "business",
  "entertainment",
  "science",
  "sports",
  "travel",
  "other",
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export type ClassifyMethod = "ai" | "rules" | "fallback";

export type ClassifyResult = {
  folderId: string;
  method: ClassifyMethod;
};

export interface DuplicateGroup {
  reason: string;
  ids: string[];
}

export interface FindDuplicateResult {
  groups: DuplicateGroup[];
  aiUsed: boolean;
}

export interface SimilarTagGroup {
  reason: string;
  tags: string[];
  suggestedMaster: string;
}

export interface FindSimilarTagsResult {
  groups: SimilarTagGroup[];
  aiUsed: boolean;
}

export function isValidCategoryId(value: string): value is CategoryId {
  return CATEGORY_IDS.includes(value as CategoryId);
}

// ── 규칙 기반 분류 (서브도메인 지원) ──────────────────────
export function classifyByDomain(domain: string): string {
  const normalized = domain.replace(/^www\./, "");
  if (DOMAIN_RULES[normalized]) return DOMAIN_RULES[normalized];
  
  // 서브도메인을 순차적으로 제거하며 부모 도메인 탐색
  const parts = normalized.split(".");
  for (let i = 1; i < parts.length - 1; i++) {
    const parent = parts.slice(i).join(".");
    if (DOMAIN_RULES[parent]) return DOMAIN_RULES[parent];
  }
  return DEFAULT_FOLDER_ID;
}

export function categorizeQuick(domain: string): string {
  return classifyByDomain(domain);
}

// ── 규칙 기반 유사도 검사 및 폴더 매핑 ───────────────────────
export function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function titleJaccard(a: string, b: string): number {
  const STOP = new Set([
    "the", "a", "an", "of", "in", "to", "for", "and", "or", "is", "are", 
    "how", "what", "with", "on", "at", "using", "get", "use", "your", 
    "you", "my", "we", "our"
  ]);
  
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

export function ruleBasedGroups(
  bookmarks: Array<{ id: string; title: string; url: string }>,
  lang: string
): DuplicateGroup[] {
  const groups: DuplicateGroup[] = [];
  const used = new Set<string>();

  // Stage 1: 동일 도메인
  const byDomain = new Map<string, Array<{ id: string; title: string; url: string }>>();
  for (const bm of bookmarks) {
    const d = domainOf(bm.url);
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

  // Stage 2: 다른 도메인이지만 제목이 유사한 경우
  const rest = bookmarks.filter(b => !used.has(b.id));
  const paired = new Set<string>();
  for (let i = 0; i < rest.length; i++) {
    for (let j = i + 1; j < rest.length; j++) {
      const a = rest[i], b = rest[j];
      if (paired.has(a.id) || paired.has(b.id)) continue;
      const sim = titleJaccard(a.title, b.title);
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

// ── Rule-based: 레벤슈타인 거리 ──────────────────────────────
export function levenshtein(a: string, b: string): number {
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

export function isSimilarTag(a: string, b: string): boolean {
  if (a === b) return false;
  if (levenshtein(a, b) <= 2) return true;
  
  let common = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] !== b[i]) break;
    common++;
  }
  if (common >= Math.max(a.length, b.length) * 0.5 && common >= 3) return true;
  
  if (a + "s" === b || b + "s" === a) return true;
  if (a.endsWith("ies") && b + "ies" === a.replace(/y$/, "ies")) return true;
  if (b.endsWith("ies") && a + "ies" === b.replace(/y$/, "ies")) return true;
  return false;
}

export function ruleBasedTagGroups(
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
      if (isSimilarTag(tags[i].name, tags[j].name)) {
        similar.push(tags[j].name);
      }
    }
    if (similar.length < 2) continue;
    similar.forEach(t => used.add(t));
    
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
