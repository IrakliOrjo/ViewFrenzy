"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createGoalAction,
  updateGoalAction,
  deleteGoalAction,
} from "@/app/(app)/dashboard/actions/goal-actions";
import type { Goal } from "@/generated/prisma/client";

interface GoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: Goal | null;
}

export function GoalDialog({ open, onOpenChange, goal }: GoalDialogProps) {
  const isEdit = !!goal;
  const [title, setTitle] = useState(goal?.title ?? "");
  const [targetValue, setTargetValue] = useState(goal?.targetValue?.toString() ?? "");
  const [unit, setUnit] = useState(goal?.unit ?? "");
  const [deadline, setDeadline] = useState(
    goal?.deadline ? goal.deadline.toISOString().split("T")[0] : ""
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const result = isEdit
      ? await updateGoalAction(goal.id, {
          title,
          targetValue: Number(targetValue),
          unit,
          deadline: deadline || null,
        })
      : await createGoalAction({
          title,
          targetValue: Number(targetValue),
          unit,
          deadline: deadline || undefined,
        });

    setLoading(false);

    if (!result.success) {
      toast.error(result.error ?? "Failed to save goal");
      return;
    }

    onOpenChange(false);
  }

  async function handleDelete() {
    if (!goal) return;
    setLoading(true);
    const result = await deleteGoalAction(goal.id);
    setLoading(false);

    if (!result.success) {
      toast.error(result.error ?? "Failed to delete goal");
      return;
    }

    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Goal" : "Add Goal"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Reach 500 Subscribers"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetValue">Target Value</Label>
              <Input
                id="targetValue"
                type="number"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="500"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="subscribers"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline (optional)</Label>
            <Input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
          <DialogFooter className="flex justify-between">
            {isEdit && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                Delete
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEdit ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
