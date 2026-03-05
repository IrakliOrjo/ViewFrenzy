# Forge — AI YouTube Growth Coach

> Design doc for Forge, a proactive AI YouTube growth coach for small creators.
> Created: 2026-03-01

---

## Problem

Small YouTube creators (under 10K subs) struggle with:

1. **No strategic guidance** — they watch tutorials but don't know what to do for THEIR channel
2. **No accountability** — they know they should post consistently but nobody holds them to it
3. **Analytics confusion** — they see numbers in YouTube Studio but don't know what actions to take
4. **Task overwhelm** — managing content ideas, scripting, editing, scheduling, community, multiple platforms
5. **Isolation** — solo creators have no team, no feedback loop, no one asking "did you follow through?"

Existing tools (vidIQ, TubeBuddy) focus on SEO optimization and keyword research. They help you optimize what you've already made — they don't tell you what to make, when to make it, or hold you accountable for doing it.

---

## Solution

**Forge** is an AI-powered YouTube growth coach delivered as a web app. It connects to your YouTube channel, analyzes your real analytics data, and **proactively reaches out** with strategic advice, check-ins, and accountability nudges via push notifications.

It's not a chatbot that waits for you. It's a coach that initiates.

---

## Target User

- Content creators with 0-10K subscribers
- Solo creators without a team or manager
- Any niche (not limited to dev/tech creators)
- Willing to pay $20-30/month for a tool that helps them grow
- Already creating content but struggling with consistency, strategy, or both

---

## Core Value Proposition

**vidIQ** = YouTube SEO toolkit (optimize existing content for search)
**Forge** = YouTube growth coach (tells you WHAT to make, WHEN to make it, holds you accountable)

They're complementary, not competing.

---

## Competitive Landscape

| Competitor | What they do | What they DON'T do |
|---|---|---|
| vidIQ | SEO, keyword research, browser extension, AI script writer | Not proactive, no accountability, no persistent memory, generic advice |
| TubeBuddy | Bulk optimization, A/B testing, keyword research | Same gaps as vidIQ |
| ChatGPT / Claude | General AI chat, can analyze screenshots | No YouTube integration, not proactive, no context persistence |
| Human YouTube coaches | Personalized strategy, accountability | $200-500+/month, limited availability |
| **Forge** | Proactive coaching, real analytics, accountability, persistent memory, growth-stage aware | Not an SEO tool, no keyword databases, no browser extension |

---

## Key Differentiators

1. **Proactive** — sends push notifications, doesn't wait for you to open the app
2. **YouTube-native** — reads your actual analytics via YouTube Analytics API
3. **Persistent memory** — remembers your goals, past conversations, content plan, what worked
4. **Growth-stage aware** — different advice for 100 subs vs 1K vs 10K
5. **Affordable** — $20-30/mo vs $200+ for human coaching
6. **Accountability** — tracks your commitments and follows up

---

## Analytics Access

Using **YouTube Analytics API** + **YouTube Data API v3**:

| Data | API | Available |
|------|-----|-----------|
| Views, watch time, subscribers | Analytics API | Yes |
| CTR (click-through rate) | Analytics API | Yes |
| Impressions | Analytics API | Yes |
| Audience retention curves | Analytics API | Yes |
| Traffic sources (browse, search, suggested, external) | Analytics API | Yes |
| Demographics (age, gender, geography) | Analytics API | Yes |
| Device breakdown (mobile, desktop, TV) | Analytics API | Yes |
| Revenue data (if monetized) | Analytics API | Yes (extra OAuth scope) |
| Video metadata (titles, descriptions, tags, thumbnails) | Data API v3 | Yes |
| Comments | Data API v3 | Yes |
| Channel info (subscriber count, total views) | Data API v3 | Yes |

OAuth scopes needed:
- `yt-analytics.readonly` — viewing activity metrics
- `youtube.readonly` — channel/video metadata
- `yt-analytics-monetary.readonly` — revenue data (optional, for monetized channels)
- `youtube.force-ssl` — read + write to live chat (required for Live Chat Bot, V2)

---

## Feature Roadmap

### MVP (Weeks 1-8) — "The Coach"

The minimum product that delivers unique value and is worth paying for.

| Feature | Description |
|---------|-------------|
| **Google OAuth + YouTube connection** | One-click connect your YouTube channel. Pull analytics data. |
| **AI chat interface** | Comfortable web UI for ongoing conversation with the AI coach. Not a terminal — a proper chat experience. |
| **Creator profile & onboarding** | Conversational onboarding that learns: niche, content style (faceless/on-camera/mixed), personality, goals, struggles, preferences. See [Creator Profile & Context System](#creator-profile--context-system). |
| **Channel context & memory** | AI knows your channel stats, goals, content history, and remembers past conversations across sessions. Proactively asks follow-up questions to keep context fresh. |
| **Ideas bucket** | Store content ideas with statuses (💡 Idea → 📝 Planning → 🎬 In Progress → ✅ Published → 📊 Analyzed). AI sees all ideas and uses them for recommendations. See [Ideas Bucket System](#ideas-bucket-system). |
| **Proactive check-ins** | Push notifications triggered by events and schedules: post-upload follow-up, weekly analytics review, goal deadline reminders, "you haven't posted in X days" nudges, idea accountability. |
| **Analytics dashboard** | Key metrics visualized: views, CTR, impressions, retention, subscriber growth, traffic sources. Trend lines and comparisons. |
| **AI analytics interpretation** | Not just charts — the AI explains what the numbers mean and what action to take. "Your CTR dropped 20% this week. Here's why and what to change." |
| **Goal setting & tracking** | Set goals ("500 subs by April", "post 3x/week"). Forge tracks progress and holds you accountable. |
| **Content strategy advice** | AI recommends what to create based on your analytics, niche, growth stage, and ideas bucket. |
| **Basic title feedback** | AI analyzes past titles vs CTR performance and suggests patterns: "Your titles with numbers get 2x more clicks." |
| **Tips & learning system** | Weekly tips (free) or daily tips (pro) delivered via push/in-app. Weekly themes with contextual tip selection based on creator's recent activity. See [Tips & Learning System](#tips--learning-system). |

### V1.5 (Month 2-3) — "The Analyst"

| Feature | Description |
|---------|-------------|
| **Smart idea recommendations** | Connects channel analytics + trending videos in niche + ideas bucket to recommend what to create next. "This idea matches a trending topic AND your best-performing format." |
| **Post-upload auto-analysis** | Detects new video, pulls early analytics (24-48hrs), compares to past performance, delivers actionable read. |
| **Post-stream auto-analysis** | Detects stream ended, pulls stream analytics (peak viewers, chat activity, watch time), delivers debrief. |
| **Speech & delivery coaching (opt-in)** | Pulls auto-generated transcript, analyzes filler words, pacing, clarity. Tracks improvement over time. Toggle ON/OFF in settings. See [Post-Upload & Post-Stream Analysis](#post-upload--post-stream-analysis). |
| **Content format suggestions** | Suggests alternative presentation formats for topics. "Instead of a tutorial, try a 'I tried X for 7 days' format." See [Content Format Suggestions](#content-format-suggestions). |

### V2 (Month 3-4) — "The Planner"

| Feature | Description |
|---------|-------------|
| **Content calendar** | Plan and schedule content. AI suggests optimal posting times and content mix. |
| **Script assistance** | AI helps write scripts in YOUR voice (learns from your past content and speech patterns). |
| **Thumbnail feedback** | AI analyzes thumbnail and gives specific improvement suggestions. |
| **Notion integration** | Sync tasks and calendar with Notion. |
| **Live Chat AI Bot** | Connect your channel and deploy an AI bot that auto-answers viewer questions during live streams. Configurable personality, knowledge base, and rules. See [Live Chat Bot System](#live-chat-bot-system) below. |
| **Trending format detection** | Analyze top-performing videos in the creator's niche to detect emerging format patterns. |

### V3 (Month 5+) — "The Studio"

| Feature | Description |
|---------|-------------|
| **Auto-clip suggestions** | Analyzes stream VODs and suggests best moments for clips/shorts. |
| **Caption/subtitle generation** | Auto-generate captions for videos. |
| **Basic reel text overlay** | Simple tool for adding text overlays to short clips (CapCut alternative for basic needs). |
| **Multi-platform suggestions** | "Here's how to repurpose this video for Instagram, TikTok, and Twitter." |
| **Competitor tracking** | Monitor creators in your niche. "This creator posted about X and got 50K views — there's an angle for you." |
| **Community management tips** | Discord, Instagram, Twitter growth advice based on your audience. |

### Backlog (Future Ideas)

| Feature | Description |
|---------|-------------|
| **YouTube stream clip generator** | Automatically process stream VODs, detect highlights (chat spikes, viewer peaks, key moments), and generate ready-to-post clips with captions. |
| **A/B title testing** | Test multiple titles and track which performs better. |
| **Collaboration finder** | Suggest creators at similar size for potential collabs. |
| **Revenue tracking & projections** | For monetized channels — track ad revenue, predict growth. |
| **Team features** | Multiple users per channel (editor, manager, creator). |
| **Mobile app** | Native iOS/Android for push notifications and quick check-ins. |
| **Multilingual support** | Georgian, Armenian, and other languages for non-English creators. |
| **Webhook integrations** | Connect to Discord, Slack, Telegram for notifications. |

---

## Tech Stack

| Layer | Technology | Reasoning |
|-------|-----------|-----------|
| **Framework** | Next.js (App Router) | Full-stack, SSR, API routes, already known |
| **Hosting** | Vercel | Free tier, easy deploys, cron jobs built in |
| **Database** | Neon (Postgres) | Serverless Postgres, free tier, already used in UFC Predictor |
| **ORM** | Prisma or Drizzle | Type-safe database queries |
| **Auth** | NextAuth.js / Auth.js | Google OAuth for YouTube, session management |
| **AI** | Claude API (Anthropic) | The coaching brain — system prompts with channel context |
| **YouTube** | YouTube Analytics API + Data API v3 | Channel stats, video data, analytics |
| **Push notifications** | Web Push API + service worker | Proactive check-ins without a native app |
| **Cron jobs** | Vercel Cron | Scheduled analytics pulls, check-in triggers |
| **UI** | Tailwind CSS + shadcn/ui | Clean, minimal design |
| **State** | React state + SWR/React Query | Data fetching and caching |
| **Payments** | Stripe | Subscriptions, free/pro tiers |

---

## Pricing Model

### Free Tier
- Connect 1 YouTube channel
- 5 AI chats per day
- Weekly analytics summary (email or push)
- Basic dashboard (views, subs, top videos)

### Pro ($25/month)
- Unlimited AI chat
- Daily proactive check-ins
- Full analytics dashboard with deep insights
- Goal setting & accountability tracking
- Content strategy recommendations
- Post-stream analysis
- Priority AI responses

### Future: Team ($50/month)
- Everything in Pro
- Multiple team members
- Content calendar
- Notion integration
- Collaboration features

---

## Proactive Check-in System

The core differentiator. Types of proactive notifications:

| Trigger | Message Example | Timing |
|---------|----------------|--------|
| **Post-stream** | "You streamed for 2 hours today. How'd it go? Your peak was 14 concurrent viewers at the 47-minute mark." | 1-2 hours after stream ends |
| **Weekly review** | "Weekly recap: 1,200 views (+15%), CTR at 4.2% (down from 4.8%). Your short outperformed your long-form 3:1. Want to discuss strategy?" | Every Monday morning |
| **Inactivity** | "Hey, you haven't posted in 4 days. Your last video hit 200 views in 24hrs — momentum fades fast. Here's a quick short idea..." | After 3+ days of no upload |
| **Goal check-in** | "You're at 472 subs. 28 to go for your 500 goal. At your current pace you'll hit it in ~2 weeks." | Weekly or when milestone is close |
| **Accountability** | "You said you'd publish 3 shorts this week. It's Friday and you've done 1. What happened?" | When deadline approaches |
| **Analytics alert** | "Your latest video CTR is 6.8% — way above your average of 3.5%. The algorithm is pushing it. Post something NOW to ride the momentum." | When anomaly detected |
| **Trend alert** | "A topic in your niche is trending. 3 creators posted about it this week with 50K+ views each. Want me to draft an angle for you?" | When trending topic detected |
| **Daily/weekly tip** | "This week's theme: Hooks & Intros. Tip 1: The first 5 seconds decide everything. Videos that open with a question get 15% higher retention than ones that open with 'Hey guys, welcome back.'" | Daily (Pro) or Weekly (Free) |

---

## Tips & Learning System

Bite-sized educational tips delivered on a schedule. Keeps users engaged, builds creator knowledge over time, and gives a reason to open the app daily.

### How It Works

- **Weekly themes** — each week focuses on one topic. Daily tips within the week build on each other like a mini-course. Example: "Week of March 3: Thumbnails That Click" → Mon: psychology of thumbnails, Tue: common mistakes, Wed: the 3-second test, Thu: tools and workflow, Fri: analyze your own thumbnails with Forge.
- **Contextual, not random** — tips are influenced by what the creator is actually doing:

| Creator Context | Tip Priority |
|---|---|
| Just uploaded a video | Tips about first-24-hour optimization, sharing strategy |
| Low CTR trend | Thumbnail and title tips |
| Haven't posted in 3+ days | Batch filming, content planning, beating procrastination |
| Just added ideas to bucket | Nichebending, format selection, idea validation |
| New user (first 2 weeks) | Foundational tips: analytics basics, consistency, setting realistic goals |
| Approaching a goal | Mindset tips, momentum strategies |

### Tip Categories

| Category | Example |
|---|---|
| **Quick tactical** | "Videos with faces in thumbnails get 30% more clicks on average. Try adding your reaction face to your next thumbnail." |
| **Framework** | "Nichebending 101: Your niche isn't just your topic — it's your topic + your format. A proven format from another niche could be your breakout video." |
| **Data-backed** | "Channels under 1K subs grow fastest posting 2-3x/week. Daily posting leads to burnout without proportional growth." |
| **Mindset** | "Your 20-view video wasn't a failure. It taught the algorithm about your audience. Every video is a data point." |
| **Platform mechanics** | "YouTube tests your video in waves. A video that flatlines after day 1 can resurge weeks later if retention is strong. Don't delete it." |
| **Production** | "Record in 15-30 second chunks, not long takes. You'll get cleaner delivery and easier edits." |

### Pricing Tier Difference

| Tier | Cadence | Personalization |
|---|---|---|
| **Free** | 1 tip per week (email or push) | Generic — pulled from tip library based on growth stage |
| **Pro** | 1 tip per day (push notification + in-app) | Contextual — tailored to creator's recent activity, analytics, and struggles |

### Implementation

- **Tip library** — curated database of tips, tagged by category, growth stage, and context triggers. Start with 50-100 tips, grow over time.
- **Scheduler** — Vercel cron job delivers tips on schedule. Pro users get contextual matching logic that picks the most relevant tip based on recent activity.
- **In-app display** — tips appear in the dashboard (card/banner) and optionally via push notification. Users can save/bookmark useful tips.

---

## Live Chat Bot System

An AI-powered bot that joins your YouTube live stream chat and auto-answers viewer questions in real time.

### How It Works

1. **Creator starts a stream** — Forge detects an active `liveBroadcast` via YouTube Data API polling (or creator manually toggles "Go Live" in Forge)
2. **Bot connects to live chat** — Uses `liveChatMessages.list` to poll for new messages every 3-5 seconds
3. **AI evaluates each message** — Claude reads the message and decides: answer, ignore, or flag for the creator
4. **Bot responds** — Uses `liveChatMessages.insert` to send the response in chat, prefixed with a bot tag (e.g. `[Forge Bot]`)
5. **Creator can override** — Dashboard shows a live feed of bot activity. Creator can pause the bot, edit responses before they send, or switch to "suggest mode" (bot drafts responses, creator approves)

### Configuration (Creator Sets Up Before Stream)

| Setting | Description | Example |
|---------|-------------|---------|
| **Bot personality** | Tone and style of responses | "Friendly and casual, use emojis sparingly, match the creator's vibe" |
| **Knowledge base** | Custom info the bot should know | Links, project details, tech stack, FAQ answers, social links |
| **Answer rules** | What to respond to | "Answer tech questions, link to GitHub when asked, answer schedule questions" |
| **Ignore rules** | What NOT to respond to | "Don't answer personal questions, don't engage with trolls, skip messages with just emojis" |
| **Escalation rules** | What to flag for the creator | "Flag collab requests, flag bug reports, flag questions you're not confident about" |
| **Rate limiting** | How often the bot can respond | Max 1 response per 10 seconds, max 20 responses per stream, cooldown per user |
| **Response mode** | Auto-send vs suggest | Auto (sends immediately) or Suggest (queues for creator approval) |

### API Requirements

| Endpoint | Purpose |
|----------|---------|
| `liveBroadcasts.list` | Detect active streams |
| `liveChatMessages.list` | Poll for new chat messages |
| `liveChatMessages.insert` | Send bot responses |
| `liveChatModerators.insert` | (Optional) Add bot as moderator for elevated privileges |

Additional OAuth scope needed:
- `youtube.force-ssl` — required for sending messages (read + write to live chat)

### Bot Brain (System Prompt Structure)

```
You are {creator_name}'s live stream assistant bot.

CHANNEL CONTEXT:
- {channel description, niche, subscriber count}

KNOWLEDGE BASE:
- {custom FAQs, links, project info the creator provided}

RULES:
- Answer: {answer rules}
- Ignore: {ignore rules}
- Escalate: {escalation rules}
- Tone: {personality description}

CONSTRAINTS:
- Keep responses under 200 characters (YouTube chat limit)
- Never pretend to be the creator — always respond as the bot
- Never share information not in the knowledge base
- If unsure, say "Great question! I'll flag this for {creator_name}"
```

### Killer Use Cases

- **FAQ machine** — "What tech stack are you using?" gets auto-answered every stream without the creator repeating themselves
- **Link dispenser** — "Can I see the code?" → bot drops the GitHub link instantly
- **Schedule bot** — "When's the next stream?" → bot checks the content calendar and answers
- **Engagement booster** — Bot welcomes new chatters, reacts to super chats, keeps chat alive during quiet moments
- **Moderation assist** — Flags toxic messages for review, auto-ignores spam patterns

### Limitations & Risks

- **YouTube API quota**: `liveChatMessages.list` polling costs quota. At 1 poll per 5 seconds over a 2-hour stream = ~1,440 requests. Need to monitor quota carefully.
- **Rate limits**: YouTube may throttle bot messages if sent too fast. Built-in rate limiting is essential.
- **Message latency**: Polling every 3-5 seconds means responses aren't instant (3-8 second delay including AI processing). Acceptable for most Q&A but noticeable.
- **Bot detection**: YouTube doesn't love bots in chat. Responses should feel natural, not spammy. Rate limiting + quality responses mitigate this.
- **Claude API cost**: Each message = 1 API call. A busy stream with 200 messages = 200 calls. Need to filter (skip emojis, short messages, spam) to keep costs down.

---

## Creator Profile & Context System

The core of what makes Forge feel like a real coach — it knows you deeply and stays current.

### Onboarding (First Session)

When a creator connects their channel, Forge runs an onboarding conversation (not a form). It asks:

1. **Channel basics** — "What's your channel about? Who's your ideal viewer?"
2. **Content style** — "Are you on camera, faceless, or a mix? What format are your videos (tutorials, vlogs, essays, commentary, shorts-only)?"
3. **Creator personality** — "How would you describe your style? Energetic? Calm? Funny? Educational?"
4. **Current state** — "How often are you posting? What's working? What's not?"
5. **Goals** — "Where do you want to be in 3 months? 6 months? What does success look like for you?"
6. **Struggles** — "What's the #1 thing holding you back right now?"
7. **Preferences** — "Do you want speech/delivery coaching? (Forge can analyze your video/stream transcripts for filler words, pacing, clarity)"

This builds a **Creator Profile** stored in the database that the AI references in every interaction.

### Ongoing Context Updates

The AI doesn't just set and forget the profile. It proactively asks follow-up questions to keep context fresh:

- After a video performs differently than expected: "That last video did 3x your average. What did you do differently?"
- When goals are hit or missed: "You hit 500 subs — what's the new target?"
- Periodically: "Last month you said editing was your biggest bottleneck. Still true?"
- When content style shifts: "I noticed your last 3 videos were all shorts. Are you pivoting to shorts-first?"

The coach should feel like it's **paying attention**, not asking the same questions twice.

---

## Ideas Bucket System

Creators always have content ideas floating around — in their head, in Notes apps, scattered everywhere. Forge centralizes this.

### How It Works

- Users can add ideas anytime (in chat: "I have an idea for a video about X" or via a dedicated UI)
- Each idea has a **status**: `💡 Idea` → `📝 Planning` → `🎬 In Progress` → `✅ Published` → `📊 Analyzed`
- Users can add notes, target format (long-form, short, stream), and priority
- The AI sees all ideas and their statuses at all times

### AI Uses the Bucket For

- **Recommendations**: "You have 5 ideas sitting in your bucket. Based on your analytics and what's trending in your niche, I'd prioritize the one about X — here's why."
- **Accountability**: "You moved this idea to 'In Progress' 2 weeks ago. What's blocking you?"
- **Pattern recognition**: "Your last 3 published ideas from the bucket all performed above average. The 2 you skipped were in a different format — good instinct."
- **Trend matching**: When a trending topic aligns with an existing idea, Forge flags it: "That tutorial idea you saved last month? A similar topic is trending right now — this is your window."

### Smart Idea Recommendations

Forge connects three data sources to recommend what to create next:

1. **Channel analytics** — what topics/formats perform best for THIS creator
2. **Trending content** — YouTube API search for trending videos in the creator's niche
3. **Ideas bucket** — what the creator already wants to make

The intersection of all three = the recommendation. "This idea from your bucket matches a trending topic AND aligns with your best-performing format. Do this one next."

---

## Post-Upload & Post-Stream Analysis

After a creator publishes content, Forge automatically analyzes it.

### Post-Upload (Videos)

- Triggered when Forge detects a new video via YouTube Data API
- Pulls early analytics (first 24-48 hours): views, CTR, impressions, retention curve
- AI provides initial read: "Your CTR is 5.2% — above your average. But retention drops at 2:30. What happened at that point in the video?"
- Compares performance to past videos of similar topic/format

### Post-Stream Analysis

- Triggered when Forge detects a stream ended (via liveBroadcast status change)
- Pulls stream analytics: peak concurrent viewers, chat activity, total watch time, average view duration
- AI provides debrief: "Your peak was 14 viewers at the 47-minute mark — that's when you deployed the app. Your audience loves seeing real results."

### Speech & Delivery Coaching (Opt-In)

**This feature is toggled ON/OFF by the creator in settings.** Not everyone wants this.

When enabled:
- Forge pulls the auto-generated transcript from YouTube (available via YouTube Data API captions endpoint)
- AI analyzes for: filler words (um, uh, like, basically, you know), hedging language ("I guess", "maybe"), pacing, clarity of explanations, hook effectiveness
- Delivers specific feedback: "You said 'um' 83 times in this stream. Your clearest segment was 34:00-41:00 when you were debugging live — you're most articulate when reacting to concrete things."
- Tracks improvement over time: "Your filler word count dropped 20% compared to last month. The pause-instead-of-filler technique is working."

When disabled:
- Forge skips transcript analysis entirely. No speech feedback, no filler word counts.
- Content analysis still happens (analytics, performance, strategy) — just not delivery coaching.

---

## Content Format Suggestions & Nichebending

When a creator is covering a topic (especially a saturated one), Forge doesn't just say "make a video about X" — it suggests HOW to present it. This is powered by the **nichebending** concept: your niche = market + format. The market (topic) is fixed, but the format (how you present it) is where untapped opportunity lives.

### Core Concept: Nichebending

A proven strategy where you take a viral format from one market and apply it to a different market where nobody's done it yet.

- **Market** = broad category (fitness, gaming, web dev, cooking, finance). Fixed — can't invent new ones.
- **Format** = the container for content (tier list, "I tried X for 30 days", patch notes, POV NPC, video essay). Infinite and constantly being invented.
- **Nichebend** = proven format + different market = blue ocean opportunity.

**Examples:**
- Nature documentaries + gaming language (tier lists, "patch notes", "current meta") = Tazoo (biology channel that talks like a game reviewer — massive success)
- GTA NPC POV format → bent into Minecraft → bent into Spider-Man → all blew up
- NFL title format ("This will change how you see X forever") → bent into Minecraft → bent into spirituality → all outlier videos

**The one rule:** Don't bend a format you can't deliver expertise in. A dentist can rank toothpaste in a gaming tier list. But don't use a finance format if you don't understand money.

### Format Library

The AI maintains a curated library of proven formats (updated over time):

- **Standard formats**: tutorial, listicle, comparison, reaction, commentary, vlog, challenge, story-driven, essay
- **Presentation styles**: on-camera, screen recording, faceless with voiceover, mixed, text-on-screen, AI-narrated
- **Structural patterns**: hook → problem → solution, "I tried X for 30 days", myth-busting, "X vs Y", ranking, tier list
- **Bendable formats** (proven to work across markets): "Every X explained in Y minutes", tier list / S-tier ranking, "This will change how you see X forever", POV character perspective, patch notes / changelog style, "What happens when you [extreme thing]", documentary-style deep dive, "X ranked by difficulty", day-in-the-life, "I asked [expert] about [topic]"

### How It Works

**Basic (MVP — baked into AI coaching knowledge):**
- When a creator is planning content, Forge suggests format alternatives: "You usually do straight tutorials. For this topic, a 'I tried X for 7 days' format could get 2-3x more clicks based on what's working in other niches."
- When a topic is saturated: "There are already 50 videos on this. Here are 3 formats from other niches that nobody in your space has tried..."
- Based on creator's strengths: "Your reaction-style content gets 40% higher retention than your scripted content. Consider reacting to [trending thing] instead of scripting a video about it."
- Nichebending suggestions: "The 'patch notes' format is huge in gaming right now. Nobody in web dev has done 'JavaScript Framework Patch Notes — What Changed in 2026.' That's an empty square."

**Advanced (V1.5 — format suggestions feature):**
- When a creator adds an idea to the bucket, Forge suggests 2-3 format options: "You could do this as a straight tutorial, a tier list, or a 'I tried every X' challenge. Based on your analytics, challenge-style gets you 2x retention."
- Cross-niche inspiration: "Here's a format that's trending in [other niche] that would work for your topic."

### The Mapping Method (V2 — Trending Format Detection)

Automated version of the nichebending grid:

1. Forge scans YouTube API for viral videos across categories (outlier performance relative to channel size)
2. Extracts the **format pattern** from titles, thumbnails, and structure
3. Checks if anyone in the creator's niche has used that format
4. If no one has → flags it as an **empty square**: "The 'ranked by difficulty' tier list format got 50M+ views across gaming channels this month. Zero web dev channels have done this format. Want to fill that square?"

This turns Forge into a **format radar** — constantly scanning for proven formats the creator can bend into their niche before anyone else does.

---

## AI Brain Architecture

The AI coach uses Claude API with a structured system prompt that includes:

1. **Creator profile** — niche, content style (faceless/on-camera/mixed), personality, posting frequency, preferences, struggles
2. **Recent analytics snapshot** — last 7/28/90 days of key metrics
3. **Goals** — user-defined goals and deadlines
4. **Ideas bucket** — all current ideas with statuses, notes, and priority
5. **Content history** — what they've posted recently, what performed well/poorly
6. **Conversation history** — past coaching conversations (summarized for context window)
7. **Growth stage rules** — different advice depending on channel size
8. **Coaching personality** — direct, strategic, accountable but encouraging
9. **Speech coaching flag** — whether the creator has opted into delivery feedback
10. **Trending context** — recent trending topics/videos in the creator's niche
11. **Format library & nichebending** — proven formats, bendable format patterns, empty square opportunities

The system prompt is rebuilt on each conversation with fresh analytics data injected.

---

## User Flow (MVP)

1. **Sign up** — Google OAuth (same account as YouTube)
2. **Connect channel** — Grant YouTube Analytics + Data API access
3. **Onboarding conversation** — Forge runs a coaching-style first session (not a form). Asks about: niche, content style, on-camera or faceless, personality, goals, current struggles, posting frequency. Asks if they want speech/delivery coaching enabled. Builds the Creator Profile.
4. **Dashboard** — See your key metrics, recent videos, growth trends, ideas bucket
5. **Add ideas** — Drop content ideas into the bucket anytime (via chat or UI). Set status, format, priority.
6. **Chat** — Talk to Forge anytime about strategy, ideas, analytics. AI references your profile, analytics, and ideas bucket in every response.
7. **Get nudged** — Push notifications for check-ins, alerts, accountability, idea reminders, trend alerts
8. **Track progress** — Goals dashboard shows how you're doing over time. AI proactively updates context by asking follow-up questions.

---

## Revenue Projections (Conservative)

| Month | Free Users | Pro Users | MRR |
|-------|-----------|-----------|-----|
| Month 1 (launch) | 50 | 5 | $125 |
| Month 3 | 200 | 25 | $625 |
| Month 6 | 500 | 75 | $1,875 |
| Month 12 | 1,500 | 200 | $5,000 |

Assumptions: 5-10% free-to-pro conversion, organic growth from YouTube channel + product-led growth.

---

## Stream Content Value

Building Forge on stream has strong content potential:

- "Day 1 of building my SaaS" → the hook for the daily streaming streak
- YouTube API integration is interesting to watch (OAuth, data visualization)
- AI prompt engineering for the coaching brain is fascinating content
- Revenue milestones go in stream titles ("$125 MRR — Day 30")
- The product itself helps other creators → viral potential when users share it
- Dog-fooding: using Forge to grow the channel that builds Forge (meta and compelling)

---

## Open Questions

- [ ] Domain availability for "Forge" (forge.app, useforge.com, getforge.com, forgehq.com)
- [ ] YouTube API quota limits — need to understand rate limits for analytics pulls
- [ ] Push notification opt-in rates — what percentage of web users enable push?
- [ ] Claude API costs at scale — estimate cost per user per month for AI coaching
- [ ] Google OAuth verification — YouTube scopes require app review by Google
