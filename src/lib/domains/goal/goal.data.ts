import { prisma } from "@/lib/prisma";

export interface ICreateGoalInput {
  title: string;
  description?: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  deadline?: Date;
}

export interface IUpdateGoalInput {
  title?: string;
  description?: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  deadline?: Date;
  completed?: boolean;
}

export async function createGoal(userId: string, data: ICreateGoalInput) {
  return prisma.goal.create({ data: { userId, ...data } });
}

export async function updateGoal(goalId: string, data: IUpdateGoalInput) {
  return prisma.goal.update({ where: { id: goalId }, data });
}

export async function deleteGoal(goalId: string) {
  return prisma.goal.delete({ where: { id: goalId } });
}

export async function getGoalsByUser(userId: string) {
  return prisma.goal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getGoalById(goalId: string) {
  return prisma.goal.findUnique({ where: { id: goalId } });
}
