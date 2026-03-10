import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversationId = req.nextUrl.searchParams.get("conversationId");

  if (!conversationId) {
    // Find the user's conversation and return its messages
    const conversation = await prisma.conversation.findFirst({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ messages: [], conversationId: null });
    }

    return NextResponse.json({
      conversationId: conversation.id,
      messages: conversation.messages.map((m) => ({
        id: m.id,
        role: m.role === "model" ? "assistant" : m.role,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  }

  // Verify ownership
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId: session.user.id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  return NextResponse.json({
    conversationId: conversation.id,
    messages: conversation.messages.map((m) => ({
      id: m.id,
      role: m.role === "model" ? "assistant" : m.role,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}
