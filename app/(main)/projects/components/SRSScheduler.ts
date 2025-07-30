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
  if (rating === 0) {
    // Again
    repetitions = 0;
    interval = 1;
    newEase = Math.max(1.3, newEase - 0.2);
  } else {
    repetitions += 1;
    if (repetitions === 1) interval = 1;
    else if (repetitions === 2) interval = 6;
    else interval = Math.round(interval * newEase * [1, 1.2, 1.5][rating - 1]);
    if (rating === 1) newEase = Math.max(1.3, newEase - 0.15); // Hard
    if (rating === 2) newEase = newEase; // Good
    if (rating === 3) newEase = newEase + 0.15; // Easy
  }
  return {
    ...card,
    interval,
    ease: newEase,
    due: now + interval * 24 * 60 * 60 * 1000,
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
