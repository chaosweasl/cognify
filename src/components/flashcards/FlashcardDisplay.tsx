"use client";
import React from "react";
import { Flashcard } from "../../types";

interface FlashcardDisplayProps {
  card: Flashcard;
  flipped: boolean;
  onFlip: () => void;
}

export function FlashcardDisplay({
  card,
  flipped,
  onFlip,
}: FlashcardDisplayProps) {
  return (
    <div className="w-full flex justify-center mb-8">
      <div
        className="relative w-full max-w-2xl h-[300px] md:h-[350px] cursor-pointer select-none [perspective:1000px] group"
        onClick={onFlip}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            onFlip();
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={flipped ? "Show front of flashcard" : "Show back of flashcard"}
        aria-describedby="flashcard-instructions"
      >
        <div
          className={`absolute inset-0 w-full h-full transition-all duration-500 ease-in-out [transform-style:preserve-3d] group-hover:scale-[1.02] ${
            flipped ? "[transform:rotateY(180deg)]" : ""
          }`}
          style={{ willChange: "transform" }}
        >
          {/* Front */}
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-base-100 to-base-200 shadow-xl rounded-2xl border-2 [backface-visibility:hidden] transition-all duration-300 border-base-300 hover:border-primary/50"
            aria-hidden={flipped}
          >
            <div className="text-center px-4 py-6">
              <div 
                className="text-sm md:text-base lg:text-xl font-semibold text-base-content mb-6 leading-relaxed"
                role="heading"
                aria-level={3}
                aria-label="Flashcard front content"
              >
                {card.front}
              </div>
              <div 
                id="flashcard-instructions" 
                className="flex items-center justify-center gap-2 text-base-content/60 text-sm"
                aria-live="polite"
              >
                <span>Click or press Space to reveal back</span>
              </div>
            </div>
          </div>

          {/* Back */}
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 shadow-xl rounded-2xl border-2 [backface-visibility:hidden] [transform:rotateY(180deg)] transition-all duration-300 border-primary/30"
            aria-hidden={!flipped}
          >
            <div className="text-center px-4 py-6">
              <div 
                className="text-sm md:text-base lg:text-xl font-semibold text-base-content mb-6 leading-relaxed"
                role="heading"
                aria-level={3}
                aria-label="Flashcard back content"
              >
                {card.back}
              </div>
              <div 
                className="flex items-center justify-center gap-2 text-base-content/60 text-sm"
                aria-live="polite"
              >
                <span>Click or press Space to show front</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
