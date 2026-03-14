"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  createIdea as createIdeaData,
  updateIdea as updateIdeaData,
  deleteIdea as deleteIdeaData,
  getIdeaById,
} from "@/lib/domains/idea/idea.data";
import { createPlan } from "@/lib/domains/plan/plan.data";
import type { Prisma } from "@/generated/prisma/client";

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

export async function createIdeaAction(
  title: string,
  content?: Prisma.InputJsonValue
) {
  try {
    const userId = await getUserId();
    const idea = await createIdeaData(userId, { title, content });
    revalidatePath("/dashboard/content/ideas");
    return { success: true, data: { id: idea.id } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create idea",
    };
  }
}

export async function updateIdeaAction(
  id: string,
  data: { title?: string; content?: Prisma.InputJsonValue }
) {
  try {
    const userId = await getUserId();
    const idea = await getIdeaById(id);
    if (!idea || idea.userId !== userId) {
      return { success: false, error: "Idea not found" };
    }
    await updateIdeaData(id, data);
    revalidatePath("/dashboard/content/ideas");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update idea",
    };
  }
}

export async function deleteIdeaAction(id: string) {
  try {
    const userId = await getUserId();
    const idea = await getIdeaById(id);
    if (!idea || idea.userId !== userId) {
      return { success: false, error: "Idea not found" };
    }

    // Clear sourceIdeaId on any plans that reference this idea
    const { prisma } = await import("@/lib/prisma");
    await prisma.plan.updateMany({
      where: { sourceIdeaId: id },
      data: { sourceIdeaId: null },
    });

    await deleteIdeaData(id);
    revalidatePath("/dashboard/content/ideas");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete idea",
    };
  }
}

export async function promoteIdeaToPlanAction(id: string) {
  try {
    const userId = await getUserId();
    const idea = await getIdeaById(id);
    if (!idea || idea.userId !== userId) {
      return { success: false, error: "Idea not found" };
    }

    // Create plan with copied content
    const plan = await createPlan(userId, {
      title: idea.title,
      content: idea.content as Prisma.InputJsonValue | undefined,
      sourceIdeaId: idea.id,
    });

    // Archive the idea
    await updateIdeaData(id, { status: "archived" });

    revalidatePath("/dashboard/content/ideas");
    revalidatePath("/dashboard/content/plans");
    return { success: true, data: { planId: plan.id } };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to promote idea",
    };
  }
}
