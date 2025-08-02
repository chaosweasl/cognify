// New flashcard types that match the database schema
export interface Flashcard {
  id: string;
  project_id: string;
  front: string;
  back: string;
  extra?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// For creating new flashcards (without auto-generated fields)
export interface CreateFlashcardData {
  front: string;
  back: string;
  extra?: Record<string, unknown>;
}

// For updating flashcards
export interface UpdateFlashcardData {
  front?: string;
  back?: string;
  extra?: Record<string, unknown>;
}

// Legacy flashcard format for backwards compatibility during migration
export interface LegacyFlashcard {
  id: string; // Changed from optional to required
  question: string;
  answer: string;
}

// Utility function to convert legacy format to new format
export function convertLegacyToNew(legacy: LegacyFlashcard): CreateFlashcardData {
  return {
    front: legacy.question,
    back: legacy.answer,
    extra: {},
  };
}

// Utility function to convert new format to legacy for components that haven't been updated yet
export function convertNewToLegacy(flashcard: Flashcard): LegacyFlashcard {
  return {
    id: flashcard.id,
    question: flashcard.front,
    answer: flashcard.back,
  };
}