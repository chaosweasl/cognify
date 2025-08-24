"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CreateProjectRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new interactive create experience
    router.replace("/create");
  }, [router]);

  return (
    <div className="min-h-screen surface-primary flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-3 border-secondary border-t-brand-primary rounded-full animate-spin mx-auto mb-4" />
        <p className="text-secondary">Redirecting to project creation...</p>
      </div>
    </div>
  );
}
