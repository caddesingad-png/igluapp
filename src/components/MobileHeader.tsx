import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MobileHeaderProps {
  left?: ReactNode;
  /** Optional center node. If a string, renders as page title. */
  title?: ReactNode;
  right?: ReactNode;
  /** Optional second row, e.g. tab switcher. */
  belowRow?: ReactNode;
  className?: string;
}

/**
 * Sticky mobile-safe header.
 * - Respects iOS notch / Android status bar via safe-area-inset-top
 * - Main row is 56px tall (Material) — comfortable density
 * - Slots are 44px tap targets via IconButton
 */
const MobileHeader = ({ left, title, right, belowRow, className }: MobileHeaderProps) => {
  return (
    <header
      className={cn("sticky top-0 z-40 glass-header", className)}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="max-w-lg mx-auto px-3 sm:px-4">
        <div className="h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 min-w-[44px]">{left}</div>
          <div className="flex-1 min-w-0 flex items-center justify-center">
            {typeof title === "string" ? (
              <h1 className="t-screen-title truncate">{title}</h1>
            ) : (
              title
            )}
          </div>
          <div className="flex items-center gap-1 justify-end min-w-[44px]">{right}</div>
        </div>
        {belowRow ? <div className="pb-3">{belowRow}</div> : null}
      </div>
    </header>
  );
};

export default MobileHeader;
