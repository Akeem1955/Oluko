import {
  forwardRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, id, type: initialType, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || label?.toLowerCase().replace(/\s/g, "-");
    const isPassword = initialType === "password";
    const type = isPassword
      ? showPassword
        ? "text"
        : "password"
      : initialType;

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/70">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={cn(
              "w-full h-11 px-4 rounded-xl bg-gray-100 dark:bg-white/5",
              "border-none text-sm text-gray-900 dark:text-white",
              "placeholder-gray-400 dark:placeholder-gray-500",
              "focus:ring-2 focus:ring-primary/50 focus:outline-none",
              "transition-all duration-200",
              icon && "pl-10",
              isPassword && "pr-10",
              error && "ring-2 ring-error/50",
              className,
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
        {error && <p className="text-xs text-error font-medium">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
