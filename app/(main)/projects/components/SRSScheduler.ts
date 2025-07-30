// --- SRS Constants ---
const AGAIN_INTERVAL = 60 * 1000; // 1 minute in ms
const HARD_INTERVAL = 10 * 60 * 1000; // 10 minutes in ms
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_INTERVAL_DAYS = 365; // 1 year max interval
// Minimal SM-2 spaced repetition scheduler for Anki-like flashcard review
// This is a pure function and can be used in local state

export type SRSCardState = {
  id: string;
  interval: number; // days until next review
  ease: number; // ease factor
  due: number; // timestamp (ms) when card is due
  lastReviewed: number; // timestamp (ms)
  repetitions: number;
};

export type SRSRating = 0 | 1 | 2 | 3; // 0=Again, 1=Hard, 2=Good, 3=Easy

export function initSRSState(cardIds: string[]): Record<string, SRSCardState> {
  const now = Date.now();
  const initial: Record<string, SRSCardState> = {};
  for (const id of cardIds) {
    initial[id] = {
      id,
      interval: 1,
      ease: 2.5,
      due: now,
      lastReviewed: 0,
      repetitions: 0,
    };
  }
  return initial;
}

// SM-2 algorithm (simplified)
export function scheduleSRSCard(
  card: SRSCardState,
  rating: SRSRating,
  now: number = Date.now()
): SRSCardState {
  let { interval, ease, repetitions } = card;
  let newEase = card.ease;
  let due: number;
  if (rating === 0) {
    // Again: show again immediately until learned
    repetitions = 0;
    // interval = 0; // Not used for scheduling, but could be kept for analytics
    newEase = Math.max(1.3, newEase - 0.2);
    due = now; // Due now, so it repeats in the same session
  } else if (rating === 1) {
    // Hard: show again immediately (optionally, you can set a short delay if you want)
    repetitions += 1;
    interval = Math.max(0, Math.round(interval * 1.2));
    newEase = Math.max(1.3, newEase - 0.15);
    due = now; // Due now, so it repeats in the same session
  } else if (rating === 2) {
    // Good: normal interval
    repetitions += 1;
    if (repetitions === 1) interval = 1;
    else if (repetitions === 2) interval = 6;
    else interval = Math.round(interval * newEase);
    interval = Math.min(interval, MAX_INTERVAL_DAYS); // Cap interval
    due = now + interval * DAY_MS;
  } else {
    // Easy: longer interval
    repetitions += 1;
    if (repetitions === 1) interval = 2;
    else if (repetitions === 2) interval = 8;
    else interval = Math.round(interval * newEase * 1.5);
    newEase = newEase + 0.15;
    interval = Math.min(interval, MAX_INTERVAL_DAYS); // Cap interval
    due = now + interval * DAY_MS;
  }
  // Note: interval is always an integer (days). If you want smoother spacing, use floats and round only for display.
  return {
    ...card,
    interval,
    ease: newEase,
    due,
    lastReviewed: now,
    repetitions,
  };
}

// Get next due card id from a list of card states
export function getNextDueCardId(
  cardStates: Record<string, SRSCardState>,
  exclude: string[] = []
): string | null {
  const now = Date.now();
  const dueCards = Object.values(cardStates).filter(
    (c) => c.due <= now && !exclude.includes(c.id)
  );
  if (dueCards.length === 0) return null;
  dueCards.sort((a, b) => a.due - b.due);
  return dueCards[0].id;
}
