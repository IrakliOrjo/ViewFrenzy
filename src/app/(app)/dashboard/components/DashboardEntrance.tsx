"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface DashboardEntranceProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardEntrance({
  children,
  className,
}: DashboardEntranceProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Double rAF ensures browser has painted the initial invisible state
    // before triggering transitions, preventing animation skip
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setReady(true));
    });
  }, []);

  return (
    <div className={cn(className, ready && "dash-ready")}>{children}</div>
  );
}
