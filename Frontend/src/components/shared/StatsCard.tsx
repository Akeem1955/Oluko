import type { ReactNode } from "react";
import { cn } from "@/lib/utils/utils";

interface StatsCardProps {
  icon: ReactNode;
  value: string | number;
  label: string;
  iconBgColor?: string;
  iconColor?: string;
}

export function StatsCard({
  icon,
  value,
  label,
  iconBgColor = "bg-primary/10",
  iconColor = "text-primary",
}: StatsCardProps) {
  return (
    <div className="bg-white dark:bg-card-dark p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4">
      <div
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center",
          iconBgColor,
          iconColor,
        )}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {value}
        </p>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
      </div>
    </div>
  );
}
