import { invalidateCreatorCache } from "@/lib/ai-context";

export async function withCacheInvalidation<T>(
  userId: string,
  mutation: () => Promise<T>
): Promise<T> {
  const result = await mutation();
  invalidateCreatorCache(userId);
  return result;
}
