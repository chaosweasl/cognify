/**
 * Enhanced Input Validation and XSS Prevention
 * Comprehensive protection against malicious inputs
 */

import { z } from "zod";
import DOMPurify from "isomorphic-dompurify";

// Enhanced input sanitization
export function sanitizeHtml(input: string): string {
  if (typeof input !== "string") return "";

  // Use DOMPurify for comprehensive HTML sanitization
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "u", "br", "p"],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
}

export function sanitizeString(input: string): string {
  if (typeof input !== "string") return "";

  return (
    input
      .trim()
      // Remove null bytes
      .replace(/\0/g, "")
      // Remove control characters except newline, carriage return, and tab
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
      // Normalize unicode
      .normalize("NFC")
  );
}

// XSS prevention patterns
const XSS_PATTERNS = [
  // JavaScript protocols
  /javascript:/gi,
  /vbscript:/gi,
  /data:/gi,
  /about:/gi,

  // Event handlers
  /on\w+\s*=/gi,

  // Script tags
  /<script[\s\S]*?<\/script>/gi,
  /<script[\s\S]*?>/gi,

  // Other dangerous tags
  /<iframe[\s\S]*?<\/iframe>/gi,
  /<object[\s\S]*?<\/object>/gi,
  /<embed[\s\S]*?>/gi,
  /<form[\s\S]*?<\/form>/gi,
  /<input[\s\S]*?>/gi,
  /<textarea[\s\S]*?<\/textarea>/gi,
  /<select[\s\S]*?<\/select>/gi,
  /<link[\s\S]*?>/gi,
  /<style[\s\S]*?<\/style>/gi,

  // HTML entity encoding attempts
  /&lt;script/gi,
  /&lt;iframe/gi,
  /&#60;script/gi,
  /&#x3C;script/gi,
];

export function detectXSS(input: string): boolean {
  if (typeof input !== "string") return false;

  return XSS_PATTERNS.some((pattern) => pattern.test(input));
}

// SQL injection patterns
const SQL_INJECTION_PATTERNS = [
  // Common SQL keywords in suspicious contexts
  /('|(\\'))+.*(or|and|union|select|insert|update|delete|drop|create|alter|exec|execute)\b/gi,
  /(union\s+select|select\s+.*\s+from|insert\s+into|update\s+.*\s+set|delete\s+from)/gi,
  /(';\s*(drop|delete|update|insert|create|alter)\s+)/gi,

  // SQL comments
  /(\/\*[\s\S]*?\*\/|--[^\r\n]*)/gi,

  // UNION attacks
  /union\s+all\s+select/gi,
  /union\s+select/gi,

  // Boolean-based blind SQL injection
  /'\s+(and|or)\s+'[01]'='[01]/gi,
  /'\s+(and|or)\s+\d+\s*=\s*\d+/gi,
];

export function detectSQLInjection(input: string): boolean {
  if (typeof input !== "string") return false;

  return SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(input));
}

// Path traversal patterns
const PATH_TRAVERSAL_PATTERNS = [
  /\.\./g,
  /\.\/\//g,
  /\\\.\\\./g,
  /%2e%2e/gi,
  /%252e%252e/gi,
  /\.%2f/gi,
  /\.%5c/gi,
];

export function detectPathTraversal(input: string): boolean {
  if (typeof input !== "string") return false;

  return PATH_TRAVERSAL_PATTERNS.some((pattern) => pattern.test(input));
}

// Command injection patterns
const COMMAND_INJECTION_PATTERNS = [
  /[;&|`$(){}[\]]/,
  /\b(eval|exec|system|shell_exec|passthru|proc_open|popen)\b/gi,
  /\b(cmd|command|powershell|bash|sh)\b/gi,
];

export function detectCommandInjection(input: string): boolean {
  if (typeof input !== "string") return false;

  return COMMAND_INJECTION_PATTERNS.some((pattern) => pattern.test(input));
}

// Comprehensive malicious input detection
export function detectMaliciousInput(input: string): {
  isMalicious: boolean;
  threats: string[];
  sanitized: string;
} {
  const threats: string[] = [];

  if (detectXSS(input)) threats.push("XSS");
  if (detectSQLInjection(input)) threats.push("SQL_INJECTION");
  if (detectPathTraversal(input)) threats.push("PATH_TRAVERSAL");
  if (detectCommandInjection(input)) threats.push("COMMAND_INJECTION");

  return {
    isMalicious: threats.length > 0,
    threats,
    sanitized: sanitizeString(input),
  };
}

// Enhanced validation schemas with security checks
export const SecureValidationSchemas = {
  // Secure text input with length and content validation
  secureText: (minLength = 1, maxLength = 500) =>
    z
      .string()
      .min(minLength)
      .max(maxLength)
      .refine((val) => !detectMaliciousInput(val).isMalicious, {
        message: "Input contains potentially malicious content",
      })
      .transform(sanitizeString),

  // Secure HTML input (for rich text editors)
  secureHtml: (maxLength = 2000) =>
    z.string().max(maxLength).transform(sanitizeHtml),

  // Secure email validation
  secureEmail: z
    .string()
    .email()
    .max(254) // RFC 5321 limit
    .toLowerCase()
    .transform(sanitizeString),

  // Secure URL validation
  secureUrl: z
    .string()
    .url()
    .max(2048)
    .refine(
      (val) => {
        try {
          const url = new URL(val);
          // Only allow http and https protocols
          return url.protocol === "http:" || url.protocol === "https:";
        } catch {
          return false;
        }
      },
      { message: "Only HTTP and HTTPS URLs are allowed" }
    ),

  // Secure filename validation
  secureFilename: z
    .string()
    .min(1)
    .max(255)
    .refine((val) => !/[<>:"/\\|?*\x00-\x1f]/.test(val), {
      message: "Filename contains invalid characters",
    })
    .refine((val) => !detectPathTraversal(val), {
      message: "Filename contains path traversal patterns",
    })
    .transform(sanitizeString),

  // Secure project name
  projectName: z
    .string()
    .min(1)
    .max(100)
    .refine((val) => !detectMaliciousInput(val).isMalicious, {
      message: "Project name contains potentially malicious content",
    })
    .transform(sanitizeString),

  // Secure flashcard content
  flashcardContent: z
    .string()
    .min(1)
    .max(2000)
    .refine((val) => !detectXSS(val), {
      message: "Content contains potentially dangerous scripts",
    })
    .transform(sanitizeHtml),

  // Secure tags array
  tagsArray: z
    .array(
      z
        .string()
        .min(1)
        .max(50)
        .refine((val) => !detectMaliciousInput(val).isMalicious, {
          message: "Tag contains potentially malicious content",
        })
        .transform(sanitizeString)
    )
    .max(20),
};

// Middleware function to validate and sanitize request body
export function validateRequestBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown
):
  | { success: true; data: T }
  | { success: false; error: string; issues: z.ZodIssue[] } {
  try {
    const result = schema.safeParse(body);

    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return {
        success: false,
        error: "Validation failed",
        issues: result.error.issues,
      };
    }
  } catch {
    return {
      success: false,
      error: "Validation error",
      issues: [],
    };
  }
}

// Security headers for XSS protection
export const XSS_PROTECTION_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "media-src 'self'",
    "object-src 'none'",
    "child-src 'none'",
    "worker-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; "),
};

// Validate file uploads
export function validateFileUpload(
  file: File,
  options: {
    maxSize?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}
): { valid: boolean; error?: string; sanitizedName?: string } {
  const {
    maxSize = 50 * 1024 * 1024, // 50MB default
    allowedTypes = ["application/pdf", "text/plain", "application/json"],
    allowedExtensions = [".pdf", ".txt", ".json"],
  } = options;

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${Math.round(
        maxSize / 1024 / 1024
      )}MB`,
    };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${
        file.type
      } not allowed. Allowed types: ${allowedTypes.join(", ")}`,
    };
  }

  // Check file extension
  const extension = file.name
    .toLowerCase()
    .substring(file.name.lastIndexOf("."));
  if (!allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `File extension ${extension} not allowed. Allowed extensions: ${allowedExtensions.join(
        ", "
      )}`,
    };
  }

  // Sanitize filename
  const sanitizedName = sanitizeString(
    file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
  );

  // Check for malicious patterns in filename
  if (detectMaliciousInput(file.name).isMalicious) {
    return {
      valid: false,
      error: "Filename contains potentially malicious content",
    };
  }

  return {
    valid: true,
    sanitizedName,
  };
}
