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
   * Log an error (memory only - database table removed)
   */
  static async logError(error: ErrorLogEntry): Promise<void> {
    try {
      // Since error_logs table was dropped, we'll just log to console for now
      // In production, you might want to use external logging service
      console.error("Error logged:", {
        error_type: error.error_type,
        severity: error.severity,
        message: error.message,
        timestamp: error.timestamp || new Date().toISOString(),
        user_id: error.user_id,
      });
    } catch (error) {
      console.error("Error logging:", error);
    }
  }

  /**
   * Get error logs (returns empty since database table was removed)
   */
  static async getErrorLogs(limit = 50): Promise<ErrorLogEntry[]> {
    // Database table was dropped, return empty array
    return [];
  }

  /**
   * Clear all error logs (no-op since database table was removed)
   */
  static async clearErrorLogs(): Promise<void> {
    // Database table was dropped, nothing to clear
    return;
  }

  /**
   * Get error statistics (returns empty stats since database table was removed)
   */
  static async getErrorStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    recentCount: number;
    trend: "increasing" | "decreasing" | "stable";
  }> {
    // Database table was dropped, return empty stats
    return {
      total: 0,
      byType: {},
      bySeverity: {},
      recentCount: 0,
      trend: "stable",
    };
  }
}

/**
 * Analytics Database Operations
 */
export class AnalyticsDB {
  /**
   * Track an analytics event (disabled - table was removed)
   */
  static async trackEvent(event: AnalyticsEvent): Promise<void> {
    // analytics_events table was dropped, just log for now
    console.log("Analytics event:", event.event_type, event.data);
  }

  /**
   * Get analytics events for a user (returns empty - table was removed)
   */
  static async getUserEvents(
    userId: string,
    limit = 100
  ): Promise<AnalyticsEvent[]> {
    // analytics_events table was dropped
    return [];
  }
}

/**
 * System Health Metrics Database Operations
 */
export class SystemHealthDB {
  /**
   * Record system health metrics (disabled - table was removed)
   */
  static async recordMetrics(metrics: SystemHealthMetric): Promise<void> {
    // system_health_metrics table was dropped
    console.log("Health metrics:", metrics);
  }

  /**
   * Get recent health metrics (returns empty - table was removed)
   */
  static async getRecentMetrics(hours = 24): Promise<SystemHealthMetric[]> {
    // system_health_metrics table was dropped
    return [];
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
