import { Type, type FunctionDeclaration } from "@google/genai";

// ─── Shared Types ────────────────────────────────────────────────────────────

export interface IToolResult {
  tool: string;
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

export type ToolName =
  | "create_idea"
  | "update_idea"
  | "delete_idea"
  | "list_ideas"
  | "get_idea"
  | "create_goal"
  | "update_goal"
  | "delete_goal"
  | "list_goals"
  | "get_goal"
  | "update_profile"
  | "get_profile"
  | "new_conversation"
  | "list_conversations"
  | "summarize_conversation";

// ─── Tool Declarations ───────────────────────────────────────────────────────

export const toolDeclarations: FunctionDeclaration[] = [
  // ── Ideas ──────────────────────────────────────────────────────────────────

  {
    name: "create_idea",
    description:
      "Create a new video idea and add it to the creator's content pipeline. Use this when the creator asks to save, record, or add a video idea, topic, or concept they want to make.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: "The title or name of the video idea.",
        },
        description: {
          type: Type.STRING,
          description:
            "Optional longer description, angle, or notes about the idea.",
        },
        format: {
          type: Type.STRING,
          description: "The video format.",
          format: "enum",
          enum: ["short", "long", "shorts", "live", "podcast"],
        },
        priority: {
          type: Type.STRING,
          description: "How urgently the creator wants to make this video.",
          format: "enum",
          enum: ["low", "medium", "high"],
        },
        status: {
          type: Type.STRING,
          description:
            "The current status of the idea in the pipeline. Defaults to 'idea'.",
          format: "enum",
          enum: ["idea", "planned", "filming", "editing", "published"],
        },
      },
      required: ["title"],
    },
  },

  {
    name: "update_idea",
    description:
      "Update an existing video idea in the creator's content pipeline. Use this when the creator wants to edit, modify, change the status of, or add notes to an existing idea.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        ideaId: {
          type: Type.STRING,
          description: "The unique ID of the idea to update.",
        },
        title: {
          type: Type.STRING,
          description: "Updated title for the idea.",
        },
        description: {
          type: Type.STRING,
          description: "Updated description or angle for the idea.",
        },
        format: {
          type: Type.STRING,
          description: "Updated video format.",
          format: "enum",
          enum: ["short", "long", "shorts", "live", "podcast"],
        },
        priority: {
          type: Type.STRING,
          description: "Updated priority level.",
          format: "enum",
          enum: ["low", "medium", "high"],
        },
        status: {
          type: Type.STRING,
          description: "Updated pipeline status of the idea.",
          format: "enum",
          enum: ["idea", "planned", "filming", "editing", "published"],
        },
        notes: {
          type: Type.STRING,
          description: "Additional notes or research to attach to the idea.",
        },
      },
      required: ["ideaId"],
    },
  },

  {
    name: "delete_idea",
    description:
      "Permanently delete a video idea from the creator's content pipeline. Use this only when the creator explicitly asks to remove or delete a specific idea.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        ideaId: {
          type: Type.STRING,
          description: "The unique ID of the idea to delete.",
        },
      },
      required: ["ideaId"],
    },
  },

  {
    name: "list_ideas",
    description:
      "Retrieve a list of the creator's video ideas from their content pipeline. Use this when the creator asks to see, browse, or review their ideas, or when you need to reference existing ideas during coaching.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        status: {
          type: Type.STRING,
          description: "Filter ideas by pipeline status.",
          format: "enum",
          enum: ["idea", "planned", "filming", "editing", "published"],
        },
        priority: {
          type: Type.STRING,
          description: "Filter ideas by priority level.",
          format: "enum",
          enum: ["low", "medium", "high"],
        },
        format: {
          type: Type.STRING,
          description: "Filter ideas by video format.",
          format: "enum",
          enum: ["short", "long", "shorts", "live", "podcast"],
        },
      },
      required: [],
    },
  },

  {
    name: "get_idea",
    description:
      "Retrieve the full details of a single video idea by its ID. Use this when the creator asks about a specific idea or when you need detailed information about one particular idea.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        ideaId: {
          type: Type.STRING,
          description: "The unique ID of the idea to retrieve.",
        },
      },
      required: ["ideaId"],
    },
  },

  // ── Goals ──────────────────────────────────────────────────────────────────

  {
    name: "create_goal",
    description:
      "Create a new growth goal for the creator's YouTube channel. Use this when the creator sets a target — such as reaching a subscriber milestone, achieving a view count, or improving upload consistency.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description:
            "Short title describing the goal (e.g., 'Reach 1,000 subscribers').",
        },
        description: {
          type: Type.STRING,
          description:
            "Optional longer description of what the goal means or how the creator plans to achieve it.",
        },
        targetValue: {
          type: Type.NUMBER,
          description:
            "The numeric target to reach (e.g., 1000 for 1,000 subscribers).",
        },
        unit: {
          type: Type.STRING,
          description:
            "The unit of measurement for the target (e.g., 'subscribers', 'views', 'videos per month').",
        },
        deadline: {
          type: Type.STRING,
          description:
            "Optional target completion date in ISO 8601 format (e.g., '2026-06-30').",
        },
      },
      required: ["title"],
    },
  },

  {
    name: "update_goal",
    description:
      "Update an existing channel growth goal. Use this to record progress toward a goal, change a deadline, mark a goal complete, or edit the goal's details.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        goalId: {
          type: Type.STRING,
          description: "The unique ID of the goal to update.",
        },
        title: {
          type: Type.STRING,
          description: "Updated title for the goal.",
        },
        description: {
          type: Type.STRING,
          description: "Updated description for the goal.",
        },
        targetValue: {
          type: Type.NUMBER,
          description: "Updated numeric target.",
        },
        currentValue: {
          type: Type.NUMBER,
          description:
            "The creator's current progress toward the target (e.g., current subscriber count).",
        },
        unit: {
          type: Type.STRING,
          description: "Updated unit of measurement.",
        },
        deadline: {
          type: Type.STRING,
          description: "Updated deadline in ISO 8601 format.",
        },
        completed: {
          type: Type.BOOLEAN,
          description:
            "Set to true to mark the goal as completed, false to reopen it.",
        },
      },
      required: ["goalId"],
    },
  },

  {
    name: "delete_goal",
    description:
      "Permanently delete a channel growth goal. Use this only when the creator explicitly asks to remove or cancel a specific goal.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        goalId: {
          type: Type.STRING,
          description: "The unique ID of the goal to delete.",
        },
      },
      required: ["goalId"],
    },
  },

  {
    name: "list_goals",
    description:
      "Retrieve the creator's channel growth goals. Use this when the creator wants to review their goals, or when coaching advice should be grounded in what the creator is actively working toward.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        completed: {
          type: Type.BOOLEAN,
          description:
            "If true, return only completed goals. If false, return only active goals. Omit to return all goals.",
        },
        limit: {
          type: Type.NUMBER,
          description: "Maximum number of goals to return.",
        },
      },
      required: [],
    },
  },

  {
    name: "get_goal",
    description:
      "Retrieve the full details of a single growth goal by its ID. Use this when the creator asks about a specific goal or when detailed goal information is needed for coaching.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        goalId: {
          type: Type.STRING,
          description: "The unique ID of the goal to retrieve.",
        },
      },
      required: ["goalId"],
    },
  },

  // ── Creator Profile ────────────────────────────────────────────────────────

  {
    name: "update_profile",
    description:
      "Update the creator's profile information used to personalize coaching. Use this when the creator shares or updates details about their niche, content style, or how often they upload.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        niche: {
          type: Type.STRING,
          description:
            "The creator's content niche or topic area (e.g., 'personal finance', 'cooking', 'gaming').",
        },
        contentStyle: {
          type: Type.STRING,
          description:
            "The creator's typical content style or tone (e.g., 'educational', 'entertaining', 'vlog-style').",
        },
        postingFrequency: {
          type: Type.STRING,
          description:
            "How often the creator uploads (e.g., 'weekly', 'twice a week', 'daily').",
        },
      },
      required: [],
    },
  },

  {
    name: "get_profile",
    description:
      "Retrieve the creator's current profile information including their niche, content style, and posting frequency. Use this when you need to reference or confirm the creator's profile details.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
      required: [],
    },
  },

  // ── Conversations ──────────────────────────────────────────────────────────

  {
    name: "new_conversation",
    description:
      "Start a fresh coaching conversation, clearing the current chat context. Use this when the creator wants to begin a new topic or session separate from the current conversation.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description:
            "Optional title for the new conversation (e.g., 'Q2 Growth Strategy').",
        },
      },
      required: [],
    },
  },

  {
    name: "list_conversations",
    description:
      "Retrieve a list of the creator's past coaching conversations. Use this when the creator wants to revisit or reference a previous session.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        limit: {
          type: Type.NUMBER,
          description: "Maximum number of past conversations to return.",
        },
      },
      required: [],
    },
  },

  {
    name: "summarize_conversation",
    description:
      "Generate and save a summary of the current coaching conversation. Use this when the conversation is getting long, when the creator asks for a recap, or to preserve key decisions before starting a new topic.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
      required: [],
    },
  },
];
