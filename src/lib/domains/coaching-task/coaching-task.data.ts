import { prisma } from "@/lib/prisma";
import { TASK_EXPIRY_DAYS } from "@/constants/coaching";
import type { TaskPriority, TaskSource } from "@/types/coaching";

export interface ICreateCoachingTaskInput {
  title: string;
  description?: string;
  priority: TaskPriority;
  source: TaskSource;
  sourceDetail?: string;
  xpReward?: number;
  expiresAt?: Date;
}

export async function getAllPendingTasks(userId: string) {
  const tasks = await prisma.coachingTask.findMany({
    where: { userId, status: "pending" },
    orderBy: { createdAt: "asc" },
  });

  // Prisma doesn't support CASE-based ordering, so we sort in app
  const priorityOrder: Record<string, number> = { high: 1, medium: 2, low: 3 };
  tasks.sort((a, b) => {
    const pa = priorityOrder[a.priority] ?? 2;
    const pb = priorityOrder[b.priority] ?? 2;
    if (pa !== pb) return pa - pb;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  return tasks;
}

export async function getTopTasks(userId: string, limit: number) {
  const tasks = await getAllPendingTasks(userId);
  return tasks.slice(0, limit);
}

export async function getCompletedTasks(userId: string, sinceDays: number) {
  const since = new Date();
  since.setDate(since.getDate() - sinceDays);

  return prisma.coachingTask.findMany({
    where: {
      userId,
      status: "completed",
      completedAt: { gte: since },
    },
    orderBy: { completedAt: "desc" },
  });
}

export async function completeTask(taskId: string) {
  return prisma.coachingTask.update({
    where: { id: taskId },
    data: { status: "completed", completedAt: new Date() },
  });
}

export async function dismissTask(taskId: string) {
  return prisma.coachingTask.update({
    where: { id: taskId },
    data: { status: "dismissed" },
  });
}

export async function createCoachingTask(userId: string, data: ICreateCoachingTaskInput) {
  return prisma.coachingTask.create({
    data: { userId, ...data },
  });
}

export async function getTaskById(taskId: string) {
  return prisma.coachingTask.findUnique({ where: { id: taskId } });
}

export async function hasPendingTaskWithSourceDetail(userId: string, sourceDetail: string) {
  const existing = await prisma.coachingTask.findFirst({
    where: { userId, status: "pending", sourceDetail },
    select: { id: true },
  });
  return existing !== null;
}

export async function expireStaleTasks(userId: string): Promise<number> {
  const now = new Date();
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() - TASK_EXPIRY_DAYS);

  // Dismiss tasks with explicit expiresAt that has passed
  const result1 = await prisma.coachingTask.updateMany({
    where: {
      userId,
      status: "pending",
      expiresAt: { not: null, lt: now },
    },
    data: { status: "dismissed" },
  });

  // Dismiss tasks with no expiresAt that are older than 5 days
  const result2 = await prisma.coachingTask.updateMany({
    where: {
      userId,
      status: "pending",
      expiresAt: null,
      createdAt: { lt: expiryDate },
    },
    data: { status: "dismissed" },
  });

  return result1.count + result2.count;
}
