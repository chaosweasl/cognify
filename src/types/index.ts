// Core types for Cognify

// Project Type Enum
export type ProjectType = "flashcards" | "quiz" | "cheatsheet";

// Project Type Configuration
export interface ProjectTypeConfig {
  id: ProjectType;
  name: string;
  description: string;
  icon: string; // Icon name for lucide-react
  color: string; // Tailwind color class
  features: string[];
}

export const PROJECT_TYPE_CONFIGS: Record<ProjectType, ProjectTypeConfig> = {
  flashcards: {
    id: "flashcards",
    name: "Flashcards",
    description: "Question-answer pairs for spaced repetition learning",
    icon: "BookOpen",
    color: "blue",
    features: [
      "Spaced repetition",
      "Progress tracking",
      "Difficulty adjustment",
    ],
  },
  quiz: {
    id: "quiz",
    name: "Quiz",
    description: "Interactive quizzes with multiple choice and open questions",
    icon: "Brain",
    color: "purple",
    features: ["Multiple choice", "Short answers", "Instant feedback"],
  },
  cheatsheet: {
    id: "cheatsheet",
    name: "Cheatsheet",
    description: "Organized reference materials with key concepts",
    icon: "FileText",
    color: "green",
    features: ["Quick reference", "Structured content", "Easy lookup"],
  },
};

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  project_type: ProjectType;
  created_at: string;
  updated_at: string;
  new_cards_per_day: number;
  max_reviews_per_day: number;
  // SRS Settings (expanded from schema)
  learning_steps: number[];
  relearning_steps: number[];
  graduating_interval: number;
  easy_interval: number;
  starting_ease: number;
  minimum_ease: number;
  easy_bonus: number;
  hard_interval_factor: number;
  easy_interval_factor: number;
  lapse_recovery_factor: number;
  leech_threshold: number;
  leech_action: "suspend" | "tag";
  new_card_order: "random" | "fifo";
  review_ahead: boolean;
  bury_siblings: boolean;
  max_interval: number;
  lapse_ease_penalty: number;
  flashcards?: Flashcard[];
  // Optional stats when loaded from API
  stats?: ProjectStats;
  flashcardCount?: number;
}

// New flashcard types that match the database schema
export interface Flashcard {
  id: string;
  project_id: string;
  front: string;
  back: string;
  extra?: Record<string, unknown>;
  is_ai_generated: boolean;
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
  card_interval: number; // Updated from 'interval'
  ease: number;
  due: string;
  last_reviewed: string;
  repetitions: number;
  state: "new" | "learning" | "review" | "relearning";
  learning_step: number; // Updated from 'step'
  lapses: number;
  is_suspended: boolean;
  is_leech: boolean;
  last_session_id?: string;
  session_started_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectStats {
  totalFlashcards: number;
  totalNewCards: number;
  availableNewCards: number;
  learningCards: number;
  dueCards: number;
  reviewCards: number; // Same as dueCards for user clarity
  newCardsStudiedToday: number;
  reviewsCompletedToday: number;
}

// Input types for creation
export interface CreateProjectData {
  name: string;
  description?: string;
  project_type: ProjectType;
  new_cards_per_day?: number;
  max_reviews_per_day?: number;
  // SRS Settings with defaults
  learning_steps?: number[];
  relearning_steps?: number[];
  graduating_interval?: number;
  easy_interval?: number;
  starting_ease?: number;
  minimum_ease?: number;
  easy_bonus?: number;
  hard_interval_factor?: number;
  easy_interval_factor?: number;
  lapse_recovery_factor?: number;
  leech_threshold?: number;
  leech_action?: "suspend" | "tag";
  new_card_order?: "random" | "fifo";
  review_ahead?: boolean;
  bury_siblings?: boolean;
  max_interval?: number;
  lapse_ease_penalty?: number;
}

// User Profile types
export interface Profile {
  id: string;
  username?: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  email?: string;
  age?: number;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

// User Settings types
export interface UserSettings {
  user_id: string;
  theme: "light" | "dark" | "system";
  notifications_enabled: boolean;
  daily_reminder: boolean;
  reminder_time: string; // time format
  created_at: string;
  updated_at: string;
}

// Study Session types
export interface StudySession {
  id: string;
  user_id: string;
  project_id: string;
  started_at: string;
  ended_at?: string;
  cards_studied: number;
  time_spent_seconds: number;
  is_active: boolean;
}

// Daily Study Stats types
export interface DailyStudyStats {
  id: string;
  user_id: string;
  project_id?: string; // Can be null for global stats
  study_date: string; // date format
  new_cards_studied: number;
  reviews_completed: number;
  time_spent_seconds: number;
  cards_learned: number;
  cards_lapsed: number;
  created_at: string;
  updated_at: string;
}

// User Notifications types
export interface UserNotification {
  id: string;
  user_id: string;
  project_id?: string;
  type: "study_reminder" | "general";
  title: string;
  message: string;
  url?: string;
  is_read: boolean;
  scheduled_for: string;
  created_at: string;
}

// App Notifications types
export interface AppNotification {
  id: string;
  title: string;
  message: string;
  url?: string;
  type: string;
  published: boolean;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}
