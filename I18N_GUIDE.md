# ClickBook 다국어(i18n) 시스템 개발자 기술 문서 & 새 언어 추가 가이드

본 문서는 **ClickBook**의 다국어(i18n) 아키텍처 구조를 설명하고, 향후 새로운 언어(예: 독일어 `de`, 스페인어 `es`, 프랑스어 `fr` 등)를 추가할 때 개발자가 따라야 할 풀스택 표준 절차(Step-by-Step)와 모범 사례를 제공합니다.

---

## 🏛️ 1. 다국어 시스템 아키텍처 개요

ClickBook은 외부 무거운 라이브러리 없이 **경량 커스텀 i18n 엔진**과 **TypeScript 100% 타입 안전성**을 기반으로 설계되어 있습니다.

```
ClickBook i18n Core
 ├── src/shared/i18n/
 │    ├── config.ts         ← [Single Source of Truth] 지원 언어 목록, 메타데이터, 브라우저 감지 규칙
 │    ├── ai-prompts.ts     ← AI 모델(Gemini Nano)에게 전달하는 다국어 지시어 맵
 │    ├── index.ts          ← createT() 번역 함수 팩토리 & 브라우저 감지 함수
 │    ├── en.ts             ← 메인 기준 사전 (약 780+ 키)
 │    ├── ko.ts, ja.ts, zh-TW.ts, de.ts, es.ts, fr.ts ...
 │
 ├── src/buddy/i18n/        ← 웹페이지 상주 디지털 펫(버디) 전용 독립 경량 사전 (약 290+ 키)
 │    ├── index.ts, en.ts, ko.ts, ja.ts, zh-TW.ts, de.ts, es.ts, fr.ts ...
 │
 ├── src/shared/LanguageContext.tsx ← React 컴포넌트 전역 언어 상태 관리 & 크로스 탭 실시간 동기화
 ├── src/background/services/helpers/lang-helper.ts ← 백그라운드 서비스 워커 언어 판별
 ├── src/components/SearchBar.tsx   ← 언어별 헬프 사이트(help.<lang>.html) 라우팅
 ├── public/                ← 언어별 헬프/Q&A 독립 정적 웹페이지 (help.<lang>.html, qna.<lang>.html)
 ├── public/_locales/       ← Chrome Web Store & Manifest V3용 브라우저 네이티브 로케일
 └── docs/00_Plan/          ← Chrome Web Store(CWS) 게재용 다국어 상세 설명문구 텍스트
```

---

## 🌐 현재 공식 지원 언어 현황 (Supported Languages)

| 언어 코드 | 언어 명칭 (Label) | 단축 라벨 | 캘린더 기본 공휴일 | 메인 사전 | 버디 사전 | CWS 로케일 | 헬프/Q&A 사이트 | README |
|---|---|---|---|---|---|---|---|---|
| `ko` | 한국어 | KO | `KR` (대한민국) | ✅ | ✅ | ✅ | ✅ | ✅ `README.ko.md` |
| `en` | English | EN | `US` (미국) | ✅ (기준) | ✅ (기준) | ✅ | ✅ | ✅ `README.md` |
| `ja` | 日本語 | JA | `JP` (일본) | ✅ | ✅ | ✅ | ✅ | ✅ `README.ja.md` |
| `zh-TW` | 繁體中文 | TC | `TW` (대만) | ✅ | ✅ | ✅ | ✅ | ✅ `README.zh-TW.md` |
| `de` | Deutsch | DE | `DE` (독일) | ✅ | ✅ | ✅ | ✅ | ✅ `README.de.md` |
| `es` | Español | ES | `ES` (스페인) | ✅ | ✅ | ✅ | ✅ | ✅ `README.es.md` |
| `fr` | Français | FR | `FR` (프랑스) | ✅ | ✅ | ✅ | ✅ | ✅ `README.fr.md` |

---

## 🚀 2. 새로운 언어 추가 9단계 표준 절차 (Step-by-Step Guide)

새로운 언어(예시: 프랑스어 `fr`)를 추가할 때는 다음 **9단계**를 순서대로 누락 없이 진행합니다.

---

### Step 1. 중앙 레지스트리에 언어 등록
**파일**: [`src/shared/i18n/config.ts`](file:///c:/00_Workspace/ClickBook/src/shared/i18n/config.ts)

1. `Lang` 유니온 타입에 새 언어 코드를 추가합니다.
2. `SUPPORTED_LANGUAGES` 배열에 언어 메타데이터를 추가합니다.

```typescript
// 1. 타입 추가
export type Lang = "en" | "ja" | "ko" | "zh-TW" | "de" | "es" | "fr";

// 2. 메타데이터 등록
export const SUPPORTED_LANGUAGES: readonly LanguageMeta[] = [
  // ... 기존 언어들
  {
    code: "fr",
    label: "Français",
    nativeName: "Français",
    shortLabel: "FR",
    flag: "🇫🇷",
    prefixMatch: ["fr", "fr-fr", "fr-ca", "fr-be", "fr-ch", "fr-lu"],
    defaultHolidayCountry: "FR", // 캘린더 공휴일 자동 연동 국가 코드 (ISO 3166-1)
  },
] as const;
```
> [!TIP]
> `SUPPORTED_LANGUAGES`에 메타데이터를 등록하면 **설정 모달, 웰컴 모달(런치 가이드), 팝업의 언어 전환 세그먼트 버튼이 자동으로 생성**됩니다.

---

### Step 2. AI 프롬프트 언어 명칭 및 지시어 등록
**파일**: [`src/shared/i18n/ai-prompts.ts`](file:///c:/00_Workspace/ClickBook/src/shared/i18n/ai-prompts.ts)

AI 기능(Gemini Nano를 통한 메모 윤문, 마인드맵 아이디어 확장 등)에서 활용할 언어별 공식 명칭과 응답 지시어를 등록합니다.

```typescript
export const AI_LANGUAGE_NAMES: Record<Lang, string> = {
  // ...
  fr: "French (Français)",
};

export const AI_LANGUAGE_INSTRUCTIONS: Record<Lang, string> = {
  // ...
  fr: "Veuillez rédiger en français de manière naturelle et concise.",
};
```

---

### Step 3. 기본 폴더 현지화 매핑 추가
**파일**: [`src/shared/categories.ts`](file:///c:/00_Workspace/ClickBook/src/shared/categories.ts)

`LOCALIZED_DEFAULT_FOLDERS` 객체에 8개 기본 카테고리 폴더의 현지어 명칭을 등록합니다.

```typescript
export const LOCALIZED_DEFAULT_FOLDERS: Partial<Record<Lang, Record<string, string>>> = {
  // ...
  fr: {
    technology: "Technologie",
    design: "Design",
    business: "Affaires",
    entertainment: "Divertissement",
    science: "Science",
    sports: "Sports",
    travel: "Voyages",
    other: "Autre",
  },
};
```

---

### Step 4. 메인 사전 파일 작성 및 인덱스 등록
1. **파일 생성**: `src/shared/i18n/fr.ts`
   * [`src/shared/i18n/en.ts`](file:///c:/00_Workspace/ClickBook/src/shared/i18n/en.ts)를 복사하여 `export const fr = { ... };` 형식으로 780+ 전체 키를 번역합니다.
   * 변수 치환자(`{n}`, `{saved}`, `{title}`, `{count}` 등)의 형식을 정확히 유지해야 합니다.
2. **인덱스 등록**: [`src/shared/i18n/index.ts`](file:///c:/00_Workspace/ClickBook/src/shared/i18n/index.ts)
   ```typescript
   import { fr } from "./fr";

   export const DICT: Record<Lang, typeof en> = { en, ja, ko, "zh-TW": zhTW, de, es, fr };
   ```
   > [!NOTE]
   > `DICT`가 `Record<Lang, typeof en>` 타입으로 정의되어 있어, 키가 하나라도 누락되면 TypeScript 컴파일러(`npx tsc --noEmit`)가 즉시 누락된 키 목록을 컴파일 에러로 알려줍니다.

---

### Step 5. 버디(Buddy) 사전 파일 작성 및 등록
1. **파일 생성**: `src/buddy/i18n/fr.ts`
   * [`src/buddy/i18n/en.ts`](file:///c:/00_Workspace/ClickBook/src/buddy/i18n/en.ts)를 기반으로 버디 전용 290+ 키를 번역합니다.
2. **인덱스 등록**: [`src/buddy/i18n/index.ts`](file:///c:/00_Workspace/ClickBook/src/buddy/i18n/index.ts)
   ```typescript
   import { fr } from "./fr";

   const dictionaries: Record<BuddyLang, Record<string, string>> = { en, ko, ja, "zh-TW": zhTW, de, es, fr };
   ```

---

### Step 6. Chrome Manifest V3 브라우저 로케일 추가
**파일 생성**: `public/_locales/fr/messages.json`

Chrome Web Store 및 브라우저 확장 관리자 표시용 3대 필수 메시지를 작성합니다.

```json
{
  "appName": {
    "message": "ClickBook AI - Gestionnaire de Favoris & Tâches par IA",
    "description": "The name of the extension"
  },
  "appDesc": {
    "message": "Enregistrez des onglets en 1 clic, organisez vos favoris avec l'IA locale Gemini Nano et gérez vos listes TODO et votre calendrier.",
    "description": "The description of the extension"
  },
  "saveCurrentTab": {
    "message": "Enregistrer l'onglet actuel comme favori",
    "description": "Command description for saving current tab"
  }
}
```

---

### Step 7. 헬프 사이트 & Q&A 페이지 생성 및 링크 라우팅
1. **파일 생성**:
   * `public/help.fr.html` : 프랑스어 기능 매뉴얼 & Gemini Nano 설정 3단계 가이드 웹페이지
   * `public/qna.fr.html` : 프랑스어 Q&A 및 트러블슈팅 웹페이지
2. **라우팅 연동**: [`src/components/SearchBar.tsx`](file:///c:/00_Workspace/ClickBook/src/components/SearchBar.tsx)
   ```tsx
   <a
     href={`https://junpapapo.github.io/ClickBook/public/${
       lang === "ko" ? "help.ko.html" :
       lang === "ja" ? "help.ja.html" :
       lang === "zh-TW" ? "help.zh-TW.html" :
       lang === "de" ? "help.de.html" :
       lang === "es" ? "help.es.html" :
       lang === "fr" ? "help.fr.html" :
       "help.html"
     }`}
     target="_blank"
     rel="noopener noreferrer"
   >
   ```

---

### Step 8. 루트 README 문서 작성 및 언어 네비게이션 연동
1. **파일 생성**: `README.fr.md` (프로젝트 루트)
2. **네비게이션 바 링크 동기화**:
   * `README.md`, `README.ko.md`, `README.ja.md`, `README.de.md`, `README.es.md` 등의 상단 언어 링크 바에 새 언어 링크 추가:
   ```markdown
   [English](./README.md) | [한국어](./README.ko.md) | [日本語](./README.ja.md) | [Deutsch](./README.de.md) | [Español](./README.es.md) | [Français](./README.fr.md) | [繁體中文](./README.zh-TW.md) | [简体中文](./README.zh-CN.md)
   ```

---

### Step 9. Chrome Web Store 게재용 문서 작성
1. **파일 생성**: `docs/00_Plan/store_description_fr.txt`
   * CWS 스토어 게시용 전체 기능 소개 및 Gemini Nano Flags 설정 가이드 반영
2. **스토어 가이드 업데이트**: [`docs/CHROME_WEB_STORE.md`](file:///c:/00_Workspace/ClickBook/docs/CHROME_WEB_STORE.md)
   * 스토어 게재 정보 테이블의 지원 언어 목록에 추가

---

## 🧪 3. 빌드 및 검증 (Verification)

언어 추가 작업 후 반드시 다음 2가지 검증 명령을 실행하여 이상이 없는지 확인합니다.

```powershell
# 1. 전체 TypeScript 타입 검사 (사전 키 누락 및 타입 불일치 즉시 검출)
npx tsc --noEmit

# 2. Vite 프로덕션 번들 빌드 검증
npm run build
```

---

## 📌 4. 모범 사례 & 개발자 팁

1. **변수 치환 규칙**:
   * 번역 문자열 내의 `{name}`, `{n}`, `{count}`, `{date}`, `{moved}`, `{total}` 등의 플레이스홀더를 변경하거나 임의로 삭제하지 마세요.
2. **Fallback 안전 체계**:
   * 만약 특정 키가 번역 파일에서 누락되더라도 `createT()`는 `dict[key] ?? DICT.en[key] ?? key` 순서로 영어(en) 기본값을 안전하게 반환합니다.
3. **UI 텍스트 하드코딩 금지**:
   * 새로운 React 컴포넌트를 작성할 때는 반드시 `const { t } = useLang();` 훅을 사용하고 텍스트를 `t("keyName")`으로 감싸서 작성하세요.
4. **캘린더 공휴일 연동**:
   * `config.ts`의 `defaultHolidayCountry`에 정확한 ISO 3166-1 2자리 국가 코드(예: `"FR"`, `"DE"`, `"ES"`, `"US"`, `"KR"`, `"JP"`)를 지정하면 언어 전환 시 해당 국가 공휴일이 캘린더에 즉시 연동됩니다.
