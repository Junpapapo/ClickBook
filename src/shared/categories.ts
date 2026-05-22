import type { Folder } from "./types";

// ============================================================
// デフォルトフォルダー定義（初回起動時のシード）
// ============================================================

export const DEFAULT_FOLDERS: Folder[] = [
  {
    id: "technology",
    name: "Technology",
    nameJa: "テクノロジー",
    icon: "Code2",
    color: "blue",
    parentId: null,
    order: 0,
    isDefault: true,
    collapsed: false,
    createdAt: 0,
  },
  {
    id: "design",
    name: "Design",
    nameJa: "デザイン",
    icon: "Palette",
    color: "purple",
    parentId: null,
    order: 1,
    isDefault: true,
    collapsed: false,
    createdAt: 0,
  },
  {
    id: "business",
    name: "Business",
    nameJa: "ビジネス",
    icon: "Briefcase",
    color: "amber",
    parentId: null,
    order: 2,
    isDefault: true,
    collapsed: false,
    createdAt: 0,
  },
  {
    id: "entertainment",
    name: "Entertainment",
    nameJa: "エンタメ",
    icon: "Tv",
    color: "rose",
    parentId: null,
    order: 3,
    isDefault: true,
    collapsed: false,
    createdAt: 0,
  },
  {
    id: "science",
    name: "Science",
    nameJa: "サイエンス",
    icon: "FlaskConical",
    color: "cyan",
    parentId: null,
    order: 4,
    isDefault: true,
    collapsed: false,
    createdAt: 0,
  },
  {
    id: "sports",
    name: "Sports",
    nameJa: "スポーツ",
    icon: "Trophy",
    color: "green",
    parentId: null,
    order: 5,
    isDefault: true,
    collapsed: false,
    createdAt: 0,
  },
  {
    id: "travel",
    name: "Travel",
    nameJa: "トラベル",
    icon: "Plane",
    color: "sky",
    parentId: null,
    order: 6,
    isDefault: true,
    collapsed: false,
    createdAt: 0,
  },
  {
    id: "other",
    name: "Other",
    nameJa: "その他",
    icon: "Folder",
    color: "gray",
    parentId: null,
    order: 7,
    isDefault: true,
    collapsed: false,
    createdAt: 0,
  },
];

const KO_NAMES: Record<string, string> = {
  technology: "테크놀로지",
  design: "디자인",
  business: "비즈니스",
  entertainment: "엔터테인먼트",
  science: "과학",
  sports: "스포츠",
  travel: "여행",
  other: "기타",
};

export function getLocalizedFolderName(folder: Folder, lang: string): string {
  if (folder.isDefault) {
    const original = DEFAULT_FOLDERS.find(df => df.id === folder.id);
    const isRenamed = original && folder.name !== original.name;
    
    if (!isRenamed) {
      if (lang === "ko" && KO_NAMES[folder.id]) return KO_NAMES[folder.id];
      if (lang === "ja") return folder.nameJa || folder.name;
      return folder.name;
    }
  }
  // ユーザー作成フォルダーの場合、またはリネームされたデフォルトフォルダー
  if (lang === "ja") return folder.nameJa || folder.name;
  return folder.name;
}

// ============================================================
// ルールベース分類パターン（Gemini Nano フォールバック用）
// ============================================================

export const DOMAIN_RULES: Record<string, string> = {
  // Technology
  "github.com": "technology",
  "gitlab.com": "technology",
  "stackoverflow.com": "technology",
  "dev.to": "technology",
  "npmjs.com": "technology",
  "vercel.com": "technology",
  "netlify.com": "technology",
  "codepen.io": "technology",
  "qiita.com": "technology",
  "zenn.dev": "technology",
  "news.ycombinator.com": "technology",
  "developer.mozilla.org": "technology",
  "docs.microsoft.com": "technology",
  "cloud.google.com": "technology",
  "aws.amazon.com": "technology",

  // Design
  "figma.com": "design",
  "dribbble.com": "design",
  "behance.net": "design",
  "awwwards.com": "design",
  "fonts.google.com": "design",
  "coolors.co": "design",
  "unsplash.com": "design",
  "adobe.com": "design",
  "canva.com": "design",

  // Business
  "linkedin.com": "business",
  "notion.so": "business",
  "slack.com": "business",
  "zoom.us": "business",
  "atlassian.com": "business",
  "asana.com": "business",
  "trello.com": "business",
  "hubspot.com": "business",
  "salesforce.com": "business",

  // Entertainment
  "youtube.com": "entertainment",
  "netflix.com": "entertainment",
  "spotify.com": "entertainment",
  "twitch.tv": "entertainment",
  "tiktok.com": "entertainment",
  "nicovideo.jp": "entertainment",
  "abema.tv": "entertainment",
  "hulu.com": "entertainment",
  "disneyplus.com": "entertainment",

  // Science
  "scholar.google.com": "science",
  "arxiv.org": "science",
  "nature.com": "science",
  "pubmed.ncbi.nlm.nih.gov": "science",
  "researchgate.net": "science",
  "sciencedirect.com": "science",
  "jstor.org": "science",

  // Sports
  "espn.com": "sports",
  "nba.com": "sports",
  "fifa.com": "sports",
  "baseball-reference.com": "sports",
  "nfl.com": "sports",
  "sportskeeda.com": "sports",

  // Travel
  "booking.com": "travel",
  "airbnb.com": "travel",
  "tripadvisor.com": "travel",
  "expedia.com": "travel",
  "agoda.com": "travel",
  "jalan.net": "travel",
  "hotels.com": "travel",
  "kayak.com": "travel",
};

export const DEFAULT_FOLDER_ID = "other";

export const getFolderById = (folders: Folder[], id: string): Folder =>
  folders.find((f) => f.id === id) ??
  folders.find((f) => f.id === DEFAULT_FOLDER_ID) ??
  DEFAULT_FOLDERS.find((f) => f.id === DEFAULT_FOLDER_ID)!;

// フォルダーツリーを構築するヘルパー
export interface FolderTreeNode {
  folder: Folder;
  children: FolderTreeNode[];
  bookmarkCount: number;
}

export function buildFolderTree(
  folders: Folder[],
  bookmarkCounts: Record<string, number>
): FolderTreeNode[] {
  const sorted = [...folders].sort((a, b) => a.order - b.order);
  const map = new Map<string, FolderTreeNode>();

  for (const folder of sorted) {
    map.set(folder.id, {
      folder,
      children: [],
      bookmarkCount: bookmarkCounts[folder.id] ?? 0,
    });
  }

  const roots: FolderTreeNode[] = [];
  for (const node of map.values()) {
    if (node.folder.parentId && map.has(node.folder.parentId)) {
      map.get(node.folder.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // 子フォルダーのブックマーク数を親に加算
  function sumCounts(node: FolderTreeNode): number {
    let total = node.bookmarkCount;
    for (const child of node.children) {
      total += sumCounts(child);
    }
    node.bookmarkCount = total;
    return total;
  }
  roots.forEach(sumCounts);

  return roots;
}
