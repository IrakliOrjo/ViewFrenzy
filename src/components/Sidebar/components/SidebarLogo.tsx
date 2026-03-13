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
    <div
      className={cn(
        "flex items-center",
        isExpanded ? "gap-3 p-6" : "flex-col gap-3 p-3 pt-6"
      )}
    >
      <Link href="/dashboard/overview" className="flex items-center gap-3 shrink-0">
        <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
          <Film className="size-5" />
        </div>
        {isExpanded && (
          <h2 className="text-heading tracking-tight text-foreground">
            ViewFrenzy
          </h2>
        )}
      </Link>
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className={cn(
          "shrink-0 text-muted-foreground hover:text-foreground size-8",
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
  );
}
