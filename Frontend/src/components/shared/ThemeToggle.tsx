import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/hooks/theme/useTheme";
import { cn } from "@/lib/utils/utils";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "p-2 rounded-lg transition-colors",
        "text-gray-600 cursor-pointer dark:text-gray-300",
        "hover:bg-gray-100 dark:hover:bg-white/10",
        "focus:outline-none focus:ring-2 focus:ring-primary/50",
      )}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  );
}
