// Core types for Cognify
export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  flashcards?: Flashcard[];
}

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

export interface SRSState {
  id: string;
  user_id: string;
  project_id: string;
  card_id: string;
  interval: number;
  ease: number;
  due: string;
  last_reviewed: string;
  repetitions: number;
  state: "new" | "learning" | "review" | "relearning";
  step: number;
  is_suspended: boolean;
  is_leech: boolean;
}

export interface ProjectStats {
  totalCards: number;
  newCards: number;
  learningCards: number;
  reviewCards: number;
  dueCards: number;
}

// Input types for creation
export interface CreateProjectData {
  name: string;
  description?: string;
}