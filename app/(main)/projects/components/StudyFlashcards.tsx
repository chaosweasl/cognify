"use client";
import React, { useState, useEffect, useCallback } from "react";
import { AnkiRatingControls } from "./AnkiRatingControls";
import { useUserId } from "@/hooks/useUserId";
import { scheduleSRSReminderForProject } from "./scheduleSRSReminderClient";
import { RotateCcw, BookOpen, Pencil, Clock, Target, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  initSRSState,
  scheduleSRSCard,
  getNextCardToStudy,
  initStudySession,
  updateStudySession,
  getStudyStats,
  SRSRating,
  SRSCardState,
  StudySession,
  SRS_SETTINGS,
} from "./SRSScheduler";

interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

interface StudyFlashcardsProps {
  flashcards: Flashcard[];
  projectName: string;
  projectId: string;
  // Optional: existing SRS states from database
  existingSRSStates?: Record<string, SRSCardState>;
}

export default function StudyFlashcards({
  flashcards,
  projectName,
  projectId,
  existingSRSStates,
}: StudyFlashcardsProps) {
  const userId = useUserId();
  const router = useRouter();

  // Initialize SRS state (use existing states or create new ones)
  const [srsState, setSRSState] = useState<Record<string, SRSCardState>>(() => {
    if (existingSRSStates && Object.keys(existingSRSStates).length > 0) {
      return existingSRSStates;
    }
    const cardIds = (
      flashcards && flashcards.length > 0 ? flashcards : demoFlashcards
    ).map((c) => c.id);
    return initSRSState(cardIds);
  });

  // Study session state
  const [studySession, setStudySession] = useState<StudySession>(() =>
    initStudySession()
  );
  const [currentCardId, setCurrentCardId] = useState<string | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);

  // Session statistics
  const [sessionStats, setSessionStats] = useState({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
    reviewed: 0,
    timeSpent: 0,
  });

  // Timer for session
  const [sessionStartTime] = useState(Date.now());

  const demoFlashcards = [
    { id: "1", question: "What is the capital of France?", answer: "Paris" },
    { id: "2", question: "What is 2 + 2?", answer: "4" },
    {
      id: "3",
      question: "Who wrote Romeo and Juliet?",
      answer: "William Shakespeare",
    },
  ];

  const cards =
    flashcards && flashcards.length > 0 ? flashcards : demoFlashcards;
  const cardMap = React.useMemo(
    () => Object.fromEntries(cards.map((c) => [c.id, c])),
    [cards]
  );
  const currentCard = currentCardId ? cardMap[currentCardId] : null;
  const currentCardState = currentCardId ? srsState[currentCardId] : null;

  // Get study statistics
  const studyStats = getStudyStats(srsState);

  const handleFlip = () => setFlipped((f) => !f);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "f") {
        e.preventDefault();
        handleFlip();
      }
      if (["1", "2", "3", "4"].includes(e.key)) {
        if (flipped && currentCard) {
          handleRate((parseInt(e.key, 10) - 1) as SRSRating);
        }
      }
      if (e.key === "r") handleReset();
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentCardId, flipped, srsState]);

  const handleReset = () => {
    const cardIds = cards.map((c) => c.id);
    setSRSState(initSRSState(cardIds));
    setStudySession(initStudySession());
    setSessionComplete(false);
    setFlipped(false);
    setCurrentCardId(null);
    setSessionStats({
      again: 0,
      hard: 0,
      good: 0,
      easy: 0,
      reviewed: 0,
      timeSpent: 0,
    });
  };

  // Rate card and update states
  const handleRate = useCallback(
    (rating: SRSRating) => {
      if (!currentCard || !currentCardState) return;

      const now = Date.now();

      // Update session stats
      setSessionStats((prev) => {
        const newStats = { ...prev, reviewed: prev.reviewed + 1 };
        if (rating === 0) newStats.again += 1;
        if (rating === 1) newStats.hard += 1;
        if (rating === 2) newStats.good += 1;
        if (rating === 3) newStats.easy += 1;
        return newStats;
      });

      // Schedule the card
      const newCardState = scheduleSRSCard(currentCardState, rating, now);

      // Update SRS state
      setSRSState((prev) => ({
        ...prev,
        [currentCard.id]: newCardState,
      }));

      // Update study session
      setStudySession((prev) =>
        updateStudySession(prev, currentCardState, rating, newCardState)
      );

      setFlipped(false);

      // Find next card after a short delay
      setTimeout(() => {
        const updatedSRSState = {
          ...srsState,
          [currentCard.id]: newCardState,
        };

        const updatedSession = updateStudySession(
          studySession,
          currentCardState,
          rating,
          newCardState
        );
        const nextCardId = getNextCardToStudy(
          updatedSRSState,
          updatedSession,
          now
        );

        if (nextCardId) {
          setCurrentCardId(nextCardId);
        } else {
          // No more cards to study
          setSessionComplete(true);
          setCurrentCardId(null);

          // Update time spent
          setSessionStats((prev) => ({
            ...prev,
            timeSpent: Math.round((now - sessionStartTime) / 1000 / 60), // minutes
          }));
        }
      }, 300);
    },
    [currentCard, currentCardState, srsState, studySession, sessionStartTime]
  );

  // Initialize first card
  useEffect(() => {
    if (!currentCardId && !sessionComplete) {
      const nextCardId = getNextCardToStudy(srsState, studySession);
      setCurrentCardId(nextCardId);

      if (!nextCardId) {
        setSessionComplete(true);
      }
    }
  }, [srsState, studySession, currentCardId, sessionComplete]);

  // Schedule reminders when session is complete
  useEffect(() => {
    if (sessionComplete && userId && projectId && projectName) {
      const nextDue = Math.min(
        ...Object.values(srsState)
          .map((c) => c.due)
          .filter((d) => d > Date.now())
      );

      if (nextDue && nextDue < Infinity) {
        scheduleSRSReminderForProject({
          user_id: userId,
          project_id: projectId,
          project_name: projectName,
          due: nextDue,
        });
      }
    }
  }, [sessionComplete, userId, projectId, projectName, srsState]);

  if (!cards || cards.length === 0) {
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

  if (sessionComplete) {
    const nextReviewTimes = Object.values(srsState)
      .map((c) => c.due)
      .filter((d) => d > Date.now())
      .sort((a, b) => a - b);

    const nextReview = nextReviewTimes.length > 0 ? nextReviewTimes[0] : null;

    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <div className="w-full max-w-lg text-center space-y-6">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-success" />
            </div>
          </div>

          {/* Study Progress Overview */}
          <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
            <div className="text-sm font-medium text-base-content">
              Study Progress
            </div>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <div className="font-bold text-blue-600">
                  {studyStats.newCards}
                </div>
                <div className="text-base-content/70">New</div>
              </div>
              <div>
                <div className="font-bold text-orange-600">
                  {studyStats.learningCards}
                </div>
                <div className="text-base-content/70">Learning</div>
              </div>
              <div>
                <div className="font-bold text-green-600">
                  {studyStats.reviewCards}
                </div>
                <div className="text-base-content/70">Review</div>
              </div>
            </div>
          </div>

          {/* Next Review Info */}
          {nextReview ? (
            <div className="bg-base-200/50 rounded-lg p-4">
              <div className="text-sm text-base-content/70 mb-1">
                Next review scheduled
              </div>
              <div className="font-medium text-base-content">
                {new Date(nextReview).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          ) : (
            <div className="bg-base-200/50 rounded-lg p-4">
              <div className="text-sm text-base-content/70">
                No future reviews scheduled
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            <button className="btn btn-primary btn-wide" onClick={handleReset}>
              Study Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentCard || !currentCardState) {
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
          <button className="btn btn-primary" onClick={handleReset}>
            Study All Cards
          </button>
        </div>
      </div>
    );
  }

  // Get card type display info
  const getCardTypeInfo = (state: SRSCardState) => {
    switch (state.state) {
      case "new":
        return { label: "New", color: "text-blue-600", icon: Zap };
      case "learning":
        return {
          label: `Learning (${state.learningStep + 1}/${
            SRS_SETTINGS.LEARNING_STEPS.length
          })`,
          color: "text-orange-600",
          icon: Target,
        };
      case "relearning":
        return {
          label: `Relearning (${state.learningStep + 1}/${
            SRS_SETTINGS.RELEARNING_STEPS.length
          })`,
          color: "text-red-600",
          icon: RotateCcw,
        };
      case "review":
        return {
          label: `Review (${state.interval}d)`,
          color: "text-green-600",
          icon: BookOpen,
        };
      default:
        return { label: "Unknown", color: "text-gray-600", icon: BookOpen };
    }
  };

  const cardTypeInfo = getCardTypeInfo(currentCardState);
  const CardTypeIcon = cardTypeInfo.icon;

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      {/* Header */}
      <div className="w-full max-w-2xl mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <h2 className="text-2xl md:text-3xl font-bold text-primary">
            Study: {projectName || "Demo Flashcards"}
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => router.push(`/projects/${projectId}/edit`)}
              className="btn btn-outline btn-sm gap-2"
              title="Edit flashcards"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={handleReset}
              className="btn btn-ghost btn-sm gap-2"
              title="Reset session"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>

        {/* Study Statistics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-base-100 rounded-lg p-3 text-center border">
            <div className="text-lg font-bold text-blue-600">
              {studyStats.newCards}
            </div>
            <div className="text-xs text-base-content/70">New</div>
          </div>
          <div className="bg-base-100 rounded-lg p-3 text-center border">
            <div className="text-lg font-bold text-orange-600">
              {studyStats.learningCards}
            </div>
            <div className="text-xs text-base-content/70">Learning</div>
          </div>
          <div className="bg-base-100 rounded-lg p-3 text-center border">
            <div className="text-lg font-bold text-green-600">
              {studyStats.reviewCards}
            </div>
            <div className="text-xs text-base-content/70">Review</div>
          </div>
          <div className="bg-base-100 rounded-lg p-3 text-center border">
            <div className="text-lg font-bold text-primary">
              {studyStats.dueCards}
            </div>
            <div className="text-xs text-base-content/70">Due Now</div>
          </div>
        </div>

        {/* Daily Limits Progress */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-base-content/70">New cards today</span>
            <span className="font-medium">
              {studySession.newCardsStudied} / {SRS_SETTINGS.NEW_CARDS_PER_DAY}
            </span>
          </div>
          <div className="w-full bg-base-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(
                  100,
                  (studySession.newCardsStudied /
                    SRS_SETTINGS.NEW_CARDS_PER_DAY) *
                    100
                )}%`,
              }}
            />
          </div>

          {SRS_SETTINGS.MAX_REVIEWS_PER_DAY > 0 && (
            <>
              <div className="flex justify-between items-center text-sm">
                <span className="text-base-content/70">Reviews today</span>
                <span className="font-medium">
                  {studySession.reviewsCompleted} /{" "}
                  {SRS_SETTINGS.MAX_REVIEWS_PER_DAY}
                </span>
              </div>
              <div className="w-full bg-base-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      100,
                      (studySession.reviewsCompleted /
                        SRS_SETTINGS.MAX_REVIEWS_PER_DAY) *
                        100
                    )}%`,
                  }}
                />
              </div>
            </>
          )}
        </div>

        {/* Current Card Type */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <CardTypeIcon className={`w-5 h-5 ${cardTypeInfo.color}`} />
          <span className={`font-medium ${cardTypeInfo.color}`}>
            {cardTypeInfo.label}
          </span>
          {currentCardState.isLeech && (
            <span className="badge badge-error badge-sm">Leech</span>
          )}
        </div>
      </div>

      {/* Flashcard */}
      <div className="w-full flex justify-center mb-8">
        <div
          className="relative w-full max-w-2xl h-[300px] md:h-[350px] cursor-pointer select-none [perspective:1000px] group"
          onClick={handleFlip}
        >
          <div
            className={`absolute inset-0 w-full h-full transition-all duration-500 ease-in-out [transform-style:preserve-3d] group-hover:scale-[1.02] ${
              flipped ? "[transform:rotateY(180deg)]" : ""
            }`}
            style={{ willChange: "transform" }}
          >
            {/* Front */}
            <div
              className={`absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-base-100 to-base-200 shadow-xl rounded-2xl border-2 [backface-visibility:hidden] transition-all duration-300 border-base-300 hover:border-primary/50`}
            >
              <div className="text-center px-4 py-6">
                <div className="text-sm md:text-base lg:text-xl font-semibold text-base-content mb-6 leading-relaxed">
                  {currentCard.question}
                </div>
                <div className="flex items-center justify-center gap-2 text-base-content/60 text-sm">
                  <span>Click or press Space to reveal answer</span>
                </div>
              </div>
            </div>

            {/* Back */}
            <div
              className={`absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 shadow-xl rounded-2xl border-2 [backface-visibility:hidden] [transform:rotateY(180deg)] transition-all duration-300 border-primary/30`}
            >
              <div className="text-center px-4 py-6">
                <div className="text-sm md:text-base lg:text-xl font-semibold text-base-content mb-6 leading-relaxed">
                  {currentCard.answer}
                </div>
                <div className="flex items-center justify-center gap-2 text-base-content/60 text-sm">
                  <span>Click or press Space to show question</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Anki Rating Controls */}
      <AnkiRatingControls flipped={flipped} handleRate={handleRate} />

      {/* Session Progress */}
      <div className="mt-6 text-center">
        <div className="text-sm text-base-content/70">
          Session: {sessionStats.reviewed} cards reviewed
        </div>
        {studySession.learningCardsInQueue.length > 0 && (
          <div className="text-xs text-orange-600 mt-1">
            {studySession.learningCardsInQueue.length} cards in learning queue
          </div>
        )}
      </div>

      {/* Shortcuts */}
      <div className="mt-4 text-xs text-base-content/50 text-center">
        <div className="hidden lg:flex flex-wrap justify-center gap-4">
          <span>Space / F: Flip</span>
          <span>1: Again</span>
          <span>2: Hard</span>
          <span>3: Good</span>
          <span>4: Easy</span>
          <span>R: Reset</span>
        </div>
      </div>
    </div>
  );
}
