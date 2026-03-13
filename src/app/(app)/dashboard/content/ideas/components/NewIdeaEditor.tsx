"use client";

import { useState, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { type JSONContent } from "novel";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";

const Editor = dynamic(() => import("@/components/Editor/Editor").then((m) => m.Editor), {
  ssr: false,
  loading: () => <div className="min-h-[200px] animate-pulse rounded-lg bg-muted" />,
});
import { createIdeaAction } from "@/app/(app)/dashboard/content/ideas/actions";

export function NewIdeaEditor() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<JSONContent | undefined>();
  const [isPending, startTransition] = useTransition();

  const handleSave = useCallback(() => {
    if (!title.trim()) {
      toast.error("Please add a title before saving.");
      return;
    }

    startTransition(async () => {
      const result = await createIdeaAction(title.trim(), content);
      if (result.success && result.data) {
        toast.success("Idea created");
        router.replace(`/dashboard/content/ideas/${result.data.id}`);
      } else {
        toast.error(result.error ?? "Failed to create idea");
      }
    });
  }, [title, content, router]);

  const handleEditorSave = useCallback((json: JSONContent) => {
    setContent(json);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href="/dashboard/content/ideas">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h2 className="text-lg font-semibold">New Idea</h2>
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
          placeholder="Untitled idea"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-3xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/40"
        />
        <Editor onSave={handleEditorSave} />
      </div>
    </div>
  );
}
