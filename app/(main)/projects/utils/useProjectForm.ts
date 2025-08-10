import { useState } from "react";

export type Flashcard = {
  front: string;
  back: string;
};

export function useProjectForm() {
  const [form, setForm] = useState({
    name: "",
    description: "",
    flashcards: [] as Flashcard[],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFormChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleFlashcardChange(
    idx: number,
    field: keyof Flashcard,
    value: string
  ) {
    setForm((prev) => {
      const flashcards = [...prev.flashcards];
      flashcards[idx] = { ...flashcards[idx], [field]: value };
      return { ...prev, flashcards };
    });
  }

  function addFlashcard() {
    setForm((prev) => ({
      ...prev,
      flashcards: [...prev.flashcards, { front: "", back: "" }],
    }));
  }

  function removeFlashcard(idx: number) {
    setForm((prev) => {
      const flashcards = [...prev.flashcards];
      flashcards.splice(idx, 1);
      return { ...prev, flashcards };
    });
  }

  return {
    form,
    setForm,
    loading,
    setLoading,
    error,
    setError,
    handleFormChange,
    handleFlashcardChange,
    addFlashcard,
    removeFlashcard,
  };
}
