// Test file to verify SRS behavior
import { initSRSState, scheduleSRSCard, SRSRating } from "./SRSScheduler";

export function testSRSBehavior() {
  console.log("=== Testing SRS Card Transitions ===");
  
  // Test new card behavior
  const newCard = initSRSState(["test-card"])["test-card"];
  console.log("Initial new card:", newCard);

  // Test "Good" on new card - should graduate directly to review
  const afterGood = scheduleSRSCard(newCard, 2 as SRSRating); // Good
  console.log("After 'Good' on new card:", afterGood);
  console.log("Should be: state='review', interval=1 day");

  // Test "Again" on new card - should go to learning
  const afterAgain = scheduleSRSCard(newCard, 0 as SRSRating); // Again
  console.log("After 'Again' on new card:", afterAgain);
  console.log("Should be: state='learning', learningStep=0");

  // Test "Easy" on new card - should graduate to review with 4 days
  const afterEasy = scheduleSRSCard(newCard, 3 as SRSRating); // Easy
  console.log("After 'Easy' on new card:", afterEasy);
  console.log("Should be: state='review', interval=4 days");

  console.log("=== Test Complete ===");
}

// Uncomment to run test
// testSRSBehavior();
