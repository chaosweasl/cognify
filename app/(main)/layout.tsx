import { HeaderMain } from "./components/HeaderMain";
import { ToasterProvider } from "@/components/ui/toaster-provider";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ToasterProvider />
      <div className="h-screen surface-primary text-primary flex flex-col overflow-hidden relative">
        {/* Animated background elements - using semantic colors */}
        <div className="fixed inset-0 pointer-events-none opacity-30">
          <div
            className="absolute w-96 h-96 bg-gradient-glass rounded-full blur-3xl animate-pulse"
            style={{
              left: "10%",
              top: "20%",
              animationDuration: "8s",
            }}
          />
          <div
            className="absolute w-96 h-96 rounded-full blur-3xl animate-pulse"
            style={{
              right: "10%",
              bottom: "20%",
              animationDelay: "4s",
              animationDuration: "10s",
              background:
                "linear-gradient(135deg, var(--color-brand-secondary, #8b5cf6), var(--color-brand-accent, #8b5cf6))",
              opacity: "0.1",
            }}
          />
          <div
            className="absolute w-64 h-64 bg-gradient-to-r from-brand-primary/5 to-brand-tertiary/5 rounded-full blur-2xl animate-pulse"
            style={{
              left: "60%",
              top: "50%",
              animationDelay: "6s",
              animationDuration: "12s",
            }}
          />
        </div>

        {/* Subtle gradient overlay for depth */}
        <div className="fixed inset-0 pointer-events-none opacity-60">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 20% 80%, transparent 0%, var(--color-surface-secondary, #f3f4f6) 100%)",
              mixBlendMode: "soft-light",
            }}
          />
        </div>

        {/* Fixed header */}
        <HeaderMain />

        {/* Main content area with proper flex and overflow handling */}
        <main className="flex-1 flex overflow-hidden relative z-10">
          {children}
        </main>
      </div>
    </>
  );
}
