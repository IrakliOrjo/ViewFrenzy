"use client";

import Link from "next/link";
import { Kanban, KanbanSquareDashed } from "lucide-react";
import { useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { extractPlainText } from "@/helpers/extractPlainText";
import { formatDistanceToNow } from "date-fns";
import { togglePlanOnBoardAction } from "@/app/(app)/dashboard/content/plans/actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PLAN_FORMAT_LABELS } from "@/constants/plan";

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/10 text-primary",
  high: "bg-destructive/10 text-destructive",
};
import type { Plan } from "@/generated/prisma/client";

interface PlanCardProps {
  plan: Plan;
}

export function PlanCard({ plan }: PlanCardProps) {
  const preview = extractPlainText(plan.content);
  const [isPending, startTransition] = useTransition();

  const handleToggleBoard = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      const result = await togglePlanOnBoardAction(plan.id, !plan.onBoard);
      if (result.success) {
        toast.success(plan.onBoard ? "Removed from board" : "Added to board");
      } else {
        toast.error(result.error ?? "Failed to update");
      }
    });
  };

  return (
    <Link href={`/dashboard/content/plans/${plan.id}`}>
      <Card className="group transition-colors hover:border-primary/30 hover:shadow-sm cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base font-semibold line-clamp-2 group-hover:text-primary transition-colors">
              {plan.title || "Untitled"}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "shrink-0 size-7",
                plan.onBoard
                  ? "text-primary hover:text-primary"
                  : "text-muted-foreground"
              )}
              onClick={handleToggleBoard}
              disabled={isPending}
              title={plan.onBoard ? "Remove from board" : "Add to board"}
            >
              {plan.onBoard ? (
                <Kanban className="size-3.5" />
              ) : (
                <KanbanSquareDashed className="size-3.5" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1.5 mb-2">
            {plan.priority && (
              <span
                className={cn(
                  "text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize",
                  PRIORITY_STYLES[plan.priority] ?? PRIORITY_STYLES.medium
                )}
              >
                {plan.priority}
              </span>
            )}
            {plan.format && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground">
                {PLAN_FORMAT_LABELS[plan.format] ?? plan.format}
              </span>
            )}
          </div>
          {preview && (
            <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
              {preview}
            </p>
          )}
          <p className="text-xs text-muted-foreground/60" suppressHydrationWarning>
            {formatDistanceToNow(plan.updatedAt, { addSuffix: true })}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
