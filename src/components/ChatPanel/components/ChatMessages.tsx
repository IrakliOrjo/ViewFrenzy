"use client";

import { useEffect, useRef } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { ChatMessageBubble } from "./ChatMessageBubble";

export function ChatMessages() {
  const { messages, isLoading, isStreaming } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary/40" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="rounded-full bg-primary/10 p-3">
          <Sparkles className="size-6 text-primary" />
        </div>
        <div>
          <p className="font-medium text-sm">Your AI Coach is ready</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Ask about your channel growth, video strategy, or get personalized
            coaching tips.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      {messages.map((message) => (
        <ChatMessageBubble key={message.id} message={message} />
      ))}
      {isStreaming && messages[messages.length - 1]?.content === "" && (
        <div className="flex justify-start">
          <div className="rounded-2xl rounded-bl-md bg-muted px-3.5 py-2.5">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
