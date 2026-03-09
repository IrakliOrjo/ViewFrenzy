import { Button } from "@/components/ui/button";

export function SidebarUpgradeCard() {
  return (
    <div className="p-4 mt-auto">
      <div className="bg-gradient-to-br from-amber-100/30 to-primary/20 dark:from-amber-900/20 dark:to-primary/10 p-4 rounded-2xl border border-primary/10">
        <p className="text-label text-primary mb-2">Pro Plan</p>
        <p className="text-body-sm text-muted-foreground mb-3">
          Unlock AI title generation & deep SEO tags.
        </p>
        <Button className="w-full shadow-md shadow-primary/20" size="sm">
          Upgrade Now
        </Button>
      </div>
    </div>
  );
}
