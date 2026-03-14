"use client";

import { useState } from "react";
import Link from "next/link";
import { Film, Menu, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarNav } from "@/components/Sidebar/components/SidebarNav";
import { SidebarUpgradeCard } from "@/components/Sidebar/components/SidebarUpgradeCard";
import type { ILevelInfo } from "@/helpers/calculateLevel";

interface MobileSidebarProps {
  levelInfo: ILevelInfo;
}

export function MobileSidebar({ levelInfo }: MobileSidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden shrink-0"
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 overflow-hidden">
        {/* Warm ambient glow */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-primary/[0.04] to-transparent z-0" />

        <SheetHeader className="relative z-10 p-6 pb-0">
          <SheetTitle>
            <Link
              href="/dashboard/overview"
              className="flex items-center gap-3 group"
              onClick={() => setOpen(false)}
            >
              <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/25 transition-shadow duration-300 group-hover:shadow-primary/40">
                <Film className="size-5" />
              </div>
              <span className="text-heading tracking-tight text-foreground">
                ViewFrenzy
              </span>
            </Link>
          </SheetTitle>
        </SheetHeader>

        {/* XP Level Bar — mobile */}
        <div className="relative z-10 mx-4 mt-4 p-3 rounded-xl bg-primary/5 border border-primary/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center size-6 rounded-lg bg-primary text-primary-foreground">
                <Zap className="size-3.5 fill-current" />
              </div>
              <span className="text-sm font-bold text-primary">
                Lv.{levelInfo.level}
              </span>
              <span className="text-sm font-medium text-foreground/70">
                {levelInfo.title}
              </span>
            </div>
            <span className="text-xs font-medium text-muted-foreground tabular-nums">
              {levelInfo.isMaxLevel
                ? `${levelInfo.currentXp} XP`
                : `${levelInfo.xpProgress} / ${levelInfo.xpNeeded} XP`}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-primary/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-700 ease-out"
              style={{ width: `${levelInfo.progressPercent}%` }}
            />
          </div>
        </div>

        {/* Gradient separator */}
        <div className="relative z-10 mx-6 mt-4 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="relative z-10 flex flex-col flex-1 mt-2">
          <SidebarNav isExpanded onNavigate={() => setOpen(false)} />
          <SidebarUpgradeCard />
        </div>
      </SheetContent>
    </Sheet>
  );
}
