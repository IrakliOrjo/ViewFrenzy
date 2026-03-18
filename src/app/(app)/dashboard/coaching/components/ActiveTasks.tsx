import { ListChecks } from "lucide-react";
import { TaskItem } from "@/app/(app)/dashboard/coaching/components/TaskItem";
import type { CoachingTask } from "@/generated/prisma/client";

interface ActiveTasksProps {
  tasks: CoachingTask[];
}

export function ActiveTasks({ tasks }: ActiveTasksProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="size-8 bg-primary/10 rounded-lg flex items-center justify-center">
          <ListChecks className="size-4 text-primary" />
        </div>
        <h2 className="text-xl font-bold">Active Tasks</h2>
        <span className="text-sm text-muted-foreground">({tasks.length})</span>
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="bg-card p-8 rounded-xl shadow-sm border border-dashed border-primary/20 text-center">
            <p className="text-sm text-muted-foreground">
              No active tasks. Check back after the daily coaching run.
            </p>
          </div>
        ) : (
          tasks.map((task) => <TaskItem key={task.id} task={task} />)
        )}
      </div>
    </div>
  );
}
