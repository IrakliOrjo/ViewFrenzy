# Onboarding Questionnaire & Creator Profiling System

## Overview

When a user first signs up and connects their YouTube channel, ViewFrenzy presents a UI-driven questionnaire (stepper wizard) to understand the creator's background, personality, weaknesses, and goals. This data powers:

1. **Personalized AI coaching context** — injected into every AI conversation
2. **Push notification aggressiveness** — discipline level controls how much the AI chases the user
3. **Recommendations page** — curated resources matched to the user's improvement areas
4. **Behavioral observation baseline** — initial self-reported data that the AI validates and refines over time

## Questionnaire Design

### Delivery Method

Single-page multi-step stepper wizard with incremental server saves. Each answer is saved to the database as the user advances to the next step. If the user closes the browser mid-questionnaire, they resume from where they left off.

### Questions

**Question 1 — Niche**
- Label: "What's your channel about?"
- Type: Free text input with suggestion chips/autocomplete
- Suggestions: Gaming, Tech, Fitness, Cooking, Education, Finance, Vlogs, Music, Beauty, Comedy, Travel, DIY/Crafts, Science, News/Commentary, Lifestyle
- User can type a custom niche not in the list
- Max length: 100 characters
- Stored in: `CreatorProfile.niche`

**Question 2 — Content Format**
- Label: "What type of videos do you create?"
- Type: Single select (card-style options)
- Options:
  - On-camera (I'm in the video)
  - Faceless (voiceover, screen recording, animations)
  - Mixed (both)
  - Not sure yet
- Stored in: `CreatorProfile.contentFormat`

**Question 3 — Experience Level**
- Label: "Where are you on your YouTube journey?"
- Type: Single select
- Options:
  - Just starting / thinking about it (0 videos)
  - Published a few videos (1-10)
  - Posting somewhat regularly (11-50)
  - Been at it for a while (50+)
- Stored in: `CreatorProfile.experienceLevel`

**Question 4 — Biggest Challenge**
- Label: "What's the #1 thing holding you back right now?"
- Type: Single select with "Other" free text option
- Options:
  - I don't know what to make
  - I can't stay consistent
  - My videos aren't getting views
  - I don't know how to grow
  - I struggle with being on camera
  - I don't have enough time
  - Other (free text, max 200 characters)
- Stored in: `CreatorProfile.biggestChallenge`

**Question 5 — Discipline & Consistency**
- Label: "How would you describe your consistency with projects?"
- Type: Single select
- Options:
  - I struggle to start things
  - I start strong but lose steam quickly
  - I'm on and off — depends on motivation
  - I'm fairly consistent once I commit
  - I'm very disciplined — I stick to routines
- Stored in: `CreatorProfile.disciplineLevel`
- **Impact:** Directly controls push notification aggressiveness. Lower discipline = more nudges and accountability check-ins from the AI.

**Question 6 — On-Camera Interest/Comfort**
- Label: "How do you feel about being on camera?"
- Type: Single select
- Shown to ALL users (including faceless creators — captures aspiration to transition)
- Options:
  - Already comfortable on camera
  - I do it but want to improve
  - I want to start but I'm nervous
  - Not interested / staying faceless
- Stored in: `CreatorProfile.onCameraComfort`

**Question 7 — What Do You Want to Improve**
- Label: "What areas do you want to work on?"
- Type: Multi-select (pick all that apply)
- Options:
  - Video editing
  - Writing scripts / storytelling
  - Thumbnails & titles
  - On-camera presence & delivery
  - Speech & communication
  - Understanding YouTube analytics
  - Growing my audience
  - Consistency & productivity
  - Going live / live streaming
  - Content strategy & planning
- Stored in: `CreatorProfile.improvementAreas` (String array)
- **Impact:** Powers both AI coaching priorities AND the recommendations/resources page.

**Question 8 — Time Available**
- Label: "How much time can you dedicate to YouTube per week?"
- Type: Single select
- Options:
  - Less than 2 hours
  - 2-5 hours
  - 5-10 hours
  - 10-20 hours
  - 20+ hours (part-time / full-time)
- Stored in: `CreatorProfile.weeklyHoursAvailable`
- Stored values: `"lt2"` | `"2-5"` | `"5-10"` | `"10-20"` | `"20plus"`
- **Impact:** Constrains what strategies the AI recommends. "Post daily" makes no sense for someone with 2 hours/week.

## Database Schema Changes

### User Model

Add `onboardingCompleted` field to track whether the user has finished the full onboarding flow:

```prisma
model User {
  // ... existing fields ...
  onboardingCompleted Boolean @default(false)
}
```

### CreatorProfile Model

Extend with new fields. The existing `contentStyle` field is **deprecated** — `contentFormat` replaces it. If any existing data exists in `contentStyle`, migrate it to `contentFormat` during the schema migration. The `contentStyle` column can be removed once no code references it.

Add `onboardingStep` to explicitly track the user's progress through the questionnaire, enabling reliable resume without guessing based on null fields.

```prisma
model CreatorProfile {
  id                    String   @id @default(cuid())
  userId                String   @unique
  niche                 String?              // Q1: channel topic
  contentFormat         String?              // Q2: "on-camera" | "faceless" | "mixed" | "not-sure" (replaces contentStyle)
  experienceLevel       String?              // Q3: "starting" | "few-videos" | "regular" | "experienced"
  biggestChallenge      String?              // Q4: main blocker
  disciplineLevel       String?              // Q5: "struggle-to-start" | "lose-steam" | "on-and-off" | "fairly-consistent" | "very-disciplined"
  onCameraComfort       String?              // Q6: "comfortable" | "want-to-improve" | "nervous" | "not-interested"
  improvementAreas      String[] @default([]) // Q7: multi-select improvement areas
  weeklyHoursAvailable  String?              // Q8: "lt2" | "2-5" | "5-10" | "10-20" | "20plus"
  onboardingStep        Int      @default(0) // highest completed questionnaire step (1-8)
  postingFrequency      String?              // (existing, kept for AI updates over time)
  onboardingAnswers     Json?                // (existing, raw answers backup)
  onboardingNotes       String?              // (existing)
  personalityTraits     Json?                // AI-observed personality insights (built over time)
  lastPersonalityUpdate DateTime?            // when AI last updated personality observations
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### Migration Notes

- Remove `contentStyle` column after migrating any existing data to `contentFormat`
- `improvementAreas` uses `@default([])` so records can be created before the user reaches Q7

## Technical Architecture

### Route & Component Structure

```
src/app/(app)/onboarding/
├── page.tsx                          — server component, checks if onboarding completed
├── components/
│   ├── OnboardingWizard.tsx          — client component, manages stepper state
│   ├── ProgressBar.tsx               — visual progress indicator
│   ├── steps/
│   │   ├── NicheStep.tsx
│   │   ├── ContentFormatStep.tsx
│   │   ├── ExperienceLevelStep.tsx
│   │   ├── BiggestChallengeStep.tsx
│   │   ├── DisciplineStep.tsx
│   │   ├── OnCameraStep.tsx
│   │   ├── ImprovementAreasStep.tsx
│   │   └── TimeAvailableStep.tsx
│   └── OnboardingComplete.tsx        — final screen: "You're all set!"
└── hooks/
    └── useOnboardingProgress.ts      — manages state, incremental saves, step navigation
```

### API

- `POST /api/onboarding/progress` — saves each answer incrementally as user advances steps
  - Request body: `{ step: number, field: string, value: string | string[] }`
  - **Server-side validation:** The `field` parameter must be validated against an allowlist of the 8 onboarding field names (`niche`, `contentFormat`, `experienceLevel`, `biggestChallenge`, `disciplineLevel`, `onCameraComfort`, `improvementAreas`, `weeklyHoursAvailable`). Reject any field not in the allowlist.
  - Each save also updates `onboardingStep` to the current step number
  - Uses existing `profile.data.ts` / `profile.service.ts` for database writes

### Profile Data Layer Changes

Extend `IUpdateProfileInput` in `src/lib/domains/profile/profile.data.ts` with the new fields:

```typescript
export interface IUpdateProfileInput {
  niche?: string;
  contentFormat?: string;          // new (replaces contentStyle)
  experienceLevel?: string;        // new
  biggestChallenge?: string;       // new
  disciplineLevel?: string;        // new
  onCameraComfort?: string;        // new
  improvementAreas?: string[];     // new
  weeklyHoursAvailable?: string;   // new
  onboardingStep?: number;         // new
  postingFrequency?: string;
  onboardingAnswers?: Prisma.InputJsonValue;
  onboardingNotes?: string;
  personalityTraits?: Prisma.InputJsonValue;  // new (for behavioral observation system)
  lastPersonalityUpdate?: Date;               // new
}
```

### Flow Logic

1. `OnboardingWizard` holds current step index and all answers in local state
2. `useOnboardingProgress` handles:
   - Saving each answer to the database on step advance
   - Loading saved progress from the database if user returns mid-questionnaire
   - Step navigation (next/back)
3. On final step completion: sets `user.onboardingCompleted = true` and redirects to `/dashboard`

### Resume Support

If user closes the browser mid-questionnaire:
- On return, `page.tsx` checks `onboardingCompleted === false` and renders the wizard
- `useOnboardingProgress` loads existing `CreatorProfile` data from the database
- Resumes from `onboardingStep + 1` (the next uncompleted step). This is reliable because `onboardingStep` is explicitly tracked as an integer, not inferred from null fields.
- User continues from where they left off, with previously answered steps pre-filled

## Onboarding Flow Integration

The questionnaire fits into the full onboarding as step 2:

```
1. Google OAuth login (first time)
2. Redirect to /onboarding
3. Step 1: Connect YouTube Channel
   → Trigger YouTube sync
   → Show channel info (name, subs, video count)
4. Step 2: Creator Questionnaire (8 questions, stepper wizard)
   → Incremental saves per step
   → Answers saved to CreatorProfile
5. Step 3: Set First Goal
   → Preset goals or custom
6. Step 4: Enable Push Notifications
   → Request permission
7. Complete → onboardingCompleted = true → redirect to /dashboard
```

**Change from previous design:** The old "Welcome Chat" step (where AI asked questions conversationally) is replaced by this UI questionnaire. The AI's first interaction with the user happens on the dashboard/chat, already armed with the full profile.

**Scope note:** This spec covers Step 2 (Creator Questionnaire) in detail. Steps 1, 3, and 4 are defined in the existing implementation plan (Task 14 in `2026-03-01-forge-implementation.md`).

## AI Context Integration

`ai-context.ts` already reads from `CreatorProfile`. The `formatCreatorProfile` function in `src/lib/ai-context.ts` currently only formats `niche`, `contentStyle`, and `postingFrequency`. It must be updated to include all new fields. Example output injected into every AI conversation:

```
Creator Profile:
- Niche: tech reviews
- Format: on-camera
- Experience: published a few videos (1-10)
- Biggest challenge: videos aren't getting views
- Discipline: on and off, depends on motivation
- On-camera comfort: does it but wants to improve
- Wants to improve: thumbnails & titles, on-camera presence, understanding analytics
- Time available: 5-10 hours/week
- AI-observed personality traits: (none yet — will build over time)
```

## AI Behavioral Observation System

Instead of asking personality archetype questions upfront (which can lead to annoying repetitive AI behavior based on a one-time label), the AI gradually learns personality traits through observation over time.

### What the AI Observes

| Signal | How it's detected | What it reveals |
|---|---|---|
| Upload frequency | Compare posting dates from YouTube sync data | Actual consistency (validates self-reported discipline) |
| Intention vs action gap | AI tracks stated plans in chat vs actual uploads | Follow-through, procrastination patterns |
| Recurring chat patterns | "Is this good enough?" = perfectionist, "Should I try this?" = experimenter | Core personality tendencies |
| Response to AI suggestions | Does user act on advice or ignore it? | Coachability, resistance patterns |
| Topics asked about most | Analytics? Ideas? Motivation? Technical? | Knowledge gaps, where their head is at |
| Session gaps | How often they open the app | Engagement level, whether nudges are working |

### How It Works

1. **Weekly cron job** reviews all conversations from the past week for each active user
2. The AI reflects on the week's conversations and outputs structured observations:
```json
{
  "traits": {
    "perfectionist": { "level": "high", "evidence": "Asked 3 times if thumbnail was good enough" },
    "consistency": { "level": "low", "evidence": "Mentioned struggling to post weekly twice" },
    "analytically_minded": { "level": "medium", "evidence": "Frequently asks about CTR numbers" }
  },
  "coaching_adjustments": "Push to publish faster. Avoid suggesting polish tasks. Send accountability nudges."
}
```
3. Observations saved to `CreatorProfile.personalityTraits` and `lastPersonalityUpdate`
4. `ai-context.ts` injects these observations into every future conversation
5. Observations evolve — AI can update or override previous assessments as it learns more

### Trigger Rules

- Runs as part of the weekly cron infrastructure
- Skips users with zero conversations in the past week
- One update per user per week maximum

### Notification Aggressiveness Integration

- The onboarding `disciplineLevel` sets the **starting** notification frequency
- Over time, the behavioral observation system adjusts it:
  - User says they're disciplined but hasn't posted in 3 weeks → AI escalates nudges
  - User says they struggle but is actually posting regularly → AI dials back

### Prerequisites

- **Cron infrastructure must exist.** The weekly cron system (`src/app/api/cron/`) has not been built yet. The behavioral observation system requires at minimum a weekly cron endpoint. This should be implemented as part of the existing cron task (Task 15 in the implementation plan) before the observation system can function.
- The behavioral observation system is **Phase 2** — it is out of scope for the initial onboarding questionnaire implementation. Build the questionnaire and AI context integration first, then add behavioral observation once the cron infrastructure and the dependencies below are resolved.

### Future Planning Dependencies

The detailed implementation of the behavioral observation system depends on two future brainstorming sessions:

1. **AI chatbot behavior design** — how the AI functions across different session types (scripting, brainstorming, coaching, Q&A). Long script-refinement sessions with 50+ messages are very different from coaching conversations, and the observation system needs to distinguish between them.
2. **Progress tracking reliability** — ensuring personality observations are based on strong evidence, not noise. How to validate AI observations are accurate, and how to handle contradictions between observed behavior and self-reported data.

## Recommendations Page

A dedicated page that surfaces curated resources based on the user's selected improvement areas (question 7).

### How It Works

- Reads `CreatorProfile.improvementAreas` for the current user
- Displays relevant resource categories with curated external links
- Each of the 10 improvement area options maps to a resource category

### Example Display

If a user selected "Thumbnails & titles" and "Understanding YouTube analytics":

```
Thumbnails & Titles
- [Article] How to design click-worthy thumbnails
- [Video] The 3-second thumbnail test
- [Tool] Thumbnail comparison A/B testing

Understanding YouTube Analytics
- [Article] YouTube Studio analytics explained
- [Video] The only metrics that matter under 1K subs
```

### Data Source

- **Initial implementation:** Static JSON/constants file with hand-curated resources per category, matching the 10 improvement areas
- **Future:** Could be AI-generated recommendations or dynamically updated

### Route

`/dashboard/recommendations` — accessible from the main navigation

### Scope Note

The resource content curation (actual links, articles, videos per category) is a separate task. This spec defines the page structure and data flow only.
