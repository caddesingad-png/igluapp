import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<TextareaProps, TextareaProps & { ref?: React.Ref<HTMLTextAreaElement> }>(
  // @ts-expect-error generic forwardRef typing
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[88px] w-full rounded-2xl border-0 bg-background/60 px-4 py-3 text-[15px] font-body text-foreground shadow-soft-inset ring-offset-background placeholder:text-[hsl(var(--muted-foreground)/0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 transition-shadow",
          className,
        )}
        ref={ref as React.Ref<HTMLTextAreaElement>}
        {...props}
      />
    );
  },
);
(Textarea as unknown as { displayName: string }).displayName = "Textarea";

export { Textarea };
