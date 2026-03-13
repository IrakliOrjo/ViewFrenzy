"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@/hooks/useChat";

export default function ChatPage() {
  const { openChat } = useChat();
  const router = useRouter();

  useEffect(() => {
    openChat();
    router.replace("/dashboard/overview");
  }, [openChat, router]);

  return null;
}
