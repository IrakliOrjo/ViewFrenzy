# Forge MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the MVP of Forge — an AI YouTube growth coach web app that connects to YouTube Analytics, provides strategic advice via AI chat, and proactively nudges creators with push notifications.

**Architecture:** Next.js App Router with server components and API routes. Google OAuth for auth (with YouTube scopes). Prisma ORM with Neon Postgres. Claude API for the coaching brain. Web Push for proactive notifications. Vercel cron for scheduled tasks. Stripe for subscriptions.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Prisma, Neon (Postgres), NextAuth.js (Auth.js v5), Anthropic Claude API, YouTube Data API v3, YouTube Analytics API, web-push, Stripe, Vercel

---

## Task 1: Project Setup

**Files:**
- Create: `forge/` (new Next.js project root)
- Create: `forge/.env.local`
- Create: `forge/.gitignore`

**Step 1: Create the Next.js project**

Run from the YT Assistant root:
```bash
npx create-next-app@latest forge --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack
```

Select defaults for all prompts.

**Step 2: Install core dependencies**

```bash
cd forge
npm install @prisma/client next-auth @auth/prisma-adapter @anthropic-ai/sdk googleapis web-push stripe
npm install -D prisma @types/web-push
```

**Step 3: Install shadcn/ui**

```bash
npx shadcn@latest init -d
```

Then add the components we'll use:
```bash
npx shadcn@latest add button card input textarea avatar badge dialog dropdown-menu separator sheet tabs toast scroll-area chart
```

**Step 4: Create .env.local**

```env
# Database
DATABASE_URL="postgresql://..."

# Auth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET=""

# YouTube API
YOUTUBE_API_KEY=""

# Claude API
ANTHROPIC_API_KEY=""

# Web Push (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=""
VAPID_PRIVATE_KEY=""
VAPID_EMAIL="mailto:your@email.com"

# Stripe
STRIPE_SECRET_KEY=""
STRIPE_PUBLISHABLE_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_PRO_PRICE_ID=""
```

**Step 5: Generate NEXTAUTH_SECRET**

```bash
npx auth secret
```

**Step 6: Commit**

```bash
git add forge/
git commit -m "feat: initialize Forge Next.js project with dependencies"
```

---

## Task 2: Database Schema

**Files:**
- Create: `forge/prisma/schema.prisma`

> **IMPORTANT:** This schema includes the `Idea` and `CreatorProfile` models needed for the Ideas Bucket (Task 9b) and Creator Progress Tracking (Task 11b). They are defined here so the database is set up correctly from day one.

**Step 1: Set up Neon database**

Go to https://neon.tech, create a new project called "forge". Copy the connection string to `.env.local` as `DATABASE_URL`.

**Step 2: Write the Prisma schema**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
  channel       Channel?
  conversations Conversation[]
  goals         Goal[]
  subscription  Subscription?
  pushSubscriptions PushSubscription[]
  creatorProfile CreatorProfile?
  ideas         Idea[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model Channel {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  youtubeId       String   @unique
  title           String
  description     String?  @db.Text
  thumbnailUrl    String?
  subscriberCount Int      @default(0)
  videoCount      Int      @default(0)
  viewCount       BigInt   @default(0)
  snapshots       ChannelSnapshot[]
  videos          Video[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model ChannelSnapshot {
  id              String   @id @default(cuid())
  channelId       String
  channel         Channel  @relation(fields: [channelId], references: [id], onDelete: Cascade)
  subscriberCount Int
  videoCount      Int
  viewCount       BigInt
  date            DateTime @default(now())

  @@index([channelId, date])
}

model Video {
  id            String   @id @default(cuid())
  channelId     String
  channel       Channel  @relation(fields: [channelId], references: [id], onDelete: Cascade)
  youtubeId     String   @unique
  title         String
  description   String?  @db.Text
  thumbnailUrl  String?
  publishedAt   DateTime
  duration      String?
  viewCount     Int      @default(0)
  likeCount     Int      @default(0)
  commentCount  Int      @default(0)
  // Analytics data (from YouTube Analytics API)
  impressions       Int?
  ctr               Float?
  avgViewDuration   Float?
  avgViewPercentage Float?
  estimatedMinutesWatched Float?
  // Traffic sources stored as JSON
  trafficSources    Json?
  // Demographics stored as JSON
  demographics      Json?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([channelId, publishedAt])
}

model Conversation {
  id       String    @id @default(cuid())
  userId   String
  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  title    String?
  messages Message[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Message {
  id             String       @id @default(cuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  role           String       // "user" | "assistant"
  content        String       @db.Text
  createdAt      DateTime     @default(now())

  @@index([conversationId, createdAt])
}

model Goal {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title       String
  description String?  @db.Text
  targetValue Float?
  currentValue Float?
  unit        String?  // "subscribers", "videos", "views"
  deadline    DateTime?
  completed   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Subscription {
  id                   String   @id @default(cuid())
  userId               String   @unique
  user                 User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  stripeCustomerId     String?  @unique
  stripeSubscriptionId String?  @unique
  stripePriceId        String?
  status               String   @default("free") // "free" | "pro" | "cancelled"
  currentPeriodEnd     DateTime?
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}

model PushSubscription {
  id       String @id @default(cuid())
  userId   String
  user     User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  endpoint String @db.Text
  p256dh   String
  auth     String
  createdAt DateTime @default(now())

  @@unique([userId, endpoint])
}

model CreatorProfile {
  id                String   @id @default(cuid())
  userId            String   @unique
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  niche             String?  // e.g. "web development", "gaming", "fitness"
  contentStyle      String?  // "on-camera" | "faceless" | "mixed"
  personality       String?  @db.Text // how they describe their style
  postingFrequency  String?  // "daily" | "3x/week" | "weekly" | "irregular"
  biggestStruggle   String?  @db.Text
  speechCoaching    Boolean  @default(false) // opt-in for delivery feedback
  onboardingNotes   String?  @db.Text // AI's notes from onboarding conversation
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model Idea {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title       String
  description String?  @db.Text
  status      String   @default("idea") // "idea" | "planning" | "in_progress" | "published" | "analyzed"
  format      String?  // "long-form" | "short" | "stream" | "tutorial" | "challenge"
  priority    String?  @default("medium") // "low" | "medium" | "high"
  notes       String?  @db.Text
  linkedVideoId String? // link to Video when published
  linkedVideo Video?   @relation(fields: [linkedVideoId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId, status])
}
```

**Step 3: Generate Prisma client and push schema**

```bash
cd forge
npx prisma generate
npx prisma db push
```

**Step 4: Create Prisma client singleton**

Create `forge/src/lib/prisma.ts`:
```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

**Step 5: Commit**

```bash
git add forge/prisma/ forge/src/lib/prisma.ts
git commit -m "feat: add Prisma schema with all MVP models"
```

---

## Task 3: Authentication (Google OAuth + YouTube Scopes)

**Files:**
- Create: `forge/src/lib/auth.ts`
- Create: `forge/src/app/api/auth/[...nextauth]/route.ts`
- Modify: `forge/src/app/layout.tsx` (add session provider)

**Prerequisites:** Create a Google Cloud project at https://console.cloud.google.com, enable YouTube Data API v3 and YouTube Analytics API, create OAuth 2.0 credentials (Web application), add `http://localhost:3000/api/auth/callback/google` as authorized redirect URI. Copy Client ID and Secret to `.env.local`.

**Step 1: Configure Auth.js**

Create `forge/src/lib/auth.ts`:
```typescript
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/youtube.readonly",
            "https://www.googleapis.com/auth/yt-analytics.readonly",
          ].join(" "),
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});
```

**Step 2: Create the auth route handler**

Create `forge/src/app/api/auth/[...nextauth]/route.ts`:
```typescript
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

**Step 3: Create session provider wrapper**

Create `forge/src/components/providers.tsx`:
```typescript
"use client";

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

**Step 4: Update root layout to include providers**

Modify `forge/src/app/layout.tsx` — wrap `{children}` with `<Providers>`.

**Step 5: Create a sign-in page**

Create `forge/src/app/login/page.tsx` — simple page with a "Sign in with Google" button that calls `signIn("google")`.

**Step 6: Create auth middleware**

Create `forge/src/middleware.ts`:
```typescript
export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: ["/dashboard/:path*", "/chat/:path*", "/api/youtube/:path*", "/api/chat/:path*"],
};
```

**Step 7: Test auth flow**

Run `npm run dev`, navigate to `/login`, sign in with Google, verify YouTube scopes are requested, verify user is created in DB.

**Step 8: Commit**

```bash
git add forge/src/lib/auth.ts forge/src/app/api/auth/ forge/src/components/providers.tsx forge/src/middleware.ts forge/src/app/login/ forge/src/app/layout.tsx
git commit -m "feat: add Google OAuth with YouTube Analytics scopes"
```

---

## Task 4: YouTube Data Service

**Files:**
- Create: `forge/src/lib/youtube.ts`
- Create: `forge/src/app/api/youtube/sync/route.ts`

**Step 1: Create YouTube service**

Create `forge/src/lib/youtube.ts`:
```typescript
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

function getOAuthClient(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({ access_token: accessToken });
  return oauth2Client;
}

export async function getAccessToken(userId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
  });
  if (!account?.access_token) return null;

  // Check if token is expired and refresh if needed
  if (account.expires_at && account.expires_at * 1000 < Date.now()) {
    if (!account.refresh_token) return null;

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ refresh_token: account.refresh_token });

    const { credentials } = await oauth2Client.refreshAccessToken();

    await prisma.account.update({
      where: { id: account.id },
      data: {
        access_token: credentials.access_token,
        expires_at: credentials.expiry_date
          ? Math.floor(credentials.expiry_date / 1000)
          : null,
      },
    });

    return credentials.access_token ?? null;
  }

  return account.access_token;
}

export async function fetchChannelInfo(accessToken: string) {
  const auth = getOAuthClient(accessToken);
  const youtube = google.youtube({ version: "v3", auth });

  const response = await youtube.channels.list({
    part: ["snippet", "statistics"],
    mine: true,
  });

  const channel = response.data.items?.[0];
  if (!channel) return null;

  return {
    youtubeId: channel.id!,
    title: channel.snippet?.title ?? "",
    description: channel.snippet?.description ?? "",
    thumbnailUrl: channel.snippet?.thumbnails?.default?.url ?? "",
    subscriberCount: parseInt(channel.statistics?.subscriberCount ?? "0"),
    videoCount: parseInt(channel.statistics?.videoCount ?? "0"),
    viewCount: BigInt(channel.statistics?.viewCount ?? "0"),
  };
}

export async function fetchRecentVideos(accessToken: string, channelId: string, maxResults = 20) {
  const auth = getOAuthClient(accessToken);
  const youtube = google.youtube({ version: "v3", auth });

  // Get video IDs from search
  const searchResponse = await youtube.search.list({
    part: ["id"],
    channelId,
    order: "date",
    maxResults,
    type: ["video"],
  });

  const videoIds = searchResponse.data.items
    ?.map((item) => item.id?.videoId)
    .filter(Boolean) as string[];

  if (!videoIds?.length) return [];

  // Get full video details
  const videosResponse = await youtube.videos.list({
    part: ["snippet", "statistics", "contentDetails"],
    id: videoIds,
  });

  return (videosResponse.data.items ?? []).map((video) => ({
    youtubeId: video.id!,
    title: video.snippet?.title ?? "",
    description: video.snippet?.description ?? "",
    thumbnailUrl: video.snippet?.thumbnails?.medium?.url ?? "",
    publishedAt: new Date(video.snippet?.publishedAt ?? ""),
    duration: video.contentDetails?.duration ?? "",
    viewCount: parseInt(video.statistics?.viewCount ?? "0"),
    likeCount: parseInt(video.statistics?.likeCount ?? "0"),
    commentCount: parseInt(video.statistics?.commentCount ?? "0"),
  }));
}

export async function fetchVideoAnalytics(
  accessToken: string,
  channelId: string,
  startDate: string,
  endDate: string
) {
  const auth = getOAuthClient(accessToken);
  const youtubeAnalytics = google.youtubeAnalytics({ version: "v2", auth });

  const response = await youtubeAnalytics.reports.query({
    ids: `channel==${channelId}`,
    startDate,
    endDate,
    metrics: "views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,subscribersGained,subscribersLost,likes,comments,shares,impressions,impressionClickThroughRate",
    dimensions: "video",
    sort: "-views",
    maxResults: 50,
  });

  return response.data.rows?.map((row) => ({
    videoId: row[0] as string,
    views: row[1] as number,
    estimatedMinutesWatched: row[2] as number,
    avgViewDuration: row[3] as number,
    avgViewPercentage: row[4] as number,
    subsGained: row[5] as number,
    subsLost: row[6] as number,
    likes: row[7] as number,
    comments: row[8] as number,
    shares: row[9] as number,
    impressions: row[10] as number,
    ctr: row[11] as number,
  })) ?? [];
}

export async function fetchChannelAnalyticsSummary(
  accessToken: string,
  channelId: string,
  startDate: string,
  endDate: string
) {
  const auth = getOAuthClient(accessToken);
  const youtubeAnalytics = google.youtubeAnalytics({ version: "v2", auth });

  const response = await youtubeAnalytics.reports.query({
    ids: `channel==${channelId}`,
    startDate,
    endDate,
    metrics: "views,estimatedMinutesWatched,averageViewDuration,subscribersGained,subscribersLost,likes,shares,impressions,impressionClickThroughRate",
  });

  const row = response.data.rows?.[0];
  if (!row) return null;

  return {
    views: row[0] as number,
    estimatedMinutesWatched: row[1] as number,
    avgViewDuration: row[2] as number,
    subsGained: row[3] as number,
    subsLost: row[4] as number,
    likes: row[5] as number,
    shares: row[6] as number,
    impressions: row[7] as number,
    ctr: row[8] as number,
  };
}

export async function fetchTrafficSources(
  accessToken: string,
  channelId: string,
  startDate: string,
  endDate: string
) {
  const auth = getOAuthClient(accessToken);
  const youtubeAnalytics = google.youtubeAnalytics({ version: "v2", auth });

  const response = await youtubeAnalytics.reports.query({
    ids: `channel==${channelId}`,
    startDate,
    endDate,
    metrics: "views,estimatedMinutesWatched",
    dimensions: "insightTrafficSourceType",
    sort: "-views",
  });

  return response.data.rows?.map((row) => ({
    source: row[0] as string,
    views: row[1] as number,
    minutesWatched: row[2] as number,
  })) ?? [];
}
```

**Step 2: Create sync API route**

Create `forge/src/app/api/youtube/sync/route.ts`:
```typescript
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getAccessToken,
  fetchChannelInfo,
  fetchRecentVideos,
  fetchVideoAnalytics,
  fetchChannelAnalyticsSummary,
} from "@/lib/youtube";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = await getAccessToken(session.user.id);
  if (!accessToken) {
    return NextResponse.json({ error: "No YouTube access" }, { status: 403 });
  }

  // Fetch channel info
  const channelInfo = await fetchChannelInfo(accessToken);
  if (!channelInfo) {
    return NextResponse.json({ error: "No channel found" }, { status: 404 });
  }

  // Upsert channel
  const channel = await prisma.channel.upsert({
    where: { userId: session.user.id },
    update: {
      title: channelInfo.title,
      description: channelInfo.description,
      thumbnailUrl: channelInfo.thumbnailUrl,
      subscriberCount: channelInfo.subscriberCount,
      videoCount: channelInfo.videoCount,
      viewCount: channelInfo.viewCount,
    },
    create: {
      userId: session.user.id,
      youtubeId: channelInfo.youtubeId,
      title: channelInfo.title,
      description: channelInfo.description,
      thumbnailUrl: channelInfo.thumbnailUrl,
      subscriberCount: channelInfo.subscriberCount,
      videoCount: channelInfo.videoCount,
      viewCount: channelInfo.viewCount,
    },
  });

  // Save channel snapshot
  await prisma.channelSnapshot.create({
    data: {
      channelId: channel.id,
      subscriberCount: channelInfo.subscriberCount,
      videoCount: channelInfo.videoCount,
      viewCount: channelInfo.viewCount,
    },
  });

  // Fetch and upsert recent videos
  const videos = await fetchRecentVideos(accessToken, channelInfo.youtubeId);
  for (const video of videos) {
    await prisma.video.upsert({
      where: { youtubeId: video.youtubeId },
      update: {
        title: video.title,
        viewCount: video.viewCount,
        likeCount: video.likeCount,
        commentCount: video.commentCount,
      },
      create: {
        channelId: channel.id,
        ...video,
      },
    });
  }

  // Fetch analytics for last 28 days
  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const videoAnalytics = await fetchVideoAnalytics(
    accessToken,
    channelInfo.youtubeId,
    startDate,
    endDate
  );

  // Update video analytics
  for (const analytics of videoAnalytics) {
    await prisma.video.updateMany({
      where: { youtubeId: analytics.videoId },
      data: {
        impressions: analytics.impressions,
        ctr: analytics.ctr,
        avgViewDuration: analytics.avgViewDuration,
        avgViewPercentage: analytics.avgViewPercentage,
        estimatedMinutesWatched: analytics.estimatedMinutesWatched,
      },
    });
  }

  return NextResponse.json({ success: true, channel, videoCount: videos.length });
}
```

**Step 3: Test by calling POST /api/youtube/sync after auth**

**Step 4: Commit**

```bash
git add forge/src/lib/youtube.ts forge/src/app/api/youtube/
git commit -m "feat: add YouTube Data + Analytics API integration with sync endpoint"
```

---

## Task 5: App Layout & Navigation Shell

**Files:**
- Create: `forge/src/app/(app)/layout.tsx` (authenticated app layout)
- Create: `forge/src/components/sidebar.tsx`
- Create: `forge/src/components/header.tsx`
- Create: `forge/src/app/(app)/dashboard/page.tsx` (placeholder)
- Create: `forge/src/app/(app)/chat/page.tsx` (placeholder)
- Create: `forge/src/app/(app)/goals/page.tsx` (placeholder)
- Create: `forge/src/app/(app)/settings/page.tsx` (placeholder)

**Step 1: Create the app layout with sidebar**

The `(app)` route group wraps all authenticated pages. The layout includes:
- A sidebar with navigation links: Dashboard, Chat, Goals, Settings
- A header with user avatar + channel name + sign out
- The sidebar shows the connected channel thumbnail and subscriber count
- Mobile-responsive: sidebar collapses to a sheet on small screens

Use shadcn/ui `Sheet` for mobile menu, `Avatar` for user image, `Button` for nav links, `Separator` between sections.

Navigation items:
- Dashboard (LayoutDashboard icon)
- Chat (MessageSquare icon)
- Goals (Target icon)
- Settings (Settings icon)

Install lucide-react if not already: `npm install lucide-react`

**Step 2: Create placeholder pages**

Each page should just render a heading for now: "Dashboard", "Chat", "Goals", "Settings".

**Step 3: Add channel connection flow**

If the user has no channel connected yet (no Channel record in DB), show an onboarding card in the dashboard: "Connect your YouTube channel" with a button that calls POST `/api/youtube/sync`.

**Step 4: Test navigation and layout**

Run dev server, verify sidebar works, navigation works, mobile menu works.

**Step 5: Commit**

```bash
git add forge/src/app/\(app\)/ forge/src/components/
git commit -m "feat: add app layout with sidebar, header, and navigation shell"
```

---

## Task 6: Analytics Dashboard

**Files:**
- Create: `forge/src/app/(app)/dashboard/page.tsx`
- Create: `forge/src/app/api/youtube/analytics/route.ts`
- Create: `forge/src/components/dashboard/stats-cards.tsx`
- Create: `forge/src/components/dashboard/views-chart.tsx`
- Create: `forge/src/components/dashboard/top-videos.tsx`
- Create: `forge/src/components/dashboard/traffic-sources.tsx`

**Step 1: Create analytics API route**

`GET /api/youtube/analytics` — returns:
- Channel summary (last 7 days + last 28 days for comparison)
- Top 10 videos by views (with CTR, retention, impressions)
- Traffic sources breakdown
- Subscriber growth (from snapshots)

Fetch fresh data from YouTube Analytics API if last sync was >1 hour ago, otherwise serve from DB.

**Step 2: Build stats cards component**

Four cards in a grid:
- **Views** (last 7 days) with % change vs previous 7 days
- **Subscribers** with net change
- **CTR** average with trend
- **Watch Time** in hours with trend

Use shadcn `Card` component. Green/red arrows for trends.

**Step 3: Build views chart**

Line chart showing daily views for the last 28 days. Use shadcn/ui `Chart` component (which wraps Recharts).

Query YouTube Analytics API with `day` dimension for daily breakdown:
```
metrics: views,estimatedMinutesWatched
dimensions: day
startDate: 28 days ago
endDate: today
```

**Step 4: Build top videos table**

Table showing last 10 videos with columns: Thumbnail, Title, Views, CTR, Avg View Duration, Impressions. Sorted by publish date (newest first).

**Step 5: Build traffic sources chart**

Pie or bar chart showing traffic source breakdown: Browse, Search, Suggested, External, etc.

**Step 6: Compose the dashboard page**

Assemble all components on the dashboard page:
1. Stats cards (top row)
2. Views chart (full width)
3. Top videos table + Traffic sources chart (two columns)

**Step 7: Test with real YouTube data**

**Step 8: Commit**

```bash
git add forge/src/app/\(app\)/dashboard/ forge/src/app/api/youtube/analytics/ forge/src/components/dashboard/
git commit -m "feat: add analytics dashboard with stats, charts, and top videos"
```

---

## Task 7: AI Chat — Claude Integration (with Prompt Caching & Context Management)

**Files:**
- Create: `forge/src/lib/ai.ts`
- Create: `forge/src/lib/ai-context.ts`
- Create: `forge/src/app/api/chat/route.ts`

> **KEY DESIGN DECISIONS:**
> - Uses **Claude prompt caching** to cut input costs by ~50% on follow-up messages
> - Implements **conversation summarization** to keep long chats manageable (compresses after 10 messages)
> - Builds the system prompt in **two layers**: a static cacheable block (coaching personality, format library, growth rules) and a dynamic block (analytics, goals, ideas, progress narrative)
> - Includes **creator profile, ideas bucket, and progress narrative** in the system prompt so the AI knows the user deeply

**Step 1: Create the AI context builder**

Create `forge/src/lib/ai-context.ts`:

This module builds the full context that gets injected into the system prompt. It assembles:

1. **Creator profile** — niche, content style, personality, struggles, speech coaching preference (from `CreatorProfile` model)
2. **Channel analytics snapshot** — subscribers, views, CTR, recent trends (from `Channel` + `ChannelSnapshot`)
3. **Recent videos with performance** — last 10 videos with views, CTR, retention (from `Video`)
4. **Active goals** — what the user is working toward and progress (from `Goal`)
5. **Ideas bucket** — all current ideas with statuses (from `Idea`)
6. **Progress narrative** — a text summary of the user's journey: "When you joined Forge on [date] you had X subs. Now you have Y subs (+Z%). Your best-performing video was [title] with [views] views. You've published N videos since joining. Your average CTR improved from X% to Y%." (computed from `ChannelSnapshot` history)
7. **Conversation summary** — compressed summary of older messages in the current conversation (if conversation has 10+ messages)

```typescript
import { prisma } from "@/lib/prisma";

export async function buildCreatorContext(userId: string): Promise<string> {
  // Fetch all user data in parallel
  const [channel, goals, ideas, profile] = await Promise.all([
    prisma.channel.findUnique({
      where: { userId },
      include: {
        videos: { orderBy: { publishedAt: "desc" }, take: 10 },
        snapshots: { orderBy: { date: "desc" }, take: 30 },
      },
    }),
    prisma.goal.findMany({ where: { userId, completed: false } }),
    prisma.idea.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    prisma.creatorProfile.findUnique({ where: { userId } }),
  ]);

  let context = "";

  // Creator profile
  if (profile) {
    context += `\n## Creator Profile\n`;
    context += `- **Niche**: ${profile.niche ?? "Not set"}\n`;
    context += `- **Content Style**: ${profile.contentStyle ?? "Not set"}\n`;
    context += `- **Personality**: ${profile.personality ?? "Not set"}\n`;
    context += `- **Posting Frequency**: ${profile.postingFrequency ?? "Not set"}\n`;
    context += `- **Biggest Struggle**: ${profile.biggestStruggle ?? "Not shared"}\n`;
    context += `- **Speech Coaching**: ${profile.speechCoaching ? "ENABLED — analyze transcripts for filler words, pacing, clarity" : "DISABLED — skip delivery feedback"}\n`;
    if (profile.onboardingNotes) {
      context += `- **Notes from onboarding**: ${profile.onboardingNotes}\n`;
    }
  }

  // Channel data
  if (channel) {
    context += `\n## Connected YouTube Channel\n`;
    context += `- **Name**: ${channel.title}\n`;
    context += `- **Subscribers**: ${channel.subscriberCount.toLocaleString()}\n`;
    context += `- **Total Views**: ${channel.viewCount.toLocaleString()}\n`;
    context += `- **Videos**: ${channel.videoCount}\n`;

    // Recent videos
    context += `\n## Recent Videos (last 10)\n`;
    context += channel.videos.map((v) =>
      `- "${v.title}" — ${v.viewCount.toLocaleString()} views, ${v.likeCount} likes, CTR: ${v.ctr ? (v.ctr * 100).toFixed(1) + "%" : "N/A"}, Avg retention: ${v.avgViewPercentage ? v.avgViewPercentage.toFixed(1) + "%" : "N/A"}`
    ).join("\n");

    // Progress narrative (computed from snapshots)
    if (channel.snapshots.length >= 2) {
      const oldest = channel.snapshots[channel.snapshots.length - 1];
      const newest = channel.snapshots[0];
      const subGrowth = newest.subscriberCount - oldest.subscriberCount;
      const subGrowthPct = oldest.subscriberCount > 0
        ? ((subGrowth / oldest.subscriberCount) * 100).toFixed(1)
        : "N/A";
      const daysSinceStart = Math.floor(
        (newest.date.getTime() - oldest.date.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Find best-performing video
      const bestVideo = channel.videos.reduce((best, v) =>
        v.viewCount > (best?.viewCount ?? 0) ? v : best,
        channel.videos[0]
      );

      context += `\n\n## Progress Since Joining Forge\n`;
      context += `- **Tracking period**: ${daysSinceStart} days\n`;
      context += `- **Subscriber growth**: ${oldest.subscriberCount.toLocaleString()} → ${newest.subscriberCount.toLocaleString()} (${subGrowth >= 0 ? "+" : ""}${subGrowth}, ${subGrowthPct}%)\n`;
      if (bestVideo) {
        context += `- **Best-performing video**: "${bestVideo.title}" — ${bestVideo.viewCount.toLocaleString()} views\n`;
      }
    }

    // Subscriber trend
    context += `\n## Subscriber Trend (last 7 snapshots)\n`;
    context += channel.snapshots.slice(0, 7).map((s) =>
      `- ${s.date.toISOString().split("T")[0]}: ${s.subscriberCount.toLocaleString()} subs`
    ).join("\n");
  }

  // Goals
  if (goals.length) {
    context += `\n\n## Active Goals\n`;
    context += goals.map((g) =>
      `- **${g.title}**: ${g.currentValue ?? "?"}/${g.targetValue ?? "?"} ${g.unit ?? ""} ${g.deadline ? `(deadline: ${g.deadline.toISOString().split("T")[0]})` : ""}`
    ).join("\n");
  }

  // Ideas bucket
  if (ideas.length) {
    context += `\n\n## Ideas Bucket\n`;
    const byStatus = {
      idea: ideas.filter((i) => i.status === "idea"),
      planning: ideas.filter((i) => i.status === "planning"),
      in_progress: ideas.filter((i) => i.status === "in_progress"),
      published: ideas.filter((i) => i.status === "published"),
    };
    if (byStatus.in_progress.length) {
      context += `\n### In Progress\n`;
      context += byStatus.in_progress.map((i) =>
        `- "${i.title}" (${i.format ?? "unset format"}, priority: ${i.priority ?? "medium"}) — started ${i.updatedAt.toISOString().split("T")[0]}${i.notes ? ` — notes: ${i.notes}` : ""}`
      ).join("\n");
    }
    if (byStatus.planning.length) {
      context += `\n### Planning\n`;
      context += byStatus.planning.map((i) =>
        `- "${i.title}" (${i.format ?? "unset format"}, priority: ${i.priority ?? "medium"})${i.notes ? ` — notes: ${i.notes}` : ""}`
      ).join("\n");
    }
    if (byStatus.idea.length) {
      context += `\n### Ideas\n`;
      context += byStatus.idea.map((i) =>
        `- "${i.title}" (${i.format ?? "unset format"}, priority: ${i.priority ?? "medium"})${i.notes ? ` — notes: ${i.notes}` : ""}`
      ).join("\n");
    }
  }

  return context;
}

/**
 * Summarize older messages in a conversation to keep token count manageable.
 * When a conversation exceeds 10 messages, compress the oldest messages into
 * a summary and only keep the last 6 messages in full.
 */
export async function getConversationMessages(conversationId: string) {
  const allMessages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });

  if (allMessages.length <= 10) {
    // Short conversation — return all messages as-is
    return {
      summary: null,
      messages: allMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    };
  }

  // Long conversation — summarize older messages, keep last 6 in full
  const olderMessages = allMessages.slice(0, -6);
  const recentMessages = allMessages.slice(-6);

  // Build a summary of older messages
  const summaryLines = olderMessages.map((m) => {
    const prefix = m.role === "user" ? "Creator" : "Forge";
    // Truncate each message to ~100 chars for the summary
    const truncated = m.content.length > 100
      ? m.content.slice(0, 100) + "..."
      : m.content;
    return `${prefix}: ${truncated}`;
  });

  const summary = `[Summary of earlier conversation (${olderMessages.length} messages):\n${summaryLines.join("\n")}\n]`;

  return {
    summary,
    messages: recentMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  };
}
```

**Step 2: Create the AI service with prompt caching**

Create `forge/src/lib/ai.ts`:

> **Prompt caching explained:** Claude caches the PREFIX of the system prompt. We structure the prompt so the static coaching personality and rules go first (cacheable — same across all messages), and the dynamic creator context goes second. On follow-up messages in the same session, the static portion is served from cache at 90% discount.

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { buildCreatorContext, getConversationMessages } from "@/lib/ai-context";

const anthropic = new Anthropic();

// Static coaching prompt — this gets cached across messages
const COACHING_SYSTEM_PROMPT = `You are Forge, an AI YouTube growth coach. You help small creators grow their channels with strategic, data-driven advice.

## Your Personality
- Direct and honest — no sugarcoating, but always constructive
- Strategic — connect every suggestion back to growth
- Encouraging but real — celebrate wins, address problems head-on
- Proactive — suggest actions, don't just answer questions
- Data-aware — reference actual analytics when giving advice
- Memory-aware — reference past conversations, track progress over time

## Your Capabilities
- Analyze YouTube analytics data (views, CTR, retention, traffic sources, demographics)
- Suggest content ideas based on what's working and what's in the ideas bucket
- Help with titles, thumbnails, and hooks
- Create content strategies and posting schedules
- Help write video scripts in the creator's voice
- Track goals and hold the creator accountable
- Explain YouTube algorithm behavior
- Review video transcripts for delivery coaching (when enabled)
- Suggest content formats and nichebending opportunities

## Rules
- Always give actionable advice, not vague tips
- Reference the creator's actual data when available
- Tailor advice to their growth stage (subscriber count matters)
- Be concise — creators are busy. No fluff.
- If asked about something outside YouTube growth, briefly answer but redirect to channel strategy
- When the creator shares a win, celebrate it genuinely then suggest next steps
- When recommending ideas, check the ideas bucket first — prioritize existing ideas that match
- When the creator is stuck, reference their strengths and past wins
- Track accountability — if a creator said they'd do something, follow up

## Growth Stage Rules
- 0-100 subs: Focus on consistency and finding their voice. Don't optimize — just post.
- 100-500 subs: Start paying attention to what performs. Double down on winners. Titles and thumbnails matter now.
- 500-1K subs: Refine the content strategy. Build a posting rhythm. Start thinking about series and formats.
- 1K-5K subs: Algorithm is noticing. CTR and retention are critical. Test and iterate fast.
- 5K-10K subs: Think about brand and community. Shorts + long-form strategy. Consider collaborations.`;

export async function buildSystemPrompt(userId: string): Promise<Anthropic.MessageCreateParams["system"]> {
  const creatorContext = await buildCreatorContext(userId);

  // Return as array of content blocks for prompt caching
  // Block 1: Static coaching prompt (cached — same across all messages and all users)
  // Block 2: Dynamic creator context (changes per user, refreshed each call)
  return [
    {
      type: "text",
      text: COACHING_SYSTEM_PROMPT,
      cache_control: { type: "ephemeral" },
    },
    {
      type: "text",
      text: `\n---\n\n# THIS CREATOR'S DATA\n${creatorContext}\n\nRemember: you are their growth coach, not a generic chatbot. Every response should help them grow.`,
    },
  ];
}

export async function chat(
  userId: string,
  conversationId: string,
  userMessage: string
): Promise<ReadableStream> {
  const systemPrompt = await buildSystemPrompt(userId);

  // Get conversation messages with summarization for long conversations
  const { summary, messages } = await getConversationMessages(conversationId);

  // Build the messages array for Claude
  const anthropicMessages: Anthropic.MessageParam[] = [];

  // If there's a conversation summary, prepend it as context
  if (summary) {
    anthropicMessages.push({
      role: "user",
      content: summary,
    });
    anthropicMessages.push({
      role: "assistant",
      content: "Understood, I have the context from our earlier conversation. Let's continue.",
    });
  }

  // Add the recent messages
  anthropicMessages.push(...messages);

  // Add the new user message
  anthropicMessages.push({ role: "user", content: userMessage });

  // Save user message to DB
  await prisma.message.create({
    data: {
      conversationId,
      role: "user",
      content: userMessage,
    },
  });

  // Stream response from Claude
  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: systemPrompt,
    messages: anthropicMessages,
  });

  // Collect full response for saving to DB
  let fullResponse = "";

  const readableStream = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          fullResponse += event.delta.text;
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({ text: event.delta.text })}\n\n`
            )
          );
        }
      }

      // Save assistant response to DB
      await prisma.message.create({
        data: {
          conversationId,
          role: "assistant",
          content: fullResponse,
        },
      });

      // Update conversation title from first exchange
      const conv = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });
      if (!conv?.title && fullResponse.length > 0) {
        await prisma.conversation.update({
          where: { id: conversationId },
          data: {
            title: userMessage.slice(0, 60) + (userMessage.length > 60 ? "..." : ""),
          },
        });
      }

      controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return readableStream;
}
```

**Step 2: Create chat API route**

Create `forge/src/app/api/chat/route.ts`:
```typescript
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { chat } from "@/lib/ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message, conversationId } = await req.json();

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  // Create new conversation if not provided
  let convId = conversationId;
  if (!convId) {
    const conv = await prisma.conversation.create({
      data: { userId: session.user.id },
    });
    convId = conv.id;
  }

  const stream = await chat(session.user.id, convId, message);

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Conversation-Id": convId,
    },
  });
}
```

**Step 3: Create conversations list API**

Create `forge/src/app/api/chat/conversations/route.ts`:
```typescript
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversations = await prisma.conversation.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return NextResponse.json(conversations);
}
```

**Step 4: Test chat API with curl/Postman to verify streaming works**

**Step 5: Commit**

```bash
git add forge/src/lib/ai.ts forge/src/app/api/chat/
git commit -m "feat: add Claude AI chat with streaming, channel context, and conversation persistence"
```

---

## Task 8: Chat UI

**Files:**
- Create: `forge/src/app/(app)/chat/page.tsx`
- Create: `forge/src/components/chat/chat-input.tsx`
- Create: `forge/src/components/chat/message-bubble.tsx`
- Create: `forge/src/components/chat/conversation-list.tsx`
- Create: `forge/src/hooks/use-chat.ts`

**Step 1: Create the useChat hook**

Custom hook that manages:
- Sending messages via POST to `/api/chat`
- Reading the SSE stream and appending text to the current assistant message
- Managing message list state
- Loading conversation history
- Creating new conversations
- Tracking loading/streaming state

**Step 2: Build message bubble component**

- User messages: right-aligned, colored background
- Assistant messages: left-aligned, white/gray background
- Render markdown in assistant messages (use `react-markdown` — `npm install react-markdown`)
- Show timestamp on hover
- Typing indicator (animated dots) while streaming

**Step 3: Build chat input component**

- Textarea that expands (1-4 lines)
- Send button (or Enter to send, Shift+Enter for newline)
- Disabled while streaming
- Character count or "Pro" badge if on free tier

**Step 4: Build conversation list sidebar**

- List of past conversations with title and last message preview
- "New Chat" button at top
- Active conversation highlighted
- Date grouping (Today, Yesterday, This Week, Older)

**Step 5: Compose the chat page**

Layout: conversation list on left (collapsible on mobile), chat area on right with messages + input.

**Step 6: Test the full chat flow**

- Start a new conversation
- Send a message, see streaming response
- Switch conversations
- Verify messages persist on page reload

**Step 7: Commit**

```bash
git add forge/src/app/\(app\)/chat/ forge/src/components/chat/ forge/src/hooks/
git commit -m "feat: add chat UI with streaming messages, conversation history, and markdown rendering"
```

---

## Task 9: Goal Setting & Tracking

**Files:**
- Create: `forge/src/app/(app)/goals/page.tsx`
- Create: `forge/src/app/api/goals/route.ts`
- Create: `forge/src/components/goals/goal-card.tsx`
- Create: `forge/src/components/goals/create-goal-dialog.tsx`

**Step 1: Create goals CRUD API**

`GET /api/goals` — list user's goals
`POST /api/goals` — create a new goal
`PATCH /api/goals/[id]` — update a goal (currentValue, completed)
`DELETE /api/goals/[id]` — delete a goal

**Step 2: Build create goal dialog**

Form fields:
- Title (text input) — e.g., "Reach 500 subscribers"
- Target value (number) — e.g., 500
- Current value (number, auto-filled from channel data if possible) — e.g., 454
- Unit (select: subscribers, videos, views, watch hours)
- Deadline (date picker, optional)

Use shadcn `Dialog`, `Input`, `Select`.

**Step 3: Build goal card component**

Shows:
- Title
- Progress bar (currentValue / targetValue)
- Percentage complete
- Days remaining (if deadline set)
- "Mark Complete" button
- Edit/Delete actions

**Step 4: Build goals page**

- "Add Goal" button that opens the dialog
- Grid of goal cards
- Separate sections: Active Goals, Completed Goals
- Auto-update subscriber goal from channel data on each sync

**Step 5: Test CRUD operations**

**Step 6: Commit**

```bash
git add forge/src/app/\(app\)/goals/ forge/src/app/api/goals/ forge/src/components/goals/
git commit -m "feat: add goal setting and tracking with progress visualization"
```

---

## Task 9b: Ideas Bucket

**Files:**
- Create: `forge/src/app/(app)/ideas/page.tsx`
- Create: `forge/src/app/api/ideas/route.ts`
- Create: `forge/src/app/api/ideas/[id]/route.ts`
- Create: `forge/src/components/ideas/idea-card.tsx`
- Create: `forge/src/components/ideas/create-idea-dialog.tsx`
- Modify: `forge/src/components/sidebar.tsx` (add Ideas nav item)

> **Why this matters:** The Ideas Bucket is a core feature from the design doc — it's how the AI tracks what the creator wants to make, what's in progress, and what got published. Without it, the AI can't do accountability ("you said you'd make this video 2 weeks ago") or smart recommendations ("this idea from your bucket matches a trending topic").

**Step 1: Create ideas CRUD API**

`GET /api/ideas` — list user's ideas (optional filter by status)
`POST /api/ideas` — create a new idea
`PATCH /api/ideas/[id]` — update idea (status, notes, priority, linked video)
`DELETE /api/ideas/[id]` — delete an idea

**Step 2: Build create idea dialog**

Form fields:
- Title (text input) — e.g., "AI Code Cleanup Tutorial"
- Description (textarea, optional) — what the video would cover
- Format (select: long-form, short, stream, tutorial, challenge, commentary)
- Priority (select: low, medium, high)
- Notes (textarea, optional) — any extra context

Use shadcn `Dialog`, `Input`, `Select`, `Textarea`.

**Step 3: Build idea card component**

Shows:
- Title and description
- Status badge with color (💡 Idea = gray, 📝 Planning = blue, 🎬 In Progress = yellow, ✅ Published = green, 📊 Analyzed = purple)
- Format and priority tags
- Notes (expandable)
- Status change dropdown (move between statuses)
- "Link to Video" button (when status is Published — link to a published Video record)
- Created date and last updated
- Edit/Delete actions

**Step 4: Build ideas page**

- "Add Idea" button that opens the dialog
- Filter tabs: All | 💡 Ideas | 📝 Planning | 🎬 In Progress | ✅ Published
- Grid/list of idea cards
- Sort by: priority, newest, oldest, recently updated
- Empty state: "No ideas yet. Drop your first content idea here — or just tell Forge in chat!"

**Step 5: Add Ideas to chat integration**

The AI can already see ideas via the system prompt (built in Task 7's `buildCreatorContext`). But also:
- When a user says something like "I have an idea for a video about X" in chat, the AI should suggest saving it to the ideas bucket
- Add a quick-add button in the chat UI that creates an idea from the current message

**Step 6: Add Ideas to sidebar navigation**

Add "Ideas" (Lightbulb icon) to the sidebar between "Goals" and "Settings".

**Step 7: Test CRUD operations and verify ideas appear in AI chat context**

**Step 8: Commit**

```bash
git add forge/src/app/\(app\)/ideas/ forge/src/app/api/ideas/ forge/src/components/ideas/ forge/src/components/sidebar.tsx
git commit -m "feat: add ideas bucket with CRUD, status tracking, and AI context integration"
```

---

## Task 10: Push Notification Setup

**Files:**
- Create: `forge/public/sw.js` (service worker)
- Create: `forge/src/lib/push.ts`
- Create: `forge/src/app/api/push/subscribe/route.ts`
- Create: `forge/src/app/api/push/send/route.ts`
- Create: `forge/src/components/push-permission.tsx`

**Step 1: Generate VAPID keys**

```bash
cd forge
npx web-push generate-vapid-keys
```

Copy the keys to `.env.local` as `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`.

**Step 2: Create the service worker**

Create `forge/public/sw.js`:
```javascript
self.addEventListener("push", function (event) {
  const data = event.data?.json() ?? {};
  const title = data.title || "Forge";
  const options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/badge-72.png",
    tag: data.tag || "forge-notification",
    data: {
      url: data.url || "/dashboard",
    },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";
  event.waitUntil(clients.openWindow(url));
});
```

**Step 3: Create push notification service**

Create `forge/src/lib/push.ts`:
```typescript
import webpush from "web-push";
import { prisma } from "@/lib/prisma";

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function sendPushNotification(
  userId: string,
  payload: { title: string; body: string; url?: string; tag?: string }
) {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload)
        );
      } catch (error: unknown) {
        // Remove invalid subscriptions (410 Gone)
        if (error && typeof error === "object" && "statusCode" in error && (error as { statusCode: number }).statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        }
        throw error;
      }
    })
  );

  return results;
}
```

**Step 4: Create subscribe API route**

`POST /api/push/subscribe` — saves the push subscription (endpoint, keys) to the database for the authenticated user.

**Step 5: Create push permission component**

A component that:
1. Checks if push is supported in the browser
2. Registers the service worker
3. Requests notification permission
4. Subscribes to push with the VAPID public key
5. Sends the subscription to `/api/push/subscribe`
6. Shows a toggle in settings to enable/disable

**Step 6: Add to settings page**

Add the push permission toggle to the settings page.

**Step 7: Test by sending a test notification via the send API**

**Step 8: Commit**

```bash
git add forge/public/sw.js forge/src/lib/push.ts forge/src/app/api/push/ forge/src/components/push-permission.tsx
git commit -m "feat: add web push notification system with VAPID, service worker, and subscribe flow"
```

---

## Task 11: Proactive Check-in System (Cron Jobs + Event Detection)

**Files:**
- Create: `forge/src/app/api/cron/daily-checkin/route.ts`
- Create: `forge/src/app/api/cron/weekly-review/route.ts`
- Create: `forge/src/app/api/cron/inactivity-nudge/route.ts`
- Create: `forge/src/app/api/cron/event-scanner/route.ts`
- Create: `forge/src/lib/checkins.ts`
- Create: `forge/src/lib/event-detector.ts`
- Create: `forge/vercel.json`

> **KEY DESIGN DECISION:** The proactive check-in system has two layers:
> 1. **Time-based crons** — daily check-in, weekly review, inactivity nudge (fires on schedule)
> 2. **Event-based scanner** — runs every 2 hours, detects events and triggers contextual messages
>
> This is what makes Forge feel alive — it doesn't just message you on a schedule, it reacts to what's happening with your channel.

**Step 1: Configure Vercel cron jobs**

Create `forge/vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/daily-checkin",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/weekly-review",
      "schedule": "0 10 * * 1"
    },
    {
      "path": "/api/cron/inactivity-nudge",
      "schedule": "0 18 * * *"
    },
    {
      "path": "/api/cron/event-scanner",
      "schedule": "0 */2 * * *"
    }
  ]
}
```

**Step 2: Create the generic check-in trigger function**

Create `forge/src/lib/checkins.ts`:

This module uses Claude API to generate personalized check-in messages. The core function:

```typescript
export async function triggerCheckin(
  userId: string,
  type: CheckinType,
  eventContext?: string
): Promise<{ title: string; body: string; url: string }>;
```

Where `CheckinType` is:
- `"daily"` — morning message with yesterday's highlights
- `"weekly_review"` — 7-day comparison, wins, action items
- `"inactivity"` — nudge with a quick content idea
- `"new_upload_detected"` — "I see you published a new video! I'll analyze it in 24-48hrs."
- `"post_upload_analysis"` — "Your video has been live for 48hrs. Here's how it's doing..."
- `"goal_approaching"` — "You're X away from your goal!"
- `"goal_achieved"` — "You hit your goal! Time to set a new one."
- `"analytics_anomaly"` — "Your CTR spiked / views jumped — here's what's happening"
- `"idea_stale"` — "You moved [idea] to In Progress 2 weeks ago. What's the status?"

Each type builds a focused Claude prompt with the user's context injected. The `eventContext` parameter passes event-specific data (e.g., which video was uploaded, which goal was hit).

Functions:
- `generateDailyCheckin(userId)` — pulls latest analytics, generates a brief morning message with yesterday's highlights and today's suggestion
- `generateWeeklyReview(userId)` — compares last 7 days vs previous 7 days, generates a weekly report with wins, areas to improve, and 3 action items
- `generateInactivityNudge(userId)` — checks when the user last uploaded, if >3 days generates a nudge with a quick content idea

**Step 3: Create the event detector**

Create `forge/src/lib/event-detector.ts`:

This module scans for events that should trigger proactive messages. It runs inside the `event-scanner` cron and checks:

```typescript
export async function detectEvents(userId: string): Promise<DetectedEvent[]>;
```

Events it detects:

| Event | How it detects | Trigger condition |
|-------|---------------|-------------------|
| **New video uploaded** | Compare video count in DB vs YouTube API | New video ID not in DB |
| **Goal approaching** | Check goals where currentValue > 80% of targetValue | Within 20% of target |
| **Goal achieved** | Check goals where currentValue >= targetValue and not completed | Target reached |
| **Analytics anomaly** | Compare latest video CTR/views to user's average | >50% above or below average |
| **Idea stale** | Check ideas with status "in_progress" and updatedAt > 14 days ago | Stale for 2+ weeks |

The scanner does NOT detect these on MVP (future):
- Post-stream analysis (requires live broadcast detection — V1.5)
- Trend alerts (requires YouTube search API — expensive quota)

**Step 4: Create daily check-in cron route**

`GET /api/cron/daily-checkin`:
- Verify cron secret (Vercel sends `Authorization: Bearer <CRON_SECRET>`)
- Fetch all Pro users with push subscriptions enabled
- For each user: call `triggerCheckin(userId, "daily")`, send push notification
- Rate limit: batch processing, don't exceed Claude API limits

**Step 5: Create weekly review cron route**

Same pattern as daily, but calls `triggerCheckin(userId, "weekly_review")`.

**Step 6: Create inactivity nudge cron route**

- Fetch all Pro users
- For each: check last video publish date from DB
- If >3 days since last upload: call `triggerCheckin(userId, "inactivity")`, send push

**Step 7: Create event scanner cron route**

`GET /api/cron/event-scanner`:
- Verify cron secret
- Fetch all Pro users
- For each user: run `detectEvents(userId)`
- For each detected event: call `triggerCheckin(userId, event.type, event.context)`, send push notification
- Also sync latest YouTube data for each user (piggyback on the scan to keep data fresh)

**Step 8: Add CRON_SECRET to environment variables**

```env
CRON_SECRET="your-secret-here"
```

**Step 9: Test locally by calling the cron endpoints manually**

Test each check-in type by calling the endpoints directly. For event detection, manually trigger by adding a test video or adjusting goal values.

**Step 10: Commit**

```bash
git add forge/src/app/api/cron/ forge/src/lib/checkins.ts forge/src/lib/event-detector.ts forge/vercel.json
git commit -m "feat: add proactive check-in system with time-based crons and event-driven scanner"
```

---

## Task 11b: Onboarding Creator Profile

**Files:**
- Modify: `forge/src/app/(app)/onboarding/page.tsx` (add profile step)
- Modify: `forge/src/lib/ai.ts` (onboarding conversation prompt)

> **Why this matters:** The CreatorProfile is what makes Forge feel personal from day one. Instead of a boring form, Forge runs a conversational onboarding where it asks about the creator's niche, style, goals, and struggles. The answers get stored in the `CreatorProfile` model and injected into every future AI interaction.

**Step 1: Add "Meet Your Coach" step to onboarding**

After connecting the channel (Step 1 of onboarding), add a conversational step where Forge:

1. Looks at the channel data it just synced
2. Introduces itself: "I just looked at your channel. [X] subscribers, [Y] videos — nice. Let me ask you a few things so I can coach you properly."
3. Asks in sequence (conversational, not a form):
   - "What's your channel about? Who's your ideal viewer?"
   - "Are you on camera, faceless, or a mix?"
   - "How would you describe your style — energetic, calm, funny, educational?"
   - "How often are you posting right now?"
   - "What's the #1 thing holding you back?"
   - "Do you want me to analyze your speaking/delivery when you upload videos? (I can catch filler words, pacing issues, etc.)"
4. Saves answers to `CreatorProfile`
5. Ends with: "Got it. I know your channel, your style, and your biggest challenge. Let's get to work."

**Step 2: Create onboarding-specific AI prompt**

The onboarding conversation uses a special system prompt focused on gathering profile information. The AI should:
- Ask one question at a time (not dump all questions at once)
- React to each answer naturally before asking the next question
- Extract structured data from conversational answers (e.g., "I do coding tutorials" → niche: "web development")
- Store extracted data to CreatorProfile after the conversation

**Step 3: Parse and save profile data**

After the onboarding conversation, extract the structured profile data from the conversation and save to `CreatorProfile`. This can be done by:
- Having the AI output structured JSON alongside its conversational response (via a tool call or structured output)
- Or parsing the conversation after it's complete with a follow-up Claude call

**Step 4: Test the full onboarding flow**

Verify: sign up → connect channel → conversational profile building → goal setting → push setup → dashboard

**Step 5: Commit**

```bash
git add forge/src/app/\(app\)/onboarding/ forge/src/lib/ai.ts
git commit -m "feat: add conversational onboarding with creator profile building"
```

---

## Task 12: Stripe Payments

**Files:**
- Create: `forge/src/lib/stripe.ts`
- Create: `forge/src/app/api/stripe/checkout/route.ts`
- Create: `forge/src/app/api/stripe/webhook/route.ts`
- Create: `forge/src/app/api/stripe/portal/route.ts`
- Create: `forge/src/components/pricing-card.tsx`

**Prerequisites:** Create a Stripe account, create a Product "Forge Pro" with a Price of $25/month. Copy the price ID to `.env.local` as `STRIPE_PRO_PRICE_ID`. Set up a webhook endpoint in Stripe dashboard pointing to `/api/stripe/webhook` with events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.

**Step 1: Create Stripe utility**

Create `forge/src/lib/stripe.ts`:
```typescript
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia",
});
```

Install: `npm install stripe`

**Step 2: Create checkout session API**

`POST /api/stripe/checkout` — creates a Stripe Checkout session for the Pro plan. Redirects user to Stripe's hosted checkout page. On success, redirects back to `/dashboard?upgraded=true`.

**Step 3: Create webhook handler**

`POST /api/stripe/webhook`:
- Verify Stripe signature
- Handle `checkout.session.completed`: create/update Subscription record, set status to "pro"
- Handle `customer.subscription.updated`: update status and period end
- Handle `customer.subscription.deleted`: set status to "cancelled"

**Step 4: Create customer portal route**

`POST /api/stripe/portal` — creates a Stripe Customer Portal session so users can manage their subscription (cancel, update payment method).

**Step 5: Build pricing/upgrade card component**

Shows on the dashboard or in settings:
- Current plan (Free / Pro)
- If Free: show Pro features and "Upgrade to Pro — $25/mo" button
- If Pro: show "Manage Subscription" button (links to Stripe portal)

**Step 6: Add usage limits for free tier**

Create middleware or utility function `checkUsageLimit(userId)`:
- Free tier: 5 AI chats per day (count messages in last 24h)
- Return remaining count
- Block chat API if limit exceeded (return 429 with upgrade CTA)

**Step 7: Test the full flow: checkout → webhook → subscription active → features unlocked**

**Step 8: Commit**

```bash
git add forge/src/lib/stripe.ts forge/src/app/api/stripe/ forge/src/components/pricing-card.tsx
git commit -m "feat: add Stripe subscription payments with checkout, webhook, and usage limits"
```

---

## Task 13: Landing Page

**Files:**
- Create: `forge/src/app/page.tsx` (public landing page)
- Create: `forge/src/components/landing/hero.tsx`
- Create: `forge/src/components/landing/features.tsx`
- Create: `forge/src/components/landing/pricing.tsx`
- Create: `forge/src/components/landing/footer.tsx`

**Step 1: Design the landing page**

Sections:
1. **Hero**: "Your AI YouTube Growth Coach" — tagline, CTA button ("Get Started Free"), screenshot/mockup of dashboard
2. **Problem**: "Growing on YouTube is hard alone" — 3 pain points
3. **Features**: 3-4 feature blocks with icons — Analytics Intelligence, Proactive Coaching, Accountability, Strategy
4. **How It Works**: 3 steps — Connect Channel → Get Insights → Grow Faster
5. **Pricing**: Free vs Pro comparison table
6. **CTA**: Final call to action
7. **Footer**: Links, copyright

**Step 2: Build each section as a component**

Use shadcn/ui components. Clean, minimal design. No heavy animations — keep it fast.

**Step 3: Make it responsive**

Test on mobile and desktop.

**Step 4: Commit**

```bash
git add forge/src/app/page.tsx forge/src/components/landing/
git commit -m "feat: add landing page with hero, features, pricing, and CTA"
```

---

## Task 14: Onboarding Flow

**Files:**
- Create: `forge/src/app/(app)/onboarding/page.tsx`
- Create: `forge/src/components/onboarding/steps.tsx`

**Step 1: Create multi-step onboarding**

After first sign-in, redirect to `/onboarding`. Steps:

1. **Connect Channel** — trigger YouTube sync, show channel info when connected
2. **Set Your First Goal** — pick from presets (500 subs, 1K subs, first $100, etc.) or custom
3. **Enable Notifications** — request push permission
4. **Welcome Chat** — Forge introduces itself: "Hey! I'm Forge, your YouTube growth coach. I just looked at your channel — here's what I see..." (auto-triggered first AI chat with channel analysis)

**Step 2: Track onboarding completion**

Add a `onboardingCompleted` boolean to the User model (or check if channel + goal + push subscription exist).

**Step 3: Redirect logic**

In the `(app)/layout.tsx`, check if onboarding is complete. If not, redirect to `/onboarding`.

**Step 4: Test the full first-time user experience**

**Step 5: Commit**

```bash
git add forge/src/app/\(app\)/onboarding/ forge/src/components/onboarding/
git commit -m "feat: add onboarding flow with channel connect, goal setting, and push setup"
```

---

## Task 15: Settings Page

**Files:**
- Create: `forge/src/app/(app)/settings/page.tsx`

**Step 1: Build settings page**

Sections:
- **Profile**: name, email, avatar (from Google, read-only)
- **Connected Channel**: channel name, thumbnail, "Reconnect" button, last sync time
- **Notifications**: push notification toggle, notification preferences (daily check-in on/off, weekly review on/off, inactivity nudges on/off)
- **Subscription**: current plan, upgrade/manage button
- **Data**: "Sync Now" button to manually trigger YouTube data sync
- **Danger Zone**: "Delete Account" button with confirmation

**Step 2: Create settings API routes**

`PATCH /api/settings` — update notification preferences
`DELETE /api/settings/account` — delete user and all data

**Step 3: Commit**

```bash
git add forge/src/app/\(app\)/settings/ forge/src/app/api/settings/
git commit -m "feat: add settings page with notifications, subscription, and account management"
```

---

## Task 16: Deploy to Vercel

**Step 1: Create Vercel project**

```bash
cd forge
npx vercel
```

Link to a new project. Set environment variables in Vercel dashboard (all values from `.env.local`).

**Step 2: Update Google OAuth redirect URI**

Add `https://your-app.vercel.app/api/auth/callback/google` to the Google Cloud Console authorized redirect URIs.

**Step 3: Update Stripe webhook endpoint**

Add `https://your-app.vercel.app/api/stripe/webhook` in Stripe dashboard.

**Step 4: Deploy**

```bash
npx vercel --prod
```

**Step 5: Test the full production flow**

- Sign up → connect channel → onboarding → dashboard → chat → goals → upgrade

**Step 6: Commit any deployment fixes**

```bash
git add .
git commit -m "feat: deploy Forge to Vercel with production configuration"
```

---

## Task 17: Polish & QA

**Step 1: Error handling**

- Add error boundaries to all pages
- Handle API errors gracefully (show toast notifications)
- Handle YouTube API quota exhaustion
- Handle Claude API errors (show retry button)

**Step 2: Loading states**

- Add skeleton loaders to dashboard
- Loading spinner on chat while streaming
- Button loading states

**Step 3: Mobile responsiveness**

- Test all pages on mobile
- Ensure sidebar collapses properly
- Chat input works on mobile keyboards

**Step 4: Rate limiting**

- Add rate limiting to API routes (prevent abuse)
- Free tier: 5 chats/day, analytics sync 1x/day
- Pro tier: unlimited chats, analytics sync 1x/hour

**Step 5: SEO**

- Add proper meta tags to landing page
- Add OG image
- Add sitemap

**Step 6: Final commit**

```bash
git add .
git commit -m "feat: polish UI, add error handling, loading states, and rate limiting"
```

---

## Summary

| Task | What | Est. Time |
|------|------|-----------|
| 1 | Project Setup | 1 hour |
| 2 | Database Schema (includes Idea + CreatorProfile models) | 1-2 hours |
| 3 | Auth (Google OAuth + YouTube) | 2-3 hours |
| 4 | YouTube Data Service | 3-4 hours |
| 5 | App Layout & Navigation | 2-3 hours |
| 6 | Analytics Dashboard | 4-5 hours |
| 7 | AI Chat — Claude Integration (prompt caching + context management + conversation summarization) | 4-5 hours |
| 8 | Chat UI | 4-5 hours |
| 9 | Goal Setting & Tracking | 2-3 hours |
| **9b** | **Ideas Bucket (CRUD, status tracking, AI integration)** | **3-4 hours** |
| 10 | Push Notification Setup | 3-4 hours |
| 11 | Proactive Check-in System (crons + event-driven scanner) | 4-5 hours |
| **11b** | **Onboarding Creator Profile (conversational profile building)** | **2-3 hours** |
| 12 | Stripe Payments | 3-4 hours |
| 13 | Landing Page | 3-4 hours |
| 14 | Onboarding Flow | 2-3 hours |
| 15 | Settings Page | 2-3 hours |
| 16 | Deploy to Vercel | 1-2 hours |
| 17 | Polish & QA | 4-5 hours |
| **Total** | **20 tasks** | **~55-70 hours** |

### What Changed from Original Plan

| Addition | Why |
|----------|-----|
| **Prompt caching** (Task 7) | Cuts AI costs ~50% on follow-up messages. Static coaching prompt is cached, dynamic user data changes per call. |
| **Conversation summarization** (Task 7) | Prevents token explosion on long chats. After 10 messages, older ones are compressed into a summary. |
| **Creator Profile** (Task 2 schema + Task 11b) | The AI needs to know the creator deeply — niche, style, struggles, preferences. Built via conversational onboarding, not a boring form. |
| **Ideas Bucket** (Task 2 schema + Task 9b) | Core feature from design doc that was missing. Enables accountability ("you said you'd make this video"), smart recommendations, and idea-to-published tracking. |
| **Progress narrative** (Task 7 context builder) | The AI can now say "when you joined you had 200 subs, now you have 340" — makes coaching feel continuous, not stateless. |
| **Event-driven scanner** (Task 11) | Goes beyond time-based crons. Detects new uploads, goal milestones, analytics anomalies, stale ideas — triggers contextual messages. |
| **Growth stage rules** (Task 7 system prompt) | Different advice for 100 subs vs 1K vs 5K. Baked into the static coaching prompt. |

Stream schedule suggestion: ~2-3 hours per stream, 4-5 streams per week = **4-5 weeks of streaming content** for the full MVP.
