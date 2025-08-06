"use client";
import React, { useState, useEffect } from "react";
import { BookOpen, Clock } from "lucide-react";

interface EmptyStateProps {
  type: "no-cards" | "no-due-cards" | "waiting-for-learning";
  onReset?: () => void;
  nextLearningCardDue?: number; // Timestamp for next learning card
}

export function EmptyFlashcardState({
  type,
  onReset,
  nextLearningCardDue,
}: EmptyStateProps) {
  // Always declare hooks at the top level
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    if (type !== "waiting-for-learning") return;
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [type]);

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

  if (type === "waiting-for-learning") {
    const timeUntilNext = nextLearningCardDue
      ? nextLearningCardDue - currentTime
      : 0;
    const secondsUntilNext = Math.max(0, Math.ceil(timeUntilNext / 1000));
    const minutesUntilNext = Math.floor(secondsUntilNext / 60);
    const displaySeconds = secondsUntilNext % 60;

    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <Clock className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <div className="text-xl font-bold text-base-content mb-2">
            Waiting for learning cards
          </div>
          <div className="text-base-content/70 mb-4">
            {timeUntilNext > 0 ? (
              <>
                Next card available in{" "}
                {minutesUntilNext > 0 ? `${minutesUntilNext}m ` : ""}
                {displaySeconds}s
              </>
            ) : (
              "Learning cards available now! Refreshing..."
            )}
          </div>
          {onReset && (
            <button className="btn btn-outline btn-sm" onClick={onReset}>
              End Session
            </button>
          )}
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
