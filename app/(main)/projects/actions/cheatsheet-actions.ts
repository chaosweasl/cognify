"use server";

import { createClient } from "@/lib/supabase/server";
import { CacheInvalidation } from "@/hooks/useCache";
import { validateUUID, validateAndSanitizeText } from "@/lib/utils/security";

// Types based on database schema
interface Cheatsheet {
  id: string;
  project_id: string;
  title: string;
  content: {
    sections: Array<{
      id: string;
      title: string;
      content: string;
      keyPoints: string[];
      examples?: string[];
    }>;
    summary?: string;
    metadata?: {
      sourceFile?: string;
      generatedAt: string;
      style: string;
    };
  };
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface CreateCheatsheetData {
  title: string;
  content: Cheatsheet["content"];
  tags?: string[];
}

interface UpdateCheatsheetData extends CreateCheatsheetData {
  id: string;
}

// Get all cheatsheets for a project
export async function getCheatsheetsByProjectId(
  projectId: string
): Promise<Cheatsheet[]> {
  console.log(
    `[Cheatsheets] getCheatsheetsByProjectId called for project: ${projectId}`
  );

  const projectIdValidation = validateUUID(projectId);
  if (!projectIdValidation.isValid) {
    console.log(
      `[Cheatsheets] getCheatsheetsByProjectId - Invalid project ID format: ${projectId}`
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
      `[Cheatsheets] getCheatsheetsByProjectId - User not authenticated:`,
      userError
    );
    return [];
  }

  // Verify project ownership
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (projectError || !project) {
    console.log(
      `[Cheatsheets] getCheatsheetsByProjectId - Project not found or unauthorized:`,
      projectError
    );
    return [];
  }

  const { data: cheatsheets, error } = await supabase
    .from("cheatsheets")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      "[Cheatsheets] getCheatsheetsByProjectId - Error fetching cheatsheets:",
      error
    );
    return [];
  }

  console.log(
    `[Cheatsheets] getCheatsheetsByProjectId - Found ${
      cheatsheets?.length || 0
    } cheatsheets`
  );
  return cheatsheets || [];
}

// Create a new cheatsheet
export async function createCheatsheet(
  projectId: string,
  cheatsheetData: CreateCheatsheetData
): Promise<Cheatsheet> {
  console.log(
    `[Cheatsheets] createCheatsheet called for project: ${projectId}`
  );

  const projectIdValidation = validateUUID(projectId);
  if (!projectIdValidation.isValid) {
    throw new Error("Invalid project ID format");
  }

  // Validate title
  const titleValidation = validateAndSanitizeText(
    cheatsheetData.title,
    255,
    "Title"
  );
  if (!titleValidation.isValid) {
    throw new Error(titleValidation.error || "Invalid title");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Not authenticated");
  }

  // Verify project ownership
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (projectError || !project) {
    throw new Error("Project not found or unauthorized");
  }

  const { data, error } = await supabase
    .from("cheatsheets")
    .insert([
      {
        project_id: projectId,
        title: titleValidation.sanitized,
        content: cheatsheetData.content,
        tags: cheatsheetData.tags || [],
      },
    ])
    .select("*")
    .single();

  if (error) {
    console.error(
      "[Cheatsheets] createCheatsheet - Error creating cheatsheet:",
      error
    );
    throw error;
  }

  console.log(
    `[Cheatsheets] createCheatsheet - Successfully created cheatsheet with ID: ${data.id}`
  );

  // Invalidate cache
  CacheInvalidation.invalidate(`cheatsheets_${projectId}`);

  return data;
}

// Update an existing cheatsheet
export async function updateCheatsheet(
  cheatsheetData: UpdateCheatsheetData
): Promise<Cheatsheet> {
  console.log(
    `[Cheatsheets] updateCheatsheet called for ID: ${cheatsheetData.id}`
  );

  const idValidation = validateUUID(cheatsheetData.id);
  if (!idValidation.isValid) {
    throw new Error("Invalid cheatsheet ID format");
  }

  const titleValidation = validateAndSanitizeText(
    cheatsheetData.title,
    255,
    "Title"
  );
  if (!titleValidation.isValid) {
    throw new Error(titleValidation.error || "Invalid title");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Not authenticated");
  }

  // Verify ownership via project relationship
  const { data: existing, error: existingError } = await supabase
    .from("cheatsheets")
    .select("*, projects!inner(user_id)")
    .eq("id", cheatsheetData.id)
    .eq("projects.user_id", user.id)
    .single();

  if (existingError || !existing) {
    throw new Error("Cheatsheet not found or unauthorized");
  }

  const { data, error } = await supabase
    .from("cheatsheets")
    .update({
      title: titleValidation.sanitized,
      content: cheatsheetData.content,
      tags: cheatsheetData.tags || [],
    })
    .eq("id", cheatsheetData.id)
    .select("*")
    .single();

  if (error) {
    console.error(
      "[Cheatsheets] updateCheatsheet - Error updating cheatsheet:",
      error
    );
    throw error;
  }

  console.log(
    `[Cheatsheets] updateCheatsheet - Successfully updated cheatsheet: ${data.id}`
  );

  // Invalidate cache
  CacheInvalidation.invalidate(`cheatsheets_${existing.project_id}`);

  return data;
}

// Delete a cheatsheet
export async function deleteCheatsheet(cheatsheetId: string): Promise<void> {
  console.log(`[Cheatsheets] deleteCheatsheet called for ID: ${cheatsheetId}`);

  const idValidation = validateUUID(cheatsheetId);
  if (!idValidation.isValid) {
    throw new Error("Invalid cheatsheet ID format");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Not authenticated");
  }

  // Get cheatsheet to verify ownership and get project_id for cache invalidation
  const { data: cheatsheet, error: fetchError } = await supabase
    .from("cheatsheets")
    .select("id, project_id, projects!inner(user_id)")
    .eq("id", cheatsheetId)
    .eq("projects.user_id", user.id)
    .single();

  if (fetchError || !cheatsheet) {
    throw new Error("Cheatsheet not found or unauthorized");
  }

  const { error } = await supabase
    .from("cheatsheets")
    .delete()
    .eq("id", cheatsheetId);

  if (error) {
    console.error(
      "[Cheatsheets] deleteCheatsheet - Error deleting cheatsheet:",
      error
    );
    throw error;
  }

  console.log(
    `[Cheatsheets] deleteCheatsheet - Successfully deleted cheatsheet: ${cheatsheetId}`
  );

  // Invalidate cache
  CacheInvalidation.invalidate(`cheatsheets_${cheatsheet.project_id}`);
}

// Get cheatsheet by ID
export async function getCheatsheetById(
  cheatsheetId: string
): Promise<Cheatsheet | null> {
  console.log(`[Cheatsheets] getCheatsheetById called for ID: ${cheatsheetId}`);

  const idValidation = validateUUID(cheatsheetId);
  if (!idValidation.isValid) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data, error } = await supabase
    .from("cheatsheets")
    .select("*, projects!inner(user_id)")
    .eq("id", cheatsheetId)
    .eq("projects.user_id", user.id)
    .single();

  if (error || !data) {
    console.error(
      "[Cheatsheets] getCheatsheetById - Error or not found:",
      error
    );
    return null;
  }

  return data;
}
