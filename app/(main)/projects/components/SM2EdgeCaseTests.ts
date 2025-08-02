// Additional Edge Case Tests for SM-2 Algorithm Fixes
// Ensures robustness and backward compatibility

import {
  SRSCardState,
  SRSRating,
  DEFAULT_SRS_SETTINGS,
  scheduleSRSCardWithSettings,
  initSRSStateWithSettings,
} from "./SRSScheduler";
import { SRSSettings } from "@/hooks/useSettings";

/**
 * Test edge cases for ease boundary conditions
 */
function testEaseBoundaryConditions(): boolean {
  console.log("=== Testing Ease Boundary Conditions ===");
  
  let allPassed = true;
  
  // Test minimum ease boundary with Again rating
  const minEaseCard: SRSCardState = {
    id: "min-ease-test",
    state: "review",
    interval: 5,
    ease: 1.30, // At minimum
    due: Date.now(),
    lastReviewed: 0,
    repetitions: 1,
    lapses: 0,
    learningStep: 0,
    isLeech: false,
    isSuspended: false,
  };
  
  const againResult = scheduleSRSCardWithSettings(minEaseCard, 0, DEFAULT_SRS_SETTINGS);
  const expectedMinEase = Math.max(DEFAULT_SRS_SETTINGS.MINIMUM_EASE, 1.30 - DEFAULT_SRS_SETTINGS.LAPSE_EASE_PENALTY);
  
  console.log(`Minimum ease (1.30) after Again: ${minEaseCard.ease} -> ${againResult.ease}`);
  console.log(`Expected: ${expectedMinEase}, Actual: ${againResult.ease}`);
  
  if (againResult.ease !== expectedMinEase) {
    console.log("❌ FAIL: Minimum ease boundary not enforced");
    allPassed = false;
  } else {
    console.log("✅ PASS: Minimum ease boundary enforced");
  }
  
  // Test maximum theoretical ease (unlikely but should handle gracefully)
  const highEaseCard: SRSCardState = {
    id: "high-ease-test",
    state: "review",
    interval: 10,
    ease: 4.0, // Very high ease
    due: Date.now(),
    lastReviewed: 0,
    repetitions: 3,
    lapses: 0,
    learningStep: 0,
    isLeech: false,
    isSuspended: false,
  };
  
  const easyResult = scheduleSRSCardWithSettings(highEaseCard, 3, DEFAULT_SRS_SETTINGS);
  console.log(`High ease (4.0) after Easy: ${highEaseCard.ease} -> ${easyResult.ease}`);
  
  if (easyResult.ease < highEaseCard.ease) {
    console.log("❌ FAIL: Easy rating should increase ease");
    allPassed = false;
  } else {
    console.log("✅ PASS: Easy rating increases ease");
  }
  
  return allPassed;
}

/**
 * Test new card behavior with different learning step configurations
 */
function testNewCardVariousLearningSteps(): boolean {
  console.log("\n=== Testing New Cards with Various Learning Step Configurations ===");
  
  let allPassed = true;
  
  // Test with single learning step
  const singleStepSettings: SRSSettings = {
    ...DEFAULT_SRS_SETTINGS,
    LEARNING_STEPS: [10], // Only one step
  };
  
  const newCard = initSRSStateWithSettings(["single-step"], singleStepSettings)["single-step"];
  
  // Good rating should go to step 0 (the only step)
  const goodResult = scheduleSRSCardWithSettings(newCard, 2, singleStepSettings);
  console.log(`Single step config - Good rating: step ${goodResult.learningStep}, state ${goodResult.state}`);
  
  if (goodResult.learningStep !== 0 || goodResult.state !== "learning") {
    console.log("❌ FAIL: Good on new card should go to learning step 0");
    allPassed = false;
  } else {
    console.log("✅ PASS: Good on new card goes to learning step 0");
  }
  
  // Test with many learning steps
  const manyStepsSettings: SRSSettings = {
    ...DEFAULT_SRS_SETTINGS,
    LEARNING_STEPS: [1, 5, 10, 20, 60], // Five steps
  };
  
  const manyStepCard = initSRSStateWithSettings(["many-steps"], manyStepsSettings)["many-steps"];
  
  // All ratings except Easy should go to step 0
  const ratings = [0, 1, 2]; // Again, Hard, Good
  for (const rating of ratings) {
    const result = scheduleSRSCardWithSettings(manyStepCard, rating as SRSRating, manyStepsSettings);
    console.log(`Many steps config - Rating ${rating}: step ${result.learningStep}, state ${result.state}`);
    
    if (result.learningStep !== 0 || result.state !== "learning") {
      console.log(`❌ FAIL: Rating ${rating} on new card should go to learning step 0`);
      allPassed = false;
    } else {
      console.log(`✅ PASS: Rating ${rating} on new card goes to learning step 0`);
    }
  }
  
  return allPassed;
}

/**
 * Test settings-driven ease calculations
 */
function testSettingsDrivenEaseCalculations(): boolean {
  console.log("\n=== Testing Settings-Driven Ease Calculations ===");
  
  let allPassed = true;
  
  // Test with custom LAPSE_EASE_PENALTY
  const customSettings: SRSSettings = {
    ...DEFAULT_SRS_SETTINGS,
    LAPSE_EASE_PENALTY: 0.15, // Custom penalty
    MINIMUM_EASE: 1.2, // Custom minimum
  };
  
  const reviewCard: SRSCardState = {
    id: "custom-settings-test",
    state: "review",
    interval: 10,
    ease: 2.0,
    due: Date.now(),
    lastReviewed: 0,
    repetitions: 2,
    lapses: 0,
    learningStep: 0,
    isLeech: false,
    isSuspended: false,
  };
  
  // Test Again with custom LAPSE_EASE_PENALTY
  const againResult = scheduleSRSCardWithSettings(reviewCard, 0, customSettings);
  const expectedEase = Math.max(customSettings.MINIMUM_EASE, 2.0 - customSettings.LAPSE_EASE_PENALTY);
  
  console.log(`Custom LAPSE_EASE_PENALTY (0.15): ${reviewCard.ease} -> ${againResult.ease}`);
  console.log(`Expected: ${expectedEase}, Actual: ${againResult.ease}`);
  
  if (Math.abs(againResult.ease - expectedEase) > 0.01) {
    console.log("❌ FAIL: Custom LAPSE_EASE_PENALTY not applied correctly");
    allPassed = false;
  } else {
    console.log("✅ PASS: Custom LAPSE_EASE_PENALTY applied correctly");
  }
  
  // Test Hard rating doesn't change ease regardless of settings
  const hardResult = scheduleSRSCardWithSettings(reviewCard, 1, customSettings);
  
  console.log(`Hard rating ease: ${reviewCard.ease} -> ${hardResult.ease}`);
  
  if (hardResult.ease !== reviewCard.ease) {
    console.log("❌ FAIL: Hard rating should not change ease");
    allPassed = false;
  } else {
    console.log("✅ PASS: Hard rating doesn't change ease");
  }
  
  return allPassed;
}

/**
 * Test backward compatibility with existing card states
 */
function testBackwardCompatibility(): boolean {
  console.log("\n=== Testing Backward Compatibility ===");
  
  let allPassed = true;
  
  // Test that existing card states continue to work
  const legacyCard: SRSCardState = {
    id: "legacy-card",
    state: "review",
    interval: 7,
    ease: 2.3,
    due: Date.now() - 86400000, // Due yesterday
    lastReviewed: Date.now() - 172800000, // Reviewed 2 days ago
    repetitions: 5,
    lapses: 2,
    learningStep: 0,
    isLeech: false,
    isSuspended: false,
  };
  
  // Test that all ratings work correctly
  const ratings = [0, 1, 2, 3];
  for (const rating of ratings) {
    const result = scheduleSRSCardWithSettings(legacyCard, rating as SRSRating, DEFAULT_SRS_SETTINGS);
    
    console.log(`Legacy card rating ${rating}: ease ${legacyCard.ease} -> ${result.ease}, interval ${legacyCard.interval} -> ${result.interval}`);
    
    // Basic sanity checks
    if (result.ease < DEFAULT_SRS_SETTINGS.MINIMUM_EASE) {
      console.log(`❌ FAIL: Rating ${rating} resulted in ease below minimum`);
      allPassed = false;
    } else if (result.interval < 0) {
      console.log(`❌ FAIL: Rating ${rating} resulted in negative interval`);
      allPassed = false;
    } else if (!result.lastReviewed || result.lastReviewed < legacyCard.lastReviewed) {
      console.log(`❌ FAIL: Rating ${rating} didn't update lastReviewed properly`);
      allPassed = false;
    } else {
      console.log(`✅ PASS: Rating ${rating} works correctly with legacy card`);
    }
  }
  
  return allPassed;
}

/**
 * Run all additional edge case tests
 */
export function runAdditionalEdgeCaseTests(): boolean {
  console.log("=== ADDITIONAL EDGE CASE TESTS FOR SM-2 FIXES ===\n");
  
  const results = [
    testEaseBoundaryConditions(),
    testNewCardVariousLearningSteps(),
    testSettingsDrivenEaseCalculations(),
    testBackwardCompatibility(),
  ];
  
  const allPassed = results.every(result => result);
  
  console.log(`\n=== ADDITIONAL EDGE CASE TEST SUMMARY ===`);
  console.log(`${allPassed ? '🎉 ALL ADDITIONAL TESTS PASSED' : '❌ SOME ADDITIONAL TESTS FAILED'}`);
  
  return allPassed;
}

// Auto-run if executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runAdditionalEdgeCaseTests();
}