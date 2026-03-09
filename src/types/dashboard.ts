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
}

export interface IMockMilestone {
  title: string;
  current: number;
  target: number;
  unit: string;
}

export interface IMockActionItem {
  id: string;
  text: string;
  priority: "high" | "medium" | "low";
  source: string; // e.g. "Coach", "Goal"
}
