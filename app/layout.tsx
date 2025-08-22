import type { Metadata } from "next";
import { ProfileProvider } from "@/components/profile-provider";
import { ToasterProvider } from "@/components/ui/toaster-provider";

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
        className={`${fontSans.variable} ${fontMono.variable} antialiased bg-background min-h-screen`}
      >
        <SpeedInsights />
        <Analytics />
        <ToasterProvider />
        <ProfileProvider>
          {/* Responsive flex container for sidebar and main content */}
          <div className="flex min-h-screen w-full">
            {/* Sidebar slot: expects sidebar to be rendered as a flex child in page layouts */}
            {/* Main content area fills remaining space */}
            <div className="flex-1 flex flex-col min-w-0">{children}</div>
          </div>
        </ProfileProvider>
      </body>
    </html>
  );
}
