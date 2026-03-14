import {
  LayoutDashboard,
  Columns3,
  PenSquare,
  Target,
  MessageSquare,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface INavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: INavItem[] = [
  { label: "Overview", href: "/dashboard/overview", icon: LayoutDashboard },
  { label: "Board", href: "/dashboard/board", icon: Columns3 },
  { label: "Content", href: "/dashboard/content", icon: PenSquare },
  { label: "Goals", href: "/dashboard/goals", icon: Target },
  { label: "Chat", href: "/dashboard/chat", icon: MessageSquare },
];

export const NAV_UTILITY_ITEMS: INavItem[] = [
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export const CONTENT_TABS = [
  { label: "Ideas", href: "/dashboard/content/ideas" },
  { label: "Plans", href: "/dashboard/content/plans" },
] as const;
