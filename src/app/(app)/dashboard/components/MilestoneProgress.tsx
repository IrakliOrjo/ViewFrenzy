"use client";

import { Users, Eye, Video, Target, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/helpers/formatNumber";
import type { Goal } from "@/generated/prisma/client";

const UNIT_ICON_MAP: Record<string, { icon: React.ElementType; bg: string; text: string }> = {
  subscribers: {
    icon: Users,
    bg: "bg-violet-100 dark:bg-violet-900/30",
    text: "text-violet-600 dark:text-violet-400",
  },
  videos: {
    icon: Video,
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  views: {
    icon: Eye,
    bg: "bg-sky-100 dark:bg-sky-900/30",
    text: "text-sky-600 dark:text-sky-400",
  },
};

interface MilestoneProgressProps {
  goals: Goal[];
  onAddGoal?: () => void;
  onEditGoal?: (goal: Goal) => void;
}

export function MilestoneProgress({ goals, onAddGoal, onEditGoal }: MilestoneProgressProps) {
  const activeGoals = goals.filter((g) => !g.completed && g.targetValue !== null);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold">Milestone Progress</h3>
        <div className="flex items-center gap-3">
          {onAddGoal && (
            <button
              onClick={onAddGoal}
              className="flex items-center gap-1 text-xs text-primary font-bold hover:underline cursor-pointer"
            >
              <Plus className="size-3" />
              Add Goal
            </button>
          )}
        </div>
      </div>

      {/* Milestone cards */}
      <div className="space-y-4">
        {activeGoals.length === 0 ? (
          <div className="bg-card p-8 rounded-xl shadow-sm border border-dashed border-primary/20 text-center">
            <Target className="size-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No goals yet. Add a goal to track your progress.
            </p>
          </div>
        ) : (
          activeGoals.map((goal) => {
            const current = goal.currentValue ?? 0;
            const target = goal.targetValue!;
            const percent = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
            const remaining = target - current;
            const unitConfig = UNIT_ICON_MAP[goal.unit ?? ""] ?? {
              icon: Target,
              bg: "bg-primary/10",
              text: "text-primary",
            };
            const Icon = unitConfig.icon;

            return (
              <div
                key={goal.id}
                onClick={() => onEditGoal?.(goal)}
                className={cn(
                  "bg-card p-5 rounded-xl shadow-sm border border-primary/5 transition-all duration-300 hover:shadow-md hover:border-primary/10 group",
                  onEditGoal && "cursor-pointer"
                )}
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "size-10 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110",
                        unitConfig.bg
                      )}
                    >
                      <Icon className={cn("size-5", unitConfig.text)} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">{goal.title}</h4>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Target className="size-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          Target: {formatNumber(target)} {goal.unit ?? ""}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-3xl font-bold text-primary">{percent}</span>
                    <span className="text-sm font-medium text-primary">%</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-primary/10 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full bg-primary transition-all duration-700 ease-out progress-shine",
                      percent >= 90 && "bg-gradient-to-r from-primary to-amber-400"
                    )}
                    style={{ width: `${percent}%` }}
                  />
                </div>

                {/* Bottom stats */}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-primary font-medium">
                    {formatNumber(current)} {goal.unit ?? ""} reached
                  </span>
                  <span className="text-xs text-muted-foreground italic">
                    {percent >= 90
                      ? "Almost there!"
                      : `${formatNumber(remaining)} ${goal.unit ?? ""} to go`}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
