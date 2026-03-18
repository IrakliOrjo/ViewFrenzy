"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { completeTaskAction, dismissTaskAction } from "@/app/(app)/dashboard/actions/coaching-task-actions";
import type { CoachingTask } from "@/generated/prisma/client";

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-red-500 shadow-red-500/40",
  medium: "bg-yellow-500 shadow-yellow-500/40",
  low: "bg-green-500 shadow-green-500/40",
};

const SOURCE_BADGE: Record<string, string> = {
  ai: "bg-primary/10 text-primary",
  system: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  chat: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
};

const SOURCE_LABELS: Record<string, string> = {
  ai: "AI",
  system: "System",
  chat: "Chat",
};

function formatAge(date: Date): string {
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

interface TaskItemProps {
  task: CoachingTask;
  showActions?: boolean;
}

export function TaskItem({ task, showActions = true }: TaskItemProps) {
  const [isPending, startTransition] = useTransition();

  function handleAction(action: (id: string) => Promise<{ success: boolean; error?: string }>) {
    startTransition(async () => {
      const result = await action(task.id);
      if (!result.success) {
        toast.error(result.error ?? "Action failed");
      }
    });
  }

  return (
    <div className={cn(
      "flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/20 transition-all duration-200",
      isPending && "opacity-50 pointer-events-none"
    )}>
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={cn(
            "size-2.5 rounded-full shrink-0 shadow-sm",
            PRIORITY_DOT[task.priority] ?? PRIORITY_DOT.medium
          )}
        />
        <div className="min-w-0">
          <span className="text-sm font-medium block truncate">{task.title}</span>
          {task.description && (
            <span className="text-xs text-muted-foreground block mt-0.5 truncate">
              {task.description}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0 ml-4">
        <span
          className={cn(
            "px-2 py-0.5 text-[10px] font-bold rounded uppercase",
            SOURCE_BADGE[task.source] ?? SOURCE_BADGE.ai
          )}
        >
          {SOURCE_LABELS[task.source] ?? task.source}
        </span>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatAge(task.createdAt)}
        </span>
        {showActions && (
          <div className="flex items-center gap-1">
            {isPending ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            ) : (
              <>
                <button
                  onClick={() => handleAction(completeTaskAction)}
                  className="size-7 flex items-center justify-center rounded hover:bg-green-100 dark:hover:bg-green-900/30 text-muted-foreground hover:text-green-600 transition-colors cursor-pointer"
                  title="Complete"
                >
                  <Check className="size-4" />
                </button>
                <button
                  onClick={() => handleAction(dismissTaskAction)}
                  className="size-7 flex items-center justify-center rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
                  title="Dismiss"
                >
                  <X className="size-4" />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
