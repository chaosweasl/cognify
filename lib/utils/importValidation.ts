/**
 * Enhanced JSON Schema Validation for Import Flow
 *
 * Provides comprehensive validation with detailed error messages
 * and support for multiple content types and formats.
 */

export interface ValidationError {
  field?: string;
  message: string;
  value?: any;
  line?: number;
  column?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  itemsFound: number;
  validItems: number;
  invalidItems: number;
}

export interface ImportableFlashcard {
  front: string;
  back: string;
  tags?: string[];
  extra?: Record<string, any>;
  originalIndex?: number;
  isValid?: boolean;
  validationErrors?: ValidationError[];
}

export interface ImportPreview {
  flashcards: ImportableFlashcard[];
  metadata: {
    totalFound: number;
    validCount: number;
    invalidCount: number;
    formatDetected: string;
    hasWarnings: boolean;
  };
  validation: ValidationResult;
}

// Supported field name variations for flexible import
const FIELD_MAPPINGS = {
  front: [
    "front",
    "question",
    "q",
    "prompt",
    "term",
    "word",
    "concept",
    "problem",
  ],
  back: [
    "back",
    "answer",
    "a",
    "response",
    "definition",
    "solution",
    "explanation",
    "meaning",
  ],
  tags: ["tags", "categories", "labels", "keywords", "topics"],
};

/**
 * Detects the format of imported JSON data
 */
function detectFormat(data: any): string {
  if (Array.isArray(data)) {
    if (data.length === 0) return "empty-array";

    const firstItem = data[0];
    if (!firstItem || typeof firstItem !== "object") return "invalid-array";

    // Check for common formats
    if ("front" in firstItem && "back" in firstItem) return "cognify-format";
    if ("question" in firstItem && "answer" in firstItem) return "qa-format";
    if ("term" in firstItem && "definition" in firstItem)
      return "glossary-format";
    if ("prompt" in firstItem && "response" in firstItem)
      return "prompt-response-format";

    return "custom-object-array";
  }

  if (data && typeof data === "object") {
    // Check for wrapped formats
    if (data.flashcards && Array.isArray(data.flashcards))
      return "wrapped-flashcards";
    if (data.cards && Array.isArray(data.cards)) return "wrapped-cards";
    if (data.items && Array.isArray(data.items)) return "wrapped-items";
    if (data.data && Array.isArray(data.data)) return "wrapped-data";

    return "object-wrapper";
  }

  return "unknown";
}

/**
 * Normalizes field names to standard format
 */
function normalizeField(
  item: Record<string, any>,
  targetField: keyof typeof FIELD_MAPPINGS
): string | undefined {
  const possibleNames = FIELD_MAPPINGS[targetField];

  for (const name of possibleNames) {
    if (name in item && item[name] !== null && item[name] !== undefined) {
      const value = item[name];
      // Convert to string and trim
      return typeof value === "string" ? value.trim() : String(value).trim();
    }
  }

  return undefined;
}

/**
 * Validates a single flashcard item
 */
function validateFlashcardItem(
  item: any,
  index: number
): { flashcard: ImportableFlashcard | null; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  if (!item || typeof item !== "object") {
    errors.push({
      field: `item[${index}]`,
      message: "Item must be an object",
      value: item,
    });
    return { flashcard: null, errors };
  }

  // Normalize fields
  const front = normalizeField(item, "front");
  const back = normalizeField(item, "back");
  const tagsRaw = normalizeField(item, "tags");

  // Validate front field
  if (!front || front.length === 0) {
    errors.push({
      field: `item[${index}].front`,
      message: "Front field is required and cannot be empty",
      value: front,
    });
  } else if (front.length > 2000) {
    errors.push({
      field: `item[${index}].front`,
      message: "Front field is too long (max 2000 characters)",
      value: front.length,
    });
  }

  // Validate back field
  if (!back || back.length === 0) {
    errors.push({
      field: `item[${index}].back`,
      message: "Back field is required and cannot be empty",
      value: back,
    });
  } else if (back.length > 2000) {
    errors.push({
      field: `item[${index}].back`,
      message: "Back field is too long (max 2000 characters)",
      value: back.length,
    });
  }

  // Process tags if present
  let tags: string[] = [];
  if (tagsRaw) {
    try {
      if (Array.isArray(item.tags)) {
        tags = item.tags.filter(
          (tag: any) => typeof tag === "string" && tag.trim().length > 0
        );
      } else if (typeof tagsRaw === "string") {
        // Split by common delimiters
        tags = tagsRaw
          .split(/[,;|\n]/)
          .map((t) => t.trim())
          .filter((t) => t.length > 0);
      }
    } catch {
      // Ignore tag processing errors - tags are optional
    }
  }

  const flashcard: ImportableFlashcard = {
    front: front || "",
    back: back || "",
    tags: tags.length > 0 ? tags : undefined,
    originalIndex: index,
    isValid: errors.length === 0,
    validationErrors: errors.length > 0 ? errors : undefined,
  };

  return { flashcard, errors };
}

/**
 * Comprehensive validation of JSON import data
 */
export function validateImportData(rawData: string): ImportPreview {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  let parsedData: any = null;

  // Parse JSON
  try {
    parsedData = JSON.parse(rawData);
  } catch (error) {
    errors.push({
      message: "Invalid JSON format. Please check for syntax errors.",
      value: error instanceof Error ? error.message : "Parse error",
    });

    return {
      flashcards: [],
      metadata: {
        totalFound: 0,
        validCount: 0,
        invalidCount: 0,
        formatDetected: "invalid-json",
        hasWarnings: false,
      },
      validation: {
        isValid: false,
        errors,
        warnings: [],
        itemsFound: 0,
        validItems: 0,
        invalidItems: 0,
      },
    };
  }

  // Detect format
  const formatDetected = detectFormat(parsedData);

  // Extract items array
  let items: any[] = [];

  if (Array.isArray(parsedData)) {
    items = parsedData;
  } else if (parsedData && typeof parsedData === "object") {
    // Try different wrapper properties
    const wrapperKeys = ["flashcards", "cards", "items", "data"];
    for (const key of wrapperKeys) {
      if (parsedData[key] && Array.isArray(parsedData[key])) {
        items = parsedData[key];
        break;
      }
    }

    if (items.length === 0) {
      errors.push({
        message: `Expected an array of flashcards or an object with one of: ${wrapperKeys.join(
          ", "
        )}`,
        value: Object.keys(parsedData),
      });
    }
  } else {
    errors.push({
      message: "Data must be an array or object containing flashcards",
      value: typeof parsedData,
    });
  }

  // Validate individual items
  const flashcards: ImportableFlashcard[] = [];
  let validCount = 0;
  let invalidCount = 0;

  for (let i = 0; i < items.length; i++) {
    const { flashcard, errors: itemErrors } = validateFlashcardItem(
      items[i],
      i
    );

    if (flashcard) {
      flashcards.push(flashcard);
      if (flashcard.isValid) {
        validCount++;
      } else {
        invalidCount++;
      }
    } else {
      invalidCount++;
    }

    errors.push(...itemErrors);
  }

  // Generate warnings
  if (validCount > 0 && invalidCount > 0) {
    warnings.push({
      message: `${invalidCount} of ${items.length} items have validation errors and will be skipped`,
      value: invalidCount,
    });
  }

  if (formatDetected.includes("custom") || formatDetected.includes("unknown")) {
    warnings.push({
      message:
        "Format not recognized. Field mapping was attempted based on common patterns.",
      value: formatDetected,
    });
  }

  return {
    flashcards,
    metadata: {
      totalFound: items.length,
      validCount,
      invalidCount,
      formatDetected,
      hasWarnings: warnings.length > 0,
    },
    validation: {
      isValid: validCount > 0 && errors.length === 0,
      errors,
      warnings,
      itemsFound: items.length,
      validItems: validCount,
      invalidItems: invalidCount,
    },
  };
}

/**
 * Generates helpful error messages for common JSON issues
 */
export function generateImportGuidance(preview: ImportPreview): {
  title: string;
  description: string;
  suggestions: string[];
  exampleCode?: string;
} {
  if (
    preview.validation.errors.some((e) => e.message.includes("Invalid JSON"))
  ) {
    return {
      title: "JSON Format Error",
      description:
        "The file contains invalid JSON syntax. This is usually caused by missing quotes, brackets, or commas.",
      suggestions: [
        "Check that all strings are wrapped in double quotes",
        "Ensure all brackets [] and braces {} are properly closed",
        "Verify commas are placed between array items and object properties",
        "Use a JSON validator tool to identify syntax issues",
      ],
      exampleCode: `[\n  {\n    "front": "Question here",\n    "back": "Answer here"\n  }\n]`,
    };
  }

  if (preview.metadata.validCount === 0 && preview.metadata.totalFound > 0) {
    return {
      title: "No Valid Flashcards Found",
      description:
        "The file was parsed successfully, but no valid flashcards could be extracted.",
      suggestions: [
        "Ensure each item has both 'front' and 'back' fields (or equivalent)",
        "Check that field values are not empty",
        "Verify field names match expected patterns",
        "Consider the supported field name variations shown below",
      ],
      exampleCode: `[\n  {\n    "front": "Your question",\n    "back": "Your answer"\n  }\n]`,
    };
  }

  if (preview.metadata.validCount > 0 && preview.metadata.invalidCount > 0) {
    return {
      title: "Some Items Have Errors",
      description: `${preview.metadata.validCount} valid flashcards found, but ${preview.metadata.invalidCount} items have issues.`,
      suggestions: [
        "Review the error details for each invalid item",
        "Fix missing or empty required fields",
        "Check field length limits (2000 characters max)",
        "You can import the valid items and fix the others separately",
      ],
    };
  }

  if (
    preview.metadata.formatDetected.includes("unknown") ||
    preview.metadata.formatDetected.includes("custom")
  ) {
    return {
      title: "Format Not Recognized",
      description:
        "We attempted to map your fields automatically, but the format wasn't recognized.",
      suggestions: [
        "Check the field mapping results in the preview below",
        "Consider renaming fields to standard names: 'front', 'back', 'tags'",
        "Supported alternatives: question/answer, term/definition, prompt/response",
        "Contact support if you need help with a specific format",
      ],
    };
  }

  return {
    title: "Import Ready",
    description: `Found ${preview.metadata.validCount} valid flashcards ready to import.`,
    suggestions: [
      "Review the preview to ensure content looks correct",
      "You can select which items to import if needed",
      "Tags and extra fields will be preserved where possible",
    ],
  };
}
