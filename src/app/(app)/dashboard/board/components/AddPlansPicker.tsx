"use client";

import { useState, useEffect, useTransition } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { togglePlanOnBoardAction } from "@/app/(app)/dashboard/content/plans/actions";
import { BOARD_LIMIT } from "@/constants/plan";
import type { Plan } from "@/generated/prisma/client";

interface AddPlansPickerProps {
  offBoardPlans: Plan[];
  boardCount: number;
}

export function AddPlansPicker({ offBoardPlans, boardCount }: AddPlansPickerProps) {
  const atLimit = boardCount >= BOARD_LIMIT;
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [localPlans, setLocalPlans] = useState(offBoardPlans);

  useEffect(() => {
    setLocalPlans(offBoardPlans);
  }, [offBoardPlans]);

  const filtered = localPlans.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = (planId: string) => {
    setLocalPlans((prev) => prev.filter((p) => p.id !== planId));
    startTransition(async () => {
      const result = await togglePlanOnBoardAction(planId, true);
      if (result.success) {
        toast.success("Plan added to board");
      } else {
        toast.error(result.error ?? "Failed to add plan");
        setLocalPlans(offBoardPlans);
      }
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="size-4 mr-1.5" />
          Add Plans
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="end">
        <div className="space-y-3">
          {atLimit && (
            <p className="text-xs text-destructive text-center py-1">
              Board is full ({BOARD_LIMIT} / {BOARD_LIMIT})
            </p>
          )}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search plans..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>
          <div className="max-h-[240px] overflow-y-auto space-y-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                {localPlans.length === 0
                  ? "All plans are on the board"
                  : "No matching plans"}
              </p>
            ) : (
              filtered.map((plan) => (
                <div
                  key={plan.id}
                  className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-accent"
                >
                  <span className="text-sm truncate">{plan.title}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 size-6"
                    onClick={() => handleAdd(plan.id)}
                    disabled={isPending || atLimit}
                  >
                    <Plus className="size-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
