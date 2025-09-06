/**
 * Error Tracking API Route
 * Collect and manage application errors
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withApiSecurity } from "@/lib/utils/apiSecurity";
import {
  ErrorLogger,
  ErrorType,
  ErrorSeverity,
} from "@/lib/utils/errorBoundaries";
import { logSecurityEvent } from "@/lib/utils/securityAudit";

async function handleErrorReport(request: NextRequest) {
  try {
    const body = await request.json();
    const { error, errorInfo, context, severity, type } = body;

    // Validate required fields
    if (!error || !error.message) {
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

    // Log the error
    const errorDetails = {
      error: new Error(error.message),
      errorInfo,
      type: type || ErrorType.RENDERING_ERROR,
      severity: severity || ErrorSeverity.MEDIUM,
      context: context || "Client Error Report",
      userId: user?.id,
    };

    ErrorLogger.log(errorDetails);

    // For critical errors, also log as security events
    if (severity === ErrorSeverity.CRITICAL) {
      await logSecurityEvent(
        "CRITICAL_ERROR_REPORTED",
        "critical",
        {
          error: error.message,
          context,
          userId: user?.id,
        },
        user?.id
      );
    }

    return NextResponse.json({
      success: true,
      message: "Error reported successfully",
    });
  } catch (error) {
    console.error("Failed to process error report:", error);
    return NextResponse.json(
      { error: "Failed to process error report" },
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

    const errors = ErrorLogger.getErrors();
    const stats = ErrorLogger.getErrorStats();

    return NextResponse.json({
      errors: errors.slice(0, 50), // Limit to recent 50 errors
      stats,
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
