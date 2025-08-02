// Complete Anki-like SRS Scheduler
// Implements proper learning steps, daily limits, card queues, and graduation system
import { SRSSettings } from "@/hooks/useSettings";

// --- DEFAULT SRS SETTINGS (fallback when user settings aren't available) ---
export const DEFAULT_SRS_SETTINGS: SRSSettings = {
  // Daily card limits
  NEW_CARDS_PER_DAY: 20, // Maximum new cards to introduce per day
  MAX_REVIEWS_PER_DAY: 200, // Maximum reviews per day (0 = unlimited)

  // Learning steps (in minutes) - Anki-like progression
  LEARNING_STEPS: [1, 10, 1440], // 1 min → 10 min → 1 day (more Anki-like)

  // Relearning steps (in minutes) - for cards that fail review
  RELEARNING_STEPS: [10, 1440], // 10 minutes → 1 day before going back to review queue

  // Graduation settings
  GRADUATING_INTERVAL: 1, // Days after completing learning steps
  EASY_INTERVAL: 4, // Days when "Easy" is pressed on new card

  // Ease settings (SM-2 algorithm)
  STARTING_EASE: 2.5, // Starting ease factor for new cards
  MINIMUM_EASE: 1.3, // Minimum ease factor
  EASY_BONUS: 1.3, // Multiplier for "Easy" button

  // SM-2 interval modifiers (Anki-style)
  HARD_INTERVAL_FACTOR: 0.8, // Multiplier for "Hard" intervals (reduced from 1.2)
  EASY_INTERVAL_FACTOR: 1.3, // Multiplier for "Easy" intervals

  // Lapse settings
  LAPSE_RECOVERY_FACTOR: 0.2, // Recovery multiplier after relearning
  LAPSE_EASE_PENALTY: 0.2, // Ease penalty for lapses (Anki-style)
  INTERVAL_MODIFIER: 1.0, // Global interval modifier (Anki-style)
  LEECH_THRESHOLD: 8, // Number of lapses before marking as leech
  LEECH_ACTION: "suspend", // What to do with leeches

  // Deck options for MVP
  NEW_CARD_ORDER: "random", // "random" or "fifo" (first-in-first-out)
  REVIEW_AHEAD: false, // Allow reviewing future-due cards
  BURY_SIBLINGS: false, // Bury new/review cards from same note after review
  MAX_INTERVAL: 36500, // Maximum interval in days (100 years)
};

// Additional constants not in user settings
const MINIMUM_INTERVAL = 1;

// --- TYPES ---
export type SRSRating = 0 | 1 | 2 | 3; // 0=Again, 1=Hard, 2=Good, 3=Easy

export type CardState = "new" | "learning" | "review" | "relearning";

export type SRSCardState = {
  id: string;
  state: CardState;
  interval: number; // days (for review cards) or minutes (for learning cards)
  ease: number; // ease factor (only for review cards)
  due: number; // timestamp (ms) when card is due
  lastReviewed: number; // timestamp (ms) of last review
  repetitions: number; // number of successful reviews
  lapses: number; // number of times card has been forgotten (Again on review)
  learningStep: number; // current step in learning/relearning process
  isLeech: boolean; // whether card is marked as a leech
  isSuspended: boolean; // whether card is suspended (MVP: simple suspend flag)
  // Note/field metadata for MVP
  noteId?: string; // ID of the parent note
  templateId?: string; // Template used to generate this card
  tags?: string[]; // Tags associated with the card
};

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
function addMinutes(timestamp: number, minutes: number): number {
  return timestamp + minutes * 60 * 1000;
}

function addDays(timestamp: number, days: number): number {
  return timestamp + days * 24 * 60 * 60 * 1000;
}

/**
 * Calculate new ease factor using official Anki SM-2 values
 * Quality (q): 0=Again, 1=Hard, 2=Good, 3=Easy
 */
function calculateNewEase(
  currentEase: number,
  quality: SRSRating,
  settings: SRSSettings = DEFAULT_SRS_SETTINGS
): number {
  let newEase = currentEase;

  switch (quality) {
    case 0: // Again - decrease ease significantly
      newEase = currentEase - 0.2;
      break;
    case 1: // Hard - decrease ease (official Anki: -0.20)
      newEase = currentEase - 0.2;
      break;
    case 2: // Good - increase ease slightly
      newEase = currentEase + 0.15;
      break;
    case 3: // Easy - no change (Anki behavior)
      newEase = currentEase;
      break;
  }

  // Ensure minimum ease factor
  return Math.max(settings.MINIMUM_EASE, newEase);
}

// --- CORE SRS FUNCTIONS ---

/**
 * Initialize SRS state for new cards (with settings support)
 */
export function initSRSStateWithSettings(
  cardIds: string[],
  settings: SRSSettings = DEFAULT_SRS_SETTINGS,
  noteId?: string,
  templateId?: string,
  tags?: string[]
): Record<string, SRSCardState> {
  const now = Date.now();
  const initial: Record<string, SRSCardState> = {};

  for (const id of cardIds) {
    initial[id] = {
      id,
      state: "new",
      interval: 0,
      ease: settings.STARTING_EASE,
      due: now, // New cards are immediately available
      lastReviewed: 0,
      repetitions: 0,
      lapses: 0,
      learningStep: 0,
      isLeech: false,
      isSuspended: false,
      noteId,
      templateId,
      tags: tags ? [...tags] : undefined,
    };
  }

  return initial;
}

/**
 * Main scheduling function with settings support
 */
export function scheduleSRSCardWithSettings(
  card: SRSCardState,
  rating: SRSRating,
  settings: SRSSettings,
  now: number = Date.now()
): SRSCardState {
  // Use settings-aware scheduling
  return scheduleSRSCardInternal(card, rating, settings, now);
}

/**
 * Internal scheduling function that accepts settings
 */
function scheduleSRSCardInternal(
  card: SRSCardState,
  rating: SRSRating,
  settings: SRSSettings,
  now: number = Date.now()
): SRSCardState {
  const updatedCard = { ...card, lastReviewed: now };

  switch (card.state) {
    case "new":
      return scheduleNewCard(updatedCard, rating, settings, now);
    case "learning":
      return scheduleLearningCard(updatedCard, rating, settings, now);
    case "review":
      return scheduleReviewCard(updatedCard, rating, settings, now);
    case "relearning":
      return scheduleRelearningCard(updatedCard, rating, settings, now);
    default:
      return updatedCard;
  }
}

/**
 * Handle new cards (first time seeing the card) - Anki-style
 */
function scheduleNewCard(
  card: SRSCardState,
  rating: SRSRating,
  settings: SRSSettings,
  now: number
): SRSCardState {
  if (rating === 0) {
    // Again - enter learning queue at step 1
    return {
      ...card,
      state: "learning",
      learningStep: 0,
      due: addMinutes(now, settings.LEARNING_STEPS[0]),
      interval: settings.LEARNING_STEPS[0],
    };
  } else if (rating === 1) {
    // Hard - enter learning queue at step 1
    return {
      ...card,
      state: "learning",
      learningStep: 0,
      due: addMinutes(now, settings.LEARNING_STEPS[0]),
      interval: settings.LEARNING_STEPS[0],
    };
  } else if (rating === 2) {
    // Good - start at first learning step (Anki behavior)
    return {
      ...card,
      state: "learning",
      learningStep: 0,
      due: addMinutes(now, settings.LEARNING_STEPS[0]),
      interval: settings.LEARNING_STEPS[0],
    };
  } else {
    // Easy - skip all learning steps and graduate immediately with EASY_INTERVAL
    console.log(
      `🚀 Card ${card.id} marked Easy, graduating directly to ${settings.EASY_INTERVAL} days`
    );
    return {
      ...card,
      state: "review",
      repetitions: 1, // First repetition upon graduation
      interval: settings.EASY_INTERVAL,
      due: addDays(now, settings.EASY_INTERVAL),
      learningStep: 0,
    };
  }
}

/**
 * Handle learning cards (going through learning steps)
 */
function scheduleLearningCard(
  card: SRSCardState,
  rating: SRSRating,
  settings: SRSSettings,
  now: number
): SRSCardState {
  if (rating === 0) {
    // Again - restart learning
    return {
      ...card,
      learningStep: 0,
      due: addMinutes(now, settings.LEARNING_STEPS[0]),
      interval: settings.LEARNING_STEPS[0],
    };
  } else if (rating === 1) {
    // Hard - repeat current step
    const currentStep = Math.min(
      card.learningStep,
      settings.LEARNING_STEPS.length - 1
    );
    const stepInterval = settings.LEARNING_STEPS[currentStep];
    return {
      ...card,
      due: addMinutes(now, stepInterval),
      interval: stepInterval,
    };
  } else if (rating === 2) {
    // Good - advance to next step or graduate
    const nextStep = card.learningStep + 1;

    if (nextStep >= settings.LEARNING_STEPS.length) {
      // Graduate to review queue using last learning step as base interval
      const lastStepMinutes =
        settings.LEARNING_STEPS[settings.LEARNING_STEPS.length - 1];
      const graduationInterval =
        lastStepMinutes >= 1440
          ? Math.round(lastStepMinutes / 1440)
          : settings.GRADUATING_INTERVAL;

      console.log(
        `🎓 Learning card ${card.id} graduating to review, scheduled for ${graduationInterval} days`
      );
      return {
        ...card,
        state: "review",
        repetitions: 1, // First repetition upon graduation
        interval: graduationInterval,
        due: addDays(now, graduationInterval),
        learningStep: 0,
      };
    } else {
      // Move to next learning step
      const stepInterval = settings.LEARNING_STEPS[nextStep];
      return {
        ...card,
        learningStep: nextStep,
        due: addMinutes(now, stepInterval),
        interval: stepInterval,
      };
    }
  } else {
    // Easy - ALWAYS skip remaining steps and graduate immediately (Anki behavior)
    console.log(
      `🚀 Learning card ${card.id} marked Easy, graduating to ${settings.EASY_INTERVAL} days`
    );
    return {
      ...card,
      state: "review",
      repetitions: 1, // First repetition upon graduation
      interval: settings.EASY_INTERVAL,
      due: addDays(now, settings.EASY_INTERVAL),
      learningStep: 0,
    };
  }
}

/**
 * Handle review cards (mature cards using SM-2 algorithm) - Anki-style
 */
function scheduleReviewCard(
  card: SRSCardState,
  rating: SRSRating,
  settings: SRSSettings,
  now: number
): SRSCardState {
  if (rating === 0) {
    // Again - send to relearning (lapse) with ease penalty
    const newLapses = card.lapses + 1;
    const newEase = Math.max(
      settings.MINIMUM_EASE,
      card.ease - settings.LAPSE_EASE_PENALTY
    );

    // Check if card should be marked as leech and suspended
    const isLeech = newLapses >= settings.LEECH_THRESHOLD;
    const shouldSuspend = isLeech && settings.LEECH_ACTION === "suspend";

    return {
      ...card,
      state: "relearning",
      lapses: newLapses,
      ease: newEase,
      learningStep: 0,
      due: addMinutes(now, settings.RELEARNING_STEPS[0]),
      interval: settings.RELEARNING_STEPS[0],
      isLeech,
      isSuspended: shouldSuspend,
    };
  }

  // For Hard, Good, Easy - calculate new interval using simplified SM-2
  const newEase = calculateNewEase(card.ease, rating, settings);
  let newInterval: number;

  if (rating === 1) {
    // Hard - Anki formula: interval = prev_interval * 1.2 (but capped at prev * ease * 0.5)
    newInterval = Math.round(card.interval * 1.2);
    // Cap at what good would give * 0.5 (Anki behavior)
    const goodInterval = Math.round(card.interval * newEase);
    newInterval = Math.min(newInterval, Math.round(goodInterval * 0.5));
  } else if (rating === 2) {
    // Good - normal progression using ease factor
    newInterval = Math.round(card.interval * newEase);
  } else {
    // Easy - increase interval more with easy bonus
    newInterval = Math.round(
      card.interval * newEase * settings.EASY_INTERVAL_FACTOR
    );
  }

  // Apply global interval modifier
  newInterval = Math.round(newInterval * settings.INTERVAL_MODIFIER);

  newInterval = Math.max(MINIMUM_INTERVAL, newInterval);
  newInterval = Math.min(settings.MAX_INTERVAL, newInterval);

  return {
    ...card,
    repetitions: card.repetitions + 1,
    ease: newEase,
    interval: newInterval,
    due: addDays(now, newInterval),
  };
}

/**
 * Handle relearning cards (failed review cards going through relearning steps) - Anki-style
 */
function scheduleRelearningCard(
  card: SRSCardState,
  rating: SRSRating,
  settings: SRSSettings,
  now: number
): SRSCardState {
  if (rating === 0) {
    // Again - restart relearning
    return {
      ...card,
      learningStep: 0,
      due: addMinutes(now, settings.RELEARNING_STEPS[0]),
      interval: settings.RELEARNING_STEPS[0],
    };
  } else if (rating === 1) {
    // Hard - repeat current step
    const currentStep = Math.min(
      card.learningStep,
      settings.RELEARNING_STEPS.length - 1
    );
    const stepInterval = settings.RELEARNING_STEPS[currentStep];
    return {
      ...card,
      due: addMinutes(now, stepInterval),
      interval: stepInterval,
    };
  } else if (rating === 2) {
    // Good - advance to next step or graduate
    const nextStep = card.learningStep + 1;

    if (nextStep >= settings.RELEARNING_STEPS.length) {
      // Graduate back to review queue with recovery factor applied (Anki-style)
      const newInterval = Math.max(
        MINIMUM_INTERVAL,
        Math.round(card.interval * settings.LAPSE_RECOVERY_FACTOR)
      );
      return {
        ...card,
        state: "review",
        interval: newInterval,
        due: addDays(now, newInterval),
        learningStep: 0,
      };
    } else {
      // Move to next relearning step
      const stepInterval = settings.RELEARNING_STEPS[nextStep];
      return {
        ...card,
        learningStep: nextStep,
        due: addMinutes(now, stepInterval),
        interval: stepInterval,
      };
    }
  } else {
    // Easy - graduate back to review with normal interval (no recovery penalty)
    return {
      ...card,
      state: "review",
      due: addDays(now, card.interval),
      learningStep: 0,
    };
  }
}

/**
 * Get the next card to study, respecting daily limits and card priorities (with settings)
 */
export function getNextCardToStudyWithSettings(
  cardStates: Record<string, SRSCardState>,
  session: StudySession,
  settings: SRSSettings = DEFAULT_SRS_SETTINGS,
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

  // 1. First priority: ALL Learning/Relearning cards (ignore due time for session flow)
  // In Anki, learning steps happen in the same session regardless of scheduled intervals
  // Skip suspended cards
  const learningCards = allCards.filter(
    (card) =>
      (card.state === "learning" || card.state === "relearning") &&
      !card.isSuspended
    // This keeps "Again" cards in the session even if scheduled for later
  );

  if (learningCards.length > 0) {
    // Sort by due time (earliest first), but include ALL learning cards
    learningCards.sort((a, b) => a.due - b.due);
    console.log(
      `📚 Found ${learningCards.length} learning cards, selecting earliest:`,
      learningCards[0].id
    );
    return learningCards[0].id;
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
 * Update study session after rating a card
 */
export function updateStudySession(
  session: StudySession,
  card: SRSCardState,
  rating: SRSRating,
  newCardState: SRSCardState,
  settings: SRSSettings = DEFAULT_SRS_SETTINGS
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

  // Manage learning queue
  if (
    newCardState.state === "learning" ||
    newCardState.state === "relearning"
  ) {
    if (!updatedSession.learningCardsInQueue.includes(card.id)) {
      updatedSession.learningCardsInQueue.push(card.id);
    }
  } else {
    // Remove from learning queue if graduated
    updatedSession.learningCardsInQueue =
      updatedSession.learningCardsInQueue.filter((id) => id !== card.id);
  }

  // Sibling burying logic (MVP: simple noteId-based)
  if (settings.BURY_SIBLINGS && card.noteId) {
    // This would need to be implemented based on actual note/card relationships
    // For MVP, we just mark the current card as processed
  }

  return updatedSession;
}

/**
 * Get session-aware study statistics (shows only cards available for study)
 */
export function getSessionAwareStudyStats(
  cardStates: Record<string, SRSCardState>,
  session: StudySession,
  settings: SRSSettings = DEFAULT_SRS_SETTINGS,
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

  // Learning cards (always available in session, ignore due time, but respect suspension)
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
  settings: SRSSettings = DEFAULT_SRS_SETTINGS,
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
  settings: SRSSettings = DEFAULT_SRS_SETTINGS,
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
 * MVP: Simple card suspension/unsuspension
 */
export function suspendCard(card: SRSCardState): SRSCardState {
  return { ...card, isSuspended: true };
}

export function unsuspendCard(card: SRSCardState): SRSCardState {
  return { ...card, isSuspended: false };
}

/**
 * MVP: Simple note template support
 * Generate multiple cards from a single note based on template
 */
export function generateCardsFromNote(
  noteId: string,
  fields: Record<string, string>,
  templates: Array<{
    id: string;
    name: string;
    front: string;
    back: string;
  }>,
  settings: SRSSettings = DEFAULT_SRS_SETTINGS
): Record<string, SRSCardState> {
  const cards: Record<string, SRSCardState> = {};

  for (const template of templates) {
    const cardId = `${noteId}_${template.id}`;

    // Simple field substitution (MVP)
    const front = template.front.replace(
      /\{\{(\w+)\}\}/g,
      (match, field) => fields[field] || match
    );
    const back = template.back.replace(
      /\{\{(\w+)\}\}/g,
      (match, field) => fields[field] || match
    );

    // Create SRS state for this card
    cards[cardId] = {
      id: cardId,
      state: "new",
      interval: 0,
      ease: settings.STARTING_EASE,
      due: Date.now(),
      lastReviewed: 0,
      repetitions: 0,
      lapses: 0,
      learningStep: 0,
      isLeech: false,
      isSuspended: false,
      noteId,
      templateId: template.id,
      tags: [], // Can be populated from note metadata
    };
  }

  return cards;
}

/**
 * MVP: Manual interval override
 */
export function setCardInterval(
  card: SRSCardState,
  intervalDays: number,
  now: number = Date.now()
): SRSCardState {
  return {
    ...card,
    interval: intervalDays,
    due: addDays(now, intervalDays),
    state: intervalDays > 0 ? "review" : card.state,
  };
}

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

/**
 * MVP: Get daily study statistics
 */
export function getDailyStats(
  session: StudySession,
  cardStates: Record<string, SRSCardState>,
  settings: SRSSettings = DEFAULT_SRS_SETTINGS
): {
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
