/**
 * Database health checker for Cognify
 * Helps diagnose common database issues that might cause empty error logs
 */

import { createClient } from "@/lib/supabase/client";

export interface DatabaseHealthResult {
  status: "healthy" | "warning" | "error";
  checks: {
    name: string;
    status: "pass" | "fail" | "warning";
    message: string;
    details?: any;
  }[];
}

export async function checkDatabaseHealth(): Promise<DatabaseHealthResult> {
  const result: DatabaseHealthResult = {
    status: "healthy",
    checks: [],
  };

  const supabase = createClient();

  // Check 1: Authentication
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      result.checks.push({
        name: "Authentication",
        status: "fail",
        message: "Authentication failed",
        details: authError,
      });
      result.status = "error";
    } else if (!user) {
      result.checks.push({
        name: "Authentication",
        status: "warning",
        message: "No authenticated user",
      });
      if (result.status === "healthy") result.status = "warning";
    } else {
      result.checks.push({
        name: "Authentication",
        status: "pass",
        message: `User authenticated: ${user.id}`,
      });
    }
  } catch (error) {
    result.checks.push({
      name: "Authentication",
      status: "fail",
      message: "Authentication check failed",
      details: error,
    });
    result.status = "error";
  }

  // Check 2: Database Connection
  try {
    const { data, error } = await supabase
      .from("daily_study_stats")
      .select("count")
      .limit(1);

    if (error) {
      result.checks.push({
        name: "Database Connection",
        status: "fail",
        message: "Failed to query database",
        details: error,
      });
      result.status = "error";
    } else {
      result.checks.push({
        name: "Database Connection",
        status: "pass",
        message: "Database connection working",
      });
    }
  } catch (error) {
    result.checks.push({
      name: "Database Connection",
      status: "fail",
      message: "Database connection failed",
      details: error,
    });
    result.status = "error";
  }

  // Check 3: RLS (Row Level Security)
  try {
    const { data, error } = await supabase
      .from("daily_study_stats")
      .select("user_id")
      .limit(1);

    if (error && error.code === "42501") {
      result.checks.push({
        name: "Row Level Security",
        status: "warning",
        message: "RLS policy may be too restrictive",
        details: error,
      });
      if (result.status === "healthy") result.status = "warning";
    } else {
      result.checks.push({
        name: "Row Level Security",
        status: "pass",
        message: "RLS policies working correctly",
      });
    }
  } catch (error) {
    result.checks.push({
      name: "Row Level Security",
      status: "fail",
      message: "RLS check failed",
      details: error,
    });
    result.status = "error";
  }

  // Check 4: Table Access
  const tables = ["daily_study_stats", "srs_states", "flashcards", "projects"];

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select("count")
        .limit(1);

      if (error) {
        result.checks.push({
          name: `Table Access: ${table}`,
          status: "fail",
          message: `Cannot access ${table} table`,
          details: error,
        });
        result.status = "error";
      } else {
        result.checks.push({
          name: `Table Access: ${table}`,
          status: "pass",
          message: `${table} table accessible`,
        });
      }
    } catch (error) {
      result.checks.push({
        name: `Table Access: ${table}`,
        status: "fail",
        message: `Failed to check ${table} table`,
        details: error,
      });
      result.status = "error";
    }
  }

  return result;
}

/**
 * Print database health report to console
 */
export async function printDatabaseHealthReport(): Promise<void> {
  console.log("🏥 Checking database health...\n");

  const health = await checkDatabaseHealth();

  console.log(
    `Overall Status: ${
      health.status === "healthy"
        ? "✅"
        : health.status === "warning"
        ? "⚠️"
        : "❌"
    } ${health.status.toUpperCase()}\n`
  );

  for (const check of health.checks) {
    const icon =
      check.status === "pass" ? "✅" : check.status === "warning" ? "⚠️" : "❌";
    console.log(`${icon} ${check.name}: ${check.message}`);

    if (check.details && check.status !== "pass") {
      console.log(`   Details:`, check.details);
    }
  }

  console.log("\n");

  if (health.status !== "healthy") {
    console.log("💡 Troubleshooting tips:");
    console.log("- Check your Supabase connection and API keys");
    console.log("- Verify your database permissions and RLS policies");
    console.log("- Make sure you're logged in to the application");
    console.log("- Check the network connection to your Supabase instance");
  }
}
