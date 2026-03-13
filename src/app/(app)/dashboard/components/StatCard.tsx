import {
  Users,
  Eye,
  Video,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { IStatCard } from "@/types/dashboard";

const STAT_VARIANTS: Record<
  string,
  { gradient: string; border: string; iconBg: string; iconColor: string; hoverShadow: string }
> = {
  Eye: {
    gradient: "from-white to-amber-100/40 dark:from-card dark:to-amber-900/20",
    border: "border-amber-200 dark:border-amber-800/40",
    iconBg: "bg-amber-100 dark:bg-amber-900/40",
    iconColor: "text-amber-600 dark:text-amber-400",
    hoverShadow: "hover:shadow-amber-200/30 dark:hover:shadow-amber-900/20",
  },
  Users: {
    gradient: "from-white to-primary/10 dark:from-card dark:to-primary/15",
    border: "border-primary/20 dark:border-primary/30",
    iconBg: "bg-primary/15 dark:bg-primary/20",
    iconColor: "text-primary",
    hoverShadow: "hover:shadow-primary/15 dark:hover:shadow-primary/10",
  },
  Video: {
    gradient: "from-white to-orange-100/40 dark:from-card dark:to-orange-900/20",
    border: "border-orange-200 dark:border-orange-800/40",
    iconBg: "bg-orange-100 dark:bg-orange-900/40",
    iconColor: "text-orange-600 dark:text-orange-400",
    hoverShadow: "hover:shadow-orange-200/30 dark:hover:shadow-orange-900/20",
  },
  TrendingUp: {
    gradient: "from-white to-yellow-100/30 dark:from-card dark:to-yellow-900/15",
    border: "border-yellow-200 dark:border-yellow-800/40",
    iconBg: "bg-yellow-100 dark:bg-yellow-900/40",
    iconColor: "text-yellow-600 dark:text-yellow-400",
    hoverShadow: "hover:shadow-yellow-200/30 dark:hover:shadow-yellow-900/20",
  },
};

const ICON_MAP: Record<string, React.ElementType> = {
  Users,
  Eye,
  Video,
  TrendingUp,
};

interface StatCardProps {
  stat: IStatCard;
}

export function StatCard({ stat }: StatCardProps) {
  const Icon = ICON_MAP[stat.icon] ?? TrendingUp;
  const variant = STAT_VARIANTS[stat.icon] ?? STAT_VARIANTS.TrendingUp;

  return (
    <div
      className={cn(
        "p-6 rounded-2xl bg-gradient-to-br border shadow-sm",
        "group transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-lg",
        variant.gradient,
        variant.border,
        variant.hoverShadow
      )}
    >
      {/* Top row: icon + trend badge */}
      <div className="flex justify-between items-start mb-4">
        <div
          className={cn(
            "p-2.5 rounded-xl transition-transform duration-300 group-hover:scale-110",
            variant.iconBg
          )}
        >
          <Icon className={cn("size-5", variant.iconColor)} />
        </div>
        {stat.change && (
          <span
            className={cn(
              "text-xs font-bold px-2 py-1 rounded-full",
              stat.trend === "up" && "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/40",
              stat.trend === "down" && "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/40",
              stat.trend === "neutral" && "text-muted-foreground bg-muted"
            )}
          >
            {stat.change}
          </span>
        )}
      </div>

      {/* Label + value */}
      <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
      <p className="text-stat mt-1">{stat.value}</p>
    </div>
  );
}
