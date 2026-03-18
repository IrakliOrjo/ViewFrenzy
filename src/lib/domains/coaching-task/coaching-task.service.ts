import {
  getTopTasks,
  getAllPendingTasks,
  getCompletedTasks,
  completeTask,
  dismissTask,
  createCoachingTask,
  getTaskById,
  expireStaleTasks,
} from "@/lib/domains/coaching-task/coaching-task.data";
import type { ICreateCoachingTaskInput } from "@/lib/domains/coaching-task/coaching-task.data";
import { withCacheInvalidation } from "@/lib/domains/shared/with-cache-invalidation";

export async function getTopTasksForUser(userId: string, limit: number) {
  return getTopTasks(userId, limit);
}

export async function getAllPendingTasksForUser(userId: string) {
  return getAllPendingTasks(userId);
}

export async function getCompletedTasksForUser(userId: string, sinceDays: number) {
  return getCompletedTasks(userId, sinceDays);
}

export async function completeTaskForUser(userId: string, taskId: string) {
  const task = await getTaskById(taskId);
  if (!task || task.userId !== userId) {
    throw new Error("Task not found");
  }
  return withCacheInvalidation(userId, () => completeTask(taskId));
}

export async function dismissTaskForUser(userId: string, taskId: string) {
  const task = await getTaskById(taskId);
  if (!task || task.userId !== userId) {
    throw new Error("Task not found");
  }
  return withCacheInvalidation(userId, () => dismissTask(taskId));
}

export async function createTaskForUser(userId: string, data: ICreateCoachingTaskInput) {
  return withCacheInvalidation(userId, () => createCoachingTask(userId, data));
}

export async function expireStaleTasksForUser(userId: string) {
  return expireStaleTasks(userId);
}
