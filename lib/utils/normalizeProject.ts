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
  };
}
