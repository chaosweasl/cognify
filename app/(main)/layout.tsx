"use client";

import { HeaderMain } from "./components/HeaderMain";
// Profile loading handled by ProfileProvider component

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-base-100">
      <HeaderMain />
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
