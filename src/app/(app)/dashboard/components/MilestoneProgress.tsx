import { Users, Eye, Video, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/helpers/formatNumber";
import type { IMockMilestone } from "@/types/dashboard";

const ICON_MAP: Record<string, React.ElementType> = {
  Users,
  Eye,
  Video,
};

const ICON_COLORS: Record<string, { bg: string; text: string }> = {
  Users: {
    bg: "bg-violet-100 dark:bg-violet-900/30",
    text: "text-violet-600 dark:text-violet-400",
  },
  Video: {
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  Eye: {
    bg: "bg-sky-100 dark:bg-sky-900/30",
    text: "text-sky-600 dark:text-sky-400",
  },
};

interface MilestoneProgressProps {
  milestones: IMockMilestone[];
}

export function MilestoneProgress({ milestones }: MilestoneProgressProps) {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold">Milestone Progress</h3>
        <button className="text-xs text-primary font-bold hover:underline cursor-pointer">
          View All &rarr;
        </button>
      </div>

      {/* Milestone cards */}
      <div className="space-y-4">
        {milestones.map((milestone) => {
          const percent = Math.min(
            Math.round((milestone.current / milestone.target) * 100),
            100
          );
          const remaining = milestone.target - milestone.current;
          const Icon = ICON_MAP[milestone.icon] ?? Target;
          const colors = ICON_COLORS[milestone.icon] ?? {
            bg: "bg-primary/10",
            text: "text-primary",
          };

          return (
            <div
              key={milestone.title}
              className="bg-card p-5 rounded-xl shadow-sm border border-primary/5"
            >
              {/* Top row: icon + info + percentage */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn("size-10 rounded-full flex items-center justify-center shrink-0", colors.bg)}>
                    <Icon className={cn("size-5", colors.text)} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">{milestone.title}</h4>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Target className="size-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Target: {formatNumber(milestone.target)}{" "}
                        {milestone.unit}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-3xl font-bold text-primary">
                    {percent}
                  </span>
                  <span className="text-sm font-medium text-primary">%</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-primary/10 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full bg-primary transition-all duration-700 ease-out",
                    percent >= 90 && "bg-gradient-to-r from-primary to-amber-400"
                  )}
                  style={{ width: `${percent}%` }}
                />
              </div>

              {/* Bottom stats */}
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-primary font-medium">
                  {formatNumber(milestone.current)} {milestone.unit} reached
                </span>
                <span className="text-xs text-muted-foreground italic">
                  {percent >= 90
                    ? "Almost there!"
                    : `${formatNumber(remaining)} ${milestone.unit} to go`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
