"use client";
import React from "react";

export const ProfileProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  // Profile loading is handled by simple hooks now
  // This component remains for backwards compatibility
  return <>{children}</>;
};
