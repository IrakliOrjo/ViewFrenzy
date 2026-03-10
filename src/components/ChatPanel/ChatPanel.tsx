"use client";

import { cn } from "@/lib/utils";
import { useChat } from "@/hooks/useChat";
import { ChatHeader } from "./components/ChatHeader";
import { ChatMessages } from "./components/ChatMessages";
import { ChatInput } from "./components/ChatInput";

export function ChatPanel() {
  const { isOpen, closeChat } = useChat();

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={closeChat}
        />
      )}

      {/* Panel */}
      <div
        className={cn(
          "fixed right-0 top-0 z-40 flex h-full w-full flex-col border-l border-primary/10 bg-background shadow-xl transition-transform duration-300 ease-in-out sm:w-[380px]",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <ChatHeader />
        <ChatMessages />
        <ChatInput />
      </div>
    </>
  );
}
