import {
  LayoutDashboard,
  Kanban,
  FileText,
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
  { label: "Board", href: "/dashboard/board", icon: Kanban },
  { label: "Content", href: "/dashboard/content", icon: FileText },
  { label: "Goals", href: "/dashboard/goals", icon: Target },
  { label: "Chat", href: "/dashboard/chat", icon: MessageSquare },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];
