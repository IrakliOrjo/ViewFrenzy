# Database Design Decisions

Date: 2026-03-05
Status: Approved

## Database

Supabase PostgreSQL, accessed via Prisma ORM with `@prisma/adapter-pg`. No Supabase client SDK — direct PostgreSQL connection only.

- `DATABASE_URL` — pooled connection (port 6543) for runtime
- `DIRECT_URL` — session connection (port 5432) for migrations

## Schema Decisions

### Conversations & Messages
- Save full message history to the database permanently.
- Users can browse and re-read past coaching conversations.
- Summarization is for the AI only — after ~10 messages, older messages are compressed into a summary for Claude's context window to save tokens. The original messages remain in the DB for the user to read.

### Goals — Numeric Only
- Goals are always numeric and trackable (subscribers, views, video count, CTR, etc.).
- `targetValue`, `currentValue`, and `unit` drive progress bars and auto-tracking from YouTube data.
- Freeform improvement topics ("improve thumbnails", "find my niche") are handled by the AI coach through conversation context, not the Goal model.
- Goals have an optional `deadline` and `calendarEventId` for Google Calendar sync.

### Ideas — Content Pipeline with Scheduling
- Ideas follow a kanban-style pipeline: `idea -> planning -> in_progress -> published -> analyzed`.
- Added `scheduledDate` (when to work on it) and `publishDate` (target publish date) for calendar functionality.
- Added `calendarEventId` for Google Calendar sync.
- When a video is uploaded to YouTube, the cron can match it to an Idea and update `status` to `"published"` with `linkedVideoId` pointing to the Video record.
- The AI tracks idea progress and nudges users about overdue or stale items.

### Google Calendar Integration
- One-way sync: Forge -> Google Calendar. Forge is the source of truth.
- Uses the existing Google OAuth flow with an additional `calendar.events` scope.
- When a user sets a date on an Idea or Goal, Forge can push it to Google Calendar (with user permission).
- Google Calendar handles phone/watch/lock screen notifications — solves the "web app only" limitation.
- No two-way sync in v1. If a user edits the event in Google Calendar, Forge ignores it.
- Requires a new `src/lib/calendar.ts` service with `createCalendarEvent()`, `updateCalendarEvent()`, `deleteCalendarEvent()`.

### Channel — One Per User, Switchable
- `userId` is `@unique` on Channel, enforcing one channel per user.
- Users can disconnect and connect a different channel.
- Old channel data (snapshots, videos) cascade-deletes when the channel is removed.

### Video Analytics — Current Stats Only
- Video records store the latest stats, overwritten on each YouTube sync.
- No per-video time-series snapshots. Channel-level growth is tracked via ChannelSnapshots.
- The AI compares videos against each other to identify what's working — more useful for small creators than per-video timelines.
- YouTube Studio already provides detailed per-video analytics; no need to duplicate it.

### CreatorProfile — Hybrid (Structured + Flexible)
- Key fields as columns: `niche`, `contentStyle`, `postingFrequency` (used for app logic and growth-stage coaching).
- `onboardingAnswers` (JSON) stores all Q&A from the onboarding questionnaire. This allows iterating on questions without schema migrations.
- `onboardingNotes` (Text) stores the AI's summary of the onboarding for quick context.
- Previous fields `personality`, `biggestStruggle`, `speechCoaching` moved into the `onboardingAnswers` JSON.

### Auth Models (User, Account, Session, VerificationToken)
- Standard NextAuth/Auth.js models, unchanged.
- Account stores Google OAuth tokens (`access_token`, `refresh_token`) used by both YouTube and Calendar services.
- VerificationToken kept but unused (no email auth, only Google OAuth).

## Schema Changes Summary

Fields added:
- `Goal.calendarEventId` (String, optional)
- `Idea.scheduledDate` (DateTime, optional)
- `Idea.publishDate` (DateTime, optional)
- `Idea.calendarEventId` (String, optional)
- `CreatorProfile.onboardingAnswers` (Json, optional)

Fields removed:
- `CreatorProfile.personality` (moved to onboardingAnswers JSON)
- `CreatorProfile.biggestStruggle` (moved to onboardingAnswers JSON)
- `CreatorProfile.speechCoaching` (moved to onboardingAnswers JSON)

## New Service Required

`src/lib/calendar.ts` — Google Calendar integration:
- `createCalendarEvent(userId, title, date, description)` — creates event, returns event ID
- `updateCalendarEvent(calendarEventId, updates)` — updates existing event
- `deleteCalendarEvent(calendarEventId)` — removes event from Google Calendar
- Uses existing OAuth tokens from Account model with same token refresh logic as YouTube service
