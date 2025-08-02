// Comprehensive test for Anki-compatible SM-2 algorithm
// This test verifies that our implementation matches Anki's exact behavior

import {
  scheduleSRSCardWithSettings,
  SRSRating,
  SRSCardState,
  DEFAULT_SRS_SETTINGS,
} from "./SRSScheduler";

interface TestCase {
  name: string;
  startingCard: Partial<SRSCardState>;
  rating: SRSRating;
  expectedEase: number;
  expectedInterval: number;
  expectedState: string;
}

export function runAnkiAlgorithmTests(): boolean {
  console.log("=== ANKI ALGORITHM COMPATIBILITY TESTS ===");
  
  let allTestsPassed = true;
  
  // Test cases based on Anki's actual behavior
  const testCases: TestCase[] = [
    // Review card tests - these are the critical ones for SM-2 algorithm
    {
      name: "Review Card - Again (lapse)",
      startingCard: { state: "review", ease: 2.50, interval: 10, lapses: 0 },
      rating: 0, // Again
      expectedEase: 2.30, // 2.50 - 0.20
      expectedInterval: 10, // Goes to relearning steps, not interval-based
      expectedState: "relearning"
    },
    {
      name: "Review Card - Hard", 
      startingCard: { state: "review", ease: 2.50, interval: 10, lapses: 0 },
      rating: 1, // Hard
      expectedEase: 2.35, // 2.50 - 0.15
      expectedInterval: 12, // 10 * 1.2 (NO ease multiplication)
      expectedState: "review"
    },
    {
      name: "Review Card - Good",
      startingCard: { state: "review", ease: 2.50, interval: 10, lapses: 0 },
      rating: 2, // Good  
      expectedEase: 2.50, // No change
      expectedInterval: 25, // 10 * 2.50
      expectedState: "review"
    },
    {
      name: "Review Card - Easy",
      startingCard: { state: "review", ease: 2.50, interval: 10, lapses: 0 },
      rating: 3, // Easy
      expectedEase: 2.65, // 2.50 + 0.15
      expectedInterval: 34, // 10 * 2.65 * 1.3 = ~34
      expectedState: "review"
    },
    
    // Minimum ease test
    {
      name: "Review Card - Again at minimum ease",
      startingCard: { state: "review", ease: 1.30, interval: 5, lapses: 0 },
      rating: 0, // Again
      expectedEase: 1.30, // Should not go below minimum
      expectedInterval: 10, // Goes to relearning
      expectedState: "relearning"
    },
    
    // Learning card tests
    {
      name: "New Card - Good (enter learning)",
      startingCard: { state: "new", ease: 2.50, interval: 0, learningStep: 0 },
      rating: 2, // Good
      expectedEase: 2.50, // No change in learning
      expectedInterval: 1, // First learning step
      expectedState: "learning"
    },
    
    {
      name: "New Card - Easy (graduate immediately)",
      startingCard: { state: "new", ease: 2.50, interval: 0, learningStep: 0 },
      rating: 3, // Easy
      expectedEase: 2.50, // No change until graduation
      expectedInterval: 4, // EASY_INTERVAL (4 days)
      expectedState: "review"
    }
  ];

  for (const testCase of testCases) {
    const passed = runSingleTest(testCase);
    if (!passed) {
      allTestsPassed = false;
    }
  }
  
  if (allTestsPassed) {
    console.log("\n✅ ALL TESTS PASSED - Algorithm is Anki-compatible!");
  } else {
    console.log("\n❌ SOME TESTS FAILED - Algorithm needs fixes");
  }
  
  return allTestsPassed;
}

function runSingleTest(testCase: TestCase): boolean {
  console.log(`\n--- Testing: ${testCase.name} ---`);
  
  // Create test card with specified starting state
  const startingCard: SRSCardState = {
    id: "test-card",
    state: (testCase.startingCard.state as SRSCardState["state"]) || "new",
    interval: testCase.startingCard.interval || 0,
    ease: testCase.startingCard.ease || DEFAULT_SRS_SETTINGS.STARTING_EASE,
    due: Date.now(),
    lastReviewed: 0,
    repetitions: testCase.startingCard.repetitions || 0,
    lapses: testCase.startingCard.lapses || 0,
    learningStep: testCase.startingCard.learningStep || 0,
    isLeech: false,
    isSuspended: false,
  };
  
  console.log("Starting state:", {
    state: startingCard.state,
    ease: startingCard.ease,
    interval: startingCard.interval,
    learningStep: startingCard.learningStep
  });
  
  // Apply rating
  const resultCard = scheduleSRSCardWithSettings(
    startingCard,
    testCase.rating,
    DEFAULT_SRS_SETTINGS
  );
  
  console.log("Result state:", {
    state: resultCard.state,
    ease: resultCard.ease,
    interval: resultCard.interval,
    learningStep: resultCard.learningStep
  });
  
  console.log("Expected:", {
    state: testCase.expectedState,
    ease: testCase.expectedEase,
    interval: testCase.expectedInterval
  });
  
  // Check results
  const easeMatch = Math.abs(resultCard.ease - testCase.expectedEase) < 0.01;
  const stateMatch = resultCard.state === testCase.expectedState;
  
  // For learning/relearning cards, interval is in minutes, for review cards it's in days
  const intervalMatch = resultCard.state === "learning" || resultCard.state === "relearning" 
    ? Math.abs(resultCard.interval - testCase.expectedInterval) < 1 // Allow 1 minute tolerance
    : Math.abs(resultCard.interval - testCase.expectedInterval) < 1; // Allow 1 day tolerance
  
  const passed = easeMatch && stateMatch && intervalMatch;
  
  if (passed) {
    console.log("✅ PASS");
  } else {
    console.log("❌ FAIL");
    if (!easeMatch) console.log(`  Ease mismatch: got ${resultCard.ease}, expected ${testCase.expectedEase}`);
    if (!stateMatch) console.log(`  State mismatch: got ${resultCard.state}, expected ${testCase.expectedState}`);
    if (!intervalMatch) console.log(`  Interval mismatch: got ${resultCard.interval}, expected ${testCase.expectedInterval}`);
  }
  
  return passed;
}

// Function to run a specific scenario for debugging
export function testSpecificScenario() {
  console.log("=== TESTING SPECIFIC SCENARIO ===");
  
  // Create a review card with ease 2.50, interval 10 days
  const reviewCard: SRSCardState = {
    id: "test",
    state: "review",
    interval: 10,
    ease: 2.50,
    due: Date.now(),
    lastReviewed: Date.now() - 24 * 60 * 60 * 1000, // Yesterday
    repetitions: 1,
    lapses: 0,
    learningStep: 0,
    isLeech: false,
    isSuspended: false,
  };
  
  console.log("Testing all ratings on review card:");
  console.log("Starting:", { ease: reviewCard.ease, interval: reviewCard.interval });
  
  // Test all ratings
  const ratings: { name: string, rating: SRSRating }[] = [
    { name: "Again", rating: 0 },
    { name: "Hard", rating: 1 },
    { name: "Good", rating: 2 },
    { name: "Easy", rating: 3 },
  ];
  
  for (const { name, rating } of ratings) {
    const result = scheduleSRSCardWithSettings(reviewCard, rating, DEFAULT_SRS_SETTINGS);
    console.log(`${name} (${rating}):`, {
      state: result.state,
      ease: result.ease,
      interval: result.interval,
      lapses: result.lapses
    });
  }
}

// Uncomment to run tests immediately
// runAnkiAlgorithmTests();
// testSpecificScenario();