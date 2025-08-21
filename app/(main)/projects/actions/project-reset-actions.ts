"use server";

import { createClient } from "@/lib/supabase/server";
import { CacheInvalidation } from "@/hooks/useCache";

/**
 * Reset all SRS data for a project
 * This includes:
 * - SRS states for all flashcards
 * - Daily study stats for the user
 * - User notifications related to the project
 */
export async function resetProjectSRSData(
  projectId: string
): Promise<{ success: boolean; error?: string }> {
  console.log(`[ProjectReset] Starting reset for project: ${projectId}`);

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.log(`[ProjectReset] User not authenticated:`, userError);
    return { success: false, error: "Not authenticated" };
  }

  console.log(`[ProjectReset] Authenticated user: ${user.id}`);

  try {
    // Verify the user owns this project
    console.log(`[ProjectReset] Verifying project ownership`);
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) {
      return { success: false, error: "Project not found or unauthorized" };
    }

    // Start a transaction-like operation
    const operations = [];

    // 1. Delete all SRS states for this project
    operations.push(
      supabase
        .from("srs_states")
        .delete()
        .eq("user_id", user.id)
        .eq("project_id", projectId)
    );

    // 2. Reset daily study stats for today (reset counters to 0)
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
    operations.push(
      supabase.from("daily_study_stats").upsert(
        {
          user_id: user.id,
          study_date: today,
          new_cards_studied: 0,
          reviews_completed: 0,
          time_spent_seconds: 0,
          cards_learned: 0,
          cards_lapsed: 0,
        },
        {
          onConflict: "user_id,study_date",
        }
      )
    );

    // 3. Delete user notifications related to this project
    operations.push(
      supabase
        .from("user_notifications")
        .delete()
        .eq("user_id", user.id)
        .ilike("title", `%${projectId}%`) // Assuming project ID is in notification titles
    );

    // Execute all operations
    const results = await Promise.all(operations);

    // Check if any operations failed
    for (const result of results) {
      if (result.error) {
        console.error("Reset operation failed:", result.error);
        return { success: false, error: result.error.message };
      }
    }

    // Invalidate cache to ensure UI updates across the app
    CacheInvalidation.invalidatePattern('user_projects');
    CacheInvalidation.invalidatePattern(`project_${projectId}`);
    CacheInvalidation.invalidatePattern('project_stats_');

    return { success: true };
  } catch (error) {
    console.error("Project reset failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
