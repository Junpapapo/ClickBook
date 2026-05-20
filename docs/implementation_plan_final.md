# 🏪 ClickBook 크롬 웹스토어 등록 준비 — 종합 분석 보고서

## 현재 상태 요약

| 영역 | 상태 | 비고 |
|------|------|------|
| Manifest V3 구조 | ✅ | 필수 필드 모두 존재 |
| 아이콘 (16/48/128) | ✅ | 투명 배경 적용 완료 |
| 프로모션 이미지 3종 | ✅ | docs/ 폴더에 영어 버전 저장 |
| 개인정보 보호정책 | ⚠️ | 내용 OK, GitHub URL 플레이스홀더 |
| 빌드 시스템 | ✅ | Vite + vite-plugin-web-extension |
| i18n 시스템 (EN/JA/KO) | ⚠️ | 시스템은 있으나 누락 다수 |
| CSP / MV3 보안 | ✅ | eval 없음, 인라인 스크립트 없음 |
| 에러 처리 | 🔴 | Error Boundary 전무 |

---

## 🔴 CRITICAL — 반드시 수정 필요

### 1. React Error Boundary 없음

앱 전체에 Error Boundary가 없어서, 컴포넌트 렌더링 에러 시 **빈 화면(White Screen)**이 됩니다.
CWS 리뷰어는 안정성을 테스트합니다.

> [!CAUTION]
> Popup과 Newtab 모두 Error Boundary가 없습니다. 렌더링 크래시 시 사용자에게 빈 화면만 노출됩니다.

**대상 파일:**
- [Popup main.tsx](file:///c:/00_Workspace/ClickBook/src/popup/main.tsx) — ErrorBoundary로 `<Popup />` 감싸기
- [Newtab main.tsx](file:///c:/00_Workspace/ClickBook/src/newtab/main.tsx) — ErrorBoundary로 `<App />` 감싸기
- [NEW] `src/components/ErrorBoundary.tsx` — 공통 에러 바운더리 컴포넌트 생성

---

### 2. service-worker.ts 일본어 하드코딩 (8곳)

백그라운드 스크립트에 일본어 에러 메시지가 직접 작성되어 있어 i18n이 적용되지 않습니다.
서비스 워커에서는 React Context를 사용할 수 없으므로, `chrome.storage.local`에서 언어 설정을 읽어 처리해야 합니다.

| 위치 | 현재 (일본어) | 수정 (영어 기본값) |
|------|-------------|-------------------|
| Line 49 | `このURLは既に登録済みです` | `This URL is already saved` |
| Line 57 | `登録済みのURLです` | `This URL is already registered` |
| Line 59 | `http/https の URL を入力してください` | `Please enter an http/https URL` |
| Line 163 | `スナップショットがありません` | `No snapshot available` |
| Line 268 | `AI整理バックアップ ...` | `AI Organize Backup ...` |
| Line 304 | `アクティブなタブが見つかりません` | `No active tab found` |
| Line 307 | `タブのURLを取得できませんでした` | `Could not get tab URL` |
| Line 310 | `http/https 以外のURLは保存できません` | `Only http/https URLs can be saved` |

---

### 3. Chrome 폴더 생성 시 항상 일본어 이름 사용

[service-worker.ts](file:///c:/00_Workspace/ClickBook/src/background/service-worker.ts) Line 472에서 `folder.nameJa`를 사용하여 Chrome 북마크 폴더를 생성합니다. 사용자 언어와 무관하게 항상 일본어 이름이 됩니다.

**수정:** 사용자 언어 설정에 따라 `nameEn` / `nameJa` / `nameKo` 중 적절한 것을 선택하도록 변경

---

## 🟡 IMPORTANT — 등록 전 수정 권장

### 4. i18n 누락 하드코딩 문자열 (~20곳)

i18n 시스템(`t()` 함수)을 사용하지 않고 직접 작성된 문자열이 다수 있습니다.

**한국어 하드코딩:**
| 파일 | 위치 | 내용 |
|------|------|------|
| Popup.tsx | Line 371 | `"GitHub 랭킹"` |
| SettingsModal.tsx | Lines 237-240 | `"GitHub 랭킹"`, 설명 텍스트 |
| GitHubRanking.tsx | 전체 | 제목, 버튼, 에러 메시지 등 **페이지 전체가 한국어** |

**영어 하드코딩:**
| 파일 | 위치 | 내용 |
|------|------|------|
| Sidebar.tsx | Line 619 | `"Folders"` |
| Sidebar.tsx | Line 626 | `"Add root folder"` 툴팁 |
| Sidebar.tsx | Line 673 | `"Drop bookmarks on folders to organize"` |
| Sidebar.tsx | Line 575 | `"✓ AI Organize done"` |
| Sidebar.tsx | Line 580 | `"Backup: "` |
| SettingsModal.tsx | Lines 207, 214, 221, 296, 303 | `"JSON Export"`, `"HTML Export"`, `"Import"`, `"Close"`, `"Save"` |

### 5. 스크린샷 미제작

> [!IMPORTANT]
> 크롬 웹스토어 등록 시 **최소 1장, 권장 3~5장**의 스크린샷이 필요합니다 (1280×800 또는 640×400 PNG).

**제안 스크린샷 구성:**
1. 대시보드 (메인 화면) — 폴더 구조와 북마크 카드
2. 팝업 화면 — 빠른 저장 + URL 복사 도구
3. GitHub 랭킹 — 실시간 랭킹 테이블
4. 메모보드 — 메모 기능
5. Chrome 북마크 연동 — 일괄 가져오기/내보내기

### 6. 개인정보 보호정책 — GitHub URL 플레이스홀더

[PRIVACY_POLICY.md](file:///c:/00_Workspace/ClickBook/PRIVACY_POLICY.md)에서 Contact URL이 `https://github.com/YOUR_USERNAME/ClickBook/issues`로 되어 있어 실제 GitHub 유저네임으로 교체 필요

### 7. HTML 파일 `lang="ja"` 하드코딩

- [popup/index.html](file:///c:/00_Workspace/ClickBook/src/popup/index.html) — `<html lang="ja">`
- [newtab/index.html](file:///c:/00_Workspace/ClickBook/src/newtab/index.html) — `<html lang="ja">`

→ `lang="en"` 또는 동적 감지로 변경 필요

---

## 🟢 MINOR — 품질 향상용

### 8. Empty Catch 블록 (12곳 이상)

에러를 무시하는 빈 catch 블록이 다수 존재합니다. 프로덕션에서 디버깅이 매우 어렵습니다.

```typescript
// 현재
catch { /* ignore */ }

// 개선
catch (err) { console.warn("Operation failed:", err); }
```

### 9. manifest.json 개선

- `short_name` 추가 (12자 이내)
- `author` 필드 추가
- `homepage_url` 추가 (GitHub repo URL)

### 10. CHROME_WEB_STORE.md 문서 업데이트

프로모션 이미지 상태가 `❌ 未作成`으로 되어 있으나 실제로는 이미 생성 완료. 문서 최신화 필요

### 11. README.md 전체가 일본어

GitHub 공개 시 영어 README가 필요하거나, 최소한 영어 섹션 추가 권장

---

## 💡 기능/UI 개선 제안

### A. 온보딩 / 첫 실행 가이드

신규 사용자를 위한 간단한 튜토리얼 또는 Welcome 화면. 첫 설치 후 어떻게 사용하는지 안내하면 CWS 평점에 긍정적.

### B. 키보드 단축키 안내 UI

현재 `Alt+S` 단축키가 있지만 앱 내에서 안내가 없음. 설정 또는 팝업에 단축키 목록 표시 제안

### C. 데이터 사용량 표시

`chrome.storage.local`의 용량 사용 현황(현재 / 최대 10MB)을 설정 화면에 표시

### D. 북마크 검색 강화

현재 검색은 제목 기반. URL 검색, 태그 검색, 날짜별 필터 등 고급 검색 기능 추가

---

## 📋 우선순위별 실행 계획

### Phase 1 — 필수 수정 (CWS 등록 차단 요소)
1. ErrorBoundary 컴포넌트 생성 및 적용
2. service-worker.ts 일본어 → 영어 하드코딩 수정
3. Chrome 폴더 생성 시 언어 설정 반영
4. HTML `lang` 속성 수정
5. 개인정보 보호정책 GitHub URL 수정

### Phase 2 — 품질 개선 (리뷰 통과율 향상)
6. i18n 누락 문자열 처리 (Popup, Sidebar, Settings, GitHubRanking)
7. 스크린샷 5종 제작
8. manifest.json 보완 (`short_name`, `author`, `homepage_url`)
9. Empty catch 블록 개선

### Phase 3 — 선택적 개선 (사용자 경험)
10. 문서 업데이트 (CHROME_WEB_STORE.md, README.md)
11. 온보딩 가이드
12. 키보드 단축키 안내
13. 저장소 용량 표시

---

## User Review Required

> [!IMPORTANT]
> Phase 1~2를 우선 진행하고 싶습니다. 전체 진행할까요, 아니면 특정 항목만 선택하시겠습니까?

## Open Questions

1. **GitHub 유저네임**이 무엇인가요? (개인정보 보호정책과 manifest의 homepage_url에 사용)
2. **스크린샷 5종 제작**도 같이 진행할까요? (실제 앱을 빌드하고 브라우저에서 캡처하는 방식)
3. **온보딩 가이드**나 **키보드 단축키 안내** 같은 Phase 3 기능도 추가하시겠습니까?
