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
        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors",
        isActive
          ? "bg-primary/10 font-semibold text-primary"
          : "text-muted-foreground hover:bg-primary/5",
        !isExpanded && "justify-center px-3"
      )}
    >
      <Icon className="size-5 shrink-0" />
      {isExpanded && item.label}
    </Link>
  );
}
