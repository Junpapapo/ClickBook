# 런타임 메시지 프로토콜 명세서 (Runtime Message Protocol Specification)

> **문서 버전**: v1.0.0  
> **최종 수정일**: 2026-08-17  
> **핸들러 경로**: `src/background/services/message-router.ts`

---

## 1. 개요 (Overview)

ClickBook의 모든 컴포넌트(Popup, NewTab, Content Script Buddy)는 `chrome.runtime.sendMessage`를 통해 백그라운드 Service Worker의 `MessageRouter`와 통신합니다.  
본 명세서는 정의된 전수 메시지 타입, 페이로드 규격, 반환 객체 구조 및 비동기 처리 규칙을 정의합니다.

---

## 2. 메시지 인터페이스 규격 (Message Interface Standard)

모든 요청과 응답은 타입스크립트 유니온 타입 `Message` (`src/shared/types.ts`)를 준수해야 합니다.

### 2.1 공통 응답 포맷 (Standard Response Format)
```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
```

---

## 3. 메시지 타입별 상세 프로토콜 명세표 (Full Protocol Reference)

### 3.1 북마크 & 폴더 관리 프로토콜 (Bookmarks & Folders)

| 메시지 타입 (`type`) | 송신처 | 페이로드 (`Payload`) | 응답 데이터 (`data`) | 비고 |
| :--- | :--- | :--- | :--- | :--- |
| `GET_ALL_BOOKMARKS` | All | `{}` | `Bookmark[]` | 저장된 전체 북마크 목록 반환 |
| `SAVE_BOOKMARK` | Popup / Buddy | `{ bookmark: Partial<Bookmark> }` | `Bookmark` | 신규 북마크 생성 및 저장 |
| `UPDATE_BOOKMARK` | NewTab | `{ id: string, changes: Partial<Bookmark> }` | `Bookmark` | 북마크 정보 수정 |
| `DELETE_BOOKMARK` | NewTab / Cleaner | `{ id: string }` | `{ id: string }` | 단일 북마크 삭제 |
| `GET_FOLDERS` | All | `{}` | `Folder[]` | 전체 폴더 트리 구조 반환 |
| `CREATE_FOLDER` | NewTab / Popup | `{ name: string, parentId?: string }` | `Folder` | 새 폴더 생성 |
| `RENAME_FOLDER` | NewTab | `{ id: string, name: string }` | `Folder` | 폴더명 변경 |
| `DELETE_FOLDER` | NewTab | `{ id: string }` | `{ id: string }` | 폴더 삭제 (하위 북마크 기타 이동) |

---

### 3.2 뽀모도로 타이머 & 버디 프로토콜 (Buddy & Focus Timer)

| 메시지 타입 (`type`) | 송신처 | 페이로드 (`Payload`) | 응답 데이터 (`data`) | 비고 |
| :--- | :--- | :--- | :--- | :--- |
| `BUDDY_GET_STATE` | Buddy / Popup | `{}` | `BuddyState` | 버디 설정, 위치, 타이머 상태 조회 |
| `BUDDY_SET_CONFIG` | Settings / Buddy | `{ config: Partial<BuddyConfig> }` | `BuddyConfig` | 버디 캐릭터, 음소거 등 설정 갱신 |
| `BUDDY_ADD_TIMER_STATS` | Buddy Timer | `{ minutes: number, addCycle?: boolean, goal?: string, taskId?: string }` | `TimerStats` | **타이머 완료 기록 + Todo 태스크 연동 집중시간 누적** |
| `BUDDY_GET_TIMER_STATS` | NewTab / Buddy | `{}` | `Record<string, DayTimerStats>` | 일별 누적 집중 시간 통계 반환 |

---

### 3.3 투두 보드 & 캘린더 프로토콜 (TodoBoard & Tasks)

| 메시지 타입 (`type`) | 송신처 | 페이로드 (`Payload`) | 응답 데이터 (`data`) | 비고 |
| :--- | :--- | :--- | :--- | :--- |
| `GET_TODO_BOARD` | NewTab / Buddy | `{}` | `TodoBoardData` | 칸반 컬럼 및 태스크 전체 조회 |
| `SAVE_TODO_BOARD` | NewTab | `{ board: TodoBoardData }` | `TodoBoardData` | 칸반 보드 전체 스냅샷 저장 |
| `ADD_TODO_TASK` | NewTab / Buddy | `{ columnId: string, task: TodoTask }` | `TodoTask` | 신규 태스크 추가 |
| `UPDATE_TODO_TASK` | NewTab | `{ taskId: string, updates: Partial<TodoTask> }` | `TodoTask` | 태스크 내용/마감일/집중시간 수정 |

---

### 3.4 스프링노트 (IndexedDB) 백업 연동 프로토콜 (SpringNote DB)

| 메시지 타입 (`type`) | 송신처 | 페이로드 (`Payload`) | 응답 데이터 (`data`) | 비고 |
| :--- | :--- | :--- | :--- | :--- |
| `GET_ALL_SPRING_NOTES` | NewTab (Export) | `{}` | `SpringNote[]` | **IndexedDB의 전체 스프링노트 일괄 조회** |
| `SAVE_ALL_SPRING_NOTES` | NewTab (Import) | `{ notes: SpringNote[] }` | `{ count: number }` | **백업 파일로부터 IndexedDB 일괄 복원** |

---

### 3.5 AI & 리더모드 프로토콜 (AI & Reader Mode)

| 메시지 타입 (`type`) | 송신처 | 페이로드 (`Payload`) | 응답 데이터 (`data`) | 비고 |
| :--- | :--- | :--- | :--- | :--- |
| `AI_CATEGORIZE_PAGE` | Popup / Content | `{ title: string, url: string, content?: string }` | `{ folderName: string, tags: string[] }` | Gemini Nano 기반 자동 폴더 분류 |
| `AI_SUMMARIZE_PAGE` | Reader / Popup | `{ text: string, lang?: string }` | `{ summary: string }` | 페이지 3줄 핵심 요약 생성 |
| `GET_READER_ARTICLE` | Reader Viewer | `{ url: string }` | `ReaderArticleData` | 광고 제거된 본문 텍스트 추출 |

---

## 4. 비동기 리스너 규칙 (Async Listener Rules)

Chrome Extensions Manifest V3에서는 비동기 응답을 반환할 때 리스너 함수가 반드시 `true`를 반환해야 포트가 닫히지 않습니다.

```typescript
// 올바른 비동기 리스너 패턴 (src/background/service-worker.ts)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessageAsync(message, sender)
    .then((result) => sendResponse({ success: true, data: result }))
    .catch((err) => sendResponse({ success: false, error: err.message }));
  
  return true; // 비동기 응답 대기를 위한 필수 반환값
});
```
