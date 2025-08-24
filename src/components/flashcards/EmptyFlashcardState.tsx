"use client";
import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Clock,
  CheckCircle,
  Sparkles,
  TrendingUp,
  Coffee,
  Star,
  Zap,
  Target,
  Brain,
  Flame,
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

  // Floating particles component
  const FloatingParticles = ({ color = "brand-primary", count = 8 }) => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`absolute w-1 h-1 bg-${color} rounded-full opacity-40 animate-pulse`}
          style={{
            left: `${10 + ((i * 11) % 80)}%`,
            top: `${15 + ((i * 13) % 70)}%`,
            animationDelay: `${i * 0.8}s`,
            animationDuration: `${3 + (i % 3)}s`,
          }}
        />
      ))}
    </div>
  );

  if (type === "no-cards") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] relative overflow-hidden">
        {/* Enhanced animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-20 left-1/4 w-40 h-40 bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDuration: "4s" }}
          />
          <div
            className="absolute bottom-20 right-1/4 w-32 h-32 bg-gradient-to-br from-brand-tertiary/8 to-brand-accent/8 rounded-full blur-2xl animate-pulse"
            style={{ animationDelay: "2s", animationDuration: "5s" }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-brand-primary/5 via-brand-secondary/5 to-brand-tertiary/5 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s", animationDuration: "6s" }}
          />
        </div>

        <FloatingParticles color="brand-primary" count={6} />

        <div className="relative z-10 text-center max-w-md">
          {/* Enhanced icon container with multiple animation layers */}
          <div className="relative mb-8 group">
            {/* Outer glow ring */}
            <div className="absolute -inset-4 bg-gradient-to-r from-brand-primary/20 to-brand-secondary/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700 animate-pulse" />

            {/* Main icon container */}
            <div className="relative">
              <div className="w-24 h-24 surface-elevated rounded-3xl flex items-center justify-center mx-auto shadow-brand-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 border border-subtle group-hover:border-brand overflow-hidden">
                <BookOpen className="w-12 h-12 text-muted group-hover:text-brand-primary transition-colors duration-300" />

                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
              </div>

              {/* Floating accent */}
              <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-brand rounded-full flex items-center justify-center animate-bounce shadow-brand">
                <Sparkles className="w-5 h-5 text-white" />
              </div>

              {/* Orbiting particles */}
              <div
                className="absolute inset-0 animate-spin"
                style={{ animationDuration: "20s" }}
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-brand-secondary rounded-full opacity-60" />
              </div>
              <div
                className="absolute inset-0 animate-spin"
                style={{
                  animationDuration: "15s",
                  animationDirection: "reverse",
                }}
              >
                <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-1.5 h-1.5 bg-brand-tertiary rounded-full opacity-40" />
              </div>
            </div>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4 bg-gradient-to-r from-text-primary via-brand-primary to-brand-secondary bg-clip-text">
            No flashcards found
          </h2>
          <p className="text-text-muted text-lg mb-8 leading-relaxed">
            Start building your knowledge base by adding some flashcards to this
            project
          </p>

          {/* Enhanced call to action card */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-primary/20 to-brand-secondary/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all duration-300" />
            <div className="relative card surface-elevated border border-subtle shadow-brand backdrop-blur p-8 max-w-sm mx-auto rounded-2xl overflow-hidden">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-5">
                <svg
                  className="w-full h-full"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <pattern
                      id="no-cards-pattern"
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
                  <rect
                    width="100"
                    height="100"
                    fill="url(#no-cards-pattern)"
                  />
                </svg>
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 rounded-xl border border-brand/20">
                    <TrendingUp className="w-6 h-6 brand-primary" />
                  </div>
                  <span className="font-bold text-xl text-secondary">
                    Get Started
                  </span>
                </div>
                <p className="text-sm text-muted mb-6 leading-relaxed">
                  Add flashcards to begin your learning journey and track your
                  progress with AI-powered spaced repetition
                </p>

                {/* Progress steps */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-6 h-6 rounded-full bg-gradient-brand text-white text-xs flex items-center justify-center font-bold">
                      1
                    </div>
                    <span className="text-secondary">
                      Create your first flashcard
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm opacity-60">
                    <div className="w-6 h-6 rounded-full bg-surface-secondary text-muted text-xs flex items-center justify-center font-bold">
                      2
                    </div>
                    <span className="text-muted">Start learning sessions</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm opacity-40">
                    <div className="w-6 h-6 rounded-full bg-surface-secondary text-muted text-xs flex items-center justify-center font-bold">
                      3
                    </div>
                    <span className="text-muted">Track your progress</span>
                  </div>
                </div>
              </div>
            </div>
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
      <div className="flex flex-col items-center justify-center min-h-[75vh] relative overflow-hidden">
        {/* Enhanced animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-16 left-1/3 w-48 h-48 bg-gradient-to-r from-yellow-500/8 to-orange-500/8 rounded-full blur-3xl animate-pulse"
            style={{ animationDuration: "3s" }}
          />
          <div
            className="absolute bottom-16 right-1/3 w-36 h-36 bg-gradient-to-r from-brand-primary/10 to-brand-secondary/10 rounded-full blur-2xl animate-pulse"
            style={{ animationDelay: "1.5s", animationDuration: "4s" }}
          />
        </div>

        <FloatingParticles color="yellow-400" count={5} />

        <div className="relative z-10 text-center max-w-lg">
          {/* Enhanced clock icon with multiple animation layers */}
          <div className="relative mb-8 group">
            {/* Outer pulse rings */}
            <div className="absolute inset-0 w-32 h-32 border-2 border-yellow-500/20 rounded-3xl mx-auto animate-ping" />
            <div
              className="absolute inset-0 w-32 h-32 border-2 border-yellow-500/30 rounded-3xl mx-auto animate-ping"
              style={{ animationDelay: "0.5s" }}
            />

            {/* Main clock container */}
            <div className="relative w-32 h-32 surface-elevated rounded-3xl flex items-center justify-center mx-auto shadow-brand-lg border-2 border-yellow-500/30 overflow-hidden">
              <Clock className="w-16 h-16 text-yellow-500 relative z-10" />

              {/* Rotating background */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 animate-spin"
                style={{ animationDuration: "8s" }}
              />

              {/* Pulse overlay */}
              <div className="absolute inset-0 bg-yellow-500/10 animate-pulse" />
            </div>

            {/* Floating time indicators */}
            <div className="absolute -top-4 -left-4 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div
              className="absolute -bottom-4 -right-4 w-6 h-6 bg-orange-400 rounded-full flex items-center justify-center animate-bounce"
              style={{ animationDelay: "0.5s" }}
            >
              <Brain className="w-3 h-3 text-white" />
            </div>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4 bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text">
            Learning in progress
          </h2>

          {/* Enhanced timer display */}
          <div className="relative group mb-6">
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all duration-300" />
            <div className="relative card surface-elevated border-2 border-yellow-500/30 shadow-brand-lg backdrop-blur p-8 rounded-2xl overflow-hidden">
              {/* Background animation */}
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-orange-500/5" />

              <div className="relative z-10">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <div className="relative">
                    <div className="w-4 h-4 bg-yellow-500 rounded-full animate-pulse" />
                    <div className="absolute inset-0 w-4 h-4 bg-yellow-500 rounded-full animate-ping opacity-40" />
                  </div>
                  <span className="text-xl font-bold text-secondary">
                    Next card available
                  </span>
                </div>

                {timeUntilNext > 0 ? (
                  <div className="flex items-center justify-center gap-6 mb-4">
                    {minutesUntilNext > 0 && (
                      <div className="text-center group">
                        <div className="text-4xl md:text-5xl font-bold brand-primary mb-2 transform group-hover:scale-110 transition-transform duration-200">
                          {minutesUntilNext}
                        </div>
                        <div className="text-sm text-muted font-semibold uppercase tracking-wider">
                          minutes
                        </div>
                      </div>
                    )}
                    {minutesUntilNext > 0 && (
                      <div className="text-4xl font-bold text-muted animate-pulse">
                        :
                      </div>
                    )}
                    <div className="text-center group">
                      <div className="text-4xl md:text-5xl font-bold brand-secondary mb-2 transform group-hover:scale-110 transition-transform duration-200">
                        {displaySeconds.toString().padStart(2, "0")}
                      </div>
                      <div className="text-sm text-muted font-semibold uppercase tracking-wider">
                        seconds
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3 text-green-500 mb-4">
                    <CheckCircle className="w-8 h-8 animate-bounce" />
                    <span className="text-2xl font-bold">Ready now!</span>
                  </div>
                )}

                {/* Progress visualization */}
                <div className="w-full bg-surface-secondary rounded-full h-2 mb-4">
                  <div
                    className="h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-1000"
                    style={{
                      width:
                        timeUntilNext > 0
                          ? `${Math.max(
                              10,
                              100 - (timeUntilNext / 60000) * 10
                            )}%`
                          : "100%",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <p className="text-text-muted mb-8 leading-relaxed text-lg">
            Your learning cards are being spaced out for optimal retention.{" "}
            <span className="text-brand-primary font-semibold">
              The wait makes your memory stronger!
            </span>
          </p>

          {onReset && (
            <button
              onClick={onReset}
              className="btn btn-outline interactive-hover border-2 border-subtle hover:border-brand hover:shadow-brand transition-all transition-normal px-8 py-3 rounded-xl font-semibold group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-glass opacity-0 group-hover:opacity-100 transition-opacity transition-normal" />
              <span className="relative z-10">End Session</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  if (type === "daily-limit-reached") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] relative overflow-hidden">
        {/* Celebration background with enhanced animations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-20 left-1/4 w-44 h-44 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDuration: "3s" }}
          />
          <div
            className="absolute bottom-20 right-1/4 w-36 h-36 bg-gradient-to-r from-brand-primary/8 to-brand-secondary/8 rounded-full blur-2xl animate-pulse"
            style={{ animationDelay: "1s", animationDuration: "4s" }}
          />
        </div>

        {/* Floating celebration particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${10 + ((i * 7) % 80)}%`,
                top: `${20 + ((i * 11) % 60)}%`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: `${2 + (i % 2)}s`,
              }}
            >
              {i % 3 === 0 ? (
                <Star className="w-3 h-3 text-yellow-400 opacity-60" />
              ) : i % 3 === 1 ? (
                <Sparkles className="w-4 h-4 text-green-400 opacity-50" />
              ) : (
                <Flame className="w-3 h-3 text-emerald-400 opacity-40" />
              )}
            </div>
          ))}
        </div>

        <div className="relative z-10 text-center max-w-lg">
          {/* Enhanced achievement icon with celebration effects */}
          <div className="relative mb-8 group">
            {/* Celebration rings */}
            <div className="absolute -inset-8 border-2 border-green-500/20 rounded-full animate-ping" />
            <div
              className="absolute -inset-12 border-2 border-emerald-500/15 rounded-full animate-ping"
              style={{ animationDelay: "0.5s" }}
            />
            <div
              className="absolute -inset-16 border-2 border-green-500/10 rounded-full animate-ping"
              style={{ animationDelay: "1s" }}
            />

            {/* Main achievement badge */}
            <div className="relative w-32 h-32 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-brand-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 border-4 border-white/20 overflow-hidden">
              <CheckCircle className="w-16 h-16 text-white drop-shadow-lg relative z-10" />

              {/* Rotating success glow */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-spin"
                style={{ animationDuration: "3s" }}
              />
            </div>

            {/* Success sparkles with staggered animations */}
            <div className="absolute -top-4 -right-4 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div
              className="absolute -bottom-4 -left-4 w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center animate-bounce shadow-lg"
              style={{ animationDelay: "0.3s" }}
            >
              <Star className="w-4 h-4 text-white" />
            </div>
            <div
              className="absolute top-0 left-0 w-6 h-6 bg-pink-400 rounded-full flex items-center justify-center animate-bounce shadow-lg"
              style={{ animationDelay: "0.6s" }}
            >
              <Zap className="w-3 h-3 text-white" />
            </div>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4 bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text">
            Daily goal achieved!
          </h2>

          {/* Enhanced celebration card */}
          <div className="relative group mb-6">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all duration-300" />
            <div className="relative card surface-elevated border-2 border-green-500/30 shadow-brand-lg backdrop-blur p-8 rounded-2xl overflow-hidden">
              {/* Celebration background pattern */}
              <div className="absolute inset-0 opacity-10">
                <svg
                  className="w-full h-full"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <pattern
                      id="celebration-pattern"
                      x="0"
                      y="0"
                      width="25"
                      height="25"
                      patternUnits="userSpaceOnUse"
                    >
                      <circle
                        cx="12.5"
                        cy="12.5"
                        r="2"
                        fill="currentColor"
                        className="text-green-500"
                      />
                      <circle
                        cx="5"
                        cy="5"
                        r="1"
                        fill="currentColor"
                        className="text-emerald-400"
                      />
                      <circle
                        cx="20"
                        cy="8"
                        r="1.5"
                        fill="currentColor"
                        className="text-yellow-400"
                      />
                    </pattern>
                  </defs>
                  <rect
                    width="100"
                    height="100"
                    fill="url(#celebration-pattern)"
                  />
                </svg>
              </div>

              <div className="relative z-10">
                <div className="flex items-center justify-center gap-4 mb-6">
                  <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30">
                    <Coffee className="w-8 h-8 text-green-500" />
                  </div>
                  <span className="text-2xl font-bold text-secondary">
                    Congratulations!
                  </span>
                </div>

                <p className="text-muted leading-relaxed text-lg mb-6">
                  You&apos;ve completed all your scheduled cards for today. Your
                  brain is building stronger neural pathways with each review
                  session.
                </p>

                {/* Achievement stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 surface-glass rounded-xl border border-green-500/20">
                    <div className="text-2xl font-bold text-green-500 mb-1">
                      100%
                    </div>
                    <div className="text-xs text-muted uppercase tracking-wider">
                      Complete
                    </div>
                  </div>
                  <div className="text-center p-4 surface-glass rounded-xl border border-emerald-500/20">
                    <Brain className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                    <div className="text-xs text-muted uppercase tracking-wider">
                      Optimized
                    </div>
                  </div>
                  <div className="text-center p-4 surface-glass rounded-xl border border-yellow-500/20">
                    <div className="text-2xl font-bold text-yellow-500 mb-1">
                      🧠
                    </div>
                    <div className="text-xs text-muted uppercase tracking-wider">
                      Stronger
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="text-text-muted mb-8 leading-relaxed text-lg">
            Come back tomorrow for your next study session, or continue with
            unlimited practice mode to keep the momentum going!
          </p>

          {onReset && (
            <button
              onClick={onReset}
              className="relative bg-gradient-brand hover:bg-gradient-brand-hover text-white border-0 shadow-brand hover:shadow-brand-lg transition-all transition-normal px-8 py-4 rounded-xl font-bold group overflow-hidden transform hover:scale-105"
            >
              {/* Button shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />

              <div className="relative z-10 flex items-center gap-3">
                <Sparkles className="w-5 h-5" />
                <span>Continue Practice Mode</span>
                <Zap className="w-4 h-4" />
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
        <div
          className="absolute top-16 right-1/3 w-40 h-40 bg-gradient-glass opacity-20 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "5s" }}
        />
        <div
          className="absolute bottom-24 left-1/4 w-32 h-32 bg-gradient-to-r from-brand-primary/8 to-brand-secondary/8 rounded-full blur-2xl animate-pulse"
          style={{ animationDelay: "2s", animationDuration: "6s" }}
        />
      </div>

      <FloatingParticles color="brand-primary" count={4} />

      <div className="relative z-10 text-center max-w-lg">
        {/* Enhanced rest icon */}
        <div className="relative mb-8 group">
          <div className="w-28 h-28 surface-elevated rounded-3xl flex items-center justify-center mx-auto shadow-brand border-2 border-subtle group-hover:border-brand transition-all duration-300 overflow-hidden">
            <Clock className="w-14 h-14 text-muted group-hover:text-brand-primary transition-colors duration-300 relative z-10" />

            {/* Gentle pulse background */}
            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-brand-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>

          {/* Zen particles */}
          <div
            className="absolute top-2 right-2 w-3 h-3 bg-brand-primary rounded-full opacity-60 animate-pulse"
            style={{ animationDuration: "3s" }}
          />
          <div
            className="absolute bottom-2 left-2 w-2 h-2 bg-brand-secondary rounded-full opacity-40 animate-pulse"
            style={{ animationDelay: "1s", animationDuration: "4s" }}
          />
        </div>

        <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
          All caught up!
        </h2>

        {/* Enhanced status card */}
        <div className="relative group mb-6">
          <div className="absolute -inset-1 bg-gradient-glass rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all duration-300" />
          <div className="relative card surface-elevated border border-subtle shadow-brand backdrop-blur p-8 rounded-2xl overflow-hidden">
            {/* Peaceful background pattern */}
            <div className="absolute inset-0 opacity-5">
              <svg
                className="w-full h-full"
                viewBox="0 0 60 60"
                preserveAspectRatio="none"
              >
                <defs>
                  <pattern
                    id="peaceful-pattern"
                    x="0"
                    y="0"
                    width="30"
                    height="30"
                    patternUnits="userSpaceOnUse"
                  >
                    <circle
                      cx="15"
                      cy="15"
                      r="1"
                      fill="currentColor"
                      className="text-brand-primary"
                    />
                  </pattern>
                </defs>
                <rect width="60" height="60" fill="url(#peaceful-pattern)" />
              </svg>
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Target className="w-6 h-6 text-green-500" />
                <span className="text-xl font-bold text-secondary">
                  Perfect timing
                </span>
              </div>
              <p className="text-secondary leading-relaxed text-lg">
                No cards are ready for review right now. Your spaced repetition
                schedule is working perfectly to optimize your memory retention!
              </p>
            </div>
          </div>
        </div>

        <p className="text-text-muted mb-8 text-lg">
          Check back later when more cards are due for review, or practice with
          all cards anytime
        </p>

        {onReset && (
          <button
            onClick={onReset}
            className="btn btn-outline interactive-hover border-2 border-subtle hover:border-brand hover:shadow-brand transition-all transition-normal px-8 py-3 rounded-xl font-semibold group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-glass opacity-0 group-hover:opacity-100 transition-opacity transition-normal" />
            <div className="relative z-10 flex items-center gap-3">
              <BookOpen className="w-5 h-5" />
              <span>Practice All Cards</span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
