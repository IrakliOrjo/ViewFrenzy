import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";

export interface IUpdateProfileInput {
  niche?: string;
  contentStyle?: string;
  postingFrequency?: string;
  onboardingAnswers?: Prisma.InputJsonValue;
  onboardingNotes?: string;
}

export async function upsertProfile(userId: string, data: IUpdateProfileInput) {
  return prisma.creatorProfile.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });
}

export async function getProfile(userId: string) {
  return prisma.creatorProfile.findUnique({ where: { userId } });
}
