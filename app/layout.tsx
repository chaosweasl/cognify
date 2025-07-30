import type { Metadata } from "next";
import { ToastProvider } from "@/components/toast-provider";
import { Geist, Geist_Mono } from "next/font/google";
import { ProfileProvider } from "@/components/profile-provider";
import EarlyDevWarning from "@/components/EarlyDevWarning";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-base-100`}
      >
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
