export interface INavItem {
  label: string;
  href: string;
}

export const NAV_ITEMS: INavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Analytics", href: "/analytics" },
  { label: "Chat", href: "/chat" },
  { label: "Goals", href: "/goals" },
  { label: "Ideas", href: "/ideas" },
];
