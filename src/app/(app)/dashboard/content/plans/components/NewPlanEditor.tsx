"use client";

import { useState, useCallback, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { type JSONContent } from "novel";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LazyEditor as Editor } from "@/components/Editor/LazyEditor";
import { createPlanAction } from "@/app/(app)/dashboard/content/plans/actions";

export function NewPlanEditor() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<JSONContent | undefined>();
  const contentRef = useRef<JSONContent | undefined>(undefined);
  const [isPending, startTransition] = useTransition();

  const handleSave = useCallback(() => {
    if (!title.trim()) {
      toast.error("Please add a title before saving.");
      return;
    }

    startTransition(async () => {
      const result = await createPlanAction(title.trim(), contentRef.current ?? content);
      if (result.success && result.data) {
        toast.success("Plan created");
        router.replace(`/dashboard/content/plans/${result.data.id}`);
      } else {
        toast.error(result.error ?? "Failed to create plan");
      }
    });
  }, [title, content, router]);

  const handleEditorSave = useCallback((json: JSONContent) => {
    setContent(json);
    contentRef.current = json;
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href="/dashboard/content/plans">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h2 className="text-lg font-semibold">New Plan</h2>
        <div className="ml-auto">
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            <Save className="size-4 mr-1.5" />
            {isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <input
          type="text"
          placeholder="Untitled plan"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-3xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/40"
        />
        <Editor onSave={handleEditorSave} />
      </div>
    </div>
  );
}
