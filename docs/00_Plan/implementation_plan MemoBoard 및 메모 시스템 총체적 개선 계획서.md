# [MemoBoard 및 메모 시스템 총체적 개선 계획서]

[MemoBoard.tsx](file:///c:/00_Workspace/ClickBook/src/pages/MemoBoard.tsx) 및 [storage.ts](file:///c:/00_Workspace/ClickBook/src/shared/storage.ts)의 치명적 데이터 유실 버그 수정, N+1 쿼리 및 렌더링 성능 최적화, 검색/필터 기능 및 피그마 스타일 UI/UX 디테일을 단계별로 안전하게 개선합니다.

---

## 단계별 실행 로드맵 (Step-by-Step Roadmap)

### 📌 1단계: 데이터 무결성 & 핵심 논리 버그 픽스 (Data Safety & Logic)
- **1-1. `saveMemo()` 앵커 메모 보존**: [storage.ts](file:///c:/00_Workspace/ClickBook/src/shared/storage.ts)에서 메모 저장 시 기존 `anchoredMemos`를 그대로 유지하도록 객체 병합 로직 수정.
- **1-2. 색상 변경 시 편집 텍스트 보존**: [MemoBoard.tsx](file:///c:/00_Workspace/ClickBook/src/pages/MemoBoard.tsx)의 `handleColorChange`에서 편집 중(`editing`)인 경우 `draft` 텍스트를 우선 저장하도록 보정.
- **1-3. 인라인 삭제 확인(Confirm) UI 구현**: 실수로 인한 영구 삭제를 방지하기 위해, 브라우저 기본 팝업 없이 카드 내부에서 슬림한 인라인 확인("삭제할까요? [삭제][취소]") UI 적용.
- **1-4. 마크다운 인터랙션 가드**: 마크다운 내 링크 클릭 시 버블링 방지(`e.stopPropagation()`) 및 텍스트 드래그 선택 시 편집 모드로 강제 전환되지 않도록 `window.getSelection()` 가드 추가.
- **1-5. 단축키 일관성 부여**: [MemoCard](file:///c:/00_Workspace/ClickBook/src/pages/MemoBoard.tsx#L197) 편집창에 `Ctrl+Enter` / `Cmd+Enter` 즉시 저장 단축키 추가.

### 📌 2단계: 퍼포먼스 및 리소스 최적화 (Performance Optimization)
- **2-1. N+1 스토리지 쿼리 제거**: 카드가 N개일 때 N번 실행되던 `chrome.storage.local.get("clickbook_ai_enabled")`를 상위 [MemoBoard](file:///c:/00_Workspace/ClickBook/src/pages/MemoBoard.tsx)에서 1회만 조회하여 자식 컴포넌트로 전달.
- **2-2. `useMemo` 연산 캐싱**: `memoList` 정렬(`updatedAt` 기준) 및 북마크 매핑(`new Map`)을 `useMemo`로 캐싱하여 불필요한 매 프레임 재연산 방지.
- **2-3. `React.memo` 컴포넌트 메모이제이션**: [MemoCard](file:///c:/00_Workspace/ClickBook/src/pages/MemoBoard.tsx)를 `React.memo`로 감싸 특정 메모를 편집하거나 상위 상태가 바뀔 때 모든 카드가 재렌더링되지 않도록 차단.

### 📌 3단계: UX, 검색/필터, 디자인 디테일 및 다국어 완비 (UI/UX & i18n)
- **3-1. 실시간 검색창 & 색상 필터 탑재**: 헤더에 키워드 검색 인풋(메모 본문 및 연동 사이트명 검색)과 원클릭 컬러 필터 칩(전체 / 노랑 / 분홍 / 파랑 / 초록 / 보라) 추가.
- **3-2. 그리드 레이아웃 붕괴 방지**: 컬럼 강제 지정 시에도 `minmax(200px, 1fr)` 최소 너비를 적용하여 좁은 화면에서 카드가 찌그러지지 않도록 보호.
- **3-3. 복사 피드백 마이크로 인터랙션**: 복사 버튼 클릭 시 1.5초간 녹색 체크 아이콘 및 툴팁 전환.
- **3-4. 마크다운 스타일링 강화**: 코드 블록, 인라인 코드, 체크박스(`- [ ]`), 인용구 스타일을 피그마 스타일 가이드에 맞게 보강.
- **3-5. 파비콘 에러 시 Fallback**: 파비콘 로드 실패 시 빈 공간 대신 세련된 `Globe` 기본 아이콘 렌더링.
- **3-6. 5px 슬림 커스텀 스크롤바**: 긴 텍스트 입력창 및 마크다운 영역에 5px 슬림 스크롤바(`custom-scrollbar`) 적용.
- **3-7. 하드코딩 영어 제거 및 다국어 지원**: `Cancel`, `Save`, `Copy`, `Clear text` 등을 `t()` 기반으로 완벽 연동하고 번역 사전(`ko.ts`, `en.ts`, `ja.ts`) 보강.

### 📌 4단계: 빌드 검증 및 최종 점검
- `npm run build`를 실행하여 TypeScript 컴파일 에러 및 번들 무결성 synchronous 검증.

---

## Proposed Changes

### [Core Storage]

#### [MODIFY] [storage.ts](file:///c:/00_Workspace/ClickBook/src/shared/storage.ts)
- `saveMemo`: 기존 `existing.anchoredMemos` 보존 처리.

### [Memo Board UI & Components]

#### [MODIFY] [MemoBoard.tsx](file:///c:/00_Workspace/ClickBook/src/pages/MemoBoard.tsx)
- 상위 `MemoBoard`: `aiEnabled` 1회 조회 후 전달, `searchQuery` & `colorFilter` 상태 및 UI 추가, `useMemo` 캐싱, 컬럼 레이아웃 안전장치.
- [MemoCard](file:///c:/00_Workspace/ClickBook/src/pages/MemoBoard.tsx): `React.memo` 적용, `handleColorChange` 텍스트 보존, 인라인 삭제 확인 UI, 마크다운 링크/드래그 가드, 복사 피드백 마이크로 인터랙션, `Ctrl+Enter` 저장 단축키, 파비콘 fallback, 5px 슬림 스크롤바.
- [NewMemoCard](file:///c:/00_Workspace/ClickBook/src/pages/MemoBoard.tsx): `aiEnabled` prop 수신, 복사 피드백 적용.

### [i18n Translations]

#### [MODIFY] [ko.ts](file:///c:/00_Workspace/ClickBook/src/shared/i18n/ko.ts)
#### [MODIFY] [en.ts](file:///c:/00_Workspace/ClickBook/src/shared/i18n/en.ts)
#### [MODIFY] [ja.ts](file:///c:/00_Workspace/ClickBook/src/shared/i18n/ja.ts)
- 메모 보드 관련 신규 키(`memoSearchPlaceholder`, `memoDeleteConfirm`, `copied`, `clearText`, `allColors` 등) 보강.

---

## Verification Plan

### Automated Tests & Build
- `npm run build` 실행하여 TypeScript 타입 오류 및 빌드 무결성 검증.

### Manual / Visual Verification
1. 북마크에 앵커 메모가 있을 때 메모 보드에서 수정해도 앵커 메모가 지워지지 않는지 검증.
2. 메모 수정 중 상단 색상 칩 클릭 시 편집 중이던 텍스트가 날아가지 않는지 검증.
3. 삭제 버튼 클릭 시 인라인 확인창이 부드럽게 나타나고 취소/확인이 정상 작동하는지 검증.
4. 마크다운 링크 클릭 시 탭만 열리고 편집창으로 바뀌지 않는지, 텍스트 드래그 시 편집창으로 전환되지 않는지 검증.
5. 검색창에 키워드 입력 시 실시간으로 메모가 필터링되는지 검증.
6. 복사 버튼 클릭 시 체크 아이콘으로 전환되는 마이크로 인터랙션 검증.
