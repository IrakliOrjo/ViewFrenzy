export interface IStatCard {
  label: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon: string;
}

export interface IRecentVideo {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  publishedAt: Date;
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

export interface IGrowthArticle {
  title: string;
  url: string;
  source: string;
  description: string | null;
  imageUrl: string | null;
  publishedAt: string;
}
