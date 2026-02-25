import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-0 bg-primary/10 text-primary",
        secondary: "border-0 bg-secondary text-secondary-foreground",
        destructive: "border-0 bg-destructive/10 text-destructive",
        outline: "text-foreground border border-border/60",
        success: "border-0 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
        info: "border-0 bg-blue-500/10 text-blue-700 dark:text-blue-400",
        warning: "border-0 bg-amber-500/10 text-amber-700 dark:text-amber-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
