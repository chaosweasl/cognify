import { create } from "zustand";

const THEME_KEY = "theme";
const DEFAULT_THEME = "system";

type ThemeType = "light" | "dark" | "system";

interface ThemeState {
  theme: ThemeType;
  isHydrated: boolean;
  setTheme: (theme: ThemeType) => void;
  toggleTheme: () => void;
  hydrate: () => void;
  applyTheme: (theme: ThemeType) => void;
  getSystemTheme: () => "light" | "dark";
  getEffectiveTheme: () => "light" | "dark";
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: DEFAULT_THEME,
  isHydrated: false,

  getSystemTheme: () => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return "dark";
  },

  getEffectiveTheme: () => {
    const { theme, getSystemTheme } = get();
    return theme === "system" ? getSystemTheme() : theme;
  },

  hydrate: () => {
    if (typeof window !== "undefined") {
      const storedTheme = localStorage.getItem(THEME_KEY) as ThemeType;
      const validThemes: ThemeType[] = ["light", "dark", "system"];
      const theme = validThemes.includes(storedTheme)
        ? storedTheme
        : DEFAULT_THEME;

      set({ theme, isHydrated: true });
      get().applyTheme(theme);

      // Listen for system theme changes
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleSystemThemeChange = () => {
        if (get().theme === "system") {
          get().applyTheme("system");
        }
      };

      mediaQuery.addEventListener("change", handleSystemThemeChange);

      // Cleanup function - store in window for cleanup if needed
      (window as any).__themeCleanup = () => {
        mediaQuery.removeEventListener("change", handleSystemThemeChange);
      };
    }
  },

  applyTheme: (theme: ThemeType) => {
    if (typeof window !== "undefined") {
      const html = document.documentElement;
      const body = document.body;
      const effectiveTheme =
        theme === "system" ? get().getSystemTheme() : theme;

      if (effectiveTheme === "dark") {
        html.classList.add("dark");
        body.classList.add("dark");
      } else {
        html.classList.remove("dark");
        body.classList.remove("dark");
      }

      localStorage.setItem(THEME_KEY, theme);
    }
  },

  setTheme: (theme: ThemeType) => {
    set({ theme });
    get().applyTheme(theme);
  },

  toggleTheme: () => {
    const current = get().theme;
    const next: ThemeType =
      current === "light" ? "dark" : current === "dark" ? "system" : "light";
    get().setTheme(next);
  },
}));
