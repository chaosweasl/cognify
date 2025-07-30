import React from "react";

interface FlashcardRatingControlsProps {
  flipped: boolean;
  handleRate: (rating: number) => void;
}

export function FlashcardRatingControls({
  flipped,
  handleRate,
}: FlashcardRatingControlsProps) {
  return (
    <div
      className={`flex flex-wrap gap-3 mb-6 min-h-[48px] transition-all duration-200 justify-center ${
        flipped
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
      aria-hidden={!flipped}
    >
      <button
        className="btn btn-outline btn-error"
        onClick={() => handleRate(0)}
      >
        Again
      </button>
      <button
        className="btn btn-outline btn-warning"
        onClick={() => handleRate(1)}
      >
        Hard
      </button>
      <button
        className="btn btn-outline btn-success"
        onClick={() => handleRate(2)}
      >
        Good
      </button>
      <button
        className="btn btn-outline btn-info"
        onClick={() => handleRate(3)}
      >
        Easy
      </button>
    </div>
  );
}
