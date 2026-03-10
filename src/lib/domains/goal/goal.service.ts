import {
  createGoal,
  updateGoal,
  deleteGoal,
  getGoalsByUser,
  getGoalById,
} from "@/lib/domains/goal/goal.data";
import type { ICreateGoalInput, IUpdateGoalInput } from "@/lib/domains/goal/goal.data";
import { withCacheInvalidation } from "@/lib/domains/shared/with-cache-invalidation";

export async function createGoalForUser(userId: string, data: ICreateGoalInput) {
  return withCacheInvalidation(userId, () => createGoal(userId, data));
}

export async function updateGoalForUser(userId: string, goalId: string, data: IUpdateGoalInput) {
  return withCacheInvalidation(userId, () => updateGoal(goalId, data));
}

export async function deleteGoalForUser(userId: string, goalId: string) {
  return withCacheInvalidation(userId, () => deleteGoal(goalId));
}

export { getGoalsByUser, getGoalById };
