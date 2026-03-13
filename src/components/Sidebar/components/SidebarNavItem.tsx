"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { type INavItem } from "@/constants/navigation";

interface SidebarNavItemProps {
  item: INavItem;
  isExpanded: boolean;
  onNavigate?: () => void;
}

export function SidebarNavItem({
  item,
  isExpanded,
  onNavigate,
}: SidebarNavItemProps) {
  const pathname = usePathname();
  const isActive = pathname.startsWith(item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={!isExpanded ? item.label : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-all duration-200",
        isActive
          ? "bg-primary/10 font-semibold text-primary"
          : "text-muted-foreground hover:bg-primary/5 hover:text-foreground hover:translate-x-0.5",
        !isExpanded && "justify-center px-3 hover:translate-x-0"
      )}
    >
      {/* Active indicator — glowing accent bar */}
      <div
        className={cn(
          "absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-full bg-primary transition-all duration-300",
          isActive ? "h-5 opacity-100" : "h-0 opacity-0"
        )}
        style={
          isActive
            ? { boxShadow: "0 0 8px oklch(0.69 0.18 52 / 0.5)" }
            : undefined
        }
      />

      <Icon
        className={cn(
          "size-[18px] shrink-0 transition-transform duration-200",
          isActive && "scale-110"
        )}
      />

      {isExpanded && (
        <span className="truncate animate-in fade-in duration-150">
          {item.label}
        </span>
      )}
    </Link>
  );
}
