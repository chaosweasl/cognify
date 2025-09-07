import { HeaderMain } from "./components/HeaderMain";
import { FooterMain } from "./components/FooterMain";
import { ToasterProvider } from "@/components/ui/toaster-provider";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ToasterProvider />
      <div className="min-h-screen surface-primary text-primary flex flex-col overflow-hidden relative">
        {/* Enhanced animated background elements - using semantic colors */}
        <div className="fixed inset-0 pointer-events-none opacity-20">
          {/* Primary gradient orb */}
          <div
            className="absolute w-96 h-96 bg-gradient-glass rounded-full blur-3xl animate-pulse"
            style={{
              left: "10%",
              top: "20%",
              animationDuration: "8s",
            }}
          />
          {/* Secondary gradient orb */}
          <div
            className="absolute w-96 h-96 rounded-full blur-3xl animate-pulse"
            style={{
              right: "10%",
              bottom: "20%",
              animationDelay: "4s",
              animationDuration: "10s",
              background:
                "linear-gradient(135deg, var(--color-brand-secondary, #8b5cf6), var(--color-brand-accent, #8b5cf6))",
              opacity: "0.7",
            }}
          />
          {/* Tertiary accent orb */}
          <div
            className="absolute w-64 h-64 bg-gradient-to-r from-brand-primary/10 to-brand-tertiary/10 rounded-full blur-2xl animate-pulse"
            style={{
              left: "60%",
              top: "50%",
              animationDelay: "6s",
              animationDuration: "12s",
            }}
          />
          {/* Additional floating elements for visual depth */}
          <div
            className="absolute w-32 h-32 bg-gradient-to-br from-brand-accent/5 to-brand-secondary/5 rounded-full blur-xl animate-pulse"
            style={{
              left: "80%",
              top: "10%",
              animationDelay: "2s",
              animationDuration: "14s",
            }}
          />
        </div>

        {/* Enhanced subtle gradient overlay for depth with improved blend modes */}
        <div className="fixed inset-0 pointer-events-none opacity-40">
          <div
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(circle at 20% 80%, transparent 0%, var(--color-surface-secondary, #f3f4f6) 100%),
                radial-gradient(circle at 80% 20%, transparent 40%, var(--color-surface-elevated, #e5e7eb) 100%),
                linear-gradient(135deg, transparent 0%, var(--color-surface-overlay, rgba(249, 250, 251, 0.95)) 100%)
              `,
              mixBlendMode: "soft-light",
            }}
          />
        </div>

        {/* Fixed header with improved z-index layering */}
        <HeaderMain />

        {/* Enhanced main content area with improved responsive handling */}
        <div className="flex-1 flex flex-col min-h-0 relative z-10">
          <main className="flex-1 flex overflow-y-auto">
            <div className="w-full">{children}</div>
          </main>

          {/* Footer only shown on larger screens to maintain mobile UX */}
          <div className="hidden lg:block">
            <FooterMain />
          </div>
        </div>
      </div>
    </>
  );
}
