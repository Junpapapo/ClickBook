import type { VocabItem } from "./vocab-types";

/**
 * 메모 저장 텍스트로부터 학습카드용 VocabItem을 파싱합니다.
 */
export function parseVocabItem(id: string, content: string, updatedAt: number): VocabItem | null {
  const lines = content.split("\n").map(l => l.trim());
  
  const isVocab = lines[0] && (
    lines[0].includes("영어 학습카드") || 
    lines[0].includes("English Learning Card") || 
    lines[0].includes("英語学習カード")
  );
  if (!isVocab) return null;

  let word = "";
  let pronunciation = "";
  let meaning = "";
  let nuance = "";

  for (const line of lines) {
    if (/^(원문|Source|原文)\s*:\s*(.*)$/i.test(line)) {
      word = RegExp.$2.trim();
    } else if (/^(발음|Pronunciation|発音)\s*:\s*(.*)$/i.test(line)) {
      pronunciation = RegExp.$2.trim();
    } else if (/^(뜻|Meaning|意味)\s*:\s*(.*)$/i.test(line)) {
      meaning = RegExp.$2.trim();
    } else if (/^(뉘앙스|Nuance|ニュアンス)\s*:\s*(.*)$/i.test(line)) {
      nuance = RegExp.$2.trim();
    }
  }

  if (!word || !meaning) {
    console.warn("[Vocab Parser] Parsing failed for content. Missing word or meaning:", { id, content, word, meaning });
    return null;
  }

  return { id, word, pronunciation, meaning, nuance, updatedAt };
}

/**
 * 4지선다형 영단어 퀴즈 세트를 생성합니다.
 */
export function generateQuiz(items: VocabItem[]): { correctItem: VocabItem; choices: string[] } | null {
  if (items.length === 0) return null;
  const correctItem = items[Math.floor(Math.random() * items.length)];
  
  const incorrectChoices = items
    .filter(x => x.word !== correctItem.word)
    .map(x => x.meaning);

  const uniqueIncorrect = Array.from(new Set(incorrectChoices));
  const selectedIncorrect = uniqueIncorrect.sort(() => 0.5 - Math.random()).slice(0, 3);

  // 선택지가 부족할 때의 더미 오답 풀
  const fallbackWords = ["사과", "바나나", "컴퓨터", "책", "연필", "하늘", "바다"];
  while (selectedIncorrect.length < 3) {
    const dummy = fallbackWords[Math.floor(Math.random() * fallbackWords.length)];
    if (dummy !== correctItem.meaning && !selectedIncorrect.includes(dummy)) {
      selectedIncorrect.push(dummy);
    }
  }

  const choices = [correctItem.meaning, ...selectedIncorrect].sort(() => 0.5 - Math.random());
  return { correctItem, choices };
}

const STOPWORDS = new Set([
  "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", 
  "he", "him", "his", "himself", "she", "her", "hers", "herself", "it", "its", "itself", 
  "they", "them", "their", "theirs", "themselves", "what", "which", "who", "whom", 
  "this", "that", "these", "those", "am", "is", "are", "was", "were", "be", "been", "being", 
  "have", "has", "had", "having", "do", "does", "did", "doing", "a", "an", "the", 
  "and", "but", "if", "or", "because", "as", "until", "while", "of", "at", "by", "for", 
  "with", "about", "against", "between", "into", "through", "during", "before", "after", 
  "above", "below", "to", "from", "up", "down", "in", "out", "on", "off", "over", "under", 
  "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", 
  "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", 
  "nor", "not", "only", "own", "same", "so", "than", "too", "very", "can", "will", "just", 
  "should", "now"
]);

export function extractKeyWords(text: string, maxCount: number = 3): string[] {
  // 영어 소문자로 통일하고 알파벳 단어 단위로 쪼갬
  const tokens = text.toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length >= 3);

  const uniqueWords: string[] = [];
  for (const token of tokens) {
    if (!STOPWORDS.has(token) && !uniqueWords.includes(token)) {
      uniqueWords.push(token);
      if (uniqueWords.length >= maxCount) break;
    }
  }

  // 만약 불용어를 빼고 남은 단어가 하나도 없다면, 그냥 불용어 중에서라도 추출
  if (uniqueWords.length === 0) {
    const fallbackTokens = text.toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).map(t => t.trim()).filter(t => t.length > 0);
    const seen = new Set();
    for (const t of fallbackTokens) {
      if (t && !seen.has(t)) {
        uniqueWords.push(t);
        seen.add(t);
        if (uniqueWords.length >= maxCount) break;
      }
    }
  }

  return uniqueWords;
}
