"use client";

import { HeaderMain } from "./components/HeaderMain";
// Profile loading handled by ProfileProvider component

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <HeaderMain />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
