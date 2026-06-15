import type { Bookmark } from "./types";
import { DEFAULT_FOLDER_ID } from "./categories";
import { 
  classifyByDomain, 
  ruleBasedGroups 
} from "./categorizer/rules";
import type { ClassifyResult, FindDuplicateResult } from "./categorizer/rules";
import { 
  classifyWithNano, 
  isAIAvailable 
} from "./categorizer/ai-service";

// re-export
export { categorizeQuick } from "./categorizer/rules";
export { 
  isAIAvailable, 
  setAIEnabled, 
  verifyAISession,
  expandSearchQuery, 
  recommendSites, 
  generateSummaryAndTags, 
  generateMemoDraft, 
  refineMemoDraft,
  findSimilarTagGroups,
  reorganizeWithAI
} from "./categorizer/ai-service";

export type { SimilarTagGroup, FindSimilarTagsResult, DuplicateGroup, FindDuplicateResult, ClassifyResult } from "./categorizer/rules";

/**
 * URL, Title, Domain 정보를 기반으로 폴더 분류를 수행합니다.
 * 1순위: Gemini Nano AI
 * 2순위: 도메인 기반 규칙
 * 3순위: Fallback
 */
export async function categorize(
  url: string,
  title: string,
  domain: string,
  existingFolders?: Array<{ id: string; name: string; nameJa?: string; nameKo?: string }>
): Promise<ClassifyResult> {
  // 1. Gemini Nano AI
  const nanoResult = await classifyWithNano(url, title, existingFolders);
  if (nanoResult) return { folderId: nanoResult, method: "ai" };

  // 2. 규칙 기반 Fallback
  const ruleResult = classifyByDomain(domain);
  let finalFolderId = DEFAULT_FOLDER_ID;

  if (existingFolders && existingFolders.length > 0) {
    const found = existingFolders.find(
      (f) => f.id === ruleResult || f.name.toLowerCase() === ruleResult.toLowerCase()
    );
    if (found) {
      finalFolderId = found.id;
    }
  } else {
    finalFolderId = ruleResult;
  }

  const method = finalFolderId !== DEFAULT_FOLDER_ID ? "rules" : "fallback";
  return { folderId: finalFolderId, method };
}

/**
 * 북마크 목록에서 의미상 중복되거나 유사한 그룹을 검출합니다.
 * AI가 활성화되어 있으면 AI를 우선 적용하고, 불가능하면 규칙 기반 유사도로 동작합니다.
 */
export async function findDuplicateGroups(
  bookmarks: Array<{ id: string; title: string; url: string }>,
  lang: string = "en"
): Promise<FindDuplicateResult> {
  if (bookmarks.length < 2) return { groups: [], aiUsed: false };

  const groups = ruleBasedGroups(bookmarks, lang);
  return { groups, aiUsed: false };
}