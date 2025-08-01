"use client";
import React, { useState, useEffect, useCallback } from "react";
import { AnkiRatingControls } from "./AnkiRatingControls";
import { useUserId } from "@/hooks/useUserId";
import { scheduleSRSReminderForProject } from "./scheduleSRSReminderClient";
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
} from "./SRSScheduler";

// Import sub-components
import { StudyHeader } from "./StudyHeader";
import { StudyStats } from "./StudyStats";
import { DailyLimitsProgress } from "./DailyLimitsProgress";
import { CardTypeIndicator } from "./CardTypeIndicator";
import { FlashcardDisplay } from "./FlashcardDisplay";
import { SessionComplete } from "./SessionComplete";
import { EmptyFlashcardState } from "./EmptyFlashcardState";
import { SessionProgress } from "./SessionProgress";

interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

interface StudyFlashcardsProps {
  flashcards: Flashcard[];
  projectName: string;
  projectId: string;
  existingSRSStates?: Record<string, SRSCardState>;
}

// Demo data
const demoFlashcards = [
  { id: "1", question: "What is the capital of France?", answer: "Paris" },
  { id: "2", question: "What is 2 + 2?", answer: "4" },
  {
    id: "3",
    question: "Who wrote Romeo and Juliet?",
    answer: "William Shakespeare",
  },
];

export default function StudyFlashcards({
  flashcards,
  projectName,
  projectId,
  existingSRSStates,
}: StudyFlashcardsProps) {
  const userId = useUserId();

  // Initialize SRS state
  const [srsState, setSRSState] = useState<Record<string, SRSCardState>>(() => {
    if (existingSRSStates && Object.keys(existingSRSStates).length > 0) {
      return existingSRSStates;
    }
    const cardIds = (flashcards?.length > 0 ? flashcards : demoFlashcards).map(
      (c) => c.id
    );
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

  const [sessionStartTime] = useState(Date.now());

  // Derived state
  const cards = flashcards?.length > 0 ? flashcards : demoFlashcards;
  const cardMap = React.useMemo(
    () => Object.fromEntries(cards.map((c) => [c.id, c])),
    [cards]
  );
  const currentCard = currentCardId ? cardMap[currentCardId] : null;
  const currentCardState = currentCardId ? srsState[currentCardId] : null;
  const studyStats = getStudyStats(srsState);

  // Event handlers
  const handleFlip = () => setFlipped((f) => !f);

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
      setSRSState((prev) => ({ ...prev, [currentCard.id]: newCardState }));

      // Update study session
      setStudySession((prev) =>
        updateStudySession(prev, currentCardState, rating, newCardState)
      );

      setFlipped(false);

      // Find next card after a short delay
      setTimeout(() => {
        const updatedSRSState = { ...srsState, [currentCard.id]: newCardState };
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
          setSessionComplete(true);
          setCurrentCardId(null);
          setSessionStats((prev) => ({
            ...prev,
            timeSpent: Math.round((now - sessionStartTime) / 1000 / 60),
          }));
        }
      }, 300);
    },
    [currentCard, currentCardState, srsState, studySession, sessionStartTime]
  );

  // Effects
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
  }, [currentCardId, flipped, srsState, handleRate, currentCard, handleReset]);

  useEffect(() => {
    if (!currentCardId && !sessionComplete) {
      const nextCardId = getNextCardToStudy(srsState, studySession);
      setCurrentCardId(nextCardId);
      if (!nextCardId) {
        setSessionComplete(true);
      }
    }
  }, [srsState, studySession, currentCardId, sessionComplete]);

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

  // Render conditions
  if (!cards || cards.length === 0) {
    return <EmptyFlashcardState type="no-cards" />;
  }

  if (sessionComplete) {
    const nextReviewTimes = Object.values(srsState)
      .map((c) => c.due)
      .filter((d) => d > Date.now())
      .sort((a, b) => a - b);
    const nextReview = nextReviewTimes.length > 0 ? nextReviewTimes[0] : null;

    return (
      <SessionComplete
        sessionStats={sessionStats}
        studyStats={studyStats}
        nextReview={nextReview}
        onReset={handleReset}
      />
    );
  }

  if (!currentCard || !currentCardState) {
    return <EmptyFlashcardState type="no-due-cards" onReset={handleReset} />;
  }

  // Main study interface
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <StudyHeader
        projectName={projectName}
        projectId={projectId}
        onReset={handleReset}
      />

      <div className="w-full max-w-2xl">
        <StudyStats
          newCards={studyStats.newCards}
          learningCards={studyStats.learningCards}
          reviewCards={studyStats.reviewCards}
          dueCards={studyStats.dueCards}
        />

        <DailyLimitsProgress
          newCardsStudied={studySession.newCardsStudied}
          reviewsCompleted={studySession.reviewsCompleted}
        />

        <CardTypeIndicator cardState={currentCardState} />
      </div>

      <FlashcardDisplay
        card={currentCard}
        flipped={flipped}
        onFlip={handleFlip}
      />

      <AnkiRatingControls flipped={flipped} handleRate={handleRate} />

      <SessionProgress
        reviewed={sessionStats.reviewed}
        learningQueueCount={studySession.learningCardsInQueue.length}
      />
    </div>
  );
}
