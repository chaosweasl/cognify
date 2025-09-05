/**
 * Comprehensive input validation and sanitization utilities
 * for all user inputs across API routes and forms
 */

// Input sanitization patterns
const PATTERNS = {
  USERNAME: /^[a-zA-Z0-9_\-]{3,30}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  PROJECT_NAME: /^[a-zA-Z0-9\s\-_.,!?()]{1,100}$/,
  SAFE_STRING: /^[a-zA-Z0-9\s\-_.,!?()\[\]'"]{1,500}$/,
  API_KEY: /^[a-zA-Z0-9\-_.]{10,200}$/,
} as const;

// Maximum lengths for different field types
const MAX_LENGTHS = {
  USERNAME: 30,
  DISPLAY_NAME: 50,
  EMAIL: 254,
  BIO: 500,
  PROJECT_NAME: 100,
  PROJECT_DESCRIPTION: 500,
  FLASHCARD_FRONT: 1000,
  FLASHCARD_BACK: 2000,
  SAFE_TEXT: 5000,
  API_KEY: 200,
} as const;

/**
 * Sanitize HTML content to prevent XSS attacks
 * Simple sanitization without external dependencies
 */
export function sanitizeHTML(input: string): string {
  if (typeof input !== "string") return "";

  // Basic HTML entity encoding to prevent XSS
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Sanitize and validate username input
 */
export function validateUsername(username: unknown): {
  valid: boolean;
  value?: string;
  error?: string;
} {
  if (typeof username !== "string") {
    return { valid: false, error: "Username must be a string" };
  }

  const trimmed = username.trim();

  if (trimmed.length < 3) {
    return { valid: false, error: "Username must be at least 3 characters" };
  }

  if (trimmed.length > MAX_LENGTHS.USERNAME) {
    return {
      valid: false,
      error: `Username must be no more than ${MAX_LENGTHS.USERNAME} characters`,
    };
  }

  if (!PATTERNS.USERNAME.test(trimmed)) {
    return {
      valid: false,
      error:
        "Username can only contain letters, numbers, underscores, and hyphens",
    };
  }

  return { valid: true, value: trimmed };
}

/**
 * Validate email format
 */
export function validateEmail(email: unknown): {
  valid: boolean;
  value?: string;
  error?: string;
} {
  if (typeof email !== "string") {
    return { valid: false, error: "Email must be a string" };
  }

  const trimmed = email.trim().toLowerCase();

  if (trimmed.length > MAX_LENGTHS.EMAIL) {
    return { valid: false, error: "Email is too long" };
  }

  if (!PATTERNS.EMAIL.test(trimmed)) {
    return { valid: false, error: "Invalid email format" };
  }

  return { valid: true, value: trimmed };
}

/**
 * Validate UUID format
 */
export function validateUUID(id: unknown): {
  valid: boolean;
  value?: string;
  error?: string;
} {
  if (typeof id !== "string") {
    return { valid: false, error: "ID must be a string" };
  }

  if (!PATTERNS.UUID.test(id)) {
    return { valid: false, error: "Invalid ID format" };
  }

  return { valid: true, value: id };
}

/**
 * Sanitize and validate project name
 */
export function validateProjectName(name: unknown): {
  valid: boolean;
  value?: string;
  error?: string;
} {
  if (typeof name !== "string") {
    return { valid: false, error: "Project name must be a string" };
  }

  const sanitized = sanitizeHTML(name).trim();

  if (sanitized.length === 0) {
    return { valid: false, error: "Project name is required" };
  }

  if (sanitized.length > MAX_LENGTHS.PROJECT_NAME) {
    return {
      valid: false,
      error: `Project name must be no more than ${MAX_LENGTHS.PROJECT_NAME} characters`,
    };
  }

  if (!PATTERNS.PROJECT_NAME.test(sanitized)) {
    return { valid: false, error: "Project name contains invalid characters" };
  }

  return { valid: true, value: sanitized };
}

/**
 * Sanitize and validate safe text content (descriptions, bio, etc.)
 */
export function validateSafeText(
  text: unknown,
  maxLength: number = MAX_LENGTHS.SAFE_TEXT,
  required: boolean = false
): { valid: boolean; value?: string; error?: string } {
  if (typeof text !== "string") {
    return { valid: false, error: "Text must be a string" };
  }

  const sanitized = sanitizeHTML(text).trim();

  if (required && sanitized.length === 0) {
    return { valid: false, error: "This field is required" };
  }

  if (sanitized.length > maxLength) {
    return {
      valid: false,
      error: `Text must be no more than ${maxLength} characters`,
    };
  }

  return { valid: true, value: sanitized || undefined };
}

/**
 * Validate flashcard content
 */
export function validateFlashcardContent(
  front: unknown,
  back: unknown
): {
  valid: boolean;
  values?: { front: string; back: string };
  errors?: { front?: string; back?: string };
} {
  const frontValidation = validateSafeText(
    front,
    MAX_LENGTHS.FLASHCARD_FRONT,
    true
  );
  const backValidation = validateSafeText(
    back,
    MAX_LENGTHS.FLASHCARD_BACK,
    true
  );

  if (!frontValidation.valid || !backValidation.valid) {
    return {
      valid: false,
      errors: {
        front: frontValidation.error,
        back: backValidation.error,
      },
    };
  }

  return {
    valid: true,
    values: {
      front: frontValidation.value!,
      back: backValidation.value!,
    },
  };
}

/**
 * Validate API key format (basic validation)
 */
export function validateAPIKey(key: unknown): {
  valid: boolean;
  value?: string;
  error?: string;
} {
  if (typeof key !== "string") {
    return { valid: false, error: "API key must be a string" };
  }

  const trimmed = key.trim();

  if (trimmed.length < 10) {
    return { valid: false, error: "API key is too short" };
  }

  if (trimmed.length > MAX_LENGTHS.API_KEY) {
    return { valid: false, error: "API key is too long" };
  }

  if (!PATTERNS.API_KEY.test(trimmed)) {
    return { valid: false, error: "API key contains invalid characters" };
  }

  return { valid: true, value: trimmed };
}

/**
 * Validate pagination parameters
 */
export function validatePagination(
  page: unknown,
  limit: unknown
): {
  valid: boolean;
  values?: { page: number; limit: number };
  error?: string;
} {
  let pageNum = 1;
  let limitNum = 20;

  if (page !== undefined) {
    const parsed = parseInt(String(page), 10);
    if (isNaN(parsed) || parsed < 1) {
      return { valid: false, error: "Page must be a positive number" };
    }
    if (parsed > 1000) {
      return { valid: false, error: "Page number too large" };
    }
    pageNum = parsed;
  }

  if (limit !== undefined) {
    const parsed = parseInt(String(limit), 10);
    if (isNaN(parsed) || parsed < 1) {
      return { valid: false, error: "Limit must be a positive number" };
    }
    if (parsed > 100) {
      return { valid: false, error: "Limit cannot exceed 100" };
    }
    limitNum = parsed;
  }

  return { valid: true, values: { page: pageNum, limit: limitNum } };
}

/**
 * Validate numeric parameters with range checking
 */
export function validateNumber(
  value: unknown,
  min: number = 0,
  max: number = Number.MAX_SAFE_INTEGER,
  required: boolean = false
): { valid: boolean; value?: number; error?: string } {
  if (value === undefined || value === null || value === "") {
    if (required) {
      return { valid: false, error: "This field is required" };
    }
    return { valid: true, value: undefined };
  }

  const parsed = Number(value);

  if (isNaN(parsed) || !isFinite(parsed)) {
    return { valid: false, error: "Must be a valid number" };
  }

  if (parsed < min) {
    return { valid: false, error: `Must be at least ${min}` };
  }

  if (parsed > max) {
    return { valid: false, error: `Must be no more than ${max}` };
  }

  return { valid: true, value: parsed };
}

/**
 * Comprehensive request body validation
 */
export function validateRequestBody<T = Record<string, unknown>>(
  body: unknown,
  validationRules: Record<
    string,
    (value: unknown) => { valid: boolean; value?: unknown; error?: string }
  >
): { valid: boolean; data?: T; errors?: Record<string, string> } {
  if (!body || typeof body !== "object") {
    return { valid: false, errors: { _root: "Invalid request body" } };
  }

  const data: Record<string, unknown> = {};
  const errors: Record<string, string> = {};
  let hasErrors = false;

  for (const [field, validator] of Object.entries(validationRules)) {
    const result = validator((body as Record<string, unknown>)[field]);

    if (!result.valid && result.error) {
      errors[field] = result.error;
      hasErrors = true;
    } else if (result.valid && result.value !== undefined) {
      data[field] = result.value;
    }
  }

  if (hasErrors) {
    return { valid: false, errors };
  }

  return { valid: true, data: data as T };
}

/**
 * Middleware-compatible validation error response
 */
export function createValidationErrorResponse(errors: Record<string, string>) {
  return Response.json(
    {
      error: "Validation failed",
      details: errors,
    },
    { status: 400 }
  );
}

/**
 * Rate limiting helper to check if action should be blocked
 */
export function shouldRateLimit(
  identifier: string,
  action: string,
  _windowMs: number = 60000, // 1 minute
  _maxAttempts: number = 5
): boolean {
  // In a real implementation, this would use Redis or a database
  // For now, we'll use in-memory storage (not suitable for production)
  const _key = `${identifier}:${action}`;
  const _now = Date.now();

  // This would need to be replaced with a proper rate limiting solution
  // like Redis or a database-backed solution in production
  return false; // Placeholder - implement based on your infrastructure
}

/**
 * Validate file upload parameters
 */
export function validateFileUpload(
  file: File | null,
  allowedTypes: string[] = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ],
  maxSizeBytes: number = 5 * 1024 * 1024 // 5MB
): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: "No file provided" };
  }

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size must be less than ${Math.round(
        maxSizeBytes / 1024 / 1024
      )}MB`,
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(", ")}`,
    };
  }

  return { valid: true };
}
