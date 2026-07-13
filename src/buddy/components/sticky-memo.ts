import { t } from "../i18n";
import { showBuddyToast } from "./buddy-toast";

// HTML 이스케이프 헬퍼
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function initStickyMemos(shadow: ShadowRoot): void {
  const url = window.location.href;
  
  // 백그라운드로부터 현재 페이지의 앵커형 메모 목록 로드
  chrome.runtime.sendMessage({
    type: "BUDDY_GET_ANCHORED_MEMOS",
    url
  }).then((res: any) => {
    if (res && res.success && res.data) {
      const list = res.data;
      list.forEach((memo: any) => {
        highlightAndAnchorText(shadow, memo);
      });
    }
  }).catch(() => {});
}

// 텍스트 매칭 하이라이트 및 📌 핀 앵커 주입
export function highlightAndAnchorText(shadow: ShadowRoot, memo: any): void {
  const text = memo.anchorText;
  if (!text || !text.trim()) return;

  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        const tag = parent.tagName.toLowerCase();
        if (
          tag === "script" ||
          tag === "style" ||
          tag === "textarea" ||
          parent.closest("#clickbook-buddy-root") ||
          parent.classList.contains("clickbook-memo-highlight")
        ) {
          return NodeFilter.FILTER_REJECT;
        }
        return node.nodeValue && node.nodeValue.includes(text)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      }
    }
  );

  const matchedNodes: Text[] = [];
  let currentNode = walker.nextNode() as Text | null;
  while (currentNode) {
    matchedNodes.push(currentNode);
    currentNode = walker.nextNode() as Text | null;
  }

  // 매칭된 첫 번째 노드에 앵커를 단다
  if (matchedNodes.length > 0) {
    const node = matchedNodes[0];
    const val = node.nodeValue || "";
    const index = val.indexOf(text);
    
    if (index !== -1) {
      const beforeText = val.substring(0, index);
      const matchedText = val.substring(index, index + text.length);
      const afterText = val.substring(index + text.length);

      const parent = node.parentElement;
      if (parent) {
        if (beforeText) {
          parent.insertBefore(document.createTextNode(beforeText), node);
        }

        const wrapper = document.createElement("span");
        wrapper.className = "clickbook-memo-highlight";
        wrapper.style.backgroundColor = "rgba(254, 240, 138, 0.4)";
        wrapper.style.borderBottom = "2px dashed #facc15";
        wrapper.style.cursor = "pointer";
        wrapper.style.position = "relative";
        wrapper.textContent = matchedText;

        const pin = document.createElement("span");
        pin.className = "clickbook-memo-pin";
        pin.textContent = "📌";
        pin.style.fontSize = "12px";
        pin.style.cursor = "pointer";
        pin.style.marginLeft = "2px";
        pin.style.display = "inline-block";
        pin.style.transition = "transform 0.15s ease";
        pin.title = t("memoAnchoredTooltip" as any) || "Sticky Memo";

        pin.addEventListener("mouseenter", () => {
          pin.style.transform = "scale(1.2) rotate(-15deg)";
        });
        pin.addEventListener("mouseleave", () => {
          pin.style.transform = "scale(1) rotate(0deg)";
        });

        pin.addEventListener("click", (e) => {
          e.stopPropagation();
          toggleStickyTooltip(shadow, pin, memo);
        });

        parent.insertBefore(wrapper, node);
        parent.insertBefore(pin, node);

        if (afterText) {
          parent.insertBefore(document.createTextNode(afterText), node);
        }

        node.remove();
      }
    }
  }
}

// 📌 핀 툴팁 노출
function toggleStickyTooltip(shadow: ShadowRoot, pin: HTMLElement, memo: any): void {
  const existing = shadow.querySelector(`.buddy-sticky-tooltip[data-id="${memo.id}"]`);
  if (existing) {
    existing.remove();
    return;
  }

  shadow.querySelectorAll(".buddy-sticky-tooltip").forEach(t => t.remove());

  const tooltip = document.createElement("div");
  tooltip.className = "buddy-sticky-tooltip";
  tooltip.dataset.id = memo.id;
  tooltip.style.position = "fixed";
  tooltip.style.zIndex = "10005";
  tooltip.style.background = "var(--bg-panel, #1e293b)";
  tooltip.style.color = "var(--text-main, #f3f4f6)";
  tooltip.style.border = "1px solid var(--border-color, rgba(255,255,255,0.15))";
  tooltip.style.borderRadius = "8px";
  tooltip.style.padding = "8px";
  tooltip.style.width = "220px";
  tooltip.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.15)";
  tooltip.style.backdropFilter = "blur(12px)";
  tooltip.style.webkitBackdropFilter = "blur(12px)";
  tooltip.style.display = "flex";
  tooltip.style.flexDirection = "column";
  tooltip.style.gap = "6px";
  
  const stateClass = Array.from(shadow.getElementById("buddy-container")?.classList || [])
    .find(c => c.startsWith("theme-")) || "theme-midnight";
  tooltip.classList.add(stateClass);

  const rect = pin.getBoundingClientRect();
  let left = rect.left + rect.width / 2 - 110;
  let top = rect.bottom + 6;

  if (left + 230 > window.innerWidth) left = window.innerWidth - 230;
  if (left < 10) left = 10;
  if (top + 160 > window.innerHeight) top = rect.top - 140;

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;

  const safeContent = escapeHtml(memo.content).replace(/\n/g, "<br>");
  const safeAnchor = escapeHtml(memo.anchorText);

  tooltip.innerHTML = `
    <div style="font-size: 9.5px; font-weight: 700; color: var(--accent-color); border-bottom: 1px solid var(--border-color); padding-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; user-select: none;" title="${safeAnchor}">
      🎯 Anchor Context
    </div>
    <div style="font-size: 11px; line-height: 1.45; max-height: 80px; overflow-y: auto; color: var(--text-main); word-break: break-all;">
      ${safeContent}
    </div>
    <div style="display: flex; justify-content: flex-end; gap: 4px; border-top: 1px solid var(--border-color); padding-top: 4px; margin-top: 2px;">
      <button type="button" class="tooltip-delete-btn" style="background: transparent; border: none; font-size: 10px; color: var(--text-sub); cursor: pointer; display: flex; align-items: center; gap: 2px; padding: 2px 4px; border-radius: 4px;">
        🗑️ Delete
      </button>
    </div>
  `;

  shadow.appendChild(tooltip);

  const deleteBtn = tooltip.querySelector(".tooltip-delete-btn") as HTMLElement;
  deleteBtn.addEventListener("mouseenter", () => {
    deleteBtn.style.color = "#ef4444";
    deleteBtn.style.backgroundColor = "rgba(239, 68, 68, 0.08)";
  });
  deleteBtn.addEventListener("mouseleave", () => {
    deleteBtn.style.color = "var(--text-sub)";
    deleteBtn.style.backgroundColor = "transparent";
  });

  deleteBtn.addEventListener("click", (evt) => {
    evt.stopPropagation();
    if (confirm(t("memoAnchoredDeleteConfirm" as any) || "Delete this sticky memo?")) {
      chrome.runtime.sendMessage({
        type: "BUDDY_DELETE_ANCHORED_MEMO",
        url: window.location.href,
        memoId: memo.id
      }).then((res: any) => {
        if (res && res.success) {
          tooltip.remove();
          const parent = pin.parentElement;
          if (parent) {
            const highlightSpan = pin.previousElementSibling as HTMLElement;
            if (highlightSpan && highlightSpan.classList.contains("clickbook-memo-highlight")) {
              const textNode = document.createTextNode(highlightSpan.textContent || "");
              parent.insertBefore(textNode, highlightSpan);
              highlightSpan.remove();
            }
            pin.remove();
            showBuddyToast(t("memoDeleted") || "Deleted memo!");
          }
        }
      });
    }
  });

  const onOutsideClick = (e: MouseEvent) => {
    const path = e.composedPath();
    if (!path.includes(tooltip) && !path.includes(pin)) {
      tooltip.remove();
      document.removeEventListener("mousedown", onOutsideClick);
    }
  };
  setTimeout(() => {
    document.addEventListener("mousedown", onOutsideClick);
  }, 50);
}
