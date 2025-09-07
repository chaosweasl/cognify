/**
 * Admin Dashboard Page
 * Main admin interface with analytics, system monitoring, and management tools
 */

import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminDashboardClient } from "./AdminDashboardClient";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Check if user has admin access
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    redirect("/dashboard");
  }

  return <AdminDashboardClient />;
}
