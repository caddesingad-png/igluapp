import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-body font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /* Primary: dark charcoal background */
        default:
          "bg-btn-dark text-btn-dark-fg hover:bg-btn-dark/90 rounded-md",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-md",
        /* Secondary: transparent with charcoal border */
        outline:
          "border border-foreground bg-transparent text-foreground hover:bg-muted rounded-md",
        secondary:
          "bg-muted text-muted-foreground hover:bg-muted/80 rounded-md",
        ghost:
          "hover:bg-muted hover:text-foreground rounded-md",
        link:
          "text-muted-foreground underline-offset-4 hover:underline",
      },
      size: {
        default: "h-[52px] px-5 py-2 text-[14px] tracking-[0.04em]",
        sm: "h-9 rounded-md px-3 text-[13px]",
        lg: "h-[52px] rounded-md px-8 text-[14px] tracking-[0.04em]",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
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
