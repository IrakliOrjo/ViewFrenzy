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
        "hidden md:flex flex-col border-r border-sidebar-border bg-sidebar/50 backdrop-blur-md transition-all duration-300",
        isExpanded ? "w-64" : "w-[72px]"
      )}
    >
      <SidebarLogo
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded((prev) => !prev)}
      />
      <SidebarNav isExpanded={isExpanded} />
      {isExpanded && <SidebarUpgradeCard />}
    </aside>
  );
}
