import React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useThemeStore } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

type ThemeType = "light" | "dark" | "system";

interface ThemeOption {
  value: ThemeType;
  label: string;
  icon: React.ElementType;
  description: string;
}

const themeOptions: ThemeOption[] = [
  {
    value: "light",
    label: "Light",
    icon: Sun,
    description: "Use light theme",
  },
  {
    value: "dark",
    label: "Dark",
    icon: Moon,
    description: "Use dark theme",
  },
  {
    value: "system",
    label: "System",
    icon: Monitor,
    description: "Use system preference",
  },
];

export function ThemeSelector() {
  const { theme, setTheme, isHydrated } = useThemeStore();

  if (!isHydrated) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-secondary">Theme</label>
        <div className="grid grid-cols-3 gap-2">
          {themeOptions.map((option) => (
            <div
              key={option.value}
              className="h-20 rounded-md border border-subtle surface-elevated animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium text-secondary">
        Theme Preference
      </label>
      <div className="grid grid-cols-3 gap-3">
        {themeOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = theme === option.value;

          return (
            <button
              key={option.value}
              className={cn(
                "h-20 flex-col space-y-2 p-3 rounded-xl border-2 transition-all transition-normal transform hover:scale-[1.02] group",
                "glass-surface hover:shadow-brand",
                isSelected
                  ? "border-brand bg-gradient-glass shadow-brand text-primary"
                  : "border-subtle text-secondary hover:border-brand hover:text-primary"
              )}
              onClick={() => setTheme(option.value)}
            >
              <Icon
                className={cn(
                  "h-6 w-6 transition-all transition-normal",
                  isSelected
                    ? "text-brand-primary"
                    : "text-muted group-hover:text-brand-primary"
                )}
              />
              <span
                className={cn(
                  "text-xs font-medium transition-colors transition-normal",
                  isSelected
                    ? "text-primary"
                    : "text-secondary group-hover:text-primary"
                )}
              >
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted bg-gradient-glass rounded-lg p-3 border border-subtle">
        <strong className="text-secondary">Current: </strong>
        {themeOptions.find((o) => o.value === theme)?.description}
      </p>
    </div>
  );
}
