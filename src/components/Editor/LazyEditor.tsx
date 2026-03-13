"use client";

import dynamic from "next/dynamic";

export const LazyEditor = dynamic(
  () => import("@/components/Editor/Editor").then((m) => m.Editor),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[200px] animate-pulse rounded-lg bg-muted" />
    ),
  }
);
