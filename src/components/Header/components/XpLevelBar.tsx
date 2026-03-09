"use client";

import { Zap } from "lucide-react";
import type { ILevelInfo } from "@/helpers/calculateLevel";

interface XpLevelBarProps {
  levelInfo: ILevelInfo;
}

export function XpLevelBar({ levelInfo }: XpLevelBarProps) {
  return (
    <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-primary/5 border border-primary/10">
      {/* Level badge */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="flex items-center justify-center size-6 rounded-lg bg-primary text-primary-foreground">
          <Zap className="size-3.5 fill-current" />
        </div>
        <span className="text-xs font-bold text-primary tabular-nums">
          Lv.{levelInfo.level}
        </span>
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-primary/15" />

      {/* Progress section */}
      <div className="flex flex-col gap-1 min-w-[110px]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-foreground/80 leading-none">
            {levelInfo.title}
          </span>
          <span className="text-[10px] font-medium text-muted-foreground tabular-nums leading-none">
            {levelInfo.isMaxLevel
              ? `${levelInfo.currentXp} XP`
              : `${levelInfo.xpProgress} / ${levelInfo.xpNeeded} XP`}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 rounded-full bg-primary/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-700 ease-out"
            style={{ width: `${levelInfo.progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
