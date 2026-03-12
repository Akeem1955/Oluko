import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "interactive";
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const baseStyles = "rounded-2xl bg-white dark:bg-card-dark";

    const variants = {
      default: "shadow-sm border border-gray-100 dark:border-gray-800",
      elevated: "shadow-lg",
      interactive:
        "shadow-sm border border-gray-100 dark:border-gray-800 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 cursor-pointer",
    };

    return (
      <div
        ref={ref}
        className={cn(baseStyles, variants[variant], className)}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";

export const CardHeader = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pb-0", className)} {...props} />
));

CardHeader.displayName = "CardHeader";

export const CardContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6", className)} {...props} />
));

CardContent.displayName = "CardContent";

export const CardFooter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));

CardFooter.displayName = "CardFooter";
