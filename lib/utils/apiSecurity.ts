/**
 * API Security Middleware
 * Comprehensive security checks for all API endpoints
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  ValidationSchemas,
  sanitizeInput,
  validateApiRequest,
  logSecurityEvent,
} from "./securityAudit";
import { checkRateLimit } from "./rateLimit";

// Security headers for all API responses
const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
};

// Content Security Policy for API responses
const cspHeader = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

/**
 * Get client IP from request
 */
function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1"
  );
}

/**
 * API Security Wrapper
 * Wraps API handlers with comprehensive security checks
 */
export function withApiSecurity<
  C extends Record<string, unknown> = Record<string, unknown>
>(
  handler: (request: NextRequest, context: C) => Promise<NextResponse>,
  options: {
    requireAuth?: boolean;
    validateInput?: keyof typeof ValidationSchemas;
    rateLimit?: { requests: number; window: number };
    allowedMethods?: string[];
  } = {}
) {
  return async (
    request: NextRequest,
    // Ensure context always exposes params so Next's generated RouteContext checks pass
    context: C & { params: Promise<Record<string, unknown>> }
  ): Promise<NextResponse> => {
    const startTime = Date.now();

    try {
      // Apply security headers
      const response = NextResponse.next();
      Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      response.headers.set("Content-Security-Policy", cspHeader);

      // Validate API request for security issues
      const securityResults = await validateApiRequest(request);
      const criticalIssues = securityResults.filter(
        (r) => !r.passed && r.severity === "critical"
      );

      if (criticalIssues.length > 0) {
        await logSecurityEvent("CRITICAL_SECURITY_VIOLATION", "critical", {
          issues: criticalIssues,
          url: request.url,
          method: request.method,
          ip: getClientIP(request),
        });

        return NextResponse.json(
          { error: "Request blocked for security reasons" },
          { status: 403, headers: securityHeaders }
        );
      }

      // Check allowed methods
      if (
        options.allowedMethods &&
        !options.allowedMethods.includes(request.method)
      ) {
        return NextResponse.json(
          { error: "Method not allowed" },
          { status: 405, headers: securityHeaders }
        );
      }

      // Apply rate limiting if configured
      if (options.rateLimit) {
        const ip = getClientIP(request);
        const rateLimitResult = checkRateLimit(
          ip,
          "GENERAL_API" // Using general API rate limit, could be made configurable
        );

        if (!rateLimitResult.allowed) {
          await logSecurityEvent("RATE_LIMIT_EXCEEDED", "medium", {
            url: request.url,
            ip: getClientIP(request),
            remaining: rateLimitResult.remaining,
            resetTime: rateLimitResult.resetTime,
          });

          return NextResponse.json(
            {
              error: "Too many requests",
              retryAfter: rateLimitResult.resetTime,
            },
            {
              status: 429,
              headers: {
                ...securityHeaders,
                "Retry-After": Math.ceil(
                  (rateLimitResult.resetTime - Date.now()) / 1000
                ).toString(),
              },
            }
          );
        }
      }

      // Authentication check
      if (options.requireAuth) {
        const supabase = await createClient();
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          await logSecurityEvent("UNAUTHORIZED_ACCESS_ATTEMPT", "medium", {
            url: request.url,
            method: request.method,
            authError: authError?.message,
          });

          return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401, headers: securityHeaders }
          );
        }

        // Add user context to request for handler
        request.headers.set("x-user-id", user.id);
      }

      // Input validation if configured
      if (options.validateInput && request.method !== "GET") {
        try {
          const body = await request.json();
          const schema = ValidationSchemas[options.validateInput];

          if (schema) {
            const validationResult = schema.safeParse(body);
            if (!validationResult.success) {
              await logSecurityEvent("INPUT_VALIDATION_FAILED", "low", {
                url: request.url,
                errors: validationResult.error.issues,
              });

              return NextResponse.json(
                {
                  error: "Invalid input data",
                  details: validationResult.error.issues,
                },
                { status: 400, headers: securityHeaders }
              );
            }

            // Sanitize string inputs
            const sanitizedBody = sanitizeObjectInputs(validationResult.data);

            // Create new request with sanitized body
            const sanitizedRequest = new NextRequest(request.url, {
              method: request.method,
              headers: request.headers,
              body: JSON.stringify(sanitizedBody),
            });

            request = sanitizedRequest;
          }
        } catch {
          return NextResponse.json(
            { error: "Invalid JSON in request body" },
            { status: 400, headers: securityHeaders }
          );
        }
      }

      // Execute the actual handler
      // handler expects C; context may contain extra fields like params, so cast to C
      const handlerResponse = await handler(request, context as C);

      // Add security headers to handler response
      Object.entries(securityHeaders).forEach(([key, value]) => {
        handlerResponse.headers.set(key, value);
      });
      handlerResponse.headers.set("Content-Security-Policy", cspHeader);

      // Log successful API call (for monitoring)
      const duration = Date.now() - startTime;
      if (duration > 5000) {
        // Log slow requests
        await logSecurityEvent("SLOW_API_REQUEST", "low", {
          url: request.url,
          method: request.method,
          duration,
        });
      }

      return handlerResponse;
    } catch (error) {
      await logSecurityEvent("API_HANDLER_ERROR", "high", {
        url: request.url,
        method: request.method,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500, headers: securityHeaders }
      );
    }
  };
}

/**
 * Sanitize Object Inputs
 * Recursively sanitize all string inputs in an object
 */
function sanitizeObjectInputs(obj: unknown): unknown {
  if (typeof obj === "string") {
    return sanitizeInput(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObjectInputs);
  }

  if (obj && typeof obj === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObjectInputs(value);
    }
    return sanitized;
  }

  return obj;
}

/**
 * API Route Security Decorator
 * Usage: export const POST = withApiSecurity(handler, options)
 */
export const secureApiRoute = withApiSecurity;

/**
 * Common security configurations for different API types
 */
export const SecurityPresets = {
  // Public endpoints (no auth required)
  public: {
    requireAuth: false,
    rateLimit: { requests: 100, window: 60 }, // 100 requests per minute
    allowedMethods: ["GET", "POST"],
  },

  // User data endpoints (auth required)
  protected: {
    requireAuth: true,
    rateLimit: { requests: 60, window: 60 }, // 60 requests per minute
    allowedMethods: ["GET", "POST", "PUT", "DELETE"],
  },

  // AI endpoints (higher rate limits, validation required)
  ai: {
    requireAuth: true,
    rateLimit: { requests: 30, window: 60 }, // 30 requests per minute
    allowedMethods: ["POST"],
  },

  // File upload endpoints
  upload: {
    requireAuth: true,
    rateLimit: { requests: 10, window: 60 }, // 10 uploads per minute
    allowedMethods: ["POST"],
  },
};

/**
 * Security Middleware for Pages
 * Use in middleware.ts to apply security headers to all routes
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  response.headers.set("Content-Security-Policy", cspHeader);
  return response;
}
