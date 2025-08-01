// Complete Anki-like SRS Scheduler
// Implements proper learning steps, daily limits, card queues, and graduation system

// --- SRS SETTINGS CONSTANTS (will be user-configurable later) ---
export const SRS_SETTINGS = {
  // Daily card limits
  NEW_CARDS_PER_DAY: 20, // Maximum new cards to introduce per day
  MAX_REVIEWS_PER_DAY: 200, // Maximum reviews per day (0 = unlimited)

  // Learning steps (in minutes) - cards cycle through these when clicked "Again" in learning
  LEARNING_STEPS: [1, 10], // 1 minute, then 10 minutes before graduating

  // Relearning steps (in minutes) - for cards that fail review (Again on mature cards)
  RELEARNING_STEPS: [10], // 10 minutes before going back to review queue

  // Graduation settings
  GRADUATING_INTERVAL: 1, // Days after completing learning steps
  EASY_INTERVAL: 4, // Days when "Easy" is pressed on new card

  // Interval limits
  MINIMUM_INTERVAL: 1, // Minimum interval in days
  MAXIMUM_INTERVAL: 36500, // Maximum interval in days (~100 years)

  // Ease settings
  STARTING_EASE: 2.5, // Starting ease factor for new cards
  MINIMUM_EASE: 1.3, // Minimum ease factor
  EASY_BONUS: 1.3, // Multiplier for "Easy" button

  // Ease adjustments
  AGAIN_EASE_PENALTY: -0.2, // Ease reduction for "Again"
  HARD_EASE_PENALTY: -0.15, // Ease reduction for "Hard"
  EASY_EASE_BONUS: 0.15, // Ease increase for "Easy"

  // Interval modifiers
  HARD_INTERVAL_FACTOR: 1.2, // Multiplier for "Hard" intervals
  INTERVAL_MODIFIER: 1.0, // Global interval modifier

  // Leech detection
  LEECH_THRESHOLD: 8, // Number of lapses before marking as leech
  LEECH_ACTION: "suspend" as "suspend" | "tag", // What to do with leeches
} as const;

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

function isToday(timestamp: number): boolean {
  const today = new Date();
  const date = new Date(timestamp);
  return today.toDateString() === date.toDateString();
}

// --- CORE SRS FUNCTIONS ---

/**
 * Initialize SRS state for new cards
 */
export function initSRSState(cardIds: string[]): Record<string, SRSCardState> {
  const now = Date.now();
  const initial: Record<string, SRSCardState> = {};

  for (const id of cardIds) {
    initial[id] = {
      id,
      state: "new",
      interval: 0,
      ease: SRS_SETTINGS.STARTING_EASE,
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
 * Main scheduling function - handles all card states and rating responses
 */
export function scheduleSRSCard(
  card: SRSCardState,
  rating: SRSRating,
  now: number = Date.now()
): SRSCardState {
  const updatedCard = { ...card, lastReviewed: now };

  switch (card.state) {
    case "new":
      return scheduleNewCard(updatedCard, rating, now);
    case "learning":
      return scheduleLearningCard(updatedCard, rating, now);
    case "review":
      return scheduleReviewCard(updatedCard, rating, now);
    case "relearning":
      return scheduleRelearningCard(updatedCard, rating, now);
    default:
      return updatedCard;
  }
}

/**
 * Handle new cards (first time seeing the card)
 */
function scheduleNewCard(
  card: SRSCardState,
  rating: SRSRating,
  now: number
): SRSCardState {
  if (rating === 0) {
    // Again - enter learning queue
    return {
      ...card,
      state: "learning",
      learningStep: 0,
      due: addMinutes(now, SRS_SETTINGS.LEARNING_STEPS[0]),
      interval: SRS_SETTINGS.LEARNING_STEPS[0],
    };
  } else if (rating === 1) {
    // Hard - enter learning queue
    return {
      ...card,
      state: "learning",
      learningStep: 0,
      due: addMinutes(now, SRS_SETTINGS.LEARNING_STEPS[0]),
      interval: SRS_SETTINGS.LEARNING_STEPS[0],
    };
  } else if (rating === 2) {
    // Good - enter learning queue
    return {
      ...card,
      state: "learning",
      learningStep: 0,
      due: addMinutes(now, SRS_SETTINGS.LEARNING_STEPS[0]),
      interval: SRS_SETTINGS.LEARNING_STEPS[0],
    };
  } else {
    // Easy - graduate immediately to review
    return {
      ...card,
      state: "review",
      repetitions: 1,
      interval: SRS_SETTINGS.EASY_INTERVAL,
      due: addDays(now, SRS_SETTINGS.EASY_INTERVAL),
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
  now: number
): SRSCardState {
  if (rating === 0) {
    // Again - restart learning
    return {
      ...card,
      learningStep: 0,
      due: addMinutes(now, SRS_SETTINGS.LEARNING_STEPS[0]),
      interval: SRS_SETTINGS.LEARNING_STEPS[0],
    };
  } else if (rating === 1) {
    // Hard - repeat current step
    const currentStep = Math.min(
      card.learningStep,
      SRS_SETTINGS.LEARNING_STEPS.length - 1
    );
    const stepInterval = SRS_SETTINGS.LEARNING_STEPS[currentStep];
    return {
      ...card,
      due: addMinutes(now, stepInterval),
      interval: stepInterval,
    };
  } else if (rating === 2) {
    // Good - advance to next step or graduate
    const nextStep = card.learningStep + 1;

    if (nextStep >= SRS_SETTINGS.LEARNING_STEPS.length) {
      // Graduate to review queue
      return {
        ...card,
        state: "review",
        repetitions: 1,
        interval: SRS_SETTINGS.GRADUATING_INTERVAL,
        due: addDays(now, SRS_SETTINGS.GRADUATING_INTERVAL),
        learningStep: 0,
      };
    } else {
      // Move to next learning step
      const stepInterval = SRS_SETTINGS.LEARNING_STEPS[nextStep];
      return {
        ...card,
        learningStep: nextStep,
        due: addMinutes(now, stepInterval),
        interval: stepInterval,
      };
    }
  } else {
    // Easy - graduate immediately
    return {
      ...card,
      state: "review",
      repetitions: 1,
      interval: SRS_SETTINGS.EASY_INTERVAL,
      due: addDays(now, SRS_SETTINGS.EASY_INTERVAL),
      learningStep: 0,
    };
  }
}

/**
 * Handle review cards (mature cards using SM-2 algorithm)
 */
function scheduleReviewCard(
  card: SRSCardState,
  rating: SRSRating,
  now: number
): SRSCardState {
  if (rating === 0) {
    // Again - send to relearning
    const newLapses = card.lapses + 1;
    const newEase = Math.max(
      SRS_SETTINGS.MINIMUM_EASE,
      card.ease + SRS_SETTINGS.AGAIN_EASE_PENALTY
    );

    return {
      ...card,
      state: "relearning",
      lapses: newLapses,
      ease: newEase,
      learningStep: 0,
      due: addMinutes(now, SRS_SETTINGS.RELEARNING_STEPS[0]),
      interval: SRS_SETTINGS.RELEARNING_STEPS[0],
      isLeech: newLapses >= SRS_SETTINGS.LEECH_THRESHOLD,
    };
  }

  // For Hard, Good, Easy - calculate new interval using SM-2
  let newEase = card.ease;
  let intervalMultiplier = 1;

  if (rating === 1) {
    // Hard
    newEase = Math.max(
      SRS_SETTINGS.MINIMUM_EASE,
      card.ease + SRS_SETTINGS.HARD_EASE_PENALTY
    );
    intervalMultiplier = SRS_SETTINGS.HARD_INTERVAL_FACTOR;
  } else if (rating === 2) {
    // Good
    // Ease stays the same
    intervalMultiplier = card.ease;
  } else {
    // Easy
    newEase = card.ease + SRS_SETTINGS.EASY_EASE_BONUS;
    intervalMultiplier = card.ease * SRS_SETTINGS.EASY_BONUS;
  }

  // Calculate new interval
  let newInterval = Math.round(
    card.interval * intervalMultiplier * SRS_SETTINGS.INTERVAL_MODIFIER
  );
  newInterval = Math.max(SRS_SETTINGS.MINIMUM_INTERVAL, newInterval);
  newInterval = Math.min(SRS_SETTINGS.MAXIMUM_INTERVAL, newInterval);

  return {
    ...card,
    repetitions: card.repetitions + 1,
    ease: newEase,
    interval: newInterval,
    due: addDays(now, newInterval),
  };
}

/**
 * Handle relearning cards (failed review cards going through relearning steps)
 */
function scheduleRelearningCard(
  card: SRSCardState,
  rating: SRSRating,
  now: number
): SRSCardState {
  if (rating === 0) {
    // Again - restart relearning
    return {
      ...card,
      learningStep: 0,
      due: addMinutes(now, SRS_SETTINGS.RELEARNING_STEPS[0]),
      interval: SRS_SETTINGS.RELEARNING_STEPS[0],
    };
  } else if (rating === 1) {
    // Hard - repeat current step
    const currentStep = Math.min(
      card.learningStep,
      SRS_SETTINGS.RELEARNING_STEPS.length - 1
    );
    const stepInterval = SRS_SETTINGS.RELEARNING_STEPS[currentStep];
    return {
      ...card,
      due: addMinutes(now, stepInterval),
      interval: stepInterval,
    };
  } else if (rating === 2) {
    // Good - advance to next step or graduate
    const nextStep = card.learningStep + 1;

    if (nextStep >= SRS_SETTINGS.RELEARNING_STEPS.length) {
      // Graduate back to review queue with reduced interval
      const newInterval = Math.max(1, Math.round(card.interval * 0.7)); // Reduce interval by 30%
      return {
        ...card,
        state: "review",
        interval: newInterval,
        due: addDays(now, newInterval),
        learningStep: 0,
      };
    } else {
      // Move to next relearning step
      const stepInterval = SRS_SETTINGS.RELEARNING_STEPS[nextStep];
      return {
        ...card,
        learningStep: nextStep,
        due: addMinutes(now, stepInterval),
        interval: stepInterval,
      };
    }
  } else {
    // Easy - graduate back to review with normal interval
    return {
      ...card,
      state: "review",
      due: addDays(now, card.interval),
      learningStep: 0,
    };
  }
}

/**
 * Get the next card to study, respecting daily limits and card priorities
 */
export function getNextCardToStudy(
  cardStates: Record<string, SRSCardState>,
  session: StudySession,
  now: number = Date.now()
): string | null {
  const allCards = Object.values(cardStates);

  // 1. First priority: Learning/Relearning cards that are due
  const learningCards = allCards.filter(
    (card) =>
      (card.state === "learning" || card.state === "relearning") &&
      card.due <= now &&
      !session.learningCardsInQueue.includes(card.id)
  );

  if (learningCards.length > 0) {
    // Sort by due time (earliest first)
    learningCards.sort((a, b) => a.due - b.due);
    return learningCards[0].id;
  }

  // 2. Second priority: Review cards that are due (if under daily limit)
  if (
    session.reviewsCompleted < SRS_SETTINGS.MAX_REVIEWS_PER_DAY ||
    SRS_SETTINGS.MAX_REVIEWS_PER_DAY === 0
  ) {
    const reviewCards = allCards.filter(
      (card) => card.state === "review" && card.due <= now
    );

    if (reviewCards.length > 0) {
      // Sort by due time (earliest first)
      reviewCards.sort((a, b) => a.due - b.due);
      return reviewCards[0].id;
    }
  }

  // 3. Third priority: New cards (if under daily limit)
  if (session.newCardsStudied < SRS_SETTINGS.NEW_CARDS_PER_DAY) {
    const newCards = allCards.filter(
      (card) => card.state === "new" && card.due <= now
    );

    if (newCards.length > 0) {
      // For new cards, we can randomize or use creation order
      return newCards[0].id;
    }
  }

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
  const dueCards = allCards.filter((card) => card.due <= now).length;

  return {
    newCards,
    learningCards,
    reviewCards,
    dueCards,
    totalCards: allCards.length,
  };
}
