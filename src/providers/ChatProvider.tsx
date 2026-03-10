"use client";

import { createContext } from "react";
import { useChatState, type IChatContextValue } from "@/providers/hooks/useChatState";

interface ChatProviderProps {
  children: React.ReactNode;
}

export const ChatContext = createContext<IChatContextValue | null>(null);

export function ChatProvider({ children }: ChatProviderProps) {
  const value = useChatState();

  return (
    <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
  );
}
