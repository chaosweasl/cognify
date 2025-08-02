// SRS Session Management and Statistics
// Handles study sessions, statistics, and utility functions
import { SRSSettings } from "@/hooks/useSettings";
import { SRSCardState, SRSRating } from "./SRSScheduler";

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
  };
}

/**
 * Get the next card to study, respecting daily limits and card priorities (with settings)
 * Fixed learning queue behavior to prevent infinite loops and match Anki behavior
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
  });

  // 1. First priority: Learning/Relearning cards (ALWAYS available within session)
  // CRITICAL FIX: Learning cards are immediately available after rating, ignore due times within session
  // This prevents infinite loops where cards disappear/reappear based on due time
  const learningCards = allCards.filter(
    (card) =>
      (card.state === "learning" || card.state === "relearning") &&
      !card.isSuspended
  );

  if (learningCards.length > 0) {
    // ANKI BEHAVIOR: Use the learning queue to maintain proper FIFO order
    // Cards in the learning queue should be prioritized in queue order, not by due time

    // First, try to find a card that's in the learning queue (maintain FIFO order)
    for (const queuedCardId of session.learningCardsInQueue) {
      const queuedCard = learningCards.find((card) => card.id === queuedCardId);
      if (queuedCard) {
        console.log(
          `📚 Found queued learning card:`,
          queuedCard.id,
          `(step ${queuedCard.learningStep + 1})`
        );
        return queuedCard.id;
      }
    }

    // If no queued cards found, take the earliest due learning card
    // This handles cards that are learning but not yet in the session queue
    learningCards.sort((a, b) => a.due - b.due);
    const nextCard = learningCards[0];
    console.log(
      `📚 Found ${learningCards.length} learning cards, selecting:`,
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

  // Find all cards from the same note and bury them
  Object.values(allCardStates).forEach((card) => {
    if (card.noteId === reviewedCard.noteId && card.id !== reviewedCard.id) {
      updatedSession.buriedCards.add(card.id);
    }
  });

  return updatedSession;
}

/**
 * Update study session after rating a card
 * Fixed learning queue management to maintain proper FIFO order and prevent infinite loops
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

  // Save review to history for undo functionality
  updatedSession.reviewHistory.push({
    cardId: card.id,
    previousState: card,
    rating,
    timestamp: Date.now(),
  });

  // Keep only last 20 reviews for undo (MVP limit)
  if (updatedSession.reviewHistory.length > 20) {
    updatedSession.reviewHistory.shift();
  }

  // Track new cards studied
  if (card.state === "new") {
    updatedSession.newCardsStudied++;
  }

  // Track reviews completed (ONLY actual review cards, not learning graduations)
  if (card.state === "review") {
    updatedSession.reviewsCompleted++;
  }

  // CRITICAL FIX: Proper learning queue management for FIFO behavior
  if (
    newCardState.state === "learning" ||
    newCardState.state === "relearning"
  ) {
    // Card is entering or staying in learning queue

    if (card.state === "new") {
      // New card entering learning - add to END of queue
      if (!updatedSession.learningCardsInQueue.includes(card.id)) {
        updatedSession.learningCardsInQueue.push(card.id);
      }
    } else if (
      (card.state === "learning" || card.state === "relearning") &&
      rating === 0
    ) {
      // "Again" on learning card - move to BACK of queue (FIFO behavior)
      updatedSession.learningCardsInQueue =
        updatedSession.learningCardsInQueue.filter((id) => id !== card.id);
      updatedSession.learningCardsInQueue.push(card.id); // Add to back
    } else if (!updatedSession.learningCardsInQueue.includes(card.id)) {
      // Learning card not in queue yet - add to end
      updatedSession.learningCardsInQueue.push(card.id);
    }
    // If card was already in learning and got Good/Hard, it stays in its current queue position
  } else {
    // Card graduated from learning - remove from queue
    updatedSession.learningCardsInQueue =
      updatedSession.learningCardsInQueue.filter((id) => id !== card.id);
  }

  // Sibling burying logic (MVP: noteId-based)
  if (settings.BURY_SIBLINGS && card.noteId) {
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

  // Learning cards (always available within session - ignore due time)
  const dueLearningCards = allCards.filter(
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

  // DUE = learning + review (NOT new cards)
  const dueCards = dueLearningCards + dueReviewCards;

  return {
    availableNewCards,
    dueLearningCards,
    dueReviewCards,
    dueCards,
    totalCards: allCards.length,
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
    totalTimeSpent: totalReviews * 30, // Rough estimate: 30 seconds per card
    accuracy: totalReviews > 0 ? (goodOrEasyReviews / totalReviews) * 100 : 0,
  };
}

// --- UNDO FUNCTIONALITY ---

/**
 * MVP: Undo last review action
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

  // Adjust session counters
  const previousCard = lastReview.previousState;
  if (previousCard.state === "new") {
    updatedSession.newCardsStudied = Math.max(
      0,
      updatedSession.newCardsStudied - 1
    );
  } else if (previousCard.state === "review") {
    updatedSession.reviewsCompleted = Math.max(
      0,
      updatedSession.reviewsCompleted - 1
    );
  }

  return {
    session: updatedSession,
    cardStates: updatedCardStates,
  };
}
