import Link from "next/link";
import { Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { getIdeasByUser } from "@/lib/domains/idea/idea.data";
import { Button } from "@/components/ui/button";
import { IdeaCard } from "@/app/(app)/dashboard/content/ideas/components/IdeaCard";

export default async function IdeasPage() {
  const session = await auth();
  const userId = session!.user!.id!; // Layout already enforces auth

  const ideas = await getIdeasByUser(userId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {ideas.length} {ideas.length === 1 ? "idea" : "ideas"}
        </p>
        <Button asChild size="sm">
          <Link href="/dashboard/content/ideas/new">
            <Plus className="size-4 mr-1.5" />
            New Idea
          </Link>
        </Button>
      </div>

      {ideas.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground">No ideas yet</p>
          <p className="mt-1 text-sm text-muted-foreground/70">
            Start brainstorming by creating your first idea.
          </p>
          <Button asChild size="sm" className="mt-4">
            <Link href="/dashboard/content/ideas/new">
              <Plus className="size-4 mr-1.5" />
              New Idea
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
      )}
    </div>
  );
}
