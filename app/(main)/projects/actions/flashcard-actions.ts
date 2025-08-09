"use server";

import { createClient } from "@/utils/supabase/server";
import {
  Flashcard,
  CreateFlashcardData,
  UpdateFlashcardData,
} from "../types/flashcard";
import { validateUUID, validateFlashcardContent } from "@/utils/security";

// Get all flashcards for a project
export async function getFlashcardsByProjectId(
  projectId: string
): Promise<Flashcard[]> {
  console.log(
    `[Flashcards] getFlashcardsByProjectId called for project: ${projectId}`
  );

  // Validate project ID format
  const projectIdValidation = validateUUID(projectId);
  if (!projectIdValidation.isValid) {
    console.log(
      `[Flashcards] getFlashcardsByProjectId - Invalid project ID format: ${projectId}`
    );
    return [];
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.log(
      `[Flashcards] getFlashcardsByProjectId - User not authenticated:`,
      userError
    );
    return [];
  }

  // First verify the user owns this project
  console.log(
    `[Flashcards] getFlashcardsByProjectId - Verifying project ownership for user: ${user.id}`
  );
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (projectError || !project) {
    console.log(
      `[Flashcards] getFlashcardsByProjectId - Project not found or unauthorized:`,
      projectError
    );
    return [];
  }

  console.log(
    `[Flashcards] getFlashcardsByProjectId - Fetching flashcards for project: ${projectId}`
  );
  const { data, error } = await supabase
    .from("flashcards")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error(
      "[Flashcards] getFlashcardsByProjectId - Error fetching flashcards:",
      error
    );
    return [];
  }

  console.log(
    `[Flashcards] getFlashcardsByProjectId - Successfully retrieved ${
      data?.length || 0
    } flashcards`
  );
  return data || [];
}

// Create a new flashcard
export async function createFlashcard(
  projectId: string,
  flashcardData: CreateFlashcardData
): Promise<Flashcard | null> {
  console.log(`[Flashcards] createFlashcard called for project: ${projectId}`, {
    front: flashcardData.front.length,
    back: flashcardData.back.length,
  });

  // Validate inputs
  const projectIdValidation = validateUUID(projectId);
  if (!projectIdValidation.isValid) {
    console.log(
      `[Flashcards] createFlashcard - Invalid project ID: ${projectId}`
    );
    throw new Error("Invalid project ID format");
  }

  const contentValidation = validateFlashcardContent(
    flashcardData.front,
    flashcardData.back
  );
  if (!contentValidation.isValid) {
    console.log(
      `[Flashcards] createFlashcard - Invalid content: ${contentValidation.error}`
    );
    throw new Error(contentValidation.error || "Invalid flashcard content");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.log(
      `[Flashcards] createFlashcard - User not authenticated:`,
      userError
    );
    throw new Error("Not authenticated");
  }

  // Verify the user owns this project
  console.log(
    `[Flashcards] createFlashcard - Verifying project ownership for user: ${user.id}`
  );
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (projectError || !project) {
    console.log(
      `[Flashcards] createFlashcard - Project not found or unauthorized:`,
      projectError
    );
    throw new Error("Project not found or unauthorized");
  }

  console.log(
    `[Flashcards] createFlashcard - Creating flashcard in project: ${projectId}`
  );
  const { data, error } = await supabase
    .from("flashcards")
    .insert([
      {
        project_id: projectId,
        front: contentValidation.sanitizedFront,
        back: contentValidation.sanitizedBack,
        extra: flashcardData.extra || {},
      },
    ])
    .select("*")
    .single();

  if (error) {
    console.error(
      "[Flashcards] createFlashcard - Error creating flashcard:",
      error
    );
    throw error;
  }

  console.log(
    `[Flashcards] createFlashcard - Successfully created flashcard with ID: ${data.id}`
  );
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

  if (projectError || !project)
    throw new Error("Project not found or unauthorized");

  const flashcardsToInsert = flashcardsData.map((card) => ({
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

  if (
    flashcardError ||
    !flashcard ||
    !Array.isArray(flashcard.projects) ||
    flashcard.projects.length === 0 ||
    flashcard.projects[0].user_id !== user.id
  ) {
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

  if (
    flashcardError ||
    !flashcard ||
    !Array.isArray(flashcard.projects) ||
    flashcard.projects.length === 0 ||
    flashcard.projects[0].user_id !== user.id
  ) {
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
export async function deleteAllFlashcardsForProject(
  projectId: string
): Promise<boolean> {
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

  if (projectError || !project)
    throw new Error("Project not found or unauthorized");

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

  if (projectError || !project)
    throw new Error("Project not found or unauthorized");

  // Delete all existing flashcards
  await deleteAllFlashcardsForProject(projectId);

  // Create new flashcards if any
  if (flashcardsData.length > 0) {
    return await createFlashcards(projectId, flashcardsData);
  }

  return [];
}
