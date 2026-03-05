# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Forge** is an AI-powered YouTube growth coach for small creators (0-10K subs). It connects to YouTube Analytics, provides strategic coaching via Claude AI chat, and proactively reaches out with push notifications. The product name is "Forge" and the repo is "ViewFrenzy".

**Status:** In progress. Design doc (`2026-03-01-forge-design.md`) and implementation plan (`2026-03-01-forge-implementation.md`) exist. The Next.js project lives at the repo root (not in a `forge/` subdirectory). The implementation plan contains code snippets for every component — always reference it before writing code.

## Tech Stack

- **Framework:** Next.js 15 (App Router, server components, Turbopack)
- **Language:** TypeScript
- **Database:** Neon PostgreSQL with Prisma ORM
- **Auth:** Auth.js v5 (NextAuth.js) with Google OAuth + YouTube scopes
- **AI:** Anthropic Claude API (Sonnet) with prompt caching
- **UI:** Tailwind CSS + shadcn/ui
- **APIs:** YouTube Data API v3, YouTube Analytics API v2
- **Notifications:** Web Push API + service worker
- **Payments:** Stripe subscriptions
- **Hosting:** Vercel (with cron jobs)

## Commands

All commands run from the repo root (`ViewFrenzy/`):

```bash
npm run dev              # Start dev server (Turbopack)
npx prisma generate      # Regenerate Prisma client after schema changes
npx prisma db push       # Push schema changes to Neon database
npx prisma studio        # Open Prisma database browser
npx shadcn@latest add <component>  # Add a shadcn/ui component
```

## Architecture

### Route Groups
- `src/app/(app)/` — Protected routes (dashboard, chat, goals, ideas, onboarding, settings). Wrapped in auth middleware.
- `src/app/login/` and `src/app/page.tsx` — Public routes (landing page, login).
- `src/app/api/` — API routes for auth, YouTube sync, chat (SSE streaming), goals, ideas, push subscriptions, Stripe webhooks, and cron jobs.

### Key Libraries (`src/lib/`)
- `prisma.ts` — Singleton Prisma client
- `auth.ts` — NextAuth config with Google OAuth + YouTube scopes (`youtube.readonly`, `yt-analytics.readonly`)
- `youtube.ts` — YouTube API service (data sync, analytics fetch, token refresh)
- `ai.ts` — Claude API integration with streaming
- `ai-context.ts` — Builds the system prompt from creator profile, analytics, goals, ideas, and conversation history
- `push.ts` — Web Push notification service
- `stripe.ts` — Stripe subscription management
- `checkins.ts` — Proactive message generator (daily check-in, weekly review, inactivity nudge)
- `event-detector.ts` — Analytics event scanner (new uploads, goal milestones, anomalies)

### Cron Jobs (`src/app/api/cron/`)
Vercel cron endpoints authenticated with `CRON_SECRET`:
- `daily-checkin/` — Morning coaching message (9am)
- `weekly-review/` — Analytics summary (Monday 10am)
- `inactivity-nudge/` — Poke inactive creators (6pm)
- `event-scanner/` — Detect analytics anomalies, milestones, new uploads (every 2 hours)

### Database Models (Prisma)
Core models: User, Account, Session, Channel, ChannelSnapshot, Video, Conversation, Message, Goal, Subscription, PushSubscription, CreatorProfile, Idea. Full schema is in `2026-03-01-forge-implementation.md` Task 2.

## Critical Design Decisions

### AI Prompt Caching
The coaching personality and growth rules are static and cached via Claude's prompt caching. Dynamic creator context (analytics, goals, ideas) is assembled per-request by `ai-context.ts`. Conversations are summarized after 10 messages to prevent token explosion. This is key to cost control.

### Growth-Stage-Aware Coaching
AI advice changes based on subscriber count: 0-100 (consistency focus), 100-500 (identify winners), 500-1K (refine strategy), 1K-5K (CTR/retention), 5K-10K (brand/community). This logic lives in the system prompt built by `ai-context.ts`.

### Proactive Notifications (Core Differentiator)
Two-layer approach: time-based crons (daily/weekly/inactivity) and event-based scanning (uploads, milestones, anomalies). Notifications are sent via Web Push with a service worker at `public/sw.js`.

### YouTube Token Refresh
OAuth tokens stored in the Account model. The YouTube service must handle token expiry and refresh transparently using the stored `refresh_token`.

## Implementation Plan

The implementation plan (`2026-03-01-forge-implementation.md`) has 17 sequenced tasks with exact file paths and code. Follow its task ordering — earlier tasks set up foundations that later tasks depend on. Reference the plan's code snippets as the authoritative starting point for each component.
