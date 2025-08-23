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
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            onFlip();
          }
        }}
        aria-label={
          flipped ? "Show front of flashcard" : "Show back of flashcard"
        }
      >
        <div
          className={`absolute inset-0 w-full h-full transition-all duration-slow ease-in-out [transform-style:preserve-3d] group-hover:scale-[1.02] ${
            flipped ? "[transform:rotateY(180deg)]" : ""
          }`}
          style={{ willChange: "transform" }}
        >
          {/* Front Side */}
          <div className="absolute inset-0 flex flex-col items-center justify-center surface-elevated shadow-brand-lg rounded-2xl border border-subtle [backface-visibility:hidden] transition-all transition-normal hover:border-brand group-hover:shadow-brand-lg backdrop-blur">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
              <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-glass opacity-30 rounded-full blur-2xl animate-pulse" />
              <div
                className="absolute bottom-4 left-4 w-12 h-12 bg-gradient-to-r from-brand-secondary/20 to-brand-tertiary/20 rounded-full blur-xl animate-pulse"
                style={{ animationDelay: "2s" }}
              />
            </div>

            <div className="relative z-10 text-center px-6 py-8">
              <div className="text-lg md:text-xl lg:text-2xl font-semibold text-primary mb-8 leading-relaxed max-w-lg">
                {card.front}
              </div>

              {/* Enhanced instruction with icon */}
              <div className="flex items-center justify-center gap-3 text-muted text-sm">
                <div className="flex items-center gap-2 px-3 py-1.5 surface-glass rounded-full border border-subtle">
                  <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse" />
                  <span className="font-medium">
                    Click or press Space to reveal
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Back Side */}
          <div className="absolute inset-0 flex flex-col items-center justify-center surface-elevated shadow-brand-lg rounded-2xl border border-brand/50 [backface-visibility:hidden] [transform:rotateY(180deg)] transition-all transition-normal backdrop-blur">
            {/* Enhanced background for back side */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-brand-secondary/5" />
              <div className="absolute top-6 left-6 w-20 h-20 bg-gradient-brand opacity-10 rounded-full blur-3xl animate-pulse" />
              <div
                className="absolute bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-brand-tertiary/20 to-brand-accent/20 rounded-full blur-2xl animate-pulse"
                style={{ animationDelay: "1s" }}
              />
            </div>

            <div className="relative z-10 text-center px-6 py-8">
              <div className="text-lg md:text-xl lg:text-2xl font-semibold text-primary mb-8 leading-relaxed max-w-lg">
                {card.back}
              </div>

              {/* Enhanced instruction for back side */}
              <div className="flex items-center justify-center gap-3 text-muted text-sm">
                <div className="flex items-center gap-2 px-3 py-1.5 surface-glass rounded-full border border-brand/30">
                  <div className="w-2 h-2 bg-brand-secondary rounded-full animate-pulse" />
                  <span className="font-medium">
                    Click or press Space to show front
                  </span>
                </div>
              </div>
            </div>

            {/* Subtle indicator that this is the answer */}
            <div className="absolute top-4 right-4 px-2 py-1 surface-glass rounded-lg border border-brand/30">
              <span className="text-xs font-semibold brand-primary">
                Answer
              </span>
            </div>
          </div>
        </div>

        {/* Hover glow effect */}
        <div className="absolute -inset-1 bg-gradient-glass rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all transition-normal pointer-events-none" />
      </div>
    </div>
  );
}
