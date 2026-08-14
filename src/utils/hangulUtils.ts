/**
 * 한글 유니코드 초성 분리 및 스마트 검색 유틸리티
 */

const CHOSEONG_LIST = [
  "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ",
  "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"
];

const HANGUL_START = 0xAC00; // '가'
const HANGUL_END = 0xD7A3;   // '힣'

/**
 * 주어진 문자열에서 한글 음절을 초성으로 치환합니다.
 * 한글이 아닌 문자(영문, 숫자, 기호 등)는 그대로 유지됩니다.
 * 예: "구글 캘린더" -> "ㄱㄱ ㅋㄹㄷ"
 */
export function getChoseong(text: string): string {
  if (!text) return "";
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= HANGUL_START && code <= HANGUL_END) {
      const choseongIndex = Math.floor((code - HANGUL_START) / (21 * 28));
      result += CHOSEONG_LIST[choseongIndex];
    } else {
      result += text[i];
    }
  }
  return result;
}

/**
 * 쿼리가 순수 한글 자음(초성)으로만 구성되어 있는지 판별합니다.
 * 예: "ㄱㄱ", "ㅅㅍㄹ" -> true, "구글", "google" -> false
 */
export function isChoseongOnly(query: string): boolean {
  if (!query) return false;
  const clean = query.replace(/\s+/g, "");
  if (clean.length === 0) return false;
  return /^[ㄱ-ㅎ]+$/.test(clean);
}

/**
 * 단일 텍스트에 대해 쿼리가 일치하는지 스마트하게 판별합니다.
 * 1. 기본 소문자 부분 일치 (대소문자 무관)
 * 2. 공백 무시 일치 (예: "spring note" 검색어로 "SpringNote" 매칭)
 * 3. 초성 검색 (쿼리가 초성 자음인 경우)
 */
export function smartMatch(target: string, query: string): boolean {
  if (!target || !query) return false;

  const cleanTarget = target.toLowerCase();
  const cleanQuery = query.toLowerCase().trim();
  if (cleanQuery.length === 0) return true;

  // 1. 기본 대소문자 무시 includes
  if (cleanTarget.includes(cleanQuery)) return true;

  // 2. 공백 제거 후 includes (예: "북마크관리" <-> "북마크 관리")
  const targetNoSpace = cleanTarget.replace(/\s+/g, "");
  const queryNoSpace = cleanQuery.replace(/\s+/g, "");
  if (targetNoSpace.includes(queryNoSpace)) return true;

  // 3. 한글 초성 매칭 (쿼리가 초성으로만 이루어진 경우)
  if (isChoseongOnly(cleanQuery)) {
    const targetChoseong = getChoseong(cleanTarget);
    if (targetChoseong.includes(cleanQuery)) return true;
    if (targetChoseong.replace(/\s+/g, "").includes(queryNoSpace)) return true;
  }

  return false;
}

/**
 * 복수의 필드(제목, URL, 요약, 태그 목록, 본문 등) 중 하나라도 일치하는지 검사합니다.
 */
export function smartMatchFields(
  fields: {
    title?: string;
    url?: string;
    summary?: string;
    tags?: string[];
    content?: string;
  },
  terms: string[]
): boolean {
  if (terms.length === 0) return true;

  return terms.every((term) => {
    if (fields.title && smartMatch(fields.title, term)) return true;
    if (fields.url && smartMatch(fields.url, term)) return true;
    if (fields.summary && smartMatch(fields.summary, term)) return true;
    if (fields.tags && fields.tags.some((tag) => smartMatch(tag, term))) return true;
    if (fields.content && smartMatch(fields.content, term)) return true;
    return false;
  });
}
