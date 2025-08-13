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
    .select("id, name, description, created_at")
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

export type Project = {
  id: string;
  name: string;
  description: string;
  created_at: string;
  flashcards: Flashcard[];
  formattedCreatedAt?: string;
};

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
    .select("id, name, description, created_at")
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
}: {
  name: string;
  description: string;
}) {
  console.log(`[Projects] createProject called:`, { name, description });
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
}: {
  id: string;
  name: string;
  description: string;
}) {
  console.log("projectsActions: updateProject called", {
    id,
    name,
    description,
  });
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("projects")
    .update({ name, description })
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
    // Check both title (project name) and URL (project ID) fields
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

      // Delete notifications with project ID in URL (like SRS reminders)
      supabase
        .from("user_notifications")
        .delete()
        .eq("user_id", user.id)
        .ilike("url", `%/projects/${id}%`),
    ];

    const notificationResults = await Promise.all(notificationDeletePromises);
    console.log(
      `[Projects] deleteProject - Notification cleanup results:`,
      notificationResults
    );

    // 2. Delete the project (this will cascade delete flashcards and srs_states)
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
