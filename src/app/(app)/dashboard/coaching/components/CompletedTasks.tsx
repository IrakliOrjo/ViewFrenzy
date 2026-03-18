"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskItem } from "@/app/(app)/dashboard/coaching/components/TaskItem";
import type { CoachingTask } from "@/generated/prisma/client";

interface CompletedTasksProps {
  tasks: CoachingTask[];
}

export function CompletedTasks({ tasks }: CompletedTasksProps) {
  const [expanded, setExpanded] = useState(false);

  if (tasks.length === 0) return null;

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 mb-4 cursor-pointer group"
      >
        <div className="size-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
          <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-xl font-bold group-hover:text-primary transition-colors">
          Completed
        </h2>
        <span className="text-sm text-muted-foreground">({tasks.length})</span>
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground transition-transform duration-200",
            expanded && "rotate-180"
          )}
        />
      </button>

      {expanded && (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="opacity-60">
              <TaskItem task={task} showActions={false} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
