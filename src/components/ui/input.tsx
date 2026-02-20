import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-[52px] w-full rounded-md border border-border bg-card px-3 py-2 text-[15px] font-body text-foreground ring-offset-background",
          "placeholder:text-[hsl(var(--muted-foreground)/0.6)]",
          "focus-visible:outline-none focus-visible:border-primary focus-visible:ring-0",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-colors duration-150",
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
