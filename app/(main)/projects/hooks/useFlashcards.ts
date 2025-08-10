import { create } from "zustand";
import {
  Flashcard,
  CreateFlashcardData,
  convertNewToLegacy,
  LegacyFlashcard,
} from "../types/flashcard";
import {
  getFlashcardsByProjectId,
  replaceAllFlashcardsForProject,
  createFlashcard,
  updateFlashcard,
  deleteFlashcard,
} from "../actions/flashcard-actions";

interface FlashcardsState {
  flashcards: Flashcard[];
  loading: boolean;
  error: string | null;
  fetchFlashcards: (projectId: string) => Promise<void>;
  createFlashcard: (
    projectId: string,
    flashcardData: CreateFlashcardData
  ) => Promise<void>;
  updateFlashcard: (
    flashcardId: string,
    updateData: Partial<CreateFlashcardData>
  ) => Promise<void>;
  deleteFlashcard: (flashcardId: string) => Promise<void>;
  replaceAllFlashcards: (
    projectId: string,
    flashcardsData: CreateFlashcardData[]
  ) => Promise<void>;
  // Legacy compatibility methods
  getLegacyFlashcards: () => LegacyFlashcard[];
  setError: (error: string | null) => void;
}

export const useFlashcardsStore = create<FlashcardsState>((set, get) => ({
  flashcards: [],
  loading: false,
  error: null,

  fetchFlashcards: async (projectId: string) => {
    set({ loading: true, error: null });
    try {
      const flashcards = await getFlashcardsByProjectId(projectId);
      set({ flashcards });
    } catch (error) {
      console.error("Failed to fetch flashcards:", error);
      set({ error: "Failed to load flashcards" });
    } finally {
      set({ loading: false });
    }
  },

  createFlashcard: async (
    projectId: string,
    flashcardData: CreateFlashcardData
  ) => {
    set({ loading: true, error: null });
    try {
      const newFlashcard = await createFlashcard(projectId, flashcardData);
      if (newFlashcard) {
        set((state) => ({
          flashcards: [...state.flashcards, newFlashcard],
        }));
      }
    } catch (error) {
      console.error("Failed to create flashcard:", error);
      set({ error: "Failed to create flashcard" });
    } finally {
      set({ loading: false });
    }
  },

  updateFlashcard: async (
    flashcardId: string,
    updateData: Partial<CreateFlashcardData>
  ) => {
    set({ loading: true, error: null });
    try {
      const updatedFlashcard = await updateFlashcard(flashcardId, updateData);
      if (updatedFlashcard) {
        set((state) => ({
          flashcards: state.flashcards.map((fc) =>
            fc.id === flashcardId ? updatedFlashcard : fc
          ),
        }));
      }
    } catch (error) {
      console.error("Failed to update flashcard:", error);
      set({ error: "Failed to update flashcard" });
    } finally {
      set({ loading: false });
    }
  },

  deleteFlashcard: async (flashcardId: string) => {
    set({ loading: true, error: null });
    try {
      await deleteFlashcard(flashcardId);
      set((state) => ({
        flashcards: state.flashcards.filter((fc) => fc.id !== flashcardId),
      }));
    } catch (error) {
      console.error("Failed to delete flashcard:", error);
      set({ error: "Failed to delete flashcard" });
    } finally {
      set({ loading: false });
    }
  },

  replaceAllFlashcards: async (
    projectId: string,
    flashcardsData: CreateFlashcardData[]
  ) => {
    set({ loading: true, error: null });
    try {
      console.log(
        "[useFlashcards] Replacing all flashcards for project:",
        projectId
      );
      console.log("[useFlashcards] Flashcard data to save:", flashcardsData);

      const newFlashcards = await replaceAllFlashcardsForProject(
        projectId,
        flashcardsData
      );

      console.log(
        "[useFlashcards] Successfully saved flashcards:",
        newFlashcards
      );
      set({ flashcards: newFlashcards });
    } catch (error) {
      console.error("Failed to replace flashcards:", error);
      set({ error: "Failed to save flashcards" });
      throw error; // Re-throw so FlashcardEditor can catch it
    } finally {
      set({ loading: false });
    }
  },

  // Legacy compatibility method for components that haven't been updated yet
  getLegacyFlashcards: () => {
    const flashcards = get().flashcards;
    if (!Array.isArray(flashcards)) {
      console.warn("[useFlashcards] Flashcards is not an array:", flashcards);
      return [];
    }
    return flashcards.filter(Boolean).map(convertNewToLegacy);
  },

  setError: (error) => set({ error }),
}));
