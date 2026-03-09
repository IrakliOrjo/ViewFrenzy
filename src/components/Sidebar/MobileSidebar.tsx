"use client";

import { useState } from "react";
import Link from "next/link";
import { Film, Menu } from "lucide-react";
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

export function MobileSidebar() {
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
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="p-6 pb-0">
          <SheetTitle>
            <Link
              href="/dashboard"
              className="flex items-center gap-3"
              onClick={() => setOpen(false)}
            >
              <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                <Film className="size-5" />
              </div>
              <span className="text-heading tracking-tight text-foreground">
                ViewFrenzy
              </span>
            </Link>
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-col flex-1 mt-4">
          <SidebarNav isExpanded onNavigate={() => setOpen(false)} />
          <SidebarUpgradeCard />
        </div>
      </SheetContent>
    </Sheet>
  );
}
