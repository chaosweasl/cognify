// Test file to verify Anki-like SRS behavior
import {
  initSRSState,
  scheduleSRSCard,
  SRSRating,
  SRS_SETTINGS,
} from "./SRSScheduler";

export function testAnkiLikeBehavior() {
  console.log("=== Testing Anki-like SRS Card Transitions ===");
  console.log("Learning steps:", SRS_SETTINGS.LEARNING_STEPS);

  // Test new card behavior
  const newCard = initSRSState(["test-card"])["test-card"];
  console.log("\n1. Initial new card:", {
    state: newCard.state,
    learningStep: newCard.learningStep,
    ease: newCard.ease,
  });

  // Test "Good" on new card - should advance to step 2 of learning
  const afterGood = scheduleSRSCard(newCard, 2 as SRSRating); // Good
  console.log("\n2. After 'Good' on new card:", {
    state: afterGood.state,
    learningStep: afterGood.learningStep,
    interval: afterGood.interval,
  });
  console.log("Expected: state='learning', learningStep=1, interval=10min");

  // Test "Good" again on learning card - should graduate
  const afterSecondGood = scheduleSRSCard(afterGood, 2 as SRSRating);
  console.log("\n3. After second 'Good' on learning card:", {
    state: afterSecondGood.state,
    interval: afterSecondGood.interval,
    repetitions: afterSecondGood.repetitions,
  });
  console.log("Expected: state='review', interval=1440min (1 day)");

  // Test "Again" on new card - should go to learning step 0
  const afterAgain = scheduleSRSCard(newCard, 0 as SRSRating); // Again
  console.log("\n4. After 'Again' on new card:", {
    state: afterAgain.state,
    learningStep: afterAgain.learningStep,
    interval: afterAgain.interval,
  });
  console.log("Expected: state='learning', learningStep=0, interval=1min");

  // Test "Easy" on new card - should graduate immediately with 4 days
  const afterEasy = scheduleSRSCard(newCard, 3 as SRSRating); // Easy
  console.log("\n5. After 'Easy' on new card:", {
    state: afterEasy.state,
    interval: afterEasy.interval,
    repetitions: afterEasy.repetitions,
  });
  console.log("Expected: state='review', interval=4 days");

  // Test review card behavior
  const reviewCard = {
    ...newCard,
    state: "review" as const,
    interval: 3,
    ease: 2.5,
    repetitions: 1,
  };

  const reviewAfterGood = scheduleSRSCard(reviewCard, 2 as SRSRating);
  console.log("\n6. Review card after 'Good':", {
    state: reviewAfterGood.state,
    interval: reviewAfterGood.interval,
    ease: reviewAfterGood.ease,
  });
  console.log("Expected: interval = 3 * 2.5 = ~7-8 days");

  const reviewAfterAgain = scheduleSRSCard(reviewCard, 0 as SRSRating);
  console.log("\n7. Review card after 'Again' (lapse):", {
    state: reviewAfterAgain.state,
    lapses: reviewAfterAgain.lapses,
    interval: reviewAfterAgain.interval,
  });
  console.log("Expected: state='relearning', lapses=1, interval=10min");

  console.log("\n=== Anki-like Test Complete ===");
}

// Uncomment to run test in console
// testAnkiLikeBehavior();
