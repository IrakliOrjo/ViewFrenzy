"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";

interface AppShellProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  channel: {
    title: string;
    thumbnailUrl: string | null;
    subscriberCount: number;
  } | null;
  children: React.ReactNode;
}

export function AppShell({ user, channel, children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        channel={channel}
        isMobileOpen={mobileOpen}
        onMobileOpenChange={setMobileOpen}
      />
      <div className="flex flex-1 flex-col">
        <Header
          user={user}
          onMobileMenuClick={() => setMobileOpen(true)}
        />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
