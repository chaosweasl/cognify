/**
 * Analytics and Error Tracking Database Utilities
 * Database operations for analytics events and error logging
 */

import { createClient } from "@/lib/supabase/client";
import type { AnalyticsEventType } from "@/lib/utils/analytics";
import type { ErrorType, ErrorSeverity } from "@/lib/utils/errorBoundaries";

export interface ErrorLogEntry {
  id?: string;
  error_type: string;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  stack_trace?: string;
  timestamp?: string;
  user_id?: string;
  session_id?: string;
  url?: string;
  user_agent?: string;
  context?: Record<string, unknown>;
  resolved?: boolean;
}

export interface AnalyticsEvent {
  id?: string;
  event_type: string;
  user_id?: string;
  session_id: string;
  data?: Record<string, unknown>;
  timestamp?: string;
}

export interface SystemHealthMetric {
  id?: string;
  timestamp?: string;
  database_response_time?: number;
  memory_usage?: number;
  active_users?: number;
  requests_per_minute?: number;
  error_count?: number;
  metrics?: Record<string, unknown>;
}

/**
 * Error Tracking Database Operations
 */
export class ErrorTrackingDB {
  /**
   * Log an error to the database
   */
  static async logError(error: ErrorLogEntry): Promise<void> {
    try {
      const supabase = createClient();

      const { error: dbError } = await supabase.from("error_logs").insert({
        error_type: error.error_type,
        severity: error.severity,
        message: error.message,
        stack_trace: error.stack_trace,
        user_id: error.user_id,
        session_id: error.session_id,
        url: error.url,
        user_agent: error.user_agent,
        context: error.context,
        timestamp: error.timestamp || new Date().toISOString(),
      });

      if (dbError) {
        console.error("Failed to log error to database:", dbError);
      }
    } catch (error) {
      console.error("Error logging to database:", error);
    }
  }

  /**
   * Get error logs (admin only)
   */
  static async getErrorLogs(limit = 50): Promise<ErrorLogEntry[]> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("error_logs")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Failed to fetch error logs:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error fetching error logs:", error);
      return [];
    }
  }

  /**
   * Clear all error logs (admin only)
   */
  static async clearErrorLogs(): Promise<void> {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("error_logs")
        .delete()
        .gte("id", "00000000-0000-0000-0000-000000000000"); // Delete all

      if (error) {
        console.error("Failed to clear error logs:", error);
      }
    } catch (error) {
      console.error("Error clearing error logs:", error);
    }
  }

  /**
   * Get error statistics
   */
  static async getErrorStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    recentCount: number;
    trend: "increasing" | "decreasing" | "stable";
  }> {
    try {
      const supabase = createClient();

      // Get all errors from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from("error_logs")
        .select("error_type, severity, timestamp")
        .gte("timestamp", thirtyDaysAgo.toISOString())
        .order("timestamp", { ascending: false });

      if (error || !data) {
        console.error("Failed to fetch error stats:", error);
        return {
          total: 0,
          byType: {},
          bySeverity: {},
          recentCount: 0,
          trend: "stable",
        };
      }

      const byType = data.reduce((acc, error) => {
        acc[error.error_type] = (acc[error.error_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const bySeverity = data.reduce((acc, error) => {
        acc[error.severity] = (acc[error.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const recentCount = data.filter(
        (error) => new Date(error.timestamp) > oneDayAgo
      ).length;

      // Calculate trend (simple: compare last 7 days to previous 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

      const lastWeek = data.filter(
        (error) => new Date(error.timestamp) > sevenDaysAgo
      ).length;
      const previousWeek = data.filter(
        (error) =>
          new Date(error.timestamp) > fourteenDaysAgo &&
          new Date(error.timestamp) <= sevenDaysAgo
      ).length;

      let trend: "increasing" | "decreasing" | "stable" = "stable";
      if (previousWeek > 0) {
        const ratio = lastWeek / previousWeek;
        if (ratio > 1.2) {
          trend = "increasing";
        } else if (ratio < 0.8) {
          trend = "decreasing";
        }
      }

      return {
        total: data.length,
        byType,
        bySeverity,
        recentCount,
        trend,
      };
    } catch (error) {
      console.error("Error fetching error stats:", error);
      return {
        total: 0,
        byType: {},
        bySeverity: {},
        recentCount: 0,
        trend: "stable",
      };
    }
  }
}

/**
 * Analytics Database Operations
 */
export class AnalyticsDB {
  /**
   * Track an analytics event
   */
  static async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      const supabase = createClient();

      const { error } = await supabase.from("analytics_events").insert({
        event_type: event.event_type,
        user_id: event.user_id,
        session_id: event.session_id,
        data: event.data,
        timestamp: event.timestamp || new Date().toISOString(),
      });

      if (error) {
        console.error("Failed to track analytics event:", error);
      }
    } catch (error) {
      console.error("Error tracking analytics event:", error);
    }
  }

  /**
   * Get analytics events for a user
   */
  static async getUserEvents(
    userId: string,
    limit = 100
  ): Promise<AnalyticsEvent[]> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("analytics_events")
        .select("*")
        .eq("user_id", userId)
        .order("timestamp", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Failed to fetch user analytics:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error fetching user analytics:", error);
      return [];
    }
  }
}

/**
 * System Health Metrics Database Operations
 */
export class SystemHealthDB {
  /**
   * Record system health metrics
   */
  static async recordMetrics(metrics: SystemHealthMetric): Promise<void> {
    try {
      const supabase = createClient();

      const { error } = await supabase.from("system_health_metrics").insert({
        database_response_time: metrics.database_response_time,
        memory_usage: metrics.memory_usage,
        active_users: metrics.active_users,
        requests_per_minute: metrics.requests_per_minute,
        error_count: metrics.error_count,
        metrics: metrics.metrics,
        timestamp: metrics.timestamp || new Date().toISOString(),
      });

      if (error) {
        console.error("Failed to record health metrics:", error);
      }
    } catch (error) {
      console.error("Error recording health metrics:", error);
    }
  }

  /**
   * Get recent health metrics
   */
  static async getRecentMetrics(hours = 24): Promise<SystemHealthMetric[]> {
    try {
      const supabase = createClient();

      const startTime = new Date();
      startTime.setHours(startTime.getHours() - hours);

      const { data, error } = await supabase
        .from("system_health_metrics")
        .select("*")
        .gte("timestamp", startTime.toISOString())
        .order("timestamp", { ascending: false });

      if (error) {
        console.error("Failed to fetch health metrics:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error fetching health metrics:", error);
      return [];
    }
  }
}

/**
 * Enhanced Analytics Integration
 * Integrates with the existing analytics system
 */
export class EnhancedAnalytics {
  /**
   * Track event with database persistence
   */
  static async trackWithPersistence(
    eventType: string,
    data: Record<string, unknown> = {},
    userId?: string
  ): Promise<void> {
    const sessionId = this.getSessionId();

    // Track in database
    await AnalyticsDB.trackEvent({
      event_type: eventType,
      user_id: userId,
      session_id: sessionId,
      data,
    });

    // Also track in memory for existing analytics system
    if (typeof window !== "undefined") {
      const { analytics } = await import("@/lib/utils/analytics");
      // Cast the incoming string to the analytics enum type without using `any`
      analytics.track(eventType as unknown as AnalyticsEventType, data);
    }
  }

  /**
   * Log error with database persistence
   */
  static async logErrorWithPersistence(
    errorType: string,
    message: string,
    severity: "low" | "medium" | "high" | "critical" = "medium",
    context?: Record<string, unknown>,
    userId?: string
  ): Promise<void> {
    const sessionId = this.getSessionId();

    // Log to database
    await ErrorTrackingDB.logError({
      error_type: errorType,
      severity,
      message,
      user_id: userId,
      session_id: sessionId,
      url: typeof window !== "undefined" ? window.location.href : undefined,
      user_agent:
        typeof window !== "undefined" ? navigator.userAgent : undefined,
      context,
    });

    // Also log to existing error logger
    const { ErrorLogger } = await import("@/lib/utils/errorBoundaries");
    // Normalize types for the ErrorLogger without using `any`
    ErrorLogger.log({
      type: errorType as unknown as ErrorType,
      severity: severity as ErrorSeverity,
      error: new Error(message),
      context: JSON.stringify(context),
      userId,
    });
  }

  private static getSessionId(): string {
    if (typeof window !== "undefined") {
      let sessionId = sessionStorage.getItem("analytics_session_id");
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        sessionStorage.setItem("analytics_session_id", sessionId);
      }
      return sessionId;
    }
    return `server_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
