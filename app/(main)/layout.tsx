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
      <div className="h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white flex flex-col overflow-hidden">
        {/* Animated background elements - matching home page */}
        <div className="fixed inset-0 pointer-events-none">
          <div
            className="absolute w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse"
            style={{ left: "10%", top: "20%" }}
          />
          <div
            className="absolute w-96 h-96 bg-violet-500/5 rounded-full blur-3xl animate-pulse"
            style={{ right: "10%", bottom: "20%", animationDelay: "2s" }}
          />
        </div>

        {/* Fixed header */}
        <HeaderMain />

        {/* Main content area with proper flex and overflow handling */}
        <main className="flex-1 flex overflow-hidden">{children}</main>
      </div>
    </>
  );
}
