import React from "react";
import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import { createClient } from "@/utils/supabase/client";

// Cache key types for type safety
export type CacheKey =
  | `projects`
  | `project:${string}`
  | `flashcards:${string}`
  | `srs_states:${string}`
  | `user_settings:${string}`
  | `user_profile:${string}`
  | `daily_stats:${string}:${string}` // userId:date
  | `study_stats:${string}:${string}` // userId:projectId
  | `notifications:${string}`;

// Cache entry with metadata
interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expiresAt?: number;
  version: string;
}

// Cache configuration per data type
interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  version: string; // For cache invalidation when structure changes
  maxSize?: number; // Maximum number of entries for this type
}

// Default cache configurations
const CACHE_CONFIGS: Record<string, CacheConfig> = {
  projects: { ttl: 10 * 1000, version: "1.0" }, // 10 seconds - much more responsive
  project: { ttl: 2 * 60 * 1000, version: "1.0" }, // 2 minutes
  flashcards: { ttl: 2 * 60 * 1000, version: "1.0" }, // 2 minutes
  srs_states: { ttl: 1 * 60 * 1000, version: "1.0" }, // 1 minute (more dynamic)
  user_settings: { ttl: 10 * 60 * 1000, version: "1.0" }, // 10 minutes
  user_profile: { ttl: 10 * 60 * 1000, version: "1.0" }, // 10 minutes
  daily_stats: { ttl: 60 * 60 * 1000, version: "1.0" }, // 1 hour
  study_stats: { ttl: 5 * 60 * 1000, version: "1.0" }, // 5 minutes
  notifications: { ttl: 10 * 60 * 1000, version: "1.0" }, // 10 minutes
};

interface CacheState {
  cache: Record<string, CacheEntry>;

  // Core cache operations
  get: <T>(key: CacheKey) => T | null;
  set: <T>(key: CacheKey, data: T, customTtl?: number) => void;
  remove: (key: CacheKey) => void;
  clear: () => void;
  invalidatePattern: (pattern: string) => void;

  // Cache metadata
  getStats: () => {
    totalEntries: number;
    expiredEntries: number;
    cacheHitRate: number;
    totalSize: number;
  };

  // Cache management
  cleanup: () => void;
  isExpired: (key: CacheKey) => boolean;

  // Performance tracking
  hits: number;
  misses: number;
}

// Helper to get cache config for a key
function getCacheConfig(key: CacheKey): CacheConfig {
  const type = key.split(":")[0];
  return CACHE_CONFIGS[type] || { ttl: 5 * 60 * 1000, version: "1.0" };
}

// Calculate cache entry size (rough estimate)
function calculateSize(data: any): number {
  try {
    return JSON.stringify(data).length;
  } catch {
    return 1000; // Default size if can't stringify
  }
}

export const useCacheStore = create<CacheState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        cache: {},
        hits: 0,
        misses: 0,

        get: <T>(key: CacheKey): T | null => {
          console.log(`[Cache] GET ${key}`);
          const entry = get().cache[key];

          if (!entry) {
            console.log(`[Cache] MISS ${key} - not found`);
            set((state) => ({ misses: state.misses + 1 }));
            return null;
          }

          const config = getCacheConfig(key);
          const now = Date.now();

          // Check version compatibility
          if (entry.version !== config.version) {
            console.log(`[Cache] MISS ${key} - version mismatch`);
            get().remove(key);
            set((state) => ({ misses: state.misses + 1 }));
            return null;
          }

          // Check expiration
          const isExpired = entry.expiresAt
            ? now > entry.expiresAt
            : now - entry.timestamp > config.ttl;
          if (isExpired) {
            console.log(`[Cache] MISS ${key} - expired`);
            get().remove(key);
            set((state) => ({ misses: state.misses + 1 }));
            return null;
          }

          console.log(`[Cache] HIT ${key}`);
          set((state) => ({ hits: state.hits + 1 }));
          return entry.data;
        },

        set: <T>(key: CacheKey, data: T, customTtl?: number): void => {
          console.log(`[Cache] SET ${key}`, {
            dataType: typeof data,
            size: calculateSize(data),
          });
          const config = getCacheConfig(key);
          const now = Date.now();
          const ttl = customTtl || config.ttl;

          const newEntry: CacheEntry<T> = {
            data,
            timestamp: now,
            expiresAt: now + ttl,
            version: config.version,
          };

          set((state) => ({
            cache: {
              ...state.cache,
              [key]: newEntry,
            },
          }));
        },

        remove: (key: CacheKey): void => {
          console.log(`[Cache] REMOVE ${key}`);
          set((state) => {
            const newCache = { ...state.cache };
            delete newCache[key];
            return { cache: newCache };
          });
        },

        clear: (): void => {
          console.log(`[Cache] CLEAR ALL`);
          set({ cache: {}, hits: 0, misses: 0 });
        },

        invalidatePattern: (pattern: string): void => {
          console.log(`[Cache] INVALIDATE PATTERN ${pattern}`);
          const regex = new RegExp(pattern);
          set((state) => {
            const newCache = { ...state.cache };
            Object.keys(newCache).forEach((key) => {
              if (regex.test(key)) {
                console.log(`[Cache] INVALIDATED ${key}`);
                delete newCache[key as string];
              }
            });
            return { cache: newCache };
          });
        },

        isExpired: (key: CacheKey): boolean => {
          const entry = get().cache[key];
          if (!entry) return true;

          const config = getCacheConfig(key);
          const now = Date.now();

          return entry.expiresAt
            ? now > entry.expiresAt
            : now - entry.timestamp > config.ttl;
        },

        cleanup: (): void => {
          console.log(`[Cache] CLEANUP starting`);
          const now = Date.now();
          let cleanedCount = 0;

          set((state) => {
            const newCache = { ...state.cache };
            Object.entries(newCache).forEach(([key, entry]) => {
              if (!entry) return;
              const config = getCacheConfig(key as CacheKey);
              const isExpired = entry.expiresAt
                ? now > entry.expiresAt
                : now - entry.timestamp > config.ttl;
              const isVersionMismatch = entry.version !== config.version;

              if (isExpired || isVersionMismatch) {
                delete newCache[key as string];
                cleanedCount++;
              }
            });
            return { cache: newCache };
          });

          console.log(
            `[Cache] CLEANUP completed - removed ${cleanedCount} entries`
          );
        },

        getStats: () => {
          const cache = get().cache;
          const hits = get().hits;
          const misses = get().misses;
          const entries = Object.values(cache).filter(Boolean);
          const now = Date.now();

          const expired = entries.filter((entry) => {
            const config = getCacheConfig(
              Object.keys(cache).find((k) => cache[k] === entry) as CacheKey
            );
            return entry.expiresAt
              ? now > entry.expiresAt
              : now - entry.timestamp > config.ttl;
          }).length;

          const totalSize = entries.reduce(
            (acc, entry) => acc + calculateSize(entry.data),
            0
          );
          const hitRate = hits + misses > 0 ? hits / (hits + misses) : 0;

          return {
            totalEntries: entries.length,
            expiredEntries: expired,
            cacheHitRate: Math.round(hitRate * 100) / 100,
            totalSize,
          };
        },
      }),
      {
        name: "cognify-cache",
        partialize: (state) => ({
          cache: state.cache,
          hits: state.hits,
          misses: state.misses,
        }),
        version: 1,
        migrate: (persistedState: any, version: number) => {
          console.log(`[Cache] Migration from version ${version}`);
          if (version < 1) {
            // Clear cache on version upgrade
            return {
              cache: {},
              hits: 0,
              misses: 0,
            };
          }
          return persistedState;
        },
      }
    )
  )
);

// Auto-cleanup every 5 minutes
if (typeof window !== "undefined") {
  setInterval(() => {
    useCacheStore.getState().cleanup();
  }, 5 * 60 * 1000);
}

// Generic cache-aware data fetcher
export async function cachedFetch<T>(
  key: CacheKey,
  fetcher: () => Promise<T>,
  options?: {
    ttl?: number;
    forceRefresh?: boolean;
    onCacheHit?: (data: T) => void;
    onCacheMiss?: () => void;
  }
): Promise<T> {
  const cache = useCacheStore.getState();

  // Check cache first unless forced refresh
  if (!options?.forceRefresh) {
    const cached = cache.get<T>(key);
    if (cached !== null) {
      options?.onCacheHit?.(cached);
      return cached;
    }
  }

  // Cache miss - fetch fresh data
  console.log(`[Cache] Fetching fresh data for ${key}`);
  options?.onCacheMiss?.();

  try {
    const data = await fetcher();
    cache.set(key, data, options?.ttl);
    return data;
  } catch (error) {
    console.error(`[Cache] Error fetching ${key}:`, error);

    // Enhanced error logging for database issues
    if (error && typeof error === "object") {
      const dbError = error as any;
      if (dbError.code) {
        console.error(`[Cache] Database error code: ${dbError.code}`);
      }
      if (dbError.message) {
        console.error(`[Cache] Database error message: ${dbError.message}`);
      }
      if (dbError.details) {
        console.error(`[Cache] Database error details: ${dbError.details}`);
      }
      if (dbError.hint) {
        console.error(`[Cache] Database error hint: ${dbError.hint}`);
      }
    }

    throw error;
  }
}

// Cache invalidation helpers
export const CacheInvalidation = {
  // Project-related invalidations
  onProjectUpdate: (projectId: string) => {
    const cache = useCacheStore.getState();
    cache.remove("projects");
    cache.remove(`project:${projectId}` as CacheKey);
    cache.invalidatePattern(`study_stats:.*:${projectId}`);
  },

  onProjectDelete: (projectId: string) => {
    const cache = useCacheStore.getState();
    cache.remove("projects");
    cache.remove(`project:${projectId}` as CacheKey);
    cache.remove(`flashcards:${projectId}` as CacheKey);
    cache.remove(`srs_states:${projectId}` as CacheKey);
    cache.invalidatePattern(`study_stats:.*:${projectId}`);
  },

  // Flashcard-related invalidations
  onFlashcardUpdate: (projectId: string) => {
    const cache = useCacheStore.getState();
    cache.remove(`flashcards:${projectId}` as CacheKey);
    cache.remove(`srs_states:${projectId}` as CacheKey);
    cache.invalidatePattern(`study_stats:.*:${projectId}`);
  },

  // SRS-related invalidations
  onSRSUpdate: (projectId: string, userId: string) => {
    const cache = useCacheStore.getState();
    cache.remove(`srs_states:${projectId}` as CacheKey);
    cache.invalidatePattern(`study_stats:${userId}:.*`);
    cache.invalidatePattern(`daily_stats:${userId}:.*`);
  },

  // Settings invalidations
  onSettingsUpdate: (userId: string) => {
    const cache = useCacheStore.getState();
    cache.remove(`user_settings:${userId}` as CacheKey);
  },

  // Profile invalidations
  onProfileUpdate: (userId: string) => {
    const cache = useCacheStore.getState();
    cache.remove(`user_profile:${userId}` as CacheKey);
  },

  // Notification invalidations
  onNotificationUpdate: (userId: string) => {
    const cache = useCacheStore.getState();
    cache.remove(`notifications:${userId}` as CacheKey);
  },
};

// Hook for cache statistics (useful for debugging)
export function useCacheStats() {
  const store = useCacheStore();

  return React.useMemo(() => {
    const cache = store.cache;
    const hits = store.hits;
    const misses = store.misses;
    const entries = Object.values(cache).filter(Boolean);
    const now = Date.now();

    const expired = entries.filter((entry) => {
      const config = getCacheConfig(
        Object.keys(cache).find((k) => cache[k] === entry) as CacheKey
      );
      return entry.expiresAt
        ? now > entry.expiresAt
        : now - entry.timestamp > config.ttl;
    }).length;

    const totalSize = entries.reduce(
      (acc, entry) => acc + calculateSize(entry.data),
      0
    );
    const hitRate = hits + misses > 0 ? hits / (hits + misses) : 0;

    return {
      totalEntries: entries.length,
      expiredEntries: expired,
      cacheHitRate: Math.round(hitRate * 100) / 100,
      totalSize,
    };
  }, [store.cache, store.hits, store.misses]);
}

// Hook for cache management
export function useCacheManagement() {
  return useCacheStore((state) => ({
    clear: state.clear,
    cleanup: state.cleanup,
    invalidatePattern: state.invalidatePattern,
  }));
}
