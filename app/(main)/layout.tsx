"use client";

import { useEffect } from "react";
import { HeaderMain } from "./components/HeaderMain";
import { useUserProfileStore } from "@/hooks/useUserProfile";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { fetchUserProfile } = useUserProfileStore();
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  return (
    <>
      <HeaderMain />
      {children}
    </>
  );
}
