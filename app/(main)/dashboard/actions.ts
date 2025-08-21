"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  console.log("dashboardActions: signOut called");
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Error signing out:", error);
    throw new Error("Failed to sign out");
  }

  redirect("/auth/login");
}
