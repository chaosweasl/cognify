import { create } from "zustand";

const THEME_KEY = "theme";
const DEFAULT_THEME = "darkgreen";

interface ThemeState {
  theme: string;
  setTheme: (theme: string) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme:
    typeof window !== "undefined"
      ? localStorage.getItem(THEME_KEY) ||
        document.documentElement.getAttribute("data-theme") ||
        DEFAULT_THEME
      : DEFAULT_THEME,
  setTheme: (theme) => {
    set({ theme });
    if (typeof window !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem(THEME_KEY, theme);
    }
  },
  toggleTheme: () => {
    const current = get().theme;
    const next = current === "darkgreen" ? "lightgreen" : "darkgreen";
    get().setTheme(next);
  },
}));
