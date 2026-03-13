import Link from "next/link";
import { Film, PanelLeftClose, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarLogoProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export function SidebarLogo({ isExpanded, onToggle }: SidebarLogoProps) {
  return (
    <div className="relative z-10">
      <div
        className={cn(
          "flex items-center",
          isExpanded ? "gap-3 px-6 py-5" : "flex-col gap-3 p-3 pt-5"
        )}
      >
        <Link href="/dashboard/overview" className="flex items-center gap-3 shrink-0 group">
          <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/25 transition-shadow duration-300 group-hover:shadow-primary/40">
            <Film className="size-5" />
          </div>
          {isExpanded && (
            <h2 className="text-heading tracking-tight text-foreground animate-in fade-in slide-in-from-left-1 duration-200">
              ViewFrenzy
            </h2>
          )}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={cn(
            "shrink-0 text-muted-foreground hover:text-foreground size-8 rounded-lg transition-colors",
            isExpanded && "ml-auto"
          )}
        >
          {isExpanded ? (
            <PanelLeftClose className="size-4" />
          ) : (
            <PanelLeft className="size-4" />
          )}
        </Button>
      </div>

      {/* Gradient separator — fades at edges for elegance */}
      <div
        className={cn(
          "h-px bg-gradient-to-r from-transparent via-sidebar-border to-transparent",
          isExpanded ? "mx-6" : "mx-3"
        )}
      />
    </div>
  );
}
