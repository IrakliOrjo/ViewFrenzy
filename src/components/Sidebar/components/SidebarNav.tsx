import { NAV_ITEMS } from "@/constants/navigation";
import { SidebarNavItem } from "@/components/Sidebar/components/SidebarNavItem";

interface SidebarNavProps {
  isExpanded: boolean;
  onNavigate?: () => void;
}

export function SidebarNav({ isExpanded, onNavigate }: SidebarNavProps) {
  return (
    <nav className="flex-1 space-y-1 px-3 mt-4">
      {NAV_ITEMS.map((item) => (
        <SidebarNavItem
          key={item.href}
          item={item}
          isExpanded={isExpanded}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}
