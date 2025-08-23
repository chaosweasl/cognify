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
    .select(`
      id, name, description, created_at, updated_at, user_id, 
      new_cards_per_day, max_reviews_per_day,
      learning_steps, relearning_steps, graduating_interval, easy_interval,
      starting_ease, minimum_ease, easy_bonus, hard_interval_factor,
      easy_interval_factor, lapse_recovery_factor, leech_threshold,
      leech_action, new_card_order, review_ahead, bury_siblings,
      max_interval, lapse_ease_penalty
    `)
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
    .select(`
      id, name, description, created_at, updated_at, user_id, 
      new_cards_per_day, max_reviews_per_day,
      learning_steps, relearning_steps, graduating_interval, easy_interval,
      starting_ease, minimum_ease, easy_bonus, hard_interval_factor,
      easy_interval_factor, lapse_recovery_factor, leech_threshold,
      leech_action, new_card_order, review_ahead, bury_siblings,
      max_interval, lapse_ease_penalty
    `)
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
  
  // Create project with default SRS settings based on Anki defaults
  const { data, error } = await supabase
    .from("projects")
    .insert([
      {
        user_id: user.id,
        name,
        description,
        new_cards_per_day,
        max_reviews_per_day,
        // Default SRS settings (Anki-compatible)
        learning_steps: [1, 10],
        relearning_steps: [10],
        graduating_interval: 1,
        easy_interval: 4,
        starting_ease: 2.5,
        minimum_ease: 1.3,
        easy_bonus: 1.3,
        hard_interval_factor: 1.2,
        easy_interval_factor: 1.3,
        lapse_recovery_factor: 0.5,
        leech_threshold: 8,
        leech_action: 'suspend',
        new_card_order: 'random',
        review_ahead: false,
        bury_siblings: false,
        max_interval: 36500,
        lapse_ease_penalty: 0.2,
      },
    ])
    .select();

  if (error) {
    console.log(`[Projects] createProject - Error creating project:`, error);
    throw error;
  }

  const projectId = data && data[0]?.id;
  console.log(
    `[Projects] createProject - Successfully created project with ID: ${projectId}`
  );
  
  // Invalidate project cache to ensure UI updates
  CacheInvalidation.invalidatePattern('user_projects');
  
  return projectId;
}

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
  leech_action?: 'suspend' | 'tag';
  new_card_order?: 'random' | 'fifo';
  review_ahead?: boolean;
  bury_siblings?: boolean;
  max_interval?: number;
  lapse_ease_penalty?: number;
}) {
  console.log("projectsActions: updateProject called", projectData);
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

  const { id, ...updateData } = projectData;
  
  // Remove undefined values to avoid updating fields unnecessarily
  const cleanUpdateData = Object.fromEntries(
    Object.entries(updateData).filter(([, value]) => value !== undefined)
  );

  console.log("updateProject: sending data to database", cleanUpdateData);

  const { error } = await supabase
    .from("projects")
    .update(cleanUpdateData)
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw error;
  
  // Invalidate cache to ensure UI updates across the app
  CacheInvalidation.invalidatePattern('user_projects');
  CacheInvalidation.invalidatePattern(`project_${id}`);
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
    
    // Invalidate cache to ensure UI updates across the app
    CacheInvalidation.invalidatePattern('user_projects');
    CacheInvalidation.invalidatePattern(`project_${id}`);
    CacheInvalidation.invalidatePattern('project_stats_');
  } catch (error) {
    console.error("[Projects] deleteProject - Error during deletion:", error);
    throw error;
  }
}
