"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/constants/navigation";

interface NavLinksProps {
  onNavigate?: () => void;
}

export function NavLinks({ onNavigate }: NavLinksProps) {
  const pathname = usePathname();

  return (
    <>
      {NAV_ITEMS.map((item) => {
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
