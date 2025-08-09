import type { Metadata } from "next";
import { ToastProvider } from "@/components/toast-provider";
import { ProfileProvider } from "@/components/profile-provider";
import EarlyDevWarning from "@/components/EarlyDevWarning";

import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

import "./globals.css";

// Use system fonts as fallback to avoid Google Fonts connectivity issues
const fontSans = {
  variable: "--font-geist-sans",
  style: {
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
};

const fontMono = {
  variable: "--font-geist-mono",
  style: {
    fontFamily:
      "'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace",
  },
};

export const metadata: Metadata = {
  title: "Cognify",
  description: "A website for creating flashcards from PDFs",
};

const themeInitScript = `
  (function() {
    try {
      const t = localStorage.getItem('theme');
      const theme = t || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      document.documentElement.setAttribute('data-theme', theme);
    } catch {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        suppressHydrationWarning
        className={`${fontSans.variable} ${fontMono.variable} antialiased bg-base-100`}
      >
        <SpeedInsights />
        <Analytics />

        <ToastProvider>
          <ProfileProvider>
            {children}
            {/* Early development warning fixed at bottom left */}
            <EarlyDevWarning />
          </ProfileProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
