/**
 * Security Audit Utilities
 * Comprehensive security checks and monitoring for the Cognify application
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import { z } from "zod";

// Security audit types
export interface SecurityAuditResult {
  passed: boolean;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  category: string;
  details?: Record<string, unknown>;
}

export interface SecurityAuditReport {
  timestamp: Date;
  overallScore: number;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  results: SecurityAuditResult[];
  recommendations: string[];
}

/**
 * RLS Policy Audit
 * Verifies that all tables have proper Row Level Security policies
 */
export async function auditRLSPolicies(): Promise<SecurityAuditResult[]> {
  const results: SecurityAuditResult[] = [];

  try {
    const supabase = await createClient();

    // List of all tables that should have RLS enabled
    const criticalTables = [
      "profiles",
      "projects",
      "flashcards",
      "srs_states",
      "study_sessions",
      "daily_study_stats",
      "app_notification_reads",
      "user_ai_prompts",
      "study_goals",
      "study_reminders",
    ];

    // For each critical table, verify it exists and has proper structure
    for (const tableName of criticalTables) {
      try {
        // Test if we can query the table (which will fail if RLS is not properly configured)
        const { error } = await supabase.from(tableName).select("*").limit(1);

        if (error) {
          // If we get an RLS error, that's actually good - it means RLS is working
          if (
            error.message.includes("row-level security") ||
            error.message.includes("RLS")
          ) {
            results.push({
              passed: true,
              message: `Table ${tableName} has RLS properly configured`,
              severity: "low",
              category: "RLS_POLICIES",
              details: { table: tableName, rlsActive: true },
            });
          } else {
            results.push({
              passed: false,
              message: `Table ${tableName} query error: ${error.message}`,
              severity: "medium",
              category: "RLS_VERIFICATION",
              details: { table: tableName, error: error.message },
            });
          }
        } else {
          // If query succeeds without authentication, that might be a problem
          // Exception: app_notifications should be readable by authenticated users
          if (tableName === "app_notifications") {
            results.push({
              passed: true,
              message: `Table ${tableName} properly accessible for published notifications`,
              severity: "low",
              category: "RLS_POLICIES",
              details: { table: tableName },
            });
          } else {
            results.push({
              passed: false,
              message: `Table ${tableName} may have insufficient RLS protection`,
              severity: "high",
              category: "RLS_POLICIES",
              details: {
                table: tableName,
                warning: "Query succeeded without user context",
              },
            });
          }
        }
      } catch (tableError) {
        results.push({
          passed: false,
          message: `Failed to test table ${tableName}: ${
            tableError instanceof Error ? tableError.message : "Unknown error"
          }`,
          severity: "medium",
          category: "RLS_VERIFICATION",
          details: { table: tableName, error: tableError },
        });
      }
    }
  } catch (error) {
    results.push({
      passed: false,
      message: `RLS audit failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      severity: "critical",
      category: "RLS_AUDIT_ERROR",
      details: { error },
    });
  }

  return results;
}

/**
 * Input Validation Schemas
 * Centralized validation schemas for all user inputs
 */
export const ValidationSchemas = {
  // Project validation
  project: z.object({
    name: z.string().min(1).max(100).trim(),
    description: z.string().max(500).optional(),
    category: z.string().max(50).optional(),
    settings: z
      .object({
        initialInterval: z.number().min(1).max(365),
        intervalMultiplier: z.number().min(1.1).max(10),
        maxInterval: z.number().min(1).max(36500),
        easyFactor: z.number().min(1.1).max(5),
        hardFactor: z.number().min(0.1).max(1),
        againFactor: z.number().min(0.1).max(1),
        maxReviewsPerDay: z.number().min(1).max(1000).optional(),
        enableNotifications: z.boolean().optional(),
      })
      .partial(),
  }),

  // Flashcard validation
  flashcard: z.object({
    question: z.string().min(1).max(2000).trim(),
    answer: z.string().min(1).max(2000).trim(),
    project_id: z.string().uuid(),
    tags: z.array(z.string().max(50)).max(20).optional(),
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  }),

  // User profile validation
  profile: z.object({
    first_name: z.string().min(1).max(50).trim().optional(),
    last_name: z.string().min(1).max(50).trim().optional(),
    bio: z.string().max(500).optional(),
    avatar_url: z.string().url().optional(),
    theme: z.enum(["light", "dark", "system"]).optional(),
  }),

  // Study session validation
  studySession: z.object({
    project_id: z.string().uuid(),
    flashcard_id: z.string().uuid(),
    rating: z.enum(["again", "hard", "good", "easy"]),
    response_time_ms: z.number().min(0).max(3600000), // Max 1 hour
  }),

  // AI settings validation (never stored in DB)
  aiSettings: z.object({
    provider: z.enum(["openai", "anthropic", "ollama", "lmstudio", "deepseek"]),
    model: z.string().min(1).max(100),
    apiKey: z.string().min(1).max(200), // For validation only, never stored
    baseUrl: z.string().url().optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().min(1).max(100000).optional(),
  }),
};

/**
 * Input Sanitization
 * Sanitize user inputs to prevent XSS and injection attacks
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== "string") return "";

  return (
    input
      .trim()
      // Remove potentially dangerous HTML tags
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
      .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, "")
      // Remove javascript: and data: protocols
      .replace(/javascript:/gi, "")
      .replace(/data:/gi, "")
      // Remove on* event handlers
      .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, "")
  );
}

/**
 * API Request Security Validation
 * Validates incoming API requests for security issues
 */
export async function validateApiRequest(
  request: NextRequest
): Promise<SecurityAuditResult[]> {
  const results: SecurityAuditResult[] = [];
  const url = request.url;
  const method = request.method;

  // Check for authenticated requests
  const authHeader = request.headers.get("authorization");
  const cookieHeader = request.headers.get("cookie");

  if (!authHeader && !cookieHeader) {
    results.push({
      passed: false,
      message: `Unauthenticated request to ${method} ${url}`,
      severity: "medium",
      category: "AUTHENTICATION",
      details: { method, url },
    });
  }

  // Check for suspicious patterns in URL
  const suspiciousPatterns = [
    /\.\./, // Directory traversal
    /<script/i, // XSS attempt
    /union\s+select/i, // SQL injection
    /exec\(/i, // Code execution
    /eval\(/i, // Code evaluation
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(url)) {
      results.push({
        passed: false,
        message: `Suspicious pattern detected in URL: ${url}`,
        severity: "high",
        category: "MALICIOUS_REQUEST",
        details: { pattern: pattern.toString(), url, method },
      });
    }
  }

  // Check request headers for suspicious content
  const userAgent = request.headers.get("user-agent");
  if (!userAgent || userAgent.length < 10) {
    results.push({
      passed: false,
      message: "Missing or suspicious User-Agent header",
      severity: "low",
      category: "SUSPICIOUS_HEADERS",
      details: { userAgent },
    });
  }

  // Check for excessively large requests
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > 50 * 1024 * 1024) {
    // 50MB limit
    results.push({
      passed: false,
      message: `Request too large: ${contentLength} bytes`,
      severity: "medium",
      category: "REQUEST_SIZE",
      details: { contentLength },
    });
  }

  return results;
}

/**
 * Run Complete Security Audit
 * Performs all security checks and returns comprehensive report
 */
export async function runSecurityAudit(): Promise<SecurityAuditReport> {
  const allResults: SecurityAuditResult[] = [];

  try {
    // Run all audit checks
    const rlsResults = await auditRLSPolicies();
    allResults.push(...rlsResults);

    // Add more security checks here as needed
  } catch (error) {
    allResults.push({
      passed: false,
      message: `Security audit failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      severity: "critical",
      category: "AUDIT_ERROR",
      details: { error },
    });
  }

  // Calculate results
  const passedChecks = allResults.filter((r) => r.passed).length;
  const failedChecks = allResults.filter((r) => !r.passed).length;
  const totalChecks = allResults.length;
  const overallScore = totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 0;

  // Generate recommendations
  const recommendations = generateSecurityRecommendations(allResults);

  return {
    timestamp: new Date(),
    overallScore,
    totalChecks,
    passedChecks,
    failedChecks,
    results: allResults,
    recommendations,
  };
}

/**
 * Generate Security Recommendations
 * Based on audit results, provide actionable security recommendations
 */
function generateSecurityRecommendations(
  results: SecurityAuditResult[]
): string[] {
  const recommendations: string[] = [];
  const failedResults = results.filter((r) => !r.passed);

  // Group by category for better recommendations
  const categorizedFailures = failedResults.reduce((acc, result) => {
    if (!acc[result.category]) acc[result.category] = [];
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, SecurityAuditResult[]>);

  // RLS policy recommendations
  if (categorizedFailures.RLS_POLICIES) {
    recommendations.push(
      "Review and strengthen Row Level Security policies for all database tables",
      "Ensure all user-data tables filter by auth.uid()",
      "Test RLS policies with different user contexts"
    );
  }

  // Authentication recommendations
  if (categorizedFailures.AUTHENTICATION) {
    recommendations.push(
      "Implement proper authentication middleware for all API routes",
      "Add rate limiting to prevent brute force attacks",
      "Consider implementing API key rotation"
    );
  }

  // Input validation recommendations
  if (categorizedFailures.INPUT_VALIDATION) {
    recommendations.push(
      "Implement comprehensive input validation using Zod schemas",
      "Add input sanitization for all user-provided content",
      "Consider implementing Content Security Policy (CSP) headers"
    );
  }

  // General recommendations if no specific issues
  if (recommendations.length === 0) {
    recommendations.push(
      "Security audit passed - continue regular security monitoring",
      "Consider implementing automated security scanning",
      "Keep dependencies updated and monitor for vulnerabilities"
    );
  }

  return recommendations;
}

/**
 * Log Security Event
 * Log security-related events for monitoring and analysis
 */
export async function logSecurityEvent(
  event: string,
  severity: "low" | "medium" | "high" | "critical",
  details: Record<string, unknown> = {},
  userId?: string
): Promise<void> {
  try {
    // In a production environment, you might want to log to a dedicated security table
    // For now, we'll use console logging with structured data
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      severity,
      userId,
      details: typeof details === "object" ? JSON.stringify(details) : details,
      userAgent: typeof window !== "undefined" ? navigator.userAgent : "server",
    };

    console.warn("[SECURITY]", logEntry);

    // In production, consider sending to external security monitoring service
    // await externalSecurityService.log(logEntry)
  } catch (error) {
    console.error("Failed to log security event:", error);
  }
}
