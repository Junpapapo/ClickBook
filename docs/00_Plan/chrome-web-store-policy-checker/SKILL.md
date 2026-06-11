---
name: chrome-web-store-policy-checker
description: >-
  Checks a Chrome Extension's source code, manifest, storage configurations, and metadata 
  for compliance with Chrome Web Store developer policies (e.g., Single Purpose, User Data, Search Override).
---

# Chrome Web Store Policy Compliance Checker

## Overview
이 스킬은 Chrome 확장 프로그램 개발 시 Chrome Web Store의 주요 정책(단일 목적 원칙, 사용자 데이터 보호, 검색 엔진 및 새 탭 변경 규정 등)을 위반하는 요소가 코드나 설정 파일에 남아있는지 점검하고 예방하는 규격화된 검사 절차를 정의합니다.

## Dependencies
- 없음

## Quick Start
크롬 확장 프로그램의 루트 디렉토리에서 다음 검사 워크플로우를 따라 Manifest, 소스코드, 도움말 및 설명 문구를 진단합니다.

---

## Workflow (정책 준수 검사 절차)

### 1. 단일 목적 원칙 (Single Purpose Policy) 검사
확장 프로그램이 여러 개의 이종 기능을 동시에 탑재하거나 번들링하여 제공하는지 확인합니다.
- **검사 방법**:
  1. `manifest.json`을 열어 `permissions`와 `host_permissions`가 목적에 맞는 최소한의 범위인지 진단합니다.
  2. 하나의 확장 프로그램 안에서 **새 탭 페이지 대체**(`chrome_url_overrides.newtab`) 기능과 **검색엔진 가로채기/변경** 기능을 동시에 제공하고 있는지 코드 패턴을 진단합니다.
  3. 만약 복수 기능의 징후가 포착될 경우, 즉시 분리하여 각각 별도의 확장 프로그램으로 빌드하거나 불필요한 기능을 완전 소거하도록 제안합니다.

### 2. 검색 엔진 변경 및 검색 환경 가로채기 (Search Override) 검사
사용자가 설정한 기본 검색 환경(Google, Bing 등)을 확장 프로그램이 임의로 우회하거나 변경하고 있는지 감사(Audit)합니다.
- **검사 방법**:
  1. 확장 프로그램 내에 임의의 커스텀 검색창(예: Google/YouTube/GitHub 분기 검색 기능 등)이 존재하는지 소스코드 내 UI 컴포넌트를 조사합니다.
  2. 새 탭 페이지 내에 검색바가 포함되어 있는 경우, 반드시 **Chrome Search API**를 사용하여 사용자가 브라우저 설정에서 선택한 기본 검색 엔진 설정을 그대로 상속받고 있는지 확인합니다.
  3. 만약 자체적인 검색 라우팅이나 특정 검색 포털 강제 이동 로직이 발견되면 즉시 해당 코드를 제거합니다.
  4. 대시보드 내 검색바가 존재하는 경우, 웹 검색이 아닌 **내부 데이터(예: 북마크, 로컬 저장소) 검색용 전용 필터**임을 플레이스홀더(`i18n`) 및 아이콘 UI를 통해 직관적으로 표현하고 있는지 점검합니다.

### 3. 새 탭 페이지 기본값 및 활성화 방식 제어 검사
사용자의 동의 없이 새 탭 페이지를 강제로 점유하는 행위가 발생하는지 확인합니다.
- **검사 방법**:
  1. 기본 설정값 정의부(예: `storage.ts` 또는 `DEFAULT_SETTINGS`)에서 새 탭 대체 활성화 플래그의 기본값이 `false` (OFF)로 지정되어 있는지 확인합니다.
  2. 최초 실행 시 또는 사용자 설정이 누락되었을 때, 무조건 크롬 순정 새 탭 페이지로 넘어가도록(Fallback) 리다이렉트 분기 조건이 엄격하게(`=== true`) 설정되었는지 검증합니다.

### 4. 최소 권한 원칙 (Use of Least Privilege) 및 설명서 갱신 검사
스토어 등록용 문서와 프로젝트 소스코드 간의 선언 권한이 일치하는지 진단합니다.
- **검사 방법**:
  1. `manifest.json`에서 선언된 권한들이 실제로 코드 상에서 사용 중인지 전수 조사하고, 미사용 권한이 있다면 `manifest.json`에서 삭제합니다.
  2. 스토어 설명서([CHROME_WEB_STORE.md](file:///c:/00_Workspace/ClickBook/docs/CHROME_WEB_STORE.md), `store_registration_guide.md`) 및 리드미([README.md](file:///c:/00_Workspace/ClickBook/README.md))에서 앞서 제거한 정책 위반 기능(예: 시맨틱 웹 검색, 외부 추천 사이트 등)에 대한 설명 텍스트가 잔존하고 있는지 키워드 검색을 실행하여 해당 문구를 영구 삭제합니다.

---

## Common Mistakes (자주 발생하는 위반 유형)
1. **검색엔진 조작 경고 (Red Argon)**:
   - *실수*: 새 탭 페이지를 제공하면서 그 안에 구글, 유튜브 등 검색 옵션을 갖춘 커스텀 검색바를 임의로 렌더링하는 경우.
   - *해결*: 해당 검색 영역을 완전 삭제하거나, 오직 로컬 북마크만 찾아주는 "북마크 전용 로컬 검색"으로 역할을 한정하고 UI를 시각적으로 분리해야 합니다.
2. **새 탭 활성화 강제**:
   - *실수*: 사용자가 원하지 않는데 최초 설치 즉시 새 탭 페이지가 ClickBook으로 변경되는 상태를 기본값(`true`)으로 배포하는 경우.
   - *해결*: 기본 세팅을 반드시 `false`로 하고 사용자가 명시적으로 동의(Keep changes 선택)하여 켤 때만 점유하도록 비활성화 처리해야 합니다.
