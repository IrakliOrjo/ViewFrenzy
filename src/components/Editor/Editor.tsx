"use client";

import { useRef, useCallback } from "react";
import {
  EditorRoot,
  EditorContent,
  type JSONContent,
  type EditorInstance,
} from "novel";
import { defaultExtensions } from "@/components/Editor/extensions";
import { SlashCommands } from "@/components/Editor/SlashCommands";
import { BubbleToolbar } from "@/components/Editor/BubbleToolbar";
import { cn } from "@/lib/utils";

interface EditorProps {
  initialContent?: JSONContent;
  onSave?: (content: JSONContent) => void;
  className?: string;
}

export function Editor({ initialContent, onSave, className }: EditorProps) {
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedSave = useCallback(
    (editor: EditorInstance) => {
      if (!onSave) return;

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      debounceTimer.current = setTimeout(() => {
        const json = JSON.parse(JSON.stringify(editor.getJSON()));
        onSave(json);
      }, 2000);
    },
    [onSave]
  );

  const handleBlur = useCallback(
    (editor: EditorInstance) => {
      if (!onSave) return;

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
      const json = JSON.parse(JSON.stringify(editor.getJSON()));
      onSave(json);
    },
    [onSave]
  );

  return (
    <EditorRoot>
      <EditorContent
        initialContent={initialContent}
        extensions={defaultExtensions}
        onUpdate={({ editor }) => debouncedSave(editor)}
        onBlur={({ editor }) => handleBlur(editor)}
        className={cn(
          "editor-content max-w-none",
          "[&_.ProseMirror]:min-h-[200px] [&_.ProseMirror]:outline-none [&_.ProseMirror]:px-1",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0",
          className
        )}
      >
        <SlashCommands />
        <BubbleToolbar />
      </EditorContent>
    </EditorRoot>
  );
}
