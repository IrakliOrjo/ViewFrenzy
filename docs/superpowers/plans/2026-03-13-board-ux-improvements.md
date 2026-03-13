# Board UX Improvements Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix board reliability issues, add saving feedback, enforce a 20-item board limit, and improve optimistic state management so drag-and-drop persists correctly.

**Architecture:** All changes are scoped to the board feature (`src/app/(app)/dashboard/board/`) and the plan data/actions layers. No new dependencies. The approach is: (1) enforce the 20-item limit at the data layer + UI, (2) add a saving indicator so users know when a drag is persisting, (3) replace the blunt "revert to initialPlans" recovery with granular rollback per drag operation, (4) sync `initialPlans` after successful server action so subsequent reverts use fresh state.

**Tech Stack:** Next.js 15, @dnd-kit, Prisma, Server Actions

---

## Chunk 1: Board Limit + Saving Indicator + Optimistic State Fix

### Task 1: Enforce 20-item board limit in data layer and toggle action

The board should hold a maximum of 20 plans. Enforce this in `togglePlanOnBoardAction` (the entry point for adding plans to the board) and in `getBoardPlans` (as a safety net). The `AddPlansPicker` and `PlanEditor` toggle should also respect this limit.

**Files:**
- Modify: `src/lib/domains/plan/plan.data.ts` — add `countBoardPlans` query
- Modify: `src/app/(app)/dashboard/content/plans/actions.ts` — enforce limit in `togglePlanOnBoardAction`

**Steps:**

- [ ] **Step 1: Add `countBoardPlans` to plan data layer**

In `src/lib/domains/plan/plan.data.ts`, add:

```typescript
export async function countBoardPlans(userId: string) {
  return prisma.plan.count({ where: { userId, onBoard: true } });
}
```

- [ ] **Step 2: Enforce limit in `togglePlanOnBoardAction`**

In `src/app/(app)/dashboard/content/plans/actions.ts`, update `togglePlanOnBoardAction` to check the count before adding:

```typescript
import { countBoardPlans } from "@/lib/domains/plan/plan.data";

const BOARD_LIMIT = 20;

export async function togglePlanOnBoardAction(id: string, onBoard: boolean) {
  try {
    const userId = await getUserId();
    const plan = await getPlanById(id);
    if (!plan || plan.userId !== userId) {
      return { success: false, error: "Plan not found" };
    }

    if (onBoard) {
      const count = await countBoardPlans(userId);
      if (count >= BOARD_LIMIT) {
        return { success: false, error: `Board is full (max ${BOARD_LIMIT} plans)` };
      }
    }

    await togglePlanOnBoardData(id, onBoard);
    revalidatePlanPaths();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to toggle board",
    };
  }
}
```

- [ ] **Step 3: Verify type check passes**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```
feat: enforce 20-item board limit in toggle action
```

---

### Task 2: Show board limit in AddPlansPicker and board header

Display "X / 20 plans on board" in the board header and disable the "Add" button in the picker when the limit is reached. Pass the board count down from the server component.

**Files:**
- Modify: `src/app/(app)/dashboard/board/page.tsx` — pass `boardCount` to `KanbanBoard`
- Modify: `src/app/(app)/dashboard/board/components/KanbanBoard.tsx` — accept and display `boardCount`, pass to picker
- Modify: `src/app/(app)/dashboard/board/components/AddPlansPicker.tsx` — accept `boardCount`, disable add when at limit

**Steps:**

- [ ] **Step 1: Pass board count from page to KanbanBoard**

In `src/app/(app)/dashboard/board/page.tsx`, the `totalPlans` count is already computed inside `KanbanBoard`. Instead, pass the board plan count from the server so we have an authoritative number:

Add a `boardCount` prop to `KanbanBoard`:
```tsx
<KanbanBoard initialPlans={grouped} offBoardPlans={offBoardPlans} boardCount={boardPlans.length} />
```

- [ ] **Step 2: Update KanbanBoard to show limit**

In `KanbanBoard`, add `boardCount` to the interface and display it in the header:

```tsx
interface KanbanBoardProps {
  initialPlans: IGroupedPlans;
  offBoardPlans?: Plan[];
  boardCount: number;
}
```

Update the count display:
```tsx
<p className="text-sm text-muted-foreground">
  {totalPlans} / 20 plans on board
</p>
```

Pass to `AddPlansPicker`:
```tsx
<AddPlansPicker offBoardPlans={offBoardPlans} boardCount={totalPlans} />
```

- [ ] **Step 3: Update AddPlansPicker to respect limit**

In `AddPlansPicker`, accept `boardCount: number` prop. Show a message and disable adding when at the limit:

```tsx
interface AddPlansPickerProps {
  offBoardPlans: Plan[];
  boardCount: number;
}
```

In the "Add" button, disable when `boardCount >= 20`:
```tsx
<Button
  variant="ghost"
  size="icon"
  className="shrink-0 size-6"
  onClick={() => handleAdd(plan.id)}
  disabled={isPending || boardCount >= 20}
>
```

At the top of the popover content, if at limit, show:
```tsx
{boardCount >= 20 && (
  <p className="text-xs text-destructive text-center py-1">
    Board is full (20 / 20)
  </p>
)}
```

- [ ] **Step 4: Verify type check and build pass**

Run: `npx tsc --noEmit && npx next build`

- [ ] **Step 5: Commit**

```
feat: display board limit (X/20) in header and picker
```

---

### Task 3: Add saving indicator after drag

After a drag completes and the server action is in flight, show a subtle "Saving..." indicator in the board header so the user knows the change is persisting. Clear it on success or error.

**Files:**
- Modify: `src/app/(app)/dashboard/board/components/KanbanBoard.tsx` — add `isSaving` state, show indicator

**Steps:**

- [ ] **Step 1: Add saving state and indicator**

Add a `isSaving` state to `KanbanBoard`:

```tsx
const [isSaving, setIsSaving] = useState(false);
```

In `handleDragEnd`, wrap the server call:

```tsx
const handleDragEnd = useCallback(
  async (event: DragEndEvent) => {
    const { active } = event;
    setActiveId(null);

    const newStatus = findPlanStatus(active.id as string);
    const originalStatus = dragOriginalStatus.current;
    dragOriginalStatus.current = null;

    if (!newStatus || !originalStatus || newStatus === originalStatus) return;

    setIsSaving(true);
    const result = await updatePlanStatusAction(active.id as string, newStatus);
    setIsSaving(false);

    if (result.success) {
      // Update the snapshot so future reverts use the new state
      setLastGoodState({ ...groups });
    } else {
      toast.error(result.error ?? "Failed to update status");
      setGroups(lastGoodState);
    }
  },
  [findPlanStatus, groups, lastGoodState]
);
```

In the header area, next to the count:
```tsx
{isSaving && (
  <span className="text-xs text-muted-foreground animate-pulse">
    Saving...
  </span>
)}
```

- [ ] **Step 2: Verify type check passes**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```
feat: add saving indicator and granular state recovery for board drags
```

---

### Task 4: Replace blunt revert with granular state recovery

Currently, on failure the board reverts to `initialPlans` — the server-rendered snapshot from page load. If the user has done multiple successful drags, reverting loses those changes. Instead, track the last known-good state and revert to that.

**Files:**
- Modify: `src/app/(app)/dashboard/board/components/KanbanBoard.tsx` — add `lastGoodState` ref, update on success, revert to it on failure

**Steps:**

- [ ] **Step 1: Add lastGoodState tracking**

Replace the `initialPlans` revert pattern with a `lastGoodState` ref:

```tsx
const [groups, setGroups] = useState<IGroupedPlans>(initialPlans);
const lastGoodState = useRef<IGroupedPlans>(initialPlans);
```

In `handleDragEnd`, after a successful server call:
```tsx
if (result.success) {
  lastGoodState.current = { ...groups };
} else {
  toast.error(result.error ?? "Failed to update status");
  setGroups(lastGoodState.current);
}
```

In `handleDragCancel`:
```tsx
const handleDragCancel = useCallback(() => {
  setActiveId(null);
  setGroups(lastGoodState.current);
}, []);
```

Note: `lastGoodState` is a ref (not state) to avoid re-renders and stale closure issues. It's updated imperatively after each successful action.

- [ ] **Step 2: Verify type check passes**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```
fix: use granular state recovery instead of blunt revert on drag failure
```

---

### Task 5: Final build verification

- [ ] **Step 1: Run full build**

Run: `npx next build`
Expected: all routes compile, no errors

- [ ] **Step 2: Manual test checklist**

Verify in browser:
1. Drag a plan between columns → "Saving..." appears briefly → card stays in new column after refresh
2. Board header shows "X / 20 plans on board"
3. Add plans from picker — when 20 plans on board, "Add" buttons are disabled and message shows "Board is full"
4. Toggle "Show on Board" in plan editor — blocked when at 20 with toast error
5. Drag a card, then drag another card → both persist on refresh (granular recovery working)
6. Cancel a drag (press Escape or drop back to same column) → card returns to original position

- [ ] **Step 3: Commit all remaining changes**

```
feat: board UX improvements — limit, saving indicator, granular recovery
```
