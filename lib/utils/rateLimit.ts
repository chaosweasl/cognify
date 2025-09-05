/**
 * Rate limiting utilities for API endpoints
 * In-memory implementation for development (replace with Redis in production)
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory rate limit store (replace with Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limit configurations for different endpoint types
export const RATE_LIMITS = {
  // Authentication endpoints
  LOGIN: { windowMs: 15 * 60 * 1000, max: 5 }, // 5 attempts per 15 minutes
  REGISTER: { windowMs: 60 * 60 * 1000, max: 3 }, // 3 attempts per hour
  PASSWORD_RESET: { windowMs: 60 * 60 * 1000, max: 3 }, // 3 attempts per hour

  // API endpoints
  GENERAL_API: { windowMs: 60 * 1000, max: 60 }, // 60 requests per minute
  DATA_MODIFICATION: { windowMs: 60 * 1000, max: 30 }, // 30 requests per minute
  FILE_UPLOAD: { windowMs: 60 * 1000, max: 10 }, // 10 uploads per minute

  // AI/expensive operations
  AI_GENERATION: { windowMs: 60 * 1000, max: 20 }, // 20 AI requests per minute
  BULK_OPERATIONS: { windowMs: 60 * 1000, max: 5 }, // 5 bulk operations per minute
} as const;

/**
 * Check if a request should be rate limited
 */
export function checkRateLimit(
  identifier: string,
  endpoint: keyof typeof RATE_LIMITS
): { allowed: boolean; remaining: number; resetTime: number } {
  const config = RATE_LIMITS[endpoint];
  const key = `${identifier}:${endpoint}`;
  const now = Date.now();

  // Clean up expired entries periodically
  if (Math.random() < 0.01) {
    // 1% chance to clean up
    cleanupExpiredEntries();
  }

  let entry = rateLimitStore.get(key);

  // If no entry exists or it's expired, create/reset it
  if (!entry || now >= entry.resetTime) {
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);

    return {
      allowed: true,
      remaining: config.max - 1,
      resetTime: entry.resetTime,
    };
  }

  // Check if limit is exceeded
  if (entry.count >= config.max) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    remaining: config.max - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Create a rate limit response with proper headers
 */
export function createRateLimitResponse(
  remaining: number,
  resetTime: number,
  message: string = "Rate limit exceeded"
): Response {
  return Response.json(
    {
      error: "Rate limit exceeded",
      message,
      retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
    },
    {
      status: 429,
      headers: {
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": new Date(resetTime).toISOString(),
        "Retry-After": Math.ceil((resetTime - Date.now()) / 1000).toString(),
      },
    }
  );
}

/**
 * Enhanced rate limiter with IP and user-based tracking
 */
export function checkEnhancedRateLimit(
  ip: string,
  userId: string | null,
  endpoint: keyof typeof RATE_LIMITS
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  identifier: string;
} {
  // Use user ID if available, otherwise use IP
  const identifier = userId || ip;

  // For sensitive operations, check both IP and user if available
  if (
    endpoint === "LOGIN" ||
    endpoint === "REGISTER" ||
    endpoint === "PASSWORD_RESET"
  ) {
    // Check IP-based limit
    const ipResult = checkRateLimit(ip, endpoint);

    // If user is available, also check user-based limit
    if (userId) {
      const userResult = checkRateLimit(userId, endpoint);

      // Return the most restrictive result
      if (!ipResult.allowed || !userResult.allowed) {
        return {
          allowed: false,
          remaining: Math.min(ipResult.remaining, userResult.remaining),
          resetTime: Math.max(ipResult.resetTime, userResult.resetTime),
          identifier: !ipResult.allowed ? ip : userId,
        };
      }

      return {
        allowed: true,
        remaining: Math.min(ipResult.remaining, userResult.remaining),
        resetTime: Math.max(ipResult.resetTime, userResult.resetTime),
        identifier,
      };
    }

    return { ...ipResult, identifier };
  }

  // For other endpoints, use the primary identifier
  return { ...checkRateLimit(identifier, endpoint), identifier };
}

/**
 * Middleware function to apply rate limiting to API routes
 */
export async function withRateLimit<T extends unknown[]>(
  request: Request,
  endpoint: keyof typeof RATE_LIMITS,
  handler: (...args: T) => Promise<Response>,
  ...args: T
): Promise<Response> {
  // Extract IP address from request
  const ip = getClientIP(request);

  // Extract user ID from request (if available)
  const userId = await getUserIdFromRequest(request);

  // Check rate limit
  const result = checkEnhancedRateLimit(ip, userId, endpoint);

  if (!result.allowed) {
    return createRateLimitResponse(
      result.remaining,
      result.resetTime,
      `Rate limit exceeded for ${endpoint.toLowerCase()} endpoint`
    );
  }

  // Add rate limit headers to successful responses
  const response = await handler(...args);

  // Add rate limit headers
  response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
  response.headers.set(
    "X-RateLimit-Reset",
    new Date(result.resetTime).toISOString()
  );

  return response;
}

/**
 * Extract client IP address from request
 */
function getClientIP(request: Request): string {
  // Check various headers for the real IP
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP.trim();
  }

  const cfConnectingIP = request.headers.get("cf-connecting-ip");
  if (cfConnectingIP) {
    return cfConnectingIP.trim();
  }

  // Fallback to a default IP if none found
  return "unknown";
}

/**
 * Extract user ID from request (implement based on your auth system)
 */
async function getUserIdFromRequest(_request: Request): Promise<string | null> {
  try {
    // This would typically involve checking a JWT token or session
    // Implementation depends on your authentication system

    // For now, return null - implement based on your auth setup
    return null;
  } catch {
    return null;
  }
}

/**
 * Clean up expired rate limit entries
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();

  for (const [key, entry] of rateLimitStore.entries()) {
    if (now >= entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Clear all rate limit entries (useful for testing)
 */
export function clearRateLimitStore(): void {
  rateLimitStore.clear();
}

/**
 * Get current rate limit status for debugging
 */
export function getRateLimitStatus(
  identifier: string,
  endpoint: keyof typeof RATE_LIMITS
): { count: number; resetTime: number; remaining: number } | null {
  const key = `${identifier}:${endpoint}`;
  const entry = rateLimitStore.get(key);

  if (!entry) {
    return null;
  }

  const config = RATE_LIMITS[endpoint];

  return {
    count: entry.count,
    resetTime: entry.resetTime,
    remaining: config.max - entry.count,
  };
}
