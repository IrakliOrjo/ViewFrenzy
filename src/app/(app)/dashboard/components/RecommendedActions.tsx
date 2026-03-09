import { ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import type { IMockActionItem } from "@/types/dashboard";

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-yellow-500",
  low: "bg-green-500",
};

const SOURCE_BADGE: Record<string, string> = {
  Coach: "bg-primary/10 text-primary",
  Goal: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
};

interface RecommendedActionsProps {
  actions: IMockActionItem[];
}

export function RecommendedActions({ actions }: RecommendedActionsProps) {
  return (
    <div className="bg-card p-6 rounded-xl shadow-sm border border-primary/5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="size-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <ListChecks className="size-4 text-primary" />
          </div>
          <h3 className="text-lg font-bold">Recommended Actions</h3>
        </div>
        <button className="text-xs text-primary font-bold hover:underline cursor-pointer">
          View All
        </button>
      </div>

      {/* Action items */}
      <div className="space-y-3">
        {actions.map((action) => (
          <div
            key={action.id}
            className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/20 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={cn(
                  "size-2 rounded-full shrink-0",
                  PRIORITY_DOT[action.priority] ?? PRIORITY_DOT.medium
                )}
              />
              <span className="text-sm font-medium truncate">
                {action.text}
              </span>
            </div>
            <span
              className={cn(
                "px-2 py-0.5 text-[10px] font-bold rounded uppercase shrink-0 ml-3",
                SOURCE_BADGE[action.source] ?? SOURCE_BADGE.Coach
              )}
            >
              {action.source}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
