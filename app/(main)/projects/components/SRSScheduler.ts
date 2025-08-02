// Complete Anki-like SRS Scheduler - Core Scheduling Logic
// Implements proper learning steps, SM-2 algorithm, and card state transitions
//
// Key Features:
// - True SM-2 ease factor calculation with proper formula
// - Anki-compatible learning/relearning steps
// - Proper state transitions: new → learning → review → relearning
// - Suspension safeguards and leech detection
// - Configurable settings with sensible defaults
//
// Units Clarification:
// - interval: minutes for learning/relearning cards, days for review cards
// - due: always timestamp in milliseconds
// - This mixed-unit approach matches Anki's internal behavior
import { SRSSettings } from "@/hooks/useSettings";
import { addMinutes, addDays } from "./SRSSession";

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
const MINIMUM_INTERVAL = 1;
const DEBUG_LOGGING = false; // Set to true for development debugging

// Helper function for conditional debug logging
function debugLog(message: string, ...args: any[]) {
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
  // Note/field metadata for MVP
  noteId?: string; // ID of the parent note
  templateId?: string; // Template used to generate this card
  tags?: string[]; // Tags associated with the card
};

/**
 * Calculate new ease factor using Anki's simplified algorithm
 * Anki uses addition/subtraction instead of the original SM-2 formula
 * Rating effects: Again: -0.20, Hard: -0.15, Good: no change, Easy: +0.15
 */
function calculateNewEase(
  currentEase: number,
  quality: SRSRating,
  settings: SRSSettings = DEFAULT_SRS_SETTINGS
): number {
  let newEase = currentEase;

  // Anki's simplified ease factor adjustments
  switch (quality) {
    case 0: // Again
      newEase = currentEase - 0.20;
      break;
    case 1: // Hard  
      newEase = currentEase - 0.15;
      break;
    case 2: // Good
      newEase = currentEase; // No change
      break;
    case 3: // Easy
      newEase = currentEase + 0.15;
      break;
  }

  // Ensure minimum ease factor (Anki minimum is 1.30)
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
  // Don't schedule suspended cards - return unchanged
  if (card.isSuspended) {
    console.warn(`⚠️ Attempted to schedule suspended card ${card.id}`);
    return card;
  }

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
  if (rating === 3) {
    // Easy - skip all learning steps and graduate immediately with EASY_INTERVAL
    debugLog(
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
  } else {
    // Again (0), Hard (1), Good (2) - all enter learning queue at step 1
    return {
      ...card,
      state: "learning",
      learningStep: 0,
      due: addMinutes(now, settings.LEARNING_STEPS[0]),
      interval: settings.LEARNING_STEPS[0],
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
      // Graduate to review queue using GRADUATING_INTERVAL consistently (Anki behavior)
      debugLog(
        `🎓 Learning card ${card.id} graduating to review, scheduled for ${settings.GRADUATING_INTERVAL} days`
      );
      return {
        ...card,
        state: "review",
        repetitions: 1, // First repetition upon graduation
        interval: settings.GRADUATING_INTERVAL,
        due: addDays(now, settings.GRADUATING_INTERVAL),
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
    debugLog(
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

  // Calculate new ease factor first
  const newEase = calculateNewEase(card.ease, rating, settings);
  let newInterval: number;

  if (rating === 1) {
    // Hard - Anki's method: interval = prev_interval * hard_factor 
    // IMPORTANT: Does NOT multiply by ease factor (key difference from original SM-2)
    newInterval = Math.round(card.interval * settings.HARD_INTERVAL_FACTOR);
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
    // Again - restart relearning from beginning
    return {
      ...card,
      learningStep: 0,
      due: addMinutes(now, settings.RELEARNING_STEPS[0]),
      interval: settings.RELEARNING_STEPS[0],
    };
  } else if (rating === 1) {
    // Hard - repeat current relearning step
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
    // Good - advance to next relearning step or graduate back to review
    const nextStep = card.learningStep + 1;

    if (nextStep >= settings.RELEARNING_STEPS.length) {
      // Graduate back to review queue with recovery factor applied (Anki-style)
      // CRITICAL FIX: The current card.interval is a relearning step (minutes), not the original review interval
      // We need to calculate a reasonable recovery interval based on the card's history
      let recoveryInterval: number;
      
      if (card.interval < 60) { // If interval is less than 60 minutes, it's definitely a step interval
        // Calculate a reasonable interval based on repetitions and ease
        // This approximates what the interval would have been before the lapse
        const baseInterval = Math.max(1, card.repetitions * 2); // Rough approximation
        recoveryInterval = Math.round(baseInterval * settings.LAPSE_RECOVERY_FACTOR);
      } else {
        // Use the current interval if it seems reasonable (days)
        recoveryInterval = Math.round(card.interval * settings.LAPSE_RECOVERY_FACTOR);
      }
      
      const newInterval = Math.max(MINIMUM_INTERVAL, recoveryInterval);
      
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

// Session-related functions have been moved to SRSSession.ts

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

    // Create SRS state for this card
    // Note: In a full implementation, you'd store processedFront/processedBack
    // in your flashcard content table, not in SRS state
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
