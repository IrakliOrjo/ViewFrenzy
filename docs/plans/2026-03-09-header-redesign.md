# Header Redesign — Replace Sidebar with Header Navigation

**Date:** 2026-03-09
**Status:** Approved

## Summary

Replace the current sidebar-based navigation with a horizontal header navigation matching the HTML design reference (`c:/Users/PC/Downloads/stitch (10)/code.html`). Brand name: **ViewFrenzy**.

## Header Structure

```
[Logo icon + "ViewFrenzy"] [Search bar]          [Nav links] | [Notifications] [Settings] [Avatar dropdown]
```

### Left Section
- **Logo:** Lucide `Film` icon in a `bg-primary rounded-lg p-1.5 text-white` container + "ViewFrenzy" in `text-xl font-bold tracking-tight text-primary`
- **Search bar:** `w-64`, `bg-primary/5 border-none rounded-xl`, Search icon prefix, placeholder "Search..."

### Center/Right Section — Nav Links
- Horizontal nav, hidden on mobile (`hidden md:flex`)
- Items: Dashboard (`/dashboard`), Analytics (future), Chat (`/chat`), Goals (`/goals`), Ideas (`/ideas`)
- Active: `text-sm font-semibold text-primary`
- Inactive: `text-sm font-medium text-muted-foreground hover:text-primary transition-colors`

### Right Section — Actions
- Separated from nav by `border-l border-primary/10 pl-6`
- Notification bell icon button: `p-2 rounded-xl bg-primary/5 text-primary hover:bg-primary/10`
- Settings icon button: same style, links to `/settings`
- User avatar: `w-10 h-10 rounded-full bg-primary/20 border-2 border-primary/20`, with existing dropdown menu (user info + sign out)

### Header Container
- `flex items-center justify-between border-b border-primary/10 bg-white/50 dark:bg-background/50 backdrop-blur-md px-8 py-4 z-10`

### Mobile Behavior
- Nav links hidden below `md` breakpoint
- Hamburger menu button visible on mobile, opens Sheet with nav links
- Search bar hidden on mobile (or collapsed to icon)

## Files Changed

### Modified
- `src/components/header.tsx` — Complete rewrite with new design
- `src/components/app-shell.tsx` — Remove sidebar, simplify to header + main

### Deleted
- `src/components/sidebar.tsx` — No longer needed

### No Changes
- `src/app/globals.css` — Existing theme colors already match (warm orange primary)
- `src/components/ui/*` — Use existing shadcn components (Avatar, Button, DropdownMenu, Input, Sheet)

## Icon Mapping (Material Symbols → Lucide)
- `movie_filter` → `Film`
- `search` → `Search`
- `notifications` → `Bell`
- `settings` → `Settings`
- `menu` → `Menu`

## Design Reference
- HTML source: `c:/Users/PC/Downloads/stitch (10)/code.html` (lines 32-64)
- Primary color: `#f47b25` / `oklch(0.69 0.18 52)` — already in theme
