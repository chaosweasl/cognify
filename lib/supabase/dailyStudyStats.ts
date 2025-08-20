/**
 * Database utilities for daily study statistics
 * Replaces localStorage-based daily limit tracking with proper database persistence
 */

import { createClient } from "./client";

// Simple logging functions (replacing removed debug utilities)
function logSupabaseError(context: string, error: unknown) {
  console.error(`[${context}] Supabase error:`, error);
}

function logError(context: string, error: unknown) {
  console.error(`[${context}] Error:`, error);
}

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

export type DailyStudyStats = {
  id: string;
  user_id: string;
  study_date: string; // YYYY-MM-DD format
  new_cards_studied: number;
  reviews_completed: number;
  time_spent_seconds: number;
  cards_learned: number;
  cards_lapsed: number;
  created_at: string;
  updated_at: string;
  project_id: string | null; // Can be null for global stats
};

/**
 * Get today's date string in YYYY-MM-DD format
 */
function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Get daily study stats for a specific date (GLOBAL stats only, project_id = NULL)
 * Returns stats for the given date, or default values if no record exists
 * FIXED: Return zeros since schema doesn't support global stats
 */
export async function getDailyStudyStats(
  userId: string, // eslint-disable-line @typescript-eslint/no-unused-vars
  date?: string // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<{ newCardsStudied: number; reviewsCompleted: number }> {
  // FIXED: Schema constraint requires project_id NOT NULL
  // Global stats are not supported by current schema
  console.log(`[DailyStats] Skipping global stats query due to schema constraints`);
  console.log(`[DailyStats] Use getProjectDailyStudyStats for per-project tracking`);
  return { newCardsStudied: 0, reviewsCompleted: 0 };
}

/**
 * Get daily study stats for a specific project and date
 * Returns stats for the given project and date, or default values if no record exists
 */
export async function getProjectDailyStudyStats(
  userId: string,
  projectId: string,
  date?: string
): Promise<{ newCardsStudied: number; reviewsCompleted: number }> {
  const supabase = createClient();
  const studyDate = date || getTodayDateString();

  console.log(
    `[ProjectDailyStats] Fetching project stats for date: ${studyDate}, user: ${userId}, project: ${projectId}`
  );

  try {
    // Check if user is authenticated first
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      console.warn(
        `[ProjectDailyStats] No active session found, returning defaults`
      );
      return { newCardsStudied: 0, reviewsCompleted: 0 };
    }

    console.log(`[ProjectDailyStats] Session found, querying database...`);

    // Use .maybeSingle() to handle missing records gracefully
    const { data, error } = await supabase
      .from("daily_study_stats")
      .select("new_cards_studied, reviews_completed")
      .eq("study_date", studyDate)
      .eq("project_id", projectId)
      .maybeSingle();

    if (
      error &&
      (error.message || error.code || Object.keys(error).length > 0)
    ) {
      console.error(`[ProjectDailyStats] Database error:`, error);
      return { newCardsStudied: 0, reviewsCompleted: 0 };
    }

    if (!data) {
      console.log(
        `[ProjectDailyStats] No project stats found for ${studyDate}, project ${projectId}, returning defaults (0, 0)`
      );
      return { newCardsStudied: 0, reviewsCompleted: 0 };
    }

    const result = {
      newCardsStudied: data.new_cards_studied,
      reviewsCompleted: data.reviews_completed,
    };

    console.log(
      `[ProjectDailyStats] Successfully retrieved project stats:`,
      result
    );

    return result;
  } catch (error) {
    console.error(
      `[ProjectDailyStats] Exception while fetching project daily study stats:`,
      error
    );
    return { newCardsStudied: 0, reviewsCompleted: 0 };
  }
}

/**
 * Update daily study stats for today (GLOBAL stats, project_id = NULL)
 * Uses UPSERT to create or update the record for today
 * FIXED: Skip global stats insertion since schema requires project_id NOT NULL
 */
export async function updateDailyStudyStats(
  userId: string, // eslint-disable-line @typescript-eslint/no-unused-vars
  newCardsStudied: number, // eslint-disable-line @typescript-eslint/no-unused-vars
  reviewsCompleted: number, // eslint-disable-line @typescript-eslint/no-unused-vars
  additionalStats?: { // eslint-disable-line @typescript-eslint/no-unused-vars
    timeSpentSeconds?: number;
    cardsLearned?: number;
    cardsLapsed?: number;
  }
): Promise<void> {
  // FIXED: Schema constraint requires project_id NOT NULL
  // Global stats are not supported by current schema
  // This function is kept for backward compatibility but does nothing
  console.log(`[DailyStats] Skipping global stats update due to schema constraints`);
  console.log(`[DailyStats] Use updateProjectDailyStudyStats for per-project tracking`);
  return;
}

/**
 * Update daily study stats for a specific project
 * Uses UPSERT to create or update the record for today
 */
export async function updateProjectDailyStudyStats(
  userId: string,
  projectId: string,
  newCardsStudied: number,
  reviewsCompleted: number,
  additionalStats?: {
    timeSpentSeconds?: number;
    cardsLearned?: number;
    cardsLapsed?: number;
  }
): Promise<void> {
  const supabase = createClient();
  const studyDate = getTodayDateString();

  try {
    const updateData: Partial<DailyStudyStats> & { project_id: string } = {
      user_id: userId,
      project_id: projectId,
      study_date: studyDate,
      new_cards_studied: newCardsStudied,
      reviews_completed: reviewsCompleted,
      ...(additionalStats?.timeSpentSeconds !== undefined && {
        time_spent_seconds: additionalStats.timeSpentSeconds,
      }),
      ...(additionalStats?.cardsLearned !== undefined && {
        cards_learned: additionalStats.cardsLearned,
      }),
      ...(additionalStats?.cardsLapsed !== undefined && {
        cards_lapsed: additionalStats.cardsLapsed,
      }),
    };

    const { error } = await supabase
      .from("daily_study_stats")
      .upsert(updateData, {
        onConflict: "user_id,project_id,study_date",
        ignoreDuplicates: false,
      });

    if (error && hasMeaningfulError(error)) {
      logSupabaseError("Error updating project daily study stats", error);
    }
  } catch (error) {
    logError("Failed to update project daily study stats", error);
  }
}

/**
 * Increment daily study counters
 * Efficiently increments counters without overwriting other fields
 * FIXED: Skip operation since schema doesn't support global stats
 */
export async function incrementDailyStudyCounters(
  userId: string, // eslint-disable-line @typescript-eslint/no-unused-vars
  incrementNewCards = 0, // eslint-disable-line @typescript-eslint/no-unused-vars
  incrementReviews = 0 // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<void> {
  // FIXED: Schema constraint requires project_id NOT NULL
  // Global stats are not supported by current schema
  console.log(`[DailyStats] Skipping global stats increment due to schema constraints`);
  console.log(`[DailyStats] Use project-specific functions for per-project tracking`);
  return;
}

/**
 * Get daily study stats for multiple dates (for analytics/charts)
 */
export async function getDailyStudyStatsRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<DailyStudyStats[]> {
  const supabase = createClient();

  try {
    // Fixed: Removed explicit user_id filter, let RLS handle it
    const { data, error } = await supabase
      .from("daily_study_stats")
      .select("*")
      .gte("study_date", startDate)
      .lte("study_date", endDate)
      .order("study_date", { ascending: true });

    if (
      error &&
      (error.message || error.code || Object.keys(error).length > 0)
    ) {
      console.error("Error fetching daily study stats range:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Failed to fetch daily study stats range:", error);
    return [];
  }
}

/**
 * Reset daily study stats for a specific date (useful for testing/admin)
 * FIXED: Skip operation since schema doesn't support global stats
 */
export async function resetDailyStudyStats(
  userId: string, // eslint-disable-line @typescript-eslint/no-unused-vars
  date?: string // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<void> {
  // FIXED: Schema constraint requires project_id NOT NULL
  // Global stats are not supported by current schema
  console.log(`[DailyStats] Skipping global stats reset due to schema constraints`);
  console.log(`[DailyStats] Use project-specific functions for per-project tracking`);
  return;
}
