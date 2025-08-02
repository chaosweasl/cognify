"use server";

import { createClient } from "@/utils/supabase/server";

// Fetch a single project by id for the current user
export async function getProjectById(id: string): Promise<Project | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return null;

  const { data, error } = await supabase
    .from("projects")
    .select("id, name, description, created_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (error || !data) return null;
  
  return {
    ...data,
    flashcards: [], // Flashcards are now loaded separately
  };
}

// Update only the flashcards array for a project
// DEPRECATED: Use flashcard-specific actions instead
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function updateFlashcards(_id: string, _flashcards: Flashcard[]) {
  throw new Error("updateFlashcards is deprecated. Use flashcard-specific actions instead.");
}

// --- Types ---
export type Flashcard = {
  question: string;
  answer: string;
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
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return [];

  const { data, error } = await supabase
    .from("projects")
    .select("id, name, description, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
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
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

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
  if (error) throw error;
  return data && data[0]?.id;
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

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw error;
}
