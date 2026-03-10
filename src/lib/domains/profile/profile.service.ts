import { upsertProfile, getProfile } from "@/lib/domains/profile/profile.data";
import type { IUpdateProfileInput } from "@/lib/domains/profile/profile.data";
import { withCacheInvalidation } from "@/lib/domains/shared/with-cache-invalidation";

export async function updateProfileForUser(userId: string, data: IUpdateProfileInput) {
  return withCacheInvalidation(userId, () => upsertProfile(userId, data));
}

export { getProfile };
