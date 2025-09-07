"use client";
import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Clock,
  CheckCircle,
  TrendingUp,
  Coffee,
  Target,
  Brain,
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

  // Simple floating elements component
  const FloatingParticles = ({ color = "brand-primary", count = 4 }) => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`absolute w-1 h-1 bg-${color} rounded-full opacity-20`}
          style={{
            left: `${10 + ((i * 11) % 80)}%`,
            top: `${15 + ((i * 13) % 70)}%`,
          }}
        />
      ))}
    </div>
  );

  if (type === "no-cards") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] relative overflow-hidden">
        {/* Simple background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-32 h-32 bg-gradient-to-br from-brand-primary/5 to-brand-secondary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-1/4 w-24 h-24 bg-gradient-to-br from-brand-tertiary/5 to-brand-accent/5 rounded-full blur-2xl" />
        </div>

        <FloatingParticles color="brand-primary" count={4} />

        <div className="relative z-10 text-center max-w-md">
          {/* Simple icon container */}
          <div className="relative mb-8">
            <div className="w-20 h-20 surface-elevated rounded-2xl flex items-center justify-center mx-auto shadow-brand border border-subtle">
              <BookOpen className="w-10 h-10 text-muted" />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-primary mb-4">
            No flashcards yet
          </h2>

          <p className="text-text-muted mb-8 text-lg leading-relaxed">
            Your project is ready, but there are no flashcards to study yet.
            Create some flashcards or import them to get started with your
            learning journey.
          </p>

          <div className="text-center text-text-muted text-sm">
            <p className="mb-2">💡 Quick tip:</p>
            <p>
              Upload a PDF or create flashcards manually to begin your study
              session
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (type === "waiting-for-learning") {
    const timeUntilNext = nextLearningCardDue
      ? Math.max(0, nextLearningCardDue - currentTime)
      : 0;
    const minutesUntilNext = Math.ceil(timeUntilNext / (1000 * 60));

    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] relative overflow-hidden">
        {/* Clean background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-16 right-1/3 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-24 left-1/4 w-24 h-24 bg-gradient-to-r from-brand-primary/5 to-brand-secondary/5 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10 text-center max-w-lg">
          {/* Timer icon */}
          <div className="relative mb-8">
            <div className="w-20 h-20 surface-elevated rounded-2xl flex items-center justify-center mx-auto shadow-brand border border-subtle">
              <Clock className="w-10 h-10 text-brand-primary" />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-primary mb-4">
            Learning in progress
          </h2>

          <div className="card surface-elevated border border-subtle shadow-brand p-6 rounded-xl mb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Target className="w-6 h-6 text-brand-primary" />
              <span className="text-lg font-semibold text-primary">
                Next Review Ready
              </span>
            </div>

            {timeUntilNext > 0 ? (
              <div className="text-center">
                <div className="text-2xl font-bold text-brand-primary mb-1">
                  {minutesUntilNext} minutes
                </div>
                <p className="text-text-muted text-sm">
                  Your brain needs time to process new information
                </p>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-xl font-bold text-status-success mb-1">
                  Ready now!
                </div>
                <p className="text-text-muted text-sm">
                  Your next learning cards are ready for review
                </p>
              </div>
            )}
          </div>

          <p className="text-text-muted mb-8 text-lg">
            Spaced repetition helps strengthen your memory by reviewing content
            at optimal intervals
          </p>

          {onReset && (
            <button
              onClick={onReset}
              className="btn btn-outline border-2 border-subtle hover:border-brand px-8 py-3 rounded-xl font-semibold"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5" />
                <span>Practice All Cards</span>
              </div>
            </button>
          )}
        </div>
      </div>
    );
  }

  if (type === "daily-limit-reached") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] relative overflow-hidden">
        {/* Clean background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-32 h-32 bg-gradient-to-r from-green-500/5 to-emerald-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-1/4 w-24 h-24 bg-gradient-to-r from-brand-primary/5 to-brand-secondary/5 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10 text-center max-w-lg">
          {/* Simple completion icon */}
          <div className="relative mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto shadow-brand">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-primary mb-4">
            Study session complete
          </h2>

          <div className="card surface-elevated border border-status-success shadow-brand p-6 rounded-xl mb-6">
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-3">
                <Brain className="w-6 h-6 text-status-success" />
                <span className="font-semibold text-primary text-lg">
                  Great work today!
                </span>
              </div>

              <p className="text-muted text-center">
                You&apos;ve completed your scheduled study session. Consistent
                practice helps build long-term retention.
              </p>

              {/* Simple completion indicator */}
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-status-success mb-1">✓</div>
                  <div className="text-xs text-muted uppercase tracking-wider">
                    Complete
                  </div>
                </div>
                <div className="text-center">
                  <Brain className="w-5 h-5 text-status-success mx-auto mb-1" />
                  <div className="text-xs text-muted uppercase tracking-wider">
                    Reviewed
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-brand-primary mb-1">📚</div>
                  <div className="text-xs text-muted uppercase tracking-wider">
                    Learned
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="text-text-muted mb-8 text-lg">
            Come back tomorrow for your next scheduled reviews, or continue with
            practice mode.
          </p>

          {onReset && (
            <button
              onClick={onReset}
              className="bg-gradient-brand hover:bg-gradient-brand-hover text-white border-0 shadow-brand hover:shadow-brand-lg px-8 py-4 rounded-xl font-bold transition-all"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5" />
                <span>Continue Practice Mode</span>
              </div>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Default no-review-cards state
  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] relative overflow-hidden">
      {/* Peaceful background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-16 right-1/3 w-32 h-32 bg-gradient-to-br from-brand-primary/5 to-brand-secondary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-24 left-1/4 w-24 h-24 bg-gradient-to-r from-brand-primary/5 to-brand-secondary/5 rounded-full blur-2xl" />
      </div>

      <FloatingParticles color="brand-primary" count={3} />

      <div className="relative z-10 text-center max-w-lg">
        {/* Rest icon */}
        <div className="relative mb-8">
          <div className="w-20 h-20 surface-elevated rounded-2xl flex items-center justify-center mx-auto shadow-brand border border-subtle">
            <Clock className="w-10 h-10 text-muted" />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-primary mb-4">All caught up!</h2>

        <div className="card surface-elevated border border-subtle shadow-brand p-6 rounded-xl mb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Target className="w-6 h-6 text-status-success" />
            <span className="text-lg font-semibold text-primary">
              Perfect timing
            </span>
          </div>
          <p className="text-muted text-center">
            No cards are ready for review right now. Your spaced repetition
            schedule is working to optimize your memory retention.
          </p>
        </div>

        <p className="text-text-muted mb-8 text-lg">
          Check back later when more cards are due, or practice with all cards
          anytime
        </p>

        {onReset && (
          <button
            onClick={onReset}
            className="btn btn-outline border-2 border-subtle hover:border-brand px-8 py-3 rounded-xl font-semibold"
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5" />
              <span>Practice All Cards</span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
