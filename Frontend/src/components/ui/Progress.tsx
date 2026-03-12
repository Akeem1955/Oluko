import { cn } from "@/lib/utils/utils";

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  variant?: "default" | "gradient";
  showLabel?: boolean;
}

export function Progress({
  value,
  max = 100,
  className,
  variant = "default",
  showLabel = false,
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between mb-1">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Progress
          </span>
          <span className="text-xs font-bold text-primary">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            variant === "gradient"
              ? "bg-linear-to-r from-primary to-blue-500"
              : "bg-primary",
          )}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
}
