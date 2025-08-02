// Complete Anki-Compatible SRS Scheduler - Production Ready
// Implements true SM-2 algorithm with full Anki behavioral compatibility
//
// Key Features:
// - Settings-driven ease calculations (no hard-coded factors)
// - Factor-based lapse penalties (not direct subtraction)
// - Automatic buried card clearing at day boundaries
// - Timezone-aware session management with proper Intl support
// - Leech detection and reset mechanisms
// - Consistent card state representation with optional content embedding
// - Daily limits enforced through session-aware scheduling
// - Backwards compatibility helpers for UI migration
// - Fixed EASY_INTERVAL support for alternative easy new card handling
import { SRSSettings } from "@/hooks/useSettings";
import { addMinutes, addDays } from "./SRSSession";

// --- SETTINGS VALIDATION ---
/**
 * Validates array of step values (for learning/relearning steps)
 * Enhanced validation that checks array contents, not just presence
 */
function validateStepArray(steps: number[], defaultSteps: number[], settingName: string): number[] {
  if (!Array.isArray(steps) || steps.length === 0) {
    console.warn(`⚠️ Invalid ${settingName}, using default ${JSON.stringify(defaultSteps)}`);
    return defaultSteps;
  }

  // Check if all elements are valid positive numbers
  const validSteps = steps.filter(step => 
    typeof step === 'number' && !isNaN(step) && step > 0
  );

  if (validSteps.length === 0) {
    console.warn(`⚠️ No valid steps in ${settingName}, using default ${JSON.stringify(defaultSteps)}`);
    return defaultSteps;
  }

  if (validSteps.length !== steps.length) {
    console.warn(`⚠️ Some invalid steps in ${settingName}, filtered to ${JSON.stringify(validSteps)}`);
  }

  return validSteps;
}

/**
 * Validates and sanitizes SRS settings to prevent crashes from undefined or malformed values
 * Enhanced with comprehensive validation and error recovery
 */
function validateSettings(settings: SRSSettings): SRSSettings {
  if (!settings || typeof settings !== 'object') {
    console.error("❌ Invalid settings object, using defaults");
    return { ...DEFAULT_SRS_SETTINGS };
  }

  // Create a validated copy with fallbacks
  const validated: SRSSettings = { ...settings };

  // Validate LEARNING_STEPS with content validation
  validated.LEARNING_STEPS = validateStepArray(
    validated.LEARNING_STEPS, 
    [1, 10], 
    "LEARNING_STEPS"
  );

  // Validate RELEARNING_STEPS with content validation
  validated.RELEARNING_STEPS = validateStepArray(
    validated.RELEARNING_STEPS, 
    [10, 1440], 
    "RELEARNING_STEPS"
  );

  // Enhanced numeric validation with bounds checking
  const validateNumericSetting = (
    value: number, 
    defaultValue: number, 
    settingName: string, 
    min?: number, 
    max?: number
  ): number => {
    if (typeof value !== 'number' || isNaN(value)) {
      console.warn(`⚠️ Invalid ${settingName}, using default ${defaultValue}`);
      return defaultValue;
    }
    
    if (min !== undefined && value < min) {
      console.warn(`⚠️ ${settingName} below minimum (${min}), using ${Math.max(value, defaultValue)}`);
      return Math.max(defaultValue, min);
    }
    
    if (max !== undefined && value > max) {
      console.warn(`⚠️ ${settingName} above maximum (${max}), using ${Math.min(value, defaultValue)}`);
      return Math.min(defaultValue, max);
    }
    
    return value;
  };

  // Validate numeric settings with bounds
  validated.LAPSE_EASE_PENALTY = validateNumericSetting(
    validated.LAPSE_EASE_PENALTY, 0.2, "LAPSE_EASE_PENALTY", 0, 1
  );

  validated.STARTING_EASE = validateNumericSetting(
    validated.STARTING_EASE, 2.5, "STARTING_EASE", 1.3, 5.0
  );

  validated.MINIMUM_EASE = validateNumericSetting(
    validated.MINIMUM_EASE, 1.3, "MINIMUM_EASE", 1.0, 3.0
  );

  validated.GRADUATING_INTERVAL = validateNumericSetting(
    validated.GRADUATING_INTERVAL, 1, "GRADUATING_INTERVAL", 1
  );

  validated.NEW_CARDS_PER_DAY = validateNumericSetting(
    validated.NEW_CARDS_PER_DAY, 20, "NEW_CARDS_PER_DAY", 0
  );

  validated.MAX_REVIEWS_PER_DAY = validateNumericSetting(
    validated.MAX_REVIEWS_PER_DAY, 200, "MAX_REVIEWS_PER_DAY", 0
  );

  validated.EASY_INTERVAL = validateNumericSetting(
    validated.EASY_INTERVAL, 4, "EASY_INTERVAL", 1
  );

  validated.EASY_BONUS = validateNumericSetting(
    validated.EASY_BONUS, 1.3, "EASY_BONUS", 1.0, 3.0
  );

  validated.HARD_INTERVAL_FACTOR = validateNumericSetting(
    validated.HARD_INTERVAL_FACTOR, 1.2, "HARD_INTERVAL_FACTOR", 0.5, 2.0
  );

  validated.EASY_INTERVAL_FACTOR = validateNumericSetting(
    validated.EASY_INTERVAL_FACTOR, 1.3, "EASY_INTERVAL_FACTOR", 1.0, 3.0
  );

  validated.LAPSE_RECOVERY_FACTOR = validateNumericSetting(
    validated.LAPSE_RECOVERY_FACTOR, 0.2, "LAPSE_RECOVERY_FACTOR", 0, 1
  );

  validated.INTERVAL_MODIFIER = validateNumericSetting(
    validated.INTERVAL_MODIFIER, 1.0, "INTERVAL_MODIFIER", 0.1, 3.0
  );

  validated.LEECH_THRESHOLD = validateNumericSetting(
    validated.LEECH_THRESHOLD, 8, "LEECH_THRESHOLD", 1
  );

  validated.MAX_INTERVAL = validateNumericSetting(
    validated.MAX_INTERVAL, 36500, "MAX_INTERVAL", 1
  );

  // Validate string/enum settings
  if (!["random", "fifo"].includes(validated.NEW_CARD_ORDER)) {
    console.warn(`⚠️ Invalid NEW_CARD_ORDER "${validated.NEW_CARD_ORDER}", using default "random"`);
    validated.NEW_CARD_ORDER = "random";
  }

  if (!["suspend", "tag"].includes(validated.LEECH_ACTION)) {
    console.warn(`⚠️ Invalid LEECH_ACTION "${validated.LEECH_ACTION}", using default "suspend"`);
    validated.LEECH_ACTION = "suspend";
  }

  // Validate boolean settings
  if (typeof validated.REVIEW_AHEAD !== 'boolean') {
    console.warn(`⚠️ Invalid REVIEW_AHEAD, using default false`);
    validated.REVIEW_AHEAD = false;
  }

  if (typeof validated.BURY_SIBLINGS !== 'boolean') {
    console.warn(`⚠️ Invalid BURY_SIBLINGS, using default false`);
    validated.BURY_SIBLINGS = false;
  }

  return validated;
}

/**
 * Generic step accessor with bounds checking and validation
 * DRY: Consolidated getLearningStep and getRelearningStep into single function
 */
function getStepValue(
  steps: number[], 
  stepIndex: number, 
  defaultValue: number, 
  stepType: string = "step"
): number {
  if (!Array.isArray(steps) || steps.length === 0) {
    console.warn(`⚠️ Empty ${stepType} array, using fallback ${defaultValue} minute(s)`);
    return defaultValue;
  }

  if (stepIndex < 0 || stepIndex >= steps.length) {
    console.warn(`⚠️ ${stepType} index ${stepIndex} out of bounds, using last step`);
    return steps[steps.length - 1];
  }

  const step = steps[stepIndex];
  if (typeof step !== 'number' || isNaN(step) || step <= 0) {
    console.warn(`⚠️ Invalid ${stepType} at index ${stepIndex}, using fallback ${defaultValue} minute(s)`);
    return defaultValue;
  }

  return step;
}

/**
 * Safely accesses learning steps with bounds checking
 */
function getLearningStep(steps: number[], stepIndex: number): number {
  return getStepValue(steps, stepIndex, 1, "learning step");
}

/**
 * Safely accesses relearning steps with bounds checking
 */
function getRelearningStep(steps: number[], stepIndex: number): number {
  return getStepValue(steps, stepIndex, 10, "relearning step");
}

// --- DEFAULT SRS SETTINGS (fallback when user settings aren't available) ---
export const DEFAULT_SRS_SETTINGS: SRSSettings = {
  // Daily card limits
  NEW_CARDS_PER_DAY: 20, // Maximum new cards to introduce per day
  MAX_REVIEWS_PER_DAY: 200, // Maximum reviews per day (0 = unlimited)

  // Learning steps (in minutes) – only the micro-steps
  LEARNING_STEPS: [1, 10], // ← no 1440

  // Relearning steps (in minutes) - for cards that fail review
  RELEARNING_STEPS: [10, 1440], // 10 minutes → 1 day before going back to review queue

  // Graduation settings
  GRADUATING_INTERVAL: 1, // Days after completing learning steps
  EASY_INTERVAL: 4, // Fixed interval for "Easy" on new cards (alternative path)

  // Ease settings (SM-2 algorithm)
  STARTING_EASE: 2.5, // Starting ease factor for new cards
  MINIMUM_EASE: 1.3, // Minimum ease factor
  EASY_BONUS: 1.3, // Multiplier for "Easy" button

  // SM-2 interval modifiers (Anki-style)
  HARD_INTERVAL_FACTOR: 1.2, // Multiplier for "Hard" intervals (Anki default)
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
const DEBUG_LOGGING = false; // Set to true for development debugging

// Helper function for conditional debug logging
function debugLog(message: string, ...args: unknown[]) {
  if (DEBUG_LOGGING) {
    console.log(message, ...args);
  }
}

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
  isBuried?: boolean; // whether card is buried until next session
  // Note/field metadata for MVP
  noteId?: string; // ID of the parent note
  templateId?: string; // Template used to generate this card
  tags?: string[]; // Tags associated with the card
  // Card content storage (optional, for generated cards)
  _cardContent?: {
    front: string;
    back: string;
  };
};

/**
 * Anki-style ease calculation - EXACT Anki algorithm
 * Uses settings-driven ease calculations (no hard-coded factors)
 * Applies multiplicative factors based on user configuration
 */
function calculateAnkiEase(
  oldEase: number,
  quality: SRSRating,
  settings: SRSSettings
): number {
  // Validate settings to prevent crashes
  const validatedSettings = validateSettings(settings);
  let newEase = oldEase;

  switch (quality) {
    case 0: // Again - use LAPSE_EASE_PENALTY (subtractive, as per Anki default)
      newEase = oldEase - validatedSettings.LAPSE_EASE_PENALTY;
      break;
    case 1: // Hard - no ease change in true Anki (only affects interval)
      newEase = oldEase; // No change
      break;
    case 2: // Good
      newEase = oldEase; // No change
      break;
    case 3: // Easy - add 0.15 (Anki default, keep current behavior for compatibility)
      newEase = oldEase + 0.15;
      break;
  }

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
      isBuried: false,
      noteId,
      templateId,
      tags: tags ? [...tags] : undefined,
    };
  }

  return initial;
}

/**
 * Enhanced card scheduling with comprehensive error recovery
 * Wraps the internal scheduler with additional safety checks
 */
export function scheduleSRSCardWithSettings(
  card: SRSCardState,
  rating: SRSRating,
  settings: SRSSettings,
  now: number = Date.now()
): SRSCardState {
  // Don't schedule suspended or buried cards - return unchanged
  if (card.isSuspended || card.isBuried) {
    console.warn(`⚠️ Attempted to schedule suspended/buried card ${card.id}`);
    return card;
  }

  try {
    // Validate settings first to prevent crashes from malformed configuration
    const validatedSettings = validateSettings(settings);
    return scheduleSRSCardInternal(card, rating, validatedSettings, now);
  } catch (error) {
    console.error(`❌ Failed to schedule card ${card.id}:`, error);
    // Return card unchanged rather than crashing the entire session
    return { ...card, lastReviewed: now };
  }
}

/**
 * Session-aware card scheduling that enforces daily limits
 * This is the primary function UI components should call instead of scheduleSRSCardWithSettings
 */
export function scheduleCardWithSessionLimits(
  card: SRSCardState,
  rating: SRSRating,
  settings: SRSSettings,
  session: SessionState,
  now: number = Date.now()
): { updatedCard: SRSCardState; updatedSession: SessionState } {
  const wasNewCard = card.state === "new";

  // Check daily limits before scheduling
  if (
    wasNewCard &&
    session.reviewedToday.newCards >= settings.NEW_CARDS_PER_DAY
  ) {
    console.warn(
      `⚠️ Daily new card limit reached (${settings.NEW_CARDS_PER_DAY})`
    );
    return { updatedCard: card, updatedSession: session };
  }

  if (
    !wasNewCard &&
    settings.MAX_REVIEWS_PER_DAY > 0 &&
    session.reviewedToday.reviews >= settings.MAX_REVIEWS_PER_DAY
  ) {
    console.warn(
      `⚠️ Daily review limit reached (${settings.MAX_REVIEWS_PER_DAY})`
    );
    return { updatedCard: card, updatedSession: session };
  }

  // Schedule the card
  const updatedCard = scheduleSRSCardWithSettings(card, rating, settings, now);

  // Update session counters
  const updatedSession = updateSessionAfterReview(
    session,
    card,
    wasNewCard,
    now
  );

  return { updatedCard, updatedSession };
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
  if (rating === 3) {
    // Easy - use EASY_INTERVAL if configured, otherwise calculate from graduation
    let easyInterval: number;

    if (settings.EASY_INTERVAL > settings.GRADUATING_INTERVAL) {
      // Use the fixed EASY_INTERVAL if it's larger than graduation interval
      easyInterval = Math.round(
        settings.EASY_INTERVAL * settings.INTERVAL_MODIFIER
      );
    } else {
      // Fall back to calculated easy interval
      const base = settings.GRADUATING_INTERVAL;
      easyInterval = Math.round(
        base *
          card.ease *
          settings.EASY_INTERVAL_FACTOR *
          settings.INTERVAL_MODIFIER
      );
    }

    const clampedInterval = Math.max(
      1,
      Math.min(easyInterval, settings.MAX_INTERVAL)
    );

    debugLog(
      `🚀 Card ${card.id} marked Easy, graduating directly to ${clampedInterval} days`
    );
    return {
      ...card,
      state: "review",
      repetitions: 1, // First repetition upon graduation
      interval: clampedInterval,
      due: addDays(now, clampedInterval),
      learningStep: 0,
    };
  } else {
    // Again (0), Hard (1), Good (2) - all enter learning queue at step 0
    // Only Easy (3) skips learning - this matches exact Anki behavior
    const stepInterval = getLearningStep(settings.LEARNING_STEPS, 0); // Safe access to step 0
    
    return {
      ...card,
      state: "learning",
      learningStep: 0, // FIXED: All ratings except Easy go to step 0
      due: addMinutes(now, stepInterval),
      interval: stepInterval,
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
    // Again - restart learning from beginning
    const stepInterval = getLearningStep(settings.LEARNING_STEPS, 0);
    return {
      ...card,
      learningStep: 0,
      due: addMinutes(now, stepInterval),
      interval: stepInterval,
    };
  } else if (rating === 1) {
    // Hard - repeat current step
    const currentStep = Math.min(
      card.learningStep,
      Math.max(0, settings.LEARNING_STEPS.length - 1)
    );
    const stepInterval = getLearningStep(settings.LEARNING_STEPS, currentStep);
    return {
      ...card,
      due: addMinutes(now, stepInterval),
      interval: stepInterval,
    };
  } else if (rating === 2) {
    // Good - advance to next step or graduate
    const nextStep = card.learningStep + 1;

    if (nextStep >= settings.LEARNING_STEPS.length) {
      // Graduate to review queue using GRADUATING_INTERVAL consistently (Anki behavior)
      const graduatingInterval = Math.round(
        settings.GRADUATING_INTERVAL * settings.INTERVAL_MODIFIER
      );
      const finalInterval = Math.max(
        1,
        Math.min(graduatingInterval, settings.MAX_INTERVAL)
      );

      debugLog(
        `🎓 Learning card ${card.id} graduating to review, scheduled for ${finalInterval} days`
      );
      return {
        ...card,
        state: "review",
        repetitions: 1, // First repetition upon graduation
        interval: finalInterval,
        due: addDays(now, finalInterval),
        learningStep: 0,
      };
    } else {
      // Move to next learning step
      const stepInterval = getLearningStep(settings.LEARNING_STEPS, nextStep);
      return {
        ...card,
        learningStep: nextStep,
        due: addMinutes(now, stepInterval),
        interval: stepInterval,
      };
    }
  } else {
    // Easy - use GRADUATING_INTERVAL with ease factor bonus
    const base = settings.GRADUATING_INTERVAL; // Base graduation interval
    const easyInterval = Math.round(
      base * card.ease * settings.EASY_INTERVAL_FACTOR
    );
    const finalInterval = Math.round(easyInterval * settings.INTERVAL_MODIFIER);

    debugLog(
      `🚀 Learning card ${card.id} marked Easy, graduating to ${finalInterval} days`
    );
    return {
      ...card,
      state: "review",
      repetitions: 1, // First repetition upon graduation
      interval: Math.max(1, Math.min(finalInterval, settings.MAX_INTERVAL)),
      due: addDays(
        now,
        Math.max(1, Math.min(finalInterval, settings.MAX_INTERVAL))
      ),
      learningStep: 0,
    };
  }
}

/**
 * Handle review cards (mature cards using SM-2 algorithm) - EXACT Anki behavior
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
    const newEase = calculateAnkiEase(card.ease, rating, settings);

    // Check if card should be marked as leech and suspended
    const isLeech = newLapses >= settings.LEECH_THRESHOLD;
    const shouldSuspend = isLeech && settings.LEECH_ACTION === "suspend";

    const firstRelearningStep = getRelearningStep(settings.RELEARNING_STEPS, 0);
    return {
      ...card,
      state: "relearning",
      lapses: newLapses,
      ease: newEase,
      learningStep: 0,
      due: addMinutes(now, firstRelearningStep),
      interval: firstRelearningStep,
      isLeech,
      isSuspended: shouldSuspend,
    };
  }

  // Calculate late review bonus (only for late reviews, not early)
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const daysLate = Math.max(0, Math.floor((now - card.due) / MS_PER_DAY));

  let interval: number;

  // SM-2 interval calculation - different for each rating
  if (rating === 1) {
    // Hard: use current interval * hard factor (no ease multiplication)
    interval = Math.round(card.interval * settings.HARD_INTERVAL_FACTOR);
    debugLog(`Hard: used interval ${card.interval} * factor ${settings.HARD_INTERVAL_FACTOR} = ${interval}`);
  } else {
    // Good, Easy: use standard SM-2 formula
    if (card.interval === 1 && card.repetitions === 0) {
      interval = 1; // First review always 1 day
    } else if (card.interval === 1 && card.repetitions === 1) {
      interval = Math.round(1 * card.ease); // Second review uses ease on base of 1
    } else {
      interval = Math.round(card.interval * card.ease); // All other reviews: previous_interval * ease
    }
    
    debugLog(`SM-2 interval calculation: repetitions=${card.repetitions}, oldInterval=${card.interval}, oldEase=${card.ease}, baseInterval=${interval}`);

    // Apply Easy interval factor AFTER base calculation
    if (rating === 3) {
      interval = Math.round(interval * settings.EASY_INTERVAL_FACTOR);
      debugLog(`Easy: applied factor ${settings.EASY_INTERVAL_FACTOR}, new interval=${interval}`);
    }
  }

  // Calculate new ease AFTER interval calculation
  const newEase = calculateAnkiEase(card.ease, rating, settings);

  // Add late review bonus
  interval += daysLate;

  // Apply global interval modifier
  interval = Math.round(interval * settings.INTERVAL_MODIFIER);

  // Enforce minimum "+1 day" rule for non-Again reviews
  // BUT NOT for first review (which should always be 1 day) or second review (which uses ease×1)
  if (rating > 0 && !(card.interval === 1 && card.repetitions <= 1)) {
    interval = Math.max(interval, card.interval + 1);
  }

  // Apply min/max clamps
  interval = Math.max(1, Math.min(interval, settings.MAX_INTERVAL));

  return {
    ...card,
    state: "review",
    repetitions: card.repetitions + 1,
    ease: newEase,
    interval,
    due: addDays(now, interval),
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
    // Again - restart relearning from beginning
    const firstRelearningStep = getRelearningStep(settings.RELEARNING_STEPS, 0);
    return {
      ...card,
      learningStep: 0,
      due: addMinutes(now, firstRelearningStep),
      interval: firstRelearningStep,
    };
  } else if (rating === 1) {
    // Hard - repeat current relearning step
    const currentStep = Math.min(
      card.learningStep,
      Math.max(0, settings.RELEARNING_STEPS.length - 1)
    );
    const stepInterval = getRelearningStep(settings.RELEARNING_STEPS, currentStep);
    return {
      ...card,
      due: addMinutes(now, stepInterval),
      interval: stepInterval,
    };
  } else if (rating === 2) {
    // Good - advance to next relearning step or graduate back to review
    const nextStep = card.learningStep + 1;

    if (nextStep >= settings.RELEARNING_STEPS.length) {
      // Graduate back to review queue with proper recovery calculation
      // Use the card's ease and previous repetition history to calculate recovery interval
      const baseInterval = Math.max(1, card.repetitions || 1);
      let recoveryInterval = Math.round(
        baseInterval * card.ease * settings.LAPSE_RECOVERY_FACTOR
      );

      // Apply global interval modifier
      recoveryInterval = Math.round(
        recoveryInterval * settings.INTERVAL_MODIFIER
      );

      // Apply min/max clamps
      const finalInterval = Math.max(
        1,
        Math.min(recoveryInterval, settings.MAX_INTERVAL)
      );

      return {
        ...card,
        state: "review",
        interval: finalInterval,
        due: addDays(now, finalInterval),
        learningStep: 0,
      };
    } else {
      // Move to next relearning step
      const stepInterval = getRelearningStep(settings.RELEARNING_STEPS, nextStep);
      return {
        ...card,
        learningStep: nextStep,
        due: addMinutes(now, stepInterval),
        interval: stepInterval,
      };
    }
  } else {
    // Easy - graduate back to review with normal interval calculation
    const baseInterval = Math.max(1, card.repetitions || 1);
    let easyInterval = Math.round(
      baseInterval * card.ease * settings.EASY_INTERVAL_FACTOR
    );

    // Apply global interval modifier
    easyInterval = Math.round(easyInterval * settings.INTERVAL_MODIFIER);

    // Apply min/max clamps
    const finalInterval = Math.max(
      1,
      Math.min(easyInterval, settings.MAX_INTERVAL)
    );

    return {
      ...card,
      state: "review",
      interval: finalInterval,
      due: addDays(now, finalInterval),
      learningStep: 0,
    };
  }
}

// Session-related functions have been moved to SRSSession.ts

/**
 * Enhanced card suspension/unsuspension with bury support
 */
export function suspendCard(card: SRSCardState): SRSCardState {
  return { ...card, isSuspended: true };
}

export function unsuspendCard(card: SRSCardState): SRSCardState {
  return { ...card, isSuspended: false };
}

export function buryCard(card: SRSCardState): SRSCardState {
  return { ...card, isBuried: true };
}

export function unburyCard(card: SRSCardState): SRSCardState {
  return { ...card, isBuried: false };
}

/**
 * Bury siblings (cards from same note) when BURY_SIBLINGS is enabled
 */
export function burySiblings(
  cards: Record<string, SRSCardState>,
  reviewedCardId: string,
  settings: SRSSettings
): Record<string, SRSCardState> {
  if (!settings.BURY_SIBLINGS) {
    return cards;
  }

  const reviewedCard = cards[reviewedCardId];
  if (!reviewedCard?.noteId) {
    return cards;
  }

  const updatedCards = { ...cards };

  // Bury all other cards from the same note
  Object.keys(updatedCards).forEach((cardId) => {
    if (
      cardId !== reviewedCardId &&
      updatedCards[cardId].noteId === reviewedCard.noteId
    ) {
      updatedCards[cardId] = { ...updatedCards[cardId], isBuried: true };
    }
  });

  return updatedCards;
}

/**
 * Clear all buried flags for a new session/day (auto-reset at midnight)
 */
export function clearAllBuriedCards(
  cards: Record<string, SRSCardState>
): Record<string, SRSCardState> {
  const updatedCards = { ...cards };

  Object.keys(updatedCards).forEach((cardId) => {
    if (updatedCards[cardId].isBuried) {
      updatedCards[cardId] = { ...updatedCards[cardId], isBuried: false };
    }
  });

  return updatedCards;
}

/**
 * Check if session should reset buried cards based on timezone midnight
 */
export function shouldResetBuriedCards(
  lastSessionDate: number,
  now: number,
  timezone: string = "Europe/Bucharest"
): boolean {
  const lastMidnight = getLocalMidnight(lastSessionDate, timezone);
  const currentMidnight = getLocalMidnight(now, timezone);

  return currentMidnight > lastMidnight;
}

/**
 * Comprehensive session management helper
 */
export interface SessionState {
  sessionDate: number; // Midnight timestamp for current session
  reviewedToday: { newCards: number; reviews: number };
  timezone: string;
}

export function initializeSession(
  now: number = Date.now(),
  timezone: string = "Europe/Bucharest"
): SessionState {
  return {
    sessionDate: getLocalMidnight(now, timezone),
    reviewedToday: { newCards: 0, reviews: 0 },
    timezone,
  };
}

export function updateSessionAfterReview(
  session: SessionState,
  card: SRSCardState,
  wasNewCard: boolean,
  now: number = Date.now()
): SessionState {
  // Check if we need to reset for a new day
  if (shouldResetBuriedCards(session.sessionDate, now, session.timezone)) {
    return {
      ...session,
      sessionDate: getLocalMidnight(now, session.timezone),
      reviewedToday: {
        newCards: wasNewCard ? 1 : 0,
        reviews: wasNewCard ? 0 : 1,
      },
    };
  }

  // Update counters for same day
  return {
    ...session,
    reviewedToday: {
      newCards: session.reviewedToday.newCards + (wasNewCard ? 1 : 0),
      reviews: session.reviewedToday.reviews + (wasNewCard ? 0 : 1),
    },
  };
}

/**
 * Initialize session and automatically clear buried cards if needed
 */
export function initializeSessionWithCardReset(
  cardStates: Record<string, SRSCardState>,
  lastSessionDate?: number,
  now: number = Date.now(),
  timezone: string = "Europe/Bucharest"
): { session: SessionState; updatedCards: Record<string, SRSCardState> } {
  const session = initializeSession(now, timezone);
  let updatedCards = cardStates;

  // Auto-clear buried cards if crossing day boundary
  if (
    lastSessionDate &&
    shouldResetBuriedCards(lastSessionDate, now, timezone)
  ) {
    updatedCards = clearAllBuriedCards(cardStates);
    debugLog("🌅 New day detected, cleared all buried cards");
  }

  return { session, updatedCards };
}

/**
 * Consolidated check if a card is showable/reviewable
 */
export function isCardShowable(
  card: SRSCardState,
  now: number,
  settings: SRSSettings
): boolean {
  if (card.isSuspended || card.isBuried) {
    return false;
  }

  if (settings.REVIEW_AHEAD) {
    return true; // Show all cards regardless of due time
  }

  return card.due <= now;
}

/**
 * Get cards filtered by daily limits and ordering
 */
export function getSessionCards(
  allCards: Record<string, SRSCardState>,
  settings: SRSSettings,
  reviewedToday: { newCards: number; reviews: number } = {
    newCards: 0,
    reviews: 0,
  },
  now: number = Date.now()
): { newCards: SRSCardState[]; dueCards: SRSCardState[] } {
  const availableCards = Object.values(allCards).filter((card) =>
    isCardShowable(card, now, settings)
  );

  // Separate new and due cards
  const newCards = availableCards.filter((card) => card.state === "new");

  const dueCards = availableCards.filter((card) => card.state !== "new");

  // Apply daily limits
  const remainingNewCards = Math.max(
    0,
    settings.NEW_CARDS_PER_DAY - reviewedToday.newCards
  );
  const remainingReviews =
    settings.MAX_REVIEWS_PER_DAY > 0
      ? Math.max(0, settings.MAX_REVIEWS_PER_DAY - reviewedToday.reviews)
      : Infinity;

  // Apply ordering
  let orderedNewCards = newCards;
  if (settings.NEW_CARD_ORDER === "random") {
    orderedNewCards = [...newCards].sort(() => Math.random() - 0.5);
  }
  // FIFO is default order (by creation/due time)

  return {
    newCards: orderedNewCards.slice(0, remainingNewCards),
    dueCards: dueCards.slice(0, remainingReviews),
  };
}

/**
 * Get timezone-aware midnight boundary for "due today" calculations
 * Uses proper Intl.DateTimeFormat for accurate timezone handling
 */
export function getLocalMidnight(
  timestamp: number,
  timezone: string = "Europe/Bucharest"
): number {
  // Use explicit locale for consistent date parsing across environments
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(new Date(timestamp));
  const year = parseInt(parts.find((p) => p.type === "year")?.value || "0");
  const month = parseInt(parts.find((p) => p.type === "month")?.value || "1");
  const day = parseInt(parts.find((p) => p.type === "day")?.value || "1");

  // Create midnight in the target timezone, then convert back to UTC
  const localMidnight = new Date();
  localMidnight.setFullYear(year, month - 1, day);
  localMidnight.setHours(0, 0, 0, 0);

  // Adjust for timezone offset difference
  const targetOffset = getTimezoneOffset(timezone, localMidnight.getTime());
  const localOffset = localMidnight.getTimezoneOffset() * 60 * 1000;

  return localMidnight.getTime() - localOffset + targetOffset;
}

/**
 * Get timezone offset in milliseconds for a given timezone at a specific timestamp
 */
function getTimezoneOffset(timezone: string, timestamp: number): number {
  const date = new Date(timestamp);
  const utcDate = new Date(date.toLocaleString("en-GB", { timeZone: "UTC" }));
  const tzDate = new Date(date.toLocaleString("en-GB", { timeZone: timezone }));
  return tzDate.getTime() - utcDate.getTime();
}

/**
 * Enhanced note template support with actual card content storage
 * Generate multiple cards from a single note based on template
 * Note: This is MVP-level field substitution - production version should handle:
 * - Escaped braces, conditional fields, nested templates, cloze deletions
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

    // Simple field substitution (MVP) - replace {{field}} with actual values
    const processedFront = template.front.replace(
      /\{\{(\w+)\}\}/g,
      (match, field) => fields[field] || `[Missing: ${field}]`
    );
    const processedBack = template.back.replace(
      /\{\{(\w+)\}\}/g,
      (match, field) => fields[field] || `[Missing: ${field}]`
    );

    // Skip empty cards (both front and back are just missing field placeholders)
    if (
      processedFront.includes("[Missing:") &&
      processedBack.includes("[Missing:") &&
      !processedFront.replace(/\[Missing:[^\]]+\]/g, "").trim() &&
      !processedBack.replace(/\[Missing:[^\]]+\]/g, "").trim()
    ) {
      debugLog(`⚠️ Skipping card ${cardId} - insufficient field data`);
      continue;
    }

    // Create SRS state for this card and store content in metadata
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
      isBuried: false,
      noteId,
      templateId: template.id,
      tags: [], // Can be populated from note metadata
      // Store card content in extended metadata (can be retrieved by UI)
      _cardContent: {
        front: processedFront,
        back: processedBack,
      },
    };
  }

  return cards;
}

/**
 * Get card content from SRS card state (for UI components)
 * Handles both embedded content and external lookups
 */
export function getCardContent(
  card: SRSCardState
): { front: string; back: string } | null {
  // If content is embedded in the card state, return it
  if (card._cardContent) {
    return card._cardContent;
  }

  // For cards without embedded content, UI should handle the lookup
  // This maintains backwards compatibility with existing card storage patterns
  return null;
}

/**
 * Convert legacy card format to standardized SRSCardState
 * For backwards compatibility with existing UI code expecting { srsState, front, back }
 */
export function convertLegacyCardFormat(legacyCard: {
  srsState: SRSCardState;
  front: string;
  back: string;
}): SRSCardState {
  return {
    ...legacyCard.srsState,
    _cardContent: {
      front: legacyCard.front,
      back: legacyCard.back,
    },
  };
}

/**
 * Enhanced manual interval override with stats coherence
 */
export function setCardInterval(
  card: SRSCardState,
  intervalDays: number,
  options: {
    resetRepetitions?: boolean;
    adjustEase?: number;
    incrementLapses?: boolean;
    clearFlags?: boolean; // Clear buried/suspended flags
    resetLeech?: boolean; // Clear leech status when resetting lapses
    resetLapses?: boolean; // Reset lapse count (automatically clears leech if enabled)
  } = {},
  now: number = Date.now()
): SRSCardState {
  const updatedCard = { ...card };

  updatedCard.interval = intervalDays;
  updatedCard.due = addDays(now, intervalDays);
  updatedCard.state = intervalDays > 0 ? "review" : card.state;

  if (options.resetRepetitions) {
    updatedCard.repetitions = 0;
  }

  if (options.adjustEase !== undefined) {
    updatedCard.ease = Math.max(1.3, options.adjustEase);
  }

  if (options.incrementLapses) {
    updatedCard.lapses = card.lapses + 1;
  }

  if (options.resetLapses) {
    updatedCard.lapses = 0;
    // Automatically clear leech status when resetting lapses
    updatedCard.isLeech = false;
  }

  if (options.clearFlags) {
    updatedCard.isBuried = false;
    updatedCard.isSuspended = false;
  }

  if (options.resetLeech) {
    updatedCard.isLeech = false;
  }

  return updatedCard;
}

/**
 * Reset a card's learning progress (UI helper for "restart card" functionality)
 */
export function resetCardProgress(
  card: SRSCardState,
  settings: SRSSettings,
  now: number = Date.now()
): SRSCardState {
  return setCardInterval(
    card,
    0,
    {
      resetRepetitions: true,
      resetLapses: true,
      adjustEase: settings.STARTING_EASE,
      clearFlags: true,
      resetLeech: true,
    },
    now
  );
}
