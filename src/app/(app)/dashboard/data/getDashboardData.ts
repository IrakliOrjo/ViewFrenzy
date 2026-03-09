import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateLevel } from "@/helpers/calculateLevel";
import { daysAgo } from "@/helpers/date";
import { calculateStats } from "@/app/(app)/dashboard/helpers/calculateStats";
import { MOCK_STATS } from "@/app/(app)/dashboard/helpers/mockData";
import type { IStatCard } from "@/types/dashboard";
import type { ILevelInfo } from "@/helpers/calculateLevel";

export interface IDashboardData {
  greeting: string;
  displayName: string;
  levelInfo: ILevelInfo;
  stats: IStatCard[];
}

export async function getDashboardData(): Promise<IDashboardData> {
  const session = await auth();

  const [channel, user] = await Promise.all([
    session?.user?.id
      ? prisma.channel.findUnique({
          where: { userId: session.user.id },
          include: {
            snapshots: {
              orderBy: { date: "asc" },
              where: {
                date: { gte: daysAgo(14) },
              },
            },
          },
        })
      : null,
    session?.user?.id
      ? prisma.user.findUnique({
          where: { id: session.user.id },
          select: { totalXp: true },
        })
      : null,
  ]);

  const stats = channel
    ? calculateStats(channel, channel.snapshots)
    : MOCK_STATS;

  const displayName = channel?.title ?? session?.user?.name ?? "Creator";
  const levelInfo = calculateLevel(user?.totalXp ?? 0);

  const hour = new Date().getHours();
  let greeting = "Good Evening";
  if (hour < 12) greeting = "Good Morning";
  else if (hour < 18) greeting = "Good Afternoon";

  return { greeting, displayName, levelInfo, stats };
}
