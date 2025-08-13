"use client";

import { HeaderMain } from "./components/HeaderMain";
// Profile loading handled by ProfileProvider component

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
