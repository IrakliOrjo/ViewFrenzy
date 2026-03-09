import {
  LayoutDashboard,
  BarChart3,
  MessageSquare,
  Target,
  Lightbulb,
  type LucideIcon,
} from "lucide-react";

export interface INavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: INavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Chat", href: "/chat", icon: MessageSquare },
  { label: "Goals", href: "/goals", icon: Target },
  { label: "Ideas", href: "/ideas", icon: Lightbulb },
];
