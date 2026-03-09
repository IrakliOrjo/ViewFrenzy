import type { IStatCard } from "@/types/dashboard";
import { formatNumber, formatPercent } from "@/helpers/formatNumber";
import { daysAgoMs } from "@/helpers/date";

interface ChannelData {
  subscriberCount: number;
  videoCount: number;
  viewCount: bigint;
}

interface SnapshotData {
  subscriberCount: number;
  viewCount: bigint;
  date: Date;
}

/**
 * Calculate the 4 stat cards from channel + snapshot data.
 * Growth is calculated by comparing the latest snapshot to the oldest
 * snapshot from the past 7 days.
 */
export function calculateStats(
  channel: ChannelData,
  snapshots: SnapshotData[]
): IStatCard[] {
  // Sort snapshots by date ascending
  const sorted = [...snapshots].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  // Find the oldest snapshot from the last 7 days for comparison
  const weekOldSnapshot = sorted.find(
    (s) => s.date.getTime() >= daysAgoMs(7)
  );

  // Calculate subscriber change
  const subChange = weekOldSnapshot
    ? channel.subscriberCount - weekOldSnapshot.subscriberCount
    : 0;

  // Calculate view change
  const viewChange = weekOldSnapshot
    ? Number(channel.viewCount) - Number(weekOldSnapshot.viewCount)
    : 0;

  // Calculate growth percentage
  const growthPercent =
    weekOldSnapshot && weekOldSnapshot.subscriberCount > 0
      ? ((channel.subscriberCount - weekOldSnapshot.subscriberCount) /
          weekOldSnapshot.subscriberCount) *
        100
      : 0;

  return [
    {
      label: "Subscribers",
      value: formatNumber(channel.subscriberCount),
      change: subChange !== 0 ? `${subChange >= 0 ? "+" : ""}${subChange} this week` : "No change this week",
      trend: subChange > 0 ? "up" : subChange < 0 ? "down" : "neutral",
      icon: "Users",
    },
    {
      label: "Total Views",
      value: formatNumber(channel.viewCount),
      change: viewChange !== 0 ? `${viewChange >= 0 ? "+" : ""}${formatNumber(viewChange)} this week` : "No change this week",
      trend: viewChange > 0 ? "up" : viewChange < 0 ? "down" : "neutral",
      icon: "Eye",
    },
    {
      label: "Total Videos",
      value: formatNumber(channel.videoCount),
      change: undefined,
      trend: "neutral",
      icon: "Video",
    },
    {
      label: "Growth",
      value: growthPercent !== 0 ? formatPercent(growthPercent) : "—",
      change: growthPercent !== 0 ? "Subs this week vs last" : "Need more data",
      trend: growthPercent > 0 ? "up" : growthPercent < 0 ? "down" : "neutral",
      icon: "TrendingUp",
    },
  ];
}
