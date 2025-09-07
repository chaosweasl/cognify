/**
 * Database Performance Optimization Utilities
 * Clean implementation focusing on query optimization and caching
 */

import { createClient } from "@/lib/supabase/server";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import type { SupabaseClient, PostgrestSingleResponse } from "@supabase/supabase-js";

// Performance monitoring types
export interface QueryPerformanceMetrics {
  query: string;
  duration: number;
  timestamp: Date;
  rowsAffected?: number;
  cacheHit?: boolean;
  queryType?: "select" | "insert" | "update" | "delete";
}

// Query result cache (in-memory, replace with Redis in production)
const queryCache = new Map<string, { data: unknown; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes default
const MAX_CACHE_SIZE = 1000;

/**
 * Clean up expired cache entries and enforce size limits
 */
function cleanupCache(): void {
  const now = Date.now();

  // Remove expired entries
  for (const [key, value] of queryCache.entries()) {
    if (value.expiry <= now) {
      queryCache.delete(key);
    }
  }

  // Enforce size limit by removing oldest entries
  if (queryCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(queryCache.entries());
    entries.sort((a, b) => a[1].expiry - b[1].expiry);
    const toRemove = entries.slice(0, queryCache.size - MAX_CACHE_SIZE);
    toRemove.forEach(([key]) => queryCache.delete(key));
  }
}

/**
 * Execute query with caching and performance monitoring
 */
export async function executeOptimizedQuery<T>(
  queryFn: (client: SupabaseClient) => Promise<PostgrestSingleResponse<T>>,
  options: {
    cacheKey?: string;
    cacheTTL?: number;
    isServer?: boolean;
  } = {}
): Promise<{
  data: T | null;
  error: unknown;
  count?: number;
  performance: QueryPerformanceMetrics;
}> {
  const { cacheKey, cacheTTL = CACHE_TTL, isServer = true } = options;
  const startTime = Date.now();

  // Periodically clean up cache
  if (Math.random() < 0.1) {
    cleanupCache();
  }

  // Check cache first if cache key provided
  if (cacheKey) {
    const cached = queryCache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      const performance: QueryPerformanceMetrics = {
        query: cacheKey,
        duration: 0,
        timestamp: new Date(),
        cacheHit: true,
        queryType: "select",
      };
      return {
        data: cached.data as T,
        error: null,
        count: undefined,
        performance,
      };
    }
  }

  try {
    const supabaseClient = isServer
      ? await createClient()
      : createBrowserClient();

    const result = await queryFn(supabaseClient);
    const duration = Date.now() - startTime;

    // Record performance metrics
    const performance: QueryPerformanceMetrics = {
      query: cacheKey || "unnamed_query",
      duration,
      timestamp: new Date(),
      rowsAffected: result.count || (result.data ? 1 : 0),
      cacheHit: false,
      queryType: "select", // Default, could be enhanced
    };

    // Cache successful results if cache key provided
    if (cacheKey && result.data && !result.error) {
      queryCache.set(cacheKey, {
        data: result,
        expiry: Date.now() + cacheTTL,
      });
    }

    return { 
      data: result.data, 
      error: result.error, 
      count: result.count || undefined, 
      performance 
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const performance: QueryPerformanceMetrics = {
      query: cacheKey || "unnamed_query",
      duration,
      timestamp: new Date(),
      cacheHit: false,
      queryType: "select",
    };

    return {
      data: null,
      error,
      performance,
    };
  }
}

/**
 * Clear cache entries matching pattern
 */
export function clearCachePattern(pattern: string): void {
  const regex = new RegExp(pattern);
  for (const key of queryCache.keys()) {
    if (regex.test(key)) {
      queryCache.delete(key);
    }
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  const now = Date.now();
  let expired = 0;

  for (const [, value] of queryCache.entries()) {
    if (value.expiry <= now) {
      expired++;
    }
  }

  return {
    totalEntries: queryCache.size,
    expiredEntries: expired,
    activeEntries: queryCache.size - expired,
    memoryUsage: queryCache.size * 1024, // Rough estimate
  };
}

/**
 * Optimized query helpers for common operations
 */
export class OptimizedQueries {
  /**
   * Get user projects with basic caching
   */
  static async getUserProjects(userId: string) {
    return executeOptimizedQuery(
      async (client) => {
        return await client
          .from("projects")
          .select(
            `
            id, name, description, created_at, updated_at,
            new_cards_per_day, max_reviews_per_day
          `
          )
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
      },
      {
        cacheKey: `user_projects_${userId}`,
        cacheTTL: 2 * 60 * 1000, // 2 minutes
      }
    );
  }

  /**
   * Get flashcards for project with caching
   */
  static async getFlashcardsByProject(projectId: string) {
    return executeOptimizedQuery(
      async (client) => {
        return await client
          .from("flashcards")
          .select("*")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false });
      },
      {
        cacheKey: `project_flashcards_${projectId}`,
        cacheTTL: 5 * 60 * 1000, // 5 minutes
      }
    );
  }

  /**
   * Get due cards with short cache
   */
  static async getDueCards(userId: string, projectId: string, limit = 50) {
    return executeOptimizedQuery(
      async (client) => {
        return await client.rpc("get_due_cards", {
          p_user_id: userId,
          p_project_id: projectId,
          p_limit: limit,
        });
      },
      {
        cacheKey: `due_cards_${userId}_${projectId}`,
        cacheTTL: 30 * 1000, // 30 seconds
      }
    );
  }

  /**
   * Batch operations should not be cached
   */
  static async batchUpsertSRSStates(
    srsUpdates: Array<{
      card_id: string;
      user_id: string;
      project_id: string;
      state: string;
      due: string;
      card_interval: number;
      ease: number;
      repetitions: number;
      lapses: number;
      last_reviewed: string;
    }>
  ) {
    return executeOptimizedQuery(
      async (client) => {
        // Use upsert for better performance than individual updates
        return await client.from("srs_states").upsert(srsUpdates, {
          onConflict: "card_id,user_id",
          ignoreDuplicates: false,
        });
      },
      {
        // No caching for mutations
      }
    );
  }
}

/**
 * Recommended database indexes for optimal performance
 * These should be applied manually in Supabase SQL editor
 */
export const RECOMMENDED_INDEXES = {
  profiles: [
    "CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);",
  ],

  projects: [
    "CREATE INDEX IF NOT EXISTS idx_projects_user_id_created_at ON projects(user_id, created_at DESC);",
    "CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at);",
  ],

  flashcards: [
    "CREATE INDEX IF NOT EXISTS idx_flashcards_project_id ON flashcards(project_id);",
    "CREATE INDEX IF NOT EXISTS idx_flashcards_created_at ON flashcards(created_at);",
    "CREATE INDEX IF NOT EXISTS idx_flashcards_updated_at ON flashcards(updated_at);",
    "CREATE INDEX IF NOT EXISTS idx_flashcards_is_ai_generated ON flashcards(is_ai_generated);",
  ],

  srs_states: [
    "CREATE INDEX IF NOT EXISTS idx_srs_states_user_id_project_id ON srs_states(user_id, project_id);",
    "CREATE INDEX IF NOT EXISTS idx_srs_states_due_state ON srs_states(due, state);",
    "CREATE INDEX IF NOT EXISTS idx_srs_states_card_id ON srs_states(card_id);",
    "CREATE INDEX IF NOT EXISTS idx_srs_states_last_reviewed ON srs_states(last_reviewed);",
    "CREATE INDEX IF NOT EXISTS idx_srs_states_suspended ON srs_states(is_suspended);",
  ],

  study_sessions: [
    "CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id_created_at ON study_sessions(user_id, created_at DESC);",
    "CREATE INDEX IF NOT EXISTS idx_study_sessions_project_id ON study_sessions(project_id);",
    "CREATE INDEX IF NOT EXISTS idx_study_sessions_active ON study_sessions(is_active);",
  ],

  daily_study_stats: [
    "CREATE INDEX IF NOT EXISTS idx_daily_stats_user_id_date ON daily_study_stats(user_id, study_date DESC);",
    "CREATE INDEX IF NOT EXISTS idx_daily_stats_project_id_date ON daily_study_stats(project_id, study_date DESC);",
    "CREATE INDEX IF NOT EXISTS idx_daily_stats_created_at ON daily_study_stats(created_at);",
  ],

  user_notifications: [
    "CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id_created ON user_notifications(user_id, created_at DESC);",
    "CREATE INDEX IF NOT EXISTS idx_user_notifications_read ON user_notifications(is_read);",
  ],
};

/**
 * Performance monitoring utilities
 */
export const PerformanceMonitor = {
  /**
   * Clear all cached data
   */
  clearAllCache(): void {
    queryCache.clear();
  },

  /**
   * Get cache statistics
   */
  getCacheStats,

  /**
   * Clear specific cache pattern
   */
  clearCachePattern,

  /**
   * Check if caching is working
   */
  isCacheHealthy(): boolean {
    const stats = getCacheStats();
    return stats.expiredEntries / stats.totalEntries < 0.5; // Less than 50% expired
  },
};
