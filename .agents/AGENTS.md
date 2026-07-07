# ClickBook Workspace Agent Rules (AGENTS.md)

## 🚫 폐기 예정(Deprecated) API 및 기술 사용 금지
*   **원칙**: 새로운 코드를 작성하거나 기존 코드를 리팩토링할 때, W3C 및 웹 표준에서 폐기 예정(Deprecated)으로 분류된 API나 기술을 **절대 사용하지 않습니다**.
*   **준수 사항**:
    1.  서식 편집 작업 시 `document.execCommand` 대신 최신 웹 표준을 준수하는 모던 라이브러리(Tiptap, Lexical 등) 또는 표준 Selection/Range API를 사용합니다.
    2.  비동기 네트워크 요청 시 구형 `XMLHttpRequest` 대신 `fetch` API 또는 axios 같은 모던 클라이언트 라이브러리를 사용합니다.
    3.  그 외 브라우저나 Node.js 환경에서 사용되지 않는 구형 메소드나 옵션(예: `KeyboardEvent.keyCode` 등) 대신 공식 추천되는 대체 표준(`KeyboardEvent.key`)을 사용합니다.
    4.  코드 수정 전 해당 API의 웹 표준 지원 상태(MDN 등)를 적극 교차 검증합니다.
