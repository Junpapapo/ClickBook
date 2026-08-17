# 데이터 스토리지 스키마 명세서 (Storage Schema Specification)

> **문서 버전**: v1.0.0  
> **최종 수정일**: 2026-08-17  
> **스토리지 대상**: `chrome.storage.local` & `IndexedDB (clickbook_spring_note_db)`

---

## 1. 개요 (Overview)

ClickBook은 메타데이터와 설정 관리에 적합한 **`chrome.storage.local`**과, 리치 텍스트 및 캔버스 손글씨/드로잉 등 대용량 바이너리 저장에 최적화된 **`IndexedDB`**를 유기적으로 결합한 하이브리드 로컬 스토리지 아키텍처를 채택하고 있습니다.

---

## 2. chrome.storage.local 키 매핑 테이블

| 키 이름 (`Key`) | 타입 (`TypeScript Type`) | 설명 |
| :--- | :--- | :--- |
| `clickbook_data` | `ClickBookData` | 북마크 목록(`bookmarks`), 폴더 트리(`folders`), 기본 설정(`settings`) |
| `clickbook_todo_board` | `TodoBoardData` | 투두 보드 컬럼 구조(`columns`), 태스크 목록(`tasks`), 컬럼 순서(`columnOrder`) |
| `clickbook_memos` | `Record<string, BookmarkMemo>` | 북마크별 부착된 스티키 메모 데이터 |
| `clickbook_timer_stats` | `Record<string, DayTimerStats>` | 일별 집중 시간(분), 뽀모도로 완료 사이클, 목표 달성 통계 |
| `clickbook_settings` | `UserSettings` | 테마, 언어(i18n), 단축키, 위젯 활성화 플래그 |
| `clickbook_storage_lock` | `boolean` | 동시 쓰기 제어를 위한 전역 뮤텍스 플래그 |

---

## 3. 세부 엔티티 스키마 정의 (Entity Definitions)

### 3.1 Bookmark & Folder 엔티티
```typescript
interface Bookmark {
  id: string;               // 고유 UUID
  title: string;            // 페이지 제목
  url: string;              // 정규화된 웹 URL
  folderId: string;         // 소속 폴더 ID ("root" 또는 UUID)
  savedAt: number;          // Unix timestamp (ms)
  tags?: string[];          // AI 자동 태그 배열
  summary?: string;         // AI 3줄 요약 텍스트
  visitCount?: number;      // 누적 방문 횟수
  lastVisitedAt?: number;   // 최근 방문 일시 (ms)
  isPinned?: boolean;       // 즐겨찾기 고정 여부
  favicon?: string;         // 캐시된 파비콘 URL
}

interface Folder {
  id: string;               // 고유 UUID
  name: string;             // 폴더 이름 (한국어/기본)
  nameJa?: string;          // 일본어 폴더명 (옵션)
  parentId?: string;        // 상위 폴더 ID (계층형 트리)
  icon?: string;            // 폴더 아이콘 식별자
  color?: string;           // 폴더 테마 컬러
  isLocked?: boolean;       // AI 자동정리 제외 잠금 플래그
  createdAt: number;
}
```

### 3.2 TodoTask 엔티티 (포커스 타이머 연동 지원)
```typescript
interface TodoTask {
  id: string;               // 고유 UUID
  content: string;          // 태스크 제목 / 본문
  completed: boolean;       // 완료 여부
  createdAt: number;
  completedAt?: number;
  dueDate?: string;         // YYYY-MM-DD
  dueTime?: string;         // HH:mm
  startDate?: string;       // 시작일 YYYY-MM-DD
  reminder?: string;        // "15m" | "1h" | "1d" 등
  tags?: string[];
  progress?: number;        // 0 ~ 100 (%)
  description?: string;     // 마크다운 상세 설명
  checklist?: { id: string; text: string; completed: boolean }[];
  color?: string;
  icon?: string;
  focusMinutes?: number;    // 누적 집중 시간 (분) - Buddy Timer 연동
  focusCycles?: number;     // 누적 뽀모도로 사이클 수
}
```

---

## 4. IndexedDB 스키마 (`clickbook_spring_note_db`)

- **Database Name**: `clickbook_spring_note_db`
- **Database Version**: `2`

### 4.1 Object Store: `notes`
스프링노트의 각 페이지별 메타데이터 및 Tiptap WYSIWYG HTML 본문 데이터를 저장합니다.

| 필드명 | 타입 | 속성 | 설명 |
| :--- | :--- | :--- | :--- |
| `id` | `string` | **Primary Key** (keyPath) | 스프링노트 고유 식별자 (`note_${id}`) |
| `title` | `string` | - | 노트 제목 |
| `pages` | `NotePage[]` | - | 페이지 배열 (HTML 본문, 캔버스 레이어, 스티커) |
| `createdAt` | `number` | Index | 최초 생성 일시 |
| `updatedAt` | `number` | Index | 최근 수정 일시 |
| `coverColor` | `string` | - | 표지 색상 및 질감 스타일 |

### 4.2 Object Store: `images`
스프링노트에 삽입된 고해상도 캔버스 드로잉 및 첨부 이미지를 Key-Value Blob 형태로 보존합니다.

| 필드명 | 타입 | 속성 | 설명 |
| :--- | :--- | :--- | :--- |
| `id` | `string` | **Primary Key** | 이미지 해시 키 (`img_${hash}`) |
| `data` | `string` (Base64/Blob) | - | 압축 최적화된 이미지 바이너리 데이터 |
| `createdAt` | `number` | - | 업로드 일시 |
