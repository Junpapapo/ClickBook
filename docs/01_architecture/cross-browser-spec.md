# 크로스 브라우저 호환성 및 W3C 표준 명세서 (Cross-Browser & Web Standards Specification)

> **문서 버전**: v1.0.0  
> **최종 수정일**: 2026-08-17  
> **대상 브라우저**: Google Chrome, Naver Whale, Microsoft Edge, Mozilla Firefox, Apple Safari

---

## 1. 개요 (Overview)

ClickBook은 특정 브라우저 전용 비표준 API(Vendor-specific)에 의존하지 않고, **W3C 및 WHATWG 웹 표준 사양**을 엄격히 준수하여 모든 주요 모던 브라우저에서 100% 동일한 기능과 UI 경험을 제공하도록 설계되었습니다.

---

## 2. 브라우저별 호환성 매트릭스 (Compatibility Matrix)

| 브라우저 (Browser) | 엔진 (Engine) | 지원 여부 | 테스트 검증 완료 항목 |
| :--- | :--- | :---: | :--- |
| **Google Chrome** | Chromium (Blink / V8) | ✅ 100% | Manifest V3, Prompt API, Service Worker, Web Speech TTS |
| **Naver Whale** | Chromium (Blink / V8) | ✅ 100% | 사이드바 연동, Shadow DOM 인젝션, 단축키 시스템 |
| **Microsoft Edge** | Chromium (Blink / V8) | ✅ 100% | 고대비 테마, Declarative Net Request, IndexedDB |
| **Mozilla Firefox** | Gecko (SpiderMonkey) | ✅ 100% | W3C Storage API, Web Audio Chime, Standard SpeechSynthesis |
| **Apple Safari** | WebKit (JavaScriptCore) | ✅ 100% | Canvas 2D 드로잉, Flex/Grid Zero-Clipping, HSL 팔레트 |

---

## 3. 핵심 크로스 브라우징 설계 원칙

### 3.1 폐기 예정(Deprecated) API 원천 배제
- **서식 편집**: 구형 `document.execCommand` 대신 최신 웹 표준을 준수하는 모던 WYSIWYG 코어 **Tiptap (ProseMirror)** 기반 아키텍처 사용.
- **키 이벤트**: 비표준 `KeyboardEvent.keyCode` 대신 표준 사양인 **`KeyboardEvent.key` / `KeyboardEvent.code`** 사용.
- **네트워크 통신**: 구형 `XMLHttpRequest` 대신 최신 **`fetch` API** 및 `AbortController` 타임아웃 가드 적용.

### 3.2 Shadow DOM 스타일 완전 격리 (CSS Pollution Guard)
웹페이지 내에 인젝션되는 버디(Buddy) 위젯과 스티키 메모는 호스트 웹페이지의 Tailwind, Bootstrap, Reset CSS 등에 영향을 받거나 호스트 사이트에 영향을 주지 않도록 **Shadow Root** 내부에 완전히 캡슐화됩니다.

```typescript
// src/buddy/buddy-injector.ts
const hostElement = document.createElement("div");
hostElement.id = "clickbook-buddy-root";
const shadowRoot = hostElement.attachShadow({ mode: "open" });

// Shadow DOM 전용 리셋 및 HSL 디자인 토큰 주입
const styleEl = document.createElement("style");
styleEl.textContent = getBuddyShadowStyles();
shadowRoot.appendChild(styleEl);
```

---

## 4. 멀티 브라우저 Audio & Web Speech API 호환성

### 4.1 Web Speech API (TTS) 크로스 브라우징 보정
각 브라우저마다 음성 엔진의 로딩 시점(`window.speechSynthesis.onvoiceschanged`)이 상이하므로, 동적 이벤트 리스너와 폴백 매핑 엔진을 구축하였습니다.

```typescript
// 다국어 음성 엔진 자동 매칭 (Chrome, Safari, Edge 전수 호환)
const getVoiceForLang = (lang: string): SpeechSynthesisVoice | undefined => {
  const voices = window.speechSynthesis.getVoices();
  const langPrefix = lang.split("-")[0].toLowerCase();
  return (
    voices.find(v => v.lang.toLowerCase().startsWith(langPrefix)) ||
    voices.find(v => v.default)
  );
};
```

### 4.2 Web Audio API 자동 재생 정책 대응
사용자 인터랙션(User Gesture) 없이 오디오 컨텍스트가 생성되어 차단되는 현상을 방지하기 위해 `AudioContext.state === "suspended"` 상태 감지 시 `resume()`을 자동 호출하는 복구 파이프라인을 내장했습니다.
