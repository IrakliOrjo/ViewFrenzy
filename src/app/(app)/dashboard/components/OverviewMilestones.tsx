"use client";

import { useState } from "react";
import { MilestoneProgress } from "@/app/(app)/dashboard/components/MilestoneProgress";
import { GoalDialog } from "@/app/(app)/dashboard/components/GoalDialog";
import type { Goal } from "@/generated/prisma/client";

interface OverviewMilestonesProps {
  goals: Goal[];
}

export function OverviewMilestones({ goals }: OverviewMilestonesProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  function handleAddGoal() {
    setEditingGoal(null);
    setDialogOpen(true);
  }

  function handleEditGoal(goal: Goal) {
    setEditingGoal(goal);
    setDialogOpen(true);
  }

  return (
    <>
      <MilestoneProgress
        goals={goals}
        onAddGoal={handleAddGoal}
        onEditGoal={handleEditGoal}
      />
      <GoalDialog
        key={editingGoal?.id ?? `new-${dialogOpen}`}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        goal={editingGoal}
      />
    </>
  );
}
