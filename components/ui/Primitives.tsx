import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";
import { EIGHT_POINT_STAR_PATH } from "../../lib/star-path";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost";
  icon?: ReactNode;
}

export function Button({ variant = "primary", icon, className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none",
        variant === "primary" && "ink-btn hover:brightness-110 active:scale-[0.98]",
        variant === "outline" &&
          "border border-[var(--surface-glass-border)] text-[var(--text-primary)] hover:border-[var(--gold)] hover:text-[var(--gold)]",
        variant === "ghost" && "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]",
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}

export function GlassCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("glass-card p-5", className)} {...props} />;
}

export function Spinner({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      className={cn("animate-[spin_2.8s_linear_infinite]", className)}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      role="status"
      aria-label="Loading"
    >
      <path d={EIGHT_POINT_STAR_PATH} fill="var(--gold)" opacity={0.9} />
    </svg>
  );
}
