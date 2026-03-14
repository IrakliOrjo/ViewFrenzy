"use client";

import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { PLAN_FORMAT_LABELS } from "@/constants/plan";

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/10 text-primary",
  high: "bg-destructive/10 text-destructive",
};
import type { Plan } from "@/generated/prisma/client";

interface BoardCardProps {
  plan: Plan;
}

export function BoardCard({ plan }: BoardCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: plan.id,
    data: { status: plan.status },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md",
        isDragging && "opacity-50 shadow-lg rotate-1"
      )}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 shrink-0 cursor-grab text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity active:cursor-grabbing"
          tabIndex={-1}
        >
          <GripVertical className="size-3.5" />
        </button>
        <div className="min-w-0 flex-1">
          <Link
            href={`/dashboard/content/plans/${plan.id}`}
            className="text-sm font-medium hover:text-primary transition-colors line-clamp-2"
          >
            {plan.title || "Untitled"}
          </Link>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
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
          <p className="text-[10px] text-muted-foreground/60 mt-1.5" suppressHydrationWarning>
            {formatDistanceToNow(plan.updatedAt, { addSuffix: true })}
          </p>
        </div>
      </div>
    </div>
  );
}
