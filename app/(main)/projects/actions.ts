"use server";

import { createClient } from "@/lib/supabase/server";
import { CacheInvalidation } from "@/hooks/useCache";

// Fetch a single project by id for the current user
export async function getProjectById(id: string): Promise<Project | null> {
  console.log(`[Projects] getProjectById called with id: ${id}`);
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.log(
      `[Projects] getProjectById - User not authenticated:`,
      userError
    );
    return null;
  }

  console.log(
    `[Projects] getProjectById - Fetching project for user: ${user.id}`
  );
  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      id, name, description, created_at, updated_at, user_id, 
      new_cards_per_day, max_reviews_per_day,
      learning_steps, relearning_steps, graduating_interval, easy_interval,
      starting_ease, minimum_ease, easy_bonus, hard_interval_factor,
      easy_interval_factor, lapse_recovery_factor, leech_threshold,
      leech_action, new_card_order, review_ahead, bury_siblings,
      max_interval, lapse_ease_penalty
    `
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    console.log(
      `[Projects] getProjectById - Project not found or error:`,
      error
    );
    return null;
  }

  console.log(
    `[Projects] getProjectById - Successfully retrieved project: ${data.name}`
  );
  return {
    ...data,
    flashcards: [], // Flashcards are now loaded separately
  };
}

// --- Types ---
export type Flashcard = {
  front: string;
  back: string;
};

// Import the main Project type instead of duplicating
import { Project as MainProject } from "@/src/types";

export type Project = MainProject;

export async function updateProject(projectData: {
  id: string;
  name?: string;
  description?: string;
  new_cards_per_day?: number;
  max_reviews_per_day?: number;
  learning_steps?: number[];
  relearning_steps?: number[];
  graduating_interval?: number;
  easy_interval?: number;
  starting_ease?: number;
  minimum_ease?: number;
  easy_bonus?: number;
  hard_interval_factor?: number;
  easy_interval_factor?: number;
  lapse_recovery_factor?: number;
  leech_threshold?: number;
  leech_action?: "suspend" | "tag";
  new_card_order?: "random" | "fifo";
  review_ahead?: boolean;
  bury_siblings?: boolean;
  max_interval?: number;
  lapse_ease_penalty?: number;
}) {
  // Call the API route for updating a project
  const { id, ...updateData } = projectData;
  // Use absolute URL for server-side fetch
  const baseUrl =
    typeof window === "undefined"
      ? process.env.NEXT_PUBLIC_BASE_URL ||
        (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
        "http://localhost:3000"
      : "";
  const url = `${baseUrl}/api/projects/${id}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updateData),
  });
  if (!res.ok) {
    const result = await res.json();
    throw new Error(result.error || "Failed to update project");
  }
  // Invalidate cache to ensure UI updates across the app
  CacheInvalidation.invalidate("user_projects");
  CacheInvalidation.invalidate(`project_${id}`);
}

export async function deleteProject(id: string) {
  // Call the API route for deleting a project
  const baseUrl =
    typeof window === "undefined"
      ? process.env.NEXT_PUBLIC_BASE_URL ||
        (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
        "http://localhost:3000"
      : "";
  const url = `${baseUrl}/api/projects/${id}`;
  const res = await fetch(url, {
    method: "DELETE",
  });
  if (!res.ok) {
    const result = await res.json();
    throw new Error(result.error || "Failed to delete project");
  }
  // Invalidate cache to ensure UI updates across the app
  CacheInvalidation.invalidate("user_projects");
  CacheInvalidation.invalidate(`project_${id}`);
  CacheInvalidation.invalidatePattern("project_stats_");
}
