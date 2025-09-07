/**
 * System Analytics API Route
 * Provide system health and analytics data
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withApiSecurity } from "@/lib/utils/apiSecurity";
import {
  healthMonitor,
  UserAnalyticsService,
  analytics,
} from "@/lib/utils/analytics";
import { ErrorLogger } from "@/lib/utils/errorBoundaries";

async function handleGetSystemHealth() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin access
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: "Access denied - Admin access required" },
        { status: 403 }
      );
    }

    // Run health checks
    const healthChecks = await healthMonitor.runHealthChecks();
    const healthStatus = healthMonitor.getHealthStatus();
    const metricsHistory = healthMonitor.getMetricsHistory(24);

    // Get system analytics
    const systemAnalytics = await UserAnalyticsService.getSystemAnalytics();

    // Get error statistics
    const errorStats = ErrorLogger.getErrorStats();

    // Get analytics summary
    const analyticsSummary = analytics.getSummary();

    return NextResponse.json({
      health: {
        checks: healthChecks,
        status: healthStatus,
        overall: Object.values(healthChecks).every(Boolean),
      },
      metrics: metricsHistory,
      analytics: systemAnalytics,
      errors: errorStats,
      usage: analyticsSummary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to get system health:", error);
    return NextResponse.json(
      { error: "Failed to get system health data" },
      { status: 500 }
    );
  }
}

async function handleGetUserAnalytics(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const timeframe =
      (url.searchParams.get("timeframe") as
        | "day"
        | "week"
        | "month"
        | "year") || "week";
    const targetUserId = url.searchParams.get("userId");

    // Users can only access their own analytics unless they're admin
    let userId = user.id;
    if (targetUserId && targetUserId !== user.id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (!profile?.is_admin) {
        return NextResponse.json(
          { error: "Access denied - Can only view your own analytics" },
          { status: 403 }
        );
      }
      userId = targetUserId;
    }

    const userAnalytics = await UserAnalyticsService.getUserAnalytics(
      userId,
      timeframe
    );

    if (!userAnalytics) {
      return NextResponse.json(
        { error: "Failed to retrieve user analytics" },
        { status: 500 }
      );
    }

    return NextResponse.json(userAnalytics);
  } catch (error) {
    console.error("Failed to get user analytics:", error);
    return NextResponse.json(
      { error: "Failed to get user analytics" },
      { status: 500 }
    );
  }
}

async function handleCollectMetrics() {
  try {
    // This endpoint can be called by the system itself for metrics collection
    const metrics = await healthMonitor.collectMetrics();

    return NextResponse.json({
      success: true,
      metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to collect metrics:", error);
    return NextResponse.json(
      { error: "Failed to collect metrics" },
      { status: 500 }
    );
  }
}

// Route handlers with security
export const GET = withApiSecurity(
  async (request: NextRequest) => {
    const url = new URL(request.url);
    const endpoint = url.searchParams.get("endpoint");

    switch (endpoint) {
      case "health":
        return handleGetSystemHealth();
      case "user":
        return handleGetUserAnalytics(request);
      case "metrics":
        return handleCollectMetrics();
      default:
        return handleGetSystemHealth(); // Default to health check
    }
  },
  {
    requireAuth: true,
    rateLimit: { requests: 30, window: 60 },
    allowedMethods: ["GET"],
  }
);

export const POST = withApiSecurity(
  async (request: NextRequest) => {
    const body = await request.json();
    const { action } = body;

    if (action === "collect-metrics") {
      return handleCollectMetrics();
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  },
  {
    requireAuth: false, // Allow system to collect metrics
    rateLimit: { requests: 10, window: 60 },
    allowedMethods: ["POST"],
  }
);
