import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-0 bg-primary/10 text-primary hover:bg-primary/20",
        secondary: "border-0 bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-0 bg-destructive/10 text-destructive hover:bg-destructive/20",
        outline: "text-foreground border border-border/60",
        success: "border-0 bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20",
        info: "border-0 bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20",
        warning: "border-0 bg-orange-500/10 text-orange-700 dark:text-orange-400 hover:bg-orange-500/20",
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
