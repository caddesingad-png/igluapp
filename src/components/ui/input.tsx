import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-[52px] w-full rounded-2xl border-0 bg-background/60 px-4 py-2 text-[15px] font-body text-foreground ring-offset-background shadow-soft-inset",
          "placeholder:text-[hsl(var(--muted-foreground)/0.55)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-shadow duration-200",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
