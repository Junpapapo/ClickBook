/**
 * ai-prompts.ts
 * AI 관련 프롬프트에서 활용하는 다국어 명칭 및 지시어(Instruction) 매핑 모듈
 */

import type { Lang } from "./config";

/**
 * AI 모델에게 전달할 언어별 공식 영문/현지어 표기명
 */
export const AI_LANGUAGE_NAMES: Record<Lang, string> = {
  ko: "Korean (한국어)",
  en: "English",
  ja: "Japanese (日本語)",
  "zh-TW": "Traditional Chinese (繁體中文)",
  de: "German (Deutsch)",
  es: "Spanish (Español)",
  fr: "French (Français)",
};

/**
 * AI 모델에게 지정 언어로 응답하도록 지시하는 시스템 프롬프트 문구
 */
export const AI_LANGUAGE_INSTRUCTIONS: Record<Lang, string> = {
  ko: "반드시 한국어로 자연스럽고 간결하게 작성하세요.",
  en: "Please write naturally and concisely in English.",
  ja: "必ず自然で簡潔な日本語で作成してください。",
  "zh-TW": "請務必使用自然、簡潔的繁體中文（台灣/香港習慣用語）撰寫。",
  de: "Bitte schreiben Sie natürlich und prägnant auf Deutsch.",
  es: "Por favor, escribe de forma natural y concisa en español.",
  fr: "Veuillez rédiger en français de manière naturelle et concise.",
};
