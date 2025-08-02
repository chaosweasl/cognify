"use server";

import { createClient } from "@/utils/supabase/server";
import { 
  Flashcard, 
  CreateFlashcardData, 
  UpdateFlashcardData 
} from "../types/flashcard";

// Get all flashcards for a project
export async function getFlashcardsByProjectId(projectId: string): Promise<Flashcard[]> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return [];

  // First verify the user owns this project
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (projectError || !project) return [];

  const { data, error } = await supabase
    .from("flashcards")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching flashcards:", error);
    return [];
  }

  return data || [];
}

// Create a new flashcard
export async function createFlashcard(
  projectId: string, 
  flashcardData: CreateFlashcardData
): Promise<Flashcard | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

  // Verify the user owns this project
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (projectError || !project) throw new Error("Project not found or unauthorized");

  const { data, error } = await supabase
    .from("flashcards")
    .insert([
      {
        project_id: projectId,
        front: flashcardData.front,
        back: flashcardData.back,
        extra: flashcardData.extra || {},
      },
    ])
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

// Create multiple flashcards at once
export async function createFlashcards(
  projectId: string, 
  flashcardsData: CreateFlashcardData[]
): Promise<Flashcard[]> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

  // Verify the user owns this project
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (projectError || !project) throw new Error("Project not found or unauthorized");

  const flashcardsToInsert = flashcardsData.map(card => ({
    project_id: projectId,
    front: card.front,
    back: card.back,
    extra: card.extra || {},
  }));

  const { data, error } = await supabase
    .from("flashcards")
    .insert(flashcardsToInsert)
    .select("*");

  if (error) throw error;
  return data || [];
}

// Update a flashcard
export async function updateFlashcard(
  flashcardId: string, 
  updateData: UpdateFlashcardData
): Promise<Flashcard | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

  // Verify the user owns the project that contains this flashcard
  const { data: flashcard, error: flashcardError } = await supabase
    .from("flashcards")
    .select("project_id, projects!inner(user_id)")
    .eq("id", flashcardId)
    .single();

  if (flashcardError || !flashcard || flashcard.projects.user_id !== user.id) {
    throw new Error("Flashcard not found or unauthorized");
  }

  const { data, error } = await supabase
    .from("flashcards")
    .update({
      ...updateData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", flashcardId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

// Delete a flashcard
export async function deleteFlashcard(flashcardId: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

  // Verify the user owns the project that contains this flashcard
  const { data: flashcard, error: flashcardError } = await supabase
    .from("flashcards")
    .select("project_id, projects!inner(user_id)")
    .eq("id", flashcardId)
    .single();

  if (flashcardError || !flashcard || flashcard.projects.user_id !== user.id) {
    throw new Error("Flashcard not found or unauthorized");
  }

  const { error } = await supabase
    .from("flashcards")
    .delete()
    .eq("id", flashcardId);

  if (error) throw error;
  return true;
}

// Delete all flashcards for a project
export async function deleteAllFlashcardsForProject(projectId: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

  // Verify the user owns this project
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (projectError || !project) throw new Error("Project not found or unauthorized");

  const { error } = await supabase
    .from("flashcards")
    .delete()
    .eq("project_id", projectId);

  if (error) throw error;
  return true;
}

// Replace all flashcards for a project (used by editor save)
export async function replaceAllFlashcardsForProject(
  projectId: string, 
  flashcardsData: CreateFlashcardData[]
): Promise<Flashcard[]> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

  // Verify the user owns this project
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (projectError || !project) throw new Error("Project not found or unauthorized");

  // Delete all existing flashcards
  await deleteAllFlashcardsForProject(projectId);

  // Create new flashcards if any
  if (flashcardsData.length > 0) {
    return await createFlashcards(projectId, flashcardsData);
  }

  return [];
}