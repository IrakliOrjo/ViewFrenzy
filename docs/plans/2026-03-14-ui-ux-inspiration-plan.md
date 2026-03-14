# UI/UX Investigation & Implementation Plan

## Overview
This plan outlines the steps to investigate top-tier productivity apps (Linear, Amie, Arc Browser, Notion, Superhuman) and integrate their best-in-class UX patterns into Forge. The goal is to elevate Forge from a standard dashboard to a highly engaging, habit-forming power tool for creators.

## Phase 1: Investigation & Research (What to study)

### Step 1: Study Linear (Flow State & Speed)
- [ ] **Action:** Go to YouTube and search for "Linear app workflow" or "Linear app design deep dive."
- [ ] **Action:** Create a free Linear account (linear.app) and click around the interface.
- [ ] **What to observe:**
  - Notice the lack of loading spinners. Actions feel instant (optimistic UI).
  - Try using the Global Command Menu (`Cmd+K` / `Ctrl+K`). Notice how you can navigate the entire app without a mouse.
  - Look at the Kanban board. Observe the subtle borders, the typography contrast (muted grays vs bright white text), and the drag-and-drop feel.

### Step 2: Study Amie (Joyful Interactions)
- [ ] **Action:** Search YouTube for "Amie app walkthrough" or check their website (amie.so).
- [ ] **What to observe:**
  - Watch the micro-interactions when tasks are completed (e.g., subtle confetti, sounds, satisfying checkmarks).
  - Look at how they use color. It’s a productivity app but feels playful, not like sterile corporate software.
  - See how seamless the drag-and-drop experience is from a "todo list" onto a "calendar."

### Step 3: Study Arc Browser (Context Preservation)
- [ ] **Action:** Download Arc Browser (if on Mac/Windows) or watch an "Arc Browser features" video on YouTube.
- [ ] **What to observe:**
  - Look at the sidebar UI and how it replaces traditional top tabs.
  - Notice "Split View" and "Peek Windows." When you click a link, it doesn't always take you to a new page; sometimes it opens a modal overlay (Peek) so you don't lose your place.
  - Think about how a collapsible right-sidebar would work perfectly for the Forge AI Coach.

### Step 4: Study Notion (The Blank Canvas)
- [ ] **Action:** Open Notion (notion.so) and create a new page.
- [ ] **What to observe:**
  - Type `/` and look at the slash command menu. Notice how intuitive it feels to summon tools directly inline without moving your mouse to a toolbar.
  - Look at their template gallery. It's highly visual and makes complex setups one-click easy (great for your "Success Blueprints" feature).

### Step 5: Study Superhuman (Habit Loops)
- [ ] **Action:** Search YouTube for "Superhuman email workflow."
- [ ] **What to observe:**
  - See how they enforce "Inbox Zero" and make it a game.
  - Notice the keyboard shortcut dependency (`E` for done, `Cmd+K` for actions).
  - Observe how visually clean the "Inbox" is, encouraging the user to process items quickly.

---

## Phase 2: Implementation Plan for Forge (What to build)

### Step 1: Implement the Global Command Menu (Linear Style)
- [ ] **Component:** Install shadcn/ui Command (`npx shadcn@latest add command`).
- [ ] **Task:** Create a global `CommandPalette` component that listens for `Cmd+K` (or `Ctrl+K`).
- [ ] **Features to add:**
  - **Quick navigation:** "Go to Dashboard", "Go to Ideas", "Go to Settings".
  - **Quick actions:** "Create new idea", "Ask Coach a question".
  - **Global search:** Search through existing Ideas by name or ID.

### Step 2: Build the Slide-out AI Coach (Arc Split-View Style)
- [ ] **Component:** Install shadcn/ui Sheet (`npx shadcn@latest add sheet`).
- [ ] **Task:** Move the AI Chat interface from a dedicated full-page view into a persistent right-side Sheet overlay (or a collapsible right sidebar).
- [ ] **UX Goal:** A user should be able to look at their Analytics chart on the main page, toggle the Sheet open, and ask the AI "Why did this dip on Tuesday?" without losing visual context of the chart.

### Step 3: Enhance the Ideas Kanban Board (Linear Style)
- [ ] **Task:** Polish the drag-and-drop board. Give each idea a generated ID (e.g., `VID-14`) to make it feel official.
- [ ] **UX Goal:** Ensure "optimistic UI" is used. When dragging a card from `Planning` to `In Progress`, update the React state immediately before the database request finishes so it feels instantaneous.
- [ ] **Styling:** Use a clean, muted palette (e.g., Tailwind's `zinc-900` for backgrounds, `zinc-800` for cards) with vibrant accent colors for status badges.

### Step 4: Add Slash Commands to the Idea Editor (Notion Style)
- [ ] **Task:** Update `NewIdeaEditor.tsx` or `usePlanEditor.ts` to detect when the user types `/` on a new line.
- [ ] **UX Goal:** Open a small popover menu offering AI actions:
  - `/generate-hook` (AI writes a hook based on the title)
  - `/suggest-titles` (AI gives 3 alternative titles)
  - `/nichebend` (AI suggests how to apply a different format to this topic)
- [ ] **Implementation:** This can be done by extending your current rich text editor (e.g., using TipTap or Plate.js if you have one) or by building a custom floating menu over a standard `textarea`.

### Step 5: Build the "Coach Inbox" (Superhuman Style)
- [ ] **Task:** Create a dedicated "Inbox" or "Check-ins" section on the Dashboard.
- [ ] **UX Goal:** Instead of just sending a push notification and forgetting it, queue up AI messages here (e.g., "Weekly Review Ready", "You missed your upload goal").
- [ ] **Interaction:** The creator must click into them, read the AI's insight, and hit a "Mark as Read" or "Acknowledge" button. Add a satisfying micro-interaction when they clear their inbox.

### Step 6: Add Keyboard Shortcuts & Micro-interactions (Amie Style)
- [ ] **Task:** Install `react-hotkeys-hook` (or similar).
- [ ] **Shortcuts to add:**
  - `C` - Toggle Chat open/closed.
  - `I` - New Idea modal.
  - `D` - Go to Dashboard.
- [ ] **Task:** Add a library like `canvas-confetti` or `framer-motion` for subtle, joyful animations when a creator moves an idea to "Published" or hits a subscriber milestone.