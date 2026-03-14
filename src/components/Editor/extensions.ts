import {
  StarterKit,
  TiptapLink,
  TiptapUnderline,
  Placeholder,
  HorizontalRule,
  TaskList,
  TaskItem,
  CustomKeymap,
  Command,
  renderItems,
} from "novel";
import { suggestionItems } from "@/components/Editor/SlashCommands";

export const defaultExtensions = [
  StarterKit.configure({
    bulletList: {
      HTMLAttributes: { class: "list-disc list-outside ml-4 leading-3" },
    },
    orderedList: {
      HTMLAttributes: { class: "list-decimal list-outside ml-4 leading-3" },
    },
    listItem: {
      HTMLAttributes: { class: "leading-normal" },
    },
    blockquote: {
      HTMLAttributes: { class: "border-l-4 border-primary/30 pl-4" },
    },
    codeBlock: {
      HTMLAttributes: {
        class: "rounded-lg bg-muted p-4 font-mono text-sm",
      },
    },
    code: {
      HTMLAttributes: {
        class: "rounded bg-muted px-1.5 py-0.5 font-mono text-sm",
      },
    },
    horizontalRule: false,
    dropcursor: {
      color: "hsl(var(--primary))",
      width: 2,
    },
  }),
  HorizontalRule.configure({
    HTMLAttributes: { class: "my-4 border-t border-border" },
  }),
  TiptapLink.configure({
    HTMLAttributes: {
      class: "text-primary underline underline-offset-4 cursor-pointer",
    },
    openOnClick: false,
  }),
  TiptapUnderline,
  TaskList.configure({
    HTMLAttributes: { class: "not-prose" },
  }),
  TaskItem.configure({
    HTMLAttributes: { class: "flex items-start gap-2" },
    nested: true,
  }),
  Placeholder.configure({
    placeholder: "Start writing, or type / for commands...",
  }),
  CustomKeymap,
  Command.configure({
    suggestion: {
      items: () => suggestionItems,
      render: renderItems,
    },
  }),
];
