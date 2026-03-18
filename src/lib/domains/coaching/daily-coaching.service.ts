import { prisma } from "@/lib/prisma";
import { runSystemRules } from "@/lib/domains/coaching/system-rules";
import { createCoachNote } from "@/lib/domains/coach-note/coach-note.data";
import { createCoachingTask, expireStaleTasks, getAllPendingTasks } from "@/lib/domains/coaching-task/coaching-task.data";
import { buildCreatorContext } from "@/lib/ai-context";
import type { TaskPriority } from "@/types/coaching";
import type { NoteType } from "@/types/coaching";

interface IDailyCoachingResult {
  userId: string;
  systemTasksCreated: number;
  aiNoteCreated: boolean;
  aiTasksCreated: number;
  tasksExpired: number;
  error?: string;
}

export async function runDailyCoachingForUser(userId: string): Promise<IDailyCoachingResult> {
  const result: IDailyCoachingResult = {
    userId,
    systemTasksCreated: 0,
    aiNoteCreated: false,
    aiTasksCreated: 0,
    tasksExpired: 0,
  };

  // Step 1: System-rule task generation (free, no AI)
  const systemResults = await runSystemRules(userId);
  result.systemTasksCreated = systemResults.length;

  // Step 2: AI generation (one call per user)
  try {
    const aiResult = await generateAICoaching(userId);
    result.aiNoteCreated = aiResult.noteCreated;
    result.aiTasksCreated = aiResult.tasksCreated;
  } catch (error) {
    result.error = error instanceof Error ? error.message : "AI generation failed";
  }

  // Step 3: Expiry cleanup
  result.tasksExpired = await expireStaleTasks(userId);

  return result;
}

async function generateAICoaching(userId: string): Promise<{ noteCreated: boolean; tasksCreated: number }> {
  const [creatorContext, pendingTasks] = await Promise.all([
    buildCreatorContext(userId),
    getAllPendingTasks(userId),
  ]);

  const pendingTaskTitles = pendingTasks.map((t) => `- ${t.title}`).join("\n");

  const prompt = `You are the ViewFrenzy coaching engine. Based on the creator's current data, generate personalized coaching content.

## Creator Context
${creatorContext}

## Existing Pending Tasks (do NOT duplicate these)
${pendingTaskTitles || "No pending tasks."}

## Instructions
Respond with ONLY a JSON object (no markdown, no code fences) in this exact format:
{
  "note": {
    "message": "A personalized tip or insight based on the creator's data",
    "type": "insight | skill_tip | encouragement | observation"
  },
  "tasks": [
    {
      "title": "A specific, actionable task",
      "priority": "high | medium | low"
    }
  ]
}

Rules:
- Generate exactly 1 note and 1-2 tasks
- Tasks must be specific and actionable (not vague like "improve your content")
- Do not duplicate any existing pending tasks
- Base advice on actual data patterns when possible
- Note type should match the content: "insight" for data observations, "skill_tip" for technique advice, "encouragement" for motivational messages, "observation" for behavioral patterns`;

  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic();

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("AI response contained no text content");
  }

  let parsed: { note: { message: string; type: string }; tasks: { title: string; priority: string }[] };
  try {
    parsed = JSON.parse(textBlock.text);
  } catch {
    throw new Error(`Failed to parse AI coaching response: ${textBlock.text.substring(0, 200)}`);
  }

  // Save note
  const validNoteTypes = ["insight", "skill_tip", "encouragement", "observation"];
  const noteType = validNoteTypes.includes(parsed.note.type) ? parsed.note.type : "insight";

  await createCoachNote(userId, {
    message: parsed.note.message,
    type: noteType as NoteType,
    source: "daily_cron",
  });

  // Save tasks
  const validPriorities = ["high", "medium", "low"];
  let tasksCreated = 0;
  for (const task of parsed.tasks.slice(0, 2)) {
    const priority = validPriorities.includes(task.priority) ? task.priority : "medium";
    await createCoachingTask(userId, {
      title: task.title,
      priority: priority as TaskPriority,
      source: "ai",
    });
    tasksCreated++;
  }

  return { noteCreated: true, tasksCreated };
}

export async function getActiveUsers(): Promise<string[]> {
  const users = await prisma.channel.findMany({
    select: { userId: true },
  });
  return users.map((u) => u.userId);
}
