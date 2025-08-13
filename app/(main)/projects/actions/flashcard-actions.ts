"use server";

import { createClient } from "@/lib/supabase/server";
import {
  Flashcard,
  CreateFlashcardData,
  UpdateFlashcardData,
} from "@/src/types";
import { validateUUID, validateFlashcardContent } from "@/lib/utils/security";

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

  // Create initial SRS state for the new flashcard
  console.log(
    `[Flashcards] createFlashcard - Creating SRS state for flashcard: ${data.id}`
  );
  const now = new Date().toISOString();
  const { error: srsError } = await supabase.from("srs_states").insert([
    {
      user_id: user.id,
      project_id: projectId,
      card_id: data.id,
      interval: 1,
      ease: 2.5,
      due: now, // New cards are immediately available
      last_reviewed: now,
      repetitions: 0,
      state: "new",
      lapses: 0,
      learning_step: 0,
      is_leech: false,
      is_suspended: false,
    },
  ]);

  if (srsError) {
    console.error(
      "[Flashcards] createFlashcard - Error creating SRS state:",
      srsError
    );
    // Don't throw error here - flashcard was created successfully
    // The SRS state can be created later if needed
  } else {
    console.log(
      `[Flashcards] createFlashcard - Successfully created SRS state for flashcard: ${data.id}`
    );
  }

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

  // Create SRS states for all new flashcards
  if (data && data.length > 0) {
    console.log(
      `[Flashcards] createFlashcards - Creating SRS states for ${data.length} flashcards`
    );
    const now = new Date().toISOString();
    const srsStatesToInsert = data.map((flashcard) => ({
      user_id: user.id,
      project_id: projectId,
      card_id: flashcard.id,
      interval: 1,
      ease: 2.5,
      due: now, // New cards are immediately available
      last_reviewed: now,
      repetitions: 0,
      state: "new",
      lapses: 0,
      learning_step: 0,
      is_leech: false,
      is_suspended: false,
    }));

    const { error: srsError } = await supabase
      .from("srs_states")
      .insert(srsStatesToInsert);

    if (srsError) {
      console.error(
        "[Flashcards] createFlashcards - Error creating SRS states:",
        srsError
      );
      // Don't throw error here - flashcards were created successfully
      // The SRS states can be created later if needed
    } else {
      console.log(
        `[Flashcards] createFlashcards - Successfully created SRS states for ${data.length} flashcards`
      );
    }
  }

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
  console.log("[Flashcards] replaceAllFlashcardsForProject called with:", {
    projectId,
    flashcardsCount: flashcardsData.length,
    flashcardsData,
  });

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

  console.log(
    "[Flashcards] Project ownership verified, deleting existing flashcards"
  );

  // Delete all existing flashcards
  await deleteAllFlashcardsForProject(projectId);

  console.log("[Flashcards] Existing flashcards deleted, creating new ones");

  // Create new flashcards if any
  if (flashcardsData.length > 0) {
    const result = await createFlashcards(projectId, flashcardsData);
    console.log("[Flashcards] Successfully created flashcards:", result);
    return result;
  }

  console.log("[Flashcards] No flashcards to create, returning empty array");
  return [];
}
