/**
 * Debug utility to analyze SRS card states and understand why no new cards are available
 */

import { createClient } from "@/lib/supabase/server";

export async function debugSRSCardStates(userId: string, projectId: string) {
  const supabase = await createClient();

  try {
    // Get all SRS states for this project
    const { data: srsStates, error: srsError } = await supabase
      .from("srs_states")
      .select("*")
      .eq("user_id", userId)
      .eq("project_id", projectId);

    if (srsError) {
      console.error("Error fetching SRS states:", srsError);
      return;
    }

    // Get all flashcards for this project
    const { data: flashcards, error: flashcardsError } = await supabase
      .from("flashcards")
      .select("*")
      .eq("project_id", projectId);

    if (flashcardsError) {
      console.error("Error fetching flashcards:", flashcardsError);
      return;
    }

    // Get today's daily study stats
    const today = new Date().toISOString().split("T")[0];
    const { data: dailyStats, error: dailyError } = await supabase
      .from("daily_study_stats")
      .select("*")
      .eq("user_id", userId)
      .eq("study_date", today);

    if (dailyError && dailyError.code !== "PGRST116") {
      console.error("Error fetching daily stats:", dailyError);
      return;
    }

    console.log("=== SRS DEBUG ANALYSIS ===");
    console.log(`Total flashcards: ${flashcards?.length || 0}`);
    console.log(`Total SRS states: ${srsStates?.length || 0}`);

    if (srsStates) {
      // Analyze SRS states by type
      const statesByType = srsStates.reduce(
        (acc: Record<string, number>, state: any) => {
          const stateType = state.state;
          acc[stateType] = (acc[stateType] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      console.log("\n=== CARD STATES BREAKDOWN ===");
      Object.entries(statesByType).forEach(([state, count]) => {
        console.log(`${state}: ${count} cards`);
      });

      // Check for cards without SRS states (these would be "new")
      const flashcardIds = new Set(flashcards?.map((f: any) => f.id) || []);
      const srsCardIds = new Set(srsStates.map((s: any) => s.flashcard_id));
      const cardsWithoutSRS = Array.from(flashcardIds).filter(
        (id) => !srsCardIds.has(id)
      );

      console.log(`\n=== CARDS WITHOUT SRS STATES (TRUE NEW CARDS) ===`);
      console.log(`Cards without SRS states: ${cardsWithoutSRS.length}`);

      if (cardsWithoutSRS.length > 0) {
        console.log(
          "These card IDs have no SRS state:",
          cardsWithoutSRS.slice(0, 5)
        );
      }

      // Check for suspended cards
      const suspendedCards = srsStates.filter(
        (s: any) => s.is_suspended
      ).length;
      console.log(`Suspended cards: ${suspendedCards}`);

      // Check due times for learning and review cards
      const now = Date.now();
      const learningCards = srsStates.filter(
        (s: any) => s.state === "learning" || s.state === "relearning"
      );
      const reviewCards = srsStates.filter((s: any) => s.state === "review");

      console.log(`\n=== LEARNING CARDS ANALYSIS ===`);
      console.log(`Total learning cards: ${learningCards.length}`);

      const dueLearningCards = learningCards.filter((s: any) => s.due <= now);
      const futureLearningCards = learningCards.filter((s: any) => s.due > now);

      console.log(`Learning cards due now: ${dueLearningCards.length}`);
      console.log(`Learning cards due later: ${futureLearningCards.length}`);

      if (futureLearningCards.length > 0) {
        const nextDue = Math.min(...futureLearningCards.map((s: any) => s.due));
        const minutesUntilNext = Math.round((nextDue - now) / (60 * 1000));
        console.log(`Next learning card due in: ${minutesUntilNext} minutes`);
      }

      console.log(`\n=== REVIEW CARDS ANALYSIS ===`);
      console.log(`Total review cards: ${reviewCards.length}`);

      const dueReviewCards = reviewCards.filter((s: any) => s.due <= now);
      const futureReviewCards = reviewCards.filter((s: any) => s.due > now);

      console.log(`Review cards due now: ${dueReviewCards.length}`);
      console.log(`Review cards due later: ${futureReviewCards.length}`);
    }

    console.log(`\n=== DAILY STUDY STATS ===`);
    if (dailyStats && dailyStats.length > 0) {
      const stats = dailyStats[0];
      console.log(`New cards studied today: ${stats.new_cards_studied}`);
      console.log(`Reviews completed today: ${stats.reviews_completed}`);
      console.log(`Study date: ${stats.study_date}`);
    } else {
      console.log(`No daily study stats found for today (${today})`);
    }

    // Simulate what getSessionAwareStudyStats would return
    console.log(`\n=== SIMULATED STUDY STATS ===`);

    const NEW_CARDS_PER_DAY = 20;
    const MAX_REVIEWS_PER_DAY = 200;

    const newCardsStudiedToday = dailyStats?.[0]?.new_cards_studied || 0;
    const reviewsCompletedToday = dailyStats?.[0]?.reviews_completed || 0;

    const flashcardIds = new Set(flashcards?.map((f: any) => f.id) || []);
    const srsCardIds = new Set(
      srsStates?.map((s: any) => s.flashcard_id) || []
    );
    const trueNewCards = Array.from(flashcardIds).filter(
      (id) => !srsCardIds.has(id)
    ).length;

    const remainingNewCardSlots = Math.max(
      0,
      NEW_CARDS_PER_DAY - newCardsStudiedToday
    );
    const availableNewCards = Math.min(trueNewCards, remainingNewCardSlots);

    console.log(`True new cards (no SRS state): ${trueNewCards}`);
    console.log(`Remaining new card slots today: ${remainingNewCardSlots}`);
    console.log(`Available new cards: ${availableNewCards}`);

    const now = Date.now();
    const dueLearningCards =
      srsStates?.filter(
        (s: any) =>
          (s.state === "learning" || s.state === "relearning") &&
          !s.is_suspended &&
          s.due <= now
      ).length || 0;

    const dueReviewCards =
      srsStates?.filter(
        (s: any) => s.state === "review" && !s.is_suspended && s.due <= now
      ).length || 0;

    console.log(`Due learning cards: ${dueLearningCards}`);
    console.log(`Due review cards: ${dueReviewCards}`);
    console.log(`Total due cards: ${dueLearningCards + dueReviewCards}`);

    const hasCardsToStudy =
      availableNewCards > 0 || dueLearningCards > 0 || dueReviewCards > 0;
    console.log(`Cards available for study: ${hasCardsToStudy}`);
  } catch (error) {
    console.error("Error in debugSRSCardStates:", error);
  }
}
