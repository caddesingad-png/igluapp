import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-body font-semibold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 btn-press",
  {
    variants: {
      variant: {
        /* Primary — Rose Antique gradient pebble */
        default: "pebble",
        carbon:
          "bg-btn-dark text-btn-dark-fg hover:bg-btn-dark/92 rounded-2xl shadow-soft-sm active:shadow-soft-inset",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/92 rounded-2xl shadow-soft-sm active:shadow-soft-inset",
        outline:
          "glass text-foreground hover:bg-card/90 rounded-2xl",
        secondary:
          "surface-neu text-foreground rounded-2xl",
        ghost:
          "hover:bg-muted/60 hover:text-foreground rounded-2xl",
        link:
          "text-muted-foreground underline-offset-4 hover:underline hover:text-foreground",
      },
      size: {
        default: "h-[52px] px-6 py-2 text-[15px] tracking-[0.01em]",
        sm: "h-10 px-4 text-[13px]",
        lg: "h-[56px] px-8 text-[15px] tracking-[0.01em]",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
