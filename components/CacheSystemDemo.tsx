"use client";
import React from "react";
import {
  useCacheProvider,
  useEnhancedSettings,
  useEnhancedUserProfile,
  useEnhancedProjects,
} from "@/components/CacheProvider";
import { useTodayStats, useWeeklyStats } from "@/hooks/useCachedDailyStats";

/**
 * Demo component showcasing the cache system features
 * This component demonstrates how the cache system works and provides
 * admin controls for cache management.
 */
export function CacheSystemDemo() {
  const { cacheStats, refreshAll, clearAll } = useCacheProvider();

  // Enhanced hooks with automatic caching
  const {
    srsSettings,
    userSettings,
    isLoading: settingsLoading,
  } = useEnhancedSettings();
  const { userProfile, isLoading: profileLoading } = useEnhancedUserProfile();
  const { projects, isLoadingProjects } = useEnhancedProjects();

  // Daily stats with caching
  const { stats: todayStats, loading: todayLoading } = useTodayStats();
  const { totalStats: weeklyStats } = useWeeklyStats();

  const handleRefreshAll = async () => {
    try {
      await refreshAll();
      console.log("✅ All cache refreshed successfully");
    } catch (error) {
      console.error("❌ Error refreshing cache:", error);
    }
  };

  const handleClearAll = () => {
    if (confirm("Are you sure you want to clear all cached data?")) {
      clearAll();
      console.log("🗑️ All cache cleared");
    }
  };

  if (process.env.NODE_ENV !== "development") {
    return null; // Only show in development
  }

  return (
    <div className="fixed top-4 left-4 bg-base-300 p-6 rounded-lg shadow-xl max-w-md text-sm z-50">
      <h3 className="font-bold text-lg mb-4 text-primary">
        🚀 Cache System Demo
      </h3>

      {/* Cache Statistics */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2">📊 Cache Performance</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-base-200 p-2 rounded">
            <div className="font-medium">Hit Rate</div>
            <div className="text-success">
              {(cacheStats.cacheHitRate * 100).toFixed(1)}%
            </div>
          </div>
          <div className="bg-base-200 p-2 rounded">
            <div className="font-medium">Entries</div>
            <div>{cacheStats.totalEntries}</div>
          </div>
          <div className="bg-base-200 p-2 rounded">
            <div className="font-medium">Size</div>
            <div>{(cacheStats.totalSize / 1024).toFixed(1)} KB</div>
          </div>
          <div className="bg-base-200 p-2 rounded">
            <div className="font-medium">Expired</div>
            <div className="text-warning">{cacheStats.expiredEntries}</div>
          </div>
        </div>
      </div>

      {/* Data Loading Status */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2">📁 Data Status</h4>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Settings:</span>
            <span className={settingsLoading ? "text-warning" : "text-success"}>
              {settingsLoading ? "Loading..." : "✓ Cached"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Profile:</span>
            <span className={profileLoading ? "text-warning" : "text-success"}>
              {profileLoading ? "Loading..." : "✓ Cached"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Projects:</span>
            <span
              className={isLoadingProjects ? "text-warning" : "text-success"}
            >
              {isLoadingProjects ? "Loading..." : `✓ ${projects.length} cached`}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Today Stats:</span>
            <span className={todayLoading ? "text-warning" : "text-success"}>
              {todayLoading ? "Loading..." : "✓ Cached"}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Data Preview */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2">👤 Quick Preview</h4>
        <div className="text-xs space-y-1">
          {userProfile && (
            <div>User: {userProfile.display_name || "Anonymous"}</div>
          )}
          {todayStats && (
            <div>Today: {todayStats.reviews_completed} reviews</div>
          )}
          {weeklyStats && (
            <div>Week: {weeklyStats.reviews_completed} total reviews</div>
          )}
          <div>Theme: {userSettings.theme}</div>
          <div>New cards/day: {srsSettings.NEW_CARDS_PER_DAY}</div>
        </div>
      </div>

      {/* Cache Controls */}
      <div className="space-y-2">
        <button
          onClick={handleRefreshAll}
          className="btn btn-sm btn-primary w-full"
        >
          🔄 Refresh All Data
        </button>
        <button
          onClick={handleClearAll}
          className="btn btn-sm btn-warning w-full"
        >
          🗑️ Clear Cache
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-4 text-xs text-base-content/70 border-t pt-2">
        <div className="font-medium mb-1">💡 Tips:</div>
        <ul className="space-y-1">
          <li>• Data loads automatically on first visit</li>
          <li>• Changes invalidate related cache</li>
          <li>• Check console for cache logs</li>
          <li>• Hit rate shows cache efficiency</li>
        </ul>
      </div>
    </div>
  );
}

// Wrapper component to conditionally render the demo
export function CacheSystemDemoWrapper() {
  const [showDemo, setShowDemo] = React.useState(false);

  React.useEffect(() => {
    // Show demo if localStorage flag is set
    const shouldShow =
      localStorage.getItem("cognify-show-cache-demo") === "true";
    setShowDemo(shouldShow);
  }, []);

  if (!showDemo || process.env.NODE_ENV !== "development") {
    return null;
  }

  return <CacheSystemDemo />;
}
