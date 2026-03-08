import { google } from "googleapis";
import { prisma } from "@/lib/prisma";
import type {
  ChannelInfo,
  VideoInfo,
  VideoAnalytics,
  ChannelAnalyticsSummary,
  TrafficSource,
} from "@/types/youtube";

// ---------- BigInt JSON helper ----------
// BigInt cannot be serialized to JSON natively. Use this replacer with
// JSON.stringify when sending responses that may contain BigInt values.
export function bigIntReplacer(_key: string, value: unknown): unknown {
  return typeof value === "bigint" ? value.toString() : value;
}

// ---------- Internal helper ----------

function getOAuthClient(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({ access_token: accessToken });
  return oauth2Client;
}

// ---------- Exported functions ----------

/**
 * Retrieve a valid access token for the given user.
 * If the stored token has expired, it will be refreshed using the refresh_token
 * and the new credentials will be persisted back to the database.
 */
export async function getAccessToken(
  userId: string
): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
  });
  if (!account?.access_token) return null;

  // Check whether the token has expired
  if (account.expires_at && account.expires_at * 1000 < Date.now()) {
    if (!account.refresh_token) return null;

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ refresh_token: account.refresh_token });

    const { credentials } = await oauth2Client.refreshAccessToken();

    await prisma.account.update({
      where: { id: account.id },
      data: {
        access_token: credentials.access_token,
        expires_at: credentials.expiry_date
          ? Math.floor(credentials.expiry_date / 1000)
          : null,
      },
    });

    return credentials.access_token ?? null;
  }

  return account.access_token;
}

/**
 * Fetch the authenticated user's YouTube channel info.
 * Returns null if the user has no channel.
 */
export async function fetchChannelInfo(
  accessToken: string
): Promise<ChannelInfo | null> {
  const auth = getOAuthClient(accessToken);
  const youtube = google.youtube({ version: "v3", auth });

  const response = await youtube.channels.list({
    part: ["snippet", "statistics"],
    mine: true,
  });

  const channel = response.data.items?.[0];
  if (!channel) return null;

  return {
    youtubeId: channel.id!,
    title: channel.snippet?.title ?? "",
    description: channel.snippet?.description ?? "",
    thumbnailUrl: channel.snippet?.thumbnails?.default?.url ?? "",
    subscriberCount: parseInt(channel.statistics?.subscriberCount ?? "0"),
    videoCount: parseInt(channel.statistics?.videoCount ?? "0"),
    viewCount: BigInt(channel.statistics?.viewCount ?? "0"),
  };
}

/**
 * Fetch the most recent videos for a channel.
 *
 * Uses `playlistItems.list` on the uploads playlist (UU prefix) instead of
 * `search.list`. This costs 3 quota units vs 100 per request (33x cheaper).
 */
export async function fetchRecentVideos(
  accessToken: string,
  channelId: string,
  maxResults = 20
): Promise<VideoInfo[]> {
  const auth = getOAuthClient(accessToken);
  const youtube = google.youtube({ version: "v3", auth });

  // Derive the uploads playlist ID by replacing the UC prefix with UU
  const uploadsPlaylistId = "UU" + channelId.slice(2);

  const playlistResponse = await youtube.playlistItems.list({
    part: ["snippet"],
    playlistId: uploadsPlaylistId,
    maxResults,
  });

  const videoIds = playlistResponse.data.items
    ?.map((item) => item.snippet?.resourceId?.videoId)
    .filter(Boolean) as string[];

  if (!videoIds?.length) return [];

  // Get full video details (snippet + statistics + contentDetails)
  const videosResponse = await youtube.videos.list({
    part: ["snippet", "statistics", "contentDetails"],
    id: videoIds,
  });

  return (videosResponse.data.items ?? []).map((video) => ({
    youtubeId: video.id!,
    title: video.snippet?.title ?? "",
    description: video.snippet?.description ?? "",
    thumbnailUrl: video.snippet?.thumbnails?.medium?.url ?? "",
    publishedAt: new Date(video.snippet?.publishedAt ?? ""),
    duration: video.contentDetails?.duration ?? "",
    viewCount: parseInt(video.statistics?.viewCount ?? "0"),
    likeCount: parseInt(video.statistics?.likeCount ?? "0"),
    commentCount: parseInt(video.statistics?.commentCount ?? "0"),
  }));
}

/**
 * Fetch per-video analytics for the given channel and date range.
 * Returns up to 50 videos sorted by views (descending).
 */
export async function fetchVideoAnalytics(
  accessToken: string,
  channelId: string,
  startDate: string,
  endDate: string
): Promise<VideoAnalytics[]> {
  const auth = getOAuthClient(accessToken);
  const youtubeAnalytics = google.youtubeAnalytics({ version: "v2", auth });

  const response = await youtubeAnalytics.reports.query({
    ids: `channel==${channelId}`,
    startDate,
    endDate,
    metrics:
      "views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,subscribersGained,subscribersLost,likes,comments,shares,impressions,impressionClickThroughRate",
    dimensions: "video",
    sort: "-views",
    maxResults: 50,
  });

  return (
    response.data.rows?.map((row) => ({
      videoId: row[0] as string,
      views: row[1] as number,
      estimatedMinutesWatched: row[2] as number,
      avgViewDuration: row[3] as number,
      avgViewPercentage: row[4] as number,
      subsGained: row[5] as number,
      subsLost: row[6] as number,
      likes: row[7] as number,
      comments: row[8] as number,
      shares: row[9] as number,
      impressions: row[10] as number,
      ctr: row[11] as number,
    })) ?? []
  );
}

/**
 * Fetch an aggregated channel-level analytics summary for the date range.
 * Returns null if no data is available.
 */
export async function fetchChannelAnalyticsSummary(
  accessToken: string,
  channelId: string,
  startDate: string,
  endDate: string
): Promise<ChannelAnalyticsSummary | null> {
  const auth = getOAuthClient(accessToken);
  const youtubeAnalytics = google.youtubeAnalytics({ version: "v2", auth });

  const response = await youtubeAnalytics.reports.query({
    ids: `channel==${channelId}`,
    startDate,
    endDate,
    metrics:
      "views,estimatedMinutesWatched,averageViewDuration,subscribersGained,subscribersLost,likes,shares,impressions,impressionClickThroughRate",
  });

  const row = response.data.rows?.[0];
  if (!row) return null;

  return {
    views: row[0] as number,
    estimatedMinutesWatched: row[1] as number,
    avgViewDuration: row[2] as number,
    subsGained: row[3] as number,
    subsLost: row[4] as number,
    likes: row[5] as number,
    shares: row[6] as number,
    impressions: row[7] as number,
    ctr: row[8] as number,
  };
}

/**
 * Fetch traffic source breakdown for the given channel and date range.
 * Returns sources sorted by views (descending).
 */
export async function fetchTrafficSources(
  accessToken: string,
  channelId: string,
  startDate: string,
  endDate: string
): Promise<TrafficSource[]> {
  const auth = getOAuthClient(accessToken);
  const youtubeAnalytics = google.youtubeAnalytics({ version: "v2", auth });

  const response = await youtubeAnalytics.reports.query({
    ids: `channel==${channelId}`,
    startDate,
    endDate,
    metrics: "views,estimatedMinutesWatched",
    dimensions: "insightTrafficSourceType",
    sort: "-views",
  });

  return (
    response.data.rows?.map((row) => ({
      source: row[0] as string,
      views: row[1] as number,
      minutesWatched: row[2] as number,
    })) ?? []
  );
}
