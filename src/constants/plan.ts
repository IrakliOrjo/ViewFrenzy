export enum PlanStatus {
  IDEA = "idea",
  PLANNING = "planning",
  IN_PROGRESS = "in_progress",
  PUBLISHED = "published",
}

export enum PlanPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export enum PlanFormat {
  LONG_FORM = "long-form",
  SHORT = "short",
  TUTORIAL = "tutorial",
  STREAM = "stream",
  CHALLENGE = "challenge",
}

export const PLAN_STATUS_OPTIONS = [
  { value: PlanStatus.IDEA, label: "Idea" },
  { value: PlanStatus.PLANNING, label: "Planning" },
  { value: PlanStatus.IN_PROGRESS, label: "In Progress" },
  { value: PlanStatus.PUBLISHED, label: "Published" },
] as const;

export const PLAN_PRIORITY_OPTIONS = [
  { value: PlanPriority.LOW, label: "Low" },
  { value: PlanPriority.MEDIUM, label: "Medium" },
  { value: PlanPriority.HIGH, label: "High" },
] as const;

export const PLAN_FORMAT_OPTIONS = [
  { value: PlanFormat.LONG_FORM, label: "Long-form" },
  { value: PlanFormat.SHORT, label: "Short" },
  { value: PlanFormat.TUTORIAL, label: "Tutorial" },
  { value: PlanFormat.STREAM, label: "Stream" },
  { value: PlanFormat.CHALLENGE, label: "Challenge" },
] as const;

export const PLAN_FORMAT_LABELS: Record<string, string> = Object.fromEntries(
  PLAN_FORMAT_OPTIONS.map((o) => [o.value, o.label])
);

export const BOARD_LIMIT = 20;
