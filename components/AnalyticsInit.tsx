"use client";

import { useEffect } from "react";

export function AnalyticsInit() {
  useEffect(() => {
    // Initialize basic analytics tracking without server components
    console.log("[ANALYTICS] Client-side analytics initialized");

    // Clean up on unmount
    return () => {
      // Any cleanup if needed
    };
  }, []);

  return null; // This component doesn't render anything
}
