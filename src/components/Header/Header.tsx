"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Film, Search, Bell, Settings, LogOut, X } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { getUserInitials } from "@/helpers/getUserInitials";
import { MobileSidebar } from "@/components/Sidebar/MobileSidebar";
import { XpLevelBar } from "@/components/Header/components/XpLevelBar";
import type { ILevelInfo } from "@/helpers/calculateLevel";

interface HeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  levelInfo: ILevelInfo;
}

export function Header({ user, levelInfo }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  return (
    <header className="flex items-center justify-between gap-4 border-b border-primary/10 bg-white/50 dark:bg-background/50 backdrop-blur-md px-4 py-4 lg:px-8 z-10">
      {/* Left: Mobile menu + Logo + Search */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <MobileSidebar levelInfo={levelInfo} />

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

        {/* Logo — only visible on mobile (desktop logo is in sidebar) */}
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-3 shrink-0 md:hidden",
            searchOpen && "hidden"
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
        <div className="relative hidden md:block flex-1 max-w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-primary/60" />
          <Input
            className="w-full bg-primary/5 border-none rounded-xl pl-10 pr-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary/20 placeholder:text-primary/40"
            placeholder="Search analytics or videos..."
            type="text"
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <XpLevelBar levelInfo={levelInfo} />

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
    </header>
  );
}
