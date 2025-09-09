/**
 * AI Performance Middleware
 * Automatically applies performance optimizations to AI generation routes
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  rateLimiter,
  performanceMonitor,
  sanitizeAIRequest,
  sanitizeAIResponse,
} from "@/lib/utils/performanceOptimization";
import { AIConfiguration } from "@/lib/ai/types";

export interface AIRequestContext {
  user: any;
  config: AIConfiguration;
  operationId: string;
  sanitizedInput: string;
  requestStart: number;
}

export async function withAIPerformanceOptimization<T>(
  request: NextRequest,
  handler: (context: AIRequestContext) => Promise<T>,
  operationType: string = "AI Generation"
): Promise<NextResponse> {
  let operationId: string | undefined;
  let config: AIConfiguration | undefined;

  try {
    // Authentication check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    config = body.config;

    if (!config) {
      return NextResponse.json(
        { error: "AI configuration required" },
        { status: 400 }
      );
    }

    // Generate operation ID for tracking
    operationId = `${operationType
      .toLowerCase()
      .replace(/\s+/g, "-")}-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Start performance monitoring
    performanceMonitor.startOperation(
      operationId,
      config.provider,
      config.model === "custom"
        ? config.customModelName || "unknown"
        : config.model
    );

    // Rate limiting check
    const rateLimitResult = await rateLimiter.checkRateLimit(
      user.id,
      config.provider
    );
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: `Rate limit exceeded for ${config.provider}. Try again in ${rateLimitResult.retryAfter} seconds.`,
          retryAfter: rateLimitResult.retryAfter,
          provider: config.provider,
        },
        {
          status: 429,
          headers: {
            "Retry-After": rateLimitResult.retryAfter?.toString() || "60",
            "X-RateLimit-Provider": config.provider,
          },
        }
      );
    }

    // Sanitize input text if provided
    let sanitizedInput = "";
    if (body.text) {
      const sanitizationResult = sanitizeAIRequest(body.text, 50000);
      if (!sanitizationResult.isValid) {
        return NextResponse.json(
          { error: "Invalid or potentially unsafe content provided" },
          { status: 400 }
        );
      }
      sanitizedInput = sanitizationResult.content;
    }

    // Create context for handler
    const context: AIRequestContext = {
      user,
      config,
      operationId,
      sanitizedInput,
      requestStart: Date.now(),
    };

    // Execute the main handler
    const result = await handler(context);

    // Sanitize response
    const { sanitized: sanitizedResult, warnings: responseWarnings } =
      sanitizeAIResponse(result);

    // Finish performance monitoring
    const performanceMetrics = performanceMonitor.finishOperation(operationId);

    // Add performance metadata to response
    let enhancedResult: any;
    if (typeof sanitizedResult === "object" && sanitizedResult !== null) {
      enhancedResult = {
        ...sanitizedResult,
        metadata: {
          ...sanitizedResult.metadata,
          operationId,
          performance: performanceMetrics
            ? {
                duration: performanceMetrics.duration,
                tokensPerSecond:
                  performanceMetrics.tokensUsed && performanceMetrics.duration
                    ? Math.round(
                        (performanceMetrics.tokensUsed /
                          performanceMetrics.duration) *
                          1000
                      )
                    : undefined,
                errorsEncountered: performanceMetrics.errorsEncountered,
                provider: config.provider,
              }
            : undefined,
          warnings: responseWarnings.length > 0 ? responseWarnings : undefined,
        },
      };
    } else {
      enhancedResult = sanitizedResult;
    }

    return NextResponse.json(enhancedResult);
  } catch (error: any) {
    // Record error if we have monitoring set up
    if (operationId) {
      performanceMonitor.recordError(operationId);
      performanceMonitor.finishOperation(operationId);
    }

    console.error(`${operationType} error:`, error);

    // Enhanced error response
    const errorResponse: any = {
      error: error?.message || `${operationType} failed`,
      timestamp: new Date().toISOString(),
      operationId: operationId || "unknown",
    };

    // Add provider context if available
    if (config) {
      errorResponse.provider = config.provider;
      errorResponse.model =
        config.model === "custom" ? config.customModelName : config.model;
    }

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Helper function to add error tracking during AI operations
export function trackAIError(operationId: string, error: any): void {
  performanceMonitor.recordError(operationId);

  // Log structured error for debugging
  console.error("AI Operation Error:", {
    operationId,
    error: error?.message || "Unknown error",
    stack: error?.stack,
    timestamp: new Date().toISOString(),
  });
}

// Helper function to add token usage tracking
export function trackTokenUsage(operationId: string, tokens: number): void {
  performanceMonitor.recordTokenUsage(operationId, tokens);
}

// Helper function to track chunk processing
export function trackChunkProcessed(operationId: string): void {
  performanceMonitor.recordChunkProcessed(operationId);
}

// Performance summary for debugging and monitoring
export function getAIPerformanceSummary(
  provider?: string,
  timeWindowHours: number = 24
): {
  provider?: string;
  timeWindow: string;
  averagePerformance: any;
  recommendations: string[];
} {
  const windowMs = timeWindowHours * 60 * 60 * 1000;

  if (provider) {
    const performance = performanceMonitor.getAveragePerformance(
      provider,
      windowMs
    );
    const recommendations = generatePerformanceRecommendations(
      provider,
      performance
    );

    return {
      provider,
      timeWindow: `${timeWindowHours} hours`,
      averagePerformance: performance,
      recommendations,
    };
  } else {
    return {
      timeWindow: `${timeWindowHours} hours`,
      averagePerformance: "No specific provider specified",
      recommendations: ["Specify a provider for detailed performance analysis"],
    };
  }
}

function generatePerformanceRecommendations(
  provider: string,
  performance: {
    avgDuration: number;
    avgTokensPerSecond: number;
    errorRate: number;
    sampleSize: number;
  }
): string[] {
  const recommendations: string[] = [];

  if (performance.errorRate > 0.1) {
    recommendations.push(
      `High error rate detected (${Math.round(
        performance.errorRate * 100
      )}%). Consider checking API key validity and model availability.`
    );
  }

  if (
    performance.avgTokensPerSecond < 10 &&
    provider !== "ollama" &&
    !provider.includes("localhost")
  ) {
    recommendations.push(
      "Low token throughput detected. Consider checking network connectivity or switching to a faster model."
    );
  }

  if (performance.avgDuration > 30000) {
    recommendations.push(
      "Long response times detected. Consider breaking requests into smaller chunks or using a more efficient model."
    );
  }

  if (performance.sampleSize < 5) {
    recommendations.push(
      "Limited performance data available. More operations needed for accurate analysis."
    );
  }

  // Provider-specific recommendations
  switch (provider) {
    case "openai":
      if (performance.avgTokensPerSecond < 50) {
        recommendations.push(
          "Consider upgrading to GPT-4 Turbo for better performance with large requests."
        );
      }
      break;
    case "anthropic":
      if (performance.avgTokensPerSecond < 30) {
        recommendations.push(
          "Claude models perform better with structured prompts. Consider optimizing your prompt format."
        );
      }
      break;
    case "ollama":
    case "localhost-ollama":
      if (performance.avgTokensPerSecond < 5) {
        recommendations.push(
          "Local model performance is low. Consider allocating more system resources or using a smaller model."
        );
      }
      break;
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "Performance is within expected ranges. No immediate optimizations needed."
    );
  }

  return recommendations;
}
