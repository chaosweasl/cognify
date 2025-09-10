import { create } from "zustand";

const THEME_KEY = "theme";
const DEFAULT_THEME = "light";

type ThemeType = "light" | "dark";

interface ThemeState {
  theme: ThemeType;
  isHydrated: boolean;
  setTheme: (theme: ThemeType) => void;
  toggleTheme: () => void;
  hydrate: () => void;
  applyTheme: (theme: ThemeType) => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: DEFAULT_THEME,
  isHydrated: false,

  hydrate: () => {
    if (typeof window !== "undefined") {
      const storedTheme = localStorage.getItem(THEME_KEY) as ThemeType;
      const validThemes: ThemeType[] = ["light", "dark"];
      const theme = validThemes.includes(storedTheme)
        ? storedTheme
        : DEFAULT_THEME;

      set({ theme, isHydrated: true });
      get().applyTheme(theme);
    }
  },

  applyTheme: (theme: ThemeType) => {
    if (typeof window !== "undefined") {
      const html = document.documentElement;
      const body = document.body;

      if (theme === "dark") {
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
    const next: ThemeType = current === "light" ? "dark" : "light";
    get().setTheme(next);
  },
}));
