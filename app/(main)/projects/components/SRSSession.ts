// SRS Session Management and Statistics
// Handles study sessions, statistics, and utility functions
import { SRSSettings } from "@/hooks/useSettings";
import { SRSCardState, SRSRating } from "./SRSScheduler";

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
  newCardsStudied: number;
  reviewsCompleted: number;
  learningCardsInQueue: string[]; // Cards currently in learning queue
  // Review history for undo functionality
  reviewHistory: Array<{
    cardId: string;
    previousState: SRSCardState;
    rating: SRSRating;
    timestamp: number;
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

// --- SESSION MANAGEMENT FUNCTIONS ---

/**
 * Initialize a new study session
 */
export function initStudySession(): StudySession {
  return {
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
 * Check if a study session should be considered complete
 * Session is complete when there are no cards available for study right now
 */
export function isStudySessionComplete(
  cardStates: Record<string, SRSCardState>,
  session: StudySession,
  settings: SRSSettings,
  now: number = Date.now()
): boolean {
  const nextCard = getNextCardToStudyWithSettings(
    cardStates,
    session,
    settings,
    now
  );

  // Session is complete when no cards are available for study right now
  return !nextCard;
}

/**
 * Get the next card to study, respecting daily limits and card priorities (with settings)
 * Fixed learning queue behavior to prevent infinite loops and match Anki behavior
 *
 * Priority order: Learning/Relearning → Review → New
 * Assumptions:
 * - Daily limits are not reset here (external logic needed for day boundaries)
 * - Buried cards are in-memory only (reset on session end)
 * - Review ahead option allows studying future reviews
 * - Learning cards ignore due times within session to prevent infinite loops
 */
export function getNextCardToStudyWithSettings(
  cardStates: Record<string, SRSCardState>,
  session: StudySession,
  settings: SRSSettings,
  now: number = Date.now()
): string | null {
  const allCards = Object.values(cardStates);

  console.log(`🔍 Looking for next card. Session state:`, {
    newCardsStudied: session.newCardsStudied,
    newCardLimit: settings.NEW_CARDS_PER_DAY,
    reviewsCompleted: session.reviewsCompleted,
    reviewLimit: settings.MAX_REVIEWS_PER_DAY,
    learningQueueSize: session.learningCardsInQueue.length,
    learningQueue: session.learningCardsInQueue.map((id) => id.slice(0, 8)),
  });

  // 1. First priority: Learning/Relearning cards (only when actually due)
  // Following genuine Anki behavior: learning cards must wait for their due time
  const learningCards = allCards.filter((card) => {
    const isLearning = card.state === "learning" || card.state === "relearning";
    if (!isLearning || card.isSuspended) return false;

    // Learning cards are only available when their due time has arrived
    // This follows the genuine SM-2/Anki algorithm
    return card.due <= now;
  });

  if (learningCards.length > 0) {
    console.log(
      `📚 Found ${learningCards.length} learning cards due:`,
      learningCards.map((c) => ({
        id: c.id.slice(0, 8),
        step: c.learningStep,
        due: new Date(c.due).toLocaleTimeString(),
      }))
    );

    // Select the earliest due learning card (genuine SM-2 behavior)
    learningCards.sort((a, b) => a.due - b.due);
    const nextCard = learningCards[0];
    console.log(
      `📚 Selecting earliest due learning card:`,
      nextCard.id,
      `(step ${nextCard.learningStep + 1})`
    );
    return nextCard.id;
  }

  // 2. Second priority: Review cards that are due (if under daily limit)
  // If MAX_REVIEWS_PER_DAY is 0 or less, allow unlimited reviews
  // Support review ahead option
  if (
    settings.MAX_REVIEWS_PER_DAY <= 0 ||
    session.reviewsCompleted < settings.MAX_REVIEWS_PER_DAY
  ) {
    const reviewCards = allCards.filter((card) => {
      if (card.state !== "review" || card.isSuspended) return false;
      if (session.buriedCards.has(card.id)) return false;

      // Normal due check or review ahead
      return settings.REVIEW_AHEAD || card.due <= now;
    });

    if (reviewCards.length > 0) {
      // Sort by due time (earliest first)
      reviewCards.sort((a, b) => a.due - b.due);
      console.log(
        `🔄 Found ${reviewCards.length} review cards due, selecting:`,
        reviewCards[0].id
      );
      return reviewCards[0].id;
    }
  } else {
    console.log(
      `⏸️ Review limit reached: ${session.reviewsCompleted}/${settings.MAX_REVIEWS_PER_DAY}`
    );
  }

  // 3. Third priority: New cards (if under daily limit)
  if (session.newCardsStudied < settings.NEW_CARDS_PER_DAY) {
    const newCards = allCards.filter(
      (card) =>
        card.state === "new" &&
        !card.isSuspended &&
        !session.buriedCards.has(card.id)
    );

    if (newCards.length > 0) {
      // Apply new card ordering
      if (settings.NEW_CARD_ORDER === "random") {
        const randomIndex = Math.floor(Math.random() * newCards.length);
        console.log(
          `🆕 Found ${newCards.length} new cards, selecting random:`,
          newCards[randomIndex].id
        );
        return newCards[randomIndex].id;
      } else {
        // FIFO - use first card (assumes cards are ordered by creation)
        console.log(
          `🆕 Found ${newCards.length} new cards, selecting first:`,
          newCards[0].id
        );
        return newCards[0].id;
      }
    }
  } else {
    console.log(
      `⏸️ New card limit reached: ${session.newCardsStudied}/${settings.NEW_CARDS_PER_DAY}`
    );
  }

  console.log(`❌ No cards available for study`);
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
 * Update study session after rating a card
 * Enhanced with optimized counter management and improved cloning
 *
 * Key behaviors:
 * - Uses compatible deep clone with structuredClone fallback for undo history
 * - Optimized incremental counter management to avoid O(n) operations
 * - Maintains FIFO learning queue with proper "Again" handling
 * - Clones buriedCards Set before mutation for immutability
 * - Undo history limited to last 20 actions
 * - Automatic cache management for sibling burying
 *
 * Performance improvements:
 * - Incremental counters avoid repeated history filtering (O(n) → O(1))
 * - Compatible deep clone reduces memory overhead
 * - Automatic cache invalidation prevents stale data bugs
 */
export function updateStudySession(
  session: StudySession,
  card: SRSCardState,
  rating: SRSRating,
  newCardState: SRSCardState,
  allCardStates: Record<string, SRSCardState>,
  settings: SRSSettings
): StudySession {
  const updatedSession = { ...session };

  // Save review to history for undo functionality - use compatible deep clone
  updatedSession.reviewHistory.push({
    cardId: card.id,
    previousState: safeDeepClone(card), // Compatible clone with fallback
    rating,
    timestamp: Date.now(),
  });

  // Keep only last 20 reviews for undo (MVP limit)
  if (updatedSession.reviewHistory.length > UNDO_HISTORY_LIMIT) {
    updatedSession.reviewHistory.shift();
  }

  // Update counters incrementally for better performance
  const wasNewCard = card.state === "new";
  const wasReviewCard = card.state === "review";

  // Initialize counters if missing (backwards compatibility)
  if (!updatedSession._incrementalCounters) {
    updatedSession._incrementalCounters = {
      newCardsFromHistory: session.newCardsStudied,
      reviewsFromHistory: session.reviewsCompleted,
      lastHistoryLength: session.reviewHistory.length,
    };
  }

  // Increment counters based on the card that was just reviewed
  const counters = updatedSession._incrementalCounters;
  if (wasNewCard) {
    counters.newCardsFromHistory++;
  }
  if (wasReviewCard) {
    counters.reviewsFromHistory++;
  }
  counters.lastHistoryLength = updatedSession.reviewHistory.length;

  // Update session counters from incremental tracking
  updatedSession.newCardsStudied = counters.newCardsFromHistory;
  updatedSession.reviewsCompleted = counters.reviewsFromHistory;

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
 * Get session-aware study statistics (shows only cards available for study)
 * Following genuine Anki behavior for accurate statistics
 */
export function getSessionAwareStudyStats(
  cardStates: Record<string, SRSCardState>,
  session: StudySession,
  settings: SRSSettings,
  now: number = Date.now()
): {
  availableNewCards: number;
  dueLearningCards: number;
  dueReviewCards: number;
  dueCards: number;
  totalCards: number;
  totalLearningCards: number; // All learning cards (due + not due)
} {
  const allCards = Object.values(cardStates);

  // New cards available for today (considering daily limit and suspension)
  const remainingNewCardSlots = Math.max(
    0,
    settings.NEW_CARDS_PER_DAY - session.newCardsStudied
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

  // Review cards that are due now (considering daily limit and suspension)
  const remainingReviewSlots =
    settings.MAX_REVIEWS_PER_DAY <= 0
      ? Infinity
      : Math.max(0, settings.MAX_REVIEWS_PER_DAY - session.reviewsCompleted);
  const reviewCardsTotal = allCards.filter(
    (card) => card.state === "review" && card.due <= now && !card.isSuspended
  ).length;
  const dueReviewCards =
    settings.MAX_REVIEWS_PER_DAY <= 0
      ? reviewCardsTotal
      : Math.min(reviewCardsTotal, remainingReviewSlots);

  // DUE NOW = learning cards due now + review cards due now (NOT new cards)
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
 * Check if the study session should end (Anki-style logic)
 * Session ends when no more cards are available for study today
 */
export function shouldEndStudySession(
  cardStates: Record<string, SRSCardState>,
  session: StudySession,
  settings: SRSSettings,
  now: number = Date.now()
): boolean {
  // Use the same logic as getNextCardToStudyWithSettings to check if any cards are available
  const nextCard = getNextCardToStudyWithSettings(
    cardStates,
    session,
    settings,
    now
  );
  return nextCard === null;
}

/**
 * Get study session summary for UI display
 */
export function getStudySessionSummary(
  cardStates: Record<string, SRSCardState>,
  session: StudySession,
  settings: SRSSettings,
  now: number = Date.now()
): {
  isComplete: boolean;
  availableCards: number;
  newCardsRemaining: number;
  reviewsRemaining: number;
  learningCardsWaiting: number;
} {
  const sessionStats = getSessionAwareStudyStats(
    cardStates,
    session,
    settings,
    now
  );
  const isComplete = shouldEndStudySession(cardStates, session, settings, now);

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
