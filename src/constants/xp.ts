export interface IXpLevel {
  level: number;
  title: string;
  xpRequired: number; // total XP needed to reach this level
}

// Each level requires progressively more XP.
// XP thresholds are cumulative (total XP, not per-level).
export const XP_LEVELS: IXpLevel[] = [
  { level: 1, title: "Spark", xpRequired: 0 },
  { level: 2, title: "Ember", xpRequired: 100 },
  { level: 3, title: "Flame", xpRequired: 300 },
  { level: 4, title: "Blaze", xpRequired: 600 },
  { level: 5, title: "Inferno", xpRequired: 1000 },
  { level: 6, title: "Firestorm", xpRequired: 1500 },
  { level: 7, title: "Supernova", xpRequired: 2200 },
  { level: 8, title: "Legendary", xpRequired: 3000 },
  { level: 9, title: "Mythic", xpRequired: 4000 },
  { level: 10, title: "Transcendent", xpRequired: 5500 },
];

// XP rewards for various actions.
// These are referenced when awarding XP (future tasks).
export const XP_REWARDS = {
  SYNC_CHANNEL: 10,
  COMPLETE_GOAL: 50,
  PUBLISH_VIDEO: 30,
  CHAT_WITH_COACH: 5,
  COMPLETE_ONBOARDING: 100,
  WEEKLY_LOGIN_STREAK: 25,
  HIT_MILESTONE: 75,
} as const;
