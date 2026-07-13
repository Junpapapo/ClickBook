# ClickBook

> **1클릭으로 탭을 저장하고, AI가 자동으로 폴더에 분류하는 Chrome 확장 프로그램**
> **A Chrome extension that saves tabs with 1-click and auto-categorizes them using AI**

[English version](./README.md) | [日本語版](./README.ja.md) | [한국어판](./README.ko.md)

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/junpa)

## 한국어판

Chrome Manifest V3로 구축된 북마크 관리 도구입니다. 확장 프로그램 아이콘을 클릭하는 것만으로 활성 탭을 즉시 저장하며, Chrome 내장 AI(Gemini Nano) 또는 규칙 기반 폴백을 통해 카테고리로 자동 분류합니다. 관리는 전용 대시보드 탭에서 수행합니다.

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
| 4 | **자동 태깅** | 태그가 없는 북마크에 AI가 자동으로 태그를 생성·저장. AI 사용 불가 시 도메인/제목 기반 규칙 태그로 폴백 |
| 5 | **작업 제어 센터** | 백그라운드 AI 작업(AI 자동 정리, 자동 태깅)을 한 화면에서 실시간 모니터링. 진행률 표시, AI 동시 1개 실행 제한(Concurrency Guard), 완료 3초 후 자동 제거, 실패는 수동 해제 전까지 유지 |
| 6 | **AI 태그 클라우드** | 접기/펼치기 가능한 인터랙티브 HSL 태그 클라우드. 태그 필터링, 중복 태그 병합, 인라인 태그 편집, 태그 클라우드 페이지 헤더에서 직접 자동 태깅 실행 가능 |
| 7 | **계층형 폴더** | 무한 중첩 지원. 생성·이름 변경·이동·삭제·이모지 아이콘 설정 가능 |
| 8 | **드래그 앤 드롭** | 북마크와 폴더, 폴더와 폴더 간의 직관적인 이동 지원 |
| 9 | **패턴 저장** | 현재의 폴더 및 북마크 구성을 스냅샷으로 저장 및 복구 |
| 10 | **Chrome 북마크 연동** | Chrome 북마크 가져오기·내보내기·동기화 지원 |
| 11 | **다크 / 라이트 테마** | 토글 버튼으로 전환 가능. `localStorage`에 상태 유지 |
| 12 | **완전 오프라인** | `chrome.storage.local`을 사용하여 완전 로컬 동작 (별도 서버 불필요) |
| 13 | **다국어 지원** | Chrome i18n API를 사용하여 영어, 일본어, 한국어 완벽 대응 |
| 14 | **AI 하이라이트 스크랩 (Premium)** | 웹페이지 드래그 후 우클릭 메뉴를 통해 크롬 온디바이스 AI가 브라우저 언어에 맞춰 요약한 다국어 메모 자동 저장 |
| 15 | **스마트 탭 서스펜더 (Premium)** | 사용하지 않는 백그라운드 탭을 일시 정지(Sleep)하여 메모리 점유율을 최대 90% 이상 절감 (오디오 재생 탭 등 스마트 필터링 및 원클릭 복원 제공) |
| 16 | **탭 그룹 양방향 동기화 (Premium)** | 활성 크롬 탭 그룹을 클릭북 폴더로 원클릭 백업하고, 반대로 클릭북 폴더를 색상과 이름이 그대로 매핑된 순정 크롬 탭 그룹으로 즉시 재생성 |
| 17 | **개인정보 자동 세션 파쇄 (Premium)** | 민감한 기밀/금융 페이지 폴더를 '보안 폴더'로 지정하면, 해당 탭을 닫을 때 연동된 도메인의 쿠키, 캐시, 스토리지 및 방문 기록을 완전 자동 소거 |
| 18 | **FTS 본문 기반 검색 (Premium)** | 북마크 저장 시 백그라운드에서 페이지 본문을 스크랩 및 광고 정제 후 저장하며, 단어별 띄어쓰기(AND) 입력을 통해 본문 전체를 대상으로 초고속 실시간 매칭 검색 제공 |
| 19 | **오프라인 독서 모드 & 젠 리더 (Premium)** | 광고나 산만함이 없는 전용 독서 모드 제공. 긴 메모 전용 젠 리더(Zen Reader) 모드 포함. 라이트/세피아/다크 테마, 글꼴 유형 및 크기 세팅, 실시간 목차(TOC) 내비게이션, 스크롤 진행 바 완벽 지원 |
| 20 | **AI 클리너** | AI 기반 중복 감지 기능을 통해 중복된 북마크를 찾고 정리할 수 있습니다. |
| 21 | **인터랙티브 마인드맵 (Premium)** | 전체 폴더와 북마크 구조를 시각적인 노드 기반 마인드맵으로 구조화합니다. 노드의 수동 드래그 좌표 배치 유지 및 저장 기능, 로컬 AI 조력자(Gemini Nano)를 활용한 하위 아이디어 확장/요약/번역, 그리고 툴바 및 상세 패널에 탑재된 이모지/아이콘 피커 연동을 완벽히 지원합니다. |
| 22 | **트렌드 랭킹** | GitHub 인기 저장소, Hugging Face 모델, Hacker News 및 Wikipedia 트렌드를 확인할 수 있는 대시보드 내장. |
| 23 | **생산성 보드** | 칸반(Kanban) 스타일의 TODO 보드와 메모 관리 시스템 통합. |
| 24 | **스마트 캘린더 연동 (Premium)** | 할 일(Todo) 목록 및 메모 기능과 유기적으로 연동되는 스마트 캘린더. 국가별(한국/미국/일본 등) 공휴일 자동 동기화(Nager.Date API), Month/Week/Day 뷰 전환, HTML5 드래그앤드롭 기반 일정 및 시간 조정, 다양한 반복 일정(매일/매주/매월 등) 설정을 지원. |
| 25 | **아날로그 스프링노트 (Premium)** | 아날로그 서재 감성의 디지털 리치 텍스트 서식(Tiptap 기반) 노트입니다. 라이트, 그리드, 세피아, 다크의 4가지 비주얼 테마를 완벽히 지원하며 에디터 외곽 배경, 입체 세로 책등 그림자, 패널 세퍼레이터 구분선 색상이 선택된 테마에 맞춰 유기적으로 동기화됩니다. |
| 26 | **ClickBook 버디 & 포커스 타이머 (Premium)** | 귀여운 디지털 펫 버디와 함께 뽀모도로 타이머로 집중을 유도하고, 몰입 완료 시 온 스크린을 뒤덮는 웅장한 인터랙티브 완료 효과 테마(오로라 별밤, 고요한 전나무 숲, 타오르는 벽난로, 노을빛 호숫가, 싱잉볼 사운드가 합성된 명상 요가, 그리고 18종의 시네마틱 켄 번즈 만화 카드)를 제공합니다. |

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
├── docs/
│   └── TASK_CONTROL_CENTER.md # 작업 제어 센터 설계 문서
├── public/
│   ├── _locales/              # 다국어 번역 메시지 파일 (en, ko, ja)
│   ├── icons/                 # 확장 프로그램 아이콘 (16/48/128px)
│   ├── help.html              # 도움말 페이지 (영어)
│   ├── help.ko.html           # 도움말 페이지 (한국어)
│   ├── help.ja.html           # 도움말 페이지 (일본어)
│   └── privacy.html           # 개인정보처리방침 페이지
├── src/
│   ├── background/
│   │   └── service-worker.ts  # MV3 백그라운드 (AI 자동 정리, 자동 태깅 포트 핸들러)
│   ├── components/
│   │   ├── Sidebar.tsx        # 계층형 폴더 트리 + AI 자동 정리(80%) + 자동 태깅(20%) 버튼 + 작업 제어 센터 메뉴
│   │   ├── BookmarkCard.tsx   # 북마크 카드 (D&D 대응)
│   │   ├── BookmarkEditPanel.tsx
│   │   ├── ChromeBookmarkPanel.tsx
│   │   ├── PatternBar.tsx     # 패턴 저장 및 복구 바
│   │   ├── RankingWidget.tsx
│   │   ├── RecentWidget.tsx
│   │   ├── SearchBar.tsx
│   │   └── ThemeToggle.tsx
│   ├── newtab/
│   │   ├── App.tsx            # 관리 대시보드 (전용 탭) + 페이지 라우팅
│   │   ├── index.html
│   │   └── main.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx      # 홈 화면 (모든 북마크 목록)
│   │   ├── FolderView.tsx     # 폴더별 뷰
│   │   ├── TagBoard.tsx       # AI 태그 클라우드, 태그 필터, 병합, 자동 태깅
│   │   ├── TaskControlPage.tsx # 작업 제어 센터 — 백그라운드 AI 작업 실시간 모니터
│   │   ├── TodoBoard.tsx      # 칸반 방식 TODO 보드
│   │   ├── MemoBoard.tsx      # 메모 관리 보드
│   │   ├── BookmarkMap.tsx    # 비주얼 북마크 맵
│   │   ├── GitHubRanking.tsx  # GitHub 트렌딩
│   │   ├── HFRanking.tsx      # Hugging Face AI 트렌딩
│   │   ├── HNRanking.tsx      # Hacker News 트렌딩
│   │   └── WikiRanking.tsx    # Wikipedia 트렌딩
│   ├── popup/
│   │   ├── Popup.tsx          # 아이콘 클릭 시 나타나는 팝업 패널
│   │   ├── index.html
│   │   └── main.tsx
│   └── shared/
│       ├── categories.ts      # 기본 폴더 정의 및 도메인 규칙
│       ├── categorizer.ts     # AI 분류 로직 (Gemini Nano + 규칙 기반)
│       ├── storage.ts         # chrome.storage.local CRUD
│       ├── types.ts           # 타입 정의 (TaskItem 포함)
│       ├── useTaskQueue.ts    # 작업 큐 React 훅 (Concurrency Guard, 자동 제거)
│       ├── i18n.ts            # 번역 사전 (EN / JA / KO)
│       ├── LanguageContext.tsx
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
git clone https://github.com/Junpapapo/ClickBook.git
cd ClickBook

# 의존성 설치
npm install

# 프로덕션 빌드 (dist/ 생성)
npm run build

# 개발 모드 (파일 변경 감지 및 자동 빌드)
npm run dev
```

### Chrome에 로드

1. Chrome에서 `chrome://extensions` 열기
2. 오른쪽 상단 **개발자 모드** 활성화
3. **압축 해제된 확장 프로그램 로드** 클릭
4. 빌드 생성된 `dist/` 폴더 선택

---

## AI 기능

### AI 자동 정리

사이드바의 **"AI 자동 정리"** 버튼(80% 영역)을 클릭하면 저장된 모든 북마크를 3단계 파이프라인으로 재분류합니다:

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

### 자동 태깅

사이드바의 **자동 태깅** 버튼(아이콘, 20% 영역) 또는 태그 클라우드 페이지 헤더의 버튼을 클릭하면 태그 없는 북마크에 자동으로 태그를 부여합니다:

```
autoTag(bookmark)
    │
    ├─ 1. generateSummaryAndTags() — Gemini Nano로 태그 생성
    │      └─ 태그 반환 → updateBookmark()로 스토리지에 저장
    │      └─ 태그 없음 / 실패 ↓
    │
    └─ 2. generateFallbackTags() — 도메인 맵 + 제목 키워드 추출
           └─ 태그 반환 → updateBookmark()로 스토리지에 저장
```

### 작업 제어 센터

사이드바 **"Task Control"** 메뉴로 이동. 모든 AI 백그라운드 작업을 여기서 관리합니다:

- **Concurrency Guard**: AI 작업은 동시에 1개만 실행. 추가 작업은 대기열 등록
- **실시간 진행률**: `chrome.runtime.connect` 포트 메시지를 통한 실시간 업데이트
- **자동 제거**: 완료된 작업은 3초 후 자동 소멸
- **에러 유지**: 실패한 작업은 수동으로 해제하거나 재시도할 때까지 유지

---

## 기본 폴더 (8개 카테고리)

| ID | 이름 | 예시 |
|---|---|---|
| `technology` | 기술 | GitHub, Stack Overflow, MDN |
| `design` | 디자인 | Figma, Dribbble, Behance |
| `business` | 비즈니스 | Notion, Slack, LinkedIn |
| `entertainment` | 엔터테인먼트 | YouTube, Netflix, Twitch |
| `science` | 과학 | arXiv, PubMed, Nature |
| `sports` | 스포츠 | ESPN, BBC Sport |
| `travel` | 여행 | Booking.com, Airbnb |
| `other` | 기타 | 위 카테고리에 해당하지 않는 사이트 |

---

## 문의 및 지원

질문, 제안 또는 버그 제보가 있으시면 아래 채널을 이용해 주세요.

- [GitHub Issues](https://github.com/Junpapapo/ClickBook/issues): 버그 제보 및 기능 제안.
- [GitHub Discussions](https://github.com/Junpapapo/ClickBook/discussions): 일반적인 질문 및 커뮤니티 대화.
- 이메일: [junpapapo@gmail.com](mailto:junpapapo@gmail.com)

---

## 라이선스

MIT
