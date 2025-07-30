"use client";
import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  BookOpen,
  CheckCircle,
  XCircle,
  Pencil,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

interface StudyFlashcardsProps {
  flashcards: Flashcard[];
  projectName: string; // assumed to be a valid ID used in the URL path
}

export default function StudyFlashcards({
  flashcards,
  projectName,
}: StudyFlashcardsProps) {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [studyStats, setStudyStats] = useState({ correct: 0, incorrect: 0 });
  const [cardStatus, setCardStatus] = useState<{
    [key: string]: "correct" | "incorrect" | null;
  }>({});

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
  const card = cards[current];

  const handleFlip = () => setFlipped((f) => !f);

  const handleNext = React.useCallback(() => {
    setFlipped(false);
    setCurrent((prev) => (prev + 1 < cards.length ? prev + 1 : 0));
  }, [cards.length]);

  const handlePrev = React.useCallback(() => {
    setFlipped(false);
    setCurrent((prev) => (prev - 1 >= 0 ? prev - 1 : cards.length - 1));
  }, [cards.length]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") handlePrev();
      if (e.key === "ArrowRight" || e.key === "d") handleNext();
      if (e.key === " " || e.key === "f") {
        e.preventDefault();
        handleFlip();
      }
      if (e.key === "r") handleReset();
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [current, cards.length, handlePrev, handleNext]);

  const handleReset = () => {
    setCurrent(0);
    setFlipped(false);
    setStudyStats({ correct: 0, incorrect: 0 });
    setCardStatus({});
  };

  const markCard = (status: "correct" | "incorrect") => {
    const cardId = card.id;
    const wasAlreadyMarked = cardStatus[cardId];

    setCardStatus((prev) => ({ ...prev, [cardId]: status }));

    if (!wasAlreadyMarked) {
      setStudyStats((prev) => ({
        ...prev,
        [status]: prev[status] + 1,
      }));
    } else if (wasAlreadyMarked !== status) {
      setStudyStats((prev) => ({
        correct: prev.correct + (status === "correct" ? 1 : -1),
        incorrect: prev.incorrect + (status === "incorrect" ? 1 : -1),
      }));
    }
  };

  const progress = ((current + 1) / cards.length) * 100;
  const currentCardStatus = cardStatus[card.id];

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
              onClick={() => router.push(`/${projectName}/edit`)}
              className="btn btn-outline btn-sm gap-2"
              title="Edit flashcards"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={handleReset}
              className="btn btn-ghost btn-sm gap-2"
              title="Reset progress"
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

        {/* Stats */}
        <div className="flex justify-between items-center text-sm">
          <div className="flex gap-4">
            <div className="flex items-center gap-2 text-success">
              <CheckCircle className="w-4 h-4" />
              <span>{studyStats.correct} correct</span>
            </div>
            <div className="flex items-center gap-2 text-error">
              <XCircle className="w-4 h-4" />
              <span>{studyStats.incorrect} incorrect</span>
            </div>
          </div>
          <div className="text-base-content/70">
            Card {current + 1} of {cards.length}
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
              className={`absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-base-100 to-base-200 shadow-xl rounded-2xl border-2 [backface-visibility:hidden] transition-all duration-300 ${
                currentCardStatus === "correct"
                  ? "border-success shadow-success/20"
                  : currentCardStatus === "incorrect"
                  ? "border-error shadow-error/20"
                  : "border-base-300 hover:border-primary/50"
              }`}
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
              className={`absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 shadow-xl rounded-2xl border-2 [backface-visibility:hidden] [transform:rotateY(180deg)] transition-all duration-300 ${
                currentCardStatus === "correct"
                  ? "border-success shadow-success/20"
                  : currentCardStatus === "incorrect"
                  ? "border-error shadow-error/20"
                  : "border-primary/30"
              }`}
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

      {/* Controls (always render to prevent layout shift) */}
      <div
        className={`flex gap-3 mb-6 min-h-[48px] transition-all duration-200 ${
          flipped
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!flipped}
      >
        <button
          onClick={() => markCard("incorrect")}
          className={`btn btn-outline ${
            currentCardStatus === "incorrect" ? "btn-error" : "hover:btn-error"
          } gap-2`}
        >
          <XCircle className="w-4 h-4" />
          Incorrect
        </button>
        <button
          onClick={() => markCard("correct")}
          className={`btn btn-outline ${
            currentCardStatus === "correct"
              ? "btn-success"
              : "hover:btn-success"
          } gap-2`}
        >
          <CheckCircle className="w-4 h-4" />
          Correct
        </button>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-2 flex-wrap justify-center">
        <button
          className="btn btn-md btn-outline"
          onClick={handlePrev}
          disabled={cards.length <= 1}
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        <div className="flex items-center gap-0.5 text-base-content/70 text-sm bg-base-200 px-4 py-2 rounded-full">
          <span className="font-medium">{current + 1}</span>
          <span>/</span>
          <span>{cards.length}</span>
        </div>

        <button
          className="btn btn-md btn-primary"
          onClick={handleNext}
          disabled={cards.length <= 1}
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Shortcuts */}
      <div className="mt-8 text-xs text-base-content/50 text-center">
        <div className="hidden lg:flex flex-wrap justify-center gap-4">
          <span>← / A: Previous</span>
          <span>→ / D: Next</span>
          <span>Space / F: Flip</span>
          <span>R: Reset</span>
        </div>
      </div>
    </div>
  );
}
