/**
 * TypeScript Utility Types and Interfaces for Cognify
 * 
 * Provides strict type definitions to eliminate 'any' types and ensure type safety
 * Includes utility types, branded types, and comprehensive interfaces
 * 
 * Key features:
 * - Branded types for IDs and special values
 * - Strict database schema types
 * - Utility types for React components
 * - Type guards and validation utilities
 * - Generic helpers for type safety
 */

import React from 'react';

// Branded types for better type safety
export type ProjectId = string & { __brand: 'ProjectId' };
export type FlashcardId = string & { __brand: 'FlashcardId' };
export type UserId = string & { __brand: 'UserId' };
export type SRSStateId = string & { __brand: 'SRSStateId' };

// ISO timestamp strings
export type ISOTimestamp = string & { __brand: 'ISOTimestamp' };

// Email type
export type Email = string & { __brand: 'Email' };

// Utility type to create branded types
export type Brand<T, U> = T & { __brand: U };

// Database row types (matching schema-dump.sql)
export interface ProjectRow {
  id: ProjectId;
  user_id: UserId;
  name: string;
  description: string | null;
  created_at: ISOTimestamp;
  updated_at?: ISOTimestamp;
}

export interface FlashcardRow {
  id: FlashcardId;
  project_id: ProjectId;
  front: string;
  back: string;
  extra: string | null;
  created_at: ISOTimestamp;
  updated_at?: ISOTimestamp;
}

export interface SRSStateRow {
  id: SRSStateId;
  user_id: UserId;
  card_id: FlashcardId;
  project_id: ProjectId;
  state: SRSCardState;
  due: ISOTimestamp;
  interval: number;
  ease: number;
  step: number;
  lapses: number;
  repetitions: number;
  created_at: ISOTimestamp;
  updated_at?: ISOTimestamp;
}

export interface UserSettingsRow {
  user_id: UserId;
  new_cards_per_day: number;
  max_reviews_per_day: number;
  learning_steps: number[];
  graduating_interval: number;
  easy_interval: number;
  starting_ease: number;
  easy_bonus: number;
  hard_factor: number;
  lapse_ease_penalty: number;
  lapse_recovery_factor: number;
  minimum_ease: number;
  maximum_ease: number;
  max_interval: number;
  leech_threshold: number;
  leech_action: 'suspend' | 'tag';
  timezone: string;
  study_order: 'random' | 'due' | 'created';
  show_remaining_count: boolean;
  auto_advance: boolean;
  created_at: ISOTimestamp;
  updated_at?: ISOTimestamp;
}

export interface DailyStudyStatsRow {
  user_id: UserId;
  date: string; // YYYY-MM-DD format
  new_cards_studied: number;
  reviews_completed: number;
  review_time_seconds: number;
  cards_learned: number;
  cards_relearned: number;
  created_at: ISOTimestamp;
  updated_at?: ISOTimestamp;
}

// SRS specific types
export type SRSCardState = 'new' | 'learning' | 'review' | 'relearning';
export type SRSRating = 'again' | 'hard' | 'good' | 'easy';

export interface SRSCard {
  id: FlashcardId;
  projectId: ProjectId;
  front: string;
  back: string;
  extra?: string;
  srsState: SRSStateRow;
}

export interface SRSSession {
  sessionDate: number; // Midnight timestamp
  reviewedToday: {
    newCards: number;
    reviews: number;
  };
  timezone: string;
}

export interface SRSSettings {
  NEW_CARDS_PER_DAY: number;
  MAX_REVIEWS_PER_DAY: number;
  LEARNING_STEPS: number[]; // in minutes
  GRADUATING_INTERVAL: number; // in days
  EASY_INTERVAL: number; // in days
  STARTING_EASE: number; // multiplier
  EASY_BONUS: number; // multiplier
  HARD_FACTOR: number; // multiplier
  LAPSE_EASE_PENALTY: number; // subtracted from ease
  LAPSE_RECOVERY_FACTOR: number; // multiplier
  MINIMUM_EASE: number; // minimum ease value
  MAXIMUM_EASE: number; // maximum ease value
  MAX_INTERVAL: number; // in days
  LEECH_THRESHOLD: number; // number of lapses
  LEECH_ACTION: 'suspend' | 'tag';
  TIMEZONE: string;
  STUDY_ORDER: 'random' | 'due' | 'created';
  SHOW_REMAINING_COUNT: boolean;
  AUTO_ADVANCE: boolean;
  BURY_SIBLINGS: boolean;
}

// API request/response types
export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string | null;
}

export interface CreateFlashcardRequest {
  front: string;
  back: string;
  extra?: string;
  projectId: ProjectId;
}

export interface UpdateFlashcardRequest {
  front?: string;
  back?: string;
  extra?: string | null;
}

export interface UpdateSRSStateRequest {
  rating: SRSRating;
  sessionDate?: number;
}

// API response types
export interface ProjectStats {
  totalCards: number;
  newCards: number;
  learningCards: number;
  reviewCards: number;
  dueCards: number;
}

export interface ProjectWithStats extends ProjectRow {
  stats: ProjectStats;
}

export interface StudySessionData {
  cards: SRSCard[];
  session: SRSSession;
  settings: SRSSettings;
}

// React component prop types
export interface WithClassName {
  className?: string;
}

export interface WithChildren {
  children: React.ReactNode;
}

export interface WithOptionalChildren {
  children?: React.ReactNode;
}

// Event handler types
export type EventHandler<T = void> = (event: React.SyntheticEvent) => T;
export type MouseEventHandler<T = void> = (event: React.MouseEvent) => T;
export type ChangeEventHandler<T = void> = (event: React.ChangeEvent<HTMLInputElement>) => T;
export type FormEventHandler<T = void> = (event: React.FormEvent<HTMLFormElement>) => T;

// Async function types
export type AsyncFunction<TArgs extends unknown[] = [], TReturn = void> = (
  ...args: TArgs
) => Promise<TReturn>;

export type AsyncEventHandler<TArgs extends unknown[] = []> = AsyncFunction<TArgs, void>;

// Utility types for optional properties
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type Required<T, K extends keyof T> = T & { [P in K]-?: T[P] };

// Database operation result types
export interface DatabaseResult<T> {
  data: T | null;
  error: Error | null;
}

export interface DatabaseListResult<T> {
  data: T[];
  error: Error | null;
  count?: number;
}

// Type guards
export const TypeGuards = {
  isProjectId: (value: string): value is ProjectId => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  },

  isFlashcardId: (value: string): value is FlashcardId => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  },

  isUserId: (value: string): value is UserId => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  },

  isEmail: (value: string): value is Email => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  },

  isISOTimestamp: (value: string): value is ISOTimestamp => {
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/.test(value) && !isNaN(Date.parse(value));
  },

  isSRSCardState: (value: string): value is SRSCardState => {
    return ['new', 'learning', 'review', 'relearning'].includes(value);
  },

  isSRSRating: (value: string): value is SRSRating => {
    return ['again', 'hard', 'good', 'easy'].includes(value);
  },

  isProjectRow: (value: unknown): value is ProjectRow => {
    return (
      typeof value === 'object' &&
      value !== null &&
      TypeGuards.isProjectId((value as Record<string, unknown>).id as string) &&
      TypeGuards.isUserId((value as Record<string, unknown>).user_id as string) &&
      typeof (value as Record<string, unknown>).name === 'string' &&
      ((value as Record<string, unknown>).description === null || typeof (value as Record<string, unknown>).description === 'string') &&
      TypeGuards.isISOTimestamp((value as Record<string, unknown>).created_at as string)
    );
  },

  isFlashcardRow: (value: unknown): value is FlashcardRow => {
    return (
      typeof value === 'object' &&
      value !== null &&
      TypeGuards.isFlashcardId((value as Record<string, unknown>).id as string) &&
      TypeGuards.isProjectId((value as Record<string, unknown>).project_id as string) &&
      typeof (value as Record<string, unknown>).front === 'string' &&
      typeof (value as Record<string, unknown>).back === 'string' &&
      ((value as Record<string, unknown>).extra === null || typeof (value as Record<string, unknown>).extra === 'string') &&
      TypeGuards.isISOTimestamp((value as Record<string, unknown>).created_at as string)
    );
  },
};

// Type assertion helpers
export const TypeAssertions = {
  assertProjectId: (value: string): ProjectId => {
    if (!TypeGuards.isProjectId(value)) {
      throw new Error(`Invalid ProjectId: ${value}`);
    }
    return value;
  },

  assertFlashcardId: (value: string): FlashcardId => {
    if (!TypeGuards.isFlashcardId(value)) {
      throw new Error(`Invalid FlashcardId: ${value}`);
    }
    return value;
  },

  assertUserId: (value: string): UserId => {
    if (!TypeGuards.isUserId(value)) {
      throw new Error(`Invalid UserId: ${value}`);
    }
    return value;
  },

  assertEmail: (value: string): Email => {
    if (!TypeGuards.isEmail(value)) {
      throw new Error(`Invalid Email: ${value}`);
    }
    return value;
  },

  assertISOTimestamp: (value: string): ISOTimestamp => {
    if (!TypeGuards.isISOTimestamp(value)) {
      throw new Error(`Invalid ISO timestamp: ${value}`);
    }
    return value;
  },
};

// Utility types for creating branded types from strings
export function createProjectId(id: string): ProjectId {
  return TypeAssertions.assertProjectId(id);
}

export function createFlashcardId(id: string): FlashcardId {
  return TypeAssertions.assertFlashcardId(id);
}

export function createUserId(id: string): UserId {
  return TypeAssertions.assertUserId(id);
}

export function createEmail(email: string): Email {
  return TypeAssertions.assertEmail(email);
}

export function createISOTimestamp(timestamp: string): ISOTimestamp {
  return TypeAssertions.assertISOTimestamp(timestamp);
}

// Helper type for making all properties of a type required except specified ones
export type RequiredExcept<T, K extends keyof T> = Omit<T, K> & RequiredProps<Pick<T, K>>;

// TypeScript built-in Required utility type wrapper to avoid conflicts
type RequiredProps<T> = { [P in keyof T]-?: T[P] };

// Helper type for making specific properties of a type optional  
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

// Type for functions that can be either sync or async
export type MaybeAsync<T> = T | Promise<T>;

// Type for React component refs
export type ComponentRef<T> = React.RefObject<T> | React.MutableRefObject<T>;

// Utility type for extracting the element type from an array
export type ArrayElement<T> = T extends (infer U)[] ? U : never;

// Utility type for excluding null and undefined
export type NonNullable<T> = T extends null | undefined ? never : T;

// Utility type for making properties readonly
export type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

// Deep readonly utility type
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// Type for cache keys
export type CacheKey = string & { __brand: 'CacheKey' };

export function createCacheKey(key: string): CacheKey {
  return key as CacheKey;
}