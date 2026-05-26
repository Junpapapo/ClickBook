# ClickBook

> **1클릭으로 탭을 저장하고, AI가 자동으로 폴더에 분류하는 Chrome 확장 프로그램**
> **A Chrome extension that saves tabs with 1-click and auto-categorizes them using AI**

[English version](./README.md) | [日本語版](./README.ja.md) | [한국어판](./README.ko.md)

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/junpa)

## 한국어판

Chrome Manifest V3로 구축된 북마크 관리 도구입니다. 확장 프로그램 아이콘을 클릭하는 것만으로 활성 탭을 즉시 저장하며, Chrome 내장 AI(Gemini Nano) 또는 규칙 기반 폴백을 통해 8개 카테고리로 자동 분류합니다. 관리는 전용 대시보드 탭에서 수행합니다.

---

## 스크린샷

| 팝업 | 관리 대시보드 |
|---|---|
| 아이콘 클릭으로 즉시 저장 | 전용 탭에서 계층형 폴더 관리 |

---

## 주요 기능

| # | 기능 | 설명 |
|---|---|---|
| 1 | **1클릭 저장** | 확장 프로그램 아이콘 클릭 시 활성 탭 즉시 저장 |
| 2 | **AI 자동 분류** | Chrome Gemini Nano(`window.ai`)로 URL·제목을 분석하여 최적의 폴더로 분류 |
| 3 | **AI 자동 정리** | 사이드바 "AI 자동 정리" 버튼으로 모든 북마크를 일괄 재분류 (실행 전 백업 자동 생성) |
| 4 | **계층형 폴더** | 무한 중첩 지원. 생성·이름 변경·이동·삭제·이모지 아이콘 설정 가능 |
| 5 | **드래그 앤 드롭** | 북마크와 폴더, 폴더와 폴더 간의 직관적인 이동 지원 |
| 6 | **패턴 저장** | 현재의 폴더 및 북마크 구성을 스냅샷으로 저장 및 복구 |
| 7 | **Chrome 북마크 연동** | Chrome 북마크 가져오기·내보내기·동기화 지원 |
| 8 | **다크 / 라이트 테마** | 토글 버튼으로 전환 가능. `localStorage`에 상태 유지 |
| 9 | **완전 오프라인** | `chrome.storage.local`을 사용하여 완전 로컬 동작 (별도 서버 불필요) |
| 10 | **다국어 지원** | Chrome i18n API를 사용하여 영어, 일본어, 한국어 완벽 대응 |
| 11 | **AI 하이라이트 스크랩 (Premium)** | 웹페이지 드래그 후 우클릭 메뉴를 통해 크롬 온디바이스 AI가 브라우저 언어에 맞춰 요약한 다국어 메모 자동 저장 |
| 12 | **스마트 탭 서스펜더 (Premium)** | 사용하지 않는 백그라운드 탭을 일시 정지(Sleep)하여 메모리 점유율을 최대 90% 이상 절감 (오디오 재생 탭 등 스마트 필터링 및 원클릭 복원 제공) |
| 13 | **탭 그룹 양방향 동기화 (Premium)** | 활성 크롬 탭 그룹을 클릭북 폴더로 원클릭 백업하고, 반대로 클릭북 폴더를 색상과 이름이 그대로 매핑된 순정 크롬 탭 그룹으로 즉시 재생성 |
| 14 | **개인정보 자동 세션 파쇄 (Premium)** | 민감한 기밀/금융 페이지 폴더를 '보안 폴더'로 지정하면, 해당 탭을 닫을 때 연동된 도메인의 쿠키, 캐시, 스토리지 및 방문 기록을 완전 자동 소거 |
| 15 | **FTS 본문 기반 검색 (Premium)** | 북마크 저장 시 백그라운드에서 페이지 본문을 스크랩 및 광고 정제 후 저장하며, 단어별 띄어쓰기(AND) 입력을 통해 본문 전체를 대상으로 초고속 실시간 매칭 검색 제공 |
| 16 | **오프라인 독서 모드 & 젠 리더 (Premium)** | 광고나 산만함이 없는 전용 독서 모드 제공. 긴 메모 전용 젠 리더(Zen Reader) 모드 포함. 라이트/세피아/다크 테마, 글꼴 유형 및 크기 세팅, headings `#` 및 `##` 마크다운 기반 실시간 목차(TOC) 내비게이션, 스크롤 진행 바 완벽 지원 |

---

## 기술 스택

| 구분 | 기술 | 버전 |
|---|---|---|
| UI | React | 18.x |
| 언어 | TypeScript | 5.x (strict mode) |
| 스타일 | Tailwind CSS | 3.x (`darkMode: "class"`) |
| 빌드 | Vite | 5.x |
| 확장 빌드 | vite-plugin-web-extension | 4.x |
| 아이콘 | lucide-react | 0.400.x |
| Manifest | Chrome Manifest V3 | — |
| 저장소 | chrome.storage.local | 최대 10MB |
| AI | Chrome Gemini Nano | `window.ai.languageModel` (실험적 API) |
| D&D | HTML5 Drag and Drop API | 외부 라이브러리 미사용 |

---

## 디렉토리 구조

```
ClickBook/
├── manifest.json              # Chrome 확장 프로그램 매니페스트 (MV3)
├── vite.config.ts             # Vite + vite-plugin-web-extension 설정
├── tailwind.config.js
├── tsconfig.json
├── public/
│   ├── _locales/              # 다국어 번역 메시지 파일 (en, ko, ja)
│   ├── icons/                 # 확장 프로그램 아이콘 (16/48/128px)
│   ├── help.html              # 도움말 페이지 (영어)
│   ├── help.ko.html           # 도움말 페이지 (한국어)
│   ├── help.ja.html           # 도움말 페이지 (일본어)
│   └── privacy.html           # 개인정보처리방침 페이지
├── src/
│   ├── background/
│   │   └── service-worker.ts  # MV3 백그라운드. 모든 메시지 핸들러
│   ├── components/
│   │   ├── Sidebar.tsx        # 계층형 폴더 트리 + AI 자동 정리 버튼
│   │   ├── BookmarkCard.tsx   # 북마크 카드 (D&D 대응)
│   │   ├── BookmarkEditPanel.tsx
│   │   ├── ChromeBookmarkPanel.tsx
│   │   ├── PatternBar.tsx     # 패턴 저장 및 복구 바
│   │   ├── RankingWidget.tsx
│   │   ├── RecentWidget.tsx
│   │   ├── SearchBar.tsx
│   │   └── ThemeToggle.tsx
│   ├── newtab/
│   │   ├── App.tsx            # 관리 대시보드 (전용 탭)
│   │   ├── index.html
│   │   └── main.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx      # 홈 화면 (모든 북마크 목록)
│   │   └── FolderView.tsx     # 폴더별 뷰
│   ├── popup/
│   │   ├── Popup.tsx          # 아이콘 클릭 시 나타나는 팝업 패널
│   │   ├── index.html
│   │   └── main.tsx
│   └── shared/
│       ├── categories.ts      # 기본 폴더 정의 및 도메인 규칙
│       ├── categorizer.ts     # AI 분류 로직 (Gemini Nano + 규칙 기반)
│       ├── storage.ts         # chrome.storage.local CRUD
│       ├── types.ts           # 타입 정의 및 메시지 타입
│       ├── ThemeContext.tsx
│       └── useDialog.tsx      # 확인 대화상자 훅
```

---

## 설정 방법

### 전제 조건

- **Node.js** 18 이상
- **Google Chrome** 최신 버전 (AI 기능 사용 시 Canary 권장)

### 설치 및 빌드

```bash
# 리포지토리 클론
git clone https://github.com/your-name/clickbook.git
cd clickbook

# 의존성 설치
npm install

# 프로덕션 빌드 (dist/ 생성)
npm run build

# 개발 모드 (파일 변경 감지 및 자동 빌드)
npm run dev
```

---

## AI 자동 정리 (핵심 기능)

### 개요

사이드바의 "**AI 자동 정리**" 버튼을 클릭하면, 저장된 모든 북마크를 AI가 분석하여 최적의 폴더로 다시 이동시킵니다.

### 분류 흐름 (개별 저장 시)

```
categorize(url, title, domain)
    │
    ├─ 1. Chrome Gemini Nano로 분류 (window.ai.languageModel)
    │      └─ 성공 → 폴더 ID 반환
    │      └─ 실패 / 사용 불가 ↓
    │
    ├─ 2. 규칙 기반 (도메인 패턴 매칭)
    │      └─ 일치 → 폴더 ID 반환
    │      └─ 불일치 ↓
    │
    └─ 3. "other" (기타 폴더로 폴백)
```

---

## 문의 및 지원

질문, 제안 또는 버그 제보가 있으시면 아래 채널을 이용해 주세요.

- [GitHub Issues](https://github.com/Junpapapo/ClickBook/issues): 버그 제보 및 기능 제안.
- [GitHub Discussions](https://github.com/Junpapapo/ClickBook/discussions): 일반적인 질문 및 커뮤니티 대화.
- 이메일: [junpapapo@gmail.com](mailto:junpapapo@gmail.com)

---

## 라이선스

MIT
