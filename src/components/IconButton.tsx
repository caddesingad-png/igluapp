import { forwardRef, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visible bg size — hit area is always ≥44px via padding. */
  size?: "sm" | "md" | "lg";
  /** Visible variant. Hit area stays 44px regardless. */
  variant?: "ghost" | "neu" | "glass" | "danger";
  /** Required for accessibility — icon buttons must have aria-label. */
  "aria-label": string;
}

/**
 * Accessible icon button that ALWAYS exposes a ≥44×44 tap target (iOS HIG / Android Material).
 * The visible chip can be smaller; surrounding padding keeps the hit area safe.
 */
const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ size = "md", variant = "ghost", className, children, ...props }, ref) => {
    const visibleSize = {
      sm: "h-8 w-8",   // 32px visible
      md: "h-10 w-10", // 40px visible
      lg: "h-11 w-11", // 44px visible
    }[size];

    const variantClass = {
      ghost: "text-foreground hover:bg-muted/60",
      neu: "surface-neu text-foreground",
      glass: "glass text-foreground",
      danger: "text-destructive hover:bg-destructive/10",
    }[variant];

    return (
      <button
        ref={ref}
        // Outer wrapper: 44×44 hit area, centered. Inner chip is the visible part.
        className={cn(
          "relative inline-flex items-center justify-center btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0 rounded-full",
          "min-h-[44px] min-w-[44px]",
          className,
        )}
        {...props}
      >
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-full transition-colors",
            visibleSize,
            variantClass,
          )}
        >
          {children}
        </span>
      </button>
    );
  },
);
IconButton.displayName = "IconButton";

export default IconButton;
