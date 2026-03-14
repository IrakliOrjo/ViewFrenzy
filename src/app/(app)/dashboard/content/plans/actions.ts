"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  createPlan as createPlanData,
  updatePlan as updatePlanData,
  updatePlanStatus as updatePlanStatusData,
  togglePlanOnBoard as togglePlanOnBoardData,
  deletePlan as deletePlanData,
  getPlanById,
  countBoardPlans,
} from "@/lib/domains/plan/plan.data";
import { BOARD_LIMIT } from "@/constants/plan";
import type { Prisma } from "@/generated/prisma/client";

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

function revalidatePlanPaths() {
  revalidatePath("/dashboard/content/plans");
  revalidatePath("/dashboard/board");
}

export async function createPlanAction(
  title: string,
  content?: Prisma.InputJsonValue
) {
  try {
    const userId = await getUserId();
    const plan = await createPlanData(userId, { title, content });
    revalidatePath("/dashboard/content/plans");
    return { success: true, data: { id: plan.id } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create plan",
    };
  }
}

export async function updatePlanAction(
  id: string,
  data: {
    title?: string;
    content?: Prisma.InputJsonValue;
    format?: string | null;
    priority?: string | null;
  }
) {
  try {
    const userId = await getUserId();
    const plan = await getPlanById(id);
    if (!plan || plan.userId !== userId) {
      return { success: false, error: "Plan not found" };
    }
    await updatePlanData(id, data);
    revalidatePlanPaths();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update plan",
    };
  }
}

export async function updatePlanStatusAction(id: string, status: string) {
  try {
    const userId = await getUserId();
    const plan = await getPlanById(id);
    if (!plan || plan.userId !== userId) {
      return { success: false, error: "Plan not found" };
    }
    await updatePlanStatusData(id, status);
    revalidatePlanPaths();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update status",
    };
  }
}

export async function togglePlanOnBoardAction(id: string, onBoard: boolean) {
  try {
    const userId = await getUserId();
    const plan = await getPlanById(id);
    if (!plan || plan.userId !== userId) {
      return { success: false, error: "Plan not found" };
    }

    if (onBoard) {
      const count = await countBoardPlans(userId);
      if (count >= BOARD_LIMIT) {
        return { success: false, error: `Board is full (max ${BOARD_LIMIT} plans)` };
      }
    }

    await togglePlanOnBoardData(id, onBoard);
    revalidatePlanPaths();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to toggle board",
    };
  }
}

export async function deletePlanAction(id: string) {
  try {
    const userId = await getUserId();
    const plan = await getPlanById(id);
    if (!plan || plan.userId !== userId) {
      return { success: false, error: "Plan not found" };
    }
    await deletePlanData(id);
    revalidatePlanPaths();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete plan",
    };
  }
}
