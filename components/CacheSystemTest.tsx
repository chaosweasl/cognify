"use client";

import React, { useState } from "react";
import { useCachedSettingsStore } from "@/hooks/useCachedSettings";
import { useCachedUserProfileStore } from "@/hooks/useCachedUserProfile";
import { useCachedProjectsStore } from "@/hooks/useCachedProjects";
import { useCacheStats } from "@/hooks/useCache";

interface TestResult {
  test: string;
  status: "pending" | "success" | "error";
  message?: string;
  duration?: number;
}

export function CacheSystemTest() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  
  const settingsStore = useCachedSettingsStore();
  const profileStore = useCachedUserProfileStore();
  const projectsStore = useCachedProjectsStore();
  const cacheStats = useCacheStats();

  const addResult = (result: TestResult) => {
    setResults(prev => {
      const newResults = [...prev];
      const existingIndex = newResults.findIndex(r => r.test === result.test);
      if (existingIndex >= 0) {
        newResults[existingIndex] = result;
      } else {
        newResults.push(result);
      }
      return newResults;
    });
  };

  const runTest = async (
    testName: string,
    testFn: () => Promise<void>
  ): Promise<void> => {
    const startTime = Date.now();
    addResult({ test: testName, status: "pending" });
    
    try {
      await testFn();
      const duration = Date.now() - startTime;
      addResult({ 
        test: testName, 
        status: "success", 
        message: "Passed",
        duration 
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      addResult({ 
        test: testName, 
        status: "error", 
        message: error instanceof Error ? error.message : String(error),
        duration 
      });
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);

    try {
      // Test 1: Settings Loading
      await runTest("Settings Loading", async () => {
        await settingsStore.loadSettings(true);
        if (!settingsStore.srsSettings || !settingsStore.userSettings) {
          throw new Error("Failed to load settings");
        }
        if (settingsStore.error) {
          throw new Error(`Settings error: ${settingsStore.error}`);
        }
      });

      // Test 2: User Profile Loading
      await runTest("User Profile Loading", async () => {
        await profileStore.fetchUserProfile(true);
        if (!profileStore.userProfile) {
          throw new Error("Failed to load user profile");
        }
        if (profileStore.error) {
          throw new Error(`Profile error: ${profileStore.error}`);
        }
      });

      // Test 3: Projects Loading
      await runTest("Projects Loading", async () => {
        await projectsStore.loadProjects(true);
        if (projectsStore.error) {
          throw new Error(`Projects error: ${projectsStore.error}`);
        }
        // Projects list can be empty for new users, so just check for no errors
      });

      // Test 4: Settings Validation
      await runTest("Settings Validation", async () => {
        const errors = settingsStore.validateSRSSettings({
          HARD_INTERVAL_FACTOR: 1.5, // Should fail (> 1.0)
        });
        if (errors.length === 0) {
          throw new Error("Validation should have failed for HARD_INTERVAL_FACTOR > 1.0");
        }
        
        const validErrors = settingsStore.validateSRSSettings({
          HARD_INTERVAL_FACTOR: 0.8, // Should pass
        });
        if (validErrors.length > 0) {
          throw new Error(`Valid settings rejected: ${validErrors.join(", ")}`);
        }
      });

      // Test 5: Cache Performance
      await runTest("Cache Performance", async () => {
        // Clear cache and load settings
        const startTime = Date.now();
        await settingsStore.loadSettings(true);
        const firstLoadTime = Date.now() - startTime;
        
        // Load from cache
        const cacheStartTime = Date.now();
        await settingsStore.loadSettings(false);
        const cacheLoadTime = Date.now() - cacheStartTime;
        
        if (cacheLoadTime > firstLoadTime * 0.5) {
          throw new Error("Cache doesn't appear to be improving performance");
        }
      });

      // Test 6: Database Constraint Compliance
      await runTest("Database Constraint Compliance", async () => {
        const currentSettings = settingsStore.srsSettings;
        
        // Check all constraint values
        if (currentSettings.HARD_INTERVAL_FACTOR < 0.1 || currentSettings.HARD_INTERVAL_FACTOR > 1.0) {
          throw new Error(`HARD_INTERVAL_FACTOR out of range: ${currentSettings.HARD_INTERVAL_FACTOR}`);
        }
        
        if (currentSettings.STARTING_EASE < 1.3 || currentSettings.STARTING_EASE > 5.0) {
          throw new Error(`STARTING_EASE out of range: ${currentSettings.STARTING_EASE}`);
        }
        
        if (currentSettings.MINIMUM_EASE < 1.0 || currentSettings.MINIMUM_EASE > 3.0) {
          throw new Error(`MINIMUM_EASE out of range: ${currentSettings.MINIMUM_EASE}`);
        }
      });

    } catch (error) {
      console.error("Test suite failed:", error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "pending": return "⏳";
      case "success": return "✅";
      case "error": return "❌";
    }
  };

  const getStatusColor = (status: TestResult["status"]) => {
    switch (status) {
      case "pending": return "text-warning";
      case "success": return "text-success";
      case "error": return "text-error";
    }
  };

  return (
    <div className="card bg-base-200 shadow-lg p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Cache System & Database Test Suite</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Cache Entries</div>
            <div className="stat-value text-primary">{cacheStats.totalEntries}</div>
          </div>
        </div>
        
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Cache Hit Rate</div>
            <div className="stat-value text-secondary">{(cacheStats.cacheHitRate * 100).toFixed(1)}%</div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          className={`btn btn-primary ${isRunning ? "loading" : ""}`}
          onClick={runAllTests}
          disabled={isRunning}
        >
          {isRunning ? "Running Tests..." : "Run All Tests"}
        </button>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Test Results:</h3>
        {results.length === 0 ? (
          <div className="text-base-content/70">No tests run yet</div>
        ) : (
          results.map((result, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-base-100 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{getStatusIcon(result.status)}</span>
                <span className="font-medium">{result.test}</span>
              </div>
              <div className="text-right">
                <div className={`font-medium ${getStatusColor(result.status)}`}>
                  {result.message}
                </div>
                {result.duration && (
                  <div className="text-sm text-base-content/70">
                    {result.duration}ms
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {results.length > 0 && (
        <div className="mt-6 p-4 bg-base-100 rounded-lg">
          <h4 className="font-semibold mb-2">Summary:</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-success">
                {results.filter(r => r.status === "success").length}
              </div>
              <div className="text-sm">Passed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-error">
                {results.filter(r => r.status === "error").length}
              </div>
              <div className="text-sm">Failed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-warning">
                {results.filter(r => r.status === "pending").length}
              </div>
              <div className="text-sm">Pending</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}