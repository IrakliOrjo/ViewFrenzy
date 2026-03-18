import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCurrentNoteForUser } from "@/lib/domains/coach-note/coach-note.service";
import { getAllPendingTasksForUser, getCompletedTasksForUser } from "@/lib/domains/coaching-task/coaching-task.service";
import { COMPLETED_HISTORY_DAYS } from "@/constants/coaching";
import { CoachNoteCard } from "@/app/(app)/dashboard/coaching/components/CoachNoteCard";
import { ActiveTasks } from "@/app/(app)/dashboard/coaching/components/ActiveTasks";
import { CompletedTasks } from "@/app/(app)/dashboard/coaching/components/CompletedTasks";

export default async function CoachingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [note, pendingTasks, completedTasks] = await Promise.all([
    getCurrentNoteForUser(userId),
    getAllPendingTasksForUser(userId),
    getCompletedTasksForUser(userId, COMPLETED_HISTORY_DAYS),
  ]);

  return (
    <div className="space-y-8">
      <CoachNoteCard note={note} />
      <ActiveTasks tasks={pendingTasks} />
      <CompletedTasks tasks={completedTasks} />
    </div>
  );
}
