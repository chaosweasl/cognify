/**
 * Error Tracking API Route
 * Collect and manage application errors with database persistence
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withApiSecurity } from "@/lib/utils/apiSecurity";
import { ErrorTrackingDB } from "@/lib/utils/analyticsDB";
import {
  ErrorLogger,
  ErrorType,
  ErrorSeverity,
} from "@/lib/utils/errorBoundaries";
import { logSecurityEvent } from "@/lib/utils/securityAudit";

async function handleErrorReport(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      error,
      errorInfo,
      context,
      severity,
      type,
      error_type,
      message,
      stack_trace,
      user_id,
      session_id,
      url,
      user_agent,
    } = body;

    // Support both new and legacy error reporting formats
    const errorType = error_type || type || ErrorType.RENDERING_ERROR;
    const errorMessage = message || (error && error.message) || "Unknown error";
    const errorSeverity = severity || ErrorSeverity.MEDIUM;

    if (!errorMessage) {
      return NextResponse.json(
        { error: "Missing required error information" },
        { status: 400 }
      );
    }

    // Get user context
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const userId = user_id || user?.id;

    // Log error to database
    await ErrorTrackingDB.logError({
      error_type: errorType,
      severity: errorSeverity,
      message: errorMessage,
      stack_trace: stack_trace || (error && error.stack),
      user_id: userId,
      session_id: session_id,
      url:
        url ||
        (typeof window !== "undefined" ? window.location.href : undefined),
      user_agent:
        user_agent ||
        (typeof navigator !== "undefined" ? navigator.userAgent : undefined),
      context: context
        ? typeof context === "string"
          ? { message: context }
          : context
        : undefined,
    });

    // Also log to existing error logger for backward compatibility
    const errorDetails = {
      error: new Error(errorMessage),
      errorInfo,
      type: errorType,
      severity: errorSeverity,
      context: context || "Client Error Report",
      userId,
    };

    ErrorLogger.log(errorDetails);

    // For critical errors, also log as security events
    if (errorSeverity === ErrorSeverity.CRITICAL) {
      await logSecurityEvent(
        "CRITICAL_ERROR_REPORTED",
        "critical",
        {
          type: errorType,
          message: errorMessage.substring(0, 100), // Truncate for security
          userId,
        },
        userId
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to report error:", error);
    return NextResponse.json(
      { error: "Failed to report error" },
      { status: 500 }
    );
  }
}

async function handleGetErrors() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can view error logs
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get errors from both database and memory
    const dbErrors = await ErrorTrackingDB.getErrorLogs(50);
    const dbStats = await ErrorTrackingDB.getErrorStats();
    const memoryErrors = ErrorLogger.getErrors().slice(0, 10); // Keep some recent memory errors
    const memoryStats = ErrorLogger.getErrorStats();

    // Combine database and memory stats
    const combinedStats = {
      total: dbStats.total + memoryStats.total,
      byType: { ...dbStats.byType, ...memoryStats.byType },
      bySeverity: { ...dbStats.bySeverity, ...memoryStats.bySeverity },
      recentCount: dbStats.recentCount,
      trend: dbStats.trend,
    };

    return NextResponse.json({
      errors: [...dbErrors, ...memoryErrors].slice(0, 50),
      stats: combinedStats,
    });
  } catch (error) {
    console.error("Failed to get error logs:", error);
    return NextResponse.json(
      { error: "Failed to get error logs" },
      { status: 500 }
    );
  }
}

async function handleClearErrors() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can clear error logs
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Clear errors from both database and memory
    await ErrorTrackingDB.clearErrorLogs();
    ErrorLogger.clearErrors();

    await logSecurityEvent(
      "ERROR_LOGS_CLEARED",
      "low",
      {
        clearedBy: user.id,
      },
      user.id
    );

    return NextResponse.json({
      success: true,
      message: "Error logs cleared successfully",
    });
  } catch (error) {
    console.error("Failed to clear error logs:", error);
    return NextResponse.json(
      { error: "Failed to clear error logs" },
      { status: 500 }
    );
  }
}

// Route handlers with security
export const POST = withApiSecurity(
  async (request: NextRequest) => {
    return handleErrorReport(request);
  },
  {
    requireAuth: false, // Allow unauthenticated error reports
    rateLimit: { requests: 20, window: 60 }, // 20 error reports per minute
    allowedMethods: ["POST"],
  }
);

export const GET = withApiSecurity(
  async () => {
    return handleGetErrors();
  },
  {
    requireAuth: true,
    rateLimit: { requests: 10, window: 60 },
    allowedMethods: ["GET"],
  }
);

export const DELETE = withApiSecurity(
  async () => {
    return handleClearErrors();
  },
  {
    requireAuth: true,
    rateLimit: { requests: 5, window: 60 },
    allowedMethods: ["DELETE"],
  }
);
