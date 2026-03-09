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

## Coding Standards & Conventions

### Server vs Client Components

- **Default to React Server Components (RSC).** Every new component should be a server component unless it requires client-side interactivity.
- Only add `"use client"` when the component uses: browser APIs, event handlers (`onClick`, `onChange`, etc.), React hooks (`useState`, `useEffect`, `useRef`, etc.), or third-party client-only libraries.
- When a page needs both server data and client interactivity, keep the page/layout as a server component and push `"use client"` down to the smallest leaf component possible. Example: a dashboard page fetches data server-side and passes it as props to a small `<DashboardChart client />` component.
- Never wrap an entire page in `"use client"` just because one button needs an `onClick`.

### Styling & Class Names

- Use Tailwind CSS for all styling. No inline styles, no CSS modules, no separate CSS files (except `globals.css`).
- Use the `cn()` utility from `@/lib/utils` (which wraps `clsx` + `tailwind-merge`) for all conditional or merged class names. Never use string concatenation or template literals for conditional classes.

```tsx
// Correct
<div className={cn("rounded-lg p-4", isActive && "bg-primary text-white", className)} />
// Wrong — no manual string building
<div className={`rounded-lg p-4 ${isActive ? "bg-primary text-white" : ""}`} />
```

- shadcn/ui components are the default building blocks. Check if a shadcn component exists before building a custom one. Add new shadcn components with `npx shadcn@latest add <component>`.

### Project Folder Structure

```
src/
├── app/                # Next.js App Router (pages, layouts, API routes)
│   ├── (app)/          # Protected route group
│   ├── api/            # API routes
│   ├── login/          # Public auth pages
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx        # Landing page
├── components/         # Shared/reusable components (PascalCase folders & files)
│   ├── ui/             # shadcn/ui primitives (managed by CLI, don't manually edit)
│   └── [Feature]/      # Each component in its own PascalCase folder (e.g., components/Header/Header.tsx)
├── constants/          # App-wide constants and enums (no runtime logic)
├── helpers/            # Pure utility functions (formatting, validation, transforms)
├── hooks/              # Global custom React hooks (usable across multiple features)
├── lib/                # External service integrations (prisma, auth, ai, youtube, stripe, push)
├── providers/          # React context providers (theme, session, etc.)
├── theme/              # Theme configuration, design tokens, color definitions
├── types/              # Shared TypeScript types and interfaces
└── variables/          # Environment variable schemas and runtime config
```

### Component Architecture — Separation of Concerns

**Rule: Components render UI. Everything else lives somewhere else.**

1. **No business logic in generic components.** A `<Card>` or `<StatDisplay>` should accept data via props and render it. It should never fetch data, transform API responses, or contain domain-specific conditionals. Feature-specific logic belongs in page components or dedicated feature components.

2. **Extract `useEffect` and stateful logic into custom hooks.** If a component has more than one `useEffect`, or any `useEffect` longer than 3 lines, extract it into a custom hook.

```tsx
// Wrong — logic tangled in component
function VideoList() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    fetch("/api/videos")
      .then(res => res.json())
      .then(data => { setVideos(data); setLoading(false); })
      .catch(err => { setError(err); setLoading(false); });
  }, []);
  // ... 30 more lines
}

// Correct — hook extracted
function VideoList() {
  const { videos, loading, error } = useVideos();
  // pure rendering
}
```

3. **Hook placement follows scope:**
   - If a hook is used by **multiple features** → `src/hooks/` (e.g., `useDebounce`, `useMediaQuery`, `useLocalStorage`)
   - If a hook is used only within **one feature/page** → colocate it next to that feature (e.g., `src/app/(app)/dashboard/hooks/useDashboardStats.ts`)

4. **Extract helper functions out of components.** If a component contains pure functions (data formatting, calculations, sorting, filtering) that don't use React hooks or state, move them out:
   - If the helper is **feature-specific** → create a `helpers/` folder next to the component (e.g., `src/app/(app)/dashboard/helpers/formatAnalytics.ts`)
   - If the helper is **reusable across features** → `src/helpers/` (e.g., `getUserInitials.ts`, `formatNumber.ts`, `formatDate.ts`)

5. **Extract data/config arrays out of components.** Route definitions, nav items, option lists, dropdown choices, and similar static data must not be defined inside component files. Place them in `src/constants/` (e.g., `src/constants/navigation.ts`).

6. **Extract sub-components into a `components/` subfolder.** If a component file contains helper components (e.g., a `NavLinks` rendered inside `Header`), extract them into `ComponentFolder/components/SubComponent.tsx`. The parent component should only compose — not define — its children.

### Component Decomposition

**Rule: If a component file exceeds ~80-100 lines of JSX, break it down.**

- When breaking down a component, create a `components/` subfolder inside the feature folder and place child components there:

```
src/app/(app)/dashboard/
├── page.tsx                        # Main page (server component, data fetching)
├── components/
│   ├── DashboardHeader.tsx         # Section component
│   ├── StatsGrid.tsx               # Section component
│   ├── RecentVideosTable.tsx       # Section component
│   └── GrowthChart.tsx             # Client component (interactive chart)
├── hooks/
│   └── useDashboardFilters.ts      # Client hook for filter state
└── helpers/
    └── calculateGrowthRate.ts      # Pure function
```

- Name child components descriptively — `StatsGrid.tsx`, not `Grid.tsx`. The name should convey what the component *does*, not what it *is*.
- Each decomposed component should be independently understandable. It should not require reading 3 other files to understand what it renders.
- Use PascalCase for component files and folders (`GrowthChart.tsx`, `Header/Header.tsx`).

### TypeScript

- Strict TypeScript everywhere. No `any` types — use `unknown` if the type is genuinely uncertain, then narrow.
- Define shared types in `src/types/`. Feature-local types can live in the component file or a colocated `types.ts`.
- Prefer `interface` for object shapes that may be extended, `type` for unions, intersections, and utility types.
- **Exported interfaces** that are shared/reused across files must be prefixed with `I` (e.g., `export interface IChannelInfo`, `export interface INavItem`). Local-only interfaces (used only within the same file) do not require the `I` prefix.
- Props types are defined as `interface` and named `ComponentNameProps` (e.g., `interface HeaderProps`). Props interfaces are local by convention and do not need the `I` prefix.

### Imports & Naming

- Use the `@/` path alias for all imports (already configured as `src/`). Never use relative paths like `../../components`.
- Use named exports for components, not default exports (except for Next.js pages/layouts which require default exports).
- React component files and folders use PascalCase (`Header.tsx`, `StatsGrid.tsx`). Hooks use `use` prefix with camelCase (`useDashboardFilters.ts`). Helpers use camelCase (`calculateGrowthRate.ts`). Constants use UPPER_SNAKE_CASE.

### Error Handling & Loading States

- Server components: use Next.js `error.tsx` and `loading.tsx` boundary files.
- Client components: handle loading/error states explicitly — never render empty or broken UI.
- API routes: always return structured JSON errors with appropriate HTTP status codes. Use try/catch with typed error responses.

### Performance Defaults

- Prefer server-side data fetching over client-side `useEffect` + `fetch`.
- Use Next.js `Suspense` boundaries for streaming long-running server data.
- Images use `next/image` with explicit `width`/`height` or `fill`.
- Avoid importing large libraries client-side. If needed, use `next/dynamic` with `ssr: false`.
