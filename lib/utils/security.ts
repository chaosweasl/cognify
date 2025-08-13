/**
 * Input validation and sanitization utilities for Cognify
 * Prevents XSS, injection attacks, and ensures data integrity
 */

/**
 * Basic HTML sanitization - escapes dangerous characters
 */
function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Validate and sanitize text input
 */
export function validateAndSanitizeText(
  input: string,
  maxLength: number = 1000,
  fieldName: string = "Input"
): { isValid: boolean; sanitized: string; error?: string } {
  if (typeof input !== "string") {
    return {
      isValid: false,
      sanitized: "",
      error: `${fieldName} must be a string`,
    };
  }

  if (input.length === 0) {
    return {
      isValid: false,
      sanitized: "",
      error: `${fieldName} cannot be empty`,
    };
  }

  if (input.length > maxLength) {
    return {
      isValid: false,
      sanitized: "",
      error: `${fieldName} cannot exceed ${maxLength} characters`,
    };
  }

  // Basic sanitization to prevent XSS
  const sanitized = sanitizeHtml(input.trim());

  return {
    isValid: true,
    sanitized,
  };
}

/**
 * Validate email with stricter rules
 */
export function validateEmail(email: string): {
  isValid: boolean;
  error?: string;
} {
  if (typeof email !== "string") {
    return { isValid: false, error: "Email must be a string" };
  }

  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(email)) {
    return { isValid: false, error: "Please enter a valid email address" };
  }

  if (email.length > 254) {
    return { isValid: false, error: "Email address is too long" };
  }

  return { isValid: true };
}

/**
 * Validate password with security requirements
 */
export function validatePassword(password: string): {
  isValid: boolean;
  error?: string;
} {
  if (typeof password !== "string") {
    return { isValid: false, error: "Password must be a string" };
  }

  if (password.length < 8) {
    return {
      isValid: false,
      error: "Password must be at least 8 characters long",
    };
  }

  if (password.length > 128) {
    return { isValid: false, error: "Password cannot exceed 128 characters" };
  }

  // Check for at least one lowercase, uppercase, number, and special character
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (!hasLowercase || !hasUppercase || !hasNumber || !hasSpecialChar) {
    return {
      isValid: false,
      error:
        "Password must contain at least one lowercase letter, uppercase letter, number, and special character",
    };
  }

  return { isValid: true };
}

/**
 * Validate UUID format
 */
export function validateUUID(uuid: string): {
  isValid: boolean;
  error?: string;
} {
  if (typeof uuid !== "string") {
    return { isValid: false, error: "UUID must be a string" };
  }

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(uuid)) {
    return { isValid: false, error: "Invalid UUID format" };
  }

  return { isValid: true };
}

/**
 * Validate project name
 */
export function validateProjectName(name: string): {
  isValid: boolean;
  sanitized: string;
  error?: string;
} {
  return validateAndSanitizeText(name, 100, "Project name");
}

/**
 * Validate flashcard content
 */
export function validateFlashcardContent(
  front: string,
  back: string
): {
  isValid: boolean;
  sanitizedFront: string;
  sanitizedBack: string;
  error?: string;
} {
  const frontValidation = validateAndSanitizeText(
    front,
    2000,
    "Flashcard front"
  );
  if (!frontValidation.isValid) {
    return {
      isValid: false,
      sanitizedFront: "",
      sanitizedBack: "",
      error: frontValidation.error,
    };
  }

  const backValidation = validateAndSanitizeText(back, 2000, "Flashcard back");
  if (!backValidation.isValid) {
    return {
      isValid: false,
      sanitizedFront: "",
      sanitizedBack: "",
      error: backValidation.error,
    };
  }

  return {
    isValid: true,
    sanitizedFront: frontValidation.sanitized,
    sanitizedBack: backValidation.sanitized,
  };
}

/**
 * Rate limiting helper
 */
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remainingRequests: number; resetTime: number } {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  // Clean up old entries
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < windowStart) {
      rateLimitStore.delete(key);
    }
  }

  const current = rateLimitStore.get(identifier);

  if (!current || current.resetTime < windowStart) {
    // First request or outside window
    const resetTime = now + config.windowMs;
    rateLimitStore.set(identifier, { count: 1, resetTime });
    return {
      allowed: true,
      remainingRequests: config.maxRequests - 1,
      resetTime,
    };
  }

  if (current.count >= config.maxRequests) {
    return {
      allowed: false,
      remainingRequests: 0,
      resetTime: current.resetTime,
    };
  }

  current.count++;
  return {
    allowed: true,
    remainingRequests: config.maxRequests - current.count,
    resetTime: current.resetTime,
  };
}
