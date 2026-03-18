import type {
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_SOURCES,
  NOTE_TYPES,
  NOTE_SOURCES,
} from "@/constants/coaching";

export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskSource = (typeof TASK_SOURCES)[number];
export type NoteType = (typeof NOTE_TYPES)[number];
export type NoteSource = (typeof NOTE_SOURCES)[number];

export interface ICoachNote {
  id: string;
  userId: string;
  message: string;
  type: NoteType;
  source: NoteSource;
  createdAt: Date;
}

export interface ICoachingTask {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  xpReward: number;
  priority: TaskPriority;
  status: TaskStatus;
  source: TaskSource;
  sourceDetail: string | null;
  challengeId: string | null;
  dayNumber: number | null;
  completedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
