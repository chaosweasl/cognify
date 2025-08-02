// Comprehensive Test Suite for SM-2 Algorithm Fixes
// This file tests the exact bugs mentioned in the issue and validates fixes

import {
  SRSCardState,
  DEFAULT_SRS_SETTINGS,
  scheduleSRSCardWithSettings,
  initSRSStateWithSettings,
} from "./SRSScheduler";
import { SRSSettings } from "@/hooks/useSettings";

// Test settings for validation
const TEST_SETTINGS: SRSSettings = {
  ...DEFAULT_SRS_SETTINGS,
  LAPSE_EASE_PENALTY: 0.2, // 20% ease reduction for lapses
  HARD_INTERVAL_FACTOR: 1.2, // 1.2x multiplier for Hard intervals
  EASY_INTERVAL_FACTOR: 1.3, // 1.3x multiplier for Easy intervals
  EASY_BONUS: 1.3, // Ease bonus for Easy rating
};

interface TestResult {
  name: string;
  passed: boolean;
  expected: unknown;
  actual: unknown;
  description: string;
}

/**
 * Test Bug A: Hard-coded Ease Deltas
 * Problem: calculateAnkiEase uses hard-coded -0.15/+0.15 values
 */
function testHardcodedEaseDeltas(): TestResult[] {
  const results: TestResult[] = [];
  
  // Create a review card for testing ease calculations
  const reviewCard: SRSCardState = {
    id: "ease-test",
    state: "review",
    interval: 10,
    ease: 2.50,
    due: Date.now(),
    lastReviewed: 0,
    repetitions: 2,
    lapses: 0,
    learningStep: 0,
    isLeech: false,
    isSuspended: false,
  };

  // Test Again rating - should use LAPSE_EASE_PENALTY
  const againResult = scheduleSRSCardWithSettings(reviewCard, 0, TEST_SETTINGS);
  const expectedAgainEase = Math.max(TEST_SETTINGS.MINIMUM_EASE, 2.50 - TEST_SETTINGS.LAPSE_EASE_PENALTY);
  results.push({
    name: "Again ease calculation",
    passed: Math.abs(againResult.ease - expectedAgainEase) < 0.01,
    expected: expectedAgainEase,
    actual: againResult.ease,
    description: "Again should reduce ease by LAPSE_EASE_PENALTY (0.2)"
  });

  // Test Hard rating - should use HARD_INTERVAL_FACTOR for ease (NOT hard-coded -0.15)
  const hardResult = scheduleSRSCardWithSettings(reviewCard, 1, TEST_SETTINGS);
  // Note: Current implementation might be wrong, this test documents expected behavior
  const expectedHardEase = 2.50; // Hard should not change ease in true Anki
  results.push({
    name: "Hard ease calculation", 
    passed: Math.abs(hardResult.ease - expectedHardEase) < 0.01,
    expected: expectedHardEase,
    actual: hardResult.ease,
    description: "Hard should not change ease (only affects interval)"
  });

  // Test Easy rating - should use EASY_BONUS multiplicatively
  const easyResult = scheduleSRSCardWithSettings(reviewCard, 3, TEST_SETTINGS);
  const expectedEasyEase = 2.50 + 0.15; // Current hard-coded behavior (should be fixed)
  results.push({
    name: "Easy ease calculation",
    passed: Math.abs(easyResult.ease - expectedEasyEase) < 0.01,
    expected: expectedEasyEase,
    actual: easyResult.ease,
    description: "Easy should increase ease (current: +0.15, should use EASY_BONUS)"
  });

  return results;
}

/**
 * Test Bug B: New Card "Good" Rating Path
 * Problem: "Good" on new cards goes to learning step 1 instead of 0
 */
function testNewCardGoodRating(): TestResult[] {
  const results: TestResult[] = [];
  
  const newCard = initSRSStateWithSettings(["test-card"], TEST_SETTINGS)["test-card"];
  
  // Test Again (0) - should go to learning step 0
  const againResult = scheduleSRSCardWithSettings(newCard, 0, TEST_SETTINGS);
  results.push({
    name: "New card Again rating",
    passed: againResult.state === "learning" && againResult.learningStep === 0,
    expected: { state: "learning", learningStep: 0 },
    actual: { state: againResult.state, learningStep: againResult.learningStep },
    description: "Again on new card should go to learning step 0"
  });

  // Test Hard (1) - should go to learning step 0
  const hardResult = scheduleSRSCardWithSettings(newCard, 1, TEST_SETTINGS);
  results.push({
    name: "New card Hard rating",
    passed: hardResult.state === "learning" && hardResult.learningStep === 0,
    expected: { state: "learning", learningStep: 0 },
    actual: { state: hardResult.state, learningStep: hardResult.learningStep },
    description: "Hard on new card should go to learning step 0"
  });

  // Test Good (2) - should go to learning step 0 (CURRENT BUG: goes to step 1)
  const goodResult = scheduleSRSCardWithSettings(newCard, 2, TEST_SETTINGS);
  results.push({
    name: "New card Good rating",
    passed: goodResult.state === "learning" && goodResult.learningStep === 0,
    expected: { state: "learning", learningStep: 0 },
    actual: { state: goodResult.state, learningStep: goodResult.learningStep },
    description: "Good on new card should go to learning step 0 (CURRENT BUG: goes to step 1)"
  });

  // Test Easy (3) - should skip learning and go to review
  const easyResult = scheduleSRSCardWithSettings(newCard, 3, TEST_SETTINGS);
  results.push({
    name: "New card Easy rating",
    passed: easyResult.state === "review",
    expected: { state: "review" },
    actual: { state: easyResult.state },
    description: "Easy on new card should skip learning and go to review"
  });

  return results;
}

/**
 * Test Bug C: Interval Calculation Formula
 * Problem: Review interval logic has incorrect branching conditions
 */
function testIntervalCalculationFormula(): TestResult[] {
  const results: TestResult[] = [];
  
  // Test repetition 1 → interval = 1 day
  const rep1Card: SRSCardState = {
    id: "rep1-test",
    state: "review",
    interval: 1,
    ease: 2.50,
    due: Date.now(),
    lastReviewed: 0,
    repetitions: 0, // First review
    lapses: 0,
    learningStep: 0,
    isLeech: false,
    isSuspended: false,
  };
  
  const rep1Result = scheduleSRSCardWithSettings(rep1Card, 2, TEST_SETTINGS); // Good
  results.push({
    name: "Repetition 1 interval",
    passed: rep1Result.interval === 1,
    expected: 1,
    actual: rep1Result.interval,
    description: "First review should always result in 1 day interval"
  });

  // Test repetition 2 → interval = ease × 1 
  const rep2Card: SRSCardState = {
    id: "rep2-test", 
    state: "review",
    interval: 1,
    ease: 2.50,
    due: Date.now(),
    lastReviewed: 0,
    repetitions: 1, // Second review
    lapses: 0,
    learningStep: 0,
    isLeech: false,
    isSuspended: false,
  };
  
  const rep2Result = scheduleSRSCardWithSettings(rep2Card, 2, TEST_SETTINGS); // Good
  const expectedRep2Interval = Math.round(1 * 2.50); // 2.5 days
  results.push({
    name: "Repetition 2 interval", 
    passed: rep2Result.interval === expectedRep2Interval,
    expected: expectedRep2Interval,
    actual: rep2Result.interval,
    description: "Second review should use interval = ease × 1"
  });

  // Test repetition 3+ → interval = previousInterval × ease
  const rep3Card: SRSCardState = {
    id: "rep3-test",
    state: "review", 
    interval: 6,
    ease: 2.50,
    due: Date.now(),
    lastReviewed: 0,
    repetitions: 2, // Third+ review
    lapses: 0,
    learningStep: 0,
    isLeech: false,
    isSuspended: false,
  };
  
  const rep3Result = scheduleSRSCardWithSettings(rep3Card, 2, TEST_SETTINGS); // Good
  const expectedRep3Interval = Math.round(6 * 2.50); // 15 days
  results.push({
    name: "Repetition 3+ interval",
    passed: rep3Result.interval === expectedRep3Interval,
    expected: expectedRep3Interval,
    actual: rep3Result.interval,
    description: "Third+ review should use interval = previousInterval × ease"
  });

  // Test Hard rating - should use HARD_INTERVAL_FACTOR, not ease
  const hardIntervalResult = scheduleSRSCardWithSettings(rep3Card, 1, TEST_SETTINGS); // Hard
  const expectedHardInterval = Math.round(6 * TEST_SETTINGS.HARD_INTERVAL_FACTOR); // 6 * 1.2 = 7.2 → 7
  results.push({
    name: "Hard interval calculation",
    passed: hardIntervalResult.interval === expectedHardInterval,
    expected: expectedHardInterval,
    actual: hardIntervalResult.interval,
    description: "Hard should use HARD_INTERVAL_FACTOR, not ease multiplication"
  });

  // Test Easy rating - should apply EASY_INTERVAL_FACTOR after base calculation
  const easyIntervalResult = scheduleSRSCardWithSettings(rep3Card, 3, TEST_SETTINGS); // Easy
  const baseEasyInterval = Math.round(6 * 2.50); // 15
  const expectedEasyInterval = Math.round(baseEasyInterval * TEST_SETTINGS.EASY_INTERVAL_FACTOR); // 15 * 1.3 = 19.5 → 20
  results.push({
    name: "Easy interval calculation",
    passed: easyIntervalResult.interval === expectedEasyInterval,
    expected: expectedEasyInterval,
    actual: easyIntervalResult.interval,
    description: "Easy should apply EASY_INTERVAL_FACTOR after base SM-2 calculation"
  });

  return results;
}

/**
 * Test Bug D: Relearning Step Progression
 * Problem: Learning step counter not properly incremented during relearning
 */
function testRelearningStepProgression(): TestResult[] {
  const results: TestResult[] = [];
  
  const relearningCard: SRSCardState = {
    id: "relearn-test",
    state: "relearning", 
    interval: 10, // minutes
    ease: 2.0,
    due: Date.now(),
    lastReviewed: 0,
    repetitions: 3,
    lapses: 1,
    learningStep: 0, // First relearning step
    isLeech: false,
    isSuspended: false,
  };

  // Test Again during relearning - should reset to step 0
  const againResult = scheduleSRSCardWithSettings(relearningCard, 0, TEST_SETTINGS);
  results.push({
    name: "Relearning Again rating",
    passed: againResult.learningStep === 0,
    expected: 0,
    actual: againResult.learningStep,
    description: "Again during relearning should reset to step 0"
  });

  // Test Hard during relearning - should stay at current step
  const hardResult = scheduleSRSCardWithSettings(relearningCard, 1, TEST_SETTINGS);
  results.push({
    name: "Relearning Hard rating",
    passed: hardResult.learningStep === 0,
    expected: 0,
    actual: hardResult.learningStep,
    description: "Hard during relearning should stay at current step"
  });

  // Test Good during relearning - should increment to next step
  const goodResult = scheduleSRSCardWithSettings(relearningCard, 2, TEST_SETTINGS);
  results.push({
    name: "Relearning Good rating",
    passed: goodResult.learningStep === 1,
    expected: 1,
    actual: goodResult.learningStep,
    description: "Good during relearning should increment to next step"
  });

  // Test Good on final relearning step - should graduate to review
  const finalStepCard = { ...relearningCard, learningStep: 1 }; // Final step (index 1)
  const graduateResult = scheduleSRSCardWithSettings(finalStepCard, 2, TEST_SETTINGS);
  results.push({
    name: "Relearning graduation",
    passed: graduateResult.state === "review",
    expected: "review",
    actual: graduateResult.state,
    description: "Good on final relearning step should graduate to review"
  });

  return results;
}

/**
 * Run all bug tests and report results
 */
export function runBugValidationTests(): boolean {
  console.log("=== SM-2 ALGORITHM BUG VALIDATION TESTS ===\n");
  
  const allTests: TestResult[] = [
    ...testHardcodedEaseDeltas(),
    ...testNewCardGoodRating(), 
    ...testIntervalCalculationFormula(),
    ...testRelearningStepProgression(),
  ];

  let passedTests = 0;
  const totalTests = allTests.length;

  console.log("Bug Test Results:");
  console.log("================");
  
  for (const test of allTests) {
    const status = test.passed ? "✅ PASS" : "❌ FAIL";
    console.log(`${status} ${test.name}`);
    console.log(`  Description: ${test.description}`);
    console.log(`  Expected: ${JSON.stringify(test.expected)}`);
    console.log(`  Actual: ${JSON.stringify(test.actual)}`);
    console.log("");
    
    if (test.passed) passedTests++;
  }

  console.log(`Summary: ${passedTests}/${totalTests} tests passed`);
  console.log(`Failing tests indicate bugs that need to be fixed.\n`);
  
  return passedTests === totalTests;
}

// Export for use in other files
export {
  testHardcodedEaseDeltas,
  testNewCardGoodRating,
  testIntervalCalculationFormula,
  testRelearningStepProgression,
};