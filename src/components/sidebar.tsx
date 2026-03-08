"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Target,
  Lightbulb,
  Settings,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface SidebarProps {
  channel: {
    title: string;
    thumbnailUrl: string | null;
    subscriberCount: number;
  } | null;
  isMobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
}

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Chat", href: "/chat", icon: MessageSquare },
  { label: "Goals", href: "/goals", icon: Target },
  { label: "Ideas", href: "/ideas", icon: Lightbulb },
  { label: "Settings", href: "/settings", icon: Settings },
];

function SidebarBranding({
  channel,
}: {
  channel: SidebarProps["channel"];
}) {
  if (channel) {
    return (
      <div className="flex items-center gap-3 px-3 py-4">
        <Avatar size="lg">
          {channel.thumbnailUrl && (
            <AvatarImage src={channel.thumbnailUrl} alt={channel.title} />
          )}
          <AvatarFallback>
            {channel.title.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-sidebar-foreground">
            {channel.title}
          </p>
          <p className="text-xs text-muted-foreground">
            {channel.subscriberCount.toLocaleString()} subscribers
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-4">
      <h1 className="text-xl font-bold text-sidebar-foreground">Forge</h1>
    </div>
  );
}

function NavLinks({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar({
  channel,
  isMobileOpen,
  onMobileOpenChange,
}: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:h-screen md:sticky md:top-0 bg-sidebar border-r border-sidebar-border">
        <SidebarBranding channel={channel} />
        <Separator className="bg-sidebar-border" />
        <div className="mt-2 flex-1">
          <NavLinks />
        </div>
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={isMobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="left" className="w-64 bg-sidebar p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <SidebarBranding channel={channel} />
          <Separator className="bg-sidebar-border" />
          <div className="mt-2">
            <NavLinks onNavigate={() => onMobileOpenChange(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
