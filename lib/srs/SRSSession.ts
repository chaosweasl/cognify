// SRS Session Management and Statistics
// Handles study sessions, statistics, and utility functions
import { SRSSettings } from "@/hooks/useSettings";
import { SRSCardState, SRSRating } from "./SRSScheduler";
import {
  getDailyStudyStats,
  updateDailyStudyStats,
  updateProjectDailyStudyStats,
  // incrementDailyStudyCounters, // removed unused import
} from "@/lib/supabase/dailyStudyStats";

// --- CONSTANTS ---
const UNDO_HISTORY_LIMIT = 20; // Maximum number of reviews to keep for undo
const ESTIMATED_SECONDS_PER_CARD = 30; // Rough estimate for time tracking

/**
 * Lightweight deep clone alternative to structuredClone for better browser compatibility
 * Falls back to JSON parse/stringify for simple objects (cards don't contain functions/dates/etc)
 * This is much faster than structuredClone and has wider browser support
 */
function safeDeepClone<T>(obj: T): T {
  try {
    // For modern browsers that support structuredClone, prefer it for accuracy
    if (typeof structuredClone !== "undefined") {
      return structuredClone(obj);
    }
  } catch {
    // Fall through to JSON method
  }

  try {
    // JSON method - faster and more compatible, works fine for SRSCardState objects
    return JSON.parse(JSON.stringify(obj));
  } catch (error) {
    console.error(
      "❌ Failed to clone object, returning original (may cause undo issues):",
      error
    );
    return obj;
  }
}

// Enhanced cache management with automatic invalidation
class NoteIdCardsCache {
  private cache: Map<string, string[]> | null = null;
  private lastBuildTime = 0;
  private readonly CACHE_TTL = 30000; // 30 seconds TTL to prevent stale data

  /**
   * Get or build the noteId to cards mapping with automatic invalidation
   */
  getOrBuild(
    allCardStates: Record<string, SRSCardState>
  ): Map<string, string[]> {
    const now = Date.now();

    // Auto-invalidate stale cache
    if (this.cache && now - this.lastBuildTime > this.CACHE_TTL) {
      console.log("🗑️ Auto-invalidating stale noteId cache");
      this.cache = null;
    }

    if (!this.cache) {
      this.cache = this.buildNoteIdToCardsMap(allCardStates);
      this.lastBuildTime = now;
    }

    return this.cache;
  }

  /**
   * Manually invalidate cache (call when cards are added/removed/modified)
   */
  invalidate(): void {
    this.cache = null;
    this.lastBuildTime = 0;
  }

  /**
   * Check if cache exists and is fresh
   */
  isCacheValid(): boolean {
    return (
      this.cache !== null && Date.now() - this.lastBuildTime <= this.CACHE_TTL
    );
  }

  private buildNoteIdToCardsMap(
    allCardStates: Record<string, SRSCardState>
  ): Map<string, string[]> {
    const noteMap = new Map<string, string[]>();

    Object.values(allCardStates).forEach((card) => {
      if (card.noteId) {
        if (!noteMap.has(card.noteId)) {
          noteMap.set(card.noteId, []);
        }
        noteMap.get(card.noteId)!.push(card.id);
      }
    });

    return noteMap;
  }
}

// Project-specific SRS settings interface
export interface ProjectSRSSettings {
  projectId: string;
  newCardsPerDay: number;
  maxReviewsPerDay: number;
  // Other settings are inherited from global user settings
}

// Global cache instance with encapsulated management
const noteIdCache = new NoteIdCardsCache();

/**
 * Performance optimization: Get cached noteId to cards mapping
 * Now with automatic cache management to reduce bugs from manual invalidation
 */
function getNoteIdToCardsMap(
  allCardStates: Record<string, SRSCardState>
): Map<string, string[]> {
  return noteIdCache.getOrBuild(allCardStates);
}

/**
 * Invalidate the noteId to cards cache when card states change
 * Call this when cards are added, removed, or their noteId changes
 */
export function invalidateNoteIdCache(): void {
  noteIdCache.invalidate();
}

// --- STUDY SESSION TYPES ---
export type StudySession = {
  // Per-project tracking of daily limits
  projectStats: Record<
    string,
    {
      newCardsStudied: number;
      reviewsCompleted: number;
    }
  >;
  // Global fallback for backward compatibility
  newCardsStudied: number;
  reviewsCompleted: number;
  learningCardsInQueue: string[]; // Cards currently in learning queue
  // Review history for undo functionality
  reviewHistory: Array<{
    cardId: string;
    previousState: SRSCardState;
    rating: SRSRating;
    timestamp: number;
    projectId: string; // Track which project the card belongs to
  }>;
  // Buried cards (sibling burying)
  buriedCards: Set<string>;
  // Performance optimization: Incremental counters to avoid O(n) filtering
  _incrementalCounters?: {
    newCardsFromHistory: number;
    reviewsFromHistory: number;
    lastHistoryLength: number;
  };
};

// --- UTILITY FUNCTIONS ---
export function addMinutes(timestamp: number, minutes: number): number {
  return timestamp + minutes * 60 * 1000;
}

export function addDays(timestamp: number, days: number): number {
  return timestamp + days * 24 * 60 * 60 * 1000;
}

/**
 * Get today's date string for daily limit tracking
 */
function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
}

/**
 * Get daily study counts from database with support for per-project tracking
 * Returns counts for today only, resets for new days
 */
async function getDailyStudyCountsFromDB(
  userId: string,
  projectId?: string
): Promise<{ newCardsStudied: number; reviewsCompleted: number }> {
  try {
    console.log(
      `[getDailyStudyCountsFromDB] Loading stats for user: ${userId}, project: ${
        projectId || "global"
      }`
    );

    if (projectId) {
      // Get per-project daily stats from API (only in browser context)
      if (typeof window !== "undefined") {
        const dailyStatsRes = await fetch(
          `/api/projects/${projectId}/daily-stats`,
          {
            headers: {
              "x-user-id": userId,
            },
            cache: "no-store",
          }
        );
        let stats = { newCardsStudied: 0, reviewsCompleted: 0 };
        if (dailyStatsRes.ok) {
          try {
            stats = await dailyStatsRes.json();
          } catch (e) {
            console.error(
              "[getDailyStudyCountsFromDB] Error parsing response:",
              e
            );
          }
        }
        console.log(
          `[getDailyStudyCountsFromDB] Project stats: ${JSON.stringify(stats)}`
        );
        return stats;
      } else {
        // Server-side: use direct database function
        try {
          const { getProjectDailyStudyStats } = await import(
            "@/lib/supabase/dailyStudyStats"
          );
          const stats = await getProjectDailyStudyStats(userId, projectId);
          console.log(
            `[getDailyStudyCountsFromDB] Project stats (server): ${JSON.stringify(
              stats
            )}`
          );
          return stats;
        } catch (e) {
          console.error("[getDailyStudyCountsFromDB] Server error:", e);
          return { newCardsStudied: 0, reviewsCompleted: 0 };
        }
      }
    } else {
      // Get global daily stats (legacy support)
      const stats = await getDailyStudyStats(userId);
      console.log(`[getDailyStudyCountsFromDB] Global stats loaded:`, stats);
      return stats;
    }
  } catch (error) {
    console.warn("Failed to load daily study counts from database:", error);
    // Return zeros as fallback, but this should be rare
    return { newCardsStudied: 0, reviewsCompleted: 0 };
  }
}

/**
 * Save per-project daily study counts to database (using centralized function)
 */
async function saveProjectDailyStudyCountsToDB(
  userId: string,
  projectId: string,
  newCardsStudied: number,
  reviewsCompleted: number
): Promise<void> {
  // Use the centralized function from dailyStudyStats.ts instead of duplicating logic
  try {
    await updateProjectDailyStudyStats(
      userId,
      projectId,
      newCardsStudied,
      reviewsCompleted
    );
    console.log(
      `[ProjectDailyStats] Successfully saved stats for project ${projectId}`
    );
  } catch (error) {
    console.warn(
      `[ProjectDailyStats] Failed to save project daily stats:`,
      error
    );
    throw error;
  }
}

/**
 * Save daily study counts to database
 */
async function saveDailyStudyCountsToDB(
  userId: string,
  newCardsStudied: number,
  reviewsCompleted: number
): Promise<void> {
  try {
    await updateDailyStudyStats(userId, newCardsStudied, reviewsCompleted);
  } catch (error) {
    console.warn("Failed to save daily study counts to database:", error);
  }
}

/**
 * Migrate localStorage daily study data to database (one-time migration)
 * Call this when user first logs in to preserve their progress
 */
export async function migrateDailyStudyDataToDatabase(
  userId: string
): Promise<void> {
  try {
    const today = getTodayDateString();
    const stored = localStorage.getItem(`daily-study-${today}`);

    if (stored) {
      const parsed = JSON.parse(stored);
      const newCardsStudied = parsed.newCardsStudied || 0;
      const reviewsCompleted = parsed.reviewsCompleted || 0;

      // Only migrate if there's actual progress to preserve
      if (newCardsStudied > 0 || reviewsCompleted > 0) {
        await updateDailyStudyStats(userId, newCardsStudied, reviewsCompleted);
        console.log("Migrated daily study data to database:", {
          newCardsStudied,
          reviewsCompleted,
        });

        // Optionally clear localStorage after successful migration
        localStorage.removeItem(`daily-study-${today}`);
      }
    }
  } catch (error) {
    console.warn("Failed to migrate daily study data to database:", error);
  }
}

/**
 * Initialize study session with fallback to localStorage for backward compatibility
 * This allows graceful migration from localStorage to database
 */
export async function initStudySessionWithFallback(
  userId?: string,
  projectId?: string
): Promise<StudySession> {
  if (userId) {
    try {
      return await initStudySession(userId, projectId);
    } catch (error) {
      console.warn(
        "Failed to load from database, falling back to localStorage:",
        error
      );
    }
  }

  // Fallback to localStorage for backward compatibility
  try {
    const today = getTodayDateString();
    const stored = localStorage.getItem(`daily-study-${today}`);

    if (stored) {
      const parsed = JSON.parse(stored);
      const dailyCounts = {
        newCardsStudied: parsed.newCardsStudied || 0,
        reviewsCompleted: parsed.reviewsCompleted || 0,
      };

      return {
        projectStats: projectId ? { [projectId]: dailyCounts } : {},
        newCardsStudied: dailyCounts.newCardsStudied,
        reviewsCompleted: dailyCounts.reviewsCompleted,
        learningCardsInQueue: [],
        reviewHistory: [],
        buriedCards: new Set(),
        _incrementalCounters: {
          newCardsFromHistory: dailyCounts.newCardsStudied,
          reviewsFromHistory: dailyCounts.reviewsCompleted,
          lastHistoryLength: 0,
        },
      };
    }
  } catch (error) {
    console.warn("Failed to load from localStorage:", error);
  }

  // Final fallback: empty session
  return {
    projectStats: {},
    newCardsStudied: 0,
    reviewsCompleted: 0,
    learningCardsInQueue: [],
    reviewHistory: [],
    buriedCards: new Set(),
    _incrementalCounters: {
      newCardsFromHistory: 0,
      reviewsFromHistory: 0,
      lastHistoryLength: 0,
    },
  };
}

/**
 * Promote learning cards that have been waiting too long to review state
 * This prevents cards from getting stuck in learning indefinitely
 */
export function promoteStuckLearningCards(
  cardStates: Record<string, SRSCardState>,
  settings: SRSSettings,
  now: number = Date.now()
): Record<string, SRSCardState> {
  const updatedCardStates = { ...cardStates };
  let promotedCount = 0;

  Object.values(updatedCardStates).forEach((card) => {
    if (
      (card.state === "learning" || card.state === "relearning") &&
      !card.isSuspended
    ) {
      const timeUntilDue = card.due - now;
      const minutesUntilDue = timeUntilDue / (60 * 1000);

      // If card is scheduled more than 15 minutes in the future, promote it
      if (minutesUntilDue > 15) {
        updatedCardStates[card.id] = {
          ...card,
          state: "review",
          interval: Math.max(1, Math.round(minutesUntilDue / (60 * 24))), // Convert to days
          due: card.due, // Keep the same due time
          lastReviewed: now,
          repetitions: Math.max(1, card.repetitions),
          learningStep: 0, // Reset learning step
        };
        promotedCount++;
      }
    }
  });

  if (promotedCount > 0) {
    console.log(
      `🎓 Promoted ${promotedCount} stuck learning cards to review state`
    );
  }

  return updatedCardStates;
}

/**
 * Get project-level study statistics for display on project cards
 * Returns Due/New/Learning counts for a specific project
 */
export function getProjectStudyStats(
  cardStates: Record<string, SRSCardState>,
  settings: SRSSettings,
  now: number = Date.now()
): {
  dueCards: number;
  newCards: number;
  learningCards: number;
} {
  const allCards = Object.values(cardStates);

  // Due cards = learning cards due now + review cards due now
  const dueCards = allCards.filter(
    (card) =>
      !card.isSuspended &&
      (card.state === "learning" ||
        card.state === "relearning" ||
        card.state === "review") &&
      card.due <= now
  ).length;

  // New cards = cards not yet introduced
  const newCards = allCards.filter(
    (card) => card.state === "new" && !card.isSuspended
  ).length;

  // Learning cards = cards in learning/relearning state (regardless of due time)
  const learningCards = allCards.filter(
    (card) =>
      (card.state === "learning" || card.state === "relearning") &&
      !card.isSuspended
  ).length;

  return {
    dueCards,
    newCards,
    learningCards,
  };
}

// --- SESSION MANAGEMENT FUNCTIONS ---

/**
 * Initialize study session with support for per-project daily limits
 * Can load specific project stats or all projects for a user
 */
export async function initStudySession(
  userId: string,
  projectId?: string
): Promise<StudySession> {
  console.log(
    `[SRSSession] Initializing study session for user: ${userId}, project: ${
      projectId || "all"
    }`
  );

  if (projectId) {
    // Initialize for a specific project - FIXED: Actually load from database
    const dailyCounts = await getDailyStudyCountsFromDB(userId, projectId);

    console.log(
      `[SRSSession] Loaded daily counts for project ${projectId}:`,
      dailyCounts
    );

    return {
      projectStats: {
        [projectId]: dailyCounts,
      },
      // Legacy global counters for backward compatibility
      newCardsStudied: dailyCounts.newCardsStudied,
      reviewsCompleted: dailyCounts.reviewsCompleted,
      learningCardsInQueue: [],
      reviewHistory: [],
      buriedCards: new Set(),
      _incrementalCounters: {
        newCardsFromHistory: dailyCounts.newCardsStudied,
        reviewsFromHistory: dailyCounts.reviewsCompleted,
        lastHistoryLength: 0,
      },
    };
  } else {
    // Initialize with global stats if no specific project
    const globalDailyCounts = await getDailyStudyCountsFromDB(userId);

    console.log(`[SRSSession] Loaded global daily counts:`, globalDailyCounts);

    return {
      projectStats: {},
      newCardsStudied: globalDailyCounts.newCardsStudied,
      reviewsCompleted: globalDailyCounts.reviewsCompleted,
      learningCardsInQueue: [],
      reviewHistory: [],
      buriedCards: new Set(),
      _incrementalCounters: {
        newCardsFromHistory: globalDailyCounts.newCardsStudied,
        reviewsFromHistory: globalDailyCounts.reviewsCompleted,
        lastHistoryLength: 0,
      },
    };
  }
}

/**
 * Load or initialize per-project stats in an existing session
 */
export async function ensureProjectStatsInSession(
  session: StudySession,
  userId: string,
  projectId: string
): Promise<StudySession> {
  // Check if stats are already loaded and have meaningful data
  const existingStats = session.projectStats[projectId];
  if (
    existingStats &&
    (existingStats.newCardsStudied > 0 || existingStats.reviewsCompleted > 0)
  ) {
    // Stats already loaded with meaningful data, don't overwrite
    console.log(
      `[ensureProjectStatsInSession] Using existing stats for project ${projectId}:`,
      existingStats
    );
    return session;
  }

  console.log(
    `[ensureProjectStatsInSession] Loading fresh stats for project ${projectId}`
  );

  const dailyCounts = await getDailyStudyCountsFromDB(userId, projectId);

  return {
    ...session,
    projectStats: {
      ...session.projectStats,
      [projectId]: dailyCounts,
    },
  };
}

/**
 * Check if there are any learning or relearning cards remaining
 * This should be used to determine if a study session can truly complete
 */
export function hasLearningCards(
  cardStates: Record<string, SRSCardState>
): boolean {
  return Object.values(cardStates).some(
    (c) => c.state === "learning" || c.state === "relearning"
  );
}

/**
 * Check if a study session should be considered complete for a specific project
 * Session is complete when there are no more cards to study today (genuine Anki behavior)
 */
export function isStudySessionCompleteForProject(
  cardStates: Record<string, SRSCardState>,
  session: StudySession,
  globalSettings: SRSSettings,
  projectSettings: ProjectSRSSettings,
  now: number = Date.now()
): boolean {
  // Check if there are cards available right now
  const nextCard = getNextCardToStudyWithProjectSettings(
    cardStates,
    session,
    globalSettings,
    projectSettings,
    now
  );

  // If there are cards available now, session is not complete
  if (nextCard) {
    return false;
  }

  // If no cards available now, check if there are learning cards that will become available later
  // In genuine Anki, the session continues until all learning cards are processed
  const projectCards = Object.values(cardStates).filter(
    (card) => card.projectId === projectSettings.projectId
  );
  const hasWaitingLearningCards = projectCards.some(
    (card) =>
      (card.state === "learning" || card.state === "relearning") &&
      !card.isSuspended &&
      card.due > now
  );

  // Session is only complete if no cards are available AND no learning cards are waiting
  return !hasWaitingLearningCards;
}

/**
 * Get the next card to study, respecting per-project daily limits and card priorities
 * Updated to support per-project daily limits instead of global limits
 *
 * Priority order: Learning/Relearning → Review → New
 * Key Anki rules:
 * - Learning cards are NEVER subject to daily limits (must be completed)
 * - Review cards respect the per-project review daily limit
 * - New card limit applies per-project for introducing NEW cards
 */
export function getNextCardToStudyWithProjectSettings(
  cardStates: Record<string, SRSCardState>,
  session: StudySession,
  globalSettings: SRSSettings,
  projectSettings: ProjectSRSSettings,
  now: number = Date.now()
): string | null {
  const allCards = Object.values(cardStates);
  const projectId = projectSettings.projectId;

  // Get per-project session stats
  const projectStats = session.projectStats[projectId] || {
    newCardsStudied: 0,
    reviewsCompleted: 0,
  };

  console.log(
    `🔍 Looking for next card in project ${projectId}. Session state:`,
    {
      newCardsStudied: projectStats.newCardsStudied,
      newCardLimit: projectSettings.newCardsPerDay,
      reviewsCompleted: projectStats.reviewsCompleted,
      reviewLimit: projectSettings.maxReviewsPerDay,
      learningQueueSize: session.learningCardsInQueue.length,
    }
  );

  // Filter cards to only include cards from this project
  const projectCards = allCards.filter((card) => card.projectId === projectId);

  // 1. HIGHEST PRIORITY: Learning/Relearning cards (NEVER subject to daily limits)
  const learningCards = projectCards.filter((card) => {
    const isLearning = card.state === "learning" || card.state === "relearning";
    if (!isLearning || card.isSuspended) return false;
    return card.due <= now;
  });

  if (learningCards.length > 0) {
    console.log(
      `📚 Found ${learningCards.length} learning cards due in project ${projectId}:`,
      learningCards.map((c) => ({
        id: c.id.slice(0, 8),
        step: c.learningStep,
        due: new Date(c.due).toLocaleTimeString(),
      }))
    );

    // Select the earliest due learning card
    learningCards.sort((a, b) => a.due - b.due);
    const nextCard = learningCards[0];
    console.log(
      `📚 Selecting earliest due learning card:`,
      nextCard.id,
      `(step ${nextCard.learningStep + 1})`
    );
    return nextCard.id;
  }

  // 2. Second priority: Review cards that are due (subject to per-project review daily limit)
  if (
    projectSettings.maxReviewsPerDay <= 0 ||
    projectStats.reviewsCompleted < projectSettings.maxReviewsPerDay
  ) {
    const reviewCards = projectCards.filter((card) => {
      if (card.state !== "review" || card.isSuspended) return false;
      if (session.buriedCards.has(card.id)) return false;

      // Normal due check or review ahead
      return globalSettings.REVIEW_AHEAD || card.due <= now;
    });

    if (reviewCards.length > 0) {
      // Sort by due time (earliest first)
      reviewCards.sort((a, b) => a.due - b.due);
      console.log(
        `🔄 Found ${reviewCards.length} review cards due in project ${projectId}, selecting:`,
        reviewCards[0].id
      );
      return reviewCards[0].id;
    }
  } else {
    console.log(
      `⏸️ Project ${projectId} review limit reached: ${projectStats.reviewsCompleted}/${projectSettings.maxReviewsPerDay}`
    );
  }

  // 3. LOWEST PRIORITY: New cards (subject to per-project new card daily limit)
  if (projectStats.newCardsStudied < projectSettings.newCardsPerDay) {
    const newCards = projectCards.filter(
      (card) =>
        card.state === "new" &&
        !card.isSuspended &&
        !session.buriedCards.has(card.id)
    );

    if (newCards.length > 0) {
      // Apply new card ordering
      if (globalSettings.NEW_CARD_ORDER === "random") {
        const randomIndex = Math.floor(Math.random() * newCards.length);
        console.log(
          `🆕 Found ${newCards.length} new cards in project ${projectId}, selecting random:`,
          newCards[randomIndex].id
        );
        return newCards[randomIndex].id;
      } else {
        // FIFO - use first card (assumes cards are ordered by creation)
        console.log(
          `🆕 Found ${newCards.length} new cards in project ${projectId}, selecting first:`,
          newCards[0].id
        );
        return newCards[0].id;
      }
    }
  } else {
    console.log(
      `⏸️ Project ${projectId} new card limit reached: ${projectStats.newCardsStudied}/${projectSettings.newCardsPerDay}`
    );
  }

  // 4. LEARNING AHEAD: If no other cards available, study learning cards early
  const allProjectLearningCards = projectCards.filter(
    (card) =>
      (card.state === "learning" || card.state === "relearning") &&
      !card.isSuspended
  );

  if (allProjectLearningCards.length > 0) {
    console.log(
      `🔄 No cards due in project ${projectId}, checking learning ahead...`
    );

    // Find learning cards that are close to being due (within 10 minutes)
    const learningAheadCards = allProjectLearningCards.filter((card) => {
      const timeUntilDue = card.due - now;
      const minutesUntilDue = timeUntilDue / (60 * 1000);

      // Allow studying cards that are due within 10 minutes
      const isDueSoon = minutesUntilDue <= 10;

      // Also allow cards that have been waiting too long
      const hasBeenWaitingTooLong = timeUntilDue > 10 * 60 * 1000;

      return isDueSoon || hasBeenWaitingTooLong;
    });

    if (learningAheadCards.length > 0) {
      // Sort by due time (earliest first)
      learningAheadCards.sort((a, b) => a.due - b.due);
      const nextCard = learningAheadCards[0];
      const minutesAhead =
        Math.round(((nextCard.due - now) / (60 * 1000)) * 10) / 10;

      if (minutesAhead > 10) {
        console.log(
          `📚 Learning promotion in project ${projectId}: Selecting card ${
            nextCard.id
          } (waiting too long: ${Math.abs(minutesAhead)} min)`
        );
      } else {
        console.log(
          `📚 Learning ahead in project ${projectId}: Selecting card ${nextCard.id} (due in ${minutesAhead} min)`
        );
      }
      return nextCard.id;
    }
  }

  console.log(`❌ No cards available for study in project ${projectId}`);
  return null;
}

/**
 * MVP: Handle sibling burying after reviewing a card
 * Optimized for large decks using automatic cache management
 */
export function burySiblingsAfterReview(
  session: StudySession,
  reviewedCard: SRSCardState,
  allCardStates: Record<string, SRSCardState>,
  settings: SRSSettings
): StudySession {
  if (!settings.BURY_SIBLINGS || !reviewedCard.noteId) {
    return session;
  }

  const updatedSession = { ...session };
  // Clone the set before mutation to maintain immutability
  updatedSession.buriedCards = new Set(updatedSession.buriedCards);

  // Performance optimization: Use automatic cache management instead of manual cache
  const noteIdToCardsMap = getNoteIdToCardsMap(allCardStates);

  const siblingCardIds = noteIdToCardsMap.get(reviewedCard.noteId);
  if (siblingCardIds) {
    siblingCardIds.forEach((cardId) => {
      if (cardId !== reviewedCard.id) {
        updatedSession.buriedCards.add(cardId);
      }
    });
  }

  return updatedSession;
}

/**
 * Update study session after rating a card with per-project daily limit tracking
 * Enhanced with optimized counter management and improved cloning
 * Now saves daily progress to database per-project instead of globally
 *
 * Key behaviors:
 * - Uses compatible deep clone with structuredClone fallback for undo history
 * - Tracks per-project daily limits and statistics
 * - Optimized incremental counter management to avoid O(n) operations
 * - Maintains FIFO learning queue with proper "Again" handling
 * - Clones buriedCards Set before mutation for immutability
 * - Undo history limited to last 20 actions
 * - Automatic cache management for sibling burying
 * - Persists per-project daily progress to database for cross-device sync
 *
 * Performance improvements:
 * - Incremental counters avoid repeated history filtering (O(n) → O(1))
 * - Compatible deep clone reduces memory overhead
 * - Automatic cache invalidation prevents stale data bugs
 */
export async function updateStudySession(
  session: StudySession,
  card: SRSCardState,
  rating: SRSRating,
  newCardState: SRSCardState,
  allCardStates: Record<string, SRSCardState>,
  settings: SRSSettings,
  userId: string,
  projectId?: string
): Promise<StudySession> {
  const updatedSession = { ...session };
  const cardProjectId = projectId || card.projectId || "global";

  // Ensure per-project stats exist
  if (!updatedSession.projectStats[cardProjectId]) {
    updatedSession.projectStats[cardProjectId] = {
      newCardsStudied: 0,
      reviewsCompleted: 0,
    };
  }

  // Save review to history for undo functionality - use compatible deep clone
  updatedSession.reviewHistory.push({
    cardId: card.id,
    previousState: safeDeepClone(card), // Compatible clone with fallback
    rating,
    timestamp: Date.now(),
    projectId: cardProjectId, // Track which project this review belongs to
  });

  // Keep only last 20 reviews for undo (MVP limit)
  if (updatedSession.reviewHistory.length > UNDO_HISTORY_LIMIT) {
    updatedSession.reviewHistory.shift();
  }

  // Update per-project counters incrementally for better performance
  const wasNewCard = card.state === "new";
  const wasReviewCard = card.state === "review";
  const wasLearningCard =
    card.state === "learning" || card.state === "relearning";

  // Initialize counters if missing (backwards compatibility)
  if (!updatedSession._incrementalCounters) {
    updatedSession._incrementalCounters = {
      newCardsFromHistory: session.newCardsStudied,
      reviewsFromHistory: session.reviewsCompleted,
      lastHistoryLength: session.reviewHistory.length,
    };
  }

  // Increment per-project counters based on the card that was just reviewed
  const projectStats = updatedSession.projectStats[cardProjectId];

  // Only count as new card if it was actually in "new" state
  if (wasNewCard) {
    projectStats.newCardsStudied++;
    updatedSession._incrementalCounters.newCardsFromHistory++;
  }

  // Count as review if it was review OR learning/relearning (since learning cards are reviews in progress)
  if (wasReviewCard || wasLearningCard) {
    projectStats.reviewsCompleted++;
    updatedSession._incrementalCounters.reviewsFromHistory++;
  }

  updatedSession._incrementalCounters.lastHistoryLength =
    updatedSession.reviewHistory.length;

  // Update global session counters for backward compatibility
  updatedSession.newCardsStudied =
    updatedSession._incrementalCounters.newCardsFromHistory;
  updatedSession.reviewsCompleted =
    updatedSession._incrementalCounters.reviewsFromHistory;

  // Persist per-project daily counts to database (async, non-blocking)
  if (projectId && projectId !== "global") {
    saveProjectDailyStudyCountsToDB(
      userId,
      projectId,
      projectStats.newCardsStudied,
      projectStats.reviewsCompleted
    ).catch((error) => {
      console.warn(
        "Failed to persist per-project daily counts to database:",
        error
      );
    });
  } else {
    // Legacy global stats persistence
    saveDailyStudyCountsToDB(
      userId,
      updatedSession.newCardsStudied,
      updatedSession.reviewsCompleted
    ).catch((error) => {
      console.warn("Failed to persist global daily counts to database:", error);
    });
  }

  // Learning queue management (simplified for genuine SM-2 behavior)
  if (
    newCardState.state === "learning" ||
    newCardState.state === "relearning"
  ) {
    // Card is entering or staying in learning state
    if (!updatedSession.learningCardsInQueue.includes(card.id)) {
      // Add to learning queue if not already there
      updatedSession.learningCardsInQueue.push(card.id);
    }
  } else {
    // Card graduated from learning - remove from queue
    updatedSession.learningCardsInQueue =
      updatedSession.learningCardsInQueue.filter((id) => id !== card.id);
  }

  // Sibling burying logic (MVP: noteId-based)
  if (settings.BURY_SIBLINGS && card.noteId) {
    // Clone the set before mutation to maintain immutability
    updatedSession.buriedCards = new Set(updatedSession.buriedCards);

    // Bury all other cards from the same note until next day
    Object.values(allCardStates).forEach((otherCard) => {
      if (otherCard.noteId === card.noteId && otherCard.id !== card.id) {
        updatedSession.buriedCards.add(otherCard.id);
      }
    });
  }

  return updatedSession;
}

// --- STATISTICS AND SESSION STATE FUNCTIONS ---

/**
 * Get session-aware study statistics for a specific project (shows only cards available for study)
 * Following genuine Anki behavior for accurate per-project statistics
 */
export function getSessionAwareStudyStatsForProject(
  cardStates: Record<string, SRSCardState>,
  session: StudySession,
  globalSettings: SRSSettings,
  projectSettings: ProjectSRSSettings,
  now: number = Date.now()
): {
  availableNewCards: number;
  dueLearningCards: number;
  dueReviewCards: number;
  dueCards: number;
  totalCards: number;
  totalLearningCards: number; // All learning cards (due + not due)
} {
  const projectId = projectSettings.projectId;
  const allCards = Object.values(cardStates).filter(
    (card) => card.projectId === projectId
  );

  // Get per-project session stats
  const projectStats = session.projectStats[projectId] || {
    newCardsStudied: 0,
    reviewsCompleted: 0,
  };

  // New cards available for today (considering per-project daily limit and suspension)
  const remainingNewCardSlots = Math.max(
    0,
    projectSettings.newCardsPerDay - projectStats.newCardsStudied
  );
  const newCardsTotal = allCards.filter(
    (card) => card.state === "new" && !card.isSuspended
  ).length;
  const availableNewCards = Math.min(newCardsTotal, remainingNewCardSlots);

  // Learning cards that are actually due right now (genuine Anki behavior)
  const dueLearningCards = allCards.filter(
    (card) =>
      (card.state === "learning" || card.state === "relearning") &&
      !card.isSuspended &&
      card.due <= now
  ).length;

  // Total learning cards (for UI display of cards in learning state)
  const totalLearningCards = allCards.filter(
    (card) =>
      (card.state === "learning" || card.state === "relearning") &&
      !card.isSuspended
  ).length;

  // Review cards that are due (considering per-project daily limit and suspension)
  const remainingReviewSlots =
    projectSettings.maxReviewsPerDay <= 0
      ? Infinity
      : Math.max(
          0,
          projectSettings.maxReviewsPerDay - projectStats.reviewsCompleted
        );
  const reviewCardsTotal = allCards.filter(
    (card) => card.state === "review" && card.due <= now && !card.isSuspended
  ).length;
  const dueReviewCards =
    projectSettings.maxReviewsPerDay <= 0
      ? reviewCardsTotal
      : Math.min(reviewCardsTotal, remainingReviewSlots);

  // DUE = learning cards due RIGHT NOW + review cards due RIGHT NOW (NOT new cards)
  // This follows genuine Anki terminology: "due" means available for study right now
  const dueCards = dueLearningCards + dueReviewCards;

  return {
    availableNewCards,
    dueLearningCards,
    dueReviewCards,
    dueCards,
    totalCards: allCards.length,
    totalLearningCards,
  };
}

/**
 * Check if the study session should end for a specific project (Anki-style logic)
 * Session ends when no more cards are available for study today in this project
 */
export function shouldEndStudySessionForProject(
  cardStates: Record<string, SRSCardState>,
  session: StudySession,
  globalSettings: SRSSettings,
  projectSettings: ProjectSRSSettings,
  now: number = Date.now()
): boolean {
  // Use the project-specific logic to check if any cards are available
  const nextCard = getNextCardToStudyWithProjectSettings(
    cardStates,
    session,
    globalSettings,
    projectSettings,
    now
  );
  return nextCard === null;
}

/**
 * Get study session summary for a specific project
 */
export function getStudySessionSummaryForProject(
  cardStates: Record<string, SRSCardState>,
  session: StudySession,
  globalSettings: SRSSettings,
  projectSettings: ProjectSRSSettings,
  now: number = Date.now()
): {
  isComplete: boolean;
  availableCards: number;
  newCardsRemaining: number;
  reviewsRemaining: number;
  learningCardsWaiting: number;
} {
  const sessionStats = getSessionAwareStudyStatsForProject(
    cardStates,
    session,
    globalSettings,
    projectSettings,
    now
  );
  const isComplete = shouldEndStudySessionForProject(
    cardStates,
    session,
    globalSettings,
    projectSettings,
    now
  );

  return {
    isComplete,
    availableCards: sessionStats.dueCards,
    newCardsRemaining: sessionStats.availableNewCards,
    reviewsRemaining: sessionStats.dueReviewCards,
    learningCardsWaiting: sessionStats.dueLearningCards,
  };
}

/**
 * MVP: Get daily study statistics
 */
export function getDailyStats(session: StudySession): {
  newCardsStudied: number;
  reviewsCompleted: number;
  lapses: number;
  totalTimeSpent: number; // Estimate based on cards
  accuracy: number; // Percentage of Good/Easy ratings
} {
  const totalReviews = session.reviewHistory.length;
  const goodOrEasyReviews = session.reviewHistory.filter(
    (review) => review.rating >= 2
  ).length;

  const lapses = session.reviewHistory.filter(
    (review) => review.rating === 0
  ).length;

  return {
    newCardsStudied: session.newCardsStudied,
    reviewsCompleted: session.reviewsCompleted,
    lapses,
    totalTimeSpent: totalReviews * ESTIMATED_SECONDS_PER_CARD, // Rough estimate: 30 seconds per card
    accuracy: totalReviews > 0 ? (goodOrEasyReviews / totalReviews) * 100 : 0,
  };
}

// --- UNDO FUNCTIONALITY ---

/**
 * MVP: Undo last review action
 * Enhanced with optimized counter management
 *
 * Behavior:
 * - Restores card to previous state from deep-cloned history
 * - Uses optimized incremental counter updates instead of full recalculation
 * - Limited to last action only (no full undo stack like Anki)
 */
export function undoLastReview(
  session: StudySession,
  cardStates: Record<string, SRSCardState>
): {
  session: StudySession;
  cardStates: Record<string, SRSCardState>;
} | null {
  if (session.reviewHistory.length === 0) {
    return null; // Nothing to undo
  }

  const updatedSession = { ...session };
  const lastReview = updatedSession.reviewHistory.pop()!;
  const updatedCardStates = { ...cardStates };

  // Restore previous card state
  updatedCardStates[lastReview.cardId] = lastReview.previousState;

  // Update counters efficiently - decrement based on what was undone
  const wasNewCard = lastReview.previousState.state === "new";
  const wasReviewCard = lastReview.previousState.state === "review";

  // Initialize counters if missing (backwards compatibility)
  if (!updatedSession._incrementalCounters) {
    updatedSession._incrementalCounters = {
      newCardsFromHistory: session.newCardsStudied,
      reviewsFromHistory: session.reviewsCompleted,
      lastHistoryLength: session.reviewHistory.length + 1, // +1 because we just popped
    };
  }

  const counters = updatedSession._incrementalCounters;

  // Decrement counters based on what was undone
  if (wasNewCard && counters.newCardsFromHistory > 0) {
    counters.newCardsFromHistory--;
  }
  if (wasReviewCard && counters.reviewsFromHistory > 0) {
    counters.reviewsFromHistory--;
  }
  counters.lastHistoryLength = updatedSession.reviewHistory.length;

  // Update session counters from incremental tracking
  updatedSession.newCardsStudied = counters.newCardsFromHistory;
  updatedSession.reviewsCompleted = counters.reviewsFromHistory;

  return {
    session: updatedSession,
    cardStates: updatedCardStates,
  };
}
