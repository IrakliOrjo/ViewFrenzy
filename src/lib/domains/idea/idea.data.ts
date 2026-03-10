import { prisma } from "@/lib/prisma";

export interface ICreateIdeaInput {
  title: string;
  description?: string;
  status?: string;
  format?: string;
  priority?: string;
  notes?: string;
  scheduledDate?: Date;
  linkedVideoId?: string;
}

export interface IUpdateIdeaInput {
  title?: string;
  description?: string;
  status?: string;
  format?: string;
  priority?: string;
  notes?: string;
  scheduledDate?: Date;
  publishDate?: Date;
  linkedVideoId?: string;
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
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getIdeaById(ideaId: string) {
  return prisma.idea.findUnique({ where: { id: ideaId } });
}
