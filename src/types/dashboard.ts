export interface IStatCard {
  label: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon: string; // Lucide icon name — resolved in the component
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

export interface IMockCoachNote {
  message: string;
  type: "insight" | "encouragement" | "action";
  analyzedAt: string;
}

export interface IMockMilestone {
  title: string;
  current: number;
  target: number;
  unit: string;
  icon: string; // Lucide icon name — resolved in the component
}

export interface IMockActionItem {
  id: string;
  text: string;
  priority: "high" | "medium" | "low";
  source: string; // e.g. "Coach", "Goal"
}

export interface IGrowthArticle {
  title: string;
  url: string;
  source: string;
  description: string | null;
  imageUrl: string | null;
  publishedAt: string; // ISO string — unstable_cache serializes via JSON
}
