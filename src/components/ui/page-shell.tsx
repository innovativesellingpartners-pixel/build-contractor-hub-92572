import { ReactNode } from "react";
import { BackNavigation } from "@/components/contractor/crm/BackNavigation";
import { cn } from "@/lib/utils";

interface PageShellProps {
  children: ReactNode;
  onBack?: () => void;
  /** Hide the back button even if onBack is provided (e.g. on desktop) */
  hideBack?: boolean;
  className?: string;
  /** Extra padding class override – defaults to standard section padding */
  padding?: string;
}

export function PageShell({
  children,
  onBack,
  hideBack = false,
  className,
  padding = "p-3 md:p-4 lg:p-6",
}: PageShellProps) {
  return (
    <div
      className={cn(
        padding,
        "min-h-[400px] md:min-h-[600px] pb-14",
        className
      )}
    >
      {onBack && !hideBack && (
        <BackNavigation
          onBackToDashboard={onBack}
          className="mb-4 lg:hidden"
        />
      )}
      {children}
    </div>
  );
}
