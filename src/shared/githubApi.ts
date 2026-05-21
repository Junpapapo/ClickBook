import type { GitHubRepo, GitHubRankingCache } from "./types";
import { getGitHubRankingCache, setGitHubRankingCache } from "./storage";

const GITHUB_API_URL = "https://api.github.com/search/repositories";

// 日付を YYYY-MM-DD で返す
function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

// スター数順で上位50件取得
export async function fetchTopRepos(): Promise<GitHubRepo[]> {
  const q = "stars:>10000";
  const url = `${GITHUB_API_URL}?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=50`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("GitHub API error");
  const data = await res.json();
  return data.items as GitHubRepo[];
}

// カスタム検索
export async function fetchCustomRepos(query: string): Promise<GitHubRepo[]> {
  const url = `${GITHUB_API_URL}?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=50`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("GitHub API error");
  const data = await res.json();
  return data.items as GitHubRepo[];
}

// キャッシュ取得・保存ロジック
export async function getCachedTopRepos(forceRefresh: boolean = false): Promise<{ items: GitHubRepo[], lastUpdated: number }> {
  const today = getToday();
  const cache = await getGitHubRankingCache();
  if (!forceRefresh && cache && cache.date === today && cache.items?.length) {
    return { items: cache.items, lastUpdated: cache.timestamp || Date.now() };
  }
  const items = await fetchTopRepos();
  const ts = Date.now();
  await setGitHubRankingCache({ date: today, timestamp: ts, items, customQueries: cache?.customQueries ?? {} });
  return { items, lastUpdated: ts };
}

export async function getCachedCustomRepos(query: string, forceRefresh: boolean = false): Promise<{ items: GitHubRepo[], lastUpdated: number }> {
  const today = getToday();
  const cache = await getGitHubRankingCache();
  if (!forceRefresh && cache && cache.date === today && cache.customQueries?.[query]?.length) {
    return { items: cache.customQueries[query], lastUpdated: cache.timestamp || Date.now() };
  }
  const items = await fetchCustomRepos(query);
  const ts = Date.now();
  const newCache: GitHubRankingCache = {
    date: today,
    timestamp: ts,
    items: cache?.items ?? [],
    customQueries: { ...(cache?.customQueries ?? {}), [query]: items },
  };
  await setGitHubRankingCache(newCache);
  return { items, lastUpdated: ts };
}
