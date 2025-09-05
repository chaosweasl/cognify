import React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useThemeStore } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
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
        <label className="text-sm font-medium">Theme</label>
        <div className="grid grid-cols-3 gap-2">
          {themeOptions.map((option) => (
            <div
              key={option.value}
              className="h-20 rounded-md border bg-muted animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Theme</label>
      <div className="grid grid-cols-3 gap-2">
        {themeOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = theme === option.value;

          return (
            <Button
              key={option.value}
              variant={isSelected ? "default" : "outline"}
              className={cn(
                "h-20 flex-col space-y-1 p-2",
                isSelected &&
                  "border-primary bg-primary text-primary-foreground"
              )}
              onClick={() => setTheme(option.value)}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{option.label}</span>
            </Button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        {themeOptions.find((o) => o.value === theme)?.description}
      </p>
    </div>
  );
}
