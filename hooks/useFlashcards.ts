import { createClient } from "@/lib/supabase/client";
import { Flashcard, CreateFlashcardData } from "@/src/types";
import { create } from "zustand";

interface FlashcardsState {
  flashcards: Flashcard[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchFlashcards: (projectId: string) => Promise<void>;
  replaceAllFlashcards: (projectId: string, flashcards: CreateFlashcardData[]) => Promise<void>;
  setFlashcards: (flashcards: Flashcard[]) => void;
}

export const useFlashcardsStore = create<FlashcardsState>((set, get) => ({
  flashcards: [],
  loading: false,
  error: null,

  fetchFlashcards: async (projectId: string) => {
    set({ loading: true, error: null });
    
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("flashcards")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      set({ flashcards: data || [], loading: false });
    } catch (error) {
      console.error("Error fetching flashcards:", error);
      set({ 
        error: error instanceof Error ? error.message : "Failed to fetch flashcards",
        loading: false 
      });
    }
  },

  replaceAllFlashcards: async (projectId: string, newFlashcards: CreateFlashcardData[]) => {
    set({ loading: true, error: null });
    
    try {
      const supabase = createClient();
      
      // Delete existing flashcards
      const { error: deleteError } = await supabase
        .from("flashcards")
        .delete()
        .eq("project_id", projectId);
      
      if (deleteError) throw deleteError;
      
      // Insert new flashcards
      const flashcardsToInsert = newFlashcards.map(fc => ({
        project_id: projectId,
        front: fc.front,
        back: fc.back,
        extra: fc.extra || {}
      }));
      
      const { data, error: insertError } = await supabase
        .from("flashcards")
        .insert(flashcardsToInsert)
        .select();
      
      if (insertError) throw insertError;
      
      set({ flashcards: data || [], loading: false });
    } catch (error) {
      console.error("Error replacing flashcards:", error);
      set({ 
        error: error instanceof Error ? error.message : "Failed to replace flashcards",
        loading: false 
      });
    }
  },

  setFlashcards: (flashcards: Flashcard[]) => {
    set({ flashcards });
  },
}));