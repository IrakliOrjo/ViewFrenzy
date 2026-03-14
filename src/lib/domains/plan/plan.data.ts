import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export interface ICreatePlanInput {
  title: string;
  content?: Prisma.InputJsonValue;
  sourceIdeaId?: string;
}

export interface IUpdatePlanInput {
  title?: string;
  content?: Prisma.InputJsonValue;
  format?: string | null;
  priority?: string | null;
  onBoard?: boolean;
}

export async function createPlan(userId: string, data: ICreatePlanInput) {
  return prisma.plan.create({ data: { userId, ...data } });
}

export async function updatePlan(planId: string, data: IUpdatePlanInput) {
  return prisma.plan.update({ where: { id: planId }, data });
}

export async function updatePlanStatus(planId: string, status: string) {
  const data: Prisma.PlanUpdateInput = { status };
  if (status === "published") {
    data.publishDate = new Date();
  }
  return prisma.plan.update({ where: { id: planId }, data });
}

export async function togglePlanOnBoard(planId: string, onBoard: boolean) {
  return prisma.plan.update({ where: { id: planId }, data: { onBoard } });
}

export async function deletePlan(planId: string) {
  return prisma.plan.delete({ where: { id: planId } });
}

export async function getPlansByUser(userId: string) {
  return prisma.plan.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getPlanById(planId: string) {
  return prisma.plan.findUnique({ where: { id: planId } });
}

export async function getBoardPlans(userId: string) {
  return prisma.plan.findMany({
    where: { userId, onBoard: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function countBoardPlans(userId: string) {
  return prisma.plan.count({ where: { userId, onBoard: true } });
}
