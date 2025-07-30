"use client";
import React, { useState, useEffect, useCallback } from "react";
import { AnkiRatingControls } from "./AnkiRatingControls";
import { useUserId } from "@/hooks/useUserId";
import { scheduleSRSReminderForProject } from "./scheduleSRSReminderClient";
import { RotateCcw, BookOpen, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  initSRSState,
  scheduleSRSCard,
  getNextDueCardId,
  SRSRating,
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
}

export default function StudyFlashcards({
  flashcards,
  projectName,
  projectId,
}: StudyFlashcardsProps) {
  const userId = useUserId();
  const router = useRouter();
  const [ankiState, setAnkiState] = useState(() =>
    initSRSState(
      (flashcards && flashcards.length > 0 ? flashcards : demoFlashcards).map(
        (c) => c.id
      )
    )
  );
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [sessionDone, setSessionDone] = useState(false);

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
  // Map of id to card
  const cardMap = React.useMemo(
    () => Object.fromEntries(cards.map((c) => [c.id, c])),
    [cards]
  );
  const card = currentId ? cardMap[currentId] : null;

  const handleFlip = () => setFlipped((f) => !f);

  // Keyboard shortcuts: flip (space/f), rate (1-4), reset (r)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "f") {
        e.preventDefault();
        handleFlip();
      }
      if (["1", "2", "3", "4"].includes(e.key)) {
        if (flipped) {
          handleRate((parseInt(e.key, 10) - 1) as SRSRating);
        }
      }
      if (e.key === "r") handleReset();
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
    // eslint-disable-next-line
  }, [currentId, flipped, ankiState]);

  const handleReset = () => {
    setAnkiState(initSRSState(cards.map((c) => c.id)));
    setSessionDone(false);
    setFlipped(false);
    setCurrentId(null);
  };

  // Rate card: 0=Again, 1=Hard, 2=Good, 3=Easy
  const handleRate = useCallback(
    (rating: SRSRating) => {
      if (!card) return;
      const now = Date.now();
      setAnkiState((prev) => ({
        ...prev,
        [card.id]: scheduleSRSCard(prev[card.id], rating, now),
      }));
      setFlipped(false);
      // Find next due card
      setTimeout(() => {
        setCurrentId((prevId) => {
          const updatedState = {
            ...ankiState,
            [card.id]: scheduleSRSCard(ankiState[card.id], rating, now),
          };
          // Only exclude the just-answered card if it's not due now
          const exclude = updatedState[card.id].due > now ? [card.id] : [];
          const nextId = getNextDueCardId(updatedState, exclude);
          if (nextId) return nextId;
          setSessionDone(true);
          return null;
        });
      }, 200);
    },
    [card, ankiState]
  );

  // Progress: percent of cards reviewed in this session
  const reviewedCount = Object.values(ankiState).filter(
    (c) => c.lastReviewed > 0
  ).length;
  const progress = (reviewedCount / cards.length) * 100;

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

  // On mount or reset, pick first due card
  useEffect(() => {
    if (!currentId) {
      const nextId = getNextDueCardId(ankiState);
      setCurrentId(nextId);
    }
  }, [ankiState, currentId]);

  useEffect(() => {
    if (sessionDone && userId && projectId && projectName) {
      // Find the next due date from the SRS state
      const nextDue = Math.min(...Object.values(ankiState).map((c) => c.due));
      if (nextDue && nextDue > Date.now()) {
        scheduleSRSReminderForProject({
          user_id: userId,
          project_id: projectId,
          project_name: projectName,
          due: nextDue,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionDone, userId, projectId, projectName]);

  if (sessionDone) {
    // Find the next due date (after this session)
    const futureDueDates = Object.values(ankiState)
      .map((c) => c.due)
      .filter((d) => d > Date.now());
    const nextDue =
      futureDueDates.length > 0 ? Math.min(...futureDueDates) : null;
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-success mx-auto mb-4" />
          <div className="text-2xl font-bold text-success mb-2">
            Session complete!
          </div>
          <div className="text-base-content/70 mb-2">
            All due cards reviewed for now. Come back later for more!
          </div>
          {nextDue && (
            <div className="text-base-content/60 mb-4">
              <span>Next review scheduled for: </span>
              <span className="font-semibold">
                {new Date(nextDue).toLocaleString()}
              </span>
            </div>
          )}
          {!nextDue && (
            <div className="text-base-content/60 mb-4">
              No future reviews scheduled.
            </div>
          )}
          <button className="btn btn-primary" onClick={handleReset}>
            Restart Session
          </button>
        </div>
      </div>
    );
  }
  if (!card) return null;

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

        {/* Progress Bar */}
        <div className="w-full bg-base-200 rounded-full h-2 mb-4">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-sm">
          <div className="text-base-content/70">
            {reviewedCount} of {cards.length} reviewed
          </div>
          <div className="text-base-content/70">
            Due:{" "}
            {Object.values(ankiState).filter((c) => c.due <= Date.now()).length}
          </div>
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
                  {card.question}
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
                  {card.answer}
                </div>
                <div className="flex items-center justify-center gap-2 text-base-content/60 text-sm">
                  <span>Click or press Space to show question</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Anki Rating Controls (show only when flipped) */}
      <AnkiRatingControls flipped={flipped} handleRate={handleRate} />

      {/* Shortcuts */}
      <div className="mt-8 text-xs text-base-content/50 text-center">
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
