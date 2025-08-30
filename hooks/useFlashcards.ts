// import { createClient } from "@/lib/supabase/client";
import { Flashcard, CreateFlashcardData } from "@/src/types";
import { create } from "zustand";

interface FlashcardsState {
  flashcards: Flashcard[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchFlashcards: (projectId: string) => Promise<void>;
  replaceAllFlashcards: (
    projectId: string,
    flashcards: CreateFlashcardData[]
  ) => Promise<void>;
  setFlashcards: (flashcards: Flashcard[]) => void;
  reset: () => void; // Added reset method
}

export const useFlashcardsStore = create<FlashcardsState>((set, get) => ({
  flashcards: [],
  loading: false,
  error: null,

  fetchFlashcards: async (projectId: string) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(
        `/api/flashcards?project_id=${encodeURIComponent(projectId)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch flashcards");
      set({ flashcards: data || [], loading: false });
    } catch (error) {
      console.error("Error fetching flashcards:", error);
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch flashcards",
        loading: false,
      });
    }
  },

  replaceAllFlashcards: async (
    projectId: string,
    newFlashcards: CreateFlashcardData[]
  ) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          flashcards: newFlashcards,
          replace: true,
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Failed to replace flashcards");
      set({ flashcards: data || [], loading: false });
    } catch (error) {
      console.error("Error replacing flashcards:", error);
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to replace flashcards",
        loading: false,
      });
    }
  },

  setFlashcards: (flashcards: Flashcard[]) => {
    set({ flashcards });
  },

  reset: () => {
    set({
      flashcards: [],
      loading: false,
      error: null,
    });
  },
}));
