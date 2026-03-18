import { prisma } from "@/lib/prisma";
import type { Channel, ChannelSnapshot, CoachNote, CreatorProfile, Goal, Idea, Video } from "@/generated/prisma/client";

// --- Types ---

type ChannelWithRelations = Channel & {
  videos: Video[];
  snapshots: ChannelSnapshot[];
};

interface ICreatorData {
  channel: ChannelWithRelations | null;
  goals: Goal[];
  ideas: Idea[];
  creatorProfile: CreatorProfile | null;
  coachNote: CoachNote | null;
}

// --- Cache ---

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const creatorDataCache = new Map<
  string,
  { data: ICreatorData; fetchedAt: number }
>();

export function invalidateCreatorCache(userId: string): void {
  creatorDataCache.delete(userId);
}

// --- Data Fetching ---

async function fetchCreatorData(userId: string): Promise<ICreatorData> {
  const cached = creatorDataCache.get(userId);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data;
  }
  const [channel, goals, ideas, creatorProfile, coachNote] = await Promise.all([
    prisma.channel.findUnique({
      where: { userId },
      include: {
        videos: {
          orderBy: { publishedAt: "desc" },
          take: 10,
        },
        snapshots: {
          orderBy: { date: "desc" },
          take: 7,
        },
      },
    }),
    prisma.goal.findMany({
      where: { userId, completed: false },
      orderBy: { createdAt: "desc" },
    }),
    prisma.idea.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.creatorProfile.findUnique({
      where: { userId },
    }),
    prisma.coachNote.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const data: ICreatorData = { channel, goals, ideas, creatorProfile, coachNote };
  creatorDataCache.set(userId, { data, fetchedAt: Date.now() });
  return data;
}

// --- Formatting ---

function formatCreatorProfile(profile: CreatorProfile): string {
  return `## Creator Profile
- Niche: ${profile.niche ?? "Not set"}
- Content Style: ${profile.contentStyle ?? "Not set"}
- Posting Frequency: ${profile.postingFrequency ?? "Not set"}`;
}

function formatChannelStats(channel: ChannelWithRelations): string {
  return `## Channel Stats
- Title: ${channel.title}
- Subscribers: ${channel.subscriberCount.toLocaleString()}
- Total Views: ${channel.viewCount.toLocaleString()}
- Video Count: ${channel.videoCount}`;
}

function formatRecentVideos(videos: Video[]): string {
  const videoLines = videos.map((v) => {
    const parts = [`  - "${v.title}" — ${v.viewCount.toLocaleString()} views, ${v.likeCount} likes`];
    if (v.ctr !== null) parts.push(`CTR: ${v.ctr.toFixed(1)}%`);
    if (v.avgViewPercentage !== null) parts.push(`Retention: ${v.avgViewPercentage.toFixed(1)}%`);
    return parts.join(", ");
  });

  return `## Recent Videos (last ${videos.length})\n${videoLines.join("\n")}`;
}

function formatSubscriberTrend(snapshots: ChannelSnapshot[]): string {
  const trendLines = [...snapshots]
    .reverse()
    .map((s) => `  - ${s.date.toISOString().split("T")[0]}: ${s.subscriberCount.toLocaleString()} subs, ${s.viewCount.toLocaleString()} views`);

  return `## Subscriber Trend (last ${snapshots.length} snapshots)\n${trendLines.join("\n")}`;
}

function formatGoals(goals: Goal[]): string {
  const goalLines = goals.map((g) => {
    const parts = [`  - ${g.title}`];
    if (g.currentValue !== null && g.targetValue !== null) {
      parts.push(`(${g.currentValue}/${g.targetValue} ${g.unit ?? ""})`);
    }
    if (g.deadline) parts.push(`Deadline: ${g.deadline.toISOString().split("T")[0]}`);
    return parts.join(" ");
  });

  return `## Active Goals\n${goalLines.join("\n")}`;
}

function formatIdeas(ideas: Idea[]): string {
  const ideaLines = ideas.map((idea) => `  - ${idea.title}`);
  return `## Ideas Bucket\n${ideaLines.join("\n")}`;
}

function formatCoachNote(note: CoachNote): string {
  return `## Current Coach Note\n- "${note.message}" (type: ${note.type})`;
}

function formatCreatorContext(data: ICreatorData): string {
  const sections: string[] = [];

  if (data.creatorProfile) {
    sections.push(formatCreatorProfile(data.creatorProfile));
  }

  if (data.channel) {
    sections.push(formatChannelStats(data.channel));
    if (data.channel.videos.length > 0) {
      sections.push(formatRecentVideos(data.channel.videos));
    }
    if (data.channel.snapshots.length > 0) {
      sections.push(formatSubscriberTrend(data.channel.snapshots));
    }
  }

  if (data.goals.length > 0) {
    sections.push(formatGoals(data.goals));
  }

  if (data.ideas.length > 0) {
    sections.push(formatIdeas(data.ideas));
  }

  if (data.coachNote) {
    sections.push(formatCoachNote(data.coachNote));
  }

  if (sections.length === 0) {
    return "No creator data available yet. The user hasn't connected their YouTube channel or set up their profile.";
  }

  return sections.join("\n\n");
}

// --- Public API ---

export async function buildCreatorContext(userId: string): Promise<string> {
  const data = await fetchCreatorData(userId);
  return formatCreatorContext(data);
}

export async function getConversationMessages(conversationId: string) {
  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });

  if (messages.length <= 10) {
    return messages.map((m) => ({
      role: m.role as "user" | "model",
      parts: [{ text: m.content }],
    }));
  }

  // Summarize older messages, keep last 6 in full
  const older = messages.slice(0, messages.length - 6);
  const recent = messages.slice(messages.length - 6);

  const summaryLines = older.map(
    (m) => `${m.role}: ${m.content.substring(0, 150)}${m.content.length > 150 ? "..." : ""}`
  );

  const summaryMessage = {
    role: "user" as const,
    parts: [
      {
        text: `[CONVERSATION SUMMARY - Earlier messages condensed]\n${summaryLines.join("\n")}\n[END SUMMARY]`,
      },
    ],
  };

  const recentFormatted = recent.map((m) => ({
    role: m.role as "user" | "model",
    parts: [{ text: m.content }],
  }));

  return [summaryMessage, ...recentFormatted];
}
