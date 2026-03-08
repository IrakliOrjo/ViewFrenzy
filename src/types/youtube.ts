export interface ChannelInfo {
  youtubeId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: bigint;
}

export interface VideoInfo {
  youtubeId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: Date;
  duration: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

export interface VideoAnalytics {
  videoId: string;
  views: number;
  estimatedMinutesWatched: number;
  avgViewDuration: number;
  avgViewPercentage: number;
  subsGained: number;
  subsLost: number;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  ctr: number;
}

export interface ChannelAnalyticsSummary {
  views: number;
  estimatedMinutesWatched: number;
  avgViewDuration: number;
  subsGained: number;
  subsLost: number;
  likes: number;
  shares: number;
  impressions: number;
  ctr: number;
}

export interface TrafficSource {
  source: string;
  views: number;
  minutesWatched: number;
}
