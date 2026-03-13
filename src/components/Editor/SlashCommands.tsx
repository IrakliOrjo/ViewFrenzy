"use client";

import {
  EditorCommand,
  EditorCommandEmpty,
  EditorCommandItem,
  EditorCommandList,
  createSuggestionItems,
} from "novel";
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Text,
  Quote,
  Minus,
  ListTodo,
  Code,
} from "lucide-react";

export const suggestionItems = createSuggestionItems([
  {
    title: "Text",
    description: "Plain text paragraph.",
    searchTerms: ["p", "paragraph"],
    icon: <Text className="size-[18px]" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleNode("paragraph", "paragraph").run();
    },
  },
  {
    title: "Heading 1",
    description: "Large section heading.",
    searchTerms: ["title", "big", "large", "h1"],
    icon: <Heading1 className="size-[18px]" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run();
    },
  },
  {
    title: "Heading 2",
    description: "Medium section heading.",
    searchTerms: ["subtitle", "medium", "h2"],
    icon: <Heading2 className="size-[18px]" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run();
    },
  },
  {
    title: "Heading 3",
    description: "Small section heading.",
    searchTerms: ["subtitle", "small", "h3"],
    icon: <Heading3 className="size-[18px]" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run();
    },
  },
  {
    title: "Bullet List",
    description: "Unordered list of items.",
    searchTerms: ["unordered", "ul"],
    icon: <List className="size-[18px]" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: "Numbered List",
    description: "Ordered list of items.",
    searchTerms: ["ordered", "ol"],
    icon: <ListOrdered className="size-[18px]" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: "To-do List",
    description: "Checklist of tasks.",
    searchTerms: ["todo", "task", "checkbox"],
    icon: <ListTodo className="size-[18px]" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    title: "Quote",
    description: "Block quote.",
    searchTerms: ["blockquote"],
    icon: <Quote className="size-[18px]" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: "Code Block",
    description: "Code snippet with syntax highlighting.",
    searchTerms: ["codeblock", "code"],
    icon: <Code className="size-[18px]" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    title: "Divider",
    description: "Horizontal rule to separate content.",
    searchTerms: ["hr", "separator", "line"],
    icon: <Minus className="size-[18px]" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
]);

export function SlashCommands() {
  return (
    <EditorCommand className="z-50 h-auto max-h-[330px] overflow-y-auto rounded-xl border border-border bg-background px-1 py-2 shadow-xl">
      <EditorCommandEmpty className="px-2 text-sm text-muted-foreground">
        No results
      </EditorCommandEmpty>
      <EditorCommandList>
        {suggestionItems.map((item) => (
          <EditorCommandItem
            key={item.title}
            value={item.title}
            onCommand={(val) => item.command?.(val)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-accent cursor-pointer aria-selected:bg-accent"
          >
            <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-background">
              {item.icon}
            </div>
            <div>
              <p className="font-medium">{item.title}</p>
              <p className="text-xs text-muted-foreground">
                {item.description}
              </p>
            </div>
          </EditorCommandItem>
        ))}
      </EditorCommandList>
    </EditorCommand>
  );
}
