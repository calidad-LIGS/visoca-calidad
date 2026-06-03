import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  sub,
  accent = "primary",
  onClick,
  icon,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: "primary" | "accent" | "warning" | "danger" | "muted";
  onClick?: () => void;
  icon?: ReactNode;
}) {
  const accentColor: Record<string, string> = {
    primary: "text-primary",
    accent: "text-accent",
    warning: "text-warning",
    danger: "text-danger",
    muted: "text-muted-foreground",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "flex flex-col rounded-lg border border-border bg-card p-4 text-left transition-colors",
        onClick && "hover:border-primary/50 cursor-pointer",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {icon && <span className={accentColor[accent]}>{icon}</span>}
      </div>
      <span className={cn("mt-2 font-display text-3xl font-bold", accentColor[accent])}>
        {value}
      </span>
      {sub && <span className="mt-1 text-xs text-muted-foreground">{sub}</span>}
    </button>
  );
}
