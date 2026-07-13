import { t } from "../i18n";
import { getMemoState, updateMemoState, subscribeMemoState } from "./memo-state";
import { getColorDotClasses } from "./memo-utils";
import { showBuddyToast } from "../components/buddy-toast";
import { showBubbleConfirm } from "../components/buddy-confirm";
import { updateBuddyState } from "../buddy-state";
import type { MemoColor } from "@/shared/types";

export function renderMemoCard(container: HTMLElement): void {
  const url = window.location.href;

  // 1. 기존 잔상 클리어 및 고정 서브 래퍼 삽입
  container.innerHTML = "";
  const wrapper = document.createElement("div");
  wrapper.className = "buddy-memo-wrap";
  container.appendChild(wrapper);

  // 탭 헤더 추가
  const tabHeader = document.createElement("div");
  tabHeader.className = "buddy-tab-header";
  tabHeader.style.display = "flex";
  tabHeader.style.borderBottom = "1px solid var(--border-color)";
  tabHeader.style.marginBottom = "10px";
  tabHeader.style.gap = "4px";

  const btnCurrent = document.createElement("button");
  btnCurrent.type = "button";
  btnCurrent.className = "buddy-tab-btn active";
  btnCurrent.textContent = t("memoTabCurrent") || "Current Memo";
  btnCurrent.style.flex = "1";
  btnCurrent.style.background = "transparent";
  btnCurrent.style.border = "none";
  btnCurrent.style.color = "var(--text-main)";
  btnCurrent.style.padding = "6px 0";
  btnCurrent.style.fontSize = "11.5px";
  btnCurrent.style.cursor = "pointer";
  btnCurrent.style.borderBottom = "2px solid var(--accent-color)";
  btnCurrent.style.fontWeight = "600";
  btnCurrent.style.outline = "none";

  const btnArchive = document.createElement("button");
  btnArchive.type = "button";
  btnArchive.className = "buddy-tab-btn";
  btnArchive.textContent = t("memoTabArchive") || "Archive";
  btnArchive.style.flex = "1";
  btnArchive.style.background = "transparent";
  btnArchive.style.border = "none";
  btnArchive.style.color = "var(--text-sub)";
  btnArchive.style.padding = "6px 0";
  btnArchive.style.fontSize = "11.5px";
  btnArchive.style.cursor = "pointer";
  btnArchive.style.borderBottom = "2px solid transparent";
  btnArchive.style.fontWeight = "500";
  btnArchive.style.outline = "none";

  tabHeader.appendChild(btnCurrent);
  tabHeader.appendChild(btnArchive);
  wrapper.appendChild(tabHeader);

  // 컨텐츠 영역
  const contentArea = document.createElement("div");
  contentArea.id = "memo-tab-content-area";
  wrapper.appendChild(contentArea);

  let activeTab: "current" | "archive" = "current";
  let cachedMemos: Record<string, any> = {};
  let searchQuery = "";
  let unsubscribeCurrent: (() => void) | null = null;

  // 탭 변경 처리기
  const switchTab = (tab: "current" | "archive") => {
    activeTab = tab;
    
    // 스타일 리셋 및 활성화 지정
    if (tab === "current") {
      btnCurrent.style.color = "var(--text-main)";
      btnCurrent.style.borderBottom = "2px solid var(--accent-color)";
      btnCurrent.style.fontWeight = "600";
      
      btnArchive.style.color = "var(--text-sub)";
      btnArchive.style.borderBottom = "2px solid transparent";
      btnArchive.style.fontWeight = "500";
      
      renderCurrentMemoTab();
    } else {
      btnArchive.style.color = "var(--text-main)";
      btnArchive.style.borderBottom = "2px solid var(--accent-color)";
      btnArchive.style.fontWeight = "600";
      
      btnCurrent.style.color = "var(--text-sub)";
      btnCurrent.style.borderBottom = "2px solid transparent";
      btnCurrent.style.fontWeight = "500";
      
      // 현재 구독 해제
      if (unsubscribeCurrent) {
        unsubscribeCurrent();
        unsubscribeCurrent = null;
      }
      renderArchiveTab();
    }
  };

  btnCurrent.addEventListener("click", () => switchTab("current"));
  btnArchive.addEventListener("click", () => switchTab("archive"));

  // 탭 1: 현재 페이지 메모 렌더링
  function renderCurrentMemoTab() {
    contentArea.innerHTML = "";
    updateMemoState({ isLoading: true, currentMemo: null });

    chrome.runtime.sendMessage({
      type: "BUDDY_GET_MEMO",
      url
    }).then((res: any) => {
      if (res && res.success && res.data) {
        updateMemoState({
          currentMemo: res.data,
          memoInputCache: res.data.content,
          selectedColor: res.data.color,
          isLoading: false
        });
      } else {
        const selectedText = window.getSelection()?.toString().trim() || "";
        updateMemoState({
          currentMemo: null,
          memoInputCache: selectedText,
          selectedColor: "yellow",
          isLoading: false
        });
      }
    }).catch(() => {
      updateMemoState({ isLoading: false });
    });

    let isRendered = false;

    // 현재 메모 탭 상태 구독 시작
    unsubscribeCurrent = subscribeMemoState((s) => {
      if (activeTab !== "current") return;

      if (s.isLoading) {
        isRendered = false;
        contentArea.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; height: 110px; color: var(--text-sub); font-size: 12px;">
            <div class="buddy-loading-dots">
              <span class="buddy-loading-dot"></span>
              <span class="buddy-loading-dot"></span>
              <span class="buddy-loading-dot"></span>
            </div>
            <span style="margin-left: 8px;">${t("memoLoading")}</span>
          </div>
        `;
        return;
      }

      if (!isRendered) {
        const hasMemo = s.currentMemo !== null;
        contentArea.innerHTML = `
          <div class="buddy-input-group" style="margin-bottom: 0;">
            <textarea class="buddy-textarea" id="buddy-memo-input" placeholder="${t("memoPlaceholder")}" style="min-height: 70px; resize: none; margin-bottom: 2px; font-size: 12px; padding: 8px;"></textarea>
          </div>
          <div class="compact-memo-bar" style="display: flex; align-items: center; justify-content: space-between; margin-top: 6px;">
            <div class="compact-color-dots" id="buddy-memo-colors" style="display: flex; gap: 4px;">
              ${(["yellow", "pink", "blue", "green", "purple"] as MemoColor[]).map(c => {
                const classes = getColorDotClasses(c, s.selectedColor);
                return `<span class="${classes}" data-color="${c}"></span>`;
              }).join("")}
            </div>
            <div class="buddy-btn-row" style="margin: 0; gap: 4px;">
              ${hasMemo ? `
                <button type="button" class="buddy-btn-secondary" id="buddy-memo-delete" style="margin: 0; padding: 0 8px; height: 26px; font-size: 11px; display: flex; align-items: center; gap: 2px;">
                  🗑️ ${t("memoDelete")}
                </button>
              ` : ""}
              <button type="button" class="buddy-btn" id="buddy-memo-save" style="margin: 0; padding: 0 12px; height: 26px; font-size: 11px; width: auto; min-width: 60px;">
                ${t("memoSave")}
              </button>
            </div>
          </div>
        `;
        isRendered = true;

        const inputArea = contentArea.querySelector("#buddy-memo-input") as HTMLTextAreaElement;
        const colorPicker = contentArea.querySelector("#buddy-memo-colors") as HTMLDivElement;
        const saveBtn = contentArea.querySelector("#buddy-memo-save") as HTMLButtonElement;
        const deleteBtn = contentArea.querySelector("#buddy-memo-delete") as HTMLButtonElement | null;

        inputArea.value = s.memoInputCache;
        inputArea.addEventListener("input", () => {
          updateMemoState({ memoInputCache: inputArea.value });
        });

        colorPicker.addEventListener("click", (e) => {
          const target = e.target as HTMLElement;
          if (target.classList.contains("compact-color-dot") && !getMemoState().isSaving) {
            const nextColor = target.dataset.color as MemoColor;
            updateMemoState({ selectedColor: nextColor });
          }
        });

        saveBtn.addEventListener("click", () => {
          const content = inputArea.value.trim();
          if (!content) return;

          updateMemoState({ isSaving: true });
          saveBtn.disabled = true;
          updateBuddyState({ actionStatus: "loading" });

          chrome.runtime.sendMessage({
            type: "BUDDY_SAVE_MEMO",
            url,
            content,
            color: getMemoState().selectedColor
          }).then((res: any) => {
            updateMemoState({ isSaving: false });
            if (res && res.success) {
              showBuddyToast(hasMemo ? t("memoUpdated") : t("memoSaved"));
              updateMemoState({ memoInputCache: "" });
              updateBuddyState({ memoInputCache: "", activePanel: null, actionStatus: "success" });
              setTimeout(() => updateBuddyState({ actionStatus: "idle" }), 1500);
            } else {
              showBuddyToast(t("memoSaveFailed"));
              saveBtn.disabled = false;
              updateBuddyState({ actionStatus: "error" });
              setTimeout(() => updateBuddyState({ actionStatus: "idle" }), 2000);
            }
          }).catch(() => {
            updateMemoState({ isSaving: false });
            showBuddyToast(t("memoSaveFailed"));
            saveBtn.disabled = false;
            updateBuddyState({ actionStatus: "error" });
            setTimeout(() => updateBuddyState({ actionStatus: "idle" }), 2000);
          });
        });

        if (deleteBtn) {
          deleteBtn.addEventListener("click", () => {
            if (getMemoState().isSaving) return;

            const shadow = container.getRootNode() as ShadowRoot;
            const buddyContainer = shadow.getElementById("buddy-container") as HTMLElement;

            showBubbleConfirm(shadow, buddyContainer, t("memoDeleteConfirm"), t("confirmDelete"), () => {
              updateMemoState({ isSaving: true });
              deleteBtn.disabled = true;
              updateBuddyState({ actionStatus: "loading" });

              chrome.runtime.sendMessage({
                type: "BUDDY_DELETE_MEMO",
                url
              }).then((res: any) => {
                updateMemoState({ isSaving: false });
                if (res && res.success) {
                  showBuddyToast(t("memoDeleted"));
                  updateMemoState({ memoInputCache: "" });
                  updateBuddyState({ memoInputCache: "", activePanel: null, actionStatus: "success" });
                  setTimeout(() => updateBuddyState({ actionStatus: "idle" }), 1500);
                } else {
                  showBuddyToast("Failed to delete memo.");
                  deleteBtn.disabled = false;
                  updateBuddyState({ actionStatus: "error" });
                  setTimeout(() => updateBuddyState({ actionStatus: "idle" }), 2000);
                }
              }).catch(() => {
                updateMemoState({ isSaving: false });
                showBuddyToast("Failed to delete memo.");
                deleteBtn.disabled = false;
                updateBuddyState({ actionStatus: "error" });
                setTimeout(() => updateBuddyState({ actionStatus: "idle" }), 2000);
              });
            });
          });
        }
      }

      if (isRendered) {
        const inputArea = contentArea.querySelector("#buddy-memo-input") as HTMLTextAreaElement;
        const saveBtn = contentArea.querySelector("#buddy-memo-save") as HTMLButtonElement;
        const deleteBtn = contentArea.querySelector("#buddy-memo-delete") as HTMLButtonElement | null;
        const colorPicker = contentArea.querySelector("#buddy-memo-colors") as HTMLDivElement;

        if (inputArea && inputArea.value !== s.memoInputCache) {
          inputArea.value = s.memoInputCache;
        }
        if (inputArea) inputArea.disabled = s.isSaving;
        if (saveBtn) saveBtn.disabled = s.isSaving || !s.memoInputCache.trim();
        if (deleteBtn) deleteBtn.disabled = s.isSaving;

        if (colorPicker) {
          colorPicker.querySelectorAll(".compact-color-dot").forEach((dot) => {
            const el = dot as HTMLElement;
            const c = el.dataset.color as MemoColor;
            el.className = getColorDotClasses(c, s.selectedColor);
          });
        }
      }
    });
  }

  // 탭 2: 전체 메모 아카이브 렌더링
  function renderArchiveTab() {
    contentArea.innerHTML = `
      <div style="display: flex; gap: 6px; margin-bottom: 8px;">
        <input type="text" id="archive-search-input" placeholder="${t("memoSearchPlaceholder") || "Search memos..."}" style="flex: 1; height: 24px; font-size: 11px; padding: 0 8px; background: var(--bg-input); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-main); outline: none;">
        <button type="button" class="buddy-btn-secondary" id="archive-export-btn" style="height: 24px; padding: 0 8px; font-size: 11px; border-radius: 6px; cursor: pointer; white-space: nowrap; line-height: 22px; margin: 0; background: var(--bg-input); border: 1px solid var(--border-color); color: var(--text-main);">
          ${t("memoExportBtn") || "Export"}
        </button>
      </div>
      <div id="archive-list-box" style="max-height: 150px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; padding-right: 2px;">
        <div style="display: flex; align-items: center; justify-content: center; height: 80px; color: var(--text-sub); font-size: 11px;">
          <div class="buddy-loading-dots">
            <span class="buddy-loading-dot"></span>
            <span class="buddy-loading-dot"></span>
            <span class="buddy-loading-dot"></span>
          </div>
        </div>
      </div>
    `;

    const searchInput = contentArea.querySelector("#archive-search-input") as HTMLInputElement;
    const exportBtn = contentArea.querySelector("#archive-export-btn") as HTMLButtonElement;
    const listBox = contentArea.querySelector("#archive-list-box") as HTMLDivElement;

    // 백그라운드에서 모든 메모 불러오기
    chrome.runtime.sendMessage({
      type: "BUDDY_GET_ALL_MEMOS"
    }).then((res: any) => {
      if (activeTab !== "archive") return;

      if (res && res.success && res.data) {
        cachedMemos = res.data;
        renderList();
      } else {
        listBox.innerHTML = `<div style="text-align: center; padding: 20px 0; font-size: 11.5px; color: var(--text-sub);">${t("memoArchiveEmpty") || "No saved memos."}</div>`;
      }
    }).catch(() => {
      if (activeTab !== "archive") return;
      listBox.innerHTML = `<div style="text-align: center; padding: 20px 0; font-size: 11.5px; color: var(--text-sub);">${t("memoArchiveEmpty") || "No saved memos."}</div>`;
    });

    // 실시간 검색 바인딩
    searchInput.addEventListener("input", () => {
      searchQuery = searchInput.value.trim().toLowerCase();
      renderList();
    });

    // 백업 내보내기 바인딩
    exportBtn.addEventListener("click", () => {
      const entries = Object.entries(cachedMemos);
      if (entries.length === 0) {
        showBuddyToast(t("memoArchiveEmpty") || "No saved memos.");
        return;
      }

      const mdContent = entries
        .map(([memoUrl, item]: [string, any]) => {
          const dateStr = new Date(item.updatedAt).toLocaleString();
          return `## 🔗 [Link](${memoUrl})\n*   **Date**: ${dateStr}\n*   **Color**: ${item.color}\n*   **Content**:\n${item.content}\n\n---`;
        })
        .join("\n\n");
      const fullMd = `# ClickBook Memo Backup List\n\nExported: ${new Date().toLocaleString()}\n\n---\n\n${mdContent}`;

      // 다운로드 링크 시뮬레이션
      const blob = new Blob([fullMd], { type: "text/markdown;charset=utf-8;" });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `clickbook_memos_backup_${Date.now()}.md`;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
      }, 100);

      showBuddyToast(t("memoExportSuccess") || "Exported successfully!");
    });

    // 목록 드로잉
    function renderList() {
      const items = Object.entries(cachedMemos).map(([memoUrl, item]: [string, any]) => ({
        url: memoUrl,
        ...item
      }));

      // 최신 수정순 정렬
      items.sort((a, b) => b.updatedAt - a.updatedAt);

      // 필터링 적용
      const filtered = items.filter(item => 
        item.content.toLowerCase().includes(searchQuery) || 
        item.url.toLowerCase().includes(searchQuery)
      );

      if (filtered.length === 0) {
        listBox.innerHTML = `<div style="text-align: center; padding: 20px 0; font-size: 11px; color: var(--text-sub);">${searchQuery ? (t("memoNoResults") || "No results found.") : (t("memoArchiveEmpty") || "No saved memos.")}</div>`;
        return;
      }

      // 색상칩 백그라운드 매핑
      const bgColors: Record<MemoColor, string> = {
        yellow: "#fef08a",
        pink: "#fbcfe8",
        blue: "#bfdbfe",
        green: "#bbf7d0",
        purple: "#e9d5ff"
      };

      listBox.innerHTML = filtered.map(item => {
        // 본문 미리보기 (최대 48자)
        const summary = item.content.length > 48 ? item.content.slice(0, 48) + "..." : item.content;
        const borderStyle = `border-left: 4px solid ${bgColors[item.color as MemoColor] || "#6366f1"};`;
        const domain = new URL(item.url).hostname || "Link";

        return `
          <div class="archive-item" data-url="${item.url}" style="background: var(--bg-panel); border: 1px solid var(--border-color); ${borderStyle} border-radius: 6px; padding: 6px 8px; display: flex; flex-direction: column; gap: 4px; transition: transform 0.2s ease, background-color 0.2s ease;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px;">
              <span style="font-size: 10px; font-weight: 700; color: var(--accent-color); text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 140px;">
                ${domain}
              </span>
              <div style="display: flex; gap: 6px; align-items: center; flex-shrink: 0;">
                <button type="button" class="archive-action-btn go-link" title="Go to page" style="background: transparent; border: none; font-size: 11px; cursor: pointer; padding: 0 2px;">🔗</button>
                <button type="button" class="archive-action-btn delete-memo" title="Delete Memo" style="background: transparent; border: none; font-size: 11px; cursor: pointer; padding: 0 2px;">🗑️</button>
              </div>
            </div>
            <div style="font-size: 11px; color: var(--text-main); line-height: 1.45; white-space: pre-wrap; word-break: break-all;">${summary}</div>
          </div>
        `;
      }).join("");

      // 각 아이템별 이벤트 바인딩
      listBox.querySelectorAll(".archive-item").forEach(itemEl => {
        const urlStr = itemEl.getAttribute("data-url")!;
        
        // 마우스 호버 모션
        itemEl.addEventListener("mouseenter", () => {
          (itemEl as HTMLElement).style.transform = "translateX(2px)";
          (itemEl as HTMLElement).style.background = "rgba(255, 255, 255, 0.05)";
        });
        itemEl.addEventListener("mouseleave", () => {
          (itemEl as HTMLElement).style.transform = "translateX(0)";
          (itemEl as HTMLElement).style.background = "var(--bg-panel)";
        });

        // 🔗 바로가기 단추
        const goBtn = itemEl.querySelector(".go-link") as HTMLButtonElement;
        goBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          window.open(urlStr, "_blank");
        });

        // 🗑️ 삭제 단추
        const delBtn = itemEl.querySelector(".delete-memo") as HTMLButtonElement;
        delBtn.addEventListener("click", (e) => {
          e.stopPropagation();

          const shadow = container.getRootNode() as ShadowRoot;
          const buddyContainer = shadow.getElementById("buddy-container") as HTMLElement;

          showBubbleConfirm(shadow, buddyContainer, t("memoDeleteConfirm"), t("confirmDelete"), () => {
            updateBuddyState({ actionStatus: "loading" });

            chrome.runtime.sendMessage({
              type: "BUDDY_DELETE_MEMO",
              url: urlStr
            }).then((res: any) => {
              if (res && res.success) {
                showBuddyToast(t("memoDeleted"));
                // 캐시에서 즉시 삭제
                delete cachedMemos[urlStr];
                updateBuddyState({ actionStatus: "success" });
                setTimeout(() => updateBuddyState({ actionStatus: "idle" }), 1500);
                
                // 리스트 다시 그리기
                renderList();
              } else {
                showBuddyToast("Failed to delete memo.");
                updateBuddyState({ actionStatus: "error" });
                setTimeout(() => updateBuddyState({ actionStatus: "idle" }), 2000);
              }
            }).catch(() => {
              showBuddyToast("Failed to delete memo.");
              updateBuddyState({ actionStatus: "error" });
              setTimeout(() => updateBuddyState({ actionStatus: "idle" }), 2000);
            });
          });
        });
      });
    }
  }

  // 초기 로드: 현재 메모 탭으로 시작
  switchTab("current");

  // 언마운트 시 메모리 정리 및 리스너 청소
  const observer = new MutationObserver(() => {
    if (!wrapper.isConnected) {
      if (unsubscribeCurrent) {
        unsubscribeCurrent();
      }
      observer.disconnect();
    }
  });
  observer.observe(container.ownerDocument, { childList: true, subtree: true });
}
