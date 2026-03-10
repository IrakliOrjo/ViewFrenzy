import {
  createIdea,
  updateIdea,
  deleteIdea,
  getIdeasByUser,
  getIdeaById,
} from "@/lib/domains/idea/idea.data";
import type { ICreateIdeaInput, IUpdateIdeaInput } from "@/lib/domains/idea/idea.data";
import { withCacheInvalidation } from "@/lib/domains/shared/with-cache-invalidation";

export async function createIdeaForUser(userId: string, data: ICreateIdeaInput) {
  return withCacheInvalidation(userId, () => createIdea(userId, data));
}

export async function updateIdeaForUser(userId: string, ideaId: string, data: IUpdateIdeaInput) {
  return withCacheInvalidation(userId, () => updateIdea(ideaId, data));
}

export async function deleteIdeaForUser(userId: string, ideaId: string) {
  return withCacheInvalidation(userId, () => deleteIdea(ideaId));
}

export { getIdeasByUser, getIdeaById };
