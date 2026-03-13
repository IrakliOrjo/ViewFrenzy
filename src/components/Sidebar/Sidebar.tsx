"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { SidebarLogo } from "@/components/Sidebar/components/SidebarLogo";
import { SidebarNav } from "@/components/Sidebar/components/SidebarNav";
import { SidebarUpgradeCard } from "@/components/Sidebar/components/SidebarUpgradeCard";

export function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <aside
      className={cn(
        "relative hidden md:flex flex-col border-r border-sidebar-border bg-sidebar backdrop-blur-xl transition-all duration-300 overflow-hidden",
        isExpanded ? "w-64" : "w-[72px]"
      )}
    >
      {/* Warm ambient glow at top */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-primary/[0.04] to-transparent" />

      <SidebarLogo
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded((prev) => !prev)}
      />
      <SidebarNav isExpanded={isExpanded} />
      {isExpanded && <SidebarUpgradeCard />}
    </aside>
  );
}
