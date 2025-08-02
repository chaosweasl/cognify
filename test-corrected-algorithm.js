// Test script to verify corrected algorithm behavior
// Run with: node test-corrected-algorithm.js

const DEFAULT_SRS_SETTINGS = {
  STARTING_EASE: 2.5,
  MINIMUM_EASE: 1.3,
  LAPSE_EASE_PENALTY: 0.2,
  HARD_INTERVAL_FACTOR: 1.2,
  EASY_INTERVAL_FACTOR: 1.3,
  INTERVAL_MODIFIER: 1.0,
  RELEARNING_STEPS: [10, 1440],
};

// CORRECTED implementation of calculateNewEase (Anki's method)
function calculateNewEase(currentEase, rating) {
  let newEase = currentEase;

  // Anki's simplified ease factor adjustments
  switch (rating) {
    case 0: // Again
      newEase = currentEase - 0.20;
      break;
    case 1: // Hard  
      newEase = currentEase - 0.15;
      break;
    case 2: // Good
      newEase = currentEase; // No change
      break;
    case 3: // Easy
      newEase = currentEase + 0.15;
      break;
  }

  // Ensure minimum ease factor (Anki minimum is 1.30)
  return Math.max(DEFAULT_SRS_SETTINGS.MINIMUM_EASE, newEase);
}

// CORRECTED implementation of review card scheduling (Anki's method)
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

  // Calculate new ease factor first
  const newEase = calculateNewEase(card.ease, rating);
  let newInterval;

  if (rating === 1) {
    // Hard - Anki's method: interval = prev_interval * hard_factor 
    // IMPORTANT: Does NOT multiply by ease factor (key difference from original SM-2)
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

// Test the corrected algorithm
function testCorrectedAlgorithm() {
  console.log("=== TESTING CORRECTED (ANKI-COMPATIBLE) ALGORITHM ===");
  
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
  
  console.log("");
  console.log("=== VERIFICATION ===");
  
  // Check specific calculations
  for (const { name, rating } of ratings) {
    const result = scheduleReviewCard(testCard, rating);
    let expected = {};
    
    switch (rating) {
      case 0: // Again
        expected = { ease: 2.30, state: "relearning" };
        break;
      case 1: // Hard
        expected = { ease: 2.35, interval: 12 };
        break;
      case 2: // Good
        expected = { ease: 2.50, interval: 25 };
        break;
      case 3: // Easy
        expected = { ease: 2.65, interval: 34 };
        break;
    }
    
    let matches = true;
    if (expected.ease !== undefined && Math.abs(result.ease - expected.ease) > 0.01) {
      matches = false;
    }
    if (expected.interval !== undefined && Math.abs(result.interval - expected.interval) > 1) {
      matches = false;
    }
    if (expected.state !== undefined && result.state !== expected.state) {
      matches = false;
    }
    
    console.log(`${name}: ${matches ? '✅ PASS' : '❌ FAIL'}`);
  }
}

testCorrectedAlgorithm();