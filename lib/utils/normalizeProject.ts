export type Flashcard = {
  id: string;
  front: string;
  back: string;
};

export type RawProject = {
  id: string;
  name: string;
  description: string | null;
  new_cards_per_day?: number;
  max_reviews_per_day?: number;
  flashcards?: string | Omit<Flashcard, "id">[];
  flashcardCount?: number;
  created_at: string;
  formattedCreatedAt?: string;
  // SRS Settings
  learning_steps?: number[];
  relearning_steps?: number[];
  graduating_interval?: number;
  easy_interval?: number;
  starting_ease?: number;
  minimum_ease?: number;
  easy_bonus?: number;
  hard_interval_factor?: number;
  easy_interval_factor?: number;
  lapse_recovery_factor?: number;
  leech_threshold?: number;
  leech_action?: 'suspend' | 'tag';
  new_card_order?: 'random' | 'fifo';
  review_ahead?: boolean;
  bury_siblings?: boolean;
  max_interval?: number;
  lapse_ease_penalty?: number;
};

export type NormalizedProject = {
  id: string;
  name: string;
  description: string;
  new_cards_per_day: number;
  max_reviews_per_day: number;
  flashcards: Flashcard[];
  flashcardCount?: number;
  created_at: string;
  formattedCreatedAt?: string;
  // SRS Settings with defaults
  learning_steps: number[];
  relearning_steps: number[];
  graduating_interval: number;
  easy_interval: number;
  starting_ease: number;
  minimum_ease: number;
  easy_bonus: number;
  hard_interval_factor: number;
  easy_interval_factor: number;
  lapse_recovery_factor: number;
  leech_threshold: number;
  leech_action: 'suspend' | 'tag';
  new_card_order: 'random' | 'fifo';
  review_ahead: boolean;
  bury_siblings: boolean;
  max_interval: number;
  lapse_ease_penalty: number;
};

export function parseFlashcards(
  flashcards?: string | Omit<Flashcard, "id">[]
): Flashcard[] {
  if (!flashcards) return [];
  let parsed: Omit<Flashcard, "id">[] = [];
  if (typeof flashcards === "string") {
    try {
      parsed = JSON.parse(flashcards);
    } catch {
      return [];
    }
  } else if (Array.isArray(flashcards)) {
    parsed = flashcards;
  }
  // Add id to each flashcard
  return parsed.map((card, idx) => ({ ...card, id: `${idx}` }));
}

export function normalizeProject(raw: RawProject | NormalizedProject): NormalizedProject {
  // Accepts either RawProject or already normalized Project, always returns NormalizedProject
  return {
    ...raw,
    description: raw.description || "",
    new_cards_per_day: raw.new_cards_per_day ?? 20,
    max_reviews_per_day: raw.max_reviews_per_day ?? 100,
    flashcards: parseFlashcards((raw as RawProject).flashcards),
    flashcardCount: (raw as RawProject).flashcardCount ?? 0,
    // SRS Settings with Anki-compatible defaults
    learning_steps: raw.learning_steps ?? [1, 10],
    relearning_steps: raw.relearning_steps ?? [10],
    graduating_interval: raw.graduating_interval ?? 1,
    easy_interval: raw.easy_interval ?? 4,
    starting_ease: raw.starting_ease ?? 2.5,
    minimum_ease: raw.minimum_ease ?? 1.3,
    easy_bonus: raw.easy_bonus ?? 1.3,
    hard_interval_factor: raw.hard_interval_factor ?? 1.2,
    easy_interval_factor: raw.easy_interval_factor ?? 1.3,
    lapse_recovery_factor: raw.lapse_recovery_factor ?? 0.5,
    leech_threshold: raw.leech_threshold ?? 8,
    leech_action: raw.leech_action ?? 'suspend',
    new_card_order: raw.new_card_order ?? 'random',
    review_ahead: raw.review_ahead ?? false,
    bury_siblings: raw.bury_siblings ?? false,
    max_interval: raw.max_interval ?? 36500,
    lapse_ease_penalty: raw.lapse_ease_penalty ?? 0.2,
  };
}
