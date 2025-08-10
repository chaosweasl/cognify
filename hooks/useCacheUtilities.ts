/**
 * Cache management utilities for development and debugging
 */

import { useCacheStore } from "@/hooks/useCache";

/**
 * Get cache utilities for development and debugging
 */
export function useCacheUtilities() {
  const store = useCacheStore();

  return {
    // Get cache performance metrics
    getPerformanceMetrics() {
      return store.getStats();
    },

    // Get detailed cache contents
    getCacheContents() {
      const cache = store.cache;
      const now = Date.now();
      const result: Record<string, any> = {};

      Object.entries(cache).forEach(([key, entry]) => {
        result[key] = {
          data: entry.data,
          timestamp: entry.timestamp,
          size: JSON.stringify(entry.data).length,
          expired: entry.expiresAt ? entry.expiresAt < now : false,
          ageMinutes: (now - entry.timestamp) / (1000 * 60),
          expiresAt: entry.expiresAt,
          version: entry.version,
        };
      });

      return result;
    },

    // Clear specific cache types
    clearCacheType(pattern: string) {
      store.invalidatePattern(pattern);
      return `Cleared cache entries matching: ${pattern}`;
    },

    // Clear all cache
    clearAll() {
      store.clear();
      return "All cache cleared";
    },

    // Force cleanup of expired entries
    cleanup() {
      store.cleanup();
      return "Cache cleanup completed";
    },

    // Export cache for backup
    exportCache() {
      return JSON.stringify({
        cache: store.cache,
        timestamp: Date.now(),
        version: "1.0",
      });
    },

    // Check if cache key is expired
    checkExpired(key: string) {
      return store.isExpired(key as any);
    },
  };
}

/**
 * Development helper: Log cache performance to console
 */
export function logCachePerformance() {
  if (process.env.NODE_ENV !== "development") return;

  const utils = useCacheUtilities();
  const metrics = utils.getPerformanceMetrics();

  console.group("📊 Cache Performance");
  console.log(`Hit Rate: ${(metrics.cacheHitRate * 100).toFixed(1)}%`);
  console.log(`Total Entries: ${metrics.totalEntries}`);
  console.log(`Total Size: ${(metrics.totalSize / 1024).toFixed(1)} KB`);
  console.log(`Expired Entries: ${metrics.expiredEntries}`);
  console.groupEnd();
}

/**
 * Development helper: Clear all cache and reload
 */
export function resetCacheAndReload() {
  if (process.env.NODE_ENV !== "development") {
    console.warn("Cache reset only available in development");
    return;
  }

  const utils = useCacheUtilities();
  utils.clearAll();

  // Give a moment for state to update, then reload
  setTimeout(() => {
    window.location.reload();
  }, 100);
}

// Global development helpers
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  // Add to window object for console access
  (window as any).cognifyCache = {
    log: logCachePerformance,
    reset: resetCacheAndReload,
    utils: useCacheUtilities,
  };

  console.log("🔧 Cognify cache utilities available at window.cognifyCache");
}
