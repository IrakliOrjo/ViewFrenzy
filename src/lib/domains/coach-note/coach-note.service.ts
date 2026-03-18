import {
  getCurrentNote,
  createCoachNote,
} from "@/lib/domains/coach-note/coach-note.data";
import type { ICreateCoachNoteInput } from "@/lib/domains/coach-note/coach-note.data";
import { withCacheInvalidation } from "@/lib/domains/shared/with-cache-invalidation";

export async function getCurrentNoteForUser(userId: string) {
  return getCurrentNote(userId);
}

export async function createNoteForUser(userId: string, data: ICreateCoachNoteInput) {
  return withCacheInvalidation(userId, () => createCoachNote(userId, data));
}
