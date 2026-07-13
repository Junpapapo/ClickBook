export const BUDDY_STYLES = `
:host {
  all: initial;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  
  /* 디폴트는 midnight 테마 */
  --bg-panel: rgba(15, 23, 42, 0.85);
  --bg-input: rgba(30, 41, 59, 0.5);
  --text-main: #f3f4f6;
  --text-sub: #9ca3af;
  --border-color: rgba(255, 255, 255, 0.1);
  --accent-color: #6366f1;
}

/* 버디 패널 내부 전체 스크롤바 미려하게 커스텀 (가로, 세로 공통) */
* {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
}

*::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

*::-webkit-scrollbar-track {
  background: transparent;
}

*::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 9999px;
  border: 1px solid transparent;
  background-clip: padding-box;
}

*::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.35);
  border: 1px solid transparent;
  background-clip: padding-box;
}

/* 라이트 계열 테마에서의 스크롤바 가독성 향상 */
.theme-cozy::-webkit-scrollbar-thumb,
.theme-sky::-webkit-scrollbar-thumb,
.theme-sweet::-webkit-scrollbar-thumb,
.theme-forest::-webkit-scrollbar-thumb,
.theme-cozy *::-webkit-scrollbar-thumb,
.theme-sky *::-webkit-scrollbar-thumb,
.theme-sweet *::-webkit-scrollbar-thumb,
.theme-forest *::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
}

.theme-cozy::-webkit-scrollbar-thumb:hover,
.theme-sky::-webkit-scrollbar-thumb:hover,
.theme-sweet::-webkit-scrollbar-thumb:hover,
.theme-forest::-webkit-scrollbar-thumb:hover,
.theme-cozy *::-webkit-scrollbar-thumb:hover,
.theme-sky *::-webkit-scrollbar-thumb:hover,
.theme-sweet *::-webkit-scrollbar-thumb:hover,
.theme-forest *::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

/* 테마별 스타일 선언 */
.theme-midnight {
  --bg-panel: rgba(15, 23, 42, 0.85);
  --bg-input: rgba(30, 41, 59, 0.5);
  --text-main: #f3f4f6;
  --text-sub: #9ca3af;
  --border-color: rgba(255, 255, 255, 0.1);
  --accent-color: #6366f1;
}
.theme-cozy {
  --bg-panel: rgba(254, 251, 244, 0.95);
  --bg-input: rgba(244, 239, 225, 0.8);
  --text-main: #3b3a36;
  --text-sub: #7c776e;
  --border-color: rgba(139, 92, 26, 0.15);
  --accent-color: #d97706;
}
.theme-sky {
  --bg-panel: rgba(240, 249, 255, 0.95);
  --bg-input: rgba(224, 242, 254, 0.8);
  --text-main: #0c4a6e;
  --text-sub: #0369a1;
  --border-color: rgba(14, 165, 233, 0.2);
  --accent-color: #0284c7;
}
.theme-sweet {
  --bg-panel: rgba(255, 241, 242, 0.95);
  --bg-input: rgba(254, 226, 226, 0.8);
  --text-main: #881337;
  --text-sub: #be123c;
  --border-color: rgba(244, 63, 94, 0.2);
  --accent-color: #e11d48;
}
.theme-fresh {
  --bg-panel: rgba(240, 253, 244, 0.95);
  --bg-input: rgba(220, 252, 231, 0.8);
  --text-main: #14532d;
  --text-sub: #15803d;
  --border-color: rgba(34, 197, 94, 0.2);
  --accent-color: #16a34a;
}
.theme-carbon {
  --bg-panel: rgba(18, 18, 18, 0.95);
  --bg-input: rgba(30, 30, 30, 0.85);
  --text-main: #f3f4f6;
  --text-sub: #9ca3af;
  --border-color: rgba(255, 255, 255, 0.08);
  --accent-color: #e5e7eb;
}
.theme-cyber {
  --bg-panel: rgba(13, 10, 24, 0.96);
  --bg-input: rgba(26, 18, 46, 0.85);
  --text-main: #00ffff;
  --text-sub: #ff00ff;
  --border-color: rgba(0, 255, 255, 0.25);
  --accent-color: #00ffff;
}


#buddy-container {
  position: fixed;
  z-index: 999999;
  cursor: grab;
  user-select: none;
  touch-action: none;
  transition: opacity 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

#buddy-container.dragging {
  cursor: grabbing;
}

.buddy-character-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease;
}

.buddy-character-wrapper:hover {
  transform: scale(1.08);
}

#buddy-container.panel-open .buddy-character-wrapper {
  pointer-events: none !important;
  transform: scale(0.85);
}


.buddy-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
}


.radial-menu-container {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  pointer-events: none;
  z-index: 10;
}

.radial-item {
  position: absolute;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--bg-panel);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border-color);
  color: var(--text-main);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transform: translate(-50%, -50%) scale(0);
  transition: transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1), 
              opacity 250ms ease, 
              background-color 0.2s ease,
              border-color 0.2s ease,
              box-shadow 0.2s ease;
  transition-delay: 0ms;
  pointer-events: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

.radial-item.open {
  transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(1);
  opacity: 1;
  transition-delay: var(--delay);
}

.radial-item:hover {
  background: var(--accent-color);
  border-color: var(--border-color);
  color: #ffffff;
  box-shadow: 0 0 16px var(--accent-color);
  transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(1.12);
}

.radial-item.disabled {
  opacity: 0.45 !important;
  cursor: not-allowed;
  background: var(--bg-input) !important;
  border-color: var(--border-color) !important;
  color: var(--text-sub) !important;
  box-shadow: none !important;
  transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0.95);
}

.buddy-icon {
  width: 18px;
  height: 18px;
  pointer-events: none;
}

/* 패널 외부 클릭 감지용 투명 오버레이 */
/* z-index: 999997 → 패널(999998)보다 낮고 버디 캐릭터(999999)보다 낮아 클릭 우선순위가 보장됨 */
#buddy-panel-overlay {
  position: fixed;
  inset: 0;
  z-index: 999997;
  background: transparent;
  cursor: default;
}

.floating-panel {
  position: fixed;
  z-index: 999998;
  width: 320px;
  border-radius: 16px;
  background: var(--bg-panel);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border-color);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  overflow: hidden;
  opacity: 0;
  transform: scale(0.9) translateY(10px);
  transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
              top 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: none;
  color: var(--text-main);
}

.floating-panel.open {
  opacity: 1;
  transform: scale(1) translateY(0);
  pointer-events: auto;
}

.panel-header {
  padding: 8px 16px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.panel-title {
  margin: 0;
  margin-right: auto;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
  display: flex;
  align-items: center;
  gap: 6px;
}

.panel-close-btn {
  background: transparent;
  border: none;
  color: var(--text-sub);
  font-size: 18px;
  cursor: pointer;
  transition: color 0.15s ease;
  padding: 0 4px;
}

.panel-close-btn:hover {
  color: var(--text-main);
}

/* ── Reveal All 토글 스위치 ── */
.panel-reveal-option {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  margin-right: 6px;
  user-select: none;
}

.panel-reveal-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-sub);
  white-space: nowrap;
  letter-spacing: 0.02em;
}

.panel-toggle-switch {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.panel-toggle-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

.panel-toggle-track {
  display: inline-block;
  width: 30px;
  height: 16px;
  background: var(--border-color, #3f3f5a);
  border-radius: 999px;
  transition: background 0.2s ease;
  position: relative;
  flex-shrink: 0;
}

.panel-toggle-thumb {
  display: block;
  width: 12px;
  height: 12px;
  background: #fff;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform 0.2s ease, background 0.2s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.4);
}

.panel-toggle-input:checked + .panel-toggle-track {
  background: #6366f1;
}

.panel-toggle-input:checked + .panel-toggle-track .panel-toggle-thumb {
  transform: translateX(14px);
}

.panel-header-action-btn {
  background: transparent;
  border: none;
  color: var(--text-sub);
  font-size: 14px;
  cursor: pointer;
  transition: color 0.15s ease, transform 0.1s ease;
  padding: 0 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
}

.panel-header-action-btn:hover {
  color: var(--text-main);
  transform: scale(1.1);
}

.panel-header-action-btn:active {
  transform: scale(0.95);
}

.panel-body {
  padding: 12px 8px;
  font-size: 13.5px;
  color: var(--text-main);
  max-height: calc(88vh - 45px);
  overflow-y: auto;
  box-sizing: border-box;
}

/* 얇고 은은한 골드 커스텀 스크롤바 */
.panel-body::-webkit-scrollbar,
.stats-chart-wrapper::-webkit-scrollbar {
  width: 4px; /* 더 얇은 4px */
}

.panel-body::-webkit-scrollbar-track,
.stats-chart-wrapper::-webkit-scrollbar-track {
  background: transparent;
}

.panel-body::-webkit-scrollbar-thumb,
.stats-chart-wrapper::-webkit-scrollbar-thumb {
  background: rgba(212, 175, 55, 0.35); /* 은은한 골드 */
  border-radius: 9999px;
}

.panel-body::-webkit-scrollbar-thumb:hover,
.stats-chart-wrapper::-webkit-scrollbar-thumb:hover {
  background: rgba(212, 175, 55, 0.65);
}

.buddy-textarea {
  width: 100%;
  box-sizing: border-box;
  min-height: 80px;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-main);
  padding: 10px;
  font-size: 13px;
  resize: vertical;
  margin-bottom: 12px;
  outline: none;
  font-family: inherit;
  transition: border-color 0.2s ease, background-color 0.2s ease;
}

.buddy-textarea:focus {
  border-color: var(--accent-color);
  background: var(--bg-panel);
}

.buddy-input-group {
  margin-bottom: 9px;
}

.buddy-label {
  display: block;
  font-size: 11px;
  color: var(--text-sub);
  margin-bottom: 3px;
}

.buddy-select {
  width: 100%;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-main);
  padding: 8px 10px;
  font-size: 13px;
  outline: none;
  cursor: pointer;
}

.buddy-btn-row {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.buddy-btn {
  background: var(--accent-color);
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s ease, transform 0.1s ease;
}

.buddy-btn:hover {
  opacity: 0.95;
}

.buddy-btn:active {
  transform: scale(0.97);
}

.buddy-btn-secondary {
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  color: var(--text-main);
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.buddy-btn-secondary:hover {
  background: var(--bg-panel);
}

.buddy-result-box {
  background: var(--bg-input);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  padding: 12px;
  margin-top: 12px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-main);
  max-height: 150px;
  overflow-y: auto;
  word-break: break-all;
}

.buddy-toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%) translateY(20px);
  z-index: 1000000;
  background: var(--bg-panel);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border-color);
  padding: 10px 20px;
  border-radius: 40px;
  color: var(--text-main);
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 10px 25px rgba(0,0,0,0.3);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.buddy-toast.show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

/* 3:7 가로 병렬 레이아웃 */
.buddy-row {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  margin-bottom: 12px;
}

.buddy-col-3 {
  width: 30%;
  flex-shrink: 0;
}

.buddy-col-7 {
  flex: 1;
}

/* 테마 선택 단추 */
.theme-dot {
  padding: 4px 6px;
  border-radius: 9999px;
  font-size: 9px;
  font-weight: 700;
  border: 1px solid var(--border-color);
  background: var(--bg-input);
  color: var(--text-main);
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
  flex: 1;
  text-align: center;
  white-space: nowrap;
}

.theme-dot:hover {
  opacity: 0.9;
}

.theme-dot.active {
  border-color: transparent;
  background: var(--accent-color);
  color: white;
  box-shadow: 0 0 8px var(--accent-color);
}

/* 썸네일 선택 리스트 */
.buddies-grid {
  display: grid;
  grid-template-rows: repeat(2, 48px);
  grid-auto-flow: column;
  grid-auto-columns: 48px;
  gap: 6px;
  margin-bottom: 12px;
  overflow-x: auto;
  padding-bottom: 6px;
}

.buddy-select-item {
  border: 1px solid var(--border-color);
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.2s ease, transform 0.2s ease, background-color 0.2s ease;
  background: var(--bg-input);
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1.0;
}

.buddy-select-item:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.08);
}

.buddy-select-item.selected {
  border-color: var(--accent-color);
  background: rgba(99, 102, 241, 0.15);
  box-shadow: 0 0 8px var(--accent-color);
}

.buddy-thumb {
  width: 100%;
  height: auto;
  max-width: 48px;
  object-fit: contain;
  pointer-events: none;
}

/* 설정 카드 스타일 보완 */
.settings-section-title {
  font-size: 11px;
  color: var(--text-sub);
  margin: 5px 0 3px 0;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* 아코디언 컨테이너 및 헤더 스타일 */
.settings-accordion-group {
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.01);
  margin-bottom: 5px;
  overflow: hidden;
  transition: border-color 0.2s, background-color 0.2s, box-shadow 0.2s;
}

.settings-accordion-group:hover {
  border-color: var(--accent-color);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.08);
}

.settings-accordion-header {
  padding: 8px 12px;
  background: var(--bg-input);
  font-size: 11.5px;
  font-weight: 700;
  color: var(--text-main);
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  user-select: none;
  border-bottom: 1px solid transparent;
  transition: background-color 0.2s, border-color 0.2s;
}

.settings-accordion-header:hover {
  background-color: rgba(99, 102, 241, 0.12);
}

.settings-accordion-header.active {
  background-color: rgba(99, 102, 241, 0.05);
  border-bottom-color: var(--border-color);
}

.settings-accordion-header .acc-icon {
  font-size: 9px;
  color: var(--text-sub);
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.settings-accordion-body {
  padding: 8px 12px;
}

.settings-section-title:first-child {
  margin-top: 0;
}

.range-val {
  float: right;
  font-weight: 600;
  color: var(--accent-color);
}

.buddy-range {
  width: 100%;
  background: var(--border-color);
  height: 6px;
  border-radius: 3px;
  outline: none;
  cursor: pointer;
  -webkit-appearance: none;
  margin: 8px 0;
}

.buddy-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--accent-color);
  cursor: pointer;
  transition: transform 0.1s ease;
}

.buddy-range::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.memo-color-picker {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.color-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.color-dot:hover {
  transform: scale(1.15);
}

.color-dot.active {
  border-color: #ffffff;
  transform: scale(1.1);
}

.color-dot.yellow { background: #fef08a; }
.color-dot.pink { background: #fbcfe8; }
.color-dot.blue { background: #bfdbfe; }
.color-dot.green { background: #bbf7d0; }
.color-dot.purple { background: #e9d5ff; }

/* 말풍선 컨펌 팝업 */
.buddy-confirm-bubble {
  position: fixed;
  z-index: 1000000;
  width: 170px;
  background: var(--bg-panel, rgba(15, 23, 42, 0.95));
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.15));
  border-radius: 12px;
  padding: 8px 10px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.35);
  opacity: 0;
  pointer-events: none;
  transform: scale(0.9);
  transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  color: var(--text-main, #ffffff);
  font-family: system-ui, sans-serif;
  text-align: center;
}

.buddy-confirm-bubble.show {
  opacity: 1;
  pointer-events: auto;
  transform: scale(1);
}

.buddy-confirm-bubble::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-width: 6px;
  border-style: solid;
  border-color: var(--bg-panel, rgba(15, 23, 42, 0.95)) transparent transparent transparent;
}

.buddy-confirm-bubble::before {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-width: 7px;
  border-style: solid;
  border-color: var(--border-color, rgba(255, 255, 255, 0.15)) transparent transparent transparent;
  z-index: -1;
}

/* 아래쪽 배치일 때 꼬리 방향 위로 수정 */
.buddy-confirm-bubble.bubble-bottom-side::after {
  top: auto;
  bottom: 100%;
  border-color: transparent transparent var(--bg-panel, rgba(15, 23, 42, 0.95)) transparent;
}

.buddy-confirm-bubble.bubble-bottom-side::before {
  top: auto;
  bottom: 100%;
  border-color: transparent transparent var(--border-color, rgba(255, 255, 255, 0.15)) transparent;
}

.buddy-bubble-text {
  font-size: 11px;
  font-weight: 500;
  line-height: 1.4;
  margin: 0 0 8px 0;
}

.buddy-bubble-buttons {
  display: flex;
  gap: 6px;
  justify-content: center;
}

.buddy-bubble-btn {
  flex: 1;
  padding: 4px 0;
  font-size: 10px;
  font-weight: 700;
  border-radius: 6px;
  cursor: pointer;
  border: none;
  outline: none;
  transition: opacity 0.15s ease;
}

.buddy-bubble-btn:hover {
  opacity: 0.9;
}

.buddy-bubble-btn.confirm {
  background: #ef4444;
  color: white;
}

.buddy-bubble-btn.cancel {
  background: var(--bg-input, rgba(255, 255, 255, 0.1));
  color: var(--text-main, #ffffff);
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
}

/* 이미 등록된 즐겨찾기 강조 및 비활성 스타일 */
.radial-item.bookmarked {
  background: var(--accent-color) !important;
  color: #ffffff !important;
  border-color: var(--border-color) !important;
  cursor: not-allowed !important;
  opacity: 0.95 !important;
  box-shadow: 0 0 12px var(--accent-color) !important;
}

.radial-item.bookmarked:hover {
  transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(1) !important;
}

/* 드래그 툴바 */
.buddy-drag-toolbar {
  position: fixed;
  z-index: 1000001;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 30px;
  padding: 4px 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
  display: flex;
  gap: 6px;
  align-items: center;
  opacity: 0;
  transform: translateY(10px) scale(0.95);
  transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  pointer-events: auto;
}

.buddy-drag-toolbar.show {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.buddy-drag-btn {
  border: none;
  outline: none;
  background: transparent;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 700;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.buddy-drag-btn.summary {
  background: #6366f1;
  color: white;
}
.buddy-drag-btn.translate {
  background: #10b981;
  color: white;
}
.buddy-drag-btn.vocab {
  background: #3b82f6;
  color: white;
}
.buddy-drag-btn.chat {
  background: #f97316;
  color: white;
}

.buddy-drag-btn:hover {
  transform: scale(1.06);
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.2);
}

/* 대형 말풍선 */
.buddy-confirm-bubble.large {
  width: 260px;
  max-height: 265px;
  padding: 10px 12px;
  text-align: left;
}

.buddy-confirm-bubble.large .buddy-bubble-text {
  font-size: 12px;
  text-align: left;
  line-height: 1.5;
}

.buddy-bubble-scroll {
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 8px;
  padding-right: 4px;
}

/* 스크롤바 커스텀 */
.buddy-bubble-scroll::-webkit-scrollbar {
  width: 4px;
}
.buddy-bubble-scroll::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 2px;
}
.buddy-bubble-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

/* TTS 스피커 */
.tts-speaker-btn {
  background: transparent;
  border: none;
  color: var(--accent-color);
  font-size: 12px;
  cursor: pointer;
  padding: 2px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease;
  margin-left: 6px;
  vertical-align: middle;
}

.tts-speaker-btn:hover {
  transform: scale(1.2);
}

/* 로딩 스켈레톤 */
.skeleton-row {
  height: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  margin-bottom: 6px;
  animation: skeleton-pulse 1.4s infinite ease-in-out;
}

@keyframes skeleton-pulse {
  0% { opacity: 0.6; }
  50% { opacity: 0.3; }
  100% { opacity: 0.6; }
}

/* 학습 단어 뱃지 */
.vocab-badge-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 10px 0;
}

.vocab-badge {
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.3);
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  color: #60a5fa;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
}

.vocab-badge-mean {
  color: var(--text-main);
  font-weight: 500;
  margin-left: 4px;
}

/* 학습 예시대화 */
.vocab-dialogue {
  background: rgba(255, 255, 255, 0.05);
  border-left: 3px solid var(--accent-color);
  padding: 6px 8px;
  border-radius: 0 8px 8px 0;
  margin-top: 10px;
  font-size: 11px;
}

.vocab-dialogue-title {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-sub);
  margin-bottom: 4px;
}

.dialogue-line {
  margin-bottom: 4px;
  line-height: 1.4;
}

.dialogue-trans {
  color: var(--text-sub);
  display: block;
  font-size: 10px;
}

/* 로딩 스피너 애니메이션 */
.buddy-loading-dots {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  margin-left: 6px;
  vertical-align: middle;
}

.buddy-loading-dot {
  width: 5px;
  height: 5px;
  background: var(--accent-color);
  border-radius: 50%;
  animation: buddy-bounce-loader 1.4s infinite ease-in-out both;
}

.buddy-loading-dot:nth-child(1) { animation-delay: -0.32s; }
.buddy-loading-dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes buddy-bounce-loader {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1.0); }
}

/* 콤팩트 메모 바 */
.compact-memo-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
  width: 100%;
}

.compact-color-dots {
  display: flex;
  gap: 6px;
}

.compact-color-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  cursor: pointer;
  border: 1.5px solid transparent;
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.compact-color-dot:hover {
  transform: scale(1.2);
}

.compact-color-dot.active {
  border-color: #ffffff;
  transform: scale(1.15);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2);
}

.compact-color-dot.yellow { background: #fef08a; }
.compact-color-dot.pink { background: #fbcfe8; }
.compact-color-dot.blue { background: #bfdbfe; }
.compact-color-dot.green { background: #bbf7d0; }
.compact-color-dot.purple { background: #e9d5ff; }

/* 버디 챗 전용 레이아웃 */
.buddy-chat-wrap {
  display: flex;
  flex-direction: column;
  height: 280px;
}

.chat-header-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 6px;
}

.chat-clear-btn {
  background: transparent;
  border: none;
  font-size: 14px;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s ease;
  padding: 2px 6px;
}

.chat-clear-btn:hover {
  opacity: 1;
}

.chat-messages-box {
  flex: 1;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-input);
  padding: 8px;
  margin-bottom: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-messages-box::-webkit-scrollbar {
  width: 4px;
}
.chat-messages-box::-webkit-scrollbar-track {
  background: transparent;
}
.chat-messages-box::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
}

.chat-message-row {
  display: flex;
  width: 100%;
}

.msg-user-align {
  justify-content: flex-end;
}

.msg-buddy-align {
  justify-content: flex-start;
}

.chat-bubble {
  max-width: 80%;
  border-radius: 12px;
  padding: 8px 12px;
  font-size: 12.5px;
  line-height: 1.4;
  word-break: break-word;
}

.user-bubble {
  background: var(--accent-color);
  color: #ffffff;
  border-bottom-right-radius: 2px;
}

.buddy-bubble {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-main);
  border-bottom-left-radius: 2px;
}

.bubble-time {
  font-size: 9px;
  color: var(--text-sub);
  margin-top: 4px;
  text-align: right;
  opacity: 0.8;
}

.user-bubble .bubble-time {
  color: rgba(255, 255, 255, 0.7);
}

.chat-drag-context {
  background: rgba(255, 255, 255, 0.04);
  border-left: 2px solid var(--accent-color);
  padding: 4px 8px;
  font-size: 11px;
  margin-bottom: 8px;
  border-radius: 0 4px 4px 0;
}

.chat-drag-text-val {
  color: var(--text-sub);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}

.chat-input-row {
  display: flex;
  gap: 8px;
}

.chat-input-field {
  flex: 1;
}

.chat-send-btn {
  flex-shrink: 0;
}

.chat-bubble.thinking {
  display: flex;
  align-items: center;
  padding: 6px 12px;
}

.thinking-spinner {
  display: inline-flex;
  gap: 3px;
  align-items: center;
}

.thinking-spinner span {
  width: 4px;
  height: 4px;
  background: var(--text-sub);
  border-radius: 50%;
  animation: thinking-bounce 1.4s infinite ease-in-out both;
}

.thinking-spinner span:nth-child(1) { animation-delay: -0.32s; }
.thinking-spinner span:nth-child(2) { animation-delay: -0.16s; }

@keyframes thinking-bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1.2); opacity: 1; }
}

/* ── Vocab Feature Styles ────────────────────────────── */
.vocab-tabs {
  display: flex;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 12px;
  gap: 4px;
}

.vocab-tab-btn {
  flex: 1;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-sub);
  padding: 6px 0;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
  text-align: center;
}

.vocab-tab-btn:hover {
  color: var(--text-main);
}

.vocab-tab-btn.active {
  color: var(--accent-color);
  border-bottom-color: var(--accent-color);
  font-weight: 600;
}

.vocab-content-area {
  min-height: 150px;
}

/* 목록 모드 */
.vocab-list-wrapper {
  max-height: 220px;
  overflow-y: auto;
  padding-right: 2px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.vocab-list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.vocab-list-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.vocab-list-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.vocab-list-word {
  font-weight: 600;
  font-size: 13.5px;
  color: var(--text-main);
}

.vocab-list-pron {
  font-size: 11px;
  color: var(--text-sub);
  font-family: monospace;
}

.vocab-list-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.vocab-list-mean {
  font-size: 12px;
  color: var(--text-main);
  background: rgba(255, 255, 255, 0.05);
  padding: 2px 6px;
  border-radius: 4px;
}

.vocab-speaker-mini {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  font-size: 12px;
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.vocab-speaker-mini:hover {
  opacity: 1;
}

/* 복습 모드 (플래시 카드) */
.vocab-review-card {
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 12px;
}

.vocab-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.vocab-card-count {
  font-size: 11px;
  color: var(--text-sub);
}

.vocab-card-speaker {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  color: var(--text-main);
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 11px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.vocab-card-speaker:hover {
  background: rgba(255, 255, 255, 0.1);
}

.vocab-card-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100px;
  text-align: center;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 12px;
  margin-bottom: 12px;
}

.vocab-card-front {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 4px;
}

.vocab-card-pron {
  font-size: 12px;
  color: var(--text-sub);
  margin-bottom: 8px;
  font-family: monospace;
}

.vocab-card-back {
  display: none;
  width: 100%;
}

.vocab-card-back.show {
  display: block;
  animation: fadeIn 0.3s ease-out;
}

.vocab-card-mean {
  font-size: 15px;
  font-weight: 600;
  color: var(--accent-color);
  margin-bottom: 4px;
}

.vocab-card-nuance {
  font-size: 11.5px;
  color: var(--text-sub);
  line-height: 1.4;
  padding: 6px;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 4px;
}

/* 퀴즈 모드 */
.vocab-quiz-wrapper {
  display: flex;
  flex-direction: column;
}

.vocab-quiz-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.vocab-quiz-score-badge {
  font-size: 11px;
  font-weight: 600;
  color: var(--accent-color);
  background: rgba(99, 102, 241, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
}

.vocab-quiz-speaker {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
}

.vocab-quiz-question {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-main);
  text-align: center;
  margin: 12px 0 16px 0;
}

.vocab-quiz-choices {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.vocab-quiz-btn {
  width: 100%;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-color);
  color: var(--text-main);
  border-radius: 6px;
  font-size: 12.5px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}

.vocab-quiz-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--accent-color);
}

.vocab-quiz-btn.correct {
  background: rgba(16, 185, 129, 0.15);
  border-color: #10b981;
  color: #10b981;
  font-weight: 600;
}

.vocab-quiz-btn.incorrect {
  background: rgba(239, 68, 68, 0.15);
  border-color: #ef4444;
  color: #ef4444;
  font-weight: 600;
}

.vocab-quiz-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quiz-feedback {
  text-align: center;
  margin-top: 10px;
  font-size: 12px;
  font-weight: 600;
}

.quiz-feedback.correct {
  color: #10b981;
}

.quiz-feedback.incorrect {
  color: #ef4444;
}

/* ── Micro-Interaction States ──────────────────────── */
@keyframes buddy-bounce-loop {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@keyframes buddy-shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-4px); }
  40%, 80% { transform: translateX(4px); }
}

@keyframes buddy-success-pulse {
  0% { transform: scale(1.0); filter: drop-shadow(0 0 0 rgba(16, 185, 129, 0.7)); }
  70% { transform: scale(1.15); filter: drop-shadow(0 0 12px rgba(16, 185, 129, 0)); }
  100% { transform: scale(1.0); filter: drop-shadow(0 0 0 rgba(16, 185, 129, 0)); }
}

@keyframes neon-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

#buddy-container.loading .buddy-character-wrapper {
  animation: buddy-bounce-loop 0.6s infinite ease-in-out;
}

#buddy-container.loading::before {
  content: '';
  position: absolute;
  width: 110%;
  height: 110%;
  border-radius: 50%;
  background: conic-gradient(from 0deg, #6366f1, #ec4899, #3b82f6, #6366f1);
  animation: neon-spin 1.5s linear infinite;
  z-index: -1;
  filter: blur(4px);
}

#buddy-container.success .buddy-character-wrapper {
  animation: buddy-success-pulse 0.8s ease-out;
}

#buddy-container.error .buddy-character-wrapper {
  animation: buddy-shake 0.4s ease-in-out;
  filter: drop-shadow(0 0 8px #ef4444);
}

/* Timer Setup UI Styles */
.timer-card-container {
  display: flex;
  flex-direction: row-reverse;
  gap: 0;
  padding: 0;
  width: 100%;
  overflow: hidden;
}

.timer-main-view {
  width: 100%;
  flex-shrink: 0;
  padding: 8px 4px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 14px;
  transition: width 0.3s ease;
}

.timer-stats-drawer {
  width: 0;
  flex-shrink: 0;
  overflow: hidden;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  border: none;
  background: rgba(0, 0, 0, 0.08);
  transition: width 0.3s ease, padding 0.3s ease, border 0.3s ease;
  display: flex;
  flex-direction: column;
}

.timer-card-container.stats-open .timer-stats-drawer {
  width: 50%;
  padding: 12px 16px;
  border-right: 1px solid var(--border-color);
}

.timer-card-container.stats-open .timer-main-view {
  width: 50%;
}

.timer-input-group {
  width: 100%;
}

.timer-message-input {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--bg-input);
  color: var(--text-main);
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
}

.timer-message-input:focus {
  border-color: var(--accent-color);
}

.timer-presets-group {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.timer-preset-chip {
  padding: 6px 0;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background: var(--bg-input);
  color: var(--text-sub);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.timer-preset-chip:hover {
  border-color: var(--accent-color);
  color: var(--text-main);
}

.timer-preset-chip.active {
  background: var(--accent-color);
  border-color: var(--accent-color);
  color: #ffffff;
}

.timer-manual-group.slider-mode {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: var(--bg-input);
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.timer-range-slider {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.15);
  outline: none;
  margin: 0;
  cursor: pointer;
}

.theme-cozy .timer-range-slider,
.theme-sky .timer-range-slider,
.theme-sweet .timer-range-slider,
.theme-fresh .timer-range-slider {
  background: rgba(0, 0, 0, 0.1);
}

/* Webkit browser slider thumb */
.timer-range-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--accent-color);
  border: none;
  transition: transform 0.1s;
}

.timer-range-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

/* Firefox browser slider thumb */
.timer-range-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--accent-color);
  border: none;
  transition: transform 0.1s;
  cursor: pointer;
}

.timer-range-slider::-moz-range-thumb:hover {
  transform: scale(1.2);
}

.timer-number-wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.05);
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.theme-cozy .timer-number-wrapper,
.theme-sky .timer-number-wrapper,
.theme-sweet .timer-number-wrapper,
.theme-fresh .timer-number-wrapper {
  background: rgba(0, 0, 0, 0.03);
}

.timer-number-input {
  width: 32px;
  text-align: center;
  border: none;
  background: transparent;
  color: var(--text-main);
  font-size: 16px;
  font-weight: 600;
  outline: none;
}

/* Remove default arrows for number input */
.timer-number-input::-webkit-outer-spin-button,
.timer-number-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.timer-number-input[type=number] {
  -moz-appearance: textfield;
}

.timer-manual-suffix {
  color: var(--text-sub);
  font-size: 13px;
}

.timer-start-btn {
  width: 100%;
  padding: 10px;
  border-radius: 8px;
  border: none;
  background: var(--accent-color);
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.timer-start-btn:hover {
  opacity: 0.9;
}

/* Timer Running UI Styles */
.timer-running-message {
  text-align: center;
  font-size: 13px;
  color: var(--text-sub);
  margin-bottom: 2px;
  animation: pulse-glow 2s infinite ease-in-out;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@keyframes pulse-glow {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; color: var(--text-main); }
}

.timer-gauge-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 10px 0;
}

.timer-svg-ring {
  transform: rotate(-90deg);
}

.timer-ring-bg {
  stroke: var(--border-color);
}

.timer-ring-bar {
  stroke: var(--accent-color);
  transition: stroke-dashoffset 0.3s ease;
}

.timer-time-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 22px;
  font-weight: 700;
  color: var(--text-main);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.5px;
}

.timer-controls-group {
  display: flex;
  gap: 8px;
}

.timer-ctrl-btn {
  flex: 1;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--bg-input);
  color: var(--text-main);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.timer-ctrl-btn:hover {
  border-color: var(--text-sub);
}

.timer-ctrl-btn.play-pause {
  background: var(--accent-color);
  border-color: var(--accent-color);
  color: #ffffff;
}

.timer-ctrl-btn.play-pause.paused {
  background: #10b981; /* Green tone for resume */
  border-color: #10b981;
}

/* Fullscreen Complete Overlay Style */
.timer-complete-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: radial-gradient(circle at center, #0f172a 0%, #020617 100%);
  z-index: 2147483647; /* Maximum z-index to overlay everything on webpage */
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  animation: overlay-fade-in 0.5s forwards ease-out;
  color: #ffffff;
  overflow: hidden;
  user-select: none;
}

.timer-complete-overlay.fade-out {
  animation: overlay-fade-out 0.5s forwards ease-in;
}

@keyframes overlay-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes overlay-fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

/* Stars Particle Styles */
.stars-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.star {
  position: absolute;
  background: #ffffff;
  border-radius: 50%;
  opacity: 0;
  animation: twinkle var(--twinkle-duration, 3s) infinite ease-in-out;
  animation-delay: var(--twinkle-delay, 0s);
  box-shadow: 0 0 4px #ffffff;
}

@keyframes twinkle {
  0%, 100% { opacity: 0.1; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}

/* Shooting Stars Styles */
.shooting-stars-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.shooting-star {
  position: absolute;
  height: 1px;
  background: linear-gradient(-45deg, #ffffff, rgba(255, 255, 255, 0));
  filter: drop-shadow(0 0 6px #ffffff);
  animation: shoot var(--shoot-duration, 1.5s) forwards linear;
  transform: rotate(-45deg);
  transform-origin: 0% 0%;
}

@keyframes shoot {
  0% {
    width: 0;
    opacity: 0;
    transform: translate(0, 0) rotate(-45deg);
  }
  15% {
    width: 80px;
    opacity: 1;
  }
  100% {
    width: 120px;
    opacity: 0;
    transform: translate(-300px, 300px) rotate(-45deg);
  }
}

/* Glassmorphism Card Style */
.complete-card {
  position: relative;
  z-index: 10;
  width: 320px;
  padding: 32px 24px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  animation: card-appear 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes card-appear {
  from {
    transform: scale(0.8) translateY(20px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

.complete-icon {
  font-size: 48px;
  margin-bottom: 12px;
  animation: float 3s infinite ease-in-out;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.complete-title {
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 6px 0;
}

.complete-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 16px 0;
}

.complete-message {
  width: 100%;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  font-size: 13px;
  color: #60a5fa; /* Sky blue tone message */
  font-style: italic;
  margin-bottom: 20px;
  border-left: 3px solid #60a5fa;
  box-sizing: border-box;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.complete-ok-btn {
  width: 100%;
  padding: 10px;
  border-radius: 8px;
  border: none;
  background: #ffffff;
  color: #0f172a;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.complete-ok-btn:hover {
  background: rgba(255, 255, 255, 0.85);
}

/* Outer Buddy Progress Ring & Badge Styles */
.buddy-timer-badge {
  position: absolute;
  left: 50%;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1.5px solid rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.6), 
              0 0 25px rgba(255, 255, 255, 0.15),
              inset 0 1px 1px rgba(255, 255, 255, 0.2);
  pointer-events: none; /* Block pointer when hidden */
  z-index: 9999999;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.4s cubic-bezier(0.16, 1, 0.3, 1),
              border-color 0.3s ease,
              box-shadow 0.3s ease,
              bottom 0.3s ease,
              top 0.3s ease;
}

/* 기본 활성화 페이드인 */
.has-timer .buddy-timer-badge {
  opacity: 1;
  pointer-events: auto; /* Allow button clicks when timer is active */
}

/* ==================== S (소) 사이즈 오버라이드 ==================== */
.timer-size-s .buddy-timer-badge {
  bottom: calc(100% + 12px);
  transform: translateX(-50%) translateY(8px);
  padding: 4px 12px;
  border-radius: 12px;
}
.has-timer.timer-size-s .buddy-timer-badge {
  transform: translateX(-50%) translateY(0);
}
/* 화면 상단 경계선에 닿으면 아래쪽 배치로 스위칭 */
.timer-size-s.timer-below .buddy-timer-badge {
  bottom: auto;
  top: calc(100% + 12px);
  transform: translateX(-50%) translateY(-8px);
}
.has-timer.timer-size-s.timer-below .buddy-timer-badge {
  transform: translateX(-50%) translateY(0);
}
.timer-size-s .badge-time-text {
  font-size: 28px;
  letter-spacing: -0.5px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
}
.timer-size-s.timer-running-focus .badge-time-text {
  filter: drop-shadow(0 0 8px rgba(236, 72, 153, 0.55));
}
.timer-size-s.timer-running-break .badge-time-text {
  filter: drop-shadow(0 0 8px rgba(52, 211, 153, 0.55));
}
/* S 사이즈 전용 컨트롤 버튼 크기 */
.timer-size-s .badge-ctrl-btn {
  height: 32px;
  background: rgba(255, 255, 255, 0.08);
}
.timer-size-s .badge-ctrl-btn svg {
  width: 14px;
  height: 14px;
}
.timer-size-s .buddy-timer-badge:hover .badge-ctrl-btn {
  width: 32px;
  margin: 0 4px;
  opacity: 1;
  transform: scale(1);
  pointer-events: auto;
}

/* ==================== M (중) 사이즈 오버라이드 ==================== */
.timer-size-m .buddy-timer-badge {
  bottom: calc(100% + 18px);
  transform: translateX(-50%) translateY(12px);
  padding: 6px 18px;
  border-radius: 20px;
}
.has-timer.timer-size-m .buddy-timer-badge {
  transform: translateX(-50%) translateY(0);
}
/* 화면 상단 경계선에 닿으면 아래쪽 배치로 스위칭 */
.timer-size-m.timer-below .buddy-timer-badge {
  bottom: auto;
  top: calc(100% + 18px);
  transform: translateX(-50%) translateY(-12px);
}
.has-timer.timer-size-m.timer-below .buddy-timer-badge {
  transform: translateX(-50%) translateY(0);
}
.timer-size-m .badge-time-text {
  font-size: 64px;
  letter-spacing: -1.5px;
  filter: drop-shadow(0 3px 8px rgba(0, 0, 0, 0.45));
}
.timer-size-m.timer-running-focus .badge-time-text {
  filter: drop-shadow(0 0 15px rgba(236, 72, 153, 0.55));
}
.timer-size-m.timer-running-break .badge-time-text {
  filter: drop-shadow(0 0 15px rgba(52, 211, 153, 0.55));
}
/* M 사이즈 전용 컨트롤 버튼 크기 */
.timer-size-m .badge-ctrl-btn {
  height: 38px;
  background: rgba(255, 255, 255, 0.08);
}
.timer-size-m .badge-ctrl-btn svg {
  width: 16px;
  height: 16px;
}
.timer-size-m .buddy-timer-badge:hover .badge-ctrl-btn {
  width: 38px;
  margin: 0 6px;
  opacity: 1;
  transform: scale(1);
  pointer-events: auto;
}

/* ==================== L (대) 사이즈 오버라이드 ==================== */
.timer-size-l .buddy-timer-badge {
  bottom: calc(100% + 25px);
  transform: translateX(-50%) translateY(15px);
  padding: 8px 24px;
  border-radius: 28px;
}
.has-timer.timer-size-l .buddy-timer-badge {
  transform: translateX(-50%) translateY(0);
}
/* 화면 상단 경계선에 닿으면 아래쪽 배치로 스위칭 */
.timer-size-l.timer-below .buddy-timer-badge {
  bottom: auto;
  top: calc(100% + 25px);
  transform: translateX(-50%) translateY(-15px);
}
.has-timer.timer-size-l.timer-below .buddy-timer-badge {
  transform: translateX(-50%) translateY(0);
}
.timer-size-l .badge-time-text {
  font-size: 130px;
  letter-spacing: -3px;
  filter: drop-shadow(0 4px 15px rgba(0, 0, 0, 0.5));
}
.timer-size-l.timer-running-focus .badge-time-text {
  filter: drop-shadow(0 0 25px rgba(236, 72, 153, 0.6));
}
.timer-size-l.timer-running-break .badge-time-text {
  filter: drop-shadow(0 0 25px rgba(52, 211, 153, 0.6));
}
/* L 사이즈 전용 컨트롤 버튼 크기 */
.timer-size-l .badge-ctrl-btn {
  height: 44px;
  background: rgba(255, 255, 255, 0.08);
}
.timer-size-l .badge-ctrl-btn svg {
  width: 18px;
  height: 18px;
}
.timer-size-l .buddy-timer-badge:hover .badge-ctrl-btn {
  width: 44px;
  margin: 0 8px;
  opacity: 1;
  transform: scale(1);
  pointer-events: auto;
}

/* 집중 상태 독자적인 네온 글로우 */
.timer-running-focus .buddy-timer-badge {
  border-color: rgba(236, 72, 153, 0.45);
  box-shadow: 0 20px 45px -10px rgba(0, 0, 0, 0.7), 
              0 0 35px rgba(236, 72, 153, 0.35),
              inset 0 1px 1px rgba(255, 255, 255, 0.2);
}

/* 휴식 상태 독자적인 네온 글로우 */
.timer-running-break .buddy-timer-badge {
  border-color: rgba(52, 211, 153, 0.45);
  box-shadow: 0 20px 45px -10px rgba(0, 0, 0, 0.7), 
              0 0 35px rgba(52, 211, 153, 0.35),
              inset 0 1px 1px rgba(255, 255, 255, 0.2);
}

.badge-ctrl-btn {
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  opacity: 0;
  transform: scale(0.6);
  width: 0;
  margin: 0;
  overflow: hidden;
  pointer-events: none;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.badge-ctrl-btn:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.35);
  box-shadow: 0 0 12px rgba(255, 255, 255, 0.25);
}

.badge-time-text {
  font-weight: 900;
  font-family: 'Inter', -apple-system, sans-serif;
  font-variant-numeric: tabular-nums;
  margin: 0;
  line-height: 1;
  background: linear-gradient(135deg, #ffffff 40%, #cbd5e1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  transition: all 0.3s ease;
}

.timer-running-focus .badge-time-text {
  background: linear-gradient(135deg, #a5b4fc 0%, #ec4899 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.timer-running-break .badge-time-text {
  background: linear-gradient(135deg, #a7f3d0 0%, #10b981 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* ==================== 타이머 숫자 색상 커스터마이징 ==================== */

/* 0. Default (기본 - 그레이화이트) */
.timer-color-default .badge-time-text {
  background: linear-gradient(135deg, #ffffff 40%, #cbd5e1 100%) !important;
  -webkit-background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
  filter: drop-shadow(0 4px 15px rgba(0, 0, 0, 0.5)) !important;
}
.timer-color-default .buddy-timer-badge {
  border-color: rgba(255, 255, 255, 0.15) !important;
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.6), 
              0 0 25px rgba(255, 255, 255, 0.15),
              inset 0 1px 1px rgba(255, 255, 255, 0.2) !important;
}

/* 1. Purple (보라) */
.timer-color-purple .badge-time-text {
  background: linear-gradient(135deg, #f3e8ff 0%, #c084fc 50%, #a855f7 100%) !important;
  -webkit-background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
  filter: drop-shadow(0 0 20px rgba(168, 85, 247, 0.65)) !important;
}
.timer-color-purple .buddy-timer-badge {
  border-color: rgba(168, 85, 247, 0.45) !important;
  box-shadow: 0 20px 45px -10px rgba(0, 0, 0, 0.7), 
              0 0 35px rgba(168, 85, 247, 0.35),
              inset 0 1px 1px rgba(255, 255, 255, 0.2) !important;
}

/* 2. Blue (파랑) */
.timer-color-blue .badge-time-text {
  background: linear-gradient(135deg, #e0f2fe 0%, #60a5fa 50%, #3b82f6 100%) !important;
  -webkit-background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
  filter: drop-shadow(0 0 20px rgba(59, 130, 246, 0.65)) !important;
}
.timer-color-blue .buddy-timer-badge {
  border-color: rgba(59, 130, 246, 0.45) !important;
  box-shadow: 0 20px 45px -10px rgba(0, 0, 0, 0.7), 
              0 0 35px rgba(59, 130, 246, 0.35),
              inset 0 1px 1px rgba(255, 255, 255, 0.2) !important;
}

/* 3. Mint (민트) */
.timer-color-mint .badge-time-text {
  background: linear-gradient(135deg, #ecfdf5 0%, #34d399 50%, #10b981 100%) !important;
  -webkit-background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
  filter: drop-shadow(0 0 20px rgba(16, 185, 129, 0.65)) !important;
}
.timer-color-mint .buddy-timer-badge {
  border-color: rgba(16, 185, 129, 0.45) !important;
  box-shadow: 0 20px 45px -10px rgba(0, 0, 0, 0.7), 
              0 0 35px rgba(16, 185, 129, 0.35),
              inset 0 1px 1px rgba(255, 255, 255, 0.2) !important;
}

/* 4. Rose (로즈) */
.timer-color-rose .badge-time-text {
  background: linear-gradient(135deg, #fff1f2 0%, #fb7185 50%, #f43f5e 100%) !important;
  -webkit-background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
  filter: drop-shadow(0 0 20px rgba(244, 63, 94, 0.65)) !important;
}
.timer-color-rose .buddy-timer-badge {
  border-color: rgba(244, 63, 94, 0.45) !important;
  box-shadow: 0 20px 45px -10px rgba(0, 0, 0, 0.7), 
              0 0 35px rgba(244, 63, 94, 0.35),
              inset 0 1px 1px rgba(255, 255, 255, 0.2) !important;
}

/* 5. Yellow (노랑) */
.timer-color-yellow .badge-time-text {
  background: linear-gradient(135deg, #fef9c3 0%, #facc15 50%, #eab308 100%) !important;
  -webkit-background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
  filter: drop-shadow(0 0 20px rgba(234, 179, 8, 0.65)) !important;
}
.timer-color-yellow .buddy-timer-badge {
  border-color: rgba(234, 179, 8, 0.45) !important;
  box-shadow: 0 20px 45px -10px rgba(0, 0, 0, 0.7), 
              0 0 35px rgba(234, 179, 8, 0.35),
              inset 0 1px 1px rgba(255, 255, 255, 0.2) !important;
}

/* 6. Orange (주황) */
.timer-color-orange .badge-time-text {
  background: linear-gradient(135deg, #ffedd5 0%, #fed7aa 50%, #f97316 100%) !important;
  -webkit-background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
  filter: drop-shadow(0 0 20px rgba(249, 115, 22, 0.65)) !important;
}
.timer-color-orange .buddy-timer-badge {
  border-color: rgba(249, 115, 22, 0.45) !important;
  box-shadow: 0 20px 45px -10px rgba(0, 0, 0, 0.7), 
              0 0 35px rgba(249, 115, 22, 0.35),
              inset 0 1px 1px rgba(255, 255, 255, 0.2) !important;
}

/* 7. White (화이트) */
.timer-color-white .badge-time-text {
  background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 50%, #cbd5e1 100%) !important;
  -webkit-background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
  filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0.5)) !important;
}
.timer-color-white .buddy-timer-badge {
  border-color: rgba(255, 255, 255, 0.4) !important;
  box-shadow: 0 20px 45px -10px rgba(0, 0, 0, 0.7), 
              0 0 30px rgba(255, 255, 255, 0.25),
              inset 0 1px 1px rgba(255, 255, 255, 0.2) !important;
}

.buddy-outer-ring-svg {
  position: absolute;
  top: -14px;
  left: -14px;
  width: calc(100% + 28px);
  height: calc(100% + 28px);
  transform: rotate(-90deg);
  pointer-events: none;
  z-index: 999998;
  opacity: 0;
  transition: opacity 0.3s ease;
  filter: drop-shadow(0 0 3px rgba(99, 102, 241, 0.45));
}

.has-timer .buddy-outer-ring-svg {
  opacity: 1;
}

.buddy-outer-ring-bg {
  stroke: rgba(255, 255, 255, 0.12);
}

.theme-cozy .buddy-outer-ring-bg,
.theme-sky .buddy-outer-ring-bg,
.theme-sweet .buddy-outer-ring-bg,
.theme-fresh .buddy-outer-ring-bg {
  stroke: rgba(0, 0, 0, 0.08);
}

.buddy-outer-ring-bar {
  stroke: url(#buddy-timer-grad);
  transition: stroke-dashoffset 0.3s ease;
}

.buddy-outer-ring-bar.paused {
  stroke: url(#buddy-timer-grad-paused);
}

/* Constellations SVG Styles */
.constellations-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.constellation-line {
  fill: none;
  stroke: rgba(129, 140, 248, 0.22);
  stroke-width: 1.2;
  stroke-dasharray: 4, 4;
  animation: constellation-fade-line 4s infinite alternate ease-in-out;
}

@keyframes constellation-fade-line {
  0% { stroke: rgba(129, 140, 248, 0.1); }
  100% { stroke: rgba(129, 140, 248, 0.3); }
}

.constellation-star-node {
  fill: #ffffff;
  filter: drop-shadow(0 0 5px #a5b4fc);
  animation: constellation-star-blink 2s infinite alternate ease-in-out;
}

@keyframes constellation-star-blink {
  0% { opacity: 0.4; }
  100% { opacity: 1; }
}

/* Twinkling Glitter Star Styles */
.star.glitter-star {
  position: absolute;
  background: #ffffff;
  border-radius: 50%;
  box-shadow: 0 0 8px 1px #ffffff, 0 0 16px 2px rgba(129, 140, 248, 0.4);
  animation: twinkle-glitter var(--twinkle-duration, 2.5s) infinite ease-in-out;
  animation-delay: var(--twinkle-delay, 0s);
}

@keyframes twinkle-glitter {
  0%, 100% { opacity: 0.2; transform: scale(0.6) rotate(0deg); }
  50% { opacity: 1; transform: scale(1.3) rotate(90deg); }
}

.star.normal-star {
  position: absolute;
  background: #ffffff;
  border-radius: 50%;
  box-shadow: 0 0 4px #ffffff;
  animation: twinkle-normal var(--twinkle-duration, 3s) infinite ease-in-out;
  animation-delay: var(--twinkle-delay, 0s);
}

@keyframes twinkle-normal {
  0%, 100% { opacity: 0.1; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}

/* Cross Flares for Glitter Stars */
.flare-h {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 18px;
  height: 1px;
  background: radial-gradient(circle, #ffffff, rgba(255,255,255,0));
  transform: translate(-50%, -50%);
}

.flare-v {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 1px;
  height: 18px;
  background: radial-gradient(circle, #ffffff, rgba(255,255,255,0));
  transform: translate(-50%, -50%);
}

/* Shooting Stars Upgrade */
.shooting-star.normal {
  height: 1.5px;
  background: linear-gradient(-45deg, #ffffff, #60a5fa 40%, rgba(255, 255, 255, 0));
  filter: drop-shadow(0 0 8px rgba(96, 165, 250, 0.8));
}

.shooting-star.large {
  height: 2.8px;
  background: linear-gradient(-45deg, #ffffff, #818cf8 35%, #ec4899 65%, rgba(255, 255, 255, 0));
  filter: drop-shadow(0 0 14px rgba(236, 72, 153, 0.9));
}

@keyframes shoot {
  0% {
    width: 0;
    opacity: 0;
    transform: translate(0, 0) rotate(-45deg);
  }
  15% {
    width: 100px;
    opacity: 1;
  }
  100% {
    width: 180px;
    opacity: 0;
    transform: translate(-450px, 450px) rotate(-45deg);
  }
}

/* ==========================================
   집중 타이머 고도화 & 캐릭터 리액션 스타일 추가
   ========================================== */

/* 뽀모도로 단계 뱃지 */
.timer-phase-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 9999px;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  align-self: center;
}
.timer-phase-badge.focus {
  background: rgba(99, 102, 241, 0.15);
  color: #818cf8;
  border: 1px solid rgba(99, 102, 241, 0.3);
}
.timer-phase-badge.break {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

/* 셋업 옵션 스위치 그룹 */
.timer-options-group {
  display: flex;
  justify-content: space-around;
  gap: 12px;
  margin: 8px 0 14px 0;
  padding: 8px 12px;
  background: var(--bg-input);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}
.timer-option-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  color: var(--text-main);
  cursor: pointer;
  user-select: none;
}
.timer-option-label input[type="checkbox"] {
  accent-color: var(--accent-color);
  width: 14px;
  height: 14px;
  margin: 0;
  cursor: pointer;
}

/* 캐릭터 숨쉬기 애니메이션 (집중 중일 때) */
@keyframes buddy-breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(0.95); }
}

.timer-running-focus .buddy-character-wrapper {
  animation: buddy-breathe 4s infinite ease-in-out;
}
.timer-running-break .buddy-character-wrapper {
  animation: buddy-breathe 6s infinite ease-in-out;
}

/* 완료 시 캐릭터 껑충 바운스 애니메이션 */
@keyframes buddy-bounce-celebrate {
  0%, 100% { transform: translateY(0); }
  30% { transform: translateY(-24px) scaleY(1.08); }
  50% { transform: translateY(0) scaleY(0.92); }
  70% { transform: translateY(-12px) scaleY(1.03); }
}
.timer-complete-celebrate .buddy-character-wrapper {
  animation: buddy-bounce-celebrate 1.0s ease-in-out infinite;
}

/* AI 로딩 시 공중부양 및 광채 맥박 효과 */
@keyframes buddy-hovering {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
@keyframes buddy-glow-pulse {
  0%, 100% { box-shadow: 0 0 10px rgba(99, 102, 241, 0.3); }
  50% { box-shadow: 0 0 25px rgba(99, 102, 241, 0.8), 0 0 8px rgba(99, 102, 241, 0.4); }
}
#buddy-container.loading {
  animation: buddy-hovering 2s infinite ease-in-out;
}
#buddy-container.loading .buddy-character-wrapper {
  border-radius: 50%;
  animation: buddy-glow-pulse 1.5s infinite ease-in-out;
}

/* 이모지 폭죽 파티클 */
.emoji-particle {
  position: absolute;
  pointer-events: none;
  font-size: 15px;
  z-index: 999999;
  animation: emoji-explode 1.2s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
}
@keyframes emoji-explode {
  0% {
    transform: translate(0, 0) scale(0.3) rotate(0deg);
    opacity: 0;
  }
  15% {
    opacity: 1;
  }
  80% {
    opacity: 0.8;
  }
  100% {
    transform: translate(var(--dx), var(--dy)) scale(var(--scale)) rotate(180deg);
    opacity: 0;
  }
}

/* 레벨업 뱃지 연출 스타일 */
.buddy-levelup-badge {
  position: absolute;
  top: -50px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
  border: 1.5px solid rgba(255, 255, 255, 0.4);
  border-radius: 12px;
  padding: 6px 12px;
  min-width: 90px;
  text-align: center;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5), 0 0 15px rgba(168, 85, 247, 0.4);
  z-index: 10000;
  pointer-events: none;
  animation: levelup-bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

@keyframes levelup-bounce-in {
  0% {
    opacity: 0;
    transform: translate(-50%, 20px) scale(0.6);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, 0) scale(1);
  }
}

/* 히든 캐릭터 선택 그리드 스타일 */
.buddy-select-item.hidden-locked {
  filter: grayscale(100%);
  opacity: 0.5;
  cursor: not-allowed !important;
}

/* 히든 캐릭터 선택 그리드 스타일 - 특별 해금 데코레이션 */
.buddy-select-item.hidden-unlocked {
  position: relative !important;
  border: 1.5px solid transparent !important;
  /* 배경을 시커먼 색상 대신 영롱하고 화사한 크림 골드 빛 아우라 그라데이션으로 변경 */
  background-image: linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(253, 224, 71, 0.3) 100%), linear-gradient(135deg, #ffd700, #ff4757, #a855f7) !important;
  background-origin: border-box !important;
  background-clip: padding-box, border-box !important;
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.45), inset 0 0 6px rgba(255, 255, 255, 0.2) !important;
  animation: special-card-pulse 3s infinite ease-in-out alternate;
  transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.25s, filter 0.25s !important;
}

/* 호버 시 공중 부유 및 3D 틸트 효과 */
.buddy-select-item.hidden-unlocked:hover {
  transform: translateY(-4px) scale(1.1) rotate(1.5deg) !important;
  box-shadow: 0 8px 18px rgba(255, 215, 0, 0.6) !important;
  filter: brightness(1.15) !important;
}

.buddy-select-item.hidden-unlocked.selected {
  border: 2px solid transparent !important;
  background-image: linear-gradient(135deg, rgba(255, 255, 255, 0.45) 0%, rgba(253, 224, 71, 0.45) 100%), linear-gradient(135deg, #ffd700, #ff4757, #a855f7) !important;
  box-shadow: 0 0 22px rgba(255, 215, 0, 0.8), inset 0 0 10px rgba(255, 215, 0, 0.4) !important;
  animation: special-card-selected-glow 1.5s infinite ease-in-out alternate;
}

@keyframes special-card-pulse {
  0% { box-shadow: 0 0 6px rgba(255, 215, 0, 0.25); }
  100% { box-shadow: 0 0 14px rgba(255, 215, 0, 0.5); }
}

@keyframes special-card-selected-glow {
  0% { box-shadow: 0 0 12px rgba(255, 215, 0, 0.5), inset 0 0 4px rgba(255, 215, 0, 0.2); }
  100% { box-shadow: 0 0 24px rgba(255, 215, 0, 0.9), inset 0 0 12px rgba(255, 215, 0, 0.5); }
}

/* 레벨업 축하 팝업 모달 전체 레이아웃 */
.buddy-levelup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999999;
  opacity: 0;
  animation: overlay-fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.buddy-levelup-overlay.fade-out {
  animation: overlay-fade-out 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.buddy-levelup-modal {
  position: relative;
  background: rgba(30, 41, 59, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 32px 28px;
  width: 320px;
  text-align: center;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4), 
              0 0 30px rgba(168, 85, 247, 0.15), 
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  transform: scale(0.85) translateY(20px);
  animation: modal-zoom-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes overlay-fade-in {
  to { opacity: 1; }
}

@keyframes overlay-fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes modal-zoom-in {
  to {
    transform: scale(1) translateY(0);
  }
}

.modal-title {
  font-size: 16px;
  font-weight: 900;
  letter-spacing: 1.5px;
  background: linear-gradient(135deg, #ffd700, #ff4757, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 6px;
}

.modal-subtitle {
  font-size: 13px;
  color: #e2e8f0;
  font-weight: 500;
  margin-bottom: 24px;
  opacity: 0.9;
}

.modal-buddy-showcase {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-buddy-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px dashed rgba(255, 215, 0, 0.45);
  animation: spin-clockwise 15s linear infinite;
}

.modal-buddy-img {
  width: 88px;
  height: 88px;
  object-fit: contain;
  z-index: 2;
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.35));
}

@keyframes spin-clockwise {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.modal-buddy-name {
  font-size: 18px;
  font-weight: 900;
  color: #ffd700;
  text-shadow: 0 0 12px rgba(255, 215, 0, 0.4);
  letter-spacing: 1px;
  margin-bottom: 10px;
}

.modal-message {
  font-size: 11.5px;
  color: #94a3b8;
  line-height: 1.6;
  padding: 0 8px;
  margin-bottom: 24px;
}

.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.modal-btn {
  width: 100%;
  height: 38px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.25s ease;
  outline: none;
  box-sizing: border-box;
}

.modal-btn.equip-btn {
  background: linear-gradient(135deg, #ffd700, #ff9f43);
  color: #0f172a;
  border: none;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.35);
}

.modal-btn.equip-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(255, 215, 0, 0.5);
  filter: brightness(1.05);
}

.modal-btn.close-btn {
  background: rgba(255, 255, 255, 0.06);
  color: #cbd5e1;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-btn.close-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

/* 모달용 콘페티 파티클 */
.modal-confetti-particle {
  position: absolute;
  pointer-events: none;
  font-size: 16px;
  z-index: 999999999;
  animation: modal-confetti-explode 1.6s cubic-bezier(0.1, 0.8, 0.25, 1) forwards;
}

@keyframes modal-confetti-explode {
  0% {
    transform: translate(-50%, -50%) scale(0.2) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  80% {
    opacity: 0.85;
  }
  100% {
    transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(var(--scale)) rotate(270deg);
    opacity: 0;
  }
}
`;
