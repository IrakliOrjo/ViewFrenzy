"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { IChatMessage } from "@/types/chat";

const CHAT_MESSAGES_ENDPOINT = "/api/chat/messages";
const CHAT_SEND_ENDPOINT = "/api/chat";
const CHAT_STREAM_DONE = "[DONE]";
const CHAT_ERROR_MESSAGE = "Sorry, something went wrong. Please try again.";

interface IChatMessagesResponse {
  conversationId?: string | null;
  messages?: IChatMessage[];
}

interface IChatStreamChunk {
  text?: string;
  error?: string;
}

export interface IChatContextValue {
  isOpen: boolean;
  toggleChat: () => void;
  openChat: () => void;
  closeChat: () => void;
  messages: IChatMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  conversationId: string | null;
  sendMessage: (text: string) => Promise<void>;
}

function createTemporaryMessage(role: IChatMessage["role"], content: string): IChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

function appendMessageContent(
  messages: IChatMessage[],
  messageId: string,
  content: string
): IChatMessage[] {
  return messages.map((message) =>
    message.id === messageId
      ? { ...message, content: `${message.content}${content}` }
      : message
  );
}

function replaceMessageContent(
  messages: IChatMessage[],
  messageId: string,
  content: string
): IChatMessage[] {
  return messages.map((message) =>
    message.id === messageId ? { ...message, content } : message
  );
}

function parseStreamChunk(line: string): IChatStreamChunk | null {
  if (!line.startsWith("data: ")) {
    return null;
  }

  const payload = line.slice(6);

  if (payload === CHAT_STREAM_DONE) {
    return null;
  }

  try {
    return JSON.parse(payload) as IChatStreamChunk;
  } catch {
    return null;
  }
}

function processStreamBuffer(
  buffer: string,
  onChunk: (chunk: IChatStreamChunk) => void
): string {
  const lines = buffer.split("\n");
  const incompleteLine = lines.pop() ?? "";

  for (const line of lines) {
    const chunk = parseStreamChunk(line);

    if (!chunk) {
      continue;
    }

    onChunk(chunk);
  }

  return incompleteLine;
}

async function streamAssistantResponse(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onChunk: (chunk: IChatStreamChunk) => void
): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    buffer = processStreamBuffer(buffer, onChunk);
  }

  const finalBuffer = buffer + decoder.decode();

  if (finalBuffer) {
    processStreamBuffer(`${finalBuffer}\n`, onChunk);
  }
}

export function useChatState(): IChatContextValue {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const hasFetchedMessagesRef = useRef(false);
  const isFetchingMessagesRef = useRef(false);

  const fetchMessages = useCallback(async () => {
    if (hasFetchedMessagesRef.current || isFetchingMessagesRef.current) {
      return;
    }

    isFetchingMessagesRef.current = true;
    setIsLoading(true);

    try {
      const response = await fetch(CHAT_MESSAGES_ENDPOINT);

      if (!response.ok) {
        throw new Error("Failed to fetch chat messages");
      }

      const data = (await response.json()) as IChatMessagesResponse;

      setConversationId(data.conversationId ?? null);
      setMessages(data.messages ?? []);
      hasFetchedMessagesRef.current = true;
    } catch (error) {
      console.error("Failed to load chat messages:", error);
    } finally {
      isFetchingMessagesRef.current = false;
      setIsLoading(false);
    }
  }, []);

  const openChat = useCallback(() => {
    setIsOpen(true);
    void fetchMessages();
  }, [fetchMessages]);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleChat = useCallback(() => {
    setIsOpen((previousIsOpen) => {
      if (!previousIsOpen) {
        void fetchMessages();
      }

      return !previousIsOpen;
    });
  }, [fetchMessages]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmedText = text.trim();

      if (!trimmedText) {
        return;
      }

      const userMessage = createTemporaryMessage("user", trimmedText);
      const assistantMessage = createTemporaryMessage("assistant", "");

      setMessages((previousMessages) => [
        ...previousMessages,
        userMessage,
        assistantMessage,
      ]);
      setIsStreaming(true);

      try {
        const response = await fetch(CHAT_SEND_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmedText,
            conversationId,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to send message");
        }

        const nextConversationId = response.headers.get("X-Conversation-Id");

        if (nextConversationId) {
          setConversationId(nextConversationId);
        }

        const reader = response.body?.getReader();

        if (!reader) {
          throw new Error("No response body");
        }

        await streamAssistantResponse(reader, (chunk) => {
          const { error, text: streamText } = chunk;

          if (streamText) {
            setMessages((previousMessages) =>
              appendMessageContent(previousMessages, assistantMessage.id, streamText)
            );
          }

          if (error) {
            setMessages((previousMessages) =>
              replaceMessageContent(previousMessages, assistantMessage.id, error)
            );
          }
        });
      } catch (error) {
        console.error("Chat error:", error);
        setMessages((previousMessages) =>
          replaceMessageContent(
            previousMessages,
            assistantMessage.id,
            CHAT_ERROR_MESSAGE
          )
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [conversationId]
  );

  return useMemo(
    () => ({
      isOpen,
      toggleChat,
      openChat,
      closeChat,
      messages,
      isLoading,
      isStreaming,
      conversationId,
      sendMessage,
    }),
    [
      closeChat,
      conversationId,
      isLoading,
      isOpen,
      isStreaming,
      messages,
      openChat,
      sendMessage,
      toggleChat,
    ]
  );
}
