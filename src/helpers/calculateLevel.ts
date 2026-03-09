import { XP_LEVELS } from "@/constants/xp";

export interface ILevelInfo {
  level: number;
  title: string;
  currentXp: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  xpProgress: number;       // XP earned within current level
  xpNeeded: number;         // XP needed to fill current level bar
  progressPercent: number;  // 0-100
  isMaxLevel: boolean;
  nextTitle: string | null; // title of the next level, null if max
}

/**
 * Calculate the user's level info from their total XP.
 * Returns all the data needed to render the XP bar.
 */
export function calculateLevel(totalXp: number): ILevelInfo {
  // Find the highest level the user has reached
  let currentLevel = XP_LEVELS[0];
  for (const level of XP_LEVELS) {
    if (totalXp >= level.xpRequired) {
      currentLevel = level;
    } else {
      break;
    }
  }

  const currentIndex = XP_LEVELS.findIndex(
    (l) => l.level === currentLevel.level
  );
  const isMaxLevel = currentIndex === XP_LEVELS.length - 1;
  const nextLevel = isMaxLevel ? null : XP_LEVELS[currentIndex + 1];

  const xpForCurrentLevel = currentLevel.xpRequired;
  const xpForNextLevel = nextLevel?.xpRequired ?? currentLevel.xpRequired;
  const xpProgress = totalXp - xpForCurrentLevel;
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;
  const progressPercent = isMaxLevel
    ? 100
    : Math.min(Math.round((xpProgress / xpNeeded) * 100), 100);

  return {
    level: currentLevel.level,
    title: currentLevel.title,
    currentXp: totalXp,
    xpForCurrentLevel,
    xpForNextLevel,
    xpProgress,
    xpNeeded,
    progressPercent,
    isMaxLevel,
    nextTitle: nextLevel?.title ?? null,
  };
}
