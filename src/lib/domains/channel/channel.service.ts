import {
  getAccessToken,
  fetchChannelInfo,
  fetchRecentVideos,
  fetchVideoAnalytics,
} from "@/lib/youtube";
import { todayISO, daysAgoISO } from "@/helpers/date";
import {
  upsertChannel,
  createSnapshot,
  upsertVideo,
  updateVideoAnalytics,
} from "@/lib/domains/channel/channel.data";
import { withCacheInvalidation } from "@/lib/domains/shared/with-cache-invalidation";

export async function syncYouTubeData(userId: string) {
  const accessToken = await getAccessToken(userId);
  if (!accessToken) {
    return { error: "No YouTube access" as const };
  }

  const channelInfo = await fetchChannelInfo(accessToken);
  if (!channelInfo) {
    return { error: "No channel found" as const };
  }

  const result = await withCacheInvalidation(userId, async () => {
    const channel = await upsertChannel(userId, channelInfo);

    await createSnapshot(channel.id, {
      subscriberCount: channelInfo.subscriberCount,
      videoCount: channelInfo.videoCount,
      viewCount: channelInfo.viewCount,
    });

    const videos = await fetchRecentVideos(accessToken, channelInfo.youtubeId);
    for (const video of videos) {
      await upsertVideo(channel.id, video);
    }

    const endDate = todayISO();
    const startDate = daysAgoISO(28);
    const videoAnalytics = await fetchVideoAnalytics(
      accessToken,
      channelInfo.youtubeId,
      startDate,
      endDate
    );

    for (const analytics of videoAnalytics) {
      await updateVideoAnalytics(analytics);
    }

    return { channel, videoCount: videos.length };
  });

  return result;
}
