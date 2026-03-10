"use client";

import { useState, useRef, useCallback } from "react";
import { SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChat } from "@/hooks/useChat";

export function ChatInput() {
  const [input, setInput] = useState("");
  const { sendMessage, isStreaming } = useChat();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    await sendMessage(text);
  }, [input, isStreaming, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  return (
    <div className="border-t border-primary/10 px-3 py-3">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Ask your AI coach..."
          disabled={isStreaming}
          rows={1}
          className="flex-1 resize-none rounded-xl border-none bg-muted px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
        />
        <Button
          size="icon"
          className="size-9 shrink-0 rounded-xl"
          onClick={handleSend}
          disabled={!input.trim() || isStreaming}
        >
          <SendHorizontal className="size-4" />
        </Button>
      </div>
    </div>
  );
}
