/**
 * Enhanced error logging utility for better debugging of Supabase and other errors
 */

export interface SupabaseError {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
  [key: string]: any;
}

/**
 * Safely log Supabase errors with detailed information
 */
export function logSupabaseError(
  prefix: string,
  error: SupabaseError | any
): void {
  console.error(`${prefix}:`, {
    message: error?.message || "No message",
    details: error?.details || "No details",
    hint: error?.hint || "No hint",
    code: error?.code || "No code",
    timestamp: new Date().toISOString(),
    // Try to stringify the full error safely
    fullError: (() => {
      try {
        return JSON.stringify(error, null, 2);
      } catch (stringifyError) {
        return `Failed to stringify error: ${stringifyError}`;
      }
    })(),
    // Extract any other useful properties
    ...(error && typeof error === "object"
      ? {
          errorType: error.constructor?.name,
          keys: Object.keys(error),
        }
      : {}),
  });
}

/**
 * Safely log general errors with stack traces
 */
export function logError(prefix: string, error: Error | any): void {
  console.error(`${prefix}:`, {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
    errorType: error?.constructor?.name,
    fullError: error,
  });
}

/**
 * Add context to help debug database operations
 */
export function logDatabaseOperation(
  operation: string,
  table: string,
  userId?: string,
  projectId?: string,
  additional?: Record<string, any>
): void {
  console.log(`[DB-${operation.toUpperCase()}] ${table}:`, {
    timestamp: new Date().toISOString(),
    userId: userId || "unknown",
    projectId: projectId || "none",
    ...additional,
  });
}
