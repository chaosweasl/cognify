/**
 * Performance optimization utilities for AI generation and API operations
 * Implements rate limiting, request batching, caching, and resource optimization
 */

// ============================================================================
// RATE LIMITING & THROTTLING
// ============================================================================

interface RateLimitConfig {
  requests: number;
  windowMs: number;
  provider: string;
}

// Provider-specific rate limits (requests per minute)
const PROVIDER_RATE_LIMITS: Record<string, RateLimitConfig> = {
  openai: { requests: 60, windowMs: 60000, provider: "openai" },
  anthropic: { requests: 50, windowMs: 60000, provider: "anthropic" },
  deepseek: { requests: 60, windowMs: 60000, provider: "deepseek" },
  ollama: { requests: 120, windowMs: 60000, provider: "ollama" },
  "localhost-ollama": {
    requests: 120,
    windowMs: 60000,
    provider: "localhost-ollama",
  },
  lmstudio: { requests: 120, windowMs: 60000, provider: "lmstudio" },
  "localhost-lmstudio": {
    requests: 120,
    windowMs: 60000,
    provider: "localhost-lmstudio",
  },
  "localhost-openai-compatible": {
    requests: 100,
    windowMs: 60000,
    provider: "localhost-openai-compatible",
  },
};

class RateLimiter {
  private requests: Map<string, { count: number; windowStart: number }> =
    new Map();

  async checkRateLimit(
    userId: string,
    provider: string
  ): Promise<{ allowed: boolean; retryAfter?: number }> {
    const config = PROVIDER_RATE_LIMITS[provider];
    if (!config) return { allowed: true }; // Unknown provider, allow through

    const key = `${userId}:${provider}`;
    const now = Date.now();

    let userRequests = this.requests.get(key);

    // Reset window if expired
    if (!userRequests || now - userRequests.windowStart >= config.windowMs) {
      userRequests = { count: 0, windowStart: now };
    }

    // Check if limit exceeded
    if (userRequests.count >= config.requests) {
      const retryAfter = Math.ceil(
        (userRequests.windowStart + config.windowMs - now) / 1000
      );
      return { allowed: false, retryAfter };
    }

    // Increment counter
    userRequests.count++;
    this.requests.set(key, userRequests);

    return { allowed: true };
  }

  // Clean up old entries periodically
  cleanup() {
    const now = Date.now();
    for (const [key, data] of this.requests.entries()) {
      if (
        now - data.windowStart >
        Math.max(...Object.values(PROVIDER_RATE_LIMITS).map((c) => c.windowMs))
      ) {
        this.requests.delete(key);
      }
    }
  }
}

export const rateLimiter = new RateLimiter();

// Cleanup every 5 minutes
setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);

// ============================================================================
// REQUEST OPTIMIZATION & BATCHING
// ============================================================================

export interface OptimizedChunkingOptions {
  maxChunkSize: number;
  overlapSize: number;
  preserveContext: boolean;
  balanceChunks: boolean;
}

export function optimizeTextChunking(
  text: string,
  options: OptimizedChunkingOptions
): string[] {
  const { maxChunkSize, overlapSize, preserveContext, balanceChunks } = options;

  // Pre-process text
  const cleanText = text.replace(/\s+/g, " ").trim();

  if (cleanText.length <= maxChunkSize) {
    return [cleanText];
  }

  // Split by paragraphs first
  const paragraphs = cleanText.split(/\n\s*\n/).filter((p) => p.trim());

  if (balanceChunks) {
    // Calculate optimal chunk count and size
    const totalLength = cleanText.length;
    const optimalChunks = Math.ceil(totalLength / maxChunkSize);
    const targetChunkSize = Math.floor(totalLength / optimalChunks);

    return createBalancedChunks(
      paragraphs,
      targetChunkSize,
      overlapSize,
      preserveContext
    );
  } else {
    return createStandardChunks(
      paragraphs,
      maxChunkSize,
      overlapSize,
      preserveContext
    );
  }
}

function createBalancedChunks(
  paragraphs: string[],
  targetSize: number,
  overlapSize: number,
  preserveContext: boolean
): string[] {
  const chunks: string[] = [];
  let currentChunk = "";
  let previousChunk = "";

  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i];
    const wouldExceedTarget =
      currentChunk.length + paragraph.length > targetSize * 1.2;

    if (wouldExceedTarget && currentChunk.length > targetSize * 0.8) {
      // Add overlap from previous chunk if context preservation is enabled
      if (preserveContext && previousChunk && chunks.length > 0) {
        const overlap = extractOverlap(previousChunk, overlapSize);
        currentChunk = overlap + "\n\n" + currentChunk;
      }

      chunks.push(currentChunk.trim());
      previousChunk = currentChunk;
      currentChunk = paragraph;
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
    }
  }

  if (currentChunk.trim()) {
    if (preserveContext && previousChunk && chunks.length > 0) {
      const overlap = extractOverlap(previousChunk, overlapSize);
      currentChunk = overlap + "\n\n" + currentChunk;
    }
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

function createStandardChunks(
  paragraphs: string[],
  maxSize: number,
  overlapSize: number,
  preserveContext: boolean
): string[] {
  const chunks: string[] = [];
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length + 2 <= maxSize) {
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }

      // Handle oversized paragraphs
      if (paragraph.length > maxSize) {
        const sentences = splitIntoSentences(paragraph);
        currentChunk = "";

        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length + 2 <= maxSize) {
            currentChunk += (currentChunk ? " " : "") + sentence;
          } else {
            if (currentChunk) {
              chunks.push(currentChunk.trim());
            }
            currentChunk = sentence;
          }
        }
      } else {
        currentChunk = paragraph;
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  // Add overlaps if context preservation is enabled
  if (preserveContext && overlapSize > 0) {
    return addContextualOverlaps(chunks, overlapSize);
  }

  return chunks;
}

function splitIntoSentences(text: string): string[] {
  // Enhanced sentence splitting that handles common abbreviations
  const abbrevRegex = /(?:Dr|Mr|Mrs|Ms|Prof|Inc|Ltd|Corp|etc|vs|ie|eg)\./gi;
  const protectedText = text.replace(abbrevRegex, (match) =>
    match.replace(".", "<!DOT!>")
  );

  const sentences = protectedText
    .split(/[.!?]+\s+/)
    .map((s) => s.replace(/<!DOT!>/g, ".").trim())
    .filter((s) => s.length > 0);

  return sentences;
}

function extractOverlap(text: string, size: number): string {
  if (text.length <= size) return text;

  // Try to break at sentence boundaries
  const sentences = splitIntoSentences(text);
  let overlap = "";

  for (let i = sentences.length - 1; i >= 0; i--) {
    const candidate = sentences.slice(i).join(". ");
    if (candidate.length <= size) {
      overlap = candidate;
      break;
    }
  }

  // Fallback to character limit
  if (!overlap) {
    overlap = text.slice(-size);
  }

  return overlap;
}

function addContextualOverlaps(
  chunks: string[],
  overlapSize: number
): string[] {
  if (chunks.length <= 1 || overlapSize <= 0) return chunks;

  const overlappedChunks: string[] = [chunks[0]];

  for (let i = 1; i < chunks.length; i++) {
    const prevChunk = chunks[i - 1];
    const currentChunk = chunks[i];
    const overlap = extractOverlap(prevChunk, overlapSize);

    overlappedChunks.push(overlap + "\n\n" + currentChunk);
  }

  return overlappedChunks;
}

// ============================================================================
// REQUEST/RESPONSE SANITIZATION
// ============================================================================

export interface SanitizationResult {
  content: string;
  isValid: boolean;
  warnings: string[];
  tokensEstimate: number;
}

export function sanitizeAIRequest(
  content: string,
  maxLength: number = 50000
): SanitizationResult {
  const warnings: string[] = [];

  // Remove potentially dangerous content
  let sanitized = content
    // Remove HTML/XML tags
    .replace(/<[^>]*>/g, " ")
    // Remove excessive whitespace
    .replace(/\s+/g, " ")
    // Remove null characters
    .replace(/\0/g, "")
    // Remove control characters except newlines and tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /(?:javascript|vbscript|onload|onerror):/gi,
    /data:(?:text\/html|application\/javascript)/gi,
    /<script[^>]*>/gi,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(sanitized)) {
      warnings.push("Potentially unsafe content detected and removed");
      sanitized = sanitized.replace(pattern, "[REMOVED]");
    }
  }

  // Truncate if too long
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
    warnings.push(`Content truncated to ${maxLength} characters`);
  }

  // Basic token estimation (rough approximation: 1 token ≈ 4 characters)
  const tokensEstimate = Math.ceil(sanitized.length / 4);

  const isValid = sanitized.trim().length > 0 && sanitized.length >= 10;

  return {
    content: sanitized.trim(),
    isValid,
    warnings,
    tokensEstimate,
  };
}

export function sanitizeAIResponse(response: unknown): {
  sanitized: unknown;
  warnings: string[];
} {
  const warnings: string[] = [];

  if (!response) {
    return { sanitized: null, warnings: ["Empty response received"] };
  }

  // Deep clone to avoid mutations
  let sanitized = JSON.parse(JSON.stringify(response));

  // Remove potentially dangerous keys
  const dangerousKeys = ["__proto__", "constructor", "prototype"];
  function cleanObject(obj: unknown): unknown {
    if (obj === null || typeof obj !== "object") return obj;

    if (Array.isArray(obj)) {
      return obj.map(cleanObject);
    }

    const cleaned: Record<string, unknown> = {};
    if (typeof obj === "object" && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        if (dangerousKeys.includes(key)) {
          warnings.push(`Dangerous key '${key}' removed from response`);
          continue;
        }
        cleaned[key] = cleanObject(value);
      }
    }

    return cleaned;
  }

  sanitized = cleanObject(sanitized);

  return { sanitized, warnings };
}

// ============================================================================
// TOKEN USAGE OPTIMIZATION
// ============================================================================

export interface TokenOptimizationOptions {
  provider: string;
  model: string;
  maxTokens: number;
  reserveTokens: number; // Tokens to reserve for response
}

export function optimizePromptForTokens(
  prompt: string,
  options: TokenOptimizationOptions
): {
  optimizedPrompt: string;
  estimatedTokens: number;
  compressionRatio: number;
} {
  const { maxTokens, reserveTokens } = options;
  const targetTokens = maxTokens - reserveTokens;

  // Estimate current tokens (rough approximation)
  const currentTokens = Math.ceil(prompt.length / 4);

  if (currentTokens <= targetTokens) {
    return {
      optimizedPrompt: prompt,
      estimatedTokens: currentTokens,
      compressionRatio: 1.0,
    };
  }

  // Apply optimization strategies
  let optimized = prompt;

  // 1. Remove redundant whitespace and formatting
  optimized = optimized.replace(/\s+/g, " ").trim();

  // 2. Compress common phrases
  const compressionMap = {
    "generate flashcards from": "create cards from",
    "Please create": "Create",
    "You need to": "To",
    "It is important to": "Important:",
    "In order to": "To",
    "due to the fact that": "because",
    "at this point in time": "now",
    "in the event that": "if",
  };

  for (const [verbose, concise] of Object.entries(compressionMap)) {
    optimized = optimized.replace(new RegExp(verbose, "gi"), concise);
  }

  // 3. If still too long, trim content intelligently
  const newTokenCount = Math.ceil(optimized.length / 4);
  if (newTokenCount > targetTokens) {
    const targetLength = targetTokens * 4;
    optimized = truncateIntelligently(optimized, targetLength);
  }

  const finalTokens = Math.ceil(optimized.length / 4);

  return {
    optimizedPrompt: optimized,
    estimatedTokens: finalTokens,
    compressionRatio: finalTokens / currentTokens,
  };
}

function truncateIntelligently(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  // Try to break at sentence boundaries
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s);
  let result = "";

  for (const sentence of sentences) {
    if (result.length + sentence.length + 2 <= maxLength) {
      result += (result ? ". " : "") + sentence;
    } else {
      break;
    }
  }

  // If we couldn't fit any complete sentences, do word-level truncation
  if (!result) {
    const words = text.split(" ");
    result = "";

    for (const word of words) {
      if (result.length + word.length + 1 <= maxLength) {
        result += (result ? " " : "") + word;
      } else {
        break;
      }
    }
  }

  return result + (result.length < text.length ? "..." : "");
}

// ============================================================================
// ADAPTIVE DELAY SYSTEM
// ============================================================================

export class AdaptiveDelayManager {
  private delayHistory: Map<string, number[]> = new Map();
  private baseDelay = 1000; // Base delay in ms
  private maxDelay = 10000; // Maximum delay in ms
  private minDelay = 100; // Minimum delay in ms

  calculateDelay(provider: string, consecutiveErrors: number = 0): number {
    const history = this.delayHistory.get(provider) || [];

    // Base delay with exponential backoff for errors
    let delay = this.baseDelay * Math.pow(2, Math.min(consecutiveErrors, 4));

    // Adjust based on recent performance
    if (history.length > 0) {
      const avgRecentDelay =
        history.slice(-5).reduce((a, b) => a + b, 0) /
        Math.min(history.length, 5);
      delay = Math.max(delay, avgRecentDelay * 0.8); // Don't go below 80% of recent average
    }

    // Apply provider-specific adjustments
    const providerMultipliers: Record<string, number> = {
      openai: 1.0,
      anthropic: 1.2, // Slightly more conservative
      deepseek: 0.8, // Generally faster
      ollama: 0.5, // Local, usually faster
      "localhost-ollama": 0.3,
      lmstudio: 0.5,
      "localhost-lmstudio": 0.3,
    };

    delay *= providerMultipliers[provider] || 1.0;

    // Clamp to bounds
    delay = Math.max(this.minDelay, Math.min(this.maxDelay, delay));

    // Store for future calculations
    history.push(delay);
    if (history.length > 10) history.shift(); // Keep only recent history
    this.delayHistory.set(provider, history);

    return Math.round(delay);
  }

  async delay(provider: string, consecutiveErrors: number = 0): Promise<void> {
    const delayMs = this.calculateDelay(provider, consecutiveErrors);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  // Reset delay history for a provider (e.g., when switching models)
  reset(provider: string) {
    this.delayHistory.delete(provider);
  }
}

export const adaptiveDelayManager = new AdaptiveDelayManager();

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

// Model token limits for different providers
export const MODEL_TOKEN_LIMITS: Record<string, Record<string, number>> = {
  openai: {
    "gpt-4": 8192,
    "gpt-4-32k": 32768,
    "gpt-4-turbo": 128000,
    "gpt-4o": 128000,
    "gpt-4o-mini": 128000,
    "gpt-3.5-turbo": 4096,
    "gpt-3.5-turbo-16k": 16384,
  },
  anthropic: {
    "claude-3-opus-20240229": 200000,
    "claude-3-sonnet-20240229": 200000,
    "claude-3-haiku-20240307": 200000,
    "claude-2.1": 200000,
    "claude-2.0": 100000,
    "claude-instant-1.2": 100000,
  },
  deepseek: {
    "deepseek-chat": 32768,
    "deepseek-coder": 16384,
  },
  // Local models - assume reasonable defaults
  ollama: {
    llama2: 4096,
    codellama: 16384,
    mistral: 8192,
    "neural-chat": 4096,
  },
  "localhost-ollama": {
    llama2: 4096,
    codellama: 16384,
    mistral: 8192,
  },
  lmstudio: {
    default: 8192, // LM Studio varies by model
  },
  "localhost-lmstudio": {
    default: 8192,
  },
  "localhost-openai-compatible": {
    default: 8192,
  },
};

export function getMaxTokensForModel(
  provider: string,
  model: string
): number | null {
  const providerLimits = MODEL_TOKEN_LIMITS[provider];
  if (!providerLimits) return null;

  // Check exact model match first
  if (providerLimits[model]) {
    return providerLimits[model];
  }

  // Check for partial matches (e.g., 'gpt-4' matches 'gpt-4-0314')
  for (const [modelPattern, limit] of Object.entries(providerLimits)) {
    if (model.startsWith(modelPattern)) {
      return limit;
    }
  }

  // Fallback to default if available
  return providerLimits.default || null;
}

export interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  tokensUsed?: number;
  chunksProcessed?: number;
  errorsEncountered?: number;
  provider: string;
  model: string;
}

export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();

  startOperation(operationId: string, provider: string, model: string): void {
    this.metrics.set(operationId, {
      startTime: Date.now(),
      provider,
      model,
      errorsEncountered: 0,
    });
  }

  recordError(operationId: string): void {
    const metric = this.metrics.get(operationId);
    if (metric) {
      metric.errorsEncountered = (metric.errorsEncountered || 0) + 1;
    }
  }

  recordTokenUsage(operationId: string, tokens: number): void {
    const metric = this.metrics.get(operationId);
    if (metric) {
      metric.tokensUsed = (metric.tokensUsed || 0) + tokens;
    }
  }

  recordChunkProcessed(operationId: string): void {
    const metric = this.metrics.get(operationId);
    if (metric) {
      metric.chunksProcessed = (metric.chunksProcessed || 0) + 1;
    }
  }

  finishOperation(operationId: string): PerformanceMetrics | null {
    const metric = this.metrics.get(operationId);
    if (!metric) return null;

    metric.endTime = Date.now();
    metric.duration = metric.endTime - metric.startTime;

    return metric;
  }

  getAveragePerformance(
    provider: string,
    timeWindowMs: number = 24 * 60 * 60 * 1000
  ): {
    avgDuration: number;
    avgTokensPerSecond: number;
    errorRate: number;
    sampleSize: number;
  } {
    const cutoff = Date.now() - timeWindowMs;
    const relevantMetrics = Array.from(this.metrics.values()).filter(
      (m) =>
        m.provider === provider &&
        m.endTime &&
        m.endTime > cutoff &&
        m.duration !== undefined
    );

    if (relevantMetrics.length === 0) {
      return {
        avgDuration: 0,
        avgTokensPerSecond: 0,
        errorRate: 0,
        sampleSize: 0,
      };
    }

    const totalDuration = relevantMetrics.reduce(
      (sum, m) => sum + (m.duration || 0),
      0
    );
    const totalTokens = relevantMetrics.reduce(
      (sum, m) => sum + (m.tokensUsed || 0),
      0
    );
    const totalErrors = relevantMetrics.reduce(
      (sum, m) => sum + (m.errorsEncountered || 0),
      0
    );
    const totalOperations = relevantMetrics.length;

    return {
      avgDuration: totalDuration / totalOperations,
      avgTokensPerSecond: totalTokens / (totalDuration / 1000),
      errorRate: totalErrors / totalOperations,
      sampleSize: totalOperations,
    };
  }

  cleanup(maxAgeMs: number = 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - maxAgeMs;
    for (const [id, metric] of this.metrics.entries()) {
      if (metric.endTime && metric.endTime < cutoff) {
        this.metrics.delete(id);
      }
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Cleanup old metrics every hour
setInterval(() => performanceMonitor.cleanup(), 60 * 60 * 1000);
