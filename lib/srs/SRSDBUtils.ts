// SRS Database Utilities for Supabase
// Handles loading and saving SRS states to/from the database

import { createClient } from "@/lib/supabase/client";
import {
  SRSCardState,
  initSRSStateWithSettings,
  DEFAULT_SRS_SETTINGS,
} from "./SRSScheduler";

/**
 * Check if an error object contains meaningful error information
 */
function hasMeaningfulError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const errorObj = error as Record<string, unknown>;

  // Check for actual error properties with non-empty values
  const hasMessage =
    typeof errorObj.message === "string" && errorObj.message.trim() !== "";
  const hasCode =
    typeof errorObj.code === "string" && errorObj.code.trim() !== "";
  const hasDetails =
    typeof errorObj.details === "string" && errorObj.details.trim() !== "";
  const hasHint =
    typeof errorObj.hint === "string" && errorObj.hint.trim() !== "";

  // Check if there are any other meaningful properties
  const keys = Object.keys(errorObj);
  const hasOtherProps = keys.some((key) => {
    const value = errorObj[key];
    return (
      value !== null &&
      value !== undefined &&
      (typeof value !== "string" || value.trim() !== "")
    );
  });

  return hasMessage || hasCode || hasDetails || hasHint || hasOtherProps;
}

// Simple logging functions (replacing removed debug utilities)
function logSupabaseError(context: string, error: unknown) {
  console.error(`[${context}] Supabase error:`, error);
}

function logError(context: string, error: unknown) {
  console.error(`[${context}] Error:`, error);
}

function logDatabaseOperation(operation: string, details: unknown) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DB] ${operation}:`, details);
  }
}

// Database type for SRS states table
type DatabaseSRSState = {
  id: string;
  user_id: string;
  project_id: string;
  card_id: string;
  interval: number;
  ease: number;
  due: string; // ISO timestamp
  last_reviewed: string; // ISO timestamp
  repetitions: number;
  created_at?: string;
  updated_at?: string;
  // New fields for complete Anki implementation
  state: "new" | "learning" | "review" | "relearning";
  lapses: number;
  learning_step: number;
  is_leech: boolean;
  is_suspended: boolean;
};

/**
 * Convert SRSCardState to database format
 */
function srsStateToDatabase(
  cardState: SRSCardState,
  userId: string,
  projectId: string
): Omit<DatabaseSRSState, "id" | "created_at" | "updated_at"> {
  return {
    user_id: userId,
    project_id: projectId,
    card_id: cardState.id,
    interval: cardState.interval,
    ease: cardState.ease,
    due: new Date(cardState.due).toISOString(),
    last_reviewed: new Date(cardState.lastReviewed).toISOString(),
    repetitions: cardState.repetitions,
    state: cardState.state,
    lapses: cardState.lapses,
    learning_step: cardState.learningStep,
    is_leech: cardState.isLeech,
    is_suspended: cardState.isSuspended,
  };
}

/**
 * Convert database format to SRSCardState
 */
function databaseToSRSState(dbState: DatabaseSRSState, projectId: string): SRSCardState {
  return {
    id: dbState.card_id,
    state: dbState.state,
    interval: dbState.interval,
    ease: dbState.ease,
    due: new Date(dbState.due).getTime(),
    lastReviewed: new Date(dbState.last_reviewed).getTime(),
    repetitions: dbState.repetitions,
    lapses: dbState.lapses,
    learningStep: dbState.learning_step,
    isLeech: dbState.is_leech,
    isSuspended: dbState.is_suspended,
    projectId: projectId,
  };
}

/**
 * Load SRS states for a project from the database
 */
export async function loadSRSStates(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  projectId: string,
  cardIds: string[]
): Promise<Record<string, SRSCardState>> {
  console.log(
    `[SRS-DB] loadSRSStates called for user: ${userId}, project: ${projectId}, cards: ${cardIds.length}`
  );

  try {
    // Fetch existing SRS states from database
    console.log(
      `[SRS-DB] loadSRSStates - Fetching existing states from database`
    );
    const { data: existingStates, error } = await supabase
      .from("srs_states")
      .select("*")
      .eq("user_id", userId)
      .eq("project_id", projectId)
      .in("card_id", cardIds);

    if (error) {
      console.error("[SRS-DB] loadSRSStates - Database error:", {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        fullError: JSON.stringify(error, null, 2),
      });
      console.log("[SRS-DB] loadSRSStates - Falling back to default states");
      return initSRSStateWithSettings(cardIds, DEFAULT_SRS_SETTINGS, projectId);
    }

    console.log(
      `[SRS-DB] loadSRSStates - Found ${
        existingStates?.length || 0
      } existing states in database`
    );

    // Convert database format to SRS format
    const srsStates: Record<string, SRSCardState> = {};
    const existingCardIds = new Set<string>();

    if (Array.isArray(existingStates)) {
      for (const dbState of existingStates) {
        // Type guard: ensure dbState is DatabaseSRSState
        if (
          typeof dbState === "object" &&
          dbState !== null &&
          typeof dbState.card_id === "string"
        ) {
          srsStates[dbState.card_id] = databaseToSRSState(
            dbState as DatabaseSRSState,
            projectId
          );
          existingCardIds.add(dbState.card_id);
          console.log(
            `[SRS-DB] loadSRSStates - Loaded state for card: ${
              dbState.card_id
            }, state: ${(dbState as DatabaseSRSState).state}`
          );
        }
      }
    }

    // Initialize states for new cards that don't exist in database
    const newCardIds = cardIds.filter((id) => !existingCardIds.has(id));
    if (newCardIds.length > 0) {
      console.log(
        `[SRS-DB] loadSRSStates - Initializing ${newCardIds.length} new card states`
      );
      const newStates = initSRSStateWithSettings(
        newCardIds,
        DEFAULT_SRS_SETTINGS,
        projectId
      );
      Object.assign(srsStates, newStates);
    }

    console.log(
      `[SRS-DB] loadSRSStates - Successfully loaded/initialized ${
        Object.keys(srsStates).length
      } total states`
    );
    return srsStates;
  } catch (error) {
    console.error("Error in loadSRSStates:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      fullError: error,
    });
    return initSRSStateWithSettings(cardIds, DEFAULT_SRS_SETTINGS, projectId);
  }
}

/**
 * Save SRS states to the database (upsert operation)
 */
export async function saveSRSStates(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  projectId: string,
  srsStates: Record<string, SRSCardState>
): Promise<boolean> {
  console.log(
    `[SRS-DB] saveSRSStates called for user: ${userId}, project: ${projectId}, states: ${
      Object.keys(srsStates).length
    }`
  );

  // Add operation logging
  logDatabaseOperation("SAVE srs_states", {
    userId,
    projectId,
    stateCount: Object.keys(srsStates).length,
  });

  // Validate inputs
  if (!userId || !projectId) {
    console.error("[SRS-DB] saveSRSStates - Missing required parameters:", {
      userId,
      projectId,
    });
    return false;
  }

  if (!srsStates || typeof srsStates !== "object") {
    console.error("[SRS-DB] saveSRSStates - Invalid srsStates:", srsStates);
    return false;
  }

  try {
    const dbStates = Object.values(srsStates)
      .filter((cardState) => cardState && cardState.id) // Filter out invalid states
      .map((cardState) => srsStateToDatabase(cardState, userId, projectId));

    if (dbStates.length === 0) {
      console.log("[SRS-DB] saveSRSStates - No valid states to save");
      return true; // Consider this a success since there's nothing to save
    }

    console.log(
      `[SRS-DB] saveSRSStates - Upserting ${dbStates.length} states to database`
    );
    const { error } = await supabase.from("srs_states").upsert(dbStates, {
      onConflict: "user_id,project_id,card_id",
    });

    if (error && hasMeaningfulError(error)) {
      logSupabaseError("[SRS-DB] saveSRSStates - Database error", error);
      return false;
    }

    console.log(
      `[SRS-DB] saveSRSStates - Successfully saved ${dbStates.length} states`
    );

    // Log successful operation
    logDatabaseOperation("SAVE_SUCCESS srs_states", {
      userId,
      projectId,
      savedCount: dbStates.length,
    });

    return true;
  } catch (error) {
    logError("[SRS-DB] saveSRSStates - Error", error);
    return false;
  }
}

/**
 * Save a single SRS state to the database
 */
export async function saveSingleSRSState(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  projectId: string,
  cardState: SRSCardState
): Promise<boolean> {
  try {
    const dbState = srsStateToDatabase(cardState, userId, projectId);

    const { error } = await supabase.from("srs_states").upsert([dbState], {
      onConflict: "user_id,project_id,card_id",
    });

    if (error) {
      console.error("Error saving single SRS state:", {
        error,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        cardId: cardState.id,
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in saveSingleSRSState:", {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      cardId: cardState.id,
    });
    return false;
  }
}

/**
 * Delete SRS states for cards that no longer exist
 */
export async function cleanupSRSStates(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  projectId: string,
  currentCardIds: string[]
): Promise<boolean> {
  try {
    // Delete SRS states for cards not in the current card list
    const { error } = await supabase
      .from("srs_states")
      .delete()
      .eq("user_id", userId)
      .eq("project_id", projectId)
      .not(
        "card_id",
        "in",
        `(${currentCardIds.map((id) => `"${id}"`).join(",")})`
      );

    if (error) {
      console.error("Error cleaning up SRS states:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in cleanupSRSStates:", error);
    return false;
  }
}

/**
 * Get study statistics for a specific project
 */
export async function getProjectStudyStats(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  projectId: string
): Promise<{
  dueCards: number;
  newCards: number;
  learningCards: number;
} | null> {
  try {
    // Get flashcard IDs for this project
    const { data: flashcards, error: flashcardsError } = await supabase
      .from("flashcards")
      .select("id")
      .eq("project_id", projectId);

    if (flashcardsError) {
      console.error("Error getting project flashcards:", flashcardsError);
      return null;
    }

    if (!flashcards || flashcards.length === 0) {
      return { dueCards: 0, newCards: 0, learningCards: 0 };
    }

    const flashcardIds = flashcards.map((f) => f.id);

    // Get SRS states for these flashcards
    const { data: states, error: statesError } = await supabase
      .from("srs_states")
      .select("state, due, is_suspended")
      .eq("user_id", userId)
      .in("card_id", flashcardIds);

    if (statesError) {
      console.error("Error getting project SRS states:", statesError);
      return null;
    }

    if (!Array.isArray(states)) {
      return { dueCards: 0, newCards: 0, learningCards: 0 };
    }

    const now = new Date();
    let dueCards = 0;
    let newCards = 0;
    let learningCards = 0;

    states.forEach((state) => {
      if (state.is_suspended) return;

      const dueDate = new Date(state.due);

      if (state.state === "new") {
        newCards++;
      } else if (state.state === "learning" || state.state === "relearning") {
        learningCards++;
        if (dueDate <= now) {
          dueCards++;
        }
      } else if (state.state === "review" && dueDate <= now) {
        dueCards++;
      }
    });

    return { dueCards, newCards, learningCards };
  } catch (error) {
    console.error("Error in getProjectStudyStats:", error);
    return null;
  }
}

/**
 * Get study statistics across all projects for a user
 */
export async function getUserStudyStats(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<{
  totalCards: number;
  newCards: number;
  learningCards: number;
  dueCards: number;
  leeches: number;
} | null> {
  try {
    const { data: states, error } = await supabase
      .from("srs_states")
      .select("state, due, is_leech")
      .eq("user_id", userId);

    if (error) {
      console.error("Error getting user study stats:", error);
      return null;
    }

    if (!Array.isArray(states)) return null;

    const now = new Date();
    const stats = {
      totalCards: states.length,
      newCards: 0,
      learningCards: 0,
      dueCards: 0,
      leeches: 0,
    };

    for (const state of states) {
      // Count by state
      if (state.state === "new") stats.newCards++;
      else if (state.state === "learning" || state.state === "relearning")
        stats.learningCards++;

      // Count due cards (compare as dates) - exclude new cards
      if (
        typeof state.due === "string" &&
        new Date(state.due).getTime() <= now.getTime() &&
        state.state !== "new"
      ) {
        stats.dueCards++;
      }

      // Count leeches
      if (state.is_leech) stats.leeches++;
    }

    return stats;
  } catch (error) {
    console.error("Error in getUserStudyStats:", error);
    return null;
  }
}

/**
 * Get cards due for review for a specific project
 */
export async function getCardsDueForProject(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  projectId: string
): Promise<string[]> {
  try {
    const now = new Date().toISOString();
    const { data: states, error } = await supabase
      .from("srs_states")
      .select("card_id, due")
      .eq("user_id", userId)
      .eq("project_id", projectId);

    if (error) {
      console.error("Error getting cards due:", error);
      return [];
    }

    if (!Array.isArray(states)) return [];

    // Only return cards that are actually due
    const nowTime = new Date(now).getTime();
    return states
      .filter(
        (s) => typeof s.due === "string" && new Date(s.due).getTime() <= nowTime
      )
      .map((s) => s.card_id);
  } catch (error) {
    console.error("Error in getCardsDueForProject:", error);
    return [];
  }
}

/**
 * Reset SRS states for a project (for testing or reset functionality)
 */
export async function resetProjectSRSStates(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  projectId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("srs_states")
      .delete()
      .eq("user_id", userId)
      .eq("project_id", projectId);

    if (error) {
      console.error("Error resetting project SRS states:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in resetProjectSRSStates:", error);
    return false;
  }
}
