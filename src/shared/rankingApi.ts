import type { WikiArticle, HFModel, HNStory } from "./types";

// Wikipedia API
export async function fetchWikiRanking(langCode: string = "ko"): Promise<WikiArticle[]> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const y = yesterday.getFullYear();
  const m = String(yesterday.getMonth() + 1).padStart(2, "0");
  const d = String(yesterday.getDate()).padStart(2, "0");

  const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/${langCode}.wikipedia/all-access/${y}/${m}/${d}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Wiki API error");
    const data = await res.json();
    const articles = data.items[0].articles as any[];
    
    return articles.slice(0, 50).map(a => ({
      article: a.article.replace(/_/g, " "),
      views: a.views,
      rank: a.rank,
      url: `https://${langCode}.wikipedia.org/wiki/${a.article}`
    }));
  } catch (err) {
    console.error("Wiki fetch failed:", err);
    return [];
  }
}

// Hugging Face API
export async function fetchHFTrending(): Promise<HFModel[]> {
  // Use likes7d sort which is the official proxy for trending on the hub
  const url = "https://huggingface.co/api/models?sort=likes7d&direction=-1&limit=50";
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("HF API error");
    const data = await res.json();
    
    if (!Array.isArray(data)) return [];

    return data.map((m: any) => ({
      id: m.id || "",
      author: m.author || m.id?.split("/")[0] || "N/A",
      repo_name: m.id?.split("/")[1] || m.id || "N/A",
      likes: m.likes || 0,
      downloads: m.downloads || 0,
      lastModified: m.lastModified || new Date().toISOString(),
      url: `https://huggingface.co/${m.id}`
    }));
  } catch (err) {
    console.error("HF fetch failed:", err);
    return [];
  }
}

// Hacker News API
export async function fetchHNTopStories(): Promise<HNStory[]> {
  const topStoriesUrl = "https://hacker-news.firebaseio.com/v0/topstories.json";
  try {
    const res = await fetch(topStoriesUrl);
    if (!res.ok) throw new Error("HN API error");
    const ids = await res.json();
    const topIds = ids.slice(0, 30);

    const stories = await Promise.all(
      topIds.map(async (id: number) => {
        const itemUrl = `https://hacker-news.firebaseio.com/v0/item/${id}.json`;
        const itemRes = await fetch(itemUrl);
        return itemRes.json();
      })
    );

    return stories.filter(s => s && s.type === "story").map(s => ({
      id: s.id,
      title: s.title,
      url: s.url || `https://news.ycombinator.com/item?id=${s.id}`,
      score: s.score,
      by: s.by,
      time: s.time,
      descendants: s.descendants || 0
    }));
  } catch (err) {
    console.error("HN fetch failed:", err);
    return [];
  }
}
