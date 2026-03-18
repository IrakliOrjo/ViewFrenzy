import { prisma } from "@/lib/prisma";
import { hasPendingTaskWithSourceDetail, createCoachingTask } from "@/lib/domains/coaching-task/coaching-task.data";
import type { TaskPriority } from "@/types/coaching";

interface ISystemRuleResult {
  rule: string;
  created: boolean;
}

export async function runSystemRules(userId: string): Promise<ISystemRuleResult[]> {
  const results: ISystemRuleResult[] = [];

  results.push(await checkUploadGap(userId));
  results.push(...await checkGoalDeadlines(userId));
  results.push(...await checkGoalNearComplete(userId));
  results.push(...await checkStalePlans(userId));
  results.push(await checkIdleIdeas(userId));

  return results.filter((r) => r.created);
}

async function checkUploadGap(userId: string): Promise<ISystemRuleResult> {
  const sourceDetail = "upload_gap";

  if (await hasPendingTaskWithSourceDetail(userId, sourceDetail)) {
    return { rule: "upload_gap", created: false };
  }

  const channel = await prisma.channel.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!channel) return { rule: "upload_gap", created: false };

  const latestVideo = await prisma.video.findFirst({
    where: { channelId: channel.id },
    orderBy: { publishedAt: "desc" },
    select: { publishedAt: true },
  });

  if (!latestVideo) return { rule: "upload_gap", created: false };

  const daysSinceUpload = Math.floor(
    (Date.now() - latestVideo.publishedAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceUpload < 4) return { rule: "upload_gap", created: false };

  const priority: TaskPriority = daysSinceUpload >= 7 ? "high" : "medium";

  await createCoachingTask(userId, {
    title: `It's been ${daysSinceUpload} days since your last upload`,
    priority,
    source: "system",
    sourceDetail,
  });

  return { rule: "upload_gap", created: true };
}

async function checkGoalDeadlines(userId: string): Promise<ISystemRuleResult[]> {
  const results: ISystemRuleResult[] = [];
  const now = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const goals = await prisma.goal.findMany({
    where: {
      userId,
      completed: false,
      deadline: { not: null, lte: sevenDaysFromNow, gt: now },
    },
  });

  for (const goal of goals) {
    const sourceDetail = `goal_deadline:${goal.id}`;

    if (await hasPendingTaskWithSourceDetail(userId, sourceDetail)) {
      results.push({ rule: "goal_deadline", created: false });
      continue;
    }

    const daysLeft = Math.ceil(
      (goal.deadline!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    const priority: TaskPriority = daysLeft < 3 ? "high" : "medium";

    let progressText = "";
    if (goal.currentValue !== null && goal.targetValue !== null && goal.targetValue > 0) {
      const pct = Math.round((goal.currentValue / goal.targetValue) * 100);
      progressText = ` — you're at ${pct}%`;
    }

    await createCoachingTask(userId, {
      title: `Your goal "${goal.title}" deadline is in ${daysLeft} day${daysLeft === 1 ? "" : "s"}${progressText}`,
      priority,
      source: "system",
      sourceDetail,
    });

    results.push({ rule: "goal_deadline", created: true });
  }

  return results;
}

async function checkGoalNearComplete(userId: string): Promise<ISystemRuleResult[]> {
  const results: ISystemRuleResult[] = [];

  const goals = await prisma.goal.findMany({
    where: {
      userId,
      completed: false,
      targetValue: { not: null },
      currentValue: { not: null },
    },
  });

  for (const goal of goals) {
    if (goal.targetValue === null || goal.currentValue === null) continue;
    if (goal.currentValue < goal.targetValue * 0.9) continue;

    const sourceDetail = `goal_near_complete:${goal.id}`;
    if (await hasPendingTaskWithSourceDetail(userId, sourceDetail)) {
      results.push({ rule: "goal_near_complete", created: false });
      continue;
    }

    const remaining = Math.ceil(goal.targetValue - goal.currentValue);
    const unit = goal.unit ?? "";

    await createCoachingTask(userId, {
      title: `You're ${remaining} ${unit} away from your goal "${goal.title}" — push for it!`,
      priority: "high",
      source: "system",
      sourceDetail,
    });

    results.push({ rule: "goal_near_complete", created: true });
  }

  return results;
}

async function checkStalePlans(userId: string): Promise<ISystemRuleResult[]> {
  const results: ISystemRuleResult[] = [];
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const stalePlans = await prisma.plan.findMany({
    where: {
      userId,
      status: "in_progress",
      updatedAt: { lt: sevenDaysAgo },
    },
  });

  for (const plan of stalePlans) {
    const sourceDetail = `plan_stale:${plan.id}`;
    if (await hasPendingTaskWithSourceDetail(userId, sourceDetail)) {
      results.push({ rule: "plan_stale", created: false });
      continue;
    }

    const daysSinceUpdate = Math.floor(
      (Date.now() - plan.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    await createCoachingTask(userId, {
      title: `Your plan "${plan.title}" has been in progress for ${daysSinceUpdate} days`,
      priority: "medium",
      source: "system",
      sourceDetail,
    });

    results.push({ rule: "plan_stale", created: true });
  }

  return results;
}

async function checkIdleIdeas(userId: string): Promise<ISystemRuleResult> {
  const sourceDetail = "idle_ideas";

  if (await hasPendingTaskWithSourceDetail(userId, sourceDetail)) {
    return { rule: "idle_ideas", created: false };
  }

  const ideaCount = await prisma.idea.count({
    where: { userId, status: "idea" },
  });

  if (ideaCount < 3) return { rule: "idle_ideas", created: false };

  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const recentPlanFromIdea = await prisma.plan.findFirst({
    where: {
      userId,
      sourceIdeaId: { not: null },
      createdAt: { gte: fourteenDaysAgo },
    },
    select: { id: true },
  });

  if (recentPlanFromIdea) return { rule: "idle_ideas", created: false };

  await createCoachingTask(userId, {
    title: `You have ${ideaCount} ideas waiting — pick one to develop`,
    priority: "low",
    source: "system",
    sourceDetail,
  });

  return { rule: "idle_ideas", created: true };
}
