# Header Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace sidebar navigation with a horizontal header navigation matching the HTML design reference, branded as "ViewFrenzy".

**Architecture:** The current layout uses `AppShell` → `Sidebar` + `Header` + `main`. We replace this with `AppShell` → `Header` (containing logo, search, nav, actions, avatar) + `main`. Mobile nav moves into a Sheet triggered from a hamburger in the header. The `Sidebar` component is deleted entirely.

**Tech Stack:** Next.js 15 App Router, Tailwind CSS 4, shadcn/ui (Avatar, Button, DropdownMenu, Input, Sheet), Lucide icons.

**Design Reference:** `c:/Users/PC/Downloads/stitch (10)/code.html` lines 32-64.

---

### Task 1: Rewrite `header.tsx` with new design

**Files:**
- Modify: `src/components/header.tsx` (full rewrite)

**Step 1: Rewrite the header component**

Replace the entire contents of `src/components/header.tsx` with:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Film, Search, Bell, Settings, Menu, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface HeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Analytics", href: "/analytics" },
  { label: "Chat", href: "/chat" },
  { label: "Goals", href: "/goals" },
  { label: "Ideas", href: "/ideas" },
];

function getUserInitials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "text-sm font-medium transition-colors",
              isActive
                ? "font-semibold text-primary"
                : "text-muted-foreground hover:text-primary"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-primary/10 bg-white/50 dark:bg-background/50 backdrop-blur-md px-8 py-4 z-10">
      {/* Left: Logo + Search */}
      <div className="flex items-center gap-8">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="bg-primary p-1.5 rounded-lg text-primary-foreground">
            <Film className="size-5" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-primary">
            ViewFrenzy
          </h2>
        </Link>

        <div className="relative hidden md:block w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-primary/60" />
          <Input
            className="w-full bg-primary/5 border-none rounded-xl pl-10 pr-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary/20 placeholder:text-primary/40"
            placeholder="Search..."
            type="text"
          />
        </div>
      </div>

      {/* Right: Nav + Actions */}
      <div className="flex items-center gap-6">
        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-6">
          <NavLinks />
        </nav>

        {/* Action buttons + Avatar */}
        <div className="flex items-center gap-2 border-l border-primary/10 pl-6">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl bg-primary/5 text-primary hover:bg-primary/10"
          >
            <Bell className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl bg-primary/5 text-primary hover:bg-primary/10"
            asChild
          >
            <Link href="/settings">
              <Settings className="size-5" />
            </Link>
          </Button>

          {/* User avatar dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="ml-2 w-10 h-10 rounded-full bg-primary/20 border-2 border-primary/20 overflow-hidden cursor-pointer">
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name ?? "User"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="flex items-center justify-center w-full h-full text-sm font-medium text-primary">
                    {getUserInitials(user.name)}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex flex-col gap-1 px-2 py-1.5">
                {user.name && (
                  <p className="text-sm font-medium">{user.name}</p>
                )}
                {user.email && (
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile hamburger */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="top" className="p-6">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-3">
                <div className="bg-primary p-1.5 rounded-lg text-primary-foreground">
                  <Film className="size-5" />
                </div>
                <span className="text-xl font-bold tracking-tight text-primary">
                  ViewFrenzy
                </span>
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-6 flex flex-col gap-4">
              <NavLinks />
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
```

**Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit`
Expected: No errors related to `header.tsx`

**Step 3: Commit**

```bash
git add src/components/header.tsx
git commit -m "feat: rewrite header with horizontal nav, logo, search, and actions"
```

---

### Task 2: Simplify `app-shell.tsx` — remove sidebar

**Files:**
- Modify: `src/components/app-shell.tsx` (rewrite)

**Step 1: Rewrite app-shell to remove sidebar**

Replace the entire contents of `src/components/app-shell.tsx` with:

```tsx
import { Header } from "@/components/header";

interface AppShellProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  children: React.ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      <Header user={user} />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
```

Note: `"use client"` is removed — AppShell is now a server component since it has no state. The `channel` prop is removed since the header no longer shows channel info.

**Step 2: Update `(app)/layout.tsx` to remove channel query and match new props**

Modify `src/app/(app)/layout.tsx` — remove the prisma channel query and `channel` prop:

```tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <AppShell user={session.user}>
      {children}
    </AppShell>
  );
}
```

**Step 3: Verify no TypeScript errors**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/components/app-shell.tsx src/app/\(app\)/layout.tsx
git commit -m "feat: simplify app-shell, remove sidebar and channel prop"
```

---

### Task 3: Delete `sidebar.tsx`

**Files:**
- Delete: `src/components/sidebar.tsx`

**Step 1: Verify no other files import sidebar**

Run: `grep -r "sidebar" src/components/ src/app/ --include="*.tsx" --include="*.ts" -l`

Expected: Only `sidebar.tsx` itself (if app-shell was already updated in Task 2).

**Step 2: Delete the file**

```bash
rm src/components/sidebar.tsx
```

**Step 3: Verify the dev server runs without errors**

Run: `npm run dev` and open `http://localhost:3000/dashboard` in the browser.
Expected: Page loads with new header, no sidebar visible, no console errors.

**Step 4: Commit**

```bash
git add -u src/components/sidebar.tsx
git commit -m "chore: remove unused sidebar component"
```

---

### Task 4: Update branding — rename "Forge" to "ViewFrenzy" elsewhere

**Files:**
- Modify: `src/components/sidebar.tsx` (already deleted, but check for any remaining "Forge" references)

**Step 1: Search for remaining "Forge" references in source code**

Run: `grep -ri "forge" src/ --include="*.tsx" --include="*.ts" -l`

For each file found, replace "Forge" with "ViewFrenzy" where it refers to the product name (skip import paths, npm packages, etc.).

**Step 2: Commit if changes were made**

```bash
git add -A
git commit -m "chore: rename Forge to ViewFrenzy in source code"
```

---

### Task 5: Visual QA

**Step 1: Run dev server and verify**

Run: `npm run dev`

Check these manually:
- [ ] Header displays logo icon + "ViewFrenzy" text
- [ ] Search bar visible on desktop, hidden on mobile
- [ ] Nav links show: Dashboard, Analytics, Chat, Goals, Ideas
- [ ] Active nav link is bold + primary color
- [ ] Bell and Settings icon buttons render with subtle background
- [ ] User avatar shows with dropdown (name, email, sign out)
- [ ] Mobile: hamburger button shows, opens Sheet with nav links
- [ ] Dark mode: header has translucent backdrop blur
- [ ] Clicking nav links navigates to correct routes
