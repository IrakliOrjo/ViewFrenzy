"use client";

import { ArrowLeft, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { type JSONContent } from "novel";
import { Button } from "@/components/ui/button";
import { LazyEditor as Editor } from "@/components/Editor/LazyEditor";
import { PlanMetadataBar } from "@/app/(app)/dashboard/content/plans/components/PlanMetadataBar";
import { usePlanEditor } from "@/app/(app)/dashboard/content/plans/hooks/usePlanEditor";

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
  const {
    title,
    format,
    priority,
    onBoard,
    status,
    isPending,
    handleTitleChange,
    handleEditorSave,
    handleFormatChange,
    handlePriorityChange,
    handleOnBoardChange,
    handleStatusChange,
    handleManualSave,
    handleDelete,
  } = usePlanEditor({
    id,
    initialTitle,
    initialStatus,
    initialFormat,
    initialPriority,
    initialOnBoard,
  });

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
