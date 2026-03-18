"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { ListChecks, Check, X, Loader2 } from "lucide-react";
import Link from "next/link";
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

function TaskActionButtons({ taskId }: { taskId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleAction(action: (id: string) => Promise<{ success: boolean; error?: string }>) {
    startTransition(async () => {
      const result = await action(taskId);
      if (!result.success) {
        toast.error(result.error ?? "Action failed");
      }
    });
  }

  if (isPending) {
    return <Loader2 className="size-4 animate-spin text-muted-foreground" />;
  }

  return (
    <>
      <button
        onClick={() => handleAction(completeTaskAction)}
        className="size-6 flex items-center justify-center rounded hover:bg-green-100 dark:hover:bg-green-900/30 text-muted-foreground hover:text-green-600 transition-colors cursor-pointer"
        title="Complete"
      >
        <Check className="size-3.5" />
      </button>
      <button
        onClick={() => handleAction(dismissTaskAction)}
        className="size-6 flex items-center justify-center rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
        title="Dismiss"
      >
        <X className="size-3.5" />
      </button>
    </>
  );
}

interface RecommendedActionsProps {
  tasks: CoachingTask[];
}

export function RecommendedActions({ tasks }: RecommendedActionsProps) {
  return (
    <div className="bg-card p-6 rounded-xl shadow-sm border border-primary/5 transition-all duration-300 hover:shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="size-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <ListChecks className="size-4 text-primary" />
          </div>
          <h3 className="text-lg font-bold">Recommended Actions</h3>
        </div>
        <Link
          href="/dashboard/coaching"
          className="text-xs text-primary font-bold hover:underline"
        >
          View All
        </Link>
      </div>

      {/* Task items */}
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No tasks yet. Check back after the daily coaching run.
          </p>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/20 transition-all duration-200"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    "size-2 rounded-full shrink-0 shadow-sm",
                    PRIORITY_DOT[task.priority] ?? PRIORITY_DOT.medium
                  )}
                />
                <span className="text-sm font-medium truncate">
                  {task.title}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <span
                  className={cn(
                    "px-2 py-0.5 text-[10px] font-bold rounded uppercase",
                    SOURCE_BADGE[task.source] ?? SOURCE_BADGE.ai
                  )}
                >
                  {SOURCE_LABELS[task.source] ?? task.source}
                </span>
                <TaskActionButtons taskId={task.id} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
