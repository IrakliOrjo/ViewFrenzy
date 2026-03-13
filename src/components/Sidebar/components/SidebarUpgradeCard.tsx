import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SidebarUpgradeCard() {
  return (
    <div className="relative z-10 p-4">
      {/* Animated shimmer border wrapper */}
      <div className="relative rounded-2xl p-px overflow-hidden">
        <div
          className="absolute inset-0 rounded-2xl"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, oklch(0.69 0.18 52 / 0.3) 50%, transparent 100%)",
            backgroundSize: "200% 100%",
            animation: "sidebar-shimmer 4s ease-in-out infinite",
          }}
        />

        <div className="relative bg-gradient-to-br from-amber-50/80 to-orange-50/80 dark:from-amber-950/40 dark:to-orange-950/30 p-4 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="size-3.5 text-primary" />
            <p className="text-label text-primary">Pro Plan</p>
          </div>
          <p className="text-body-sm text-muted-foreground mb-3">
            Unlock AI title generation & deep SEO tags.
          </p>
          <Button className="w-full shadow-md shadow-primary/20" size="sm">
            Upgrade Now
          </Button>
        </div>
      </div>
    </div>
  );
}
