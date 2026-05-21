import type { WikiArticle, HFModel, HNStory } from "./types";

const CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours

async function getCachedData<T>(key: string): Promise<{ data: T, timestamp: number } | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      const entry = result[key] as { data: T; timestamp: number } | undefined;
      if (!entry) {
        resolve(null);
        return;
      }
      if (Date.now() - entry.timestamp > CACHE_DURATION) {
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

// Wikipedia API
export async function fetchWikiRanking(langCode: string = "ko", period: string = "day", forceRefresh: boolean = false): Promise<{ items: WikiArticle[], lastUpdated: number }> {
  const cacheKey = `wiki_ranking_${langCode}_${period}`;
  if (!forceRefresh) {
    const cached = await getCachedData<WikiArticle[]>(cacheKey);
    if (cached) return { items: cached.data, lastUpdated: cached.timestamp };
  }

  let y, m, d;
  if (period === "month") {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    y = lastMonth.getFullYear();
    m = String(lastMonth.getMonth() + 1).padStart(2, "0");
    d = "all-days";
  } else {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    y = yesterday.getFullYear();
    m = String(yesterday.getMonth() + 1).padStart(2, "0");
    d = String(yesterday.getDate()).padStart(2, "0");
  }

  const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/${langCode}.wikipedia/all-access/${y}/${m}/${d}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Wiki API error");
    const data = await res.json();
    const articles = data.items[0].articles as any[];
    
    const result = articles.slice(0, 50).map(a => ({
      article: a.article.replace(/_/g, " "),
      views: a.views,
      rank: a.rank,
      url: `https://${langCode}.wikipedia.org/wiki/${a.article}`
    }));

    await setCachedData(cacheKey, result);
    return { items: result, lastUpdated: Date.now() };
  } catch (err) {
    console.error("Wiki fetch failed:", err);
    return { items: [], lastUpdated: Date.now() };
  }
}

// Hugging Face API
export async function fetchHFTrending(period: string = "week", forceRefresh: boolean = false): Promise<{ items: HFModel[], lastUpdated: number }> {
  const cacheKey = `hf_trending_${period}`;
  if (!forceRefresh) {
    const cached = await getCachedData<HFModel[]>(cacheKey);
    if (cached) return { items: cached.data, lastUpdated: cached.timestamp };
  }

  let sort = "likes7d";
  if (period === "all") sort = "likes";
  else if (period === "month") sort = "likes30d";

  const url = `https://huggingface.co/api/models?sort=${sort}&direction=-1&limit=50`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("HF API error");
    const data = await res.json();
    
    if (!Array.isArray(data)) return [];

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
    console.error("HF fetch failed:", err);
    return { items: [], lastUpdated: Date.now() };
  }
}

// Hacker News API
export async function fetchHNTopStories(period: string = "all", forceRefresh: boolean = false): Promise<{ items: HNStory[], lastUpdated: number }> {
  const cacheKey = `hn_top_stories_${period}`;
  if (!forceRefresh) {
    const cached = await getCachedData<HNStory[]>(cacheKey);
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
    if (!res.ok) throw new Error("HN API error");
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
    console.error("HN fetch failed:", err);
    return { items: [], lastUpdated: Date.now() };
  }
}
