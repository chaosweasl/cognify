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
  SRSRating,
  SRSCardState,
} from "./SRSScheduler";
import {
  getNextCardToStudyWithSettings,
  initStudySessionWithFallback,
  updateStudySession,
  getSessionAwareStudyStats,
  StudySession,
  hasLearningCards,
  isStudySessionComplete,
  migrateDailyStudyDataToDatabase,
} from "./SRSSession";

// Import sub-components
import { StudyHeader } from "./StudyHeader";
import { StudyStats } from "./StudyStats";
import { DailyLimitsProgress } from "./DailyLimitsProgress";
import { CardTypeIndicator } from "./CardTypeIndicator";
import { FlashcardDisplay } from "./FlashcardDisplay";
import { SessionComplete } from "./SessionComplete";
import { EmptyFlashcardState } from "./EmptyFlashcardState";
import { SessionProgress } from "./SessionProgress";
import { Flashcard } from "../types/flashcard";

interface StudyFlashcardsProps {
  flashcards: Flashcard[];
  projectName: string;
  projectId: string;
  existingSRSStates?: Record<string, SRSCardState>;
}

// Demo data
const demoFlashcards: Flashcard[] = [
  { 
    id: "1", 
    front: "What is the capital of France?", 
    back: "Paris",
    project_id: "demo",
    extra: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  { 
    id: "2", 
    front: "What is 2 + 2?", 
    back: "4",
    project_id: "demo",
    extra: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "3",
    front: "Who wrote Romeo and Juliet?",
    back: "William Shakespeare",
    project_id: "demo",
    extra: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
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

  // Initialize study session asynchronously
  useEffect(() => {
    const initSession = async () => {
      try {
        // Migrate localStorage data to database if user is logged in
        if (userId) {
          await migrateDailyStudyDataToDatabase(userId);
        }

        // Initialize session with database or fallback to localStorage
        const session = await initStudySessionWithFallback(userId || undefined);
        setStudySession(session);
      } catch (error) {
        console.error("Failed to initialize study session:", error);
        // Use default session on error
      }
    };

    initSession();
  }, [userId]);

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

  // Study session state - initialize with empty session, load async
  const [studySession, setStudySession] = useState<StudySession>({
    newCardsStudied: 0,
    reviewsCompleted: 0,
    learningCardsInQueue: [],
    reviewHistory: [],
    buriedCards: new Set(),
    _incrementalCounters: {
      newCardsFromHistory: 0,
      reviewsFromHistory: 0,
      lastHistoryLength: 0,
    },
  });
  // Removed unused sessionInitialized state
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
    async (rating: SRSRating) => {
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
      console.log(
        `[StudyFlashcards] Scheduling card ${currentCard.id} with rating ${rating}`
      );
      console.log(`[StudyFlashcards] Previous state:`, currentCardState);

      const newCardState = scheduleSRSCardWithSettings(
        currentCardState,
        rating,
        srsSettings,
        now
      );

      console.log(`[StudyFlashcards] New card state:`, newCardState);

      // Update SRS state and save to database
      setSRSState((prev) => {
        const newSRSState = { ...prev, [currentCard.id]: newCardState };
        console.log(
          `[StudyFlashcards] Saving SRS states to database (${
            Object.keys(newSRSState).length
          } total states)`
        );
        // Debounced save to database
        debouncedSave(newSRSState);
        return newSRSState;
      });

      // Update study session (async)
      try {
        const updatedSession = await updateStudySession(
          studySession,
          currentCardState,
          rating,
          newCardState,
          srsState,
          srsSettings,
          userId || ""
        );
        setStudySession(updatedSession);
      } catch (error) {
        console.error("Failed to update study session:", error);
      }

      setFlipped(false);

      // Find next card after a short delay
      setTimeout(() => {
        const updatedNow = Date.now(); // Use current time for next card selection
        setSRSState((currentSRSState) => {
          setStudySession((currentSession) => {
            const nextCardId = getNextCardToStudyWithSettings(
              currentSRSState,
              currentSession,
              srsSettings,
              updatedNow // Pass consistent timestamp
            );

            if (nextCardId) {
              setCurrentCardId(nextCardId);
            } else {
              // Use the proper session completion check
              if (
                isStudySessionComplete(
                  currentSRSState,
                  currentSession,
                  srsSettings,
                  updatedNow
                )
              ) {
                setSessionComplete(true);
                setCurrentCardId(null);
                setSessionStats((prev) => ({
                  ...prev,
                  timeSpent: Math.round(
                    (updatedNow - sessionStartTime) / 1000 / 60
                  ),
                }));
              }
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
      srsState,
      studySession,
      userId,
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

  // Auto-refresh for learning cards becoming due
  useEffect(() => {
    if (!currentCardId && !sessionComplete) {
      // Find the next learning card due time
      const waitingLearningCards = Object.values(srsState).filter(
        (card) =>
          (card.state === "learning" || card.state === "relearning") &&
          !card.isSuspended &&
          card.due > Date.now()
      );

      if (waitingLearningCards.length > 0) {
        const nextDue = Math.min(...waitingLearningCards.map((c) => c.due));
        const timeUntilNext = nextDue - Date.now();

        // Set a timer to refresh when the next card is due (plus small buffer)
        const timer = setTimeout(() => {
          const now = Date.now();
          const nextCardId = getNextCardToStudyWithSettings(
            srsState,
            studySession,
            srsSettings,
            now
          );
          if (nextCardId) {
            setCurrentCardId(nextCardId);
          }
        }, Math.min(Math.max(100, timeUntilNext + 100), 30000)); // Max 30 seconds, min 100ms

        return () => clearTimeout(timer);
      }
    }
  }, [currentCardId, sessionComplete, srsState, studySession, srsSettings]);

  useEffect(() => {
    if (!currentCardId && !sessionComplete) {
      const now = Date.now(); // Use current timestamp
      const nextCardId = getNextCardToStudyWithSettings(
        srsState,
        studySession,
        srsSettings,
        now // Pass consistent timestamp
      );
      setCurrentCardId(nextCardId);

      // Use the proper session completion check
      if (isStudySessionComplete(srsState, studySession, srsSettings, now)) {
        setSessionComplete(true);
      }
    }
  }, [srsState, studySession, currentCardId, sessionComplete, srsSettings]);
  useEffect(() => {
    if (sessionComplete && userId && projectId && projectName) {
      // Only schedule reminders if there are NO learning cards left
      if (!hasLearningCards(srsState)) {
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
          learningCards: availableStats.totalLearningCards,
          reviewCards: availableStats.dueReviewCards,
        }}
        nextReview={nextReview}
      />
    );
  }

  if (!currentCard || !currentCardState) {
    // Check if we're waiting for learning cards
    const waitingLearningCards = Object.values(srsState).filter(
      (card) =>
        (card.state === "learning" || card.state === "relearning") &&
        !card.isSuspended &&
        card.due > Date.now()
    );

    if (waitingLearningCards.length > 0) {
      // Find the next learning card due
      const nextDue = Math.min(...waitingLearningCards.map((c) => c.due));
      return (
        <EmptyFlashcardState
          type="waiting-for-learning"
          nextLearningCardDue={nextDue}
          onReset={handleReset}
        />
      );
    }

    // Check if daily limits are reached and no learning/review cards available
    const hasAvailableCards =
      availableStats.dueCards > 0 || availableStats.availableNewCards > 0;

    if (!hasAvailableCards) {
      return (
        <EmptyFlashcardState type="daily-limit-reached" onReset={handleReset} />
      );
    }

    return <EmptyFlashcardState type="no-review-cards" onReset={handleReset} />;
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
          learningCards={availableStats.totalLearningCards}
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
