import type { Metadata } from "next";
import { ProfileProvider } from "@/components/profile-provider";
import { ToasterProvider } from "@/components/ui/toaster-provider";
import { AppErrorBoundary } from "@/lib/utils/errorBoundaries";
import { AnalyticsInit } from "@/components/AnalyticsInit";

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
  title:
    "Cognify - AI-Powered Learning Platform | Smart Flashcards & Spaced Repetition",
  description:
    "Transform your PDFs into effective study materials with AI-generated flashcards and proven spaced repetition algorithms. Boost your learning efficiency today.",
  keywords:
    "flashcards, spaced repetition, AI learning, study tools, PDF to flashcards, learning platform, education technology, SRS, Anki alternative",
  authors: [{ name: "Cognify Team" }],
  creator: "Cognify",
  publisher: "Cognify",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Cognify - AI-Powered Learning Platform",
    description:
      "Transform your learning with AI-generated flashcards and spaced repetition",
    siteName: "Cognify",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Cognify - AI-Powered Learning Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cognify - AI-Powered Learning Platform",
    description:
      "Transform your learning with AI-generated flashcards and spaced repetition",
    images: ["/twitter-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// Script to prevent FOUC by setting theme before any rendering
const themeInitScript = `
  (function() {
    try {
      const storedTheme = localStorage.getItem('theme');
      const theme = storedTheme || 'dark'; // Default to dark if nothing stored
      const html = document.documentElement;
      
      // Clear any existing theme classes first
      html.classList.remove('dark', 'light');
      
      // Apply the correct theme
      html.classList.add(theme);
      
      // Also set a CSS custom property for immediate styling
      html.style.setProperty('--initial-theme', theme);
    } catch (e) {
      // Fallback to dark mode if localStorage fails
      document.documentElement.classList.add('dark');
    }
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
        {/* Skip to main content for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[1100] bg-brand-primary text-white px-4 py-2 rounded-md font-medium transition-all"
        >
          Skip to main content
        </a>

        <SpeedInsights />
        <Analytics />
        <ToasterProvider />
        <ProfileProvider>
          <AppErrorBoundary>
            {/* Initialize analytics */}
            <AnalyticsInit />
            {/* Responsive flex container for sidebar and main content */}
            <div className="flex min-h-screen w-full">
              {/* Sidebar slot: expects sidebar to be rendered as a flex child in page layouts */}
              {/* Main content area fills remaining space */}
              <div className="flex-1 flex flex-col min-w-0">{children}</div>
            </div>
          </AppErrorBoundary>
        </ProfileProvider>
      </body>
    </html>
  );
}
