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
  RELEARNING_STEPS: [10], // 10 minutes before going back to review queue

  // Graduation settings
  GRADUATING_INTERVAL: 1, // Days after completing learning steps
  EASY_INTERVAL: 4, // Days when "Easy" is pressed on new card

  // Ease settings (SM-2 algorithm)
  STARTING_EASE: 2.5, // Starting ease factor for new cards
  MINIMUM_EASE: 1.3, // Minimum ease factor
  EASY_BONUS: 1.3, // Multiplier for "Easy" button

  // SM-2 interval modifiers (Anki-style)
  HARD_INTERVAL_FACTOR: 1.2, // Multiplier for "Hard" intervals
  EASY_INTERVAL_FACTOR: 1.3, // Multiplier for "Easy" intervals

  // Lapse settings
  LAPSE_RECOVERY_FACTOR: 0.2, // Recovery multiplier after relearning
  LAPSE_EASE_PENALTY: 0.2, // Ease penalty for lapses (Anki-style)
  INTERVAL_MODIFIER: 1.0, // Global interval modifier (Anki-style)
  LEECH_THRESHOLD: 8, // Number of lapses before marking as leech
  LEECH_ACTION: "suspend", // What to do with leeches
};

// Backwards compatibility
export const SRS_SETTINGS = DEFAULT_SRS_SETTINGS;

// Additional constants not in user settings
const MINIMUM_INTERVAL = 1;
const MAXIMUM_INTERVAL = 36500;

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
};

export type StudySession = {
  newCardsStudied: number;
  reviewsCompleted: number;
  learningCardsInQueue: string[]; // Cards currently in learning queue
};

// --- UTILITY FUNCTIONS ---
function addMinutes(timestamp: number, minutes: number): number {
  return timestamp + minutes * 60 * 1000;
}

function addDays(timestamp: number, days: number): number {
  return timestamp + days * 24 * 60 * 60 * 1000;
}

/**
 * Calculate new ease factor using SM-2 algorithm
 * Quality (q): 0=Again, 1=Hard, 2=Good, 3=Easy
 * Anki formula: EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
 * Adapted for 4-point scale (0-3) by mapping to 5-point scale (2-5)
 */
function calculateNewEase(
  currentEase: number,
  quality: SRSRating,
  settings: SRSSettings = DEFAULT_SRS_SETTINGS
): number {
  // Map our 4-point scale (0-3) to Anki's 5-point scale (2-5)
  const ankiQuality = quality + 2;

  // SM-2 formula
  const newEase =
    currentEase + (0.1 - (5 - ankiQuality) * (0.08 + (5 - ankiQuality) * 0.02));

  // Ensure minimum ease factor
  return Math.max(settings.MINIMUM_EASE, newEase);
}

// --- CORE SRS FUNCTIONS ---

/**
 * Initialize SRS state for new cards (with settings support)
 */
export function initSRSStateWithSettings(
  cardIds: string[],
  settings: SRSSettings = DEFAULT_SRS_SETTINGS
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
    };
  }

  return initial;
}

/**
 * Initialize SRS state for new cards (backwards compatibility)
 */
export function initSRSState(cardIds: string[]): Record<string, SRSCardState> {
  return initSRSStateWithSettings(cardIds, DEFAULT_SRS_SETTINGS);
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
 * Main scheduling function (backwards compatibility)
 */
export function scheduleSRSCard(
  card: SRSCardState,
  rating: SRSRating,
  now: number = Date.now()
): SRSCardState {
  return scheduleSRSCardInternal(card, rating, DEFAULT_SRS_SETTINGS, now);
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
    // Good - advance to step 2 of learning (Anki: advance one step)
    const nextStep = 1; // Move to second learning step
    if (nextStep >= settings.LEARNING_STEPS.length) {
      // If no more steps, graduate - scheduled for future, not immediately available
      console.log(
        `🎓 Card ${card.id} graduating from learning to review, scheduled for ${settings.GRADUATING_INTERVAL} days`
      );
      return {
        ...card,
        state: "review",
        repetitions: 0, // Don't count graduation as a review yet
        interval: settings.GRADUATING_INTERVAL,
        due: addDays(now, settings.GRADUATING_INTERVAL), // Scheduled for future
        learningStep: 0,
      };
    } else {
      const stepInterval = settings.LEARNING_STEPS[nextStep];
      return {
        ...card,
        state: "learning",
        learningStep: nextStep,
        due: addMinutes(now, stepInterval),
        interval: stepInterval,
      };
    }
  } else {
    // Easy - skip all learning steps and graduate immediately - scheduled for future
    console.log(
      `🚀 Card ${card.id} marked Easy, graduating directly to ${settings.EASY_INTERVAL} days`
    );
    return {
      ...card,
      state: "review",
      repetitions: 0, // Don't count graduation as a review yet
      interval: settings.EASY_INTERVAL,
      due: addDays(now, settings.EASY_INTERVAL), // Scheduled for future, not immediately available
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
      // Graduate to review queue - scheduled for future, not immediately available
      console.log(
        `🎓 Learning card ${card.id} graduating to review, scheduled for ${settings.GRADUATING_INTERVAL} days`
      );
      return {
        ...card,
        state: "review",
        repetitions: 0, // Don't count graduation as a review yet
        interval: settings.GRADUATING_INTERVAL,
        due: addDays(now, settings.GRADUATING_INTERVAL), // Scheduled for future
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
    // Easy - only skip to graduation if this is the first learning step
    if (card.learningStep === 0) {
      // First step: skip all learning steps and graduate immediately
      console.log(
        `🚀 Learning card ${card.id} marked Easy on first step, graduating to ${settings.EASY_INTERVAL} days`
      );
      return {
        ...card,
        state: "review",
        repetitions: 0, // Don't count graduation as a review yet
        interval: settings.EASY_INTERVAL,
        due: addDays(now, settings.EASY_INTERVAL), // Scheduled for future
        learningStep: 0,
      };
    } else {
      // After first step: treat "Easy" the same as "Good" (advance one step)
      console.log(
        `📚 Learning card ${card.id} marked Easy on step ${card.learningStep}, treating as Good`
      );
      const nextStep = card.learningStep + 1;

      if (nextStep >= settings.LEARNING_STEPS.length) {
        // Graduate to review queue
        return {
          ...card,
          state: "review",
          repetitions: 0, // Don't count graduation as a review yet
          interval: settings.GRADUATING_INTERVAL,
          due: addDays(now, settings.GRADUATING_INTERVAL), // Scheduled for future
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
    }
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

    return {
      ...card,
      state: "relearning",
      lapses: newLapses,
      ease: newEase,
      learningStep: 0,
      due: addMinutes(now, settings.RELEARNING_STEPS[0]),
      interval: settings.RELEARNING_STEPS[0],
      isLeech: newLapses >= settings.LEECH_THRESHOLD,
    };
  }

  // For Hard, Good, Easy - calculate new interval using SM-2
  const newEase = calculateNewEase(card.ease, rating);
  let intervalMultiplier = 1;

  if (rating === 1) {
    // Hard - reduce interval
    intervalMultiplier = settings.HARD_INTERVAL_FACTOR; // 0.8
  } else if (rating === 2) {
    // Good - normal progression
    intervalMultiplier = newEase; // Use ease factor as multiplier
  } else {
    // Easy - increase interval more
    intervalMultiplier = newEase * settings.EASY_INTERVAL_FACTOR; // ease * 1.3
  }

  // Calculate new interval
  let newInterval: number;

  // Special handling for graduated cards (first review after learning)
  if (card.repetitions === 1) {
    // First review after graduation - use predefined intervals based on rating
    console.log(
      `📚 First review of graduated card ${card.id}, rating: ${rating}`
    );
    if (rating === 1) {
      // Hard - shorter than graduating interval
      newInterval = Math.max(1, Math.round(card.interval * 0.8));
    } else if (rating === 2) {
      // Good - use graduating interval (typically 1 day)
      newInterval = card.interval;
    } else {
      // Easy - longer than graduating interval
      newInterval = Math.round(card.interval * 1.5);
    }
    console.log(`📅 Graduated card scheduled for ${newInterval} days from now`);
  } else {
    // Normal SM-2 calculation for established review cards
    newInterval = Math.round(
      card.interval * intervalMultiplier * settings.INTERVAL_MODIFIER
    );
  }

  newInterval = Math.max(MINIMUM_INTERVAL, newInterval);
  newInterval = Math.min(MAXIMUM_INTERVAL, newInterval);

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

  // 1. First priority: Learning/Relearning cards that are due
  const learningCards = allCards.filter(
    (card) =>
      (card.state === "learning" || card.state === "relearning") &&
      card.due <= now
    // Note: We study ALL due learning cards, regardless of queue status
  );

  if (learningCards.length > 0) {
    // Sort by due time (earliest first)
    learningCards.sort((a, b) => a.due - b.due);
    console.log(
      `📚 Found ${learningCards.length} learning cards due, selecting:`,
      learningCards[0].id
    );
    return learningCards[0].id;
  }

  // 2. Second priority: Review cards that are due (if under daily limit)
  // If MAX_REVIEWS_PER_DAY is 0 or less, allow unlimited reviews
  if (
    settings.MAX_REVIEWS_PER_DAY <= 0 ||
    session.reviewsCompleted < settings.MAX_REVIEWS_PER_DAY
  ) {
    const reviewCards = allCards.filter(
      (card) => card.state === "review" && card.due <= now
    );

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
      (card) => card.state === "new" && card.due <= now
    );

    if (newCards.length > 0) {
      // For new cards, we can randomize or use creation order
      console.log(
        `🆕 Found ${newCards.length} new cards, selecting:`,
        newCards[0].id
      );
      return newCards[0].id;
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
 * Get the next card to study, respecting daily limits and card priorities
 */
export function getNextCardToStudy(
  cardStates: Record<string, SRSCardState>,
  session: StudySession,
  now: number = Date.now()
): string | null {
  return getNextCardToStudyWithSettings(
    cardStates,
    session,
    DEFAULT_SRS_SETTINGS,
    now
  );
}

/**
 * Initialize a new study session
 */
export function initStudySession(): StudySession {
  return {
    newCardsStudied: 0,
    reviewsCompleted: 0,
    learningCardsInQueue: [],
  };
}

/**
 * Update study session after rating a card
 */
export function updateStudySession(
  session: StudySession,
  card: SRSCardState,
  rating: SRSRating,
  newCardState: SRSCardState
): StudySession {
  const updatedSession = { ...session };

  // Track new cards studied
  if (card.state === "new") {
    updatedSession.newCardsStudied++;
  }

  // Track reviews completed (review cards and graduating learning cards)
  if (
    card.state === "review" ||
    (card.state === "learning" && newCardState.state === "review") ||
    (card.state === "relearning" && newCardState.state === "review")
  ) {
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

  return updatedSession;
}

/**
 * Get study statistics
 */
export function getStudyStats(
  cardStates: Record<string, SRSCardState>,
  now: number = Date.now()
): {
  newCards: number;
  learningCards: number;
  reviewCards: number;
  dueCards: number;
  totalCards: number;
} {
  const allCards = Object.values(cardStates);

  const newCards = allCards.filter((card) => card.state === "new").length;
  const learningCards = allCards.filter(
    (card) => card.state === "learning" || card.state === "relearning"
  ).length;
  const reviewCards = allCards.filter((card) => card.state === "review").length;

  // Use session-aware logic for dueCards (respects daily limits)
  // Assume a fresh session (no cards studied yet)
  const session = {
    newCardsStudied: 0,
    reviewsCompleted: 0,
    learningCardsInQueue: [],
  };
  const stats = getSessionAwareStudyStats(cardStates, session, DEFAULT_SRS_SETTINGS, now);

  return {
    newCards,
    learningCards,
    reviewCards,
    dueCards: stats.dueCards,
    totalCards: allCards.length,
  };
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

  // New cards available for today (considering daily limit)
  const remainingNewCardSlots = Math.max(
    0,
    settings.NEW_CARDS_PER_DAY - session.newCardsStudied
  );
  const newCardsTotal = allCards.filter(
    (card) => card.state === "new" && card.due <= now
  ).length;
  const availableNewCards = Math.min(newCardsTotal, remainingNewCardSlots);

  // Learning cards that are due now
  const dueLearningCards = allCards.filter(
    (card) =>
      (card.state === "learning" || card.state === "relearning") &&
      card.due <= now
  ).length;

  // Review cards that are due now (considering daily limit)
  const remainingReviewSlots =
    settings.MAX_REVIEWS_PER_DAY <= 0
      ? Infinity
      : Math.max(0, settings.MAX_REVIEWS_PER_DAY - session.reviewsCompleted);
  const reviewCardsTotal = allCards.filter(
    (card) => card.state === "review" && card.due <= now
  ).length;
  const dueReviewCards =
    settings.MAX_REVIEWS_PER_DAY <= 0
      ? reviewCardsTotal
      : Math.min(reviewCardsTotal, remainingReviewSlots);

  const dueCards = availableNewCards + dueLearningCards + dueReviewCards;

  return {
    availableNewCards,
    dueLearningCards,
    dueReviewCards,
    dueCards,
    totalCards: allCards.length,
  };
}
