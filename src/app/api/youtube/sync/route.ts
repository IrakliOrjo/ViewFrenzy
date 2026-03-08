import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getAccessToken,
  fetchChannelInfo,
  fetchRecentVideos,
  fetchVideoAnalytics,
} from "@/lib/youtube";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accessToken = await getAccessToken(session.user.id);
    if (!accessToken) {
      return NextResponse.json({ error: "No YouTube access" }, { status: 403 });
    }

    const channelInfo = await fetchChannelInfo(accessToken);
    if (!channelInfo) {
      return NextResponse.json({ error: "No channel found" }, { status: 404 });
    }

    // Upsert channel
    const channel = await prisma.channel.upsert({
      where: { userId: session.user.id },
      update: {
        title: channelInfo.title,
        description: channelInfo.description,
        thumbnailUrl: channelInfo.thumbnailUrl,
        subscriberCount: channelInfo.subscriberCount,
        videoCount: channelInfo.videoCount,
        viewCount: channelInfo.viewCount,
      },
      create: {
        userId: session.user.id,
        youtubeId: channelInfo.youtubeId,
        title: channelInfo.title,
        description: channelInfo.description,
        thumbnailUrl: channelInfo.thumbnailUrl,
        subscriberCount: channelInfo.subscriberCount,
        videoCount: channelInfo.videoCount,
        viewCount: channelInfo.viewCount,
      },
    });

    // Save channel snapshot
    await prisma.channelSnapshot.create({
      data: {
        channelId: channel.id,
        subscriberCount: channelInfo.subscriberCount,
        videoCount: channelInfo.videoCount,
        viewCount: channelInfo.viewCount,
      },
    });

    // Fetch and upsert recent videos
    const videos = await fetchRecentVideos(accessToken, channelInfo.youtubeId);
    for (const video of videos) {
      await prisma.video.upsert({
        where: { youtubeId: video.youtubeId },
        update: {
          title: video.title,
          viewCount: video.viewCount,
          likeCount: video.likeCount,
          commentCount: video.commentCount,
        },
        create: {
          channelId: channel.id,
          ...video,
        },
      });
    }

    // Fetch analytics for last 28 days
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const videoAnalytics = await fetchVideoAnalytics(
      accessToken,
      channelInfo.youtubeId,
      startDate,
      endDate
    );

    // Update video analytics
    for (const analytics of videoAnalytics) {
      await prisma.video.updateMany({
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

    // Convert BigInt to Number for JSON serialization
    return NextResponse.json({
      success: true,
      channel: { ...channel, viewCount: Number(channel.viewCount) },
      videoCount: videos.length,
    });
  } catch (error) {
    console.error("YouTube sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync YouTube data" },
      { status: 500 }
    );
  }
}
