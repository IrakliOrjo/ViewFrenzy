"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Film, Search, Bell, Settings, Menu, LogOut, X } from "lucide-react";
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
import { getUserInitials } from "@/helpers/getUserInitials";
import { NavLinks } from "@/components/Header/components/NavLinks";

interface HeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function Header({ user }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  return (
    <header className="flex items-center justify-between gap-4 border-b border-primary/10 bg-white/50 dark:bg-background/50 backdrop-blur-md px-4 py-4 lg:px-8 z-10">
      {/* Left: Logo + Search */}
      <div className="flex items-center gap-4 lg:gap-8 flex-1 min-w-0">
        {/* Mobile: expanded search replaces logo */}
        {searchOpen && (
          <div className="flex items-center gap-2 flex-1 md:hidden">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-primary/60" />
              <Input
                ref={searchInputRef}
                className="w-full bg-primary/5 border-none rounded-xl pl-10 pr-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary/20 placeholder:text-primary/40"
                placeholder="Search..."
                type="text"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground"
              onClick={() => setSearchOpen(false)}
            >
              <X className="size-5" />
            </Button>
          </div>
        )}

        {/* Logo — hidden on mobile when search is expanded */}
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-3 shrink-0",
            searchOpen && "hidden md:flex"
          )}
        >
          <div className="bg-primary p-1.5 rounded-lg text-primary-foreground">
            <Film className="size-5" />
          </div>
          <h2 className="text-heading tracking-tight text-primary hidden sm:block">
            ViewFrenzy
          </h2>
        </Link>

        {/* Mobile: search icon trigger */}
        {!searchOpen && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-xl bg-primary/5 text-primary hover:bg-primary/10"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="size-5" />
          </Button>
        )}

        {/* Desktop: inline search input */}
        <div className="relative hidden md:block flex-1 max-w-64">
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
        <nav className="hidden lg:flex items-center gap-6">
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
              className="lg:hidden"
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
                <span className="text-heading tracking-tight text-primary">
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
