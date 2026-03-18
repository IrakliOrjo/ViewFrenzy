import { prisma } from "@/lib/prisma";
import type { NoteType, NoteSource } from "@/types/coaching";

export interface ICreateCoachNoteInput {
  message: string;
  type: NoteType;
  source: NoteSource;
}

export async function getCurrentNote(userId: string) {
  return prisma.coachNote.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createCoachNote(userId: string, data: ICreateCoachNoteInput) {
  return prisma.coachNote.create({
    data: { userId, ...data },
  });
}
