import type {
  IStatCard,
  IMockCoachNote,
  IMockMilestone,
  IMockActionItem,
} from "@/types/dashboard";

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

export const MOCK_COACH_NOTE: IMockCoachNote = {
  message:
    "Your last video got 2x your average views — that topic is resonating. Consider making a follow-up or a deeper dive on the same theme. Doubling down on what works is the fastest way to grow at your stage.",
  type: "insight",
};

export const MOCK_MILESTONES: IMockMilestone[] = [
  {
    title: "Reach 500 Subscribers",
    current: 487,
    target: 500,
    unit: "subscribers",
  },
  {
    title: "Upload 50 Videos",
    current: 38,
    target: 50,
    unit: "videos",
  },
  {
    title: "Hit 25K Total Views",
    current: 24300,
    target: 25000,
    unit: "views",
  },
];

export const MOCK_ACTION_ITEMS: IMockActionItem[] = [
  {
    id: "1",
    text: "Try a shorter intro on your next video — your average view duration drops in the first 15 seconds",
    priority: "high",
    source: "Coach",
  },
  {
    id: "2",
    text: "Your thumbnails could use more contrast — test a bold text overlay on the next upload",
    priority: "medium",
    source: "Coach",
  },
  {
    id: "3",
    text: "You planned to post 3 times this week — you have 1 upload so far",
    priority: "medium",
    source: "Goal",
  },
];
