import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-sm",
  {
    variants: {
      variant: {
        default: "border-0 bg-primary text-primary-foreground hover:bg-primary/80 shadow-md",
        secondary: "border-0 bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-0 bg-destructive text-destructive-foreground hover:bg-destructive/80 shadow-md",
        outline: "text-foreground border border-border",
        success: "border-0 bg-success text-success-foreground hover:bg-success/80 shadow-md",
        info: "border-0 bg-info text-info-foreground hover:bg-info/80 shadow-md",
        warning: "border-0 bg-warning text-warning-foreground hover:bg-warning/80 shadow-md",
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
