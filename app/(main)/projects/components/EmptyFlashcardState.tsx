"use client";
import React from "react";
import { BookOpen, Clock } from "lucide-react";

interface EmptyStateProps {
  type: "no-cards" | "no-due-cards";
  onReset?: () => void;
}

export function EmptyFlashcardState({ type, onReset }: EmptyStateProps) {
  if (type === "no-cards") {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-base-content/50 mx-auto mb-4" />
          <div className="text-2xl font-bold text-base-content mb-2">
            No flashcards found
          </div>
          <div className="text-base-content/70">
            Add some flashcards to start studying!
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <div className="text-center">
        <Clock className="w-16 h-16 text-base-content/50 mx-auto mb-4" />
        <div className="text-xl font-bold text-base-content mb-2">
          No cards due for review
        </div>
        <div className="text-base-content/70 mb-4">
          Come back later when cards are due!
        </div>
        {onReset && (
          <button className="btn btn-primary" onClick={onReset}>
            Study All Cards
          </button>
        )}
      </div>
    </div>
  );
}
