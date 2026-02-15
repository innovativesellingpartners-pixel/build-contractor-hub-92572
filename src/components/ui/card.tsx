import * as React from "react";

import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'blue' | 'green' | 'purple' | 'orange' | 'gradient';
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, variant = 'default', ...props }, ref) => {
  const variantClasses = {
    default: 'bg-card border-border/60',
    blue: 'bg-blue-50 border-blue-200/60 dark:bg-blue-950/30 dark:border-blue-800/40',
    green: 'bg-green-50 border-green-200/60 dark:bg-green-950/30 dark:border-green-800/40',
    purple: 'bg-purple-50 border-purple-200/60 dark:bg-purple-950/30 dark:border-purple-800/40',
    orange: 'bg-orange-50 border-orange-200/60 dark:bg-orange-950/30 dark:border-orange-800/40',
    gradient: 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-purple-200/60 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20',
  };

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border shadow-sm transition-all duration-200",
        variantClasses[variant],
        "text-card-foreground",
        className
      )}
      {...props}
    />
  );
});
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />,
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
