"use client";

import { useState, useCallback, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { type JSONContent } from "novel";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LazyEditor as Editor } from "@/components/Editor/LazyEditor";
import { PlanMetadataBar } from "@/app/(app)/dashboard/content/plans/components/PlanMetadataBar";
import {
  updatePlanAction,
  updatePlanStatusAction,
  togglePlanOnBoardAction,
  deletePlanAction,
} from "@/app/(app)/dashboard/content/plans/actions";

interface PlanEditorProps {
  id: string;
  initialTitle: string;
  initialContent?: Record<string, unknown>;
  initialStatus: string;
  initialFormat: string | null;
  initialPriority: string | null;
  initialOnBoard: boolean;
}

export function PlanEditor({
  id,
  initialTitle,
  initialContent,
  initialStatus,
  initialFormat,
  initialPriority,
  initialOnBoard,
}: PlanEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [format, setFormat] = useState(initialFormat);
  const [priority, setPriority] = useState(initialPriority);
  const [onBoard, setOnBoard] = useState(initialOnBoard);
  const [status, setStatus] = useState(initialStatus);
  const [isPending, startTransition] = useTransition();
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const autoSave = useCallback(
    (data: {
      title?: string;
      format?: string | null;
      priority?: string | null;
    }) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        updatePlanAction(id, data);
      }, 2000);
    },
    [id]
  );

  const handleTitleChange = useCallback(
    (newTitle: string) => {
      setTitle(newTitle);
      autoSave({ title: newTitle.trim() });
    },
    [autoSave]
  );

  const handleEditorSave = useCallback(
    (content: JSONContent) => {
      updatePlanAction(id, { content });
    },
    [id]
  );

  const handleFormatChange = useCallback(
    (newFormat: string | null) => {
      setFormat(newFormat);
      autoSave({ format: newFormat });
    },
    [autoSave]
  );

  const handlePriorityChange = useCallback(
    (newPriority: string) => {
      setPriority(newPriority);
      autoSave({ priority: newPriority });
    },
    [autoSave]
  );

  const handleOnBoardChange = useCallback(
    (newOnBoard: boolean) => {
      setOnBoard(newOnBoard);
      startTransition(async () => {
        const result = await togglePlanOnBoardAction(id, newOnBoard);
        if (!result.success) {
          toast.error(result.error ?? "Failed to toggle board");
          setOnBoard(!newOnBoard);
        }
      });
    },
    [id]
  );

  const handleStatusChange = useCallback(
    (newStatus: string) => {
      setStatus((prevStatus) => {
        startTransition(async () => {
          const result = await updatePlanStatusAction(id, newStatus);
          if (result.success) {
            toast.success(`Status updated to ${newStatus.replace("_", " ")}`);
          } else {
            toast.error(result.error ?? "Failed to update status");
            setStatus(prevStatus);
          }
        });
        return newStatus;
      });
    },
    [id]
  );

  const handleManualSave = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    startTransition(async () => {
      const result = await updatePlanAction(id, {
        title: title.trim(),
        format,
        priority,
        onBoard,
      });
      if (result.success) {
        toast.success("Plan saved");
      } else {
        toast.error(result.error ?? "Failed to save");
      }
    });
  }, [id, title, format, priority, onBoard]);

  const handleDelete = useCallback(() => {
    if (!confirm("Delete this plan? This cannot be undone.")) return;

    startTransition(async () => {
      const result = await deletePlanAction(id);
      if (result.success) {
        toast.success("Plan deleted");
        router.push("/dashboard/content/plans");
      } else {
        toast.error(result.error ?? "Failed to delete plan");
      }
    });
  }, [id, router]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href="/dashboard/content/plans">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" onClick={handleManualSave} disabled={isPending}>
            <Save className="size-4 mr-1.5" />
            {isPending ? "Saving..." : "Save"}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={isPending}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <PlanMetadataBar
        status={status}
        format={format}
        priority={priority}
        onBoard={onBoard}
        onStatusChange={handleStatusChange}
        onFormatChange={handleFormatChange}
        onPriorityChange={handlePriorityChange}
        onBoardChange={handleOnBoardChange}
        disabled={isPending}
      />

      <div className="space-y-4">
        <input
          type="text"
          placeholder="Untitled plan"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="w-full text-3xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/40"
        />
        <Editor
          initialContent={initialContent as JSONContent | undefined}
          onSave={handleEditorSave}
        />
      </div>
    </div>
  );
}
