import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { chat } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, conversationId } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Find or create single conversation for user
    let convId = conversationId as string | undefined;

    if (!convId) {
      // Look for existing conversation
      const existing = await prisma.conversation.findFirst({
        where: { userId: session.user.id },
        orderBy: { updatedAt: "desc" },
      });

      if (existing) {
        convId = existing.id;
      } else {
        const created = await prisma.conversation.create({
          data: {
            userId: session.user.id,
            title: "AI Coaching",
          },
        });
        convId = created.id;
      }
    } else {
      // Verify ownership
      const conv = await prisma.conversation.findFirst({
        where: { id: convId, userId: session.user.id },
      });
      if (!conv) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
      }
    }

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: convId },
      data: { updatedAt: new Date() },
    });

    const stream = await chat(session.user.id, convId, message);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Conversation-Id": convId,
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
