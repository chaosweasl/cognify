// SRS Database Utilities for Supabase
// Handles loading and saving SRS states to/from the database

import { createClient } from "@supabase/supabase-js";
import { SRSCardState, initSRSState } from "./SRSScheduler";

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
  };
}

/**
 * Convert database format to SRSCardState
 */
function databaseToSRSState(dbState: DatabaseSRSState): SRSCardState {
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
  try {
    // Fetch existing SRS states from database
    const { data: existingStates, error } = await supabase
      .from("srs_states")
      .select("*")
      .eq("user_id", userId)
      .eq("project_id", projectId)
      .in("card_id", cardIds);

    if (error) {
      console.error("Error loading SRS states:", error);
      // Fallback to initializing new states
      return initSRSState(cardIds);
    }

    // Convert database format to SRS format
    const srsStates: Record<string, SRSCardState> = {};
    const existingCardIds = new Set<string>();

    if (existingStates) {
      for (const dbState of existingStates) {
        srsStates[dbState.card_id] = databaseToSRSState(dbState);
        existingCardIds.add(dbState.card_id);
      }
    }

    // Initialize states for new cards that don't exist in database
    const newCardIds = cardIds.filter((id) => !existingCardIds.has(id));
    if (newCardIds.length > 0) {
      const newStates = initSRSState(newCardIds);
      Object.assign(srsStates, newStates);
    }

    return srsStates;
  } catch (error) {
    console.error("Error in loadSRSStates:", error);
    return initSRSState(cardIds);
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
  try {
    const dbStates = Object.values(srsStates).map((cardState) =>
      srsStateToDatabase(cardState, userId, projectId)
    );

    const { error } = await supabase.from("srs_states").upsert(dbStates, {
      onConflict: "user_id,project_id,card_id",
    });

    if (error) {
      console.error("Error saving SRS states:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in saveSRSStates:", error);
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
      console.error("Error saving single SRS state:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in saveSingleSRSState:", error);
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
 * Get study statistics across all projects for a user
 */
export async function getUserStudyStats(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<{
  totalCards: number;
  newCards: number;
  learningCards: number;
  reviewCards: number;
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

    if (!states) return null;

    const now = new Date().toISOString();
    const stats = {
      totalCards: states.length,
      newCards: 0,
      learningCards: 0,
      reviewCards: 0,
      dueCards: 0,
      leeches: 0,
    };

    for (const state of states) {
      // Count by state
      if (state.state === "new") stats.newCards++;
      else if (state.state === "learning" || state.state === "relearning")
        stats.learningCards++;
      else if (state.state === "review") stats.reviewCards++;

      // Count due cards
      if (state.due <= now) stats.dueCards++;

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
      .select("card_id")
      .eq("user_id", userId)
      .eq("project_id", projectId)
      .lte("due", now);

    if (error) {
      console.error("Error getting cards due:", error);
      return [];
    }

    return states ? states.map((s) => s.card_id) : [];
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
