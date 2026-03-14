"use client";

import Link from "next/link";
import {
  Check,
  Pencil,
  Trash2,
  List,
  Target,
  Lightbulb,
  MessageSquare,
  User,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { IToolResult } from "@/types/chat";

interface ActionCardProps {
  result: IToolResult;
}

interface CardConfig {
  icon: React.ReactNode;
  label: string;
  href?: string;
  viewLabel?: string;
}

function getCardConfig(result: IToolResult): CardConfig {
  const { tool, data } = result;

  switch (tool) {
    case "create_idea":
      return {
        icon: <Lightbulb className="size-3.5" />,
        label: "Idea Created",
        href: "/dashboard/content/ideas",
        viewLabel: "View Ideas",
      };
    case "create_goal":
      return {
        icon: <Target className="size-3.5" />,
        label: "Goal Created",
        href: "/dashboard/goals",
        viewLabel: "View Goals",
      };
    case "update_idea":
      return {
        icon: <Pencil className="size-3.5" />,
        label: "Idea Updated",
        href: "/dashboard/content/ideas",
        viewLabel: "View Ideas",
      };
    case "update_goal":
      return {
        icon: <Pencil className="size-3.5" />,
        label: "Goal Updated",
        href: "/dashboard/goals",
        viewLabel: "View Goals",
      };
    case "update_profile":
      return {
        icon: <User className="size-3.5" />,
        label: "Profile Updated",
        href: "/dashboard/settings",
        viewLabel: "View Settings",
      };
    case "delete_idea":
      return {
        icon: <Trash2 className="size-3.5" />,
        label: "Idea Deleted",
      };
    case "delete_goal":
      return {
        icon: <Trash2 className="size-3.5" />,
        label: "Goal Deleted",
      };
    case "list_ideas":
    case "get_idea":
      return {
        icon: <Lightbulb className="size-3.5" />,
        label: "Ideas",
      };
    case "list_goals":
    case "get_goal":
      return {
        icon: <Target className="size-3.5" />,
        label: "Goals",
      };
    case "list_conversations":
      return {
        icon: <MessageSquare className="size-3.5" />,
        label: "Conversations",
      };
    case "get_profile":
      return {
        icon: <User className="size-3.5" />,
        label: "Profile",
      };
    case "new_conversation":
      return {
        icon: <MessageSquare className="size-3.5" />,
        label: "New Conversation Started",
      };
    case "summarize_conversation":
      return {
        icon: <MessageSquare className="size-3.5" />,
        label: "Conversation Summarized",
      };
    default:
      return {
        icon: <List className="size-3.5" />,
        label: tool.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      };
  }
}

const SKIP_KEYS = new Set(["id", "userId", "channelId", "conversationId", "createdAt", "updatedAt", "linkedVideoId", "calendarEventId"]);
const LABEL_MAP: Record<string, string> = {
  title: "Title",
  description: "Description",
  status: "Status",
  priority: "Priority",
  deadline: "Deadline",
  targetValue: "Target",
  currentValue: "Current",
  unit: "Unit",
  niche: "Niche",
  contentStyle: "Style",
  postingFrequency: "Posting",
  messageCount: "Messages",
  name: "Name",
  format: "Format",
  notes: "Notes",
  summary: "Summary",
};

function renderObjectFields(obj: Record<string, unknown>): React.ReactNode {
  const entries = Object.entries(obj)
    .filter(([key, value]) => !SKIP_KEYS.has(key) && value !== null && value !== undefined && value !== "")
    .slice(0, 4);

  if (entries.length === 0) return null;

  return (
    <dl className="space-y-0.5">
      {entries.map(([key, value]) => {
        let displayValue = String(value);
        if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
          displayValue = new Date(value).toLocaleDateString();
        }
        // Truncate long values
        if (displayValue.length > 60) {
          displayValue = displayValue.slice(0, 57) + "...";
        }
        const label = LABEL_MAP[key] ?? key;
        return (
          <div key={key} className="flex gap-1.5 text-xs">
            <dt className="text-muted-foreground shrink-0">{label}:</dt>
            <dd className="text-foreground truncate font-medium">{displayValue}</dd>
          </div>
        );
      })}
    </dl>
  );
}

function renderListItems(items: Record<string, unknown>[]): React.ReactNode {
  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground">No items found.</p>;
  }
  return (
    <ul className="space-y-0.5">
      {items.slice(0, 5).map((item, i) => (
        <li key={i} className="text-xs text-muted-foreground truncate">
          • {String(item.title ?? item.name ?? item.id ?? `Item ${i + 1}`)}
        </li>
      ))}
      {items.length > 5 && (
        <li className="text-xs text-muted-foreground">+ {items.length - 5} more</li>
      )}
    </ul>
  );
}

function renderDataFields(data: Record<string, unknown>): React.ReactNode {
  // Tool handlers return: { idea: {...} }, { ideas: [...] }, { goals: [...] }, etc.
  // Find the first meaningful value
  for (const value of Object.values(data)) {
    if (Array.isArray(value)) {
      return renderListItems(value as Record<string, unknown>[]);
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return renderObjectFields(value as Record<string, unknown>);
    }
  }

  // Fallback: render top-level fields directly
  return renderObjectFields(data);
}

export function ActionCard({ result }: ActionCardProps) {
  const isError = !result.success;
  const config = getCardConfig(result);

  const isDeleteOp = result.tool.startsWith("delete_");
  const isConversationOp =
    result.tool === "new_conversation" || result.tool === "summarize_conversation";

  return (
    <div
      className={cn(
        "mt-2 rounded-xl border px-3 py-2.5 text-sm",
        isError
          ? "border-destructive/30 bg-destructive/10"
          : "border-border bg-background/60"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center gap-1.5 font-medium text-xs",
          isError ? "text-destructive" : isDeleteOp ? "text-muted-foreground" : "text-primary"
        )}
      >
        {isError ? <AlertCircle className="size-3.5" /> : config.icon}
        <span>{isError ? "Action Failed" : config.label}</span>
        {result.success && !isError && !isDeleteOp && !isConversationOp && (
          <Check className="size-3 ml-auto text-primary/60" />
        )}
      </div>

      {/* Body */}
      <div className="mt-1.5">
        {isError ? (
          <p className="text-xs text-destructive/80">{result.error ?? "An unknown error occurred."}</p>
        ) : isConversationOp ? (
          <p className="text-xs text-muted-foreground">Done.</p>
        ) : result.data ? (
          renderDataFields(result.data)
        ) : null}
      </div>

      {/* Footer button */}
      {!isError && config.href && (
        <div className="mt-2">
          <Link
            href={config.href}
            className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
          >
            {config.viewLabel ?? "View"}
          </Link>
        </div>
      )}

      {/* Disabled undo placeholder for delete ops */}
      {!isError && isDeleteOp && (
        <div className="mt-2">
          <button
            disabled
            className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground cursor-not-allowed opacity-50"
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
}
