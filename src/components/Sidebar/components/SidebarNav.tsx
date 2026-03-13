import { NAV_ITEMS, NAV_UTILITY_ITEMS } from "@/constants/navigation";
import { SidebarNavItem } from "@/components/Sidebar/components/SidebarNavItem";
import { cn } from "@/lib/utils";

interface SidebarNavProps {
  isExpanded: boolean;
  onNavigate?: () => void;
}

export function SidebarNav({ isExpanded, onNavigate }: SidebarNavProps) {
  return (
    <div className="relative z-10 flex flex-col flex-1 mt-4">
      {/* Section label */}
      {isExpanded && (
        <p className="text-label text-muted-foreground/40 px-7 mb-2 animate-in fade-in duration-200">
          Menu
        </p>
      )}

      {/* Main navigation */}
      <nav className="space-y-0.5 px-3">
        {NAV_ITEMS.map((item) => (
          <SidebarNavItem
            key={item.href}
            item={item}
            isExpanded={isExpanded}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      {/* Spacer pushes utility items to the bottom */}
      <div className="flex-1 min-h-4" />

      {/* Gradient separator */}
      <div
        className={cn(
          "h-px bg-gradient-to-r from-transparent via-sidebar-border to-transparent mb-2",
          isExpanded ? "mx-6" : "mx-3"
        )}
      />

      {/* Utility navigation (Settings) */}
      <nav className="space-y-0.5 px-3 pb-2">
        {NAV_UTILITY_ITEMS.map((item) => (
          <SidebarNavItem
            key={item.href}
            item={item}
            isExpanded={isExpanded}
            onNavigate={onNavigate}
          />
        ))}
      </nav>
    </div>
  );
}
