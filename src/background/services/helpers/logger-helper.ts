let aiDebugLogBuffer: any[] = [];

export async function logAIDebug(message: string, details?: any): Promise<void> {
  aiDebugLogBuffer.push({
    timestamp: new Date().toISOString(),
    message,
    ...(details ? { details } : {})
  });
  console.log(`[AI Debug] ${message}`, details || "");
}

export async function flushAIDebugLogs(): Promise<void> {
  if (aiDebugLogBuffer.length === 0) return;
  try {
    const r = await chrome.storage.local.get("clickbook_ai_debug_log");
    let logs = Array.isArray(r.clickbook_ai_debug_log) ? r.clickbook_ai_debug_log : [];
    logs = [...logs, ...aiDebugLogBuffer];
    aiDebugLogBuffer = [];
    if (logs.length > 50) {
      logs = logs.slice(logs.length - 50);
    }
    await chrome.storage.local.set({ clickbook_ai_debug_log: logs });
  } catch (err) {
    console.error("Failed to flush AI debug log:", err);
  }
}
