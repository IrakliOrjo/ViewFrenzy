import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getIdeaById } from "@/lib/domains/idea/idea.data";
import { IdeaEditor } from "@/app/(app)/dashboard/content/ideas/components/IdeaEditor";

interface IdeaPageProps {
  params: Promise<{ id: string }>;
}

export default async function IdeaPage({ params }: IdeaPageProps) {
  const session = await auth();
  const userId = session!.user!.id!; // Layout already enforces auth

  const { id } = await params;
  const idea = await getIdeaById(id);

  if (!idea || idea.userId !== userId) {
    notFound();
  }

  return (
    <IdeaEditor
      id={idea.id}
      initialTitle={idea.title}
      initialContent={idea.content as Record<string, unknown> | undefined}
    />
  );
}
