import type { IToolResult, ToolName } from "@/lib/ai-tools";
import {
  createIdeaForUser,
  updateIdeaForUser,
  deleteIdeaForUser,
} from "@/lib/domains/idea/idea.service";
import { getIdeasByUser, getIdeaById } from "@/lib/domains/idea/idea.service";
import {
  createGoalForUser,
  updateGoalForUser,
  deleteGoalForUser,
} from "@/lib/domains/goal/goal.service";
import { getGoalsByUser, getGoalById } from "@/lib/domains/goal/goal.service";
import { updateProfileForUser } from "@/lib/domains/profile/profile.service";
import { getProfile } from "@/lib/domains/profile/profile.service";
import { prisma } from "@/lib/prisma";

// ─── Handler Type ─────────────────────────────────────────────────────────────

type ToolHandler = (
  userId: string,
  conversationId: string,
  args: Record<string, unknown>
) => Promise<IToolResult>;

// ─── Serialization Helper ─────────────────────────────────────────────────────

/** Serialize Prisma objects to plain JS objects, handling BigInt fields. */
function serialize<T>(value: T): Record<string, unknown> {
  return JSON.parse(
    JSON.stringify(value, (_key, val) =>
      typeof val === "bigint" ? val.toString() : val
    )
  ) as Record<string, unknown>;
}

// ─── Handlers ────────────────────────────────────────────────────────────────

const handlers: Record<ToolName, ToolHandler> = {
  // ── Ideas ──────────────────────────────────────────────────────────────────

  create_idea: async (userId, _conversationId, args) => {
    const idea = await createIdeaForUser(userId, {
      title: args.title as string,
    });
    return {
      tool: "create_idea",
      success: true,
      data: { idea: serialize(idea) },
    };
  },

  update_idea: async (userId, _conversationId, args) => {
    const idea = await updateIdeaForUser(userId, args.ideaId as string, {
      title: args.title as string | undefined,
    });
    return {
      tool: "update_idea",
      success: true,
      data: { idea: serialize(idea) },
    };
  },

  delete_idea: async (userId, _conversationId, args) => {
    await deleteIdeaForUser(userId, args.ideaId as string);
    return {
      tool: "delete_idea",
      success: true,
      data: { deletedIdeaId: args.ideaId as string },
    };
  },

  list_ideas: async (userId, _conversationId, _args) => {
    const ideas = await getIdeasByUser(userId);
    return {
      tool: "list_ideas",
      success: true,
      data: { ideas: ideas.map(serialize) },
    };
  },

  get_idea: async (_userId, _conversationId, args) => {
    const idea = await getIdeaById(args.ideaId as string);
    if (!idea) {
      return { tool: "get_idea", success: false, error: "Idea not found" };
    }
    return {
      tool: "get_idea",
      success: true,
      data: { idea: serialize(idea) },
    };
  },

  // ── Goals ──────────────────────────────────────────────────────────────────

  create_goal: async (userId, _conversationId, args) => {
    const goal = await createGoalForUser(userId, {
      title: args.title as string,
      description: args.description as string | undefined,
      targetValue: args.targetValue as number | undefined,
      unit: args.unit as string | undefined,
      deadline: args.deadline ? new Date(args.deadline as string) : undefined,
    });
    return {
      tool: "create_goal",
      success: true,
      data: { goal: serialize(goal) },
    };
  },

  update_goal: async (userId, _conversationId, args) => {
    const goal = await updateGoalForUser(userId, args.goalId as string, {
      title: args.title as string | undefined,
      description: args.description as string | undefined,
      targetValue: args.targetValue as number | undefined,
      currentValue: args.currentValue as number | undefined,
      unit: args.unit as string | undefined,
      deadline: args.deadline ? new Date(args.deadline as string) : undefined,
      completed: args.completed as boolean | undefined,
    });
    return {
      tool: "update_goal",
      success: true,
      data: { goal: serialize(goal) },
    };
  },

  delete_goal: async (userId, _conversationId, args) => {
    await deleteGoalForUser(userId, args.goalId as string);
    return {
      tool: "delete_goal",
      success: true,
      data: { deletedGoalId: args.goalId as string },
    };
  },

  list_goals: async (userId, _conversationId, args) => {
    const allGoals = await getGoalsByUser(userId);
    let filtered = allGoals;
    if (typeof args.completed === "boolean") {
      filtered = allGoals.filter((g) => g.completed === args.completed);
    }
    if (typeof args.limit === "number") {
      filtered = filtered.slice(0, args.limit);
    }
    return {
      tool: "list_goals",
      success: true,
      data: { goals: filtered.map(serialize) },
    };
  },

  get_goal: async (_userId, _conversationId, args) => {
    const goal = await getGoalById(args.goalId as string);
    if (!goal) {
      return { tool: "get_goal", success: false, error: "Goal not found" };
    }
    return {
      tool: "get_goal",
      success: true,
      data: { goal: serialize(goal) },
    };
  },

  // ── Creator Profile ────────────────────────────────────────────────────────

  update_profile: async (userId, _conversationId, args) => {
    const profile = await updateProfileForUser(userId, {
      niche: args.niche as string | undefined,
      contentStyle: args.contentStyle as string | undefined,
      postingFrequency: args.postingFrequency as string | undefined,
    });
    return {
      tool: "update_profile",
      success: true,
      data: { profile: serialize(profile) },
    };
  },

  get_profile: async (userId, _conversationId, _args) => {
    const profile = await getProfile(userId);
    if (!profile) {
      return {
        tool: "get_profile",
        success: true,
        data: { profile: null },
      };
    }
    return {
      tool: "get_profile",
      success: true,
      data: { profile: serialize(profile) },
    };
  },

  // ── Conversations ──────────────────────────────────────────────────────────

  new_conversation: async (userId, conversationId, args) => {
    // Summarize the current conversation before starting a new one
    if (conversationId) {
      const messages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "asc" },
        take: 20,
      });
      if (messages.length > 0) {
        const summary = messages
          .map((m) => `${m.role}: ${m.content.slice(0, 100)}`)
          .join("\n");
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { summary },
        });
      }
    }

    const newConversation = await prisma.conversation.create({
      data: {
        userId,
        title: (args.title as string | undefined) || "New Coaching Session",
      },
    });

    return {
      tool: "new_conversation",
      success: true,
      data: {
        newConversationId: newConversation.id,
        title: newConversation.title,
        createdAt: newConversation.createdAt.toISOString(),
      },
    };
  },

  list_conversations: async (userId, _conversationId, args) => {
    const conversations = await prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: (args.limit as number | undefined) || 10,
      include: { _count: { select: { messages: true } } },
    });

    return {
      tool: "list_conversations",
      success: true,
      data: {
        conversations: conversations.map((c) => ({
          id: c.id,
          title: c.title,
          messageCount: c._count.messages,
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString(),
        })),
      },
    };
  },

  summarize_conversation: async (_userId, conversationId, _args) => {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      take: 20,
    });

    if (messages.length === 0) {
      return {
        tool: "summarize_conversation",
        success: false,
        error: "No messages found in this conversation",
      };
    }

    const summary = messages
      .map((m) => `${m.role}: ${m.content.slice(0, 100)}`)
      .join("\n");

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { summary },
    });

    return {
      tool: "summarize_conversation",
      success: true,
      data: { summary },
    };
  },
};

// ─── Public Executor ─────────────────────────────────────────────────────────

export async function executeToolCall(
  toolName: string,
  userId: string,
  conversationId: string,
  args: Record<string, unknown>
): Promise<IToolResult> {
  const handler = handlers[toolName as ToolName];
  if (!handler) {
    return { tool: toolName, success: false, error: `Unknown tool: ${toolName}` };
  }
  try {
    return await handler(userId, conversationId, args);
  } catch (error) {
    return {
      tool: toolName,
      success: false,
      error: error instanceof Error ? error.message : "Tool execution failed",
    };
  }
}
