import { auth } from "@/lib/auth";
import { getBoardPlans, getPlansByUser } from "@/lib/domains/plan/plan.data";
import { KanbanBoard } from "@/app/(app)/dashboard/board/components/KanbanBoard";
import type { Plan } from "@/generated/prisma/client";

export interface IGroupedPlans {
  idea: Plan[];
  planning: Plan[];
  in_progress: Plan[];
  published: Plan[];
}

const STATUSES = ["idea", "planning", "in_progress", "published"] as const;

export default async function BoardPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const [boardPlans, allPlans] = await Promise.all([
    getBoardPlans(userId),
    getPlansByUser(userId),
  ]);

  const grouped = boardPlans.reduce<IGroupedPlans>(
    (acc, plan) => {
      const status = plan.status as (typeof STATUSES)[number];
      if (status in acc) acc[status].push(plan);
      return acc;
    },
    { idea: [], planning: [], in_progress: [], published: [] }
  );

  const offBoardPlans = allPlans.filter((p) => !p.onBoard);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Board</h1>
        <p className="mt-1 text-muted-foreground">
          Your content pipeline at a glance.
        </p>
      </div>
      <KanbanBoard initialPlans={grouped} offBoardPlans={offBoardPlans} boardCount={boardPlans.length} />
    </div>
  );
}
