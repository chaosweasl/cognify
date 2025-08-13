/**
 * Comprehensive Error Handling and Validation System for Cognify
 * 
 * Provides standardized error handling, validation, and graceful degradation
 * Ensures consistent error responses and proper user feedback
 * 
 * Key features:
 * - Typed error classes for different error types
 * - Schema validation against database constraints
 * - Error boundaries for React components
 * - Graceful degradation utilities
 * - Development debugging tools
 */

/**
 * Comprehensive Error Handling and Validation System for Cognify
 * 
 * Provides standardized error handling, validation, and graceful degradation
 * Ensures consistent error responses and proper user feedback
 * 
 * Key features:
 * - Typed error classes for different error types
 * - Schema validation against database constraints
 * - Error boundaries for React components
 * - Graceful degradation utilities
 * - Development debugging tools
 */

// Standard error types for the application
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  DATABASE = 'DATABASE',
  NETWORK = 'NETWORK',
  SRS = 'SRS',
  CACHE = 'CACHE',
  UNKNOWN = 'UNKNOWN',
}

// Base error class with additional context
export class CognifyError extends Error {
  public readonly type: ErrorType;
  public readonly code: string;
  public readonly context?: Record<string, unknown>;
  public readonly timestamp: number;
  public readonly userMessage: string;

  constructor(
    type: ErrorType,
    code: string,
    message: string,
    userMessage?: string,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'CognifyError';
    this.type = type;
    this.code = code;
    this.userMessage = userMessage || 'An unexpected error occurred';
    this.context = context;
    this.timestamp = Date.now();

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CognifyError);
    }
  }

  // Serialize error for logging
  toJSON() {
    return {
      name: this.name,
      type: this.type,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

// Specific error classes
export class ValidationError extends CognifyError {
  constructor(message: string, field?: string, value?: unknown) {
    super(
      ErrorType.VALIDATION,
      'VALIDATION_FAILED',
      message,
      'The provided data is invalid',
      { field, value }
    );
  }
}

export class AuthenticationError extends CognifyError {
  constructor(message: string = 'Authentication required') {
    super(
      ErrorType.AUTHENTICATION,
      'AUTH_REQUIRED',
      message,
      'Please log in to continue'
    );
  }
}

export class AuthorizationError extends CognifyError {
  constructor(message: string = 'Access denied') {
    super(
      ErrorType.AUTHORIZATION,
      'ACCESS_DENIED',
      message,
      'You do not have permission to perform this action'
    );
  }
}

export class DatabaseError extends CognifyError {
  constructor(message: string, operation?: string, table?: string) {
    super(
      ErrorType.DATABASE,
      'DATABASE_ERROR',
      message,
      'A database error occurred',
      { operation, table }
    );
  }
}

export class SRSError extends CognifyError {
  constructor(message: string, cardId?: string, operation?: string) {
    super(
      ErrorType.SRS,
      'SRS_ERROR',
      message,
      'An error occurred in the spaced repetition system',
      { cardId, operation }
    );
  }
}

// Schema validation based on schema-dump.sql constraints
interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'email' | 'uuid';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => boolean | string;
}

// Project validation schema
const projectValidationSchema: ValidationRule[] = [
  {
    field: 'name',
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 255,
  },
  {
    field: 'description',
    required: false,
    type: 'string',
    maxLength: 1000,
  },
  {
    field: 'user_id',
    required: true,
    type: 'uuid',
  },
];

// Flashcard validation schema
const flashcardValidationSchema: ValidationRule[] = [
  {
    field: 'front',
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 5000,
  },
  {
    field: 'back',
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 5000,
  },
  {
    field: 'extra',
    required: false,
    type: 'string',
    maxLength: 2000,
  },
  {
    field: 'project_id',
    required: true,
    type: 'uuid',
  },
];

// SRS settings validation schema (based on schema constraints)
const srsSettingsValidationSchema: ValidationRule[] = [
  {
    field: 'new_cards_per_day',
    required: true,
    type: 'number',
    min: 0,
    max: 9999,
  },
  {
    field: 'max_reviews_per_day',
    required: true,
    type: 'number',
    min: 0,
  },
  {
    field: 'starting_ease',
    required: true,
    type: 'number',
    min: 1.3,
    max: 5.0,
  },
  {
    field: 'minimum_ease',
    required: true,
    type: 'number',
    min: 1.0,
    max: 3.0,
  },
  {
    field: 'easy_bonus',
    required: true,
    type: 'number',
    min: 1.0,
    max: 3.0,
  },
  {
    field: 'hard_factor',
    required: true,
    type: 'number',
    min: 1.0,
    max: 2.0,
  },
  {
    field: 'lapse_ease_penalty',
    required: true,
    type: 'number',
    min: 0.1,
    max: 1.0,
  },
  {
    field: 'graduating_interval',
    required: true,
    type: 'number',
    min: 1,
    max: 36500,
  },
  {
    field: 'max_interval',
    required: true,
    type: 'number',
    min: 1,
    max: 36500,
  },
  {
    field: 'leech_threshold',
    required: true,
    type: 'number',
    min: 1,
    max: 20,
  },
];

// Generic validation function
export function validateData<T extends Record<string, unknown>>(
  data: T,
  schema: ValidationRule[]
): { isValid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  for (const rule of schema) {
    const value = data[rule.field];

    // Check required fields
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(new ValidationError(
        `Field '${rule.field}' is required`,
        rule.field,
        value
      ));
      continue;
    }

    // Skip validation for optional empty fields
    if (!rule.required && (value === undefined || value === null || value === '')) {
      continue;
    }

    // Type validation
    if (rule.type && !validateType(value, rule.type)) {
      errors.push(new ValidationError(
        `Field '${rule.field}' must be of type ${rule.type}`,
        rule.field,
        value
      ));
      continue;
    }

    // String length validation
    if (rule.type === 'string' && typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        errors.push(new ValidationError(
          `Field '${rule.field}' must be at least ${rule.minLength} characters`,
          rule.field,
          value
        ));
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push(new ValidationError(
          `Field '${rule.field}' must be no more than ${rule.maxLength} characters`,
          rule.field,
          value
        ));
      }
    }

    // Number range validation
    if (rule.type === 'number' && typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        errors.push(new ValidationError(
          `Field '${rule.field}' must be at least ${rule.min}`,
          rule.field,
          value
        ));
      }
      if (rule.max !== undefined && value > rule.max) {
        errors.push(new ValidationError(
          `Field '${rule.field}' must be no more than ${rule.max}`,
          rule.field,
          value
        ));
      }
    }

    // Pattern validation
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      errors.push(new ValidationError(
        `Field '${rule.field}' does not match required pattern`,
        rule.field,
        value
      ));
    }

    // Custom validation
    if (rule.custom) {
      const result = rule.custom(value);
      if (typeof result === 'string') {
        errors.push(new ValidationError(result, rule.field, value));
      } else if (!result) {
        errors.push(new ValidationError(
          `Field '${rule.field}' failed custom validation`,
          rule.field,
          value
        ));
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Type validation helper
function validateType(value: unknown, type: string): boolean {
  switch (type) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'email':
      return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    case 'uuid':
      return typeof value === 'string' && 
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
    default:
      return true;
  }
}

// Specific validation functions
export const Validators = {
  project: (data: unknown) => validateData(data as Record<string, unknown>, projectValidationSchema),
  flashcard: (data: unknown) => validateData(data as Record<string, unknown>, flashcardValidationSchema),
  srsSettings: (data: unknown) => validateData(data as Record<string, unknown>, srsSettingsValidationSchema),
};

// Error handling utilities
export const ErrorHandling = {
  /**
   * Wrap async functions with error handling
   */
  wrapAsync: <T extends unknown[], R>(
    fn: (...args: T) => Promise<R>,
    context?: string
  ) => {
    return async (...args: T): Promise<R> => {
      try {
        return await fn(...args);
      } catch (error) {
        console.error(`Error in ${context || 'async function'}:`, error);
        
        if (error instanceof CognifyError) {
          throw error;
        }
        
        // Convert unknown errors to CognifyError
        throw new CognifyError(
          ErrorType.UNKNOWN,
          'UNKNOWN_ERROR',
          error instanceof Error ? error.message : String(error),
          'An unexpected error occurred',
          { context, originalError: error }
        );
      }
    };
  },

  /**
   * Create error handler for API routes
   */
  apiErrorHandler: (error: unknown, operation?: string) => {
    console.error(`API Error${operation ? ` in ${operation}` : ''}:`, error);
    
    if (error instanceof CognifyError) {
      return {
        error: error.userMessage,
        code: error.code,
        type: error.type,
      };
    }
    
    // Handle Supabase errors
    if (error && typeof error === 'object' && 'code' in error) {
      const supabaseError = error as any;
      
      if (supabaseError.code === 'PGRST116') {
        return {
          error: 'Access denied',
          code: 'ACCESS_DENIED',
          type: ErrorType.AUTHORIZATION,
        };
      }
      
      if (supabaseError.code?.startsWith('23')) {
        return {
          error: 'Data validation failed',
          code: 'VALIDATION_ERROR',
          type: ErrorType.VALIDATION,
        };
      }
    }
    
    return {
      error: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      type: ErrorType.UNKNOWN,
    };
  },

  /**
   * Graceful degradation helper
   */
  withFallback: async <T>(
    primaryFn: () => Promise<T>,
    fallbackValue: T,
    errorMessage?: string
  ): Promise<T> => {
    try {
      return await primaryFn();
    } catch (error) {
      console.warn(errorMessage || 'Primary function failed, using fallback:', error);
      return fallbackValue;
    }
  },

  /**
   * Retry with exponential backoff
   */
  retry: async <T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    baseDelay: number = 1000
  ): Promise<T> => {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === maxAttempts) {
          throw lastError;
        }
        
        // Exponential backoff
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, error);
      }
    }
    
    throw lastError!;
  },
};

if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as any).cognifyErrors = {
    ErrorType,
    CognifyError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    DatabaseError,
    SRSError,
    Validators,
    ErrorHandling,
  };
}