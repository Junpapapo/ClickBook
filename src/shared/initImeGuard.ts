/**
 * 전역 IME(한글, 일본어, 중국어 등 글자 조합) Enter 방어 스크립트
 * 
 * macOS / Windows 등 다양한 OS 및 브라우저 환경에서
 * 일본어/한글 변환(조합) 중 Enter 키를 누를 때 챗 전송이나 폼 제출(Submit)이
 * 오동작하는 현상을 애플리케이션 전체(Global Event Capturing)에서 완벽히 방지합니다.
 */

let isComposing = false;
let isInitialized = false;

export function initImeGuard(): void {
  if (typeof window === "undefined" || isInitialized) return;
  isInitialized = true;

  // 1. 전역 compositionstart - 조합 시작
  window.addEventListener(
    "compositionstart",
    () => {
      isComposing = true;
    },
    true
  );

  // 2. 전역 compositionend - 조합 완료
  window.addEventListener(
    "compositionend",
    () => {
      // macOS Chrome/Safari에서 compositionend 직후 바로 keydown이 연속 실행되는 경합(Race Condition)을 방지하기 위해 딜레이 처리
      setTimeout(() => {
        isComposing = false;
      }, 50);
    },
    true
  );

  // 3. 전역 keydown - 이벤트 캡처링 단계에서 조합 변환 엔터 가로채기
  window.addEventListener(
    "keydown",
    (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        const target = e.target;
        const isTargetInput =
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement ||
          (target instanceof HTMLElement && target.isContentEditable);

        // 입력 요소에서 IME 조합 변환(일본어 카타카나/한자 변환, 한글 조합 등) 중인 상태에서 누른 Enter라면
        if (
          isTargetInput &&
          (isComposing || e.isComposing || (e as any).nativeEvent?.isComposing)
        ) {
          // 하위 컴포넌트의 onKeyDown (Send/Submit/Add 등)으로 이벤트가 전파되지 않도록 상위 단계에서 차단
          e.stopPropagation();
        }
      }
    },
    true // capture: true 옵션으로 자식 요소의 keydown 이벤트보다 먼저 실행
  );
}

// 모듈 불러오기 시 자동으로 초기화 등록
initImeGuard();
