"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  createGoalForUser,
  updateGoalForUser,
  deleteGoalForUser,
} from "@/lib/domains/goal/goal.service";
import { getGoalById } from "@/lib/domains/goal/goal.data";

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

export async function createGoalAction(data: {
  title: string;
  targetValue: number;
  unit: string;
  deadline?: string;
}) {
  try {
    const userId = await getUserId();
    const goal = await createGoalForUser(userId, {
      title: data.title,
      targetValue: data.targetValue,
      currentValue: 0,
      unit: data.unit,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
    });
    revalidatePath("/dashboard/overview");
    revalidatePath("/dashboard/coaching");
    return { success: true, data: { id: goal.id } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create goal",
    };
  }
}

export async function updateGoalAction(
  id: string,
  data: {
    title?: string;
    targetValue?: number;
    unit?: string;
    deadline?: string | null;
  }
) {
  try {
    const userId = await getUserId();
    const goal = await getGoalById(id);
    if (!goal || goal.userId !== userId) {
      return { success: false, error: "Goal not found" };
    }
    await updateGoalForUser(userId, id, {
      title: data.title,
      targetValue: data.targetValue,
      unit: data.unit,
      deadline: data.deadline === null ? null : data.deadline ? new Date(data.deadline) : undefined,
    });
    revalidatePath("/dashboard/overview");
    revalidatePath("/dashboard/coaching");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update goal",
    };
  }
}

export async function deleteGoalAction(id: string) {
  try {
    const userId = await getUserId();
    const goal = await getGoalById(id);
    if (!goal || goal.userId !== userId) {
      return { success: false, error: "Goal not found" };
    }
    await deleteGoalForUser(userId, id);
    revalidatePath("/dashboard/overview");
    revalidatePath("/dashboard/coaching");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete goal",
    };
  }
}
