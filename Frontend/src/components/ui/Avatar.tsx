import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils/utils";

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  size?: "sm" | "lg";
  ring?: boolean;
  status?: "online" | "offline";
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      className,
      src,
      alt = "Avatar",
      size = "sm",
      ring = false,
      status,
      ...props
    },
    ref,
  ) => {
    const sizes = {
      sm: "w-10 h-10",
      lg: "w-20 h-20",
    };

    const ringStyles = ring
      ? "p-1 bg-gradient-to-tr from-primary to-blue-400 shadow-lg"
      : "ring-2 ring-primary/20";

    return (
      <div ref={ref} className={cn("relative", className)} {...props}>
        <div className={cn("rounded-full", sizes[size], ringStyles)}>
          <div
            className={cn(
              "w-full h-full rounded-full bg-white dark:bg-gray-800 overflow-hidden",
              ring && "border-2 border-white dark:border-gray-800",
            )}
          >
            {src ? (
              <img src={src} alt={alt} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-primary to-blue-800 text-white font-bold text-xl">
                {alt.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
        {status && (
          <span
            className={cn(
              "absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800",
              status === "online" ? "bg-success" : "bg-gray-400",
            )}
          />
        )}
      </div>
    );
  },
);

Avatar.displayName = "Avatar";
