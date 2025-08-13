/**
 * Utility to fix SRS cards that might be stuck with future due times
 * This can happen if there were timezone issues or other date/time problems
 */

import { createClient } from "@/lib/supabase/server";

export async function fixStuckSRSCards(userId: string, projectId: string) {
  const supabase = await createClient();

  try {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

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

    if (!srsStates || srsStates.length === 0) {
      console.log("No SRS states found for this project.");
      return;
    }

    console.log(`Found ${srsStates.length} SRS states to analyze...`);

    // Find cards that might be stuck
    const stuckCards = srsStates.filter((state: any) => {
      // Cards in learning state that are due more than 1 day in the future
      if (state.state === "learning" || state.state === "relearning") {
        const dueTime = new Date(state.due).getTime();
        return dueTime > now + 24 * 60 * 60 * 1000; // More than 1 day in future
      }

      // Cards in review state that are due more than 7 days in the future
      if (state.state === "review") {
        const dueTime = new Date(state.due).getTime();
        return dueTime > now + 7 * 24 * 60 * 60 * 1000; // More than 7 days in future
      }

      return false;
    });

    if (stuckCards.length === 0) {
      console.log("No stuck cards found. Checking for cards due now...");

      // Check for cards that should be due now
      const dueNow = srsStates.filter((state: any) => {
        const dueTime = new Date(state.due).getTime();
        return dueTime <= now && !state.is_suspended;
      });

      console.log(`Cards due now: ${dueNow.length}`);
      dueNow.forEach((state: any) => {
        const minutesOverdue = Math.round(
          (now - new Date(state.due).getTime()) / (60 * 1000)
        );
        console.log(
          `  - Card ${state.card_id.slice(0, 8)}: ${
            state.state
          }, overdue by ${minutesOverdue} minutes`
        );
      });

      return;
    }

    console.log(`Found ${stuckCards.length} potentially stuck cards:`);

    stuckCards.forEach((state: any) => {
      const dueTime = new Date(state.due).getTime();
      const hoursInFuture = Math.round((dueTime - now) / (60 * 60 * 1000));
      console.log(
        `  - Card ${state.card_id.slice(0, 8)}: ${
          state.state
        }, due in ${hoursInFuture} hours`
      );
    });

    // Option to fix stuck learning cards by making them due now
    const stuckLearningCards = stuckCards.filter(
      (state: any) => state.state === "learning" || state.state === "relearning"
    );

    if (stuckLearningCards.length > 0) {
      console.log(
        `\nFixing ${stuckLearningCards.length} stuck learning cards by making them due now...`
      );

      for (const state of stuckLearningCards) {
        const { error: updateError } = await supabase
          .from("srs_states")
          .update({
            due: new Date(now).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
          .eq("project_id", projectId)
          .eq("card_id", state.card_id);

        if (updateError) {
          console.error(`Failed to update card ${state.card_id}:`, updateError);
        } else {
          console.log(
            `Fixed card ${state.card_id.slice(0, 8)} - now due immediately`
          );
        }
      }
    }

    // Option to fix stuck review cards by making them due yesterday (so they appear overdue)
    const stuckReviewCards = stuckCards.filter(
      (state: any) => state.state === "review"
    );

    if (stuckReviewCards.length > 0) {
      console.log(
        `\nFixing ${stuckReviewCards.length} stuck review cards by making them due yesterday...`
      );

      for (const state of stuckReviewCards) {
        const { error: updateError } = await supabase
          .from("srs_states")
          .update({
            due: new Date(oneDayAgo).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
          .eq("project_id", projectId)
          .eq("card_id", state.card_id);

        if (updateError) {
          console.error(`Failed to update card ${state.card_id}:`, updateError);
        } else {
          console.log(
            `Fixed card ${state.card_id.slice(0, 8)} - now due (overdue)`
          );
        }
      }
    }

    console.log("\nCard fixing complete! Try refreshing your study session.");
  } catch (error) {
    console.error("Error in fixStuckSRSCards:", error);
  }
}

// Function to create some cards due now for testing
export async function createDueCardsForTesting(
  userId: string,
  projectId: string,
  count: number = 5
) {
  const supabase = await createClient();

  try {
    const now = Date.now();

    // Get some existing cards to make due
    const { data: srsStates, error: srsError } = await supabase
      .from("srs_states")
      .select("*")
      .eq("user_id", userId)
      .eq("project_id", projectId)
      .limit(count);

    if (srsError || !srsStates || srsStates.length === 0) {
      console.log("No SRS states found to modify.");
      return;
    }

    console.log(
      `Making ${Math.min(count, srsStates.length)} cards due now for testing...`
    );

    for (let i = 0; i < Math.min(count, srsStates.length); i++) {
      const state = srsStates[i];

      const { error: updateError } = await supabase
        .from("srs_states")
        .update({
          due: new Date(now - i * 60 * 1000).toISOString(), // Stagger them by 1 minute each
          state: state.state === "new" ? "learning" : state.state, // Move new cards to learning
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("project_id", projectId)
        .eq("card_id", state.card_id);

      if (updateError) {
        console.error(`Failed to update card ${state.card_id}:`, updateError);
      } else {
        console.log(
          `Made card ${state.card_id.slice(0, 8)} due now (${state.state})`
        );
      }
    }

    console.log("Testing cards created! Try refreshing your study session.");
  } catch (error) {
    console.error("Error in createDueCardsForTesting:", error);
  }
}
