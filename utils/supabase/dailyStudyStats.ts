/**
 * Database utilities for daily study statistics
 * Replaces localStorage-based daily limit tracking with proper database persistence
 */

import { createClient } from "@/utils/supabase/client";

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
 * Fixed: Removed explicit user_id filter since RLS policies handle user filtering
 */
export async function getDailyStudyStats(
  userId: string,
  date?: string
): Promise<{ newCardsStudied: number; reviewsCompleted: number }> {
  const supabase = createClient();
  const studyDate = date || getTodayDateString();

  try {
    // Fixed: Let RLS policies handle user filtering automatically
    // The user_id filter was causing HTTP 406 errors because RLS expects auth.uid()
    const { data, error } = await supabase
      .from("daily_study_stats")
      .select("new_cards_studied, reviews_completed")
      .eq("study_date", studyDate)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("Error fetching daily study stats:", error);
      return { newCardsStudied: 0, reviewsCompleted: 0 };
    }

    if (!data) {
      // No record exists for this date, return default values
      return { newCardsStudied: 0, reviewsCompleted: 0 };
    }

    return {
      newCardsStudied: data.new_cards_studied,
      reviewsCompleted: data.reviews_completed,
    };
  } catch (error) {
    console.error("Failed to fetch daily study stats:", error);
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
      console.error("Error updating daily study stats:", error);
    }
  } catch (error) {
    console.error("Failed to update daily study stats:", error);
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

    if (error) {
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
