import type { WikiArticle, HFModel, HNStory } from "./types";

const CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours
const API_USER_AGENT = "ClickBookExtension/1.7.1 (https://github.com/Junpapapo/ClickBook; support@clickbook.local)";

async function getCachedData<T>(key: string, allowStale: boolean = false): Promise<{ data: T; timestamp: number } | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      const entry = result[key] as { data: T; timestamp: number } | undefined;
      if (!entry) {
        resolve(null);
        return;
      }
      if (!allowStale && Date.now() - entry.timestamp > CACHE_DURATION) {
        resolve(null);
        return;
      }
      resolve(entry);
    });
  });
}

async function setCachedData<T>(key: string, data: T): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set(
      {
        [key]: { data, timestamp: Date.now() },
      },
      resolve
    );
  });
}

function isSystemPage(title: string): boolean {
  const normalized = title.replace(/_/g, " ").toLowerCase();
  if (
    normalized === "main page" ||
    normalized === "메인 페이지" ||
    normalized === "メインページ" ||
    normalized === "首页" ||
    normalized === "首頁" ||
    normalized === "hauptseite" ||
    normalized === "portada"
  ) {
    return true;
  }
  const systemPrefixes = [
    "special:", "wikipedia:", "category:", "template:", "portal:", "help:", "file:", "talk:", "user:", "draft:", "media:", "mediawiki:",
    "특수:", "위키백과:", "분류:", "틀:", "포털:", "도움말:", "파일:", "토론:", "사용자:",
    "特別:", "カテゴリ:", "テンプレート:", "ヘルプ:", "ノート:", "利用者:",
    "special:", "kategorie:", "vorlage:", "hilfe:", "datei:", "diskussion:", "benutzer:",
    "especial:", "categoría:", "plantilla:", "ayuda:", "archivo:", "discusión:", "usuario:"
  ];
  return systemPrefixes.some((prefix) => normalized.startsWith(prefix));
}

// Wikipedia API
export async function fetchWikiRanking(
  langCode: string = "ko",
  period: string = "day",
  forceRefresh: boolean = false
): Promise<{ items: WikiArticle[]; lastUpdated: number }> {
  // Normalize language codes (e.g., zh-TW -> zh)
  const projectLang = langCode.startsWith("zh") ? "zh" : (langCode || "ko");
  const cacheKey = `wiki_ranking_${projectLang}_${period}`;

  if (!forceRefresh) {
    const cached = await getCachedData<WikiArticle[]>(cacheKey, false);
    if (cached) return { items: cached.data, lastUpdated: cached.timestamp };
  }

  const fetchForDate = async (dateOffset: number) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - dateOffset);
    const y = targetDate.getFullYear();
    const m = String(targetDate.getMonth() + 1).padStart(2, "0");
    const d = String(targetDate.getDate()).padStart(2, "0");
    const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/${projectLang}.wikipedia/all-access/${y}/${m}/${d}`;
    const res = await fetch(url, {
      headers: { "Api-User-Agent": API_USER_AGENT }
    });
    if (!res.ok) throw new Error(`Wiki API error: HTTP ${res.status}`);
    const data = await res.json();
    return (data?.items?.[0]?.articles as any[]) || [];
  };

  try {
    let articles: any[] = [];
    if (period === "month") {
      // Try previous month, fallback to 2 months ago
      for (const monthOffset of [1, 2]) {
        try {
          const targetMonth = new Date();
          targetMonth.setMonth(targetMonth.getMonth() - monthOffset);
          const y = targetMonth.getFullYear();
          const m = String(targetMonth.getMonth() + 1).padStart(2, "0");
          const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/${projectLang}.wikipedia/all-access/${y}/${m}/all-days`;
          const res = await fetch(url, {
            headers: { "Api-User-Agent": API_USER_AGENT }
          });
          if (res.ok) {
            const data = await res.json();
            articles = data?.items?.[0]?.articles || [];
            if (articles.length > 0) break;
          }
        } catch {
          // try next offset
        }
      }
    } else {
      // Wikimedia analytics has 1-2 days batch latency. Try offsets 1 to 5.
      for (const offset of [1, 2, 3, 4, 5]) {
        try {
          articles = await fetchForDate(offset);
          if (articles && articles.length > 0) break;
        } catch {
          // try next offset
        }
      }
    }

    if (!articles || articles.length === 0) {
      // Check for stale cache before failing
      const stale = await getCachedData<WikiArticle[]>(cacheKey, true);
      if (stale && stale.data.length > 0) {
        return { items: stale.data, lastUpdated: stale.timestamp };
      }
      return { items: [], lastUpdated: Date.now() };
    }

    const filtered = articles.filter((a) => !isSystemPage(a.article));
    const result = filtered.slice(0, 50).map((a, idx) => ({
      article: a.article.replace(/_/g, " "),
      views: a.views,
      rank: idx + 1,
      url: `https://${projectLang}.wikipedia.org/wiki/${encodeURIComponent(a.article)}`
    }));

    await setCachedData(cacheKey, result);
    return { items: result, lastUpdated: Date.now() };
  } catch (err) {
    console.warn("Wiki fetch graceful fallback:", err);
    const stale = await getCachedData<WikiArticle[]>(cacheKey, true);
    return { items: stale?.data || [], lastUpdated: stale?.timestamp || Date.now() };
  }
}

// Hugging Face API
export async function fetchHFTrending(
  period: string = "week",
  forceRefresh: boolean = false
): Promise<{ items: HFModel[]; lastUpdated: number }> {
  const cacheKey = `hf_trending_${period}`;
  if (!forceRefresh) {
    const cached = await getCachedData<HFModel[]>(cacheKey, false);
    if (cached) return { items: cached.data, lastUpdated: cached.timestamp };
  }

  let sort = "likes7d";
  if (period === "all") sort = "likes";
  else if (period === "month") sort = "likes30d";

  const url = `https://huggingface.co/api/models?sort=${sort}&direction=-1&limit=50`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HF API error: HTTP ${res.status}`);
    const data = await res.json();

    if (!Array.isArray(data)) {
      const stale = await getCachedData<HFModel[]>(cacheKey, true);
      return { items: stale?.data || [], lastUpdated: stale?.timestamp || Date.now() };
    }

    const result = data.map((m: any) => ({
      id: m.id || "",
      author: m.author || m.id?.split("/")[0] || "N/A",
      repo_name: m.id?.split("/")[1] || m.id || "N/A",
      likes: m.likes || 0,
      downloads: m.downloads || 0,
      lastModified: m.lastModified || new Date().toISOString(),
      url: `https://huggingface.co/${m.id}`
    }));

    await setCachedData(cacheKey, result);
    return { items: result, lastUpdated: Date.now() };
  } catch (err) {
    console.warn("HF fetch graceful fallback:", err);
    const stale = await getCachedData<HFModel[]>(cacheKey, true);
    return { items: stale?.data || [], lastUpdated: stale?.timestamp || Date.now() };
  }
}

// Hacker News API
export async function fetchHNTopStories(
  period: string = "all",
  forceRefresh: boolean = false
): Promise<{ items: HNStory[]; lastUpdated: number }> {
  const cacheKey = `hn_top_stories_${period}`;
  if (!forceRefresh) {
    const cached = await getCachedData<HNStory[]>(cacheKey, false);
    if (cached) return { items: cached.data, lastUpdated: cached.timestamp };
  }

  try {
    let url = "https://hn.algolia.com/api/v1/search?tags=story";
    if (period !== "all") {
      const days = period === "week" ? 7 : 30;
      const ts = Math.floor(Date.now() / 1000) - days * 24 * 60 * 60;
      url += `&numericFilters=created_at_i>${ts}`;
    }
    url += "&hitsPerPage=50";

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HN API error: HTTP ${res.status}`);
    const data = await res.json();

    const result = data.hits.map((s: any) => ({
      id: parseInt(s.objectID),
      title: s.title,
      url: s.url || `https://news.ycombinator.com/item?id=${s.objectID}`,
      score: s.points || 0,
      by: s.author,
      time: s.created_at_i,
      descendants: s.num_comments || 0
    }));

    await setCachedData(cacheKey, result);
    return { items: result, lastUpdated: Date.now() };
  } catch (err) {
    console.warn("HN fetch graceful fallback:", err);
    const stale = await getCachedData<HNStory[]>(cacheKey, true);
    return { items: stale?.data || [], lastUpdated: stale?.timestamp || Date.now() };
  }
}

