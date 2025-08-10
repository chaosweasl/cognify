#!/usr/bin/env tsx

/**
 * Debug script to test SRS database operations and daily study stats
 * Run this script to see if the database operations are working properly
 */

import { createClient } from "../utils/supabase/server";
import {
  saveSRSStates,
  loadSRSStates,
} from "../app/(main)/projects/components/SRSDBUtils";
import {
  updateDailyStudyStats,
  getDailyStudyStats,
} from "../utils/supabase/dailyStudyStats";
import {
  initSRSStateWithSettings,
  DEFAULT_SRS_SETTINGS,
} from "../app/(main)/projects/components/SRSScheduler";

async function testDatabaseOperations() {
  console.log("🧪 Testing Cognify database operations...\n");

  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("❌ No authenticated user found. Please log in first.");
      return;
    }

    console.log(`✅ User authenticated: ${user.id}\n`);

    // Test 1: Daily Study Stats
    console.log("📊 Testing Daily Study Stats...");

    try {
      // Get current stats
      const currentStats = await getDailyStudyStats(user.id);
      console.log("Current daily stats:", currentStats);

      // Try to update stats
      await updateDailyStudyStats(user.id, 1, 1);
      console.log("✅ Successfully updated daily study stats");

      // Verify update
      const updatedStats = await getDailyStudyStats(user.id);
      console.log("Updated daily stats:", updatedStats);
    } catch (error) {
      console.error("❌ Daily study stats test failed:", error);
    }

    console.log("\n");

    // Test 2: SRS States
    console.log("🧠 Testing SRS States...");

    try {
      // Create some test flashcard IDs
      const testCardIds = ["test-card-1", "test-card-2", "test-card-3"];
      const testProjectId = "test-project-db-operations";

      // Initialize test SRS states
      const testStates = initSRSStateWithSettings(
        testCardIds,
        DEFAULT_SRS_SETTINGS
      );
      console.log(`Created ${Object.keys(testStates).length} test SRS states`);

      // Try to save SRS states
      const saveResult = await saveSRSStates(
        supabase,
        user.id,
        testProjectId,
        testStates
      );
      if (saveResult) {
        console.log("✅ Successfully saved SRS states");
      } else {
        console.log("❌ Failed to save SRS states");
      }

      // Try to load SRS states
      const loadedStates = await loadSRSStates(
        supabase,
        user.id,
        testProjectId,
        testCardIds
      );
      console.log(
        `✅ Successfully loaded ${Object.keys(loadedStates).length} SRS states`
      );

      // Compare states
      const savedKeys = Object.keys(testStates).sort();
      const loadedKeys = Object.keys(loadedStates).sort();

      if (JSON.stringify(savedKeys) === JSON.stringify(loadedKeys)) {
        console.log("✅ SRS states round-trip test passed");
      } else {
        console.log("❌ SRS states round-trip test failed");
        console.log("Saved keys:", savedKeys);
        console.log("Loaded keys:", loadedKeys);
      }
    } catch (error) {
      console.error("❌ SRS states test failed:", error);
    }

    console.log("\n🎉 Database operations test completed!");
  } catch (error) {
    console.error("❌ Database test failed:", error);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testDatabaseOperations().catch(console.error);
}

export { testDatabaseOperations };
