"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Lightbulb, ClipboardList, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { BoardCard } from "@/app/(app)/dashboard/board/components/BoardCard";
import type { Plan } from "@/generated/prisma/client";
import type { LucideIcon } from "lucide-react";

const COLUMN_CONFIG: Record<
  string,
  { label: string; icon: LucideIcon; color: string }
> = {
  idea: { label: "Idea", icon: Lightbulb, color: "text-yellow-500" },
  planning: { label: "Planning", icon: ClipboardList, color: "text-blue-500" },
  in_progress: { label: "In Progress", icon: Loader2, color: "text-primary" },
  published: {
    label: "Published",
    icon: CheckCircle2,
    color: "text-green-500",
  },
};

interface BoardColumnProps {
  status: string;
  plans: Plan[];
}

export function BoardColumn({ status, plans }: BoardColumnProps) {
  const config = COLUMN_CONFIG[status] ?? COLUMN_CONFIG.idea;
  const Icon = config.icon;

  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 mb-3 px-1">
        <Icon className={cn("size-4", config.color)} />
        <h3 className="text-sm font-semibold">{config.label}</h3>
        <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5 tabular-nums">
          {plans.length}
        </span>
      </div>

      <SortableContext
        items={plans.map((p) => p.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className={cn(
            "flex flex-col gap-2 rounded-xl border border-dashed border-border/50 p-2 min-h-[120px] transition-colors",
            isOver && "border-primary/50 bg-primary/5"
          )}
        >
          {plans.length === 0 ? (
            <div className="flex items-center justify-center h-full min-h-[100px] text-xs text-muted-foreground/50">
              Drop plans here
            </div>
          ) : (
            plans.map((plan) => <BoardCard key={plan.id} plan={plan} />)
          )}
        </div>
      </SortableContext>
    </div>
  );
}
