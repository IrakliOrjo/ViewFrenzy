"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const CONTENT_TABS = [
  { label: "Ideas", href: "/dashboard/content/ideas" },
  { label: "Plans", href: "/dashboard/content/plans" },
] as const;

export default function ContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Content</h1>
        <p className="mt-1 text-muted-foreground">
          Brainstorm ideas and build structured plans.
        </p>
      </div>

      <nav className="flex gap-1 border-b border-border">
        {CONTENT_TABS.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "px-4 py-2.5 text-sm font-medium transition-colors relative",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {isActive && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}
