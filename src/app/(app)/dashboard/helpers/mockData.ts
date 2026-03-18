import type { IStatCard } from "@/types/dashboard";

export const MOCK_STATS: IStatCard[] = [
  {
    label: "Total Views",
    value: "1.2M",
    change: "+12.5%",
    trend: "up",
    icon: "Eye",
  },
  {
    label: "Subscribers",
    value: "487",
    change: "+24 this week",
    trend: "up",
    icon: "Users",
  },
  {
    label: "Total Videos",
    value: "38",
    change: undefined,
    trend: "neutral",
    icon: "Video",
  },
  {
    label: "Growth",
    value: "+5.2%",
    change: "Subs this week vs last",
    trend: "up",
    icon: "TrendingUp",
  },
];
