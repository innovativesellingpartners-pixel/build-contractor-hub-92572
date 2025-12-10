import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, onInput, ...props }, ref) => {
    // Auto-capitalize first letter for text inputs
    const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
      const input = e.currentTarget;
      if (type === 'text' || type === undefined || type === 'search') {
        const value = input.value;
        // Capitalize first letter if it's the first character and lowercase
        if (value.length === 1 && /[a-z]/.test(value)) {
          input.value = value.toUpperCase();
        }
      }
      onInput?.(e);
    };

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border-2 border-input bg-input/50 backdrop-blur-sm px-3 py-2 text-base text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-background hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-200",
          // Hide number input arrows/spinners
          type === "number" && "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
          className,
        )}
        ref={ref}
        onInput={handleInput}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
