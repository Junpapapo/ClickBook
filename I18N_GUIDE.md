# ClickBook 다국어(i18n) 시스템 개발자 기술 문서 & 새 언어 추가 가이드

본 문서는 **ClickBook**의 다국어(i18n) 아키텍처 구조를 설명하고, 향후 새로운 언어(예: 독일어 `de`, 스페인어 `es`, 프랑스어 `fr` 등)를 추가할 때 개발자가 따라야 할 표준 절차와 모범 사례를 제공합니다.

---

## 🏛️ 1. 다국어 시스템 아키텍처 개요

ClickBook은 외부 무거운 라이브러리 없이 **경량 커스텀 i18n 엔진**과 **TypeScript 100% 타입 안전성**을 기반으로 설계되어 있습니다.

```
ClickBook i18n Core
 ├── src/shared/i18n/
 │    ├── config.ts         ← [Single Source of Truth] 지원 언어 목록, 메타데이터, 브라우저 감지 규칙
 │    ├── ai-prompts.ts     ← AI 모델(Gemini Nano)에게 전달하는 다국어 지시어 맵
 │    ├── index.ts          ← createT() 번역 함수 팩토리 & 브라우저 감지 함수
 │    ├── en.ts             ← 메인 기준 사전 (약 790+ 키)
 │    ├── ko.ts, ja.ts, zh-TW.ts ...
 │
 ├── src/buddy/i18n/        ← 웹페이지 상주 디지털 펫(버디) 전용 독립 경량 사전 (약 290+ 키)
 │    ├── index.ts, en.ts, ko.ts, ja.ts, zh-TW.ts ...
 │
 ├── src/shared/LanguageContext.tsx ← React 컴포넌트 전역 언어 상태 관리 & 크로스 탭 실시간 동기화
 ├── src/background/services/helpers/lang-helper.ts ← 백그라운드 서비스 워커 언어 판별
 └── public/_locales/       ← Chrome Web Store & Manifest V3용 브라우저 네이티브 로케일
```

---

## 🚀 2. 새로운 언어 추가 단계 (Step-by-Step Guide)

새로운 언어(예시: 독일어 `de`)를 추가할 때는 다음 **6단계**를 순서대로 진행합니다.

---

### Step 1. 중앙 레지스트리에 언어 등록
**파일**: [`src/shared/i18n/config.ts`](file:///c:/00_Workspace/ClickBook/src/shared/i18n/config.ts)

1. `Lang` 유니온 타입에 새 언어 코드를 추가합니다.
2. `SUPPORTED_LANGUAGES` 배열에 언어 메타데이터를 추가합니다.

```typescript
// 1. 타입 추가
export type Lang = "en" | "ja" | "ko" | "zh-TW" | "de";

// 2. 메타데이터 등록
export const SUPPORTED_LANGUAGES: readonly LanguageMeta[] = [
  // ... 기존 언어들
  {
    code: "de",
    label: "Deutsch",
    nativeName: "Deutsch",
    shortLabel: "DE",
    prefixMatch: ["de", "de-de", "de-at", "de-ch"],
    defaultHolidayCountry: "DE", // 캘린더 공휴일 자동 연동 국가 코드 (ISO 3166-1)
  },
] as const;
```
> [!TIP]
> `SUPPORTED_LANGUAGES`에 메타데이터를 등록하면 **설정 모달, 웰컴 모달, 팝업의 언어 전환 버튼이 자동으로 생성**됩니다.

---

### Step 2. AI 프롬프트 언어 명칭 및 지시어 등록
**파일**: [`src/shared/i18n/ai-prompts.ts`](file:///c:/00_Workspace/ClickBook/src/shared/i18n/ai-prompts.ts)

AI 기능(마인드맵 번역, 메모 윤문 등)에서 활용할 언어별 공식 명칭과 응답 지시어를 등록합니다.

```typescript
export const AI_LANGUAGE_NAMES: Record<Lang, string> = {
  ko: "Korean (한국어)",
  en: "English",
  ja: "Japanese (日本語)",
  "zh-TW": "Traditional Chinese (繁體中文)",
  de: "German (Deutsch)",
};

export const AI_LANGUAGE_INSTRUCTIONS: Record<Lang, string> = {
  ko: "반드시 한국어로 자연스럽고 간결하게 작성하세요.",
  en: "Please write naturally and concisely in English.",
  ja: "必ず自然で簡潔な日本語で作成してください。",
  "zh-TW": "請務必使用自然、簡潔的繁體中文（台灣/香港習慣用語）撰寫。",
  de: "Bitte antworten Sie natürlich und prägnant auf Deutsch.",
};
```

---

### Step 3. 기본 폴더 현지화 매핑 추가
**파일**: [`src/shared/categories.ts`](file:///c:/00_Workspace/ClickBook/src/shared/categories.ts)

`LOCALIZED_DEFAULT_FOLDERS` 객체에 8개 기본 카테고리 폴더의 현지어 명칭을 등록합니다.

```typescript
export const LOCALIZED_DEFAULT_FOLDERS: Partial<Record<Lang, Record<string, string>>> = {
  // ... 기존 언어들
  de: {
    technology: "Technologie",
    design: "Design",
    business: "Wirtschaft",
    entertainment: "Unterhaltung",
    science: "Wissenschaft",
    sports: "Sport",
    travel: "Reisen",
    other: "Sonstiges",
  },
};
```

---

### Step 4. 메인 사전 파일 작성 및 인덱스 등록
1. **파일 생성**: `src/shared/i18n/de.ts`
   * [`src/shared/i18n/en.ts`](file:///c:/00_Workspace/ClickBook/src/shared/i18n/en.ts)를 복사하여 `export const de = { ... };` 형식으로 모든 키를 번역합니다.
   * 변수 치환자(`{n}`, `{saved}`, `{title}` 등)의 형식을 그대로 유지해야 합니다.
2. **인덱스 등록**: [`src/shared/i18n/index.ts`](file:///c:/00_Workspace/ClickBook/src/shared/i18n/index.ts)
   ```typescript
   import { de } from "./de";

   export const DICT: Record<Lang, typeof en> = { en, ja, ko, "zh-TW": zhTW, de };
   ```
   > [!NOTE]
   > `DICT`가 `Record<Lang, typeof en>` 타입으로 정의되어 있어, 키가 하나라도 누락되면 TypeScript 컴파일러(`tsc`)가 즉시 누락된 키를 에러로 알려줍니다.

---

### Step 5. 버디(Buddy) 사전 파일 작성 및 등록
1. **파일 생성**: `src/buddy/i18n/de.ts`
   * [`src/buddy/i18n/en.ts`](file:///c:/00_Workspace/ClickBook/src/buddy/i18n/en.ts)를 복사하여 `export const de = { ... };` 형식으로 번역합니다.
2. **인덱스 등록**: [`src/buddy/i18n/index.ts`](file:///c:/00_Workspace/ClickBook/src/buddy/i18n/index.ts)
   ```typescript
   import { de } from "./de";

   const dictionaries: Record<BuddyLang, Record<string, string>> = { en, ko, ja, "zh-TW": zhTW, de };
   ```

---

### Step 6. Chrome Manifest V3 로케일 추가
**폴더 생성**: `public/_locales/de/messages.json`

Chrome Web Store 및 브라우저 확장 관리자 표시용 3개 필수 메시지를 작성합니다.

```json
{
  "appName": {
    "message": "ClickBook AI - AI Lesezeichen & Aufgaben-Manager",
    "description": "The name of the extension"
  },
  "appDesc": {
    "message": "Speichern Sie Tabs mit 1 Klick, organisieren Sie Lesezeichen mit lokaler Gemini Nano AI und verwalten Sie TODOs und Kalender.",
    "description": "The description of the extension"
  },
  "saveCurrentTab": {
    "message": "Aktuellen Tab als Lesezeichen speichern",
    "description": "Command description for saving current tab"
  }
}
```

---

## 🧪 3. 빌드 및 검증 (Verification)

언어 추가 작업 후 반드시 다음 검증 명령을 실행하여 이상이 없는지 확인합니다.

```powershell
# 1. 전체 TypeScript 타입 검사 (누락된 키나 타입 불일치 즉시 검출)
npx tsc --noEmit

# 2. Vite 프로덕션 번들 빌드 검증
npm run build
```

---

## 📌 4. 모범 사례 & 개발자 팁

1. **변수 치환 규칙**:
   * 번역 문자열 내의 `{name}`, `{n}`, `{count}`, `{date}` 등의 플레이스홀더를 변경하거나 임의로 삭제하지 마세요.
2. **Fallback 안전 체계**:
   * 만약 특정 키가 번역 파일에서 누락되거나 런타임 에러가 발생하더라도 `createT()`는 `dict[key] ?? DICT.en[key] ?? key` 순서로 영어(en) 기본값을 안전하게 반환합니다.
3. **UI 텍스트 하드코딩 금지**:
   * 새로운 React 컴포넌트를 작성할 때는 반드시 `const { t } = useLang();` 훅을 사용하고 텍스트를 `t("keyName")`으로 감싸서 작성하세요.
