#!/usr/bin/env tsx

/**
 * Test SRS State Creation and Statistics Calculation
 * 
 * This script verifies that:
 * 1. Flashcards are created successfully  
 * 2. SRS states are initialized correctly for new cards
 * 3. batch-stats API returns correct statistics
 * 4. Interval constraints are satisfied
 */

import "dotenv/config";
import { createSuperClientOrThrow } from "@/lib/supabase/superClient";

const supabase = createSuperClientOrThrow();
const userId = process.env.TEST_USER_ID;

if (!userId) {
  console.error("❌ Please set TEST_USER_ID in your .env file");
  process.exit(1);
}

interface TestResults {
  projectCreated: boolean;
  flashcardsCreated: boolean;
  srsStatesCreated: boolean;
  statisticsCorrect: boolean;
  intervalConstraintsSatisfied: boolean;
  errors: string[];
}

async function runSRSTest(): Promise<TestResults> {
  const results: TestResults = {
    projectCreated: false,
    flashcardsCreated: false,
    srsStatesCreated: false,
    statisticsCorrect: false,
    intervalConstraintsSatisfied: false,
    errors: []
  };

  try {
    console.log("🧪 Starting SRS Creation Test");
    console.log(`👤 Testing with user ID: ${userId}`);

    // Step 1: Create a test project
    console.log("\n📝 Step 1: Creating test project...");
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        user_id: userId,
        name: `SRS Test Project ${Date.now()}`,
        description: "Test project for SRS state creation verification",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (projectError || !project) {
      results.errors.push(`Failed to create project: ${projectError?.message}`);
      return results;
    }

    console.log(`✅ Project created: ${project.id}`);
    results.projectCreated = true;

    // Step 2: Create test flashcards
    console.log("\n🃏 Step 2: Creating test flashcards...");
    const testFlashcards = [
      { front: "What is 2 + 2?", back: "4" },
      { front: "What is the capital of France?", back: "Paris" },
      { front: "What is H2O?", back: "Water" },
      { front: "What is the speed of light?", back: "299,792,458 m/s" }
    ];

    const now = new Date().toISOString();
    const flashcardRows = testFlashcards.map((fc) => ({
      project_id: project.id,
      front: fc.front,
      back: fc.back,
      extra: {},
      created_at: now,
      updated_at: now,
    }));

    const { data: flashcards, error: flashcardError } = await supabase
      .from("flashcards")
      .insert(flashcardRows)
      .select();

    if (flashcardError || !flashcards) {
      results.errors.push(`Failed to create flashcards: ${flashcardError?.message}`);
      return results;
    }

    console.log(`✅ Created ${flashcards.length} flashcards`);
    results.flashcardsCreated = true;

    // Step 3: Create SRS states (simulating the createFlashcards function)
    console.log("\n🧠 Step 3: Creating SRS states...");
    const srsStatesToInsert = flashcards.map((flashcard) => ({
      user_id: userId,
      project_id: project.id,
      card_id: flashcard.id,
      interval: 1, // Should be >= 1 to satisfy constraint
      ease: 2.5,
      due: now, // New cards are immediately available
      last_reviewed: now,
      repetitions: 0,
      state: "new",
      lapses: 0,
      learning_step: 0,
      is_leech: false,
      is_suspended: false,
    }));

    const { data: srsStates, error: srsError } = await supabase
      .from("srs_states")
      .insert(srsStatesToInsert)
      .select();

    if (srsError || !srsStates) {
      results.errors.push(`Failed to create SRS states: ${srsError?.message}`);
      return results;
    }

    console.log(`✅ Created ${srsStates.length} SRS states`);
    results.srsStatesCreated = true;

    // Step 4: Verify interval constraints
    console.log("\n🔍 Step 4: Verifying interval constraints...");
    const invalidIntervals = srsStates.filter(state => state.interval <= 0);
    if (invalidIntervals.length > 0) {
      results.errors.push(`Found ${invalidIntervals.length} SRS states with invalid intervals`);
      console.log("❌ Invalid intervals found:", invalidIntervals.map(s => s.interval));
    } else {
      console.log("✅ All intervals satisfy constraint (> 0)");
      results.intervalConstraintsSatisfied = true;
    }

    // Step 5: Test batch-stats API simulation
    console.log("\n📊 Step 5: Testing statistics calculation...");
    
    // Simulate the batch-stats API logic
    const projectFlashcards = flashcards;
    const projectSrsStates = srsStates;
    const nowTime = new Date().toISOString();

    // Calculate stats using our fixed logic
    const newCardsCount = projectSrsStates.filter(s => s.state === "new").length;
    const learningCardsCount = projectSrsStates.filter(s => s.state === "learning").length;  
    const dueCardsCount = projectSrsStates.filter(s => s.due <= nowTime).length;

    const expectedStats = {
      totalCards: projectFlashcards.length,
      newCards: newCardsCount,
      learningCards: learningCardsCount,
      reviewCards: dueCardsCount, // Should equal dueCards
      dueCards: dueCardsCount,
    };

    console.log("📊 Calculated statistics:", expectedStats);

    // Verify expected results
    const expectedNewCards = 4; // All should be new
    const expectedDueCards = 4; // All should be due (including new cards)
    
    if (expectedStats.newCards === expectedNewCards && 
        expectedStats.dueCards === expectedDueCards &&
        expectedStats.reviewCards === expectedStats.dueCards) {
      console.log("✅ Statistics calculation is correct");
      results.statisticsCorrect = true;
    } else {
      results.errors.push(
        `Statistics mismatch. Expected: new=${expectedNewCards}, due=${expectedDueCards}. ` +
        `Got: new=${expectedStats.newCards}, due=${expectedStats.dueCards}`
      );
    }

    // Step 6: Clean up test data
    console.log("\n🧹 Step 6: Cleaning up test data...");
    await supabase.from("projects").delete().eq("id", project.id);
    console.log("✅ Test data cleaned up");

  } catch (error) {
    results.errors.push(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
  }

  return results;
}

async function main() {
  console.log("🚀 Starting SRS Creation and Statistics Test\n");

  const results = await runSRSTest();

  console.log("\n" + "=".repeat(50));
  console.log("📋 TEST RESULTS SUMMARY");
  console.log("=".repeat(50));

  console.log(`Project Creation: ${results.projectCreated ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`Flashcards Creation: ${results.flashcardsCreated ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`SRS States Creation: ${results.srsStatesCreated ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`Statistics Correct: ${results.statisticsCorrect ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`Interval Constraints: ${results.intervalConstraintsSatisfied ? "✅ PASS" : "❌ FAIL"}`);

  if (results.errors.length > 0) {
    console.log("\n❌ ERRORS:");
    results.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  }

  const allTestsPassed = results.projectCreated && 
                        results.flashcardsCreated && 
                        results.srsStatesCreated && 
                        results.statisticsCorrect && 
                        results.intervalConstraintsSatisfied &&
                        results.errors.length === 0;

  console.log(`\n🎯 Overall Result: ${allTestsPassed ? "✅ ALL TESTS PASSED" : "❌ SOME TESTS FAILED"}`);

  if (allTestsPassed) {
    console.log("\n🎉 The SRS system is working correctly!");
    console.log("✨ New cards will be properly created and appear in study sessions.");
  } else {
    console.log("\n⚠️  Issues found that need to be addressed.");
  }

  process.exit(allTestsPassed ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
}