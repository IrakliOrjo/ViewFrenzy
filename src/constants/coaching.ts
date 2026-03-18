export const TASK_PRIORITIES = ["high", "medium", "low"] as const;
export const TASK_STATUSES = ["pending", "in_progress", "completed", "dismissed"] as const;
export const TASK_SOURCES = ["ai", "system", "chat", "user", "challenge"] as const;

export const NOTE_TYPES = ["insight", "skill_tip", "encouragement", "observation"] as const;
export const NOTE_SOURCES = ["daily_cron", "chat"] as const;

export const TASK_EXPIRY_DAYS = 5;
export const TASK_DASHBOARD_LIMIT = 3;
export const COMPLETED_HISTORY_DAYS = 7;
