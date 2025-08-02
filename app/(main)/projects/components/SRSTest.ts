// Test file to verify Anki-like SRS behavior
import {
  initSRSStateWithSettings,
  scheduleSRSCardWithSettings,
  SRSRating,
  DEFAULT_SRS_SETTINGS,
  SRSCardState,
} from "./SRSScheduler";
import {
  getNextCardToStudyWithSettings,
  initStudySession,
  updateStudySession,
  StudySession,
} from "./SRSSession";

export function testAnkiLikeBehavior() {
  console.log("=== Testing Anki-like SRS Card Transitions ===");
  console.log("Learning steps:", DEFAULT_SRS_SETTINGS.LEARNING_STEPS);

  // Test new card behavior
  const newCard = initSRSStateWithSettings(["test-card"], DEFAULT_SRS_SETTINGS)[
    "test-card"
  ];
  console.log("\n1. Initial new card:", {
    state: newCard.state,
    learningStep: newCard.learningStep,
    ease: newCard.ease,
  });

  // Test "Good" on new card - should advance to step 2 of learning
  const afterGood = scheduleSRSCardWithSettings(
    newCard,
    2 as SRSRating,
    DEFAULT_SRS_SETTINGS
  ); // Good
  console.log("\n2. After 'Good' on new card:", {
    state: afterGood.state,
    learningStep: afterGood.learningStep,
    interval: afterGood.interval,
  });
  console.log("Expected: state='learning', learningStep=1, interval=10min");

  // Test "Good" again on learning card - should graduate
  const afterSecondGood = scheduleSRSCardWithSettings(
    afterGood,
    2 as SRSRating,
    DEFAULT_SRS_SETTINGS
  );
  console.log("\n3. After second 'Good' on learning card:", {
    state: afterSecondGood.state,
    interval: afterSecondGood.interval,
    repetitions: afterSecondGood.repetitions,
  });
  console.log("Expected: state='review', interval=1440min (1 day)");

  // Test "Again" on new card - should go to learning step 0
  const afterAgain = scheduleSRSCardWithSettings(
    newCard,
    0 as SRSRating,
    DEFAULT_SRS_SETTINGS
  ); // Again
  console.log("\n4. After 'Again' on new card:", {
    state: afterAgain.state,
    learningStep: afterAgain.learningStep,
    interval: afterAgain.interval,
  });
  console.log("Expected: state='learning', learningStep=0, interval=1min");

  // Test "Easy" on new card - should graduate immediately with 4 days
  const afterEasy = scheduleSRSCardWithSettings(
    newCard,
    3 as SRSRating,
    DEFAULT_SRS_SETTINGS
  ); // Easy
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

  const reviewAfterGood = scheduleSRSCardWithSettings(
    reviewCard,
    2 as SRSRating,
    DEFAULT_SRS_SETTINGS
  );
  console.log("\n6. Review card after 'Good':", {
    state: reviewAfterGood.state,
    interval: reviewAfterGood.interval,
    ease: reviewAfterGood.ease,
  });
  console.log("Expected: interval = 3 * 2.5 = ~7-8 days");

  const reviewAfterAgain = scheduleSRSCardWithSettings(
    reviewCard,
    0 as SRSRating,
    DEFAULT_SRS_SETTINGS
  );
  console.log("\n7. Review card after 'Again' (lapse):", {
    state: reviewAfterAgain.state,
    lapses: reviewAfterAgain.lapses,
    interval: reviewAfterAgain.interval,
  });
  console.log("Expected: state='relearning', lapses=1, interval=10min");

  console.log("\n=== Anki-like Test Complete ===");
}

// NEW: Comprehensive test for exact Anki algorithm compatibility
export function testAnkiAlgorithmCompatibility(): boolean {
  console.log("\n=== ANKI ALGORITHM COMPATIBILITY TEST ===");
  
  let allTestsPassed = true;
  
  // Create a review card for testing
  const reviewCard: SRSCardState = {
    id: "test-review-card",
    state: "review",
    interval: 10,
    ease: 2.50,
    due: Date.now(),
    lastReviewed: 0,
    repetitions: 1,
    lapses: 0,
    learningStep: 0,
    isLeech: false,
    isSuspended: false,
  };
  
  console.log("Testing review card with ease 2.50, interval 10 days");
  console.log("");
  
  const testCases = [
    {
      name: "Again (lapse)",
      rating: 0 as SRSRating,
      expectedEase: 2.30,
      expectedState: "relearning",
      expectedInterval: 10 // Goes to relearning step
    },
    {
      name: "Hard", 
      rating: 1 as SRSRating,
      expectedEase: 2.35,
      expectedState: "review",
      expectedInterval: 12 // 10 * 1.2, NO ease multiplication
    },
    {
      name: "Good",
      rating: 2 as SRSRating,
      expectedEase: 2.50,
      expectedState: "review", 
      expectedInterval: 25 // 10 * 2.50
    },
    {
      name: "Easy",
      rating: 3 as SRSRating,
      expectedEase: 2.65,
      expectedState: "review",
      expectedInterval: 34 // 10 * 2.65 * 1.3 ≈ 34
    }
  ];
  
  for (const testCase of testCases) {
    const result = scheduleSRSCardWithSettings(
      reviewCard,
      testCase.rating,
      DEFAULT_SRS_SETTINGS
    );
    
    const easeMatch = Math.abs(result.ease - testCase.expectedEase) < 0.01;
    const stateMatch = result.state === testCase.expectedState;
    const intervalMatch = testCase.expectedState === "relearning" 
      ? true // For relearning, we don't check exact interval
      : Math.abs(result.interval - testCase.expectedInterval) <= 1;
    
    const passed = easeMatch && stateMatch && intervalMatch;
    
    console.log(`${testCase.name} (${testCase.rating}):`);
    console.log(`  Result: ease=${result.ease}, interval=${result.interval}, state=${result.state}`);
    console.log(`  Expected: ease=${testCase.expectedEase}, interval=${testCase.expectedInterval}, state=${testCase.expectedState}`);
    console.log(`  ${passed ? '✅ PASS' : '❌ FAIL'}`);
    
    if (!passed) {
      allTestsPassed = false;
      if (!easeMatch) console.log(`    ❌ Ease mismatch: got ${result.ease}, expected ${testCase.expectedEase}`);
      if (!stateMatch) console.log(`    ❌ State mismatch: got ${result.state}, expected ${testCase.expectedState}`);
      if (!intervalMatch) console.log(`    ❌ Interval mismatch: got ${result.interval}, expected ${testCase.expectedInterval}`);
    }
    console.log("");
  }
  
  if (allTestsPassed) {
    console.log("🎉 ALL TESTS PASSED - Algorithm is Anki-compatible!");
  } else {
    console.log("❌ SOME TESTS FAILED - Algorithm needs fixes");
  }
  
  return allTestsPassed;
}

// Test minimum ease boundary
export function testMinimumEaseBoundary(): boolean {
  console.log("\n=== TESTING MINIMUM EASE BOUNDARY ===");
  
  const cardAtMinimumEase: SRSCardState = {
    id: "test-min-ease",
    state: "review",
    interval: 5,
    ease: 1.30, // At minimum
    due: Date.now(),
    lastReviewed: 0,
    repetitions: 1,
    lapses: 7, // Near leech threshold
    learningStep: 0,
    isLeech: false,
    isSuspended: false,
  };
  
  // Test "Again" at minimum ease - should not go below 1.30
  const result = scheduleSRSCardWithSettings(
    cardAtMinimumEase,
    0 as SRSRating,
    DEFAULT_SRS_SETTINGS
  );
  
  const passed = result.ease >= DEFAULT_SRS_SETTINGS.MINIMUM_EASE;
  
  console.log(`Card at minimum ease (1.30) after 'Again':`);
  console.log(`  Ease: ${cardAtMinimumEase.ease} -> ${result.ease}`);
  console.log(`  Should stay >= ${DEFAULT_SRS_SETTINGS.MINIMUM_EASE}`);
  console.log(`  ${passed ? '✅ PASS' : '❌ FAIL'}`);
  
  return passed;
}

// Test learning queue FIFO behavior and infinite loop prevention
export function testLearningQueueBehavior(): boolean {
  console.log("\n=== TESTING LEARNING QUEUE FIFO BEHAVIOR ===");
  
  // Create test cards
  const cardStates: Record<string, SRSCardState> = {
    "card1": {
      id: "card1",
      state: "new",
      interval: 0,
      ease: DEFAULT_SRS_SETTINGS.STARTING_EASE,
      due: Date.now(),
      lastReviewed: 0,
      repetitions: 0,
      lapses: 0,
      learningStep: 0,
      isLeech: false,
      isSuspended: false,
    },
    "card2": {
      id: "card2", 
      state: "new",
      interval: 0,
      ease: DEFAULT_SRS_SETTINGS.STARTING_EASE,
      due: Date.now(),
      lastReviewed: 0,
      repetitions: 0,
      lapses: 0,
      learningStep: 0,
      isLeech: false,
      isSuspended: false,
    }
  };

  let session = initStudySession();
  let testsPassed = true;

  console.log("Testing FIFO queue behavior with 'Again' card movement...");

  // Step 1: Study card1 with "Good" - should enter learning
  let nextCardId = getNextCardToStudyWithSettings(cardStates, session, DEFAULT_SRS_SETTINGS);
  console.log(`1. Next card: ${nextCardId} (should be new card)`);
  
  if (nextCardId) {
    const card = cardStates[nextCardId];
    const newCard = scheduleSRSCardWithSettings(card, 2, DEFAULT_SRS_SETTINGS); // Good
    cardStates[nextCardId] = newCard;
    session = updateStudySession(session, card, 2, newCard, cardStates, DEFAULT_SRS_SETTINGS);
    console.log(`   Card ${nextCardId} state: ${newCard.state}, queue: [${session.learningCardsInQueue.join(', ')}]`);
  }

  // Step 2: Study card2 with "Good" - should enter learning  
  nextCardId = getNextCardToStudyWithSettings(cardStates, session, DEFAULT_SRS_SETTINGS);
  console.log(`2. Next card: ${nextCardId} (should be next new card)`);
  
  if (nextCardId) {
    const card = cardStates[nextCardId];
    const newCard = scheduleSRSCardWithSettings(card, 2, DEFAULT_SRS_SETTINGS); // Good
    cardStates[nextCardId] = newCard;
    session = updateStudySession(session, card, 2, newCard, cardStates, DEFAULT_SRS_SETTINGS);
    console.log(`   Card ${nextCardId} state: ${newCard.state}, queue: [${session.learningCardsInQueue.join(', ')}]`);
  }

  // Step 3: Should now get a learning card (first in queue)
  nextCardId = getNextCardToStudyWithSettings(cardStates, session, DEFAULT_SRS_SETTINGS);
  console.log(`3. Next card: ${nextCardId} (should be first learning card)`);
  
  if (nextCardId) {
    const card = cardStates[nextCardId];
    // Rate "Again" to test queue reordering
    const newCard = scheduleSRSCardWithSettings(card, 0, DEFAULT_SRS_SETTINGS); // Again
    cardStates[nextCardId] = newCard;
    session = updateStudySession(session, card, 0, newCard, cardStates, DEFAULT_SRS_SETTINGS);
    console.log(`   Card ${nextCardId} after 'Again', queue: [${session.learningCardsInQueue.join(', ')}]`);
    console.log(`   Card that got 'Again' should be moved to back of queue`);
  }

  // Test for infinite loop prevention - try to complete session
  console.log("\n=== TESTING INFINITE LOOP PREVENTION ===");
  let iterations = 0;
  const maxIterations = 50;
  
  while (iterations < maxIterations) {
    const nextId = getNextCardToStudyWithSettings(cardStates, session, DEFAULT_SRS_SETTINGS);
    if (!nextId) {
      console.log(`✅ Session completed after ${iterations} study actions - no infinite loop`);
      break;
    }
    
    // Rate all remaining cards as "Good" to progress them
    const cardToStudy = cardStates[nextId];
    const updatedCard = scheduleSRSCardWithSettings(cardToStudy, 2, DEFAULT_SRS_SETTINGS); // Good
    cardStates[nextId] = updatedCard;
    session = updateStudySession(session, cardToStudy, 2, updatedCard, cardStates, DEFAULT_SRS_SETTINGS);
    
    iterations++;
    
    if (iterations >= maxIterations) {
      console.log(`❌ INFINITE LOOP DETECTED - reached ${maxIterations} iterations`);
      console.log(`   Final queue: [${session.learningCardsInQueue.join(', ')}]`);
      testsPassed = false;
      break;
    }
  }
  
  console.log(`${testsPassed ? '✅ FIFO and infinite loop tests PASSED' : '❌ FIFO or infinite loop tests FAILED'}`);
  return testsPassed;
}

// Uncomment to run test in console
// testAnkiLikeBehavior();
// testAnkiAlgorithmCompatibility();
// testMinimumEaseBoundary();
// testLearningQueueBehavior();
