import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateLevel } from "@/helpers/calculateLevel";
import { daysAgo } from "@/helpers/date";
import { calculateStats } from "@/app/(app)/dashboard/helpers/calculateStats";
import { MOCK_STATS } from "@/app/(app)/dashboard/helpers/mockData";
import { getGoalsByUser } from "@/lib/domains/goal/goal.service";
import { getCurrentNoteForUser } from "@/lib/domains/coach-note/coach-note.service";
import { getTopTasksForUser } from "@/lib/domains/coaching-task/coaching-task.service";
import { TASK_DASHBOARD_LIMIT } from "@/constants/coaching";
import type { Goal, CoachNote, CoachingTask } from "@/generated/prisma/client";
import type { IStatCard, IRecentVideo } from "@/types/dashboard";
import type { ILevelInfo } from "@/helpers/calculateLevel";

export interface IDashboardData {
  greeting: string;
  displayName: string;
  levelInfo: ILevelInfo;
  stats: IStatCard[];
  recentVideos: IRecentVideo[];
  goals: Goal[];
  coachNote: CoachNote | null;
  topTasks: CoachingTask[];
}

export async function getDashboardData(): Promise<IDashboardData> {
  const session = await auth();

  const userId = session?.user?.id;

  const [channel, user, videos, goals, coachNote, topTasks] = userId
    ? await Promise.all([
        prisma.channel.findUnique({
          where: { userId },
          include: {
            snapshots: {
              orderBy: { date: "asc" },
              where: {
                date: { gte: daysAgo(14) },
              },
            },
          },
        }),
        prisma.user.findUnique({
          where: { id: userId },
          select: { totalXp: true },
        }),
        prisma.video.findMany({
          where: { channel: { userId } },
          orderBy: { publishedAt: "desc" },
          take: 3,
          select: {
            id: true,
            title: true,
            thumbnailUrl: true,
            publishedAt: true,
            viewCount: true,
            likeCount: true,
            commentCount: true,
          },
        }),
        getGoalsByUser(userId),
        getCurrentNoteForUser(userId),
        getTopTasksForUser(userId, TASK_DASHBOARD_LIMIT),
      ])
    : [null, null, [], [], null, []];

  const stats = channel
    ? calculateStats(channel, channel.snapshots)
    : MOCK_STATS;

  const displayName = channel?.title ?? session?.user?.name ?? "Creator";
  const levelInfo = calculateLevel(user?.totalXp ?? 0);

  const hour = new Date().getHours();
  let greeting = "Good Evening";
  if (hour < 12) greeting = "Good Morning";
  else if (hour < 18) greeting = "Good Afternoon";

  const recentVideos: IRecentVideo[] = videos.map((v) => ({
    id: v.id,
    title: v.title,
    thumbnailUrl: v.thumbnailUrl,
    publishedAt: v.publishedAt,
    viewCount: v.viewCount,
    likeCount: v.likeCount,
    commentCount: v.commentCount,
  }));

  return { greeting, displayName, levelInfo, stats, recentVideos, goals, coachNote, topTasks };
}
