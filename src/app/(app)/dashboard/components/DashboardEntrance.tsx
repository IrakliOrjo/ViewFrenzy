"use client";

import { useEffect, useRef, useState } from "react";
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
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Force the browser to compute the initial invisible styles
    // before adding the class that triggers transitions
    if (ref.current) {
      // Read a layout property to force style recalculation
      void ref.current.offsetHeight;
    }
    // Small delay ensures the invisible state is painted first
    const id = setTimeout(() => setReady(true), 50);
    return () => clearTimeout(id);
  }, []);

  return (
    <div ref={ref} className={cn(className, ready && "dash-ready")}>
      {children}
    </div>
  );
}
