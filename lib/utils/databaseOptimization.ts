/**
 * Database Performance Optimization Utilities
 * Query optimization, caching, and performance monitoring for Supabase
 */

import { createClient } from "@/lib/supabase/server";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

// Performance monitoring types
export interface QueryPerformanceMetrics {
  query: string;
  duration: number;
  timestamp: Date;
  rowsAffected?: number;
  cacheHit?: boolean;
}

// In-memory query performance store (replace with proper monitoring in production)
const queryMetrics: QueryPerformanceMetrics[] = [];
const MAX_METRICS = 1000; // Keep last 1000 queries

// Query result cache (in-memory, replace with Redis in production)
const queryCache = new Map<string, { data: unknown; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes default

/**
 * Optimized Database Client with Performance Monitoring
 */
export class OptimizedSupabaseClient {
  private isServer: boolean;

  constructor(isServer = true) {
    this.isServer = isServer;
  }

  /**
   * Execute query with performance monitoring
   */
  async executeQuery<T>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    queryFn: (client: SupabaseClient) => Promise<any>,
    cacheKey?: string,
    cacheTTL = CACHE_TTL
  ): Promise<{
    data: T | null;
    error: unknown;
    count?: number;
    performance: QueryPerformanceMetrics;
  }> {
    const startTime = Date.now();

    // Check cache first if cache key provided
    if (cacheKey) {
      const cached = queryCache.get(cacheKey);
      if (cached && cached.expiry > Date.now()) {
        const performance: QueryPerformanceMetrics = {
          query: cacheKey,
          duration: 0,
          timestamp: new Date(),
          cacheHit: true,
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
      const supabaseClient = this.isServer
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
      };

      this.recordMetrics(performance);

      // Cache successful results if cache key provided
      if (cacheKey && result.data && !result.error) {
        queryCache.set(cacheKey, {
          data: result,
          expiry: Date.now() + cacheTTL,
        });
      }

      return { ...result, performance };
    } catch (error) {
      const duration = Date.now() - startTime;
      const performance: QueryPerformanceMetrics = {
        query: cacheKey || "failed_query",
        duration,
        timestamp: new Date(),
        cacheHit: false,
      };

      this.recordMetrics(performance);

      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
        performance,
      };
    }
  }

  /**
   * Record query performance metrics
   */
  private recordMetrics(metrics: QueryPerformanceMetrics) {
    queryMetrics.push(metrics);

    // Keep only recent metrics
    if (queryMetrics.length > MAX_METRICS) {
      queryMetrics.splice(0, queryMetrics.length - MAX_METRICS);
    }

    // Log slow queries
    if (metrics.duration > 1000) {
      console.warn(
        `Slow query detected: ${metrics.query} took ${metrics.duration}ms`
      );
    }
  }

  /**
   * Get query performance statistics
   */
  getPerformanceStats(): {
    totalQueries: number;
    averageQueryTime: number;
    slowQueries: QueryPerformanceMetrics[];
    cacheHitRate: number;
    recentQueries: QueryPerformanceMetrics[];
  } {
    const totalQueries = queryMetrics.length;
    const averageQueryTime =
      totalQueries > 0
        ? queryMetrics.reduce((sum, m) => sum + m.duration, 0) / totalQueries
        : 0;

    const slowQueries = queryMetrics.filter((m) => m.duration > 1000);
    const cachedQueries = queryMetrics.filter((m) => m.cacheHit).length;
    const cacheHitRate =
      totalQueries > 0 ? (cachedQueries / totalQueries) * 100 : 0;

    return {
      totalQueries,
      averageQueryTime,
      slowQueries,
      cacheHitRate,
      recentQueries: queryMetrics.slice(-10), // Last 10 queries
    };
  }

  /**
   * Clear query cache
   */
  clearCache() {
    queryCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: queryCache.size,
      entries: Array.from(queryCache.keys()),
    };
  }
}

/**
 * Optimized query patterns for common operations
 */
export class OptimizedQueries {
  private db: OptimizedSupabaseClient;

  constructor(isServer = true) {
    this.db = new OptimizedSupabaseClient(isServer);
  }

  /**
   * Get user projects with optimized query
   */
  async getUserProjects(userId: string, includeStats = false) {
    const cacheKey = `user_projects_${userId}_${includeStats}`;

    return this.db.executeQuery(
      async (client) => {
        const query = client
          .from("projects")
          .select(
            includeStats
              ? `
              *,
              flashcards:flashcards(count),
              due_cards:srs_states(count).gte.next_review, ${new Date().toISOString()}
            `
              : "*"
          )
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        return await query;
      },
      cacheKey,
      2 * 60 * 1000 // 2 minute cache for projects
    );
  }

  /**
   * Get project flashcards with pagination and filtering
   */
  async getProjectFlashcards(
    projectId: string,
    options: {
      page?: number;
      pageSize?: number;
      search?: string;
      tags?: string[];
      sortBy?: "created_at" | "updated_at" | "difficulty";
      sortOrder?: "asc" | "desc";
    } = {}
  ) {
    const {
      page = 0,
      pageSize = 50,
      search,
      tags,
      sortBy = "created_at",
      sortOrder = "desc",
    } = options;

    const cacheKey =
      search || tags?.length
        ? undefined // Don't cache filtered results
        : `project_flashcards_${projectId}_${page}_${pageSize}_${sortBy}_${sortOrder}`;

    return this.db.executeQuery(
      async (client) => {
        let query = client
          .from("flashcards")
          .select("*, srs_states(*)")
          .eq("project_id", projectId);

        // Apply search filter
        if (search) {
          query = query.or(
            `question.ilike.%${search}%,answer.ilike.%${search}%`
          );
        }

        // Apply tag filter
        if (tags && tags.length > 0) {
          query = query.overlaps("tags", tags);
        }

        // Apply sorting
        query = query.order(sortBy, { ascending: sortOrder === "asc" });

        // Apply pagination
        const from = page * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);

        return await query;
      },
      cacheKey,
      30 * 1000 // 30 second cache for flashcards
    );
  }

  /**
   * Get due flashcards for study session (optimized)
   */
  async getDueFlashcards(userId: string, projectId?: string, limit = 20) {
    // Don't cache due cards as they change frequently
    return this.db.executeQuery(async (client) => {
      let query = client
        .from("srs_states")
        .select(
          `
            *,
            flashcard:flashcards(*),
            project:flashcards(project:projects(*))
          `
        )
        .eq("user_id", userId)
        .lte("next_review", new Date().toISOString());

      if (projectId) {
        query = query.eq("flashcards.project_id", projectId);
      }

      return await query.order("next_review", { ascending: true }).limit(limit);
    });
  }

  /**
   * Get user study statistics (cached)
   */
  async getUserStudyStats(userId: string, days = 30) {
    const cacheKey = `user_stats_${userId}_${days}`;

    return this.db.executeQuery(
      async (client) => {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);

        return await client
          .from("daily_study_stats")
          .select("*")
          .eq("user_id", userId)
          .gte("date", startDate.toISOString().split("T")[0])
          .lte("date", endDate.toISOString().split("T")[0])
          .order("date", { ascending: true });
      },
      cacheKey,
      5 * 60 * 1000 // 5 minute cache for stats
    );
  }

  /**
   * Batch update SRS states (optimized for bulk operations)
   */
  async batchUpdateSRSStates(
    updates: Array<{
      id: string;
      next_review: string;
      interval: number;
      ease_factor: number;
      repetitions: number;
    }>
  ) {
    return this.db.executeQuery(async (client) => {
      // Use upsert for better performance with bulk operations
      return await client.from("srs_states").upsert(updates).select();
    });
  }
}

/**
 * Database Health Monitor
 */
export class DatabaseHealthMonitor {
  private optimizedDb: OptimizedSupabaseClient;

  constructor() {
    this.optimizedDb = new OptimizedSupabaseClient();
  }

  /**
   * Check database connection health
   */
  async checkHealth(): Promise<{
    healthy: boolean;
    responseTime: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      const result = await this.optimizedDb.executeQuery(
        async (client) => await client.from("profiles").select("id").limit(1)
      );

      const responseTime = Date.now() - startTime;

      return {
        healthy: !result.error,
        responseTime,
        error: result.error ? String(result.error) : undefined,
      };
    } catch (error) {
      return {
        healthy: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get comprehensive database performance report
   */
  async getPerformanceReport() {
    const healthCheck = await this.checkHealth();
    const queryStats = this.optimizedDb.getPerformanceStats();
    const cacheStats = this.optimizedDb.getCacheStats();

    return {
      health: healthCheck,
      queryPerformance: queryStats,
      cache: cacheStats,
      recommendations: this.generateRecommendations(queryStats),
    };
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(
    stats: ReturnType<OptimizedSupabaseClient["getPerformanceStats"]>
  ): string[] {
    const recommendations: string[] = [];

    if (stats.averageQueryTime > 500) {
      recommendations.push(
        "Average query time is high. Consider adding database indexes."
      );
    }

    if (stats.slowQueries.length > stats.totalQueries * 0.1) {
      recommendations.push(
        "High number of slow queries detected. Review and optimize query patterns."
      );
    }

    if (stats.cacheHitRate < 50) {
      recommendations.push(
        "Low cache hit rate. Consider increasing cache TTL for frequently accessed data."
      );
    }

    if (stats.totalQueries > 1000) {
      recommendations.push(
        "High query volume. Consider implementing connection pooling."
      );
    }

    return recommendations.length > 0
      ? recommendations
      : ["Database performance looks good!"];
  }
}

/**
 * Suggested database indexes for optimal performance
 */
export const RECOMMENDED_INDEXES = {
  // Core user data indexes
  profiles: [
    "CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at)",
  ],

  projects: [
    "CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at)",
    "CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category)",
  ],

  flashcards: [
    "CREATE INDEX IF NOT EXISTS idx_flashcards_project_id ON flashcards(project_id)",
    "CREATE INDEX IF NOT EXISTS idx_flashcards_created_at ON flashcards(created_at)",
    "CREATE INDEX IF NOT EXISTS idx_flashcards_tags ON flashcards USING GIN (tags)",
  ],

  srs_states: [
    "CREATE INDEX IF NOT EXISTS idx_srs_states_user_id ON srs_states(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_srs_states_next_review ON srs_states(next_review)",
    "CREATE INDEX IF NOT EXISTS idx_srs_states_flashcard_id ON srs_states(flashcard_id)",
    "CREATE INDEX IF NOT EXISTS idx_srs_states_due ON srs_states(user_id, next_review) WHERE next_review <= NOW()",
  ],

  daily_study_stats: [
    "CREATE INDEX IF NOT EXISTS idx_daily_study_stats_user_date ON daily_study_stats(user_id, date)",
    "CREATE INDEX IF NOT EXISTS idx_daily_study_stats_date ON daily_study_stats(date)",
  ],

  study_sessions: [
    "CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_study_sessions_created_at ON study_sessions(created_at)",
  ],
};

// Export singleton instances
export const optimizedDb = new OptimizedSupabaseClient();
export const optimizedQueries = new OptimizedQueries();
export const dbHealthMonitor = new DatabaseHealthMonitor();
