"use client";
import React, { useState, useEffect, useCallback } from "react";
import { AnkiRatingControls } from "./AnkiRatingControls";
import { useUserId } from "@/hooks/useUserId";
import { useSettingsStore } from "@/hooks/useSettings";
import { scheduleSRSReminderForProject } from "./scheduleSRSReminderClient";
import { createClient } from "@/utils/supabase/client";
import { saveSRSStates } from "./SRSDBUtils";
import {
  initSRSStateWithSettings,
  scheduleSRSCardWithSettings,
  getNextCardToStudyWithSettings,
  shouldEndStudySession,
  initStudySession,
  updateStudySession,
  getSessionAwareStudyStats,
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
  const supabase = createClient();
  const { loadSettings, srsSettings } = useSettingsStore();

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Initialize SRS state
  const [srsState, setSRSState] = useState<Record<string, SRSCardState>>(() => {
    if (existingSRSStates && Object.keys(existingSRSStates).length > 0) {
      return existingSRSStates;
    }
    const cardIds = (flashcards?.length > 0 ? flashcards : demoFlashcards).map(
      (c) => c.id
    );
    return initSRSStateWithSettings(cardIds, srsSettings);
  });

  // Study session state
  const [studySession, setStudySession] = useState<StudySession>(() =>
    initStudySession()
  );
  const [currentCardId, setCurrentCardId] = useState<string | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);

  // Prevent rating spam
  const [ratingLoading, setRatingLoading] = useState(false);

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

  // Auto-save SRS states to database with debounce
  const saveSRSStatesToDB = useCallback(
    async (states: Record<string, SRSCardState>) => {
      if (userId && projectId) {
        try {
          await saveSRSStates(supabase, userId, projectId, states);
          console.log("SRS states saved to database");
        } catch (error) {
          console.error("Failed to save SRS states:", error);
        }
      }
    },
    [userId, projectId, supabase]
  );

  // Debounced save function to prevent excessive database calls
  const debouncedSave = useCallback(() => {
    let timeoutId: NodeJS.Timeout;
    return (states: Record<string, SRSCardState>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        saveSRSStatesToDB(states);
      }, 1000); // Save after 1 second of inactivity
    };
  }, [saveSRSStatesToDB])();

  // Derived state - recalculate stats dynamically
  const cards = flashcards?.length > 0 ? flashcards : demoFlashcards;
  const cardMap = React.useMemo(
    () => Object.fromEntries(cards.map((c) => [c.id, c])),
    [cards]
  );
  const currentCard = currentCardId ? cardMap[currentCardId] : null;
  const currentCardState = currentCardId ? srsState[currentCardId] : null;

  // Recalculate session-aware stats on every SRS state change
  const availableStats = React.useMemo(
    () => getSessionAwareStudyStats(srsState, studySession, srsSettings),
    [srsState, studySession, srsSettings]
  );

  // Event handlers
  const handleFlip = () => setFlipped((f) => !f);

  const handleReset = useCallback(() => {
    // Don't reset the entire session, just continue with available cards
    setSessionComplete(false);
    setFlipped(false);
    setCurrentCardId(null);
    // Keep existing SRS state and study session progress
  }, []);

  const handleRate = useCallback(
    (rating: SRSRating) => {
      if (!currentCard || !currentCardState || ratingLoading) return;
      setRatingLoading(true);
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
      const newCardState = scheduleSRSCardWithSettings(
        currentCardState,
        rating,
        srsSettings,
        now
      );

      // Update SRS state and save to database
      setSRSState((prev) => {
        const newSRSState = { ...prev, [currentCard.id]: newCardState };
        // Debounced save to database
        debouncedSave(newSRSState);
        return newSRSState;
      });

      // Update study session
      setStudySession((prev) =>
        updateStudySession(
          prev,
          currentCardState,
          rating,
          newCardState,
          srsState,
          srsSettings
        )
      );

      setFlipped(false);

      // Find next card after a short delay
      setTimeout(() => {
        setSRSState((currentSRSState) => {
          setStudySession((currentSession) => {
            const nextCardId = getNextCardToStudyWithSettings(
              currentSRSState,
              currentSession,
              srsSettings,
              now
            );

            if (nextCardId) {
              setCurrentCardId(nextCardId);
            } else {
              // No next card available - session should end
              setSessionComplete(true);
              setCurrentCardId(null);
              setSessionStats((prev) => ({
                ...prev,
                timeSpent: Math.round((now - sessionStartTime) / 1000 / 60),
              }));
            }
            return currentSession;
          });
          return currentSRSState;
        });
        setRatingLoading(false);
      }, 300);
    },
    [
      currentCard,
      currentCardState,
      sessionStartTime,
      ratingLoading,
      debouncedSave,
      srsSettings,
    ]
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
      const nextCardId = getNextCardToStudyWithSettings(
        srsState,
        studySession,
        srsSettings
      );
      setCurrentCardId(nextCardId);

      // If no card is available, session should end
      if (!nextCardId) {
        setSessionComplete(true);
      }
    }
  }, [srsState, studySession, currentCardId, sessionComplete, srsSettings]);
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

  // Save on component unmount
  useEffect(() => {
    return () => {
      if (userId && projectId) {
        saveSRSStatesToDB(srsState);
      }
    };
  }, [userId, projectId, srsState, saveSRSStatesToDB]);

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
        studyStats={{
          newCards: availableStats.availableNewCards,
          learningCards: availableStats.dueLearningCards,
          reviewCards: availableStats.dueReviewCards,
        }}
        nextReview={nextReview}
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
          newCards={availableStats.availableNewCards}
          learningCards={availableStats.dueLearningCards}
          reviewCards={availableStats.dueReviewCards}
          dueCards={availableStats.dueCards}
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

      <AnkiRatingControls
        flipped={flipped}
        handleRate={handleRate}
        ratingLoading={ratingLoading}
        cardState={currentCardState}
      />

      <SessionProgress
        reviewed={sessionStats.reviewed}
        learningQueueCount={studySession.learningCardsInQueue.length}
      />
    </div>
  );
}
