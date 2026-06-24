import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme, type Theme } from "./ThemeProvider";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const order: Theme[] = ["light", "dark", "system"];
  const next = () => setTheme(order[(order.indexOf(theme) + 1) % order.length]);
  const Icon = theme === "system" ? Monitor : resolvedTheme === "dark" ? Moon : Sun;
  const label = theme === "system" ? "System theme" : resolvedTheme === "dark" ? "Dark theme" : "Light theme";
  return (
    <button
      type="button"
      onClick={next}
      aria-label={`Switch theme (current: ${label})`}
      title={label}
      className={`p-2 rounded-md border border-border bg-surface-2 text-foreground hover:bg-surface transition-colors ${className}`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}
