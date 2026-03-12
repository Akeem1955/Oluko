import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/utils";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 font-semibold rounded-lg cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      primary:
        "bg-gradient-to-r from-primary-dark to-primary text-white shadow-md hover:shadow-lg md:hover:scale-[1.02] md:active:scale-[0.98]",
      secondary:
        "border-2 border-primary text-primary bg-transparent hover:bg-primary/10",
      ghost: "text-primary hover:bg-primary/10",
      outline:
        "border-2 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800",
    };

    const sizes = {
      sm: "text-sm px-3 py-1.5 min-h-[36px]",
      md: "text-sm px-4 py-2.5 min-h-[44px]",
      lg: "text-base px-6 py-3 min-h-[52px]",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
