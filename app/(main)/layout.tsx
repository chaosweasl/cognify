"use client";

import { HeaderMain } from "./components/HeaderMain";
// Profile loading handled by ProfileProvider component

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white overflow-hidden">
      {/* Animated background elements - matching home page */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" 
             style={{ left: '10%', top: '20%' }} />
        <div className="absolute w-96 h-96 bg-violet-500/5 rounded-full blur-3xl animate-pulse" 
             style={{ right: '10%', bottom: '20%', animationDelay: '2s' }} />
      </div>
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <HeaderMain />
        <div className="flex-1 flex flex-col">{children}</div>
      </div>
    </div>
  );
}
