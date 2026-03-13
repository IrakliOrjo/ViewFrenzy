import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPlanById } from "@/lib/domains/plan/plan.data";
import { PlanEditor } from "@/app/(app)/dashboard/content/plans/components/PlanEditor";

interface PlanPageProps {
  params: Promise<{ id: string }>;
}

export default async function PlanPage({ params }: PlanPageProps) {
  const session = await auth();
  const userId = session!.user!.id!;

  const { id } = await params;
  const plan = await getPlanById(id);

  if (!plan || plan.userId !== userId) {
    notFound();
  }

  return (
    <PlanEditor
      id={plan.id}
      initialTitle={plan.title}
      initialContent={plan.content as Record<string, unknown> | undefined}
      initialStatus={plan.status}
      initialFormat={plan.format}
      initialPriority={plan.priority}
      initialOnBoard={plan.onBoard}
    />
  );
}
