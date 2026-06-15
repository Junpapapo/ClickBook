import { DICT } from "@/shared/i18n";
import { getEffectiveLanguage } from "./helpers/lang-helper";

export function formatDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function updateBadgeCount(todoBoard: any): Promise<void> {
  try {
    if (!todoBoard || !todoBoard.tasks || !todoBoard.columns || !todoBoard.columnOrder) {
      await chrome.action.setBadgeText({ text: "" });
      return;
    }
    const todayStr = formatDateStr(new Date());
    let urgentCount = 0;
    
    Object.values(todoBoard.tasks).forEach((task: any) => {
      if (!task.completed && task.dueDate) {
        if (task.dueDate <= todayStr) {
          urgentCount++;
        }
      }
    });

    if (urgentCount > 0) {
      await chrome.action.setBadgeText({ text: String(urgentCount) });
      await chrome.action.setBadgeBackgroundColor({ color: "#ef4444" });
      try {
        await chrome.action.setBadgeTextColor({ color: "#ffffff" });
      } catch (e) {}
    } else {
      await chrome.action.setBadgeText({ text: "" });
    }
  } catch (err) {
    console.warn("Failed to update badge count:", err);
  }
}

export async function checkTodoReminders(): Promise<void> {
  try {
    const { getSettings, getTodoBoard } = await import("@/shared/storage");
    const settings = await getSettings();
    
    // 알림 비활성화되어 있으면 즉시 리턴
    if (!settings.enableTodoNotifications) return;
    
    const todoBoard = await getTodoBoard();
    if (!todoBoard || !todoBoard.tasks) return;
    
    const now = Date.now();
    
    // 이미 알림 전송된 태스크 ID/시간 추적용 캐시 로드
    const { clickbook_notified_tasks } = await chrome.storage.local.get("clickbook_notified_tasks");
    const notifiedMap: Record<string, number> = clickbook_notified_tasks || {};
    let cacheChanged = false;
    
    // 알림 만료 시간 청소 (7일 이전의 캐시는 지우기)
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    Object.keys(notifiedMap).forEach(key => {
      if (notifiedMap[key] < sevenDaysAgo) {
        delete notifiedMap[key];
        cacheChanged = true;
      }
    });

    for (const task of Object.values(todoBoard.tasks) as any[]) {
      if (task.completed || !task.dueDate) continue;
      
      const timeStr = task.dueTime || "12:00";
      const dueDateTime = new Date(`${task.dueDate}T${timeStr}`);
      if (isNaN(dueDateTime.getTime())) continue;
      
      const dueTimestamp = dueDateTime.getTime();
      
      const reminderType = task.reminder || "none";
      if (reminderType === "none") continue;
      
      let offsetMs = 0;
      if (reminderType === "at_due") offsetMs = 0;
      else if (reminderType === "15m_before") offsetMs = 15 * 60 * 1000;
      else if (reminderType === "1h_before") offsetMs = 60 * 60 * 1000;
      else if (reminderType === "3h_before") offsetMs = 3 * 60 * 60 * 1000;
      else if (reminderType === "1d_before") offsetMs = 24 * 60 * 60 * 1000;
      
      const triggerTimestamp = dueTimestamp - offsetMs;
      
      // 현재 시간이 trigger 시간 이상이고, trigger 시간으로부터 5분 이내인 경우에만 발송
      if (now >= triggerTimestamp && now <= triggerTimestamp + 5 * 60 * 1000) {
        const cacheKey = `${task.id}_${reminderType}_${dueTimestamp}`;
        if (!notifiedMap[cacheKey]) {
          const lang = await getEffectiveLanguage();
          let message = "";
          if (reminderType === "at_due") {
            message = DICT[lang].reminderNotifyAtDue.replace("{time}", timeStr);
          } else if (reminderType === "15m_before") {
            message = DICT[lang].reminderNotify15m;
          } else if (reminderType === "1h_before") {
            message = DICT[lang].reminderNotify1h;
          } else if (reminderType === "3h_before") {
            message = DICT[lang].reminderNotify3h;
          } else if (reminderType === "1d_before") {
            message = DICT[lang].reminderNotify1d;
          }

          await chrome.notifications.create(task.id, {
            type: "basic",
            iconUrl: chrome.runtime.getURL("icons/icon128.png"),
            title: task.content || DICT[lang].reminderNotifyTitle,
            message: message,
            requireInteraction: true
          });
          
          notifiedMap[cacheKey] = now;
          cacheChanged = true;
        }
      }
    }
    
    if (cacheChanged) {
      await chrome.storage.local.set({ clickbook_notified_tasks: notifiedMap });
    }
  } catch (err) {
    console.warn("Failed to check todo reminders:", err);
  }
}
