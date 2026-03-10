"use client";

import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChat } from "@/hooks/useChat";

export function ChatHeader() {
  const { closeChat } = useChat();

  return (
    <div className="flex items-center justify-between border-b border-primary/10 px-4 py-3">
      <div className="flex items-center gap-2">
        <div className="rounded-lg bg-primary/10 p-1.5">
          <Sparkles className="size-4 text-primary" />
        </div>
        <h3 className="font-semibold text-sm">AI Coach</h3>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
        onClick={closeChat}
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}
