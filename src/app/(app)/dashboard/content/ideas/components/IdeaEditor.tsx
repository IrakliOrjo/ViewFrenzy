"use client";

import { useState, useCallback, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, ArrowUpRight, Trash2 } from "lucide-react";
import Link from "next/link";
import { type JSONContent } from "novel";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";

const Editor = dynamic(() => import("@/components/Editor/Editor").then((m) => m.Editor), {
  ssr: false,
  loading: () => <div className="min-h-[200px] animate-pulse rounded-lg bg-muted" />,
});
import {
  updateIdeaAction,
  deleteIdeaAction,
  promoteIdeaToPlanAction,
} from "@/app/(app)/dashboard/content/ideas/actions";

interface IdeaEditorProps {
  id: string;
  initialTitle: string;
  initialContent?: Record<string, unknown>;
}

export function IdeaEditor({ id, initialTitle, initialContent }: IdeaEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [isPending, startTransition] = useTransition();
  const titleDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTitleChange = useCallback(
    (newTitle: string) => {
      setTitle(newTitle);
      if (titleDebounce.current) clearTimeout(titleDebounce.current);
      titleDebounce.current = setTimeout(() => {
        updateIdeaAction(id, { title: newTitle.trim() });
      }, 2000);
    },
    [id]
  );

  const handleEditorSave = useCallback(
    (content: JSONContent) => {
      updateIdeaAction(id, { content });
    },
    [id]
  );

  const handleManualSave = useCallback(() => {
    if (titleDebounce.current) {
      clearTimeout(titleDebounce.current);
      titleDebounce.current = null;
    }
    startTransition(async () => {
      const result = await updateIdeaAction(id, { title: title.trim() });
      if (result.success) {
        toast.success("Idea saved");
      } else {
        toast.error(result.error ?? "Failed to save");
      }
    });
  }, [id, title]);

  const handlePromote = useCallback(() => {
    startTransition(async () => {
      const result = await promoteIdeaToPlanAction(id);
      if (result.success && result.data) {
        toast.success("Idea promoted to plan");
        router.push(`/dashboard/content/plans/${result.data.planId}`);
      } else {
        toast.error(result.error ?? "Failed to promote idea");
      }
    });
  }, [id, router]);

  const handleDelete = useCallback(() => {
    if (!confirm("Delete this idea? This cannot be undone.")) return;

    startTransition(async () => {
      const result = await deleteIdeaAction(id);
      if (result.success) {
        toast.success("Idea deleted");
        router.push("/dashboard/content/ideas");
      } else {
        toast.error(result.error ?? "Failed to delete idea");
      }
    });
  }, [id, router]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href="/dashboard/content/ideas">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePromote}
            disabled={isPending}
          >
            <ArrowUpRight className="size-4 mr-1.5" />
            Promote to Plan
          </Button>
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

      <div className="space-y-4">
        <input
          type="text"
          placeholder="Untitled idea"
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
