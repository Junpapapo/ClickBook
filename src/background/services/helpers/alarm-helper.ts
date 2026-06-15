/**
 * Alarm Helper for Background Services
 */
export async function updateGCAlarm(interval: "daily" | "weekly" | "off") {
  try {
    await chrome.alarms.clear("clickbook-gc-alarm");
    if (interval === "off") {
      console.log("[GC Alarm] Background garbage collection alarm is disabled.");
      return;
    }
    const periodInMinutes = interval === "weekly" ? 10080 : 1440;
    await chrome.alarms.create("clickbook-gc-alarm", {
      delayInMinutes: 5,
      periodInMinutes
    });
    console.log(`[GC Alarm] Background garbage collection alarm scheduled: ${interval} (${periodInMinutes} mins)`);
  } catch (err) {
    console.warn("Failed to update GC alarm schedule:", err);
  }
}
