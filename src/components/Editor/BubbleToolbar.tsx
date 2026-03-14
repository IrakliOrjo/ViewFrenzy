"use client";

import { EditorBubble, EditorBubbleItem, useEditor } from "novel";
import { Bold, Italic, Underline, Strikethrough, Code, Link } from "lucide-react";
import { cn } from "@/lib/utils";

function ToolbarButton({
  children,
  isActive,
  onSelect,
}: {
  children: React.ReactNode;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <EditorBubbleItem onSelect={onSelect}>
      <button
        type="button"
        className={cn(
          "rounded-md p-1.5 transition-colors",
          isActive
            ? "bg-primary/15 text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
      >
        {children}
      </button>
    </EditorBubbleItem>
  );
}

export function BubbleToolbar() {
  const { editor } = useEditor();

  if (!editor) return null;

  return (
    <EditorBubble className="flex items-center gap-0.5 rounded-xl border border-border bg-background p-1 shadow-xl">
      <ToolbarButton
        isActive={editor.isActive("bold")}
        onSelect={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        isActive={editor.isActive("italic")}
        onSelect={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        isActive={editor.isActive("underline")}
        onSelect={() => editor.chain().focus().toggleUnderline().run()}
      >
        <Underline className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        isActive={editor.isActive("strike")}
        onSelect={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        isActive={editor.isActive("code")}
        onSelect={() => editor.chain().focus().toggleCode().run()}
      >
        <Code className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        isActive={editor.isActive("link")}
        onSelect={() => {
          const url = editor.getAttributes("link").href as string | undefined;
          if (url) {
            editor.chain().focus().unsetLink().run();
          } else {
            const href = window.prompt("Enter URL:");
            if (href) {
              editor.chain().focus().setLink({ href }).run();
            }
          }
        }}
      >
        <Link className="size-4" />
      </ToolbarButton>
    </EditorBubble>
  );
}
