"use client";
import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Clock,
  CheckCircle,
  Sparkles,
  TrendingUp,
  Coffee,
} from "lucide-react";

interface EmptyStateProps {
  type:
    | "no-cards"
    | "no-review-cards"
    | "waiting-for-learning"
    | "daily-limit-reached";
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] relative">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-32 h-32 bg-gradient-glass opacity-20 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-20 right-1/4 w-24 h-24 bg-gradient-to-r from-brand-secondary/10 to-brand-tertiary/10 rounded-full blur-2xl animate-pulse"
            style={{ animationDelay: "2s" }}
          />
        </div>

        <div className="relative z-10 text-center max-w-md">
          {/* Enhanced icon container */}
          <div className="relative mb-8 group">
            <div className="w-20 h-20 surface-elevated rounded-2xl flex items-center justify-center mx-auto shadow-brand transform group-hover:scale-105 transition-all transition-normal">
              <BookOpen className="w-10 h-10 text-muted" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-brand rounded-full flex items-center justify-center animate-bounce">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="absolute -inset-2 bg-gradient-glass rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all transition-normal" />
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4 bg-gradient-to-r from-text-primary via-brand-primary to-text-primary bg-clip-text">
            No flashcards found
          </h2>
          <p className="text-text-muted text-lg mb-8 leading-relaxed">
            Start building your knowledge base by adding some flashcards to this
            project
          </p>

          {/* Call to action card */}
          <div className="card surface-elevated border border-subtle shadow-brand backdrop-blur p-6 max-w-sm mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-glass rounded-lg">
                <TrendingUp className="w-5 h-5 brand-primary" />
              </div>
              <span className="font-semibold text-secondary">Get Started</span>
            </div>
            <p className="text-sm text-muted mb-4">
              Add flashcards to begin your learning journey and track your
              progress
            </p>
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
      <div className="flex flex-col items-center justify-center min-h-[70vh] relative">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-16 left-1/3 w-40 h-40 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-16 right-1/3 w-32 h-32 bg-gradient-glass opacity-20 rounded-full blur-2xl animate-pulse"
            style={{ animationDelay: "1.5s" }}
          />
        </div>

        <div className="relative z-10 text-center max-w-lg">
          {/* Enhanced clock icon */}
          <div className="relative mb-8 group">
            <div className="w-24 h-24 surface-elevated rounded-3xl flex items-center justify-center mx-auto shadow-brand-lg border border-yellow-500/20">
              <Clock className="w-12 h-12 text-yellow-500" />
            </div>
            {/* Pulsing ring */}
            <div className="absolute inset-0 w-24 h-24 border-2 border-yellow-500/30 rounded-3xl mx-auto animate-ping" />
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">
            Learning in progress
          </h2>

          {/* Timer display */}
          <div className="card surface-elevated border border-yellow-500/20 shadow-brand backdrop-blur p-6 mb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
              <span className="text-lg font-semibold text-secondary">
                Next card available
              </span>
            </div>

            {timeUntilNext > 0 ? (
              <div className="flex items-center justify-center gap-4 text-3xl md:text-4xl font-bold">
                {minutesUntilNext > 0 && (
                  <div className="text-center">
                    <div className="brand-primary">{minutesUntilNext}</div>
                    <div className="text-xs text-muted font-normal">min</div>
                  </div>
                )}
                <div className="text-center">
                  <div className="brand-secondary">{displaySeconds}</div>
                  <div className="text-xs text-muted font-normal">sec</div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-green-500">
                <CheckCircle className="w-6 h-6" />
                <span className="text-lg font-semibold">Ready now!</span>
              </div>
            )}
          </div>

          <p className="text-text-muted mb-6 leading-relaxed">
            Your learning cards are being spaced out for optimal retention
          </p>

          {onReset && (
            <button className="btn btn-outline interactive-hover border-subtle hover:border-brand hover:shadow-brand transition-all transition-normal">
              End Session
            </button>
          )}
        </div>
      </div>
    );
  }

  if (type === "daily-limit-reached") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] relative">
        {/* Celebration background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-36 h-36 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-20 right-1/4 w-28 h-28 bg-gradient-brand opacity-10 rounded-full blur-2xl animate-pulse"
            style={{ animationDelay: "1s" }}
          />
        </div>

        <div className="relative z-10 text-center max-w-lg">
          {/* Achievement icon */}
          <div className="relative mb-8 group">
            <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto shadow-brand-lg transform group-hover:scale-105 transition-all transition-normal">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            {/* Success sparkles */}
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <div
              className="absolute -bottom-2 -left-2 w-5 h-5 bg-orange-400 rounded-full flex items-center justify-center animate-bounce"
              style={{ animationDelay: "0.5s" }}
            >
              <Sparkles className="w-2 h-2 text-white" />
            </div>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4 bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text">
            Daily goal achieved!
          </h2>

          <div className="card surface-elevated border border-green-500/20 shadow-brand backdrop-blur p-6 mb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Coffee className="w-6 h-6 text-green-500" />
              <span className="text-lg font-semibold text-secondary">
                Well done!
              </span>
            </div>
            <p className="text-muted leading-relaxed">
              You've completed all your scheduled cards for today. Your brain is
              building stronger connections with each review.
            </p>
          </div>

          <p className="text-text-muted mb-8 leading-relaxed">
            Come back tomorrow for your next study session, or continue with
            unlimited practice
          </p>

          {onReset && (
            <button className="btn bg-gradient-brand hover:bg-gradient-brand-hover text-white border-0 shadow-brand hover:shadow-brand-lg transition-all transition-normal">
              <Sparkles className="w-4 h-4 mr-2" />
              Continue Practice Mode
            </button>
          )}
        </div>
      </div>
    );
  }

  // Default no-review-cards state
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] relative">
      {/* Peaceful background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-16 right-1/3 w-32 h-32 bg-gradient-glass opacity-20 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-24 left-1/4 w-24 h-24 bg-gradient-to-r from-brand-primary/10 to-brand-secondary/10 rounded-full blur-2xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="relative z-10 text-center max-w-lg">
        {/* Rest icon */}
        <div className="relative mb-8">
          <div className="w-20 h-20 surface-elevated rounded-2xl flex items-center justify-center mx-auto shadow-brand border border-subtle">
            <Clock className="w-10 h-10 text-muted" />
          </div>
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">
          All caught up!
        </h2>

        <div className="card surface-elevated border border-subtle shadow-brand backdrop-blur p-6 mb-6">
          <p className="text-secondary leading-relaxed">
            No cards are ready for review right now. Your spaced repetition
            schedule is working perfectly!
          </p>
        </div>

        <p className="text-text-muted mb-8">
          Check back later when more cards are due for review
        </p>

        {onReset && (
          <button className="btn btn-outline interactive-hover border-subtle hover:border-brand hover:shadow-brand transition-all transition-normal">
            <BookOpen className="w-4 h-4 mr-2" />
            Practice All Cards
          </button>
        )}
      </div>
    </div>
  );
}
