// Utility to get the theme from localStorage or default (SSR-safe)
export function getStoredTheme(defaultTheme = "dim") {
  if (typeof window !== "undefined") {
    return localStorage.getItem("theme") || defaultTheme;
  }
  return defaultTheme;
}

// Utility to set the theme in localStorage and on <html> (SSR-safe)
export function setStoredTheme(theme: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }
}
