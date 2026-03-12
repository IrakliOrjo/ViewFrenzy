import { GoogleGenAI, createPartFromFunctionResponse } from "@google/genai";
import { prisma } from "@/lib/prisma";
import { buildCreatorContext, getConversationMessages } from "@/lib/ai-context";
import { toolDeclarations } from "@/lib/ai-tools";
import { executeToolCall } from "@/lib/ai-tool-handlers";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });

const COACHING_SYSTEM_PROMPT = `You are the ViewFrenzy AI Coach — a friendly, knowledgeable YouTube growth strategist for small creators (0–10K subscribers). You combine data-driven analysis with encouraging, actionable coaching.

## Your Personality
- Enthusiastic but not over-the-top. You're a supportive friend who happens to be a YouTube expert.
- Direct and actionable — every response should include something the creator can DO.
- Data-aware — reference their actual analytics when relevant, not generic advice.
- Honest — if something isn't working, say so diplomatically. Don't sugarcoat.

## Growth-Stage-Aware Coaching
Adapt your advice based on the creator's subscriber count:

### 0–100 subscribers (Foundation Stage)
- Focus: Consistency, finding their voice, basic SEO
- Emphasize: Upload regularly, experiment with formats, don't obsess over numbers
- Key metrics: Upload frequency, improving over time

### 100–500 subscribers (Traction Stage)
- Focus: Identify what's working, double down on winners
- Emphasize: Analyze which videos get more views, topic selection, thumbnails
- Key metrics: Views per video, click-through rate

### 500–1K subscribers (Momentum Stage)
- Focus: Refine content strategy, optimize packaging
- Emphasize: Thumbnail A/B testing, title formulas, content hooks
- Key metrics: CTR, average view duration, audience retention

### 1K–5K subscribers (Growth Stage)
- Focus: CTR and retention optimization, content series
- Emphasize: Pattern recognition in top performers, community building
- Key metrics: CTR, retention curves, returning viewers

### 5K–10K subscribers (Scale Stage)
- Focus: Brand identity, community, collaboration opportunities
- Emphasize: Consistent branding, audience engagement, strategic collaborations
- Key metrics: Subscriber growth rate, community engagement

## Rules
- Keep responses concise (2-4 paragraphs max unless a detailed breakdown is requested).
- Use the creator's actual data when available — reference specific video titles, metrics, and trends.
- Always end with a clear next step or question to keep the conversation productive.
- If the creator asks about something outside YouTube growth, gently redirect.
- Never make up data. If you don't have data on something, say so.
- Use markdown formatting for readability (bold, lists, headers for longer responses).

## Your Capabilities
You can manage the creator's workspace directly through tools:
- **Ideas**: Create, update, delete, and query video ideas
- **Goals**: Create, update progress, complete, delete, and query goals
- **Creator Profile**: Update niche, content style, posting frequency
- **Conversations**: Start new conversations, list past ones, summarize current

## When to Use Tools
- When the creator explicitly asks to create, modify, or delete something
- When coaching naturally leads to an actionable suggestion and the creator agrees
- When the creator asks "what are my goals/ideas?" — use the query tools for the most up-to-date data
- Do NOT use tools speculatively — only when the creator's intent is clear

## After Using a Tool
- Briefly confirm what you did
- Continue the coaching conversation naturally
- If creating an idea or goal from a coaching discussion, explain WHY you suggested it`;

async function buildSystemPrompt(userId: string): Promise<string> {
  const creatorContext = await buildCreatorContext(userId);
  return `${COACHING_SYSTEM_PROMPT}\n\n---\n\n# Creator's Current Data\n${creatorContext}`;
}

export async function chat(
  userId: string,
  conversationId: string,
  userMessage: string
): Promise<ReadableStream> {
  const [systemPrompt, history] = await Promise.all([
    buildSystemPrompt(userId),
    getConversationMessages(conversationId),
  ]);

  // Save user message to DB
  await prisma.message.create({
    data: {
      conversationId,
      role: "user",
      content: userMessage,
    },
  });

  const contents = [
    ...history,
    { role: "user" as const, parts: [{ text: userMessage }] },
  ];

  const geminiConfig = {
    systemInstruction: systemPrompt,
    tools: [{ functionDeclarations: toolDeclarations }],
  };

  let fullResponse = "";

  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      function send(payload: Record<string, unknown>): void {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
        );
      }

      try {
        // Step 1: Non-streaming call so we can reliably inspect function calls
        const initialResponse = await ai.models.generateContent({
          model: "gemini-2.5-flash-lite",
          contents,
          config: geminiConfig,
        });

        const candidate = initialResponse.candidates?.[0];
        const parts = candidate?.content?.parts ?? [];

        const functionCallParts = parts.filter((p) => p.functionCall != null);
        const textParts = parts.filter((p) => p.text != null);

        // Stream any text that accompanied the tool invocations (rare, but possible)
        for (const part of textParts) {
          if (part.text) {
            fullResponse += part.text;
            send({ text: part.text });
          }
        }

        if (functionCallParts.length > 0) {
          // Execute each tool call and collect function responses
          const functionResponseParts = [];

          for (const part of functionCallParts) {
            const fc = part.functionCall!;
            const toolName = fc.name!;
            const toolArgs = (fc.args ?? {}) as Record<string, unknown>;

            const result = await executeToolCall(
              toolName,
              userId,
              conversationId,
              toolArgs
            );

            // Inform the client so it can update UI optimistically
            send({ toolResult: result });

            // If a new conversation was created, tell the client its ID
            if (
              result.tool === "new_conversation" &&
              result.success &&
              result.data?.newConversationId
            ) {
              send({ newConversationId: result.data.newConversationId });
            }

            // Build the Part Gemini needs back — id may be undefined for older models
            functionResponseParts.push(
              createPartFromFunctionResponse(
                fc.id ?? toolName,
                toolName,
                result as unknown as Record<string, unknown>
              )
            );
          }

          // Step 2: Stream the follow-up response with function results attached
          const followUpContents = [
            ...contents,
            // Re-attach the model turn that contained the function calls
            {
              role: "model" as const,
              parts,
            },
            // User turn carrying all function responses
            {
              role: "user" as const,
              parts: functionResponseParts,
            },
          ];

          const followUpStream = await ai.models.generateContentStream({
            model: "gemini-2.5-flash-lite",
            contents: followUpContents,
            config: geminiConfig,
          });

          for await (const chunk of followUpStream) {
            const text = chunk.text ?? "";
            if (text) {
              fullResponse += text;
              send({ text });
            }
          }
        } else if (textParts.length === 0) {
          // Fallback: response had neither text nor function calls — stream a
          // fresh request so the model always produces some output
          const fallbackStream = await ai.models.generateContentStream({
            model: "gemini-2.5-flash-lite",
            contents,
            config: geminiConfig,
          });

          for await (const chunk of fallbackStream) {
            const text = chunk.text ?? "";
            if (text) {
              fullResponse += text;
              send({ text });
            }
          }
        }

        // Persist the complete assistant turn
        if (fullResponse) {
          await prisma.message.create({
            data: {
              conversationId,
              role: "model",
              content: fullResponse,
            },
          });
        }

        send({ text: "" }); // flush any buffered SSE clients
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        console.error("AI streaming error:", error);
        send({
          error: "An error occurred while generating the response.",
        });
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });
}
