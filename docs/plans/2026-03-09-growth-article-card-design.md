# Growth Article Card — Design Doc

**Date:** 2026-03-09

## Overview

A dashboard card that displays the latest YouTube growth article from curated RSS feeds. Shows a thumbnail (or placeholder), title, and source name. Clicking opens the article in a new tab.

## Data Source

RSS feeds from curated YouTube growth blogs (e.g., vidIQ, TubeBuddy, Think Media). Parsed server-side using `rss-parser` npm package.

## Behavior

- Shows **1 featured article** — the most recent across all feeds
- Rotates only when a newer article is published
- Cached with Next.js `revalidate` (~6 hours) to avoid hitting feeds on every load

## Card Layout

- Card shell: `bg-card p-6 rounded-xl shadow-sm border border-primary/5` (consistent with dashboard)
- Header: "Growth Reading" + `BookOpen` icon (Lucide)
- Thumbnail: full-width, rounded, ~160px tall, uses `next/image`
  - Fallback: `Newspaper` icon on muted background when no image available
- Title: bold, truncate to 2 lines, `hover:text-primary` transition
- Footer: source name + "Read article" in muted caption text
- Entire card clickable, opens article URL in `target="_blank"`

## RSS Feed Configuration

Store feed URLs in a constants file (`src/constants/rssFeeds.ts`). Start with 2-3 feeds. Easy to add more later.

## Placement

Dashboard page, below Coach's Note + Recommended Actions row, in a 2-column grid alongside Recent Videos.

## Architecture

- Server component (no `"use client"`)
- RSS fetch + parse happens in a data function (`src/app/(app)/dashboard/data/getGrowthArticle.ts`)
- Uses Next.js `unstable_cache` or `fetch` with `next.revalidate` for 6-hour caching
- `next.config.ts` needs new `remotePatterns` entries for article thumbnail domains (or use `unoptimized` for unknown domains)
