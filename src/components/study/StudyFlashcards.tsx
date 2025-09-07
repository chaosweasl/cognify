"use client";
import React, { useState, useEffect, useCallback } from "react";
import { AnkiRatingControls } from "./AnkiRatingControls";
import { useUserId } from "@/hooks/useUserId";
import { CacheInvalidation } from "@/hooks/useCache";
import { scheduleSRSReminderForProject } from "@/lib/utils/scheduleSRSReminderClient";
import { createClient } from "@/lib/supabase/client";
import { saveSRSStates } from "@/lib/srs/SRSDBUtils";
import {
  initSRSStateWithSettings,
  scheduleSRSCardWithSettings,
  SRSRating,
  SRSCardState,
} from "@/lib/srs/SRSScheduler";
import {
  getNextCardToStudyWithProjectSettings,
  initStudySessionWithFallback,
  updateStudySession,
  getSessionAwareStudyStatsForProject,
  StudySession,
  hasLearningCards,
  isStudySessionCompleteForProject,
  migrateDailyStudyDataToDatabase,
  ProjectSRSSettings,
} from "@/lib/srs/SRSSession";

// Import sub-components
import { DailyLimitsProgress } from "./DailyLimitsProgress";
import { CardTypeIndicator } from "./CardTypeIndicator";
import { FlashcardDisplay } from "../flashcards/FlashcardDisplay";
import { SessionComplete } from "./SessionComplete";
import { EmptyFlashcardState } from "../flashcards/EmptyFlashcardState";
import { Flashcard, Project } from "../../types";
import { useRouter } from "next/navigation";
import { RotateCcw, Pencil } from "lucide-react";

interface StudyFlashcardsProps {
  flashcards: Flashcard[];
  project: Project;
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
    is_ai_generated: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    front: "What is 2 + 2?",
    back: "4",
    project_id: "demo",
    extra: {},
    is_ai_generated: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    front: "Who wrote Romeo and Juliet?",
    back: "William Shakespeare",
    project_id: "demo",
    extra: {},
    is_ai_generated: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Inline StudyHeader component
interface StudyHeaderProps {
  projectName: string;
  projectId: string;
  onReset: () => void;
}

function StudyHeader({ projectName, projectId, onReset }: StudyHeaderProps) {
  const router = useRouter();

  return (
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
            onClick={onReset}
            className="btn btn-ghost btn-sm gap-2"
            title="Reset session"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

// Inline StudyStats component
interface StudyStatsProps {
  newCards: number;
  learningCards: number;
  dueCards: number;
}

function StudyStats({ newCards, learningCards, dueCards }: StudyStatsProps) {
  const totalDueCards = dueCards || 0;

  return (
    <div className="grid grid-cols-3 gap-4 mb-4">
      <div className="surface-elevated rounded-lg p-3 text-center border border-subtle">
        <div
          className={`text-lg font-bold ${
            newCards > 0 ? "brand-primary" : "text-muted"
          }`}
        >
          {newCards}
        </div>
        <div className="text-xs text-muted">New</div>
      </div>
      <div className="surface-elevated rounded-lg p-3 text-center border border-subtle">
        <div
          className={`text-lg font-bold ${
            learningCards > 0 ? "text-status-warning" : "text-muted"
          }`}
        >
          {learningCards}
        </div>
        <div className="text-xs text-muted">Learning</div>
      </div>
      <div className="surface-elevated rounded-lg p-3 text-center border border-subtle">
        <div
          className={`text-lg font-bold ${
            totalDueCards > 0 ? "text-status-success" : "text-muted"
          }`}
        >
          {totalDueCards}
        </div>
        <div className="text-xs text-muted">Due</div>
      </div>
    </div>
  );
}

// Inline SessionProgress component
interface SessionProgressProps {
  reviewed: number;
  learningQueueCount: number;
}

function SessionProgress({
  reviewed,
  learningQueueCount,
}: SessionProgressProps) {
  return (
    <>
      <div className="mt-6 text-center">
        <div className="text-sm text-base-content/70">
          Session: {reviewed} cards reviewed
        </div>
        {learningQueueCount > 0 && (
          <div className="text-xs text-orange-600 mt-1">
            {learningQueueCount} card{learningQueueCount === 1 ? "" : "s"} in
            learning queue
          </div>
        )}
        {reviewed > 0 && learningQueueCount === 0 && (
          <div className="text-xs text-green-600 mt-1">
            ✓ Learning queue empty
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
        <div className="lg:hidden text-center mt-2">
          <div>Tap to flip • Use buttons to rate</div>
        </div>
      </div>
    </>
  );
}

export default function StudyFlashcards({
  flashcards,
  project,
  existingSRSStates,
}: StudyFlashcardsProps) {
  const userId = useUserId();
  const supabase = createClient();

  // Convert project settings to SRSSettings format
  const srsSettings = React.useMemo(
    () => ({
      NEW_CARDS_PER_DAY: project.new_cards_per_day,
      MAX_REVIEWS_PER_DAY: project.max_reviews_per_day,
      LEARNING_STEPS: project.learning_steps,
      RELEARNING_STEPS: project.relearning_steps,
      GRADUATING_INTERVAL: project.graduating_interval,
      EASY_INTERVAL: project.easy_interval,
      STARTING_EASE: project.starting_ease,
      MINIMUM_EASE: project.minimum_ease,
      EASY_BONUS: project.easy_bonus,
      HARD_INTERVAL_FACTOR: project.hard_interval_factor,
      EASY_INTERVAL_FACTOR: project.easy_interval_factor,
      LAPSE_RECOVERY_FACTOR: project.lapse_recovery_factor,
      LAPSE_EASE_PENALTY: project.lapse_ease_penalty,
      INTERVAL_MODIFIER: 1.0, // Not stored in project, use default
      LEECH_THRESHOLD: project.leech_threshold,
      LEECH_ACTION: project.leech_action,
      NEW_CARD_ORDER: project.new_card_order,
      REVIEW_AHEAD: project.review_ahead,
      BURY_SIBLINGS: project.bury_siblings,
      MAX_INTERVAL: project.max_interval,
    }),
    [project]
  );

  // Create project-specific settings from project data
  const projectSettings: ProjectSRSSettings = React.useMemo(
    () => ({
      projectId: project.id,
      newCardsPerDay: project.new_cards_per_day,
      maxReviewsPerDay: project.max_reviews_per_day,
    }),
    [project.id, project.new_cards_per_day, project.max_reviews_per_day]
  );

  // Settings are auto-loaded by the enhanced hook

  // Initialize study session asynchronously
  useEffect(() => {
    const initSession = async () => {
      try {
        // Migrate localStorage data to database if user is logged in
        if (userId) {
          await migrateDailyStudyDataToDatabase(userId);
        }

        // Initialize session with database or fallback to localStorage
        const session = await initStudySessionWithFallback(
          userId || undefined,
          project.id
        );
        setStudySession(session);
      } catch (error) {
        console.error("Failed to initialize study session:", error);
        // Use default session on error
      }
    };

    initSession();
  }, [userId, project.id]);

  // Initialize SRS state
  const [srsState, setSRSState] = useState<Record<string, SRSCardState>>(() => {
    if (existingSRSStates && Object.keys(existingSRSStates).length > 0) {
      return existingSRSStates;
    }
    const cardIds = (flashcards?.length > 0 ? flashcards : demoFlashcards).map(
      (c) => c.id
    );
    return initSRSStateWithSettings(cardIds, srsSettings, project.id);
  });

  // Study session state - initialize with empty session, load async
  const [studySession, setStudySession] = useState<StudySession>({
    projectStats: {},
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
      if (userId && project.id) {
        try {
          await saveSRSStates(supabase, userId, project.id, states);
          console.log("SRS states saved to database");

          // Invalidate cache to ensure project stats update across the app
          CacheInvalidation.invalidatePattern("user_projects");
          CacheInvalidation.invalidatePattern(`project_${project.id}`);
          CacheInvalidation.invalidatePattern("project_stats_");
        } catch (error) {
          console.error("Failed to save SRS states:", error);
        }
      }
    },
    [userId, project.id, supabase]
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
    () =>
      getSessionAwareStudyStatsForProject(
        srsState,
        studySession,
        srsSettings,
        projectSettings
      ),
    [srsState, studySession, srsSettings, projectSettings]
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
          userId || "",
          project.id // Pass the project ID
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
            const nextCardId = getNextCardToStudyWithProjectSettings(
              currentSRSState,
              currentSession,
              srsSettings,
              projectSettings,
              updatedNow // Pass consistent timestamp
            );

            if (nextCardId) {
              setCurrentCardId(nextCardId);
            } else {
              // Use the proper session completion check
              if (
                isStudySessionCompleteForProject(
                  currentSRSState,
                  currentSession,
                  srsSettings,
                  projectSettings,
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
      projectSettings,
      project.id,
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
          const nextCardId = getNextCardToStudyWithProjectSettings(
            srsState,
            studySession,
            srsSettings,
            projectSettings,
            now
          );
          if (nextCardId) {
            setCurrentCardId(nextCardId);
          }
        }, Math.min(Math.max(100, timeUntilNext + 100), 30000)); // Max 30 seconds, min 100ms

        return () => clearTimeout(timer);
      }
    }
  }, [
    currentCardId,
    sessionComplete,
    srsState,
    studySession,
    srsSettings,
    projectSettings,
  ]);

  useEffect(() => {
    if (!currentCardId && !sessionComplete) {
      const now = Date.now(); // Use current timestamp
      const nextCardId = getNextCardToStudyWithProjectSettings(
        srsState,
        studySession,
        srsSettings,
        projectSettings,
        now // Pass consistent timestamp
      );
      setCurrentCardId(nextCardId);

      // Use the proper session completion check
      if (
        isStudySessionCompleteForProject(
          srsState,
          studySession,
          srsSettings,
          projectSettings,
          now
        )
      ) {
        setSessionComplete(true);
      }
    }
  }, [
    srsState,
    studySession,
    currentCardId,
    sessionComplete,
    srsSettings,
    projectSettings,
  ]);
  useEffect(() => {
    if (sessionComplete && userId && project.id && project.name) {
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
            project_id: project.id,
            project_name: project.name,
            due: nextDue,
          });
        }
      }
    }
  }, [sessionComplete, userId, project.id, project.name, srsState]);

  // Save on component unmount
  useEffect(() => {
    return () => {
      if (userId && project.id) {
        saveSRSStatesToDB(srsState);
      }
    };
  }, [userId, project.id, srsState, saveSRSStatesToDB]);

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
          dueCards: availableStats.dueReviewCards,
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
        projectName={project.name}
        projectId={project.id}
        onReset={handleReset}
      />

      <div className="w-full max-w-2xl">
        <StudyStats
          newCards={availableStats.availableNewCards}
          learningCards={availableStats.totalLearningCards}
          dueCards={availableStats.dueReviewCards}
        />

        <DailyLimitsProgress
          newCardsStudied={
            studySession.projectStats[project.id]?.newCardsStudied || 0
          }
          reviewsCompleted={
            studySession.projectStats[project.id]?.reviewsCompleted || 0
          }
          newCardsPerDay={project.new_cards_per_day}
          maxReviewsPerDay={project.max_reviews_per_day}
        />

        <CardTypeIndicator
          cardState={currentCardState}
          srsSettings={srsSettings}
        />
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
