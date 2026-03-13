import Link from "next/link";
import { Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { getPlansByUser } from "@/lib/domains/plan/plan.data";
import { Button } from "@/components/ui/button";
import { PlanCard } from "@/app/(app)/dashboard/content/plans/components/PlanCard";

export default async function PlansPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const plans = await getPlansByUser(userId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {plans.length} {plans.length === 1 ? "plan" : "plans"}
        </p>
        <Button asChild size="sm">
          <Link href="/dashboard/content/plans/new">
            <Plus className="size-4 mr-1.5" />
            New Plan
          </Link>
        </Button>
      </div>

      {plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground">No plans yet</p>
          <p className="mt-1 text-sm text-muted-foreground/70">
            Create a plan or promote an idea to get started.
          </p>
          <Button asChild size="sm" className="mt-4">
            <Link href="/dashboard/content/plans/new">
              <Plus className="size-4 mr-1.5" />
              New Plan
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}
    </div>
  );
}
