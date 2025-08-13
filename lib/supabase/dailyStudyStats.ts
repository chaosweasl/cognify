/**
 * Database utilities for daily study statistics
 * Replaces localStorage-based daily limit tracking with proper database persistence
 */

import { createClient } from "./client";
import { logSupabaseError, logError } from "@/utils/debug/errorLogger";

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
};

/**
 * Get today's date string in YYYY-MM-DD format
 */
function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Get daily study stats for a specific date
 * Returns stats for the given date, or default values if no record exists
 * Fixed: Improved auth handling and error logging for HTTP 406 issues
 */
export async function getDailyStudyStats(
  userId: string,
  date?: string
): Promise<{ newCardsStudied: number; reviewsCompleted: number }> {
  const supabase = createClient();
  const studyDate = date || getTodayDateString();

  console.log(
    `[DailyStats] Fetching stats for date: ${studyDate}, user: ${userId}`
  );

  try {
    // Check if user is authenticated first
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      console.warn(`[DailyStats] No active session found, returning defaults`);
      return { newCardsStudied: 0, reviewsCompleted: 0 };
    }

    console.log(`[DailyStats] Session found, user ID: ${session.user.id}`);

    // Debug: Log the exact request we're about to make
    console.log(`[DailyStats] Making request to daily_study_stats table`);
    console.log(
      `[DailyStats] Query: select=new_cards_studied,reviews_completed&study_date=eq.${studyDate}`
    );

    // Fixed: Use .maybeSingle() instead of .single() to handle missing records gracefully
    // .single() throws HTTP 406 when no records found, .maybeSingle() returns null
    const { data, error } = await supabase
      .from("daily_study_stats")
      .select("new_cards_studied, reviews_completed")
      .eq("study_date", studyDate)
      .maybeSingle();

    if (
      error &&
      (error.message || error.code || Object.keys(error).length > 0)
    ) {
      console.error(`[DailyStats] Error fetching daily stats:`, error);
      console.error(`[DailyStats] Error details:`, {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return { newCardsStudied: 0, reviewsCompleted: 0 };
    }

    if (!data) {
      // No record exists for this date, return default values
      console.log(
        `[DailyStats] No stats found for ${studyDate}, returning defaults`
      );
      return { newCardsStudied: 0, reviewsCompleted: 0 };
    }

    console.log(`[DailyStats] Retrieved stats for ${studyDate}:`, {
      newCardsStudied: data.new_cards_studied,
      reviewsCompleted: data.reviews_completed,
    });

    return {
      newCardsStudied: data.new_cards_studied,
      reviewsCompleted: data.reviews_completed,
    };
  } catch (error) {
    console.error(`[DailyStats] Failed to fetch daily study stats:`, error);
    return { newCardsStudied: 0, reviewsCompleted: 0 };
  }
}

/**
 * Update daily study stats for today
 * Uses UPSERT to create or update the record for today
 */
export async function updateDailyStudyStats(
  userId: string,
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
    const updateData: Partial<DailyStudyStats> = {
      user_id: userId,
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
        onConflict: "user_id,study_date",
        ignoreDuplicates: false,
      });

    if (error) {
      const isErrorMeaningful = hasMeaningfulError(error);
      console.log("[DailyStats] Error check:", {
        hasError: !!error,
        isErrorMeaningful,
        errorKeys: Object.keys(error || {}),
        error: error,
      });

      if (isErrorMeaningful) {
        logSupabaseError("Error updating daily study stats", error);
      } else {
        console.log("[DailyStats] Skipping empty/meaningless error log");
      }
    }
  } catch (error) {
    logError("Failed to update daily study stats", error);
  }
}

/**
 * Increment daily study counters
 * Efficiently increments counters without overwriting other fields
 */
export async function incrementDailyStudyCounters(
  userId: string,
  incrementNewCards: number = 0,
  incrementReviews: number = 0
): Promise<void> {
  const supabase = createClient();
  const studyDate = getTodayDateString();

  try {
    // First, get current values or create a new record
    // Fixed: Removed explicit user_id filter, let RLS handle it
    const { data: currentStats } = await supabase
      .from("daily_study_stats")
      .select("new_cards_studied, reviews_completed")
      .eq("study_date", studyDate)
      .single();

    const currentNewCards = currentStats?.new_cards_studied || 0;
    const currentReviews = currentStats?.reviews_completed || 0;

    // Update with new totals
    await updateDailyStudyStats(
      userId,
      currentNewCards + incrementNewCards,
      currentReviews + incrementReviews
    );
  } catch (error) {
    console.error("Failed to increment daily study counters:", error);
  }
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
 */
export async function resetDailyStudyStats(
  userId: string,
  date?: string
): Promise<void> {
  const supabase = createClient();
  const studyDate = date || getTodayDateString();

  try {
    const { error } = await supabase.from("daily_study_stats").upsert(
      {
        user_id: userId,
        study_date: studyDate,
        new_cards_studied: 0,
        reviews_completed: 0,
        time_spent_seconds: 0,
        cards_learned: 0,
        cards_lapsed: 0,
      },
      {
        onConflict: "user_id,study_date",
        ignoreDuplicates: false,
      }
    );

    if (error) {
      console.error("Error resetting daily study stats:", error);
    }
  } catch (error) {
    console.error("Failed to reset daily study stats:", error);
  }
}
