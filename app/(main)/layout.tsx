"use client";

import { HeaderMain } from "./components/HeaderMain";
// Profile is auto-loaded by CacheProvider, no manual action needed

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <HeaderMain />
      {children}
    </>
  );
}
