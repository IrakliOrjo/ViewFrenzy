"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  completeTaskForUser,
  dismissTaskForUser,
} from "@/lib/domains/coaching-task/coaching-task.service";

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

export async function completeTaskAction(taskId: string) {
  try {
    const userId = await getUserId();
    await completeTaskForUser(userId, taskId);
    revalidatePath("/dashboard/overview");
    revalidatePath("/dashboard/coaching");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to complete task",
    };
  }
}

export async function dismissTaskAction(taskId: string) {
  try {
    const userId = await getUserId();
    await dismissTaskForUser(userId, taskId);
    revalidatePath("/dashboard/overview");
    revalidatePath("/dashboard/coaching");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to dismiss task",
    };
  }
}
