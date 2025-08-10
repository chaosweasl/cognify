"use client";
import React from "react";

export const ProfileProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  // Profile loading is now handled by CacheProvider
  // This component remains for backwards compatibility
  return <>{children}</>;
};
