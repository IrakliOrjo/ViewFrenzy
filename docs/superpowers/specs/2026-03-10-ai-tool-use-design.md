# AI Tool Use System — Implementation Plan (APPROVED)

## Context

The ViewFrenzy AI coach currently only reads creator data (analytics, goals, ideas) and provides conversational coaching. Users want the AI to be able to **create, update, delete, and query** entities (Ideas, Goals, Creator Profile, Conversations) directly through chat. This transforms the AI from a read-only advisor into an interactive workspace assistant.

**Approach:** Gemini Native Function Calling — define structured tool declarations, Gemini decides when to call them, we execute server-side, feed results back, and Gemini wraps results in natural language. All actions are automatic (no confirmation step).

**Provider:** Google Gemini (`gemini-2.5-flash-lite`) via `@google/genai` SDK (existing).

---

## Step 1: Define Tool Declarations & Types

**New file: `src/lib/ai-tools.ts`**

Define all 15 tool declarations in Gemini's `FunctionDeclaration` format + a type registry.

### Tools by entity:

**Ideas** (5): `create_idea`, `update_idea`, `delete_idea`, `list_ideas`, `get_idea`
**Goals** (5): `create_goal`, `update_goal`, `delete_goal`, `list_goals`, `get_goal`
**Creator Profile** (2): `update_profile`, `get_profile`
**Conversations** (3): `new_conversation`, `list_conversations`, `summarize_conversation`

Each declaration includes: `name`, `description`, `parameters` (JSON Schema object with required/optional fields).

Also export a `IToolResult` type:
```typescript
interface IToolResult {
  tool: string;
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}
```

### Key parameter details:

- `create_idea`: title (required), description?, format? (enum: short, long, shorts, live, podcast), priority? (enum: low, medium, high), status? (default: "idea")
- `create_goal`: title (required), description?, targetValue? (number), unit?, deadline? (ISO date string)
- `update_idea` / `update_goal`: entity ID (required) + any updatable fields as optional
- `list_ideas`: status?, priority?, format? — returns array of matching ideas
- `list_goals`: completed? (boolean), limit? (number, default 10)
- `update_profile`: niche?, contentStyle?, postingFrequency?
- `new_conversation`: title? — creates a new conversation, sets it as current
- `summarize_conversation`: no params — generates summary of current conversation

---

## Step 2: Implement Tool Handlers (Thin Layer Over Existing Services)

**New file: `src/lib/ai-tool-handlers.ts`**

A handler registry mapping tool names to async handler functions. Each handler:
1. Receives `(userId: string, args: Record<string, unknown>)`
2. Calls the **existing service function** (NOT raw Prisma)
3. Returns `IToolResult`

### Existing service layer to reuse:

The project already has a domain-driven service layer with cache invalidation built in:

- **`src/lib/domains/idea/idea.service.ts`**: `createIdeaForUser`, `updateIdeaForUser`, `deleteIdeaForUser`
- **`src/lib/domains/idea/idea.data.ts`**: `getIdeasByUser`, `getIdeaById` + input types `ICreateIdeaInput`, `IUpdateIdeaInput`
- **`src/lib/domains/goal/goal.service.ts`**: `createGoalForUser`, `updateGoalForUser`, `deleteGoalForUser`
- **`src/lib/domains/goal/goal.data.ts`**: `getGoalsByUser`, `getGoalById` + input types `ICreateGoalInput`, `IUpdateGoalInput`
- **`src/lib/domains/profile/profile.service.ts`**: `updateProfileForUser`
- **`src/lib/domains/profile/profile.data.ts`**: `getProfile` + input type `IUpdateProfileInput`
- **`src/lib/domains/shared/with-cache-invalidation.ts`**: All service mutations already invalidate the AI context cache

### Handler implementations (thin wrappers):

```
create_idea(userId, args)
  → createIdeaForUser(userId, args as ICreateIdeaInput)  // already handles cache invalidation
  → return {tool: "create_idea", success: true, data: serialized result}

update_idea(userId, {ideaId, ...fields})
  → updateIdeaForUser(userId, ideaId, fields as IUpdateIdeaInput)
  → return updated idea as IToolResult

delete_idea(userId, {ideaId})
  → deleteIdeaForUser(userId, ideaId)
  → return {tool: "delete_idea", success: true, data: {id: ideaId}}

list_ideas(userId, {status?, priority?, format?})
  → getIdeasByUser(userId) then filter client-side by status/priority/format
  → return array of ideas

get_idea(userId, {ideaId})
  → getIdeaById(ideaId)
  → return full idea details
```

Same pattern for goals and profile. Conversation handlers use `prisma` directly since no domain service exists for conversations yet:
- `new_conversation`: `prisma.conversation.create(...)`, return its ID
- `list_conversations`: `prisma.conversation.findMany(...)` with message count
- `summarize_conversation`: Use existing `getConversationMessages` from `ai-context.ts`

**No raw Prisma needed for ideas/goals/profile** — the existing services handle ownership, validation, and cache invalidation.

---

## Step 3: Update AI Chat Function for Tool Call Loop

**Modify: `src/lib/ai.ts`**

### Changes:

1. **Import tool declarations** from `ai-tools.ts` and handler registry from `ai-tool-handlers.ts`

2. **Pass tools to Gemini** in the `generateContentStream` config:
```typescript
config: {
  systemInstruction: systemPrompt,
  tools: [{ functionDeclarations: toolDeclarations }],
}
```

3. **Handle the tool call loop**: Gemini streaming with function calling works as follows:
   - Stream chunks until a `functionCall` part is detected
   - Pause streaming, execute the tool handler
   - Make a follow-up call to Gemini with the `functionResponse`
   - Stream the final text response

4. **Updated stream flow**:
```
Start streaming response from Gemini
  ├─ Text chunks → send as SSE {text: "..."}
  └─ Function call detected →
       Execute handler → get IToolResult
       Send SSE {toolResult: IToolResult}  ← NEW: client receives this
       Feed functionResponse back to Gemini
       Continue streaming Gemini's follow-up text → send as SSE {text: "..."}
```

5. **Multi-tool support**: Gemini can return multiple function calls in one response. Handle by executing all tools, collecting results, and feeding all results back in one follow-up call.

6. **Update `chat()` signature**: Still takes `(userId, conversationId, userMessage)` and returns `ReadableStream`. The userId is passed through to tool handlers.

7. **Save complete response**: After all streaming is done (including tool loop), save the full text (excluding tool metadata) as the assistant message in the DB.

### Key implementation detail — non-streaming tool execution:

When a function call is detected during streaming, we can't continue the stream. Instead:
1. Collect the full first response (may contain text + functionCall)
2. Execute tools
3. Make a NEW `generateContentStream` call with the tool results appended to contents
4. Stream that second response

This means `chat()` internally may make 2+ Gemini API calls per user message, but the client sees one continuous stream.

---

## Step 4: Extend SSE Protocol & Client Types

**Modify: `src/types/chat.ts`**

```typescript
export interface IChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  toolResults?: IToolResult[];  // NEW
}

export interface IToolResult {
  tool: string;
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}
```

**Modify: `src/providers/ChatProvider.tsx`**

Update the SSE parser to handle `toolResult` events:
```typescript
if (parsed.toolResult) {
  setMessages((prev) =>
    prev.map((m) =>
      m.id === assistantId
        ? { ...m, toolResults: [...(m.toolResults ?? []), parsed.toolResult] }
        : m
    )
  );
}
```

---

## Step 5: Build Inline Action Cards

**New file: `src/components/ChatPanel/components/ActionCard.tsx`**

A client component that renders tool results as styled interactive cards within assistant messages.

### Card structure:
- **Header**: Icon + action label (e.g., "✅ Idea Created", "📝 Goal Updated", "🗑️ Idea Deleted")
- **Body**: Key fields of the entity (title, status, priority, deadline, etc.)
- **Actions**: Contextual buttons depending on the operation:
  - **Create/Update**: "View" button → navigates to the relevant page (/ideas, /goals, /settings)
  - **Delete**: "Undo" button → calls a restore endpoint (or re-creates the entity)
  - **List/Query**: No buttons, just displays the results in a compact list

### Card design:
- Matches the app's design system (rounded-xl, warm orange accents)
- Compact — fits naturally within the chat message flow
- Uses existing shadcn/ui `Card` component as base

**Modify: `src/components/ChatPanel/ChatMessageBubble.tsx`**

Insert `<ActionCard>` components at the end of assistant messages when `toolResults` is present:
```tsx
{message.toolResults?.map((result, i) => (
  <ActionCard key={i} result={result} />
))}
```

---

## Step 6: Update System Prompt

**Modify: `src/lib/ai.ts`** — Add tool-use guidance to `COACHING_SYSTEM_PROMPT`:

```
## Your Capabilities
You can manage the creator's workspace directly through tools:
- **Ideas**: Create, update, delete, and query video ideas
- **Goals**: Create, update progress, complete, delete, and query goals
- **Creator Profile**: Update niche, content style, posting frequency
- **Conversations**: Start new conversations, list past ones, summarize current

## When to Use Tools
- When the creator explicitly asks to create/modify/delete something
- When coaching leads to an actionable suggestion and the creator agrees
- When the creator asks "what are my goals/ideas?" — use query tools for fresh data
- Do NOT use tools speculatively — only when intent is clear

## After Using a Tool
- Briefly confirm what you did
- Continue the coaching conversation naturally
- If creating an idea/goal from a coaching discussion, explain WHY you suggested it
```

---

## Step 7: Handle Conversation Management

The `new_conversation` tool needs special handling since it affects the active conversation context:

1. When `new_conversation` is called:
   - Optionally summarize the current conversation (store in `conversation.summary`)
   - Create a new Conversation record
   - The API route response should include the new conversation ID in the `X-Conversation-Id` header
   - Client-side ChatProvider picks up the new ID and resets messages

2. `list_conversations`: Returns recent conversations with titles, message counts, and dates. The AI can present these conversationally.

3. `summarize_conversation`: Generates a summary of the current conversation and stores it in `conversation.summary`. Useful before starting a new conversation.

---

## Files Summary

### New files:
| File | Purpose |
|------|---------|
| `src/lib/ai-tools.ts` | Tool declarations (Gemini format) + types + registry |
| `src/lib/ai-tool-handlers.ts` | Thin handler layer mapping Gemini calls → existing domain services |
| `src/components/ChatPanel/components/ActionCard.tsx` | Interactive inline action card component |

### Modified files:
| File | Changes |
|------|---------|
| `src/lib/ai.ts` | Add tools to Gemini call, tool call loop, updated system prompt |
| `src/lib/ai-context.ts` | Ensure `invalidateCreatorCache` is exported (already is) |
| `src/types/chat.ts` | Add `IToolResult` interface, extend `IChatMessage` |
| `src/providers/ChatProvider.tsx` | Parse `toolResult` SSE events, handle new conversation ID |
| `src/components/ChatPanel/ChatMessageBubble.tsx` | Render `ActionCard` for tool results |

---

## Verification

### Manual testing:
1. **Start dev server**: `npm run dev`
2. **Open chat panel** and test these conversations:
   - "Create an idea for a thumbnail tutorial video" → should create idea + show action card
   - "What are my current goals?" → should use `list_goals` tool and show results
   - "Update my profile niche to gaming" → should update profile
   - "Delete the goal about 1K subscribers" → should delete + show undo card
   - "Start a new conversation" → should archive current, start fresh
3. **Verify database**: Check Prisma Studio (`npx prisma studio`) to confirm entities were actually created/modified
4. **Verify cache invalidation**: After creating an idea, send another message — the AI's context should include the new idea
5. **Test error cases**: Try deleting a non-existent entity, creating without required fields
6. **Test the action card buttons**: "View" should navigate, "Undo" should reverse the action
