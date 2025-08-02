// Simple test script to verify current algorithm behavior
// Run with: node test-current-algorithm.js

// Simplified version of the SRS functions for testing
const DEFAULT_SRS_SETTINGS = {
  STARTING_EASE: 2.5,
  MINIMUM_EASE: 1.3,
  LAPSE_EASE_PENALTY: 0.2,
  HARD_INTERVAL_FACTOR: 1.2,
  EASY_INTERVAL_FACTOR: 1.3,
  INTERVAL_MODIFIER: 1.0,
  RELEARNING_STEPS: [10, 1440],
};

// Current implementation of calculateNewEase (WRONG)
function calculateNewEase(currentEase, rating) {
  // Convert our 0-3 scale to SM-2's 0-5 scale
  // 0=Again->0, 1=Hard->2, 2=Good->3, 3=Easy->5
  const q = rating === 0 ? 0 : rating === 1 ? 2 : rating === 2 ? 3 : 5;

  // Official SM-2 formula: EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
  const newEase = currentEase + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));

  // Ensure minimum ease factor (SM-2 minimum is typically 1.3)
  return Math.max(DEFAULT_SRS_SETTINGS.MINIMUM_EASE, newEase);
}

// Current implementation of review card scheduling (WRONG)
function scheduleReviewCard(card, rating) {
  if (rating === 0) {
    // Again - send to relearning (lapse) with ease penalty
    return {
      ...card,
      state: "relearning",
      lapses: card.lapses + 1,
      ease: Math.max(
        DEFAULT_SRS_SETTINGS.MINIMUM_EASE,
        card.ease - DEFAULT_SRS_SETTINGS.LAPSE_EASE_PENALTY
      ),
      learningStep: 0,
      interval: DEFAULT_SRS_SETTINGS.RELEARNING_STEPS[0],
    };
  }

  // For Hard, Good, Easy - calculate new interval using simplified SM-2
  const newEase = calculateNewEase(card.ease, rating);
  let newInterval;

  if (rating === 1) {
    // Hard - Anki formula: interval = prev_interval * hard_factor (typically 1.2)
    newInterval = Math.round(card.interval * DEFAULT_SRS_SETTINGS.HARD_INTERVAL_FACTOR);
  } else if (rating === 2) {
    // Good - normal progression using ease factor
    newInterval = Math.round(card.interval * newEase);
  } else {
    // Easy - increase interval more with easy bonus
    newInterval = Math.round(
      card.interval * newEase * DEFAULT_SRS_SETTINGS.EASY_INTERVAL_FACTOR
    );
  }

  // Apply global interval modifier
  newInterval = Math.round(newInterval * DEFAULT_SRS_SETTINGS.INTERVAL_MODIFIER);
  newInterval = Math.max(1, newInterval);

  return {
    ...card,
    repetitions: card.repetitions + 1,
    ease: newEase,
    interval: newInterval,
    state: "review",
  };
}

// Test the current algorithm
function testCurrentAlgorithm() {
  console.log("=== TESTING CURRENT (WRONG) ALGORITHM ===");
  
  const testCard = {
    state: "review",
    ease: 2.50,
    interval: 10,
    repetitions: 1,
    lapses: 0,
    learningStep: 0,
  };
  
  console.log("Starting card:", testCard);
  console.log("");
  
  const ratings = [
    { name: "Again", rating: 0 },
    { name: "Hard", rating: 1 },
    { name: "Good", rating: 2 },
    { name: "Easy", rating: 3 },
  ];
  
  for (const { name, rating } of ratings) {
    const result = scheduleReviewCard(testCard, rating);
    console.log(`${name} (${rating}):`);
    console.log(`  Ease: ${testCard.ease} -> ${result.ease} (change: ${(result.ease - testCard.ease).toFixed(3)})`);
    console.log(`  Interval: ${testCard.interval} -> ${result.interval}`);
    console.log(`  State: ${result.state}`);
    console.log("");
  }
  
  console.log("=== EXPECTED ANKI BEHAVIOR ===");
  console.log("Again (0): ease: 2.50 -> 2.30 (-0.20), state: relearning");
  console.log("Hard (1):  ease: 2.50 -> 2.35 (-0.15), interval: 10 -> 12 (10 * 1.2)");
  console.log("Good (2):  ease: 2.50 -> 2.50 (no change), interval: 10 -> 25 (10 * 2.5)");
  console.log("Easy (3):  ease: 2.50 -> 2.65 (+0.15), interval: 10 -> 34 (10 * 2.65 * 1.3)");
}

testCurrentAlgorithm();