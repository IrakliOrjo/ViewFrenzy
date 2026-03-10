import { prisma } from "@/lib/prisma";

export interface IChannelInfo {
  youtubeId: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  subscriberCount: number;
  videoCount: number;
  viewCount: bigint;
}

export interface IVideoData {
  youtubeId: string;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  publishedAt: Date;
  duration?: string | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

export interface IVideoAnalytics {
  videoId: string;
  impressions: number;
  ctr: number;
  avgViewDuration: number;
  avgViewPercentage: number;
  estimatedMinutesWatched: number;
}

export async function upsertChannel(userId: string, info: IChannelInfo) {
  return prisma.channel.upsert({
    where: { userId },
    update: {
      title: info.title,
      description: info.description,
      thumbnailUrl: info.thumbnailUrl,
      subscriberCount: info.subscriberCount,
      videoCount: info.videoCount,
      viewCount: info.viewCount,
    },
    create: {
      userId,
      youtubeId: info.youtubeId,
      title: info.title,
      description: info.description,
      thumbnailUrl: info.thumbnailUrl,
      subscriberCount: info.subscriberCount,
      videoCount: info.videoCount,
      viewCount: info.viewCount,
    },
  });
}

export async function createSnapshot(
  channelId: string,
  data: { subscriberCount: number; videoCount: number; viewCount: bigint }
) {
  return prisma.channelSnapshot.create({ data: { channelId, ...data } });
}

export async function upsertVideo(channelId: string, video: IVideoData) {
  return prisma.video.upsert({
    where: { youtubeId: video.youtubeId },
    update: {
      title: video.title,
      viewCount: video.viewCount,
      likeCount: video.likeCount,
      commentCount: video.commentCount,
    },
    create: { channelId, ...video },
  });
}

export async function updateVideoAnalytics(analytics: IVideoAnalytics) {
  return prisma.video.updateMany({
    where: { youtubeId: analytics.videoId },
    data: {
      impressions: analytics.impressions,
      ctr: analytics.ctr,
      avgViewDuration: analytics.avgViewDuration,
      avgViewPercentage: analytics.avgViewPercentage,
      estimatedMinutesWatched: analytics.estimatedMinutesWatched,
    },
  });
}
