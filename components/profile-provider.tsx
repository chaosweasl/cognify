"use client";
import React, { useEffect } from "react";
import { useUserProfile } from "@/hooks/useUserProfile";

export const ProfileProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { fetchUserProfile, userProfile } = useUserProfile();

  // Initialize user profile on mount
  useEffect(() => {
    if (!userProfile) {
      console.log("[ProfileProvider] Fetching user profile on mount");
      fetchUserProfile().catch(err => {
        console.error("[ProfileProvider] Failed to fetch user profile:", err);
      });
    }
  }, [fetchUserProfile, userProfile]);

  return <>{children}</>;
};
