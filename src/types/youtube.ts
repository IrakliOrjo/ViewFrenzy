export interface IChannelInfo {
  youtubeId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: bigint;
}

export interface IVideoInfo {
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

export interface IVideoAnalytics {
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

export interface IChannelAnalyticsSummary {
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

export interface ITrafficSource {
  source: string;
  views: number;
  minutesWatched: number;
}
