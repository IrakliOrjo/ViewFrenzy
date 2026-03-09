import { Zap, Trophy } from "lucide-react";
import type { ILevelInfo } from "@/helpers/calculateLevel";

interface WelcomeSectionProps {
  greeting: string;
  displayName: string;
  levelInfo: ILevelInfo;
}

export function WelcomeSection({
  greeting,
  displayName,
  levelInfo,
}: WelcomeSectionProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
      {/* Left: greeting + XP subtitle */}
      <div className="min-w-0">
        <h1 className="text-display text-foreground">
          {greeting}, {displayName}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {levelInfo.isMaxLevel ? (
            <>
              You&apos;ve reached <span className="font-bold text-primary">Max Level</span> —
              legendary status achieved.
            </>
          ) : (
            <>
              You&apos;re just{" "}
              <span className="font-bold text-primary">
                {(levelInfo.xpNeeded - levelInfo.xpProgress).toLocaleString()} XP
              </span>{" "}
              away from the{" "}
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                &ldquo;{levelInfo.nextTitle}&rdquo;
              </span>{" "}
              badge.
            </>
          )}
        </p>
      </div>

      {/* Right: level rank card */}
      <div className="shrink-0 w-full sm:w-64 p-4 rounded-2xl bg-gradient-to-br from-white to-amber-50 dark:from-card dark:to-amber-950/20 border border-amber-200/60 dark:border-amber-800/30 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="size-5 text-amber-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {levelInfo.title}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="size-4 text-primary fill-primary" />
            <span className="text-xl font-black text-primary tabular-nums">
              Lv.{levelInfo.level}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2.5 rounded-full bg-amber-100 dark:bg-amber-900/30 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-primary transition-all duration-700 ease-out"
            style={{ width: `${levelInfo.progressPercent}%` }}
          />
        </div>

        <p className="text-[11px] text-muted-foreground mt-2 text-center tabular-nums">
          {levelInfo.isMaxLevel
            ? `${levelInfo.currentXp.toLocaleString()} XP — Max Level`
            : `${levelInfo.progressPercent}% to ${levelInfo.nextTitle}`}
        </p>
      </div>
    </div>
  );
}
