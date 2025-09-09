/**
 * Enhanced AI Error Handling and CORS Fallback System
 *
 * Provides comprehensive error handling, CORS detection, and fallback mechanisms
 * for AI provider interactions in the BYO API key model.
 */

import { AIConfiguration } from "@/lib/ai/types";

export interface AIError {
  code: string;
  message: string;
  originalError?: Error | unknown;
  provider?: string;
  model?: string;
  isCORSError?: boolean;
  isRateLimit?: boolean;
  isAuth?: boolean;
  fallbackSuggested?: boolean;
}

export interface AIFallbackSuggestion {
  title: string;
  description: string;
  actionText: string;
  actionUrl?: string;
  priority: "high" | "medium" | "low";
  steps: string[];
}

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

// Default retry configuration
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
};

// CORS error patterns by provider
const CORS_ERROR_PATTERNS = {
  network: [
    "Failed to fetch",
    "NetworkError",
    "CORS",
    "Cross-Origin Request Blocked",
    "ERR_BLOCKED_BY_CLIENT",
  ],
  openai: ["api.openai.com", "cors", "blocked by CORS policy"],
  anthropic: ["api.anthropic.com", "cors", "blocked by CORS policy"],
  deepseek: ["api.deepseek.com", "cors", "blocked by CORS policy"],
};

// Rate limit patterns by provider
const RATE_LIMIT_PATTERNS = {
  openai: [
    "rate_limit_exceeded",
    "Rate limit reached",
    "429",
    "too many requests",
  ],
  anthropic: ["rate_limit_error", "Rate limit", "429", "requests per"],
  deepseek: ["rate_limit", "429", "too many requests"],
};

// Authentication error patterns by provider
const AUTH_ERROR_PATTERNS = {
  openai: ["invalid_api_key", "Incorrect API key", "401", "unauthorized"],
  anthropic: ["authentication_error", "Invalid API key", "401", "unauthorized"],
  deepseek: ["invalid_api_key", "authentication failed", "401", "unauthorized"],
};

/**
 * Detects if an error is likely caused by CORS restrictions
 */
export function detectCORSError(
  error: Error | unknown,
  provider?: string
): boolean {
  if (!error) return false;

  const errorMessage =
    typeof error === "string"
      ? error
      : error instanceof Error
      ? error.message
      : String(error);

  const lowerMessage = errorMessage.toLowerCase();

  // Check general CORS patterns
  for (const pattern of CORS_ERROR_PATTERNS.network) {
    if (lowerMessage.includes(pattern.toLowerCase())) {
      return true;
    }
  }

  // Check provider-specific patterns
  if (
    provider &&
    CORS_ERROR_PATTERNS[provider as keyof typeof CORS_ERROR_PATTERNS]
  ) {
    const providerPatterns =
      CORS_ERROR_PATTERNS[provider as keyof typeof CORS_ERROR_PATTERNS];
    for (const pattern of providerPatterns) {
      if (lowerMessage.includes(pattern.toLowerCase())) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Detects if an error is related to rate limiting
 */
export function detectRateLimitError(
  error: Error | unknown,
  provider?: string
): boolean {
  if (!error) return false;

  const errorMessage =
    typeof error === "string"
      ? error
      : error instanceof Error
      ? error.message
      : String(error);

  const lowerMessage = errorMessage.toLowerCase();

  // Check provider-specific rate limit patterns
  if (
    provider &&
    RATE_LIMIT_PATTERNS[provider as keyof typeof RATE_LIMIT_PATTERNS]
  ) {
    const providerPatterns =
      RATE_LIMIT_PATTERNS[provider as keyof typeof RATE_LIMIT_PATTERNS];
    for (const pattern of providerPatterns) {
      if (lowerMessage.includes(pattern.toLowerCase())) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Detects if an error is related to authentication/API key issues
 */
export function detectAuthError(
  error: Error | unknown,
  provider?: string
): boolean {
  if (!error) return false;

  const errorMessage =
    typeof error === "string"
      ? error
      : error instanceof Error
      ? error.message
      : String(error);

  const lowerMessage = errorMessage.toLowerCase();

  // Check provider-specific auth patterns
  if (
    provider &&
    AUTH_ERROR_PATTERNS[provider as keyof typeof AUTH_ERROR_PATTERNS]
  ) {
    const providerPatterns =
      AUTH_ERROR_PATTERNS[provider as keyof typeof AUTH_ERROR_PATTERNS];
    for (const pattern of providerPatterns) {
      if (lowerMessage.includes(pattern.toLowerCase())) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Enhances an error with additional context and classification
 */
export function enhanceAIError(
  error: Error | unknown,
  config: AIConfiguration
): AIError {
  const provider = config.provider;
  const model =
    config.model === "custom" ? config.customModelName : config.model;

  const originalMessage =
    typeof error === "string"
      ? error
      : error instanceof Error
      ? error.message
      : String(error);

  const isCORSError = detectCORSError(error, provider);
  const isRateLimit = detectRateLimitError(error, provider);
  const isAuth = detectAuthError(error, provider);

  // Generate appropriate error code
  let code = "UNKNOWN_ERROR";
  if (isCORSError) code = "CORS_ERROR";
  else if (isRateLimit) code = "RATE_LIMIT_ERROR";
  else if (isAuth) code = "AUTH_ERROR";

  // Generate user-friendly message
  let message = originalMessage;
  if (isCORSError) {
    message = `Browser security (CORS) prevents direct connection to ${provider}. This is normal for browser-based applications.`;
  } else if (isRateLimit) {
    message = `Rate limit exceeded for ${provider}. Please wait a moment before trying again.`;
  } else if (isAuth) {
    message = `Invalid or missing API key for ${provider}. Please check your API key configuration.`;
  }

  return {
    code,
    message,
    originalError: error,
    provider,
    model,
    isCORSError,
    isRateLimit,
    isAuth,
    fallbackSuggested: isCORSError, // Suggest fallback for CORS errors
  };
}

/**
 * Gets fallback suggestions based on error type and provider
 */
export function getFallbackSuggestions(
  aiError: AIError,
  config: AIConfiguration
): AIFallbackSuggestion[] {
  const suggestions: AIFallbackSuggestion[] = [];

  if (aiError.isCORSError) {
    suggestions.push({
      title: "Use Manual Copy-Paste Workflow",
      description:
        "Browser security prevents direct API calls. Use our manual workflow instead - it's just as effective!",
      actionText: "Go to Manual Guide",
      actionUrl: "/docs/generate",
      priority: "high",
      steps: [
        "Copy the provided prompt template",
        `Paste it into ${config.provider}'s official interface`,
        "Copy the JSON response",
        "Import it back into Cognify using the JSON importer",
      ],
    });

    // Provider-specific manual instructions
    if (config.provider === "openai") {
      suggestions.push({
        title: "Use ChatGPT Web Interface",
        description:
          "OpenAI's web interface is always available and works great for flashcard generation",
        actionText: "Open ChatGPT",
        actionUrl: "https://chat.openai.com",
        priority: "high",
        steps: [
          "Go to chat.openai.com",
          "Paste the prompt we provide",
          "Copy the JSON response",
          "Import using our JSON importer",
        ],
      });
    } else if (config.provider === "anthropic") {
      suggestions.push({
        title: "Use Claude Web Interface",
        description:
          "Claude's web interface provides excellent flashcard generation capabilities",
        actionText: "Open Claude",
        actionUrl: "https://claude.ai",
        priority: "high",
        steps: [
          "Go to claude.ai",
          "Paste the prompt we provide",
          "Copy the JSON response",
          "Import using our JSON importer",
        ],
      });
    }
  }

  if (aiError.isRateLimit) {
    suggestions.push({
      title: "Wait and Retry",
      description:
        "Rate limits are temporary. Wait a few minutes then try again with a smaller batch size.",
      actionText: "Learn About Rate Limits",
      actionUrl: "/docs/troubleshooting#rate-limits",
      priority: "medium",
      steps: [
        "Wait 1-5 minutes depending on your tier",
        "Try generating fewer flashcards at once",
        "Consider upgrading your API plan if needed",
        "Use the manual workflow as a backup",
      ],
    });
  }

  if (aiError.isAuth) {
    suggestions.push({
      title: "Check Your API Key",
      description:
        "Your API key may be invalid, expired, or incorrectly formatted.",
      actionText: "API Key Help",
      actionUrl: "/docs/api-keys",
      priority: "high",
      steps: [
        "Verify your API key is correctly copied",
        "Check if the key has expired or been revoked",
        "Ensure the key has the necessary permissions",
        "Try generating a new API key",
      ],
    });
  }

  // Always suggest the manual workflow as a backup
  if (!suggestions.some((s) => s.actionUrl === "/docs/generate")) {
    suggestions.push({
      title: "Manual Backup Workflow",
      description:
        "When direct API calls fail, our manual workflow provides a reliable alternative.",
      actionText: "View Manual Guide",
      actionUrl: "/docs/generate",
      priority: "low",
      steps: [
        "Copy our optimized prompts",
        "Use your AI provider's official interface",
        "Import the results via JSON",
        "Continue studying normally",
      ],
    });
  }

  return suggestions.sort((a, b) => {
    const priority = { high: 3, medium: 2, low: 1 };
    return priority[b.priority] - priority[a.priority];
  });
}

/**
 * Implements exponential backoff retry logic
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  shouldRetry?: (error: Error | unknown, attempt: number) => boolean
): Promise<T> {
  let lastError: Error | unknown;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry on the last attempt
      if (attempt === config.maxRetries) {
        throw error;
      }

      // Check if we should retry this error
      if (shouldRetry && !shouldRetry(error, attempt)) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.initialDelay * Math.pow(config.backoffMultiplier, attempt),
        config.maxDelay
      );

      console.warn(
        `Attempt ${attempt + 1} failed, retrying in ${delay}ms:`,
        error
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Determines if an error should be retried
 */
export function shouldRetryError(error: Error | unknown): boolean {
  // Don't retry CORS errors (they won't resolve with retries)
  if (detectCORSError(error)) {
    return false;
  }

  // Don't retry auth errors (they need user action)
  if (detectAuthError(error)) {
    return false;
  }

  // Retry rate limit errors with increasing backoff
  if (detectRateLimitError(error)) {
    return true;
  }

  // Retry network errors (timeouts, connection issues)
  const errorMessage =
    typeof error === "string"
      ? error
      : error instanceof Error
      ? error.message
      : String(error);

  const retryablePatterns = [
    "timeout",
    "network error",
    "connection",
    "ECONNRESET",
    "ENOTFOUND",
    "EAI_AGAIN",
    "502",
    "503",
    "504",
  ];

  return retryablePatterns.some((pattern) =>
    errorMessage.toLowerCase().includes(pattern.toLowerCase())
  );
}

/**
 * Enhanced wrapper for AI operations with error handling and retry logic
 */
export async function executeAIOperation<T>(
  operation: () => Promise<T>,
  config: AIConfiguration,
  retryConfig?: RetryConfig
): Promise<{ result: T; error: null } | { result: null; error: AIError }> {
  try {
    const result = await retryWithBackoff(
      operation,
      retryConfig || DEFAULT_RETRY_CONFIG,
      (error) => shouldRetryError(error)
    );

    return { result, error: null };
  } catch (error) {
    const enhancedError = enhanceAIError(error, config);
    console.error("AI operation failed:", enhancedError);

    return { result: null, error: enhancedError };
  }
}
