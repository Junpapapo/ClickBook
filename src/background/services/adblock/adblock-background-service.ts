import { getSettings, saveSettings } from "@/shared/storage";
import { FiltersEngine } from "@ghostery/adblocker";

const RULE_ID_START = 10000;
const ADBLOCK_UPDATE_ALARM = "clickbook-adblock-update-alarm";

/**
 * Syncs the Ad Blocker settings with Chrome's declarativeNetRequest rules.
 * Enables/disables the static ruleset and updates dynamic rules for exception domains.
 */
export async function syncDeclarativeRules(): Promise<void> {
  const settings = await getSettings();
  const config = settings.buddyConfig;
  const isEnabled = config?.adBlockEnabled !== false;
  const bypassDomains = config?.adBlockBypassDomains || [];

  if (typeof chrome === "undefined" || !chrome.declarativeNetRequest) {
    return;
  }

  // 1. Sync static ruleset activation
  try {
    const enabledRulesets = await chrome.declarativeNetRequest.getEnabledRulesets();
    const isStaticRulesetEnabled = enabledRulesets.includes("ruleset_adblock");

    if (isEnabled && !isStaticRulesetEnabled) {
      await chrome.declarativeNetRequest.updateEnabledRulesets({
        enableRulesetIds: ["ruleset_adblock"]
      });
    } else if (!isEnabled && isStaticRulesetEnabled) {
      await chrome.declarativeNetRequest.updateEnabledRulesets({
        disableRulesetIds: ["ruleset_adblock"]
      });
    }
  } catch (err) {
    console.warn("[AdBlock Background] Failed to sync enabled rulesets:", err);
  }

  // 2. Sync dynamic rules (Bypassed domains)
  try {
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const removeRuleIds = existingRules
      .filter((r) => r.id >= RULE_ID_START)
      .map((r) => r.id);

    const addRules: chrome.declarativeNetRequest.Rule[] = [];
    if (isEnabled) {
      bypassDomains.forEach((domain, idx) => {
        addRules.push({
          id: RULE_ID_START + idx,
          priority: 1,
          action: {
            type: chrome.declarativeNetRequest.RuleActionType.ALLOW_ALL_REQUESTS
          },
          condition: {
            initiatorDomains: [domain],
            resourceTypes: [
              chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
              chrome.declarativeNetRequest.ResourceType.SUB_FRAME,
              chrome.declarativeNetRequest.ResourceType.STYLESHEET,
              chrome.declarativeNetRequest.ResourceType.SCRIPT,
              chrome.declarativeNetRequest.ResourceType.IMAGE,
              chrome.declarativeNetRequest.ResourceType.FONT,
              chrome.declarativeNetRequest.ResourceType.OBJECT,
              chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST,
              chrome.declarativeNetRequest.ResourceType.PING,
              chrome.declarativeNetRequest.ResourceType.CSP_REPORT,
              chrome.declarativeNetRequest.ResourceType.MEDIA,
              chrome.declarativeNetRequest.ResourceType.WEBSOCKET,
              chrome.declarativeNetRequest.ResourceType.OTHER
            ]
          }
        });
      });
    }

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds,
      addRules
    });
  } catch (err) {
    console.warn("[AdBlock Background] Failed to update dynamic rules:", err);
  }
}

/**
 * Gets the current ad blocker active status for a specific domain.
 */
export async function getAdBlockStateForDomain(domain: string): Promise<{ enabled: boolean; activeForDomain: boolean }> {
  const settings = await getSettings();
  const config = settings.buddyConfig;
  const isGlobalEnabled = config?.adBlockEnabled !== false;
  const bypassDomains = config?.adBlockBypassDomains || [];

  return {
    enabled: isGlobalEnabled,
    activeForDomain: isGlobalEnabled && !bypassDomains.includes(domain)
  };
}

/**
 * Toggles the bypass status of a specific domain.
 */
export async function toggleAdBlockForDomain(domain: string): Promise<boolean> {
  const settings = await getSettings();
  if (!settings.buddyConfig) {
    settings.buddyConfig = {
      enabled: false,
      buddyId: "owl",
      size: 96,
      animationInterval: 6000,
      position: { x: 85, y: 70 },
      opacity: 0.9,
      hiddenSites: [],
      enabledMenuItems: []
    };
  }

  const config = settings.buddyConfig;
  const bypassDomains = config.adBlockBypassDomains || [];
  const isCurrentlyBypassed = bypassDomains.includes(domain);

  if (isCurrentlyBypassed) {
    config.adBlockBypassDomains = bypassDomains.filter((d) => d !== domain);
  } else {
    config.adBlockBypassDomains = [...bypassDomains, domain];
  }

  await saveSettings(settings);
  await syncDeclarativeRules();

  return isCurrentlyBypassed;
}

/**
 * Fetches the latest EasyList rules, compiles them to a FiltersEngine,
 * and caches the serialized output to local storage.
 */
export async function updateEasyListRules(): Promise<void> {
  try {
    console.log("[AdBlock Background] Fetching online EasyList...");
    const response = await fetch("https://easylist.to/easylist/easylist.txt");
    if (!response.ok) throw new Error("Network response was not ok");
    const rulesText = await response.text();

    const engine = FiltersEngine.parse(rulesText);
    const serializedBin = engine.serialize();

    await chrome.storage.local.set({
      adblock_engine_bin: Array.from(serializedBin),
      adblock_last_updated: Date.now()
    });
    console.log("[AdBlock Background] EasyList successfully updated and cached.");
  } catch (err) {
    console.warn("[AdBlock Background] Failed to fetch EasyList online, compiling local fallback:", err);
    try {
      const localUrl = chrome.runtime.getURL("easylist.txt");
      const localResponse = await fetch(localUrl);
      const localText = await localResponse.text();

      const engine = FiltersEngine.parse(localText);
      const serializedBin = engine.serialize();

      await chrome.storage.local.set({
        adblock_engine_bin: Array.from(serializedBin),
        adblock_last_updated: Date.now()
      });
      console.log("[AdBlock Background] Local fallback compiled and cached.");
    } catch (localErr) {
      console.error("[AdBlock Background] Critical: Failed to parse fallback rules:", localErr);
    }
  }
}

/**
 * Sets up the periodic alarm for fetching latest EasyList.
 */
export async function setupAdBlockRulesSyncAlarm(): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.alarms) return;

  const alarm = await chrome.alarms.get(ADBLOCK_UPDATE_ALARM);
  if (!alarm) {
    // Check & update every 3 days (4320 minutes)
    await chrome.alarms.create(ADBLOCK_UPDATE_ALARM, {
      delayInMinutes: 5,
      periodInMinutes: 4320
    });
    console.log("[AdBlock Background] Registered adblock sync alarm.");
  }

  // Also do a startup update check if no cached engine exists
  const cache = await chrome.storage.local.get("adblock_engine_bin");
  if (!cache.adblock_engine_bin) {
    await updateEasyListRules();
  }
}
