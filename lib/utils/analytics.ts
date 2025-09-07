/**
 * Analytics and Monitoring System
 * Comprehensive analytics, system health monitoring, and error tracking
 */

import { createClient } from "@/lib/supabase/client";

// Analytics event types
export enum AnalyticsEventType {
  // User events
  USER_LOGIN = "user_login",
  USER_LOGOUT = "user_logout",
  USER_SIGNUP = "user_signup",

  // Study events
  STUDY_SESSION_START = "study_session_start",
  STUDY_SESSION_END = "study_session_end",
  FLASHCARD_REVIEWED = "flashcard_reviewed",

  // Project events
  PROJECT_CREATED = "project_created",
  PROJECT_UPDATED = "project_updated",
  PROJECT_DELETED = "project_deleted",

  // Flashcard events
  FLASHCARD_CREATED = "flashcard_created",
  FLASHCARD_UPDATED = "flashcard_updated",
  FLASHCARD_DELETED = "flashcard_deleted",

  // AI events
  AI_FLASHCARDS_GENERATED = "ai_flashcards_generated",
  AI_PROMPT_USED = "ai_prompt_used",
  PDF_UPLOADED = "pdf_uploaded",

  // System events
  ERROR_OCCURRED = "error_occurred",
  PAGE_VIEW = "page_view",
  FEATURE_USED = "feature_used",
}

// System health metrics
export interface SystemHealthMetrics {
  timestamp: Date;

  // Database metrics
  database: {
    responseTime: number;
    activeConnections: number;
    errorRate: number;
    slowQueries: number;
  };

  // Application metrics
  application: {
    memoryUsage: number;
    activeUsers: number;
    requestsPerMinute: number;
    averageResponseTime: number;
  };

  // Feature metrics
  features: {
    studySessions: number;
    flashcardsReviewed: number;
    projectsCreated: number;
    aiGenerations: number;
  };

  // Error metrics
  errors: {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
  };
}

// User analytics data
export interface UserAnalytics {
  userId: string;
  timeframe: "day" | "week" | "month" | "year";

  // Study metrics
  studyTime: number;
  sessionsCompleted: number;
  flashcardsReviewed: number;
  averageSessionLength: number;
  streakDays: number;

  // Performance metrics
  accuracyRate: number;
  averageResponseTime: number;
  difficultCards: number;
  masteredCards: number;

  // Engagement metrics
  projectsCreated: number;
  activeProjects: number;
  lastActiveDate: Date;
  retentionScore: number;

  // AI usage metrics
  aiGenerationsUsed: number;
  tokensConsumed: number;
  pdfUploads: number;
}

/**
 * Analytics Service
 * Handle event tracking and data collection
 */
export class AnalyticsService {
  private static instance: AnalyticsService;
  private events: Array<{
    type: AnalyticsEventType;
    data: Record<string, unknown>;
    timestamp: Date;
    userId?: string;
    sessionId: string;
  }> = [];

  private sessionId: string;
  private userId?: string;

  private constructor() {
    this.sessionId = this.generateSessionId();
  }

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Track an analytics event
   */
  track(type: AnalyticsEventType, data: Record<string, unknown> = {}) {
    const event = {
      type,
      data: {
        ...data,
        url: typeof window !== "undefined" ? window.location.href : undefined,
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        timestamp: Date.now(),
      },
      timestamp: new Date(),
      userId: this.userId,
      sessionId: this.sessionId,
    };

    this.events.push(event);

    // Log in development
    if (process.env.NODE_ENV === "development") {
      console.log("📊 Analytics:", type, data);
    }

    // Send to analytics service in production
    if (process.env.NODE_ENV === "production") {
      this.sendToAnalyticsService(event);
    }

    // Store locally for offline analytics
    this.storeEventLocally(event);

    // Clean up old events
    if (this.events.length > 1000) {
      this.events = this.events.slice(-500);
    }
  }

  private async sendToAnalyticsService(event: {
    type: AnalyticsEventType;
    data: Record<string, unknown>;
    timestamp: Date;
    userId?: string;
    sessionId: string;
  }) {
    try {
      // Example: Send to external analytics service
      // await fetch('/api/analytics', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(event)
      // })

      console.log("[ANALYTICS SERVICE]", event);
    } catch (error) {
      console.error("Failed to send analytics event:", error);
    }
  }

  private storeEventLocally(event: {
    type: AnalyticsEventType;
    data: Record<string, unknown>;
    timestamp: Date;
    userId?: string;
    sessionId: string;
  }) {
    try {
      if (typeof localStorage === "undefined") return;

      const key = "cognify_analytics_events";
      const stored = localStorage.getItem(key);
      const events = stored ? JSON.parse(stored) : [];

      events.push(event);

      // Keep only recent events (last 100)
      const recentEvents = events.slice(-100);
      localStorage.setItem(key, JSON.stringify(recentEvents));
    } catch (error) {
      console.error("Failed to store analytics event locally:", error);
    }
  }

  /**
   * Get analytics summary
   */
  getSummary() {
    const totalEvents = this.events.length;
    const eventsByType = this.events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const uniqueUsers = new Set(
      this.events.map((e) => e.userId).filter(Boolean)
    ).size;

    return {
      totalEvents,
      eventsByType,
      uniqueUsers,
      sessionId: this.sessionId,
      userId: this.userId,
    };
  }

  /**
   * Get events for a specific timeframe
   */
  getEventsForTimeframe(hours: number) {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.events.filter((event) => event.timestamp > cutoff);
  }
}

/**
 * System Health Monitor
 */
export class SystemHealthMonitor {
  private static instance: SystemHealthMonitor;
  private healthChecks: Array<{
    name: string;
    check: () => Promise<boolean>;
    lastStatus: boolean;
    lastCheck: Date;
  }> = [];

  private metrics: SystemHealthMetrics[] = [];

  private constructor() {
    this.registerDefaultHealthChecks();
  }

  static getInstance(): SystemHealthMonitor {
    if (!SystemHealthMonitor.instance) {
      SystemHealthMonitor.instance = new SystemHealthMonitor();
    }
    return SystemHealthMonitor.instance;
  }

  private registerDefaultHealthChecks() {
    // Database health check
    this.registerHealthCheck("database", async () => {
      try {
        const supabase = await createClient();
        const { error } = await supabase.from("profiles").select("id").limit(1);
        return !error;
      } catch {
        return false;
      }
    });

    // Memory health check
    this.registerHealthCheck("memory", async () => {
      if (typeof performance !== "undefined" && "memory" in performance) {
        const memory = (
          performance as Performance & {
            memory: {
              usedJSHeapSize: number;
              totalJSHeapSize: number;
            };
          }
        ).memory;
        const usedMemory = memory.usedJSHeapSize / memory.totalJSHeapSize;
        return usedMemory < 0.9; // Less than 90% memory usage
      }
      return true;
    });

    // Local storage health check
    this.registerHealthCheck("localStorage", async () => {
      try {
        if (typeof localStorage === "undefined") return true;
        localStorage.setItem("test", "test");
        localStorage.removeItem("test");
        return true;
      } catch {
        return false;
      }
    });
  }

  registerHealthCheck(name: string, check: () => Promise<boolean>) {
    this.healthChecks.push({
      name,
      check,
      lastStatus: true,
      lastCheck: new Date(),
    });
  }

  async runHealthChecks(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    for (const healthCheck of this.healthChecks) {
      try {
        const status = await healthCheck.check();
        healthCheck.lastStatus = status;
        healthCheck.lastCheck = new Date();
        results[healthCheck.name] = status;
      } catch (error) {
        healthCheck.lastStatus = false;
        healthCheck.lastCheck = new Date();
        results[healthCheck.name] = false;
        console.error(`Health check failed for ${healthCheck.name}:`, error);
      }
    }

    return results;
  }

  getHealthStatus() {
    return this.healthChecks.reduce((acc, check) => {
      acc[check.name] = {
        status: check.lastStatus,
        lastCheck: check.lastCheck,
      };
      return acc;
    }, {} as Record<string, { status: boolean; lastCheck: Date }>);
  }

  async collectMetrics(): Promise<SystemHealthMetrics> {
    await this.runHealthChecks();

    const metrics: SystemHealthMetrics = {
      timestamp: new Date(),

      database: {
        responseTime: await this.measureDatabaseResponseTime(),
        activeConnections: 0, // Would need to query database for this
        errorRate: await this.getErrorRate(),
        slowQueries: 0, // From database performance monitoring
      },

      application: {
        memoryUsage: this.getMemoryUsage(),
        activeUsers: await this.getActiveUsersCount(),
        requestsPerMinute: this.getRequestsPerMinute(),
        averageResponseTime: 0, // From request timing
      },

      features: {
        studySessions: this.countRecentEvents(
          AnalyticsEventType.STUDY_SESSION_START
        ),
        flashcardsReviewed: this.countRecentEvents(
          AnalyticsEventType.FLASHCARD_REVIEWED
        ),
        projectsCreated: this.countRecentEvents(
          AnalyticsEventType.PROJECT_CREATED
        ),
        aiGenerations: this.countRecentEvents(
          AnalyticsEventType.AI_FLASHCARDS_GENERATED
        ),
      },

      errors: {
        total: this.countRecentEvents(AnalyticsEventType.ERROR_OCCURRED),
        byType: {},
        bySeverity: {},
      },
    };

    this.metrics.push(metrics);

    // Keep only recent metrics
    if (this.metrics.length > 288) {
      // 24 hours of 5-minute intervals
      this.metrics = this.metrics.slice(-144); // Keep 12 hours
    }

    // Store metrics in database
    if (typeof window === "undefined") {
      // Only on server
      try {
        const { SystemHealthDB } = await import("@/lib/utils/analyticsDB");
        await SystemHealthDB.recordMetrics({
          database_response_time: metrics.database.responseTime,
          memory_usage: metrics.application.memoryUsage,
          active_users: metrics.application.activeUsers,
          requests_per_minute: metrics.application.requestsPerMinute,
          error_count: metrics.errors.total,
          metrics: {
            features: metrics.features,
            database: metrics.database,
            application: metrics.application,
          },
        });
      } catch (error) {
        console.error("Failed to store health metrics in database:", error);
      }
    }

    return metrics;
  }

  private async measureDatabaseResponseTime(): Promise<number> {
    const start = Date.now();
    try {
      const supabase = await createClient();
      await supabase.from("profiles").select("id").limit(1);
      return Date.now() - start;
    } catch {
      return -1; // Indicates error
    }
  }

  private getMemoryUsage(): number {
    if (typeof performance !== "undefined" && "memory" in performance) {
      const memory = (
        performance as Performance & {
          memory: {
            usedJSHeapSize: number;
            totalJSHeapSize: number;
          };
        }
      ).memory;
      return memory.usedJSHeapSize / (1024 * 1024); // MB
    }
    return 0;
  }

  private getRequestsPerMinute(): number {
    const analytics = AnalyticsService.getInstance();
    const recentEvents = analytics.getEventsForTimeframe(1); // Last hour
    return recentEvents.length;
  }

  private async getErrorRate(): Promise<number> {
    try {
      // Get error rate from database if available
      if (typeof window === "undefined") {
        const { ErrorTrackingDB } = await import("@/lib/utils/analyticsDB");
        const stats = await ErrorTrackingDB.getErrorStats();
        return stats.recentCount;
      }
      return 0;
    } catch {
      return 0;
    }
  }

  private async getActiveUsersCount(): Promise<number> {
    try {
      // Get active users from database if available
      if (typeof window === "undefined") {
        const supabase = await createClient();
        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);

        const { count } = await supabase
          .from("analytics_events")
          .select("user_id", { count: "exact", head: true })
          .gte("timestamp", oneHourAgo.toISOString())
          .not("user_id", "is", null);

        return count || 0;
      }
      return 1; // Default for client-side
    } catch {
      return 1;
    }
  }

  private countRecentEvents(eventType: AnalyticsEventType): number {
    const analytics = AnalyticsService.getInstance();
    const recentEvents = analytics.getEventsForTimeframe(1); // Last hour
    return recentEvents.filter((event) => event.type === eventType).length;
  }

  getMetricsHistory(hours = 24): SystemHealthMetrics[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metrics.filter((metric) => metric.timestamp > cutoff);
  }
}

/**
 * User Analytics Service
 */
export class UserAnalyticsService {
  static async getUserAnalytics(
    userId: string,
    timeframe: "day" | "week" | "month" | "year" = "week"
  ): Promise<UserAnalytics | null> {
    try {
      const supabase = await createClient();
      const now = new Date();
      let startDate: Date;

      switch (timeframe) {
        case "day":
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "year":
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
      }

      // Get study sessions
      const { data: sessions } = await supabase
        .from("study_sessions")
        .select("*")
        .eq("user_id", userId)
        .gte("created_at", startDate.toISOString());

      // Get daily study stats
      const { data: dailyStats } = await supabase
        .from("daily_study_stats")
        .select("*")
        .eq("user_id", userId)
        .gte("date", startDate.toISOString().split("T")[0]);

      // Get projects
      const { data: projects } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", userId);

      // Calculate analytics
      const studyTime =
        dailyStats?.reduce(
          (sum, stat) => sum + (stat.study_time_minutes || 0),
          0
        ) || 0;
      const flashcardsReviewed =
        dailyStats?.reduce(
          (sum, stat) => sum + (stat.cards_reviewed || 0),
          0
        ) || 0;
      const sessionsCompleted = sessions?.length || 0;

      // Calculate streak
      let streakDays = 0;
      if (dailyStats && dailyStats.length > 0) {
        const sortedStats = dailyStats.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        for (const stat of sortedStats) {
          if (stat.cards_reviewed > 0) {
            streakDays++;
          } else {
            break;
          }
        }
      }

      return {
        userId,
        timeframe,
        studyTime,
        sessionsCompleted,
        flashcardsReviewed,
        averageSessionLength:
          sessionsCompleted > 0 ? studyTime / sessionsCompleted : 0,
        streakDays,
        accuracyRate: 0, // Calculate from session data
        averageResponseTime: 0, // Calculate from session data
        difficultCards: 0, // Calculate from SRS states
        masteredCards: 0, // Calculate from SRS states
        projectsCreated: projects?.length || 0,
        activeProjects:
          projects?.filter((p) => p.updated_at > startDate.toISOString())
            .length || 0,
        lastActiveDate: new Date(
          Math.max(
            ...(dailyStats?.map((s) => new Date(s.date).getTime()) || [0])
          )
        ),
        retentionScore: streakDays / (timeframe === "week" ? 7 : 30), // Simple retention calculation
        aiGenerationsUsed: 0, // Would need to track this
        tokensConsumed: 0, // Would need to track this
        pdfUploads: 0, // Would need to track this
      };
    } catch (error) {
      console.error("Failed to get user analytics:", error);
      return null;
    }
  }

  static async getSystemAnalytics() {
    try {
      const supabase = await createClient();
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Get user counts
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      const { count: activeUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("updated_at", weekAgo.toISOString());

      // Get project counts
      const { count: totalProjects } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true });

      // Get flashcard counts
      const { count: totalFlashcards } = await supabase
        .from("flashcards")
        .select("*", { count: "exact", head: true });

      // Get recent activity
      const { count: recentSessions } = await supabase
        .from("study_sessions")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekAgo.toISOString());

      return {
        users: {
          total: totalUsers || 0,
          active: activeUsers || 0,
          retentionRate: totalUsers ? (activeUsers || 0) / totalUsers : 0,
        },
        content: {
          projects: totalProjects || 0,
          flashcards: totalFlashcards || 0,
        },
        activity: {
          sessionsThisWeek: recentSessions || 0,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("Failed to get system analytics:", error);
      return null;
    }
  }
}

// Global instances
export const analytics = AnalyticsService.getInstance();
export const healthMonitor = SystemHealthMonitor.getInstance();

// Auto-start health monitoring in browser
if (typeof window !== "undefined") {
  // Collect metrics every 5 minutes
  setInterval(() => {
    healthMonitor.collectMetrics().catch(console.error);
  }, 5 * 60 * 1000);

  // Track page views
  analytics.track(AnalyticsEventType.PAGE_VIEW, {
    path: window.location.pathname,
    referrer: document.referrer,
  });
}
