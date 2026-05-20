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
export async function getCachedTopRepos(): Promise<GitHubRepo[]> {
  const today = getToday();
  const cache = await getGitHubRankingCache();
  if (cache && cache.date === today && cache.items?.length) {
    return cache.items;
  }
  const items = await fetchTopRepos();
  await setGitHubRankingCache({ date: today, items, customQueries: cache?.customQueries ?? {} });
  return items;
}

export async function getCachedCustomRepos(query: string): Promise<GitHubRepo[]> {
  const today = getToday();
  const cache = await getGitHubRankingCache();
  if (cache && cache.date === today && cache.customQueries?.[query]?.length) {
    return cache.customQueries[query];
  }
  const items = await fetchCustomRepos(query);
  const newCache: GitHubRankingCache = {
    date: today,
    items: cache?.items ?? [],
    customQueries: { ...(cache?.customQueries ?? {}), [query]: items },
  };
  await setGitHubRankingCache(newCache);
  return items;
}
