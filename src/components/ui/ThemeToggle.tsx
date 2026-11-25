"use client";

import { useTheme } from "@/lib/theme";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = "", showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? theme === "dark" : false;

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`inline-flex items-center gap-2 p-2 rounded-lg text-sm font-medium transition-all duration-200 ${
        isDark
          ? "bg-gray-800 text-amber-400 hover:bg-gray-700 hover:text-amber-300 ring-1 ring-gray-700"
          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-amber-300 ring-1 ring-gray-200 dark:ring-gray-700"
      } ${className}`}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle Dark Mode"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400" />
      ) : (
        <Moon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
      )}
      {showLabel && (
        <span className="text-xs">{isDark ? "Light Mode" : "Dark Mode"}</span>
      )}
    </button>
  );
}

export default ThemeToggle;
