import { cn } from "@/lib/utils";

type ActionButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "outline";
};

export function ActionButton({
  variant = "solid",
  className,
  children,
  ...props
}: ActionButtonProps) {
  return (
    <button
      className={cn(
        "px-4 py-2 text-sm font-bold rounded-lg transition-colors cursor-pointer",
        variant === "solid" &&
          "bg-primary text-primary-foreground hover:bg-primary/90",
        variant === "outline" &&
          "border border-primary/20 text-primary hover:bg-primary/5",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
