/**
 * Simple Error Handling and Validation for Cognify
 * 
 * Lightweight error handling and validation that's easy to maintain
 */

// Simple validation result interface
interface ValidationResult {
  isValid: boolean;
  errors: Error[];
}

// Basic validation schema
interface ValidationSchema {
  [key: string]: {
    required?: boolean;
    type?: 'string' | 'number' | 'boolean' | 'object';
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
}

// Project validation schema
const projectValidationSchema: ValidationSchema = {
  name: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 100,
  },
  description: {
    type: 'string',
    maxLength: 500,
  },
};

// Flashcard validation schema
const flashcardValidationSchema: ValidationSchema = {
  front: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 1000,
  },
  back: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 1000,
  },
};

// SRS settings validation schema
const srsSettingsValidationSchema: ValidationSchema = {
  new_cards_per_day: {
    required: true,
    type: 'number',
    min: 1,
    max: 999,
  },
  max_reviews_per_day: {
    required: true,
    type: 'number',
    min: 1,
    max: 999,
  },
};

// Simple validation function
function validateData(data: Record<string, unknown>, schema: ValidationSchema): ValidationResult {
  const errors: Error[] = [];

  for (const [key, rules] of Object.entries(schema)) {
    const value = data[key];

    // Check required fields
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(new Error(`${key} is required`));
      continue;
    }

    // Skip validation if field is not provided and not required
    if (value === undefined || value === null) {
      continue;
    }

    // Type validation
    if (rules.type) {
      const actualType = typeof value;
      if (actualType !== rules.type) {
        errors.push(new Error(`${key} must be of type ${rules.type}`));
        continue;
      }
    }

    // String validations
    if (rules.type === 'string' && typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(new Error(`${key} must be at least ${rules.minLength} characters`));
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(new Error(`${key} cannot exceed ${rules.maxLength} characters`));
      }
    }

    // Number validations
    if (rules.type === 'number' && typeof value === 'number') {
      if (rules.min && value < rules.min) {
        errors.push(new Error(`${key} must be at least ${rules.min}`));
      }
      if (rules.max && value > rules.max) {
        errors.push(new Error(`${key} cannot exceed ${rules.max}`));
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Simple validators
export const Validators = {
  project: (data: unknown) => validateData(data as Record<string, unknown>, projectValidationSchema),
  flashcard: (data: unknown) => validateData(data as Record<string, unknown>, flashcardValidationSchema),
  srsSettings: (data: unknown) => validateData(data as Record<string, unknown>, srsSettingsValidationSchema),
};

// Simple error handling utilities
export const ErrorHandling = {
  /**
   * Simple wrapper for async functions with error logging
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
        throw error;
      }
    };
  },
};