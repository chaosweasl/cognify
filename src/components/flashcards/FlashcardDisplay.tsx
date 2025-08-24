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
        className="relative w-full max-w-2xl h-[300px] md:h-[380px] cursor-pointer select-none [perspective:1000px] group"
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
        {/* Floating particles animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute w-1 h-1 bg-brand-primary rounded-full opacity-40 animate-pulse"
            style={{
              top: "20%",
              left: "10%",
              animationDelay: "0s",
              animationDuration: "3s",
            }}
          />
          <div
            className="absolute w-1 h-1 bg-brand-secondary rounded-full opacity-30 animate-pulse"
            style={{
              top: "80%",
              right: "15%",
              animationDelay: "1s",
              animationDuration: "4s",
            }}
          />
          <div
            className="absolute w-1 h-1 bg-brand-tertiary rounded-full opacity-35 animate-pulse"
            style={{
              bottom: "30%",
              left: "20%",
              animationDelay: "2s",
              animationDuration: "3.5s",
            }}
          />
        </div>

        <div
          className={`absolute inset-0 w-full h-full transition-all duration-700 ease-out [transform-style:preserve-3d] group-hover:scale-[1.03] ${
            flipped ? "[transform:rotateY(180deg)]" : ""
          }`}
          style={{ willChange: "transform" }}
        >
          {/* Enhanced Front Side */}
          <div className="absolute inset-0 flex flex-col items-center justify-center surface-elevated shadow-brand-lg rounded-3xl border border-subtle [backface-visibility:hidden] transition-all transition-normal hover:border-brand group-hover:shadow-brand-lg backdrop-blur overflow-hidden">
            {/* Animated background gradients */}
            <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/3 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-brand-primary/10 to-transparent rounded-full blur-3xl animate-pulse" />
              <div
                className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-brand-secondary/8 to-transparent rounded-full blur-2xl animate-pulse"
                style={{ animationDelay: "2s", animationDuration: "6s" }}
              />

              {/* Subtle geometric pattern */}
              <div className="absolute inset-0 opacity-5">
                <svg
                  className="w-full h-full"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <pattern
                      id="front-pattern"
                      x="0"
                      y="0"
                      width="20"
                      height="20"
                      patternUnits="userSpaceOnUse"
                    >
                      <circle
                        cx="10"
                        cy="10"
                        r="1"
                        fill="currentColor"
                        className="text-brand-primary"
                      />
                    </pattern>
                  </defs>
                  <rect width="100" height="100" fill="url(#front-pattern)" />
                </svg>
              </div>
            </div>

            {/* Enhanced content area */}
            <div className="relative z-10 text-center px-8 py-10 w-full flex flex-col justify-center min-h-0">
              <div className="text-xl md:text-2xl lg:text-3xl font-semibold text-primary mb-12 leading-relaxed max-w-lg mx-auto">
                {card.front}
              </div>

              {/* Enhanced instruction with animated elements */}
              <div className="flex items-center justify-center gap-4">
                <div className="flex items-center gap-3 px-4 py-2 surface-glass rounded-full border border-subtle group-hover:border-brand/50 transition-all duration-300">
                  <div className="relative">
                    <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse" />
                    <div className="absolute inset-0 w-2 h-2 bg-brand-primary rounded-full animate-ping opacity-40" />
                  </div>
                  <span className="font-medium text-sm text-secondary group-hover:text-primary transition-colors">
                    Click or press Space to reveal
                  </span>
                </div>
              </div>
            </div>

            {/* Subtle corner accents */}
            <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-brand-primary/20 rounded-tl-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-brand-primary/20 rounded-br-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
          </div>

          {/* Enhanced Back Side */}
          <div className="absolute inset-0 flex flex-col items-center justify-center surface-elevated shadow-brand-lg rounded-3xl border-2 border-brand/30 [backface-visibility:hidden] [transform:rotateY(180deg)] transition-all transition-normal backdrop-blur overflow-hidden">
            {/* Enhanced background for back side */}
            <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/8 via-brand-secondary/6 to-brand-tertiary/8" />
              <div className="absolute top-8 left-8 w-28 h-28 bg-gradient-brand opacity-15 rounded-full blur-3xl animate-pulse" />
              <div
                className="absolute bottom-8 right-8 w-20 h-20 bg-gradient-to-r from-brand-tertiary/25 to-brand-accent/25 rounded-full blur-3xl animate-pulse"
                style={{ animationDelay: "1s", animationDuration: "5s" }}
              />

              {/* Different geometric pattern for back */}
              <div className="absolute inset-0 opacity-8">
                <svg
                  className="w-full h-full"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <pattern
                      id="back-pattern"
                      x="0"
                      y="0"
                      width="15"
                      height="15"
                      patternUnits="userSpaceOnUse"
                    >
                      <rect
                        x="7"
                        y="7"
                        width="1"
                        height="1"
                        fill="currentColor"
                        className="text-brand-secondary"
                      />
                    </pattern>
                  </defs>
                  <rect width="100" height="100" fill="url(#back-pattern)" />
                </svg>
              </div>
            </div>

            <div className="relative z-10 text-center px-8 py-10 w-full flex flex-col justify-center min-h-0">
              <div className="text-xl md:text-2xl lg:text-3xl font-semibold text-primary mb-12 leading-relaxed max-w-lg mx-auto">
                {card.back}
              </div>

              {/* Enhanced instruction for back side */}
              <div className="flex items-center justify-center gap-4">
                <div className="flex items-center gap-3 px-4 py-2 surface-glass rounded-full border border-brand/40 bg-brand-primary/5">
                  <div className="relative">
                    <div className="w-2 h-2 bg-brand-secondary rounded-full animate-pulse" />
                    <div className="absolute inset-0 w-2 h-2 bg-brand-secondary rounded-full animate-ping opacity-40" />
                  </div>
                  <span className="font-medium text-sm text-secondary">
                    Click or press Space to show front
                  </span>
                </div>
              </div>
            </div>

            {/* Enhanced answer indicator */}
            <div className="absolute top-6 right-6 px-4 py-2 surface-glass rounded-xl border border-brand/40 bg-gradient-to-r from-brand-primary/10 to-brand-secondary/10 shadow-brand">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse" />
                <span className="text-sm font-semibold brand-primary">
                  Answer
                </span>
              </div>
            </div>

            {/* Enhanced corner accents for back */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-brand-secondary/30 rounded-tl-xl" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-brand-secondary/30 rounded-br-xl" />
          </div>
        </div>

        {/* Enhanced hover glow effect with animation */}
        <div className="absolute -inset-2 bg-gradient-to-r from-brand-primary/20 via-brand-secondary/20 to-brand-tertiary/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none" />

        {/* Magnetic field effect */}
        <div className="absolute -inset-4 bg-gradient-to-r from-transparent via-brand-primary/5 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-1000 pointer-events-none animate-pulse" />
      </div>
    </div>
  );
}
