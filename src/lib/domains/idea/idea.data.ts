import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export interface ICreateIdeaInput {
  title: string;
  content?: Prisma.InputJsonValue;
}

export interface IUpdateIdeaInput {
  title?: string;
  content?: Prisma.InputJsonValue;
  status?: string;
}

export async function createIdea(userId: string, data: ICreateIdeaInput) {
  return prisma.idea.create({ data: { userId, ...data } });
}

export async function updateIdea(ideaId: string, data: IUpdateIdeaInput) {
  return prisma.idea.update({ where: { id: ideaId }, data });
}

export async function deleteIdea(ideaId: string) {
  return prisma.idea.delete({ where: { id: ideaId } });
}

export async function getIdeasByUser(userId: string) {
  return prisma.idea.findMany({
    where: { userId, status: { not: "archived" } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getIdeaById(ideaId: string) {
  return prisma.idea.findUnique({ where: { id: ideaId } });
}
