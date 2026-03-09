"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Film, Search, Bell, Settings, Menu, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface HeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Analytics", href: "/analytics" },
  { label: "Chat", href: "/chat" },
  { label: "Goals", href: "/goals" },
  { label: "Ideas", href: "/ideas" },
];

function getUserInitials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "text-sm font-medium transition-colors",
              isActive
                ? "font-semibold text-primary"
                : "text-muted-foreground hover:text-primary"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

export function Header({ user }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="flex items-center justify-between border-b border-primary/10 bg-white/50 dark:bg-background/50 backdrop-blur-md px-8 py-4 z-10">
      {/* Left: Logo + Search */}
      <div className="flex items-center gap-8">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="bg-primary p-1.5 rounded-lg text-primary-foreground">
            <Film className="size-5" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-primary">
            ViewFrenzy
          </h2>
        </Link>

        <div className="relative hidden md:block w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-primary/60" />
          <Input
            className="w-full bg-primary/5 border-none rounded-xl pl-10 pr-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary/20 placeholder:text-primary/40"
            placeholder="Search..."
            type="text"
          />
        </div>
      </div>

      {/* Right: Nav + Actions */}
      <div className="flex items-center gap-6">
        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-6">
          <NavLinks />
        </nav>

        {/* Action buttons + Avatar */}
        <div className="flex items-center gap-2 border-l border-primary/10 pl-6">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl bg-primary/5 text-primary hover:bg-primary/10"
          >
            <Bell className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl bg-primary/5 text-primary hover:bg-primary/10"
            asChild
          >
            <Link href="/settings">
              <Settings className="size-5" />
            </Link>
          </Button>

          {/* User avatar dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="ml-2 cursor-pointer">
                <Avatar className="h-10 w-10 border-2 border-primary/20">
                  {user.image && (
                    <AvatarImage src={user.image} alt={user.name ?? "User"} />
                  )}
                  <AvatarFallback className="bg-primary/20 text-sm font-medium text-primary">
                    {getUserInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex flex-col gap-1 px-2 py-1.5">
                {user.name && (
                  <p className="text-sm font-medium">{user.name}</p>
                )}
                {user.email && (
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile hamburger */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="top" className="p-6">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-3">
                <div className="bg-primary p-1.5 rounded-lg text-primary-foreground">
                  <Film className="size-5" />
                </div>
                <span className="text-xl font-bold tracking-tight text-primary">
                  ViewFrenzy
                </span>
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-6 flex flex-col gap-4">
              <NavLinks onNavigate={() => setMobileOpen(false)} />
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
