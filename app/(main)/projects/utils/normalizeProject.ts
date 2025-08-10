export type Flashcard = {
  id: string;
  front: string;
  back: string;
};

export type RawProject = {
  id: string;
  name: string;
  description: string;
  flashcards?: string | Omit<Flashcard, "id">[];
  flashcardCount?: number;
  created_at: string;
  formattedCreatedAt?: string;
};

export type Project = {
  id: string;
  name: string;
  description: string;
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

export function normalizeProject(raw: RawProject | Project): Project {
  // Accepts either RawProject or Project, always returns Project with id on flashcards
  return {
    ...raw,
    flashcards: parseFlashcards((raw as RawProject).flashcards),
    flashcardCount: (raw as RawProject).flashcardCount ?? 0,
  };
}
