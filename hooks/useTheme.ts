import { create } from "zustand";

const THEME_KEY = "theme";
const DEFAULT_THEME = "dark";

interface ThemeState {
  theme: string;
  isHydrated: boolean;
  setTheme: (theme: string) => void;
  toggleTheme: () => void;
  hydrate: () => void;
  applyTheme: (theme: string) => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: DEFAULT_THEME,
  isHydrated: false,

  hydrate: () => {
    if (typeof window !== "undefined") {
      const storedTheme = localStorage.getItem(THEME_KEY);

      const theme = storedTheme || DEFAULT_THEME;

      set({ theme, isHydrated: true });
      get().applyTheme(theme);
    }
  },

  applyTheme: (theme: string) => {
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

  setTheme: (theme) => {
    set({ theme });
    get().applyTheme(theme);
  },

  toggleTheme: () => {
    const current = get().theme;
    const next = current === "dark" ? "light" : "dark";
    get().setTheme(next);
  },
}));
