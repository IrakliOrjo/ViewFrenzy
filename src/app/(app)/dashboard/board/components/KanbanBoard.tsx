"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BoardColumn } from "@/app/(app)/dashboard/board/components/BoardColumn";
import { BoardCard } from "@/app/(app)/dashboard/board/components/BoardCard";
import { AddPlansPicker } from "@/app/(app)/dashboard/board/components/AddPlansPicker";
import { updatePlanStatusAction } from "@/app/(app)/dashboard/content/plans/actions";
import type { Plan } from "@/generated/prisma/client";
import { BOARD_LIMIT } from "@/constants/plan";
import type { IGroupedPlans } from "@/app/(app)/dashboard/board/page";

const STATUSES = ["idea", "planning", "in_progress", "published"] as const;

interface KanbanBoardProps {
  initialPlans: IGroupedPlans;
  offBoardPlans?: Plan[];
  boardCount: number;
}

export function KanbanBoard({ initialPlans, offBoardPlans = [], boardCount }: KanbanBoardProps) {
  const [groups, setGroups] = useState<IGroupedPlans>(initialPlans);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const dragOriginalStatus = useRef<string | null>(null);
  const lastGoodState = useRef<IGroupedPlans>(initialPlans);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const allPlans = STATUSES.flatMap((s) => groups[s]);
  const activePlan = activeId ? allPlans.find((p) => p.id === activeId) : null;
  const totalPlans = allPlans.length;

  const findPlanStatus = useCallback(
    (planId: string): string | null => {
      for (const status of STATUSES) {
        if (groups[status].some((p) => p.id === planId)) return status;
      }
      return null;
    },
    [groups]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const id = event.active.id as string;
    setActiveId(id);
    dragOriginalStatus.current = findPlanStatus(id);
  }, [findPlanStatus]);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeStatus = findPlanStatus(active.id as string);
      let overStatus: string | null = null;

      if (STATUSES.includes(over.id as (typeof STATUSES)[number])) {
        overStatus = over.id as string;
      } else {
        overStatus = findPlanStatus(over.id as string);
      }

      if (!activeStatus || !overStatus || activeStatus === overStatus) return;

      setGroups((prev) => {
        const plan = prev[activeStatus as keyof IGroupedPlans].find(
          (p) => p.id === active.id
        );
        if (!plan) return prev;

        return {
          ...prev,
          [activeStatus]: prev[activeStatus as keyof IGroupedPlans].filter(
            (p) => p.id !== active.id
          ),
          [overStatus]: [
            { ...plan, status: overStatus },
            ...prev[overStatus as keyof IGroupedPlans],
          ],
        };
      });
    },
    [findPlanStatus]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active } = event;
      setActiveId(null);

      const newStatus = findPlanStatus(active.id as string);
      const originalStatus = dragOriginalStatus.current;
      dragOriginalStatus.current = null;

      if (!newStatus || !originalStatus || newStatus === originalStatus) return;

      setIsSaving(true);
      const result = await updatePlanStatusAction(active.id as string, newStatus);
      setIsSaving(false);

      if (result.success) {
        setGroups((currentGroups) => {
          lastGoodState.current = { ...currentGroups };
          return currentGroups;
        });
      } else {
        toast.error(result.error ?? "Failed to update status");
        setGroups(lastGoodState.current);
      }
    },
    [findPlanStatus]
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setGroups(lastGoodState.current);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">
            {totalPlans} / {BOARD_LIMIT} plans on board
          </p>
          {isSaving && (
            <span className="text-xs text-muted-foreground animate-pulse">
              Saving...
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <AddPlansPicker offBoardPlans={offBoardPlans} boardCount={totalPlans} />
          <Button asChild size="sm">
            <Link href="/dashboard/content/plans/new">
              <Plus className="size-4 mr-1.5" />
              New Plan
            </Link>
          </Button>
        </div>
      </div>

      {totalPlans === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground">No plans on the board</p>
          <p className="mt-1 text-sm text-muted-foreground/70">
            Add plans from the Content tab or create a new one.
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
            {STATUSES.map((status) => (
              <BoardColumn
                key={status}
                status={status}
                plans={groups[status]}
              />
            ))}
          </div>

          <DragOverlay>
            {activePlan ? (
              <div className="rotate-2 shadow-xl">
                <BoardCard plan={activePlan} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
