"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Debug action to analyze why no cards are available for study
 */
export async function debugStudyAvailability(projectId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Not authenticated");
  }

  try {
    const now = Date.now();
    const today = new Date().toISOString().split("T")[0];

    // Get all flashcards
    const { data: flashcards, error: flashcardsError } = await supabase
      .from("flashcards")
      .select("*")
      .eq("project_id", projectId);

    if (flashcardsError) {
      throw flashcardsError;
    }

    // Get all SRS states
    const { data: srsStates, error: srsError } = await supabase
      .from("srs_states")
      .select("*")
      .eq("user_id", user.id)
      .eq("project_id", projectId);

    if (srsError) {
      throw srsError;
    }

    // Get today's daily study stats
    const { data: dailyStats, error: dailyError } = await supabase
      .from("daily_study_stats")
      .select("*")
      .eq("user_id", user.id)
      .eq("study_date", today)
      .single();

    if (dailyError && dailyError.code !== "PGRST116") {
      throw dailyError;
    }

    // Analysis
    const totalFlashcards = flashcards?.length || 0;
    const totalSRSStates = srsStates?.length || 0;

    // Cards without SRS states (truly new cards that haven't been introduced yet)
    const flashcardIds = new Set(
      flashcards?.map((f: { id: string }) => f.id) || []
    );
    const srsCardIds = new Set(
      srsStates?.map((s: { flashcard_id: string }) => s.flashcard_id) || []
    );
    const cardsWithoutSRS = Array.from(flashcardIds).filter(
      (id) => !srsCardIds.has(id)
    );

    // Cards in "new" state (cards that have been introduced but not yet studied)
    const newStateCards =
      srsStates?.filter(
        (s: { state: string; is_suspended: boolean }) =>
          s.state === "new" && !s.is_suspended
      ) || [];

    // Total new cards = cards without SRS state + cards in "new" state
    const totalNewCards = cardsWithoutSRS.length + newStateCards.length;

    // Daily study progress
    const newCardsStudiedToday = dailyStats?.new_cards_studied || 0;
    const reviewsCompletedToday = dailyStats?.reviews_completed || 0;

    // Settings (using defaults)
    const NEW_CARDS_PER_DAY = 20;
    // Remove unused variable
    // const MAX_REVIEWS_PER_DAY = 200;

    // Available slots
    const remainingNewCardSlots = Math.max(
      0,
      NEW_CARDS_PER_DAY - newCardsStudiedToday
    );
    const availableNewCards = Math.min(totalNewCards, remainingNewCardSlots);

    // Due cards analysis
    const dueLearningCards =
      srsStates?.filter(
        (s: { state: string; is_suspended: boolean; due: string }) =>
          (s.state === "learning" || s.state === "relearning") &&
          !s.is_suspended &&
          new Date(s.due).getTime() <= now
      ) || [];

    const dueReviewCards =
      srsStates?.filter(
        (s: { state: string; is_suspended: boolean; due: string }) =>
          s.state === "review" &&
          !s.is_suspended &&
          new Date(s.due).getTime() <= now
      ) || [];

    // Future cards
    const futureLearningCards =
      srsStates?.filter(
        (s: { state: string; is_suspended: boolean; due: string }) =>
          (s.state === "learning" || s.state === "relearning") &&
          !s.is_suspended &&
          new Date(s.due).getTime() > now
      ) || [];

    const futureReviewCards =
      srsStates?.filter(
        (s: { state: string; is_suspended: boolean; due: string }) =>
          s.state === "review" &&
          !s.is_suspended &&
          new Date(s.due).getTime() > now
      ) || [];

    // State breakdown
    const stateBreakdown =
      srsStates?.reduce(
        (acc: Record<string, number>, state: { state: string }) => {
          acc[state.state] = (acc[state.state] || 0) + 1;
          return acc;
        },
        {}
      ) || {};

    const result = {
      summary: {
        totalFlashcards,
        totalSRSStates,
        cardsWithoutSRS: cardsWithoutSRS.length,
        cardsInNewState: newStateCards.length,
        totalNewCards,
        availableNewCards,
        dueLearningCards: dueLearningCards.length,
        dueReviewCards: dueReviewCards.length,
        futureLearningCards: futureLearningCards.length,
        futureReviewCards: futureReviewCards.length,
        hasCardsToStudy:
          availableNewCards > 0 ||
          dueLearningCards.length > 0 ||
          dueReviewCards.length > 0,
      },
      dailyProgress: {
        newCardsStudiedToday,
        reviewsCompletedToday,
        remainingNewCardSlots,
        date: today,
      },
      stateBreakdown,
      nextDueTimes: {
        nextLearningCard:
          futureLearningCards.length > 0
            ? Math.min(
                ...futureLearningCards.map((s: { due: string }) =>
                  new Date(s.due).getTime()
                )
              )
            : null,
        nextReviewCard:
          futureReviewCards.length > 0
            ? Math.min(
                ...futureReviewCards.map((s: { due: string }) =>
                  new Date(s.due).getTime()
                )
              )
            : null,
      },
    };

    return result;
  } catch (error) {
    console.error("Error in debugStudyAvailability:", error);
    throw error;
  }
}

/**
 * Fix stuck SRS cards by making learning cards due now
 */
export async function fixStuckCards(projectId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Not authenticated");
  }

  try {
    const now = Date.now();
    const oneDayFromNow = now + 24 * 60 * 60 * 1000;

    // Find learning cards that are due more than 1 day in the future
    const { data: stuckCards, error: stuckError } = await supabase
      .from("srs_states")
      .select("*")
      .eq("user_id", user.id)
      .eq("project_id", projectId)
      .in("state", ["learning", "relearning"])
      .gt("due", new Date(oneDayFromNow).toISOString());

    if (stuckError) {
      throw stuckError;
    }

    if (!stuckCards || stuckCards.length === 0) {
      return { message: "No stuck cards found", fixed: 0 };
    }

    // Update stuck cards to be due now
    const { error: updateError } = await supabase
      .from("srs_states")
      .update({
        due: new Date(now).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("project_id", projectId)
      .in(
        "card_id",
        stuckCards.map((card) => card.card_id)
      );

    if (updateError) {
      throw updateError;
    }

    return {
      message: `Fixed ${stuckCards.length} stuck cards`,
      fixed: stuckCards.length,
    };
  } catch (error) {
    console.error("Error in fixStuckCards:", error);
    throw error;
  }
}

/**
 * Create some cards due now for testing purposes
 */
export async function createDueCards(projectId: string, count: number = 5) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Not authenticated");
  }

  try {
    const now = Date.now();

    // Get some existing cards to make due
    const { data: srsStates, error: srsError } = await supabase
      .from("srs_states")
      .select("*")
      .eq("user_id", user.id)
      .eq("project_id", projectId)
      .limit(count);

    if (srsError) {
      throw srsError;
    }

    if (!srsStates || srsStates.length === 0) {
      return { message: "No SRS states found to modify", created: 0 };
    }

    const cardsToUpdate = srsStates.slice(0, count);

    // Update cards to be due now
    const { error: updateError } = await supabase
      .from("srs_states")
      .update({
        due: new Date(now).toISOString(),
        state: "learning", // Ensure they're in a studyable state
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("project_id", projectId)
      .in(
        "card_id",
        cardsToUpdate.map((card) => card.card_id)
      );

    if (updateError) {
      throw updateError;
    }

    return {
      message: `Created ${cardsToUpdate.length} cards due for study`,
      created: cardsToUpdate.length,
    };
  } catch (error) {
    console.error("Error in createDueCards:", error);
    throw error;
  }
}
