"use client";
import React from "react";

interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

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
      >
        <div
          className={`absolute inset-0 w-full h-full transition-all duration-500 ease-in-out [transform-style:preserve-3d] group-hover:scale-[1.02] ${
            flipped ? "[transform:rotateY(180deg)]" : ""
          }`}
          style={{ willChange: "transform" }}
        >
          {/* Front */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-base-100 to-base-200 shadow-xl rounded-2xl border-2 [backface-visibility:hidden] transition-all duration-300 border-base-300 hover:border-primary/50">
            <div className="text-center px-4 py-6">
              <div className="text-sm md:text-base lg:text-xl font-semibold text-base-content mb-6 leading-relaxed">
                {card.question}
              </div>
              <div className="flex items-center justify-center gap-2 text-base-content/60 text-sm">
                <span>Click or press Space to reveal answer</span>
              </div>
            </div>
          </div>

          {/* Back */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 shadow-xl rounded-2xl border-2 [backface-visibility:hidden] [transform:rotateY(180deg)] transition-all duration-300 border-primary/30">
            <div className="text-center px-4 py-6">
              <div className="text-sm md:text-base lg:text-xl font-semibold text-base-content mb-6 leading-relaxed">
                {card.answer}
              </div>
              <div className="flex items-center justify-center gap-2 text-base-content/60 text-sm">
                <span>Click or press Space to show question</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
