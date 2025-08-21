import { create } from "zustand";

const THEME_KEY = "theme";
const DEFAULT_THEME = "light";

interface ThemeState {
  theme: string;
  setTheme: (theme: string) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme:
    typeof window !== "undefined"
      ? localStorage.getItem(THEME_KEY) || 
        (document.documentElement.classList.contains("dark") ? "dark" : "light") ||
        DEFAULT_THEME
      : DEFAULT_THEME,
  setTheme: (theme) => {
    set({ theme });
    if (typeof window !== "undefined") {
      // Remove old theme classes
      document.documentElement.classList.remove("light", "dark");
      
      // Add new theme class
      document.documentElement.classList.add(theme);
      
      // Store preference
      localStorage.setItem(THEME_KEY, theme);
    }
  },
  toggleTheme: () => {
    const current = get().theme;
    const next = current === "dark" ? "light" : "dark";
    get().setTheme(next);
  },
}));
