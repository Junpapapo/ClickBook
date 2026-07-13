import { getSettings, saveSettings } from "@/shared/storage";
import { DEFAULT_SETTINGS } from "@/shared/storage";
import type { BuddyConfig, Message, MessageResponse } from "@/shared/types";
import { addBookmark } from "@/shared/storage";
import { saveMemo, getMemos, deleteMemo, saveAnchoredMemo, deleteAnchoredMemo, getTodayTimerStats, addTimerStats } from "@/shared/storage";

const INJECTED_TABS_KEY = "buddy_injected_tabs";

// 세션 저장소에서 주입 완료 여부 확인
export async function isBuddyInjected(tabId: number): Promise<boolean> {
  try {
    const res = await chrome.storage.session.get(INJECTED_TABS_KEY);
    const injected: number[] = res[INJECTED_TABS_KEY] || [];
    return injected.includes(tabId);
  } catch {
    return false;
  }
}

// 세션 저장소에 주입 상태 갱신
export async function markBuddyInjected(tabId: number, injected: boolean): Promise<void> {
  try {
    const res = await chrome.storage.session.get(INJECTED_TABS_KEY);
    let list: number[] = res[INJECTED_TABS_KEY] || [];
    if (injected) {
      if (!list.includes(tabId)) {
        list.push(tabId);
      }
    } else {
      list = list.filter((id) => id !== tabId);
    }
    await chrome.storage.session.set({ [INJECTED_TABS_KEY]: list });
  } catch (err) {
    console.warn("[Buddy Service] Failed to update injected tab cache:", err);
  }
}

// 활성 탭에 버디 주입 실행
export async function injectBuddy(
  tabId: number,
  force: boolean = false,
  forcedConfig?: BuddyConfig
): Promise<void> {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab || !tab.url) return;

    // 주입 불가 스크립팅 스킴 차단
    if (!tab.url.startsWith("http://") && !tab.url.startsWith("https://")) {
      return;
    }

    const settings = await getSettings();
    const config = forcedConfig || settings.buddyConfig || DEFAULT_SETTINGS.buddyConfig;

    if (!config) return;

    // 비활성화 상태이고 강제 주입이 아닐 경우 스킵
    if (!config.enabled && !force) {
      return;
    }

    // 도메인 제외 사이트인지 확인
    try {
      const urlObj = new URL(tab.url);
      const domain = urlObj.hostname;
      if (config.hiddenSites && config.hiddenSites.includes(domain)) {
        return;
      }
    } catch {
      return; // URL 파싱 에러 방지
    }

    // 이미 주입된 상태이면 동적으로 설정만 동기화
    const alreadyInjected = await isBuddyInjected(tabId);
    if (alreadyInjected && !force) {
      try {
        await chrome.tabs.sendMessage(tabId, { type: "BUDDY_CONFIG_UPDATE", config });
        return;
      } catch {
        // 통신 오류 발생 시: 새로고침 등으로 컨텍스트 유실 상태이므로 마킹 리셋 후 하단 주입문으로 진행
        await markBuddyInjected(tabId, false);
      }
    }

    // Vite 빌드 구조 상 src/buddy/content-entry.ts는 dist/src/buddy/content-entry.js로 출력됨
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["src/buddy/content-entry.js"],
    });

    await markBuddyInjected(tabId, true);
  } catch (err) {
    console.warn(`[Buddy Service] Failed to inject buddy into tab ${tabId}:`, err);
  }
}

// 버디 제거
export async function removeBuddy(tabId: number): Promise<void> {
  try {
    const alreadyInjected = await isBuddyInjected(tabId);
    if (alreadyInjected) {
      try {
        await chrome.tabs.sendMessage(tabId, { type: "BUDDY_REMOVE" });
      } catch {
        // 이미 탭이 유실되었을 수 있음
      }
    }
    await markBuddyInjected(tabId, false);
  } catch (err) {
    console.warn(`[Buddy Service] Failed to remove buddy from tab ${tabId}:`, err);
  }
}

// 버디 활성화 여부 확인 헬퍼
export async function isBuddyEnabled(): Promise<boolean> {
  const settings = await getSettings();
  return settings.buddyConfig?.enabled === true;
}

// 버디 관련 백그라운드 메시지 핸들러
export async function handleBuddyMessage(message: Message, sender: chrome.runtime.MessageSender): Promise<MessageResponse> {
  switch (message.type) {
    case "GET_BUDDY_CONFIG": {
      const settings = await getSettings();
      const config = settings.buddyConfig || { ...DEFAULT_SETTINGS.buddyConfig! };
      
      // 구버전 스키마 사용 유저에 대한 프리셋 복원용 안전장치
      if (config && (!config.aiPromptPresets || config.aiPromptPresets.length === 0)) {
        config.aiPromptPresets = DEFAULT_SETTINGS.buddyConfig?.aiPromptPresets || [];
        settings.buddyConfig = config;
        await saveSettings(settings); // 크롬 로컬 스토리지에 확실하게 영속 커밋
      }
      
      let aiAvailable = false;
      try {
        const { isAIAvailable } = await import("@/shared/categorizer/ai-service");
        aiAvailable = await isAIAvailable();
      } catch (err) {
        console.warn("[Buddy Service] Failed to check AI availability:", err);
      }

      return { success: true, data: { config, aiAvailable } };
    }
    case "SAVE_BUDDY_CONFIG": {
      const settings = await getSettings();
      const prevEnabled = settings.buddyConfig?.enabled === true;
      const nextEnabled = message.config.enabled === true;
      settings.buddyConfig = message.config;
      await saveSettings(settings);

      // 버디 활성화 상태가 꺼진 상태에서 켜진 상태로 바뀔 때만 인젝션 탭 캐시 초기화
      if (nextEnabled && !prevEnabled) {
        await chrome.storage.session.remove(INJECTED_TABS_KEY);
      }

      // 현재 열려있는 탭들에 새로운 설정을 즉시 방송하여 동기화
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (tab.id && tab.url && (tab.url.startsWith("http://") || tab.url.startsWith("https://"))) {
          if (message.config.enabled) {
            // 버디가 새로 켜진 경우, 제외 도메인이 아니면 주입 시도 (최 최신 설정을 직접 강제 전달)
            await injectBuddy(tab.id, false, message.config);
          } else {
            // 버디가 꺼진 경우 제거
            await removeBuddy(tab.id);
          }
        }
      }
      return { success: true };
    }
    case "BUDDY_ASK_AI": {
      try {
        const { getAIModel, isAIAvailable } = await import("@/shared/categorizer/ai-service");
        const available = await isAIAvailable();
        if (!available) {
          return { success: false, error: "Chrome AI is not available." };
        }
        
        const lm = await getAIModel();
        if (!lm) {
          return { success: false, error: "Failed to load AI model." };
        }

        const systemPrompt = "You are ClickBook Buddy, a helpful, friendly, and smart browser AI assistant. Answer the user's questions in a clear, concise, and helpful manner. The user's query may contain the selected text context from the page. Always respond in the same language as the user's input query.";
        
        const session = await (lm.create as any)({
          systemPrompt,
          expectedOutputs: [{ type: "text", languages: ["en", "ja"] }]
        });

        const promptText = message.context 
          ? `[Context from the webpage]\n"""\n${message.context}\n"""\n\nUser Question: ${message.text}`
          : message.text;

        const response: string = await Promise.race([
          session.prompt(promptText),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 40000)),
        ]);
        
        session.destroy();
        return { success: true, data: { answer: response.trim() } };
      } catch (err: any) {
        console.error("[Buddy Service] AI Chat failed:", err);
        return { success: false, error: err.message || String(err) };
      }
    }
    case "BUDDY_GET_MEMO": {
      try {
        const memos = await getMemos();
        const memo = memos[message.url] || null;
        return { success: true, data: memo };
      } catch (err: any) {
        return { success: false, error: err.message || String(err) };
      }
    }
    case "BUDDY_GET_ALL_MEMOS": {
      try {
        const memos = await getMemos();
        return { success: true, data: memos };
      } catch (err: any) {
        return { success: false, error: err.message || String(err) };
      }
    }
    case "BUDDY_DELETE_MEMO": {
      try {
        await deleteMemo(message.url);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || String(err) };
      }
    }
    case "BUDDY_SAVE_BOOKMARK": {
      try {
        const { isDuplicateUrl } = await import("@/shared/storage");
        const dup = await isDuplicateUrl(message.url);
        if (dup) {
          return { success: false, error: "ALREADY_SAVED" };
        }
        
        const domain = new URL(message.url).hostname;
        const newBookmark = {
          id: message.url, // URL을 ID로 사용 (혹은 랜덤 ID를 생성하되 Buddy_Implementation_Plan.md에 따라 URL 매핑)
          url: message.url,
          title: message.title,
          favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
          folderId: "default",
          domain,
          visitCount: 1,
          savedAt: Date.now(),
        };
        await addBookmark(newBookmark);
        return { success: true };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    }
    case "BUDDY_SAVE_MEMO": {
      try {
        // BookmarkId로 URL을 사용 (QuickMemo bookmarkId = url)
        await saveMemo(message.url, message.content, message.color);
        return { success: true };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    }
    case "BUDDY_HIDE_SITE": {
      try {
        const settings = await getSettings();
        const config = settings.buddyConfig || { ...DEFAULT_SETTINGS.buddyConfig! };
        if (!config.hiddenSites.includes(message.domain)) {
          config.hiddenSites.push(message.domain);
          settings.buddyConfig = config;
          await saveSettings(settings);
        }
        
        // 해당 도메인이 열려있는 탭에서 버디 제거
        const tabs = await chrome.tabs.query({});
        for (const tab of tabs) {
          if (tab.id && tab.url) {
            try {
              const d = new URL(tab.url).hostname;
              if (d === message.domain) {
                await removeBuddy(tab.id);
              }
            } catch {}
          }
        }
        return { success: true };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    }
    case "BUDDY_UNHIDE_SITE": {
      try {
        const settings = await getSettings();
        const config = settings.buddyConfig || { ...DEFAULT_SETTINGS.buddyConfig! };
        config.hiddenSites = config.hiddenSites.filter((d) => d !== message.domain);
        settings.buddyConfig = config;
        await saveSettings(settings);

        // 해당 도메인의 탭에 버디 재주입
        const tabs = await chrome.tabs.query({});
        for (const tab of tabs) {
          if (tab.id && tab.url) {
            try {
              const d = new URL(tab.url).hostname;
              if (d === message.domain) {
                await injectBuddy(tab.id);
              }
            } catch {}
          }
        }
        return { success: true };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    }
    case "BUDDY_CHECK_BOOKMARK": {
      try {
        const { isDuplicateUrl } = await import("@/shared/storage");
        const dup = await isDuplicateUrl(message.url);
        return { success: true, exists: dup };
      } catch (err) {
        return { success: false, exists: false, error: String(err) };
      }
    }
    case "BUDDY_TRANSLATE": {
      try {
        const { text, srcLang, targetLang, actionType = "translate", wordsToTranslate = [] } = message;
        const { getAIModel } = await import("@/shared/categorizer/ai-service");
        const lmAPI = await getAIModel();

        if (!lmAPI) {
          return { success: false, error: "AI Language Model (Nano AI) is unavailable." };
        }

        let systemPrompt = "";
        let promptText = "";

        if (actionType === "summary") {
          systemPrompt = `You are a strict text summarizer. Summarize the text accurately in ${targetLang}. Output ONLY the summarized text in 2-3 short bullet points, no introductory text, no explanations, no preamble (like "Here is the summary:"). Output ONLY the bullet points.`;
          promptText = `Summarize this text in ${targetLang}:\n${text}`;
        } else {
          systemPrompt = `You are a strict translation engine. Translate the user text directly into ${targetLang}.
CRITICAL RULES:
1. Output ONLY the raw translated text.
2. Absolutely NO notes, NO vocabulary lists, NO pronunciation guides, NO dictionary explanations, and NO 'Explanation of choices'.
3. Do NOT add any preamble (like "Here is the translation:") or postamble.
4. If you cannot translate, output only the translated text.`;
          promptText = `Translate the following text to ${targetLang} without any explanation, notes, or vocabulary definitions:\n\n"${text}"`;
        }

        const session = await lmAPI.create({ systemPrompt });
        let resultText = await session.prompt(promptText);
        
        if (typeof session.destroy === "function") {
          session.destroy();
        }

        // 혹시 AI가 ```json ... ``` 으로 감싸서 준 경우를 대비해 마크다운 백틱 청소
        let cleaned = resultText.trim();
        if (cleaned.startsWith("```")) {
          cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, "").replace(/\n?```$/, "").trim();
        }

        return { success: true, data: { translatedText: cleaned } };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    }
    case "BUDDY_GET_TIMER_STATS": {
      try {
        const stats = await getTodayTimerStats();
        return { success: true, data: stats };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    }
    case "BUDDY_ADD_TIMER_STATS": {
      try {
        const stats = await addTimerStats(message.minutes, message.addCycle, message.goal);
        return { success: true, data: stats };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    }
    case "BUDDY_SAVE_ANCHORED_MEMO": {
      try {
        await saveAnchoredMemo(message.url, message.anchorText, message.content, message.color);
        return { success: true };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    }
    case "BUDDY_DELETE_ANCHORED_MEMO": {
      try {
        await deleteAnchoredMemo(message.url, message.memoId);
        return { success: true };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    }
    case "BUDDY_GET_ANCHORED_MEMOS": {
      try {
        const memos = await getMemos();
        const existing = memos[message.url];
        return { success: true, data: existing ? (existing.anchoredMemos || []) : [] };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    }
    default:
      return { success: false, error: "Unhandled buddy message type" };
  }
}
