"use server";

import { createClient } from "@/lib/supabase/server";

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
    .select("id, name, description, created_at, user_id, new_cards_per_day, max_reviews_per_day")
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
} // Update only the flashcards array for a project
// DEPRECATED: Use flashcard-specific actions instead
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function updateFlashcards(_id: string, _flashcards: Flashcard[]) {
  throw new Error(
    "updateFlashcards is deprecated. Use flashcard-specific actions instead."
  );
}

// --- Types ---
export type Flashcard = {
  front: string;
  back: string;
};

// Import the main Project type instead of duplicating
import { Project as MainProject } from "@/src/types";

export type Project = MainProject;

export async function getProjects(): Promise<Project[]> {
  console.log(`[Projects] getProjects called`);
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.log(`[Projects] getProjects - User not authenticated:`, userError);
    return [];
  }

  console.log(
    `[Projects] getProjects - Fetching projects for user: ${user.id}`
  );
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, description, created_at, user_id, new_cards_per_day, max_reviews_per_day")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.log(`[Projects] getProjects - Error fetching projects:`, error);
    return [];
  }

  console.log(
    `[Projects] getProjects - Successfully retrieved ${data.length} projects`
  );
  return data.map((project) => ({
    ...project,
    flashcards: [], // Flashcards are now loaded separately
  }));
}

export async function createProject({
  name,
  description,
  new_cards_per_day = 20,
  max_reviews_per_day = 100,
}: {
  name: string;
  description: string;
  new_cards_per_day?: number;
  max_reviews_per_day?: number;
}) {
  console.log(`[Projects] createProject called:`, { 
    name, 
    description, 
    new_cards_per_day, 
    max_reviews_per_day 
  });
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.log(
      `[Projects] createProject - User not authenticated:`,
      userError
    );
    throw new Error("Not authenticated");
  }

  console.log(
    `[Projects] createProject - Creating project for user: ${user.id}`
  );
  const { data, error } = await supabase
    .from("projects")
    .insert([
      {
        user_id: user.id,
        name,
        description,
        new_cards_per_day,
        max_reviews_per_day,
      },
    ])
    .select("id");

  if (error) {
    console.log(`[Projects] createProject - Error creating project:`, error);
    throw error;
  }

  const projectId = data && data[0]?.id;
  console.log(
    `[Projects] createProject - Successfully created project with ID: ${projectId}`
  );
  return projectId;
}

export async function updateProject({
  id,
  name,
  description,
  new_cards_per_day,
  max_reviews_per_day,
}: {
  id: string;
  name: string;
  description: string;
  new_cards_per_day?: number;
  max_reviews_per_day?: number;
}) {
  console.log("projectsActions: updateProject called", {
    id,
    name,
    description,
    new_cards_per_day,
    max_reviews_per_day,
  });
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

  const updateData: Record<string, unknown> = { name, description };
  if (new_cards_per_day !== undefined) updateData.new_cards_per_day = new_cards_per_day;
  if (max_reviews_per_day !== undefined) updateData.max_reviews_per_day = max_reviews_per_day;

  const { error } = await supabase
    .from("projects")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw error;
}

export async function deleteProject(id: string) {
  console.log("projectsActions: deleteProject called", { id });
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

  // Start a transaction-like operation to clean up related data
  try {
    console.log(
      `[Projects] deleteProject - Starting cleanup for project: ${id}`
    );

    // 1. Delete user notifications that might reference this project
    // Check title, message, and URL fields for various project reference patterns
    console.log(
      `[Projects] deleteProject - Deleting related notifications for user: ${user.id}`
    );
    const notificationDeletePromises = [
      // Delete notifications with project ID in title
      supabase
        .from("user_notifications")
        .delete()
        .eq("user_id", user.id)
        .ilike("title", `%${id}%`),

      // Delete notifications with project ID in message
      supabase
        .from("user_notifications")
        .delete()
        .eq("user_id", user.id)
        .ilike("message", `%${id}%`),

      // Delete notifications with project ID in URL (like SRS reminders)
      supabase
        .from("user_notifications")
        .delete()
        .eq("user_id", user.id)
        .ilike("url", `%/projects/${id}%`),

      // Delete notifications with project ID in URL (alternative patterns)
      supabase
        .from("user_notifications")
        .delete()
        .eq("user_id", user.id)
        .ilike("url", `%${id}%`),

      // Delete SRS study reminder notifications that might reference this specific project
      supabase
        .from("user_notifications")
        .delete()
        .eq("user_id", user.id)
        .eq("type", "srs_reminder")
        .ilike("message", `%${id}%`),
    ];

    const notificationResults = await Promise.all(notificationDeletePromises);
    console.log(
      `[Projects] deleteProject - Notification cleanup results:`,
      notificationResults
    );

    // 2. Delete per-project daily study stats 
    console.log(
      `[Projects] deleteProject - Deleting per-project daily study stats`
    );
    const { error: statsError } = await supabase
      .from("daily_study_stats")
      .delete()
      .eq("user_id", user.id)
      .eq("project_id", id);

    if (statsError) {
      console.warn(
        `[Projects] deleteProject - Warning: Failed to delete daily stats:`,
        statsError
      );
      // Don't throw error here as this is cleanup - continue with project deletion
    }

    // 3. Delete the project (this will cascade delete flashcards and srs_states)
    console.log(
      `[Projects] deleteProject - Deleting project and cascaded data`
    );
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.log(`[Projects] deleteProject - Error deleting project:`, error);
      throw error;
    }

    console.log(
      `[Projects] deleteProject - Successfully deleted project: ${id}`
    );
  } catch (error) {
    console.error("[Projects] deleteProject - Error during deletion:", error);
    throw error;
  }
}
