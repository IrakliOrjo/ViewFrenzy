import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/prisma";
import { buildCreatorContext, getConversationMessages } from "@/lib/ai-context";

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
- Use markdown formatting for readability (bold, lists, headers for longer responses).`;

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

  // DEBUG: Log full context sent to AI
  console.log("\n========== AI CONTEXT DEBUG ==========");
  console.log("SYSTEM PROMPT:\n", systemPrompt);
  console.log("\nCONVERSATION HISTORY:", JSON.stringify(history, null, 2));
  console.log("\nNEW USER MESSAGE:", userMessage);
  console.log("========== END AI CONTEXT ==========\n");

  // Save user message to DB
  await prisma.message.create({
    data: {
      conversationId,
      role: "user",
      content: userMessage,
    },
  });

  // Build Gemini request
  const contents = [
    ...history,
    { role: "user" as const, parts: [{ text: userMessage }] },
  ];

  const response = await ai.models.generateContentStream({
    model: "gemini-2.5-flash-lite",
    contents,
    config: {
      systemInstruction: systemPrompt,
    },
  });

  let fullResponse = "";

  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of response) {
          const text = chunk.text ?? "";
          if (text) {
            fullResponse += text;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
            );
          }
        }

        // Save assistant message to DB
        if (fullResponse) {
          await prisma.message.create({
            data: {
              conversationId,
              role: "model",
              content: fullResponse,
            },
          });
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        console.error("AI streaming error:", error);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: "An error occurred while generating the response." })}\n\n`
          )
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });
}
