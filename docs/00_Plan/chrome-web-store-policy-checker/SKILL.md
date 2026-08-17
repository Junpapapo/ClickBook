---
name: chrome-web-store-policy-checker
description: >-
  Checks a Chrome Extension's source code, manifest, storage configurations, and metadata 
  for comprehensive compliance with Chrome Web Store Developer Program Policies 
  (including Quality, User Data Privacy, Security, Spam & Impersonation, and MV3 rules).
---

# Comprehensive Chrome Web Store Policy Compliance Checker

## Overview
이 스킬은 크롬 확장 프로그램을 웹 스토어에 출시하거나 업데이트할 때, Google의 **Chrome Web Store Developer Program Policies (개발자 프로그램 정책)** 전반을 만족하는지 검증하는 종합 체크리스트 및 진단 절차를 정의합니다. 단순한 '단일 목적 위반'뿐만 아니라 보안, 개인정보, 스팸, 매니페스트 규정 등 전반적인 출시 허들을 사전 차단하도록 돕습니다.

## Dependencies
- 없음

## Comprehensive Checklist & Workflow

### 1. 품질 가이드라인 (Quality Guidelines)
- **[ ] 단일 목적 원칙 (Single Purpose)**
  - 확장 프로그램은 범위가 좁고 이해하기 쉬운 단일 목적(Single Purpose)만을 가져야 합니다.
  - *검사*: 서로 관련이 없거나 독립적으로 기능하는 다수의 주요 도구를 하나의 패키지에 포함시켰는지 확인합니다 (예: 북마크 관리자 + 검색 엔진 조작 + 암호화폐 지갑 번들링 등 금지).
- **[ ] 검색 및 새 탭 설정 변경 (Settings Override & Search API)**
  - 사용자 환경(기본 검색 엔진, 새 탭 페이지, 시작 페이지)을 대체할 때 임의의 방식으로 우회해서는 안 됩니다.
  - *검사*: 새 탭 대체 페이지 내에 검색 바를 탑재하는 경우, Chrome Search API를 활용하여 사용자가 기존에 선택한 기본 검색 엔진의 권한을 온전히 존중하는지 검증합니다.
- **[ ] UI 투명성 및 동의 획득 (User Control)**
  - 사용자에게 브라우저 변경에 관한 명시적이고 투명한 확인 창(예: 크롬 기본 경고 대화상자)을 노출해야 하며, 이를 프로그래밍 방식으로 조작하거나 강제 승인하게 유도해서는 안 됩니다.

### 2. 사용자 데이터 및 개인정보 보호 (User Data & Privacy)
- **[ ] 최소 권한 원칙 (Use of Least Privilege)**
  - 확장 프로그램이 제대로 동작하는 데 꼭 필요한 최소한의 API 권한(permissions) 및 호스트 권한(host_permissions)만 요청해야 합니다.
  - *검사*: `manifest.json` 내에 광범위한 `<all_urls>` 혹은 과도한 백그라운드 스크립트 권한이 남아있지 않은지 검사합니다.
- **[ ] 데이터 최소화 및 설명 제출 (Data Minimization & Justification)**
  - 사용자로부터 불필요한 개인정보, 인터넷 사용 기록, 쿠키 등을 절대 수집하지 않아야 합니다.
  - *검사*: 대시보드에 기입할 모든 권한 정보에 대해 "무슨 목적으로 어떤 데이터를 취하는지" 개발자 근거 진술(Justification)이 정책 기준에 맞게 준비되었는지 점검합니다.
- **[ ] 개인정보처리방침 (Privacy Policy)**
  - 기밀 권한이나 사용자 데이터를 처리하는 경우, 공식적인 개인정보처리방침(Privacy Policy) 링크를 반드시 제공해야 합니다.
  - *검사*: 유효한 도메인(예: GitHub Pages 등)에 웹 스토어 등록 정보와 일치하는 프라이버시 정책 문서가 실제 업로드되어 있는지 확인합니다.

### 3. 제품 무결성 및 보안 (Product Integrity & Security)
- **[ ] 원격 호스팅 코드 전면 금지 (No Remote Code Execution)**
  - 확장 프로그램의 소스 코드 내에 외부 서버로부터 스크립트, CSS, JSON, Wasm 파일 등을 다운로드하여 런타임에 동적으로 실행(eval, new Function, external script injection 등)하는 로직이 없어야 합니다.
  - *검사*: 모든 실행 스크립트가 로컬 패키지(dist) 내에 온전히 물리적으로 번들링되어 있는지 확인합니다.
- **[ ] 안전한 통신 프로토콜 (Secure Communication)**
  - 외부 API와 통신할 때 모든 요청은 반드시 `HTTPS` 보안 연결을 거쳐야 합니다.
- **[ ] 웹 안전성 및 크로스 사이트 스크립팅 (XSS & Injection Protection)**
  - DOM 조작 시 사용자 입력값을 안전하게 이스케이프 처리하여 악성 코드 인젝션 및 취약성을 완벽히 차단해야 합니다 (`dangerouslySetInnerHTML` 또는 `innerHTML` 등의 부주의한 남용 금지).

### 4. 스팸 및 지식재산권 사칭 방지 (Spam & Intellectual Property)
- **[ ] 중복 또는 반복적 콘텐츠 배포 금지 (Duplicative Content)**
  - 기능이 매우 유사하거나 브랜드 이름만 바꾼 여러 개의 확장 프로그램을 중복해서 스토어에 업로드하지 않아야 합니다.
- **[ ] 메타데이터 키워드 스터핑 방지 (Keyword Stuffing)**
  - 스토어의 제품 설명란(Description)이나 태그란에 노출(SEO)을 목적으로 제품과 상관없는 키워드를 무작위로 나열(키워드 쑤셔넣기)하는 스팸 행위를 하지 않아야 합니다.
- **[ ] 상표권 준수 (Trademark Guidelines)**
  - 확장 프로그램의 제목이나 로고가 Google Chrome 또는 다른 대기업 브라우저, 브랜드 상표의 공식 기능을 사칭하지 않아야 합니다 (예: 확장 프로그램 이름 앞부분에 브랜드 이름을 무단 사용하는 행위 등 제한).

### 5. 매니페스트 버전 및 성능 정책 (MV3 Specifications)
- **[ ] Manifest V3 표준 준수**
  - 최신 정책에 의거하여 Manifest V2가 아닌 V3 규격을 완벽히 엄수해야 합니다.
  - `background.service_worker` 규격을 따르고, 사용하지 않는 백그라운드 이벤트 리스너는 메모리 누수를 일으키지 않도록 클린업되어야 합니다.

---

## 진단 및 실행 워크플로우

1. **Manifest & Permissions 감사**:
   - `manifest.json` 파일을 분석하여 요청된 모든 권한(`permissions`, `host_permissions`) 목록을 추출하고, 각 권한이 코드 상에서 실제 호출되는지 교차 분석합니다.
2. **보안 및 소스코드 스캔**:
   - `eval`, `setTimeout(string)`, `new Function` 등 원격 코드 실행 취약성 및 정책 위반 구문이 코드에 남아있는지 스캔합니다.
   - 외부 리소스(HTTP 주소)로 연결되는 비보안 API 통신 구간을 감지하여 HTTPS로 교정합니다.
3. **설명 및 메타데이터 리뷰**:
   - `README.md`, `help.html` 및 `CHROME_WEB_STORE.md` 내에 기재된 기능 리스트가 실제 최신 소스코드와 일치하는지 대조합니다.
   - 키워드 스터핑(남용) 및 상표권 위반 요소를 탐지하여 교정 권고안을 작성합니다.
4. **리포트 발행**:
   - 분석 결과 위반 의심 요소가 발견될 경우, 교정 방법(코드 수정안 및 정책 근거)을 담은 사전 체크 리포트를 생성합니다.

## Common Mistakes (자주 발생하는 위반 유형)
- *원격 코드 실행 에러*: Google Analytics나 Firebase, 혹은 AI 모델(Weights) 등을 런타임에 외부 URL에서 로드하여 실행하는 경우 (웹 스토어 거절 1순위).
- *과도한 호스트 권한*: 모든 사이트를 가로채는 `<all_urls>` 권한을 남용해 두고 적절한 사용 이유를 개발자 대시보드에 기입하지 않았을 때.
- *새 탭/검색 덮어쓰기 권한 누출*: 새 탭 페이지를 활용하면서 내부에 Chrome Search API를 준수하지 않는 타 검색 링크를 달아둔 경우.
