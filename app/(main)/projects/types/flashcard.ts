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
