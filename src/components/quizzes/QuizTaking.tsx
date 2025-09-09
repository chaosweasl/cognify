"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Clock,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Flag,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface QuizQuestion {
  id: string;
  type: "multiple-choice" | "true-false" | "short-answer" | "fill-blank";
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
  difficulty: string;
}

interface Quiz {
  id: string;
  project_id: string;
  title: string;
  questions: QuizQuestion[];
  settings: {
    timeLimit?: number;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    passingScore: number;
    allowRetakes: boolean;
    showCorrectAnswers: boolean;
    metadata: {
      sourceFile: string;
      generatedAt: string;
      totalPoints: number;
      questionTypes: string[];
    };
  };
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface QuizTakingProps {
  quiz: Quiz;
  projectId: string;
}

export default function QuizTaking({ quiz, projectId }: QuizTakingProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(
    quiz.settings.timeLimit ? quiz.settings.timeLimit * 60 : null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(
    new Set()
  );
  const router = useRouter();

  // Shuffle questions and options if settings require it
  const [shuffledQuestions] = useState(() => {
    const questions = [...quiz.questions];
    if (quiz.settings.shuffleQuestions) {
      return questions.sort(() => Math.random() - 0.5);
    }
    return questions;
  });

  const currentQuestion = shuffledQuestions[currentQuestionIndex];

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);

    try {
      const startTime = quiz.settings.timeLimit
        ? quiz.settings.timeLimit * 60
        : 0;
      const timeSpent = timeRemaining ? startTime - timeRemaining : undefined;

      const response = await fetch("/api/quiz-attempts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quiz_id: quiz.id,
          answers,
          time_spent_seconds: timeSpent,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit quiz");
      }

      await response.json(); // Just consume the response
      toast.success("Quiz submitted successfully!");

      // Redirect to results or back to quizzes
      router.push(`/projects/${projectId}/quizzes`);
    } catch (error) {
      console.error("Error submitting quiz:", error);
      toast.error("Failed to submit quiz. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    quiz.id,
    quiz.settings.timeLimit,
    timeRemaining,
    answers,
    projectId,
    router,
  ]);

  // Timer effect
  useEffect(() => {
    if (!hasStarted || !timeRemaining || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev && prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev ? prev - 1 : null;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasStarted, timeRemaining, handleSubmit]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleAnswerChange = (
    questionId: string,
    answer: string | string[]
  ) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleFlagQuestion = (index: number) => {
    setFlaggedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const renderQuestion = (question: QuizQuestion) => {
    const questionId = question.id;
    const currentAnswer = answers[questionId];

    switch (question.type) {
      case "multiple-choice":
        const options = quiz.settings.shuffleOptions
          ? [...(question.options || [])].sort(() => Math.random() - 0.5)
          : question.options || [];

        return (
          <div className="space-y-3">
            {options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={questionId}
                  value={option}
                  checked={currentAnswer === option}
                  onChange={(e) =>
                    handleAnswerChange(questionId, e.target.value)
                  }
                  className="w-4 h-4 text-primary"
                  id={`${questionId}-${index}`}
                />
                <label
                  htmlFor={`${questionId}-${index}`}
                  className="cursor-pointer flex-1 text-sm"
                >
                  {option}
                </label>
              </div>
            ))}
          </div>
        );

      case "true-false":
        return (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                name={questionId}
                value="true"
                checked={currentAnswer === "true"}
                onChange={(e) => handleAnswerChange(questionId, e.target.value)}
                className="w-4 h-4 text-primary"
                id={`${questionId}-true`}
              />
              <label
                htmlFor={`${questionId}-true`}
                className="cursor-pointer text-sm"
              >
                True
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                name={questionId}
                value="false"
                checked={currentAnswer === "false"}
                onChange={(e) => handleAnswerChange(questionId, e.target.value)}
                className="w-4 h-4 text-primary"
                id={`${questionId}-false`}
              />
              <label
                htmlFor={`${questionId}-false`}
                className="cursor-pointer text-sm"
              >
                False
              </label>
            </div>
          </div>
        );

      case "short-answer":
        return (
          <Textarea
            placeholder="Enter your answer..."
            value={currentAnswer || ""}
            onChange={(e) => handleAnswerChange(questionId, e.target.value)}
            rows={4}
          />
        );

      case "fill-blank":
        return (
          <Input
            placeholder="Fill in the blank..."
            value={currentAnswer || ""}
            onChange={(e) => handleAnswerChange(questionId, e.target.value)}
          />
        );

      default:
        return <div>Unsupported question type</div>;
    }
  };

  if (!hasStarted) {
    return (
      <Card className="p-8">
        <div className="text-center space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">Ready to Start?</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>This quiz contains {quiz.questions.length} questions.</p>
              <p>Total points: {quiz.settings.metadata.totalPoints}</p>
              {quiz.settings.timeLimit && (
                <p>Time limit: {quiz.settings.timeLimit} minutes</p>
              )}
              <p>Passing score: {quiz.settings.passingScore}%</p>
              {!quiz.settings.allowRetakes && (
                <p className="text-orange-600 flex items-center justify-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  You can only take this quiz once
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {quiz.settings.metadata.questionTypes.length > 0 && (
              <div>
                <p className="font-medium mb-2">Question Types:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {quiz.settings.metadata.questionTypes.map((type, index) => (
                    <Badge key={index} variant="outline">
                      {type
                        .replace("-", " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
              <Button onClick={() => setHasStarted(true)}>Start Quiz</Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  const progress =
    ((currentQuestionIndex + 1) / shuffledQuestions.length) * 100;
  const answeredQuestions = Object.keys(answers).length;

  return (
    <div className="space-y-6">
      {/* Quiz Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of{" "}
                {shuffledQuestions.length}
              </p>
              <Progress value={progress} className="w-32 h-2 mt-1" />
            </div>
            <div className="text-sm text-muted-foreground">
              Answered: {answeredQuestions}/{shuffledQuestions.length}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {timeRemaining && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4" />
                <span
                  className={
                    timeRemaining < 300 ? "text-red-600 font-bold" : ""
                  }
                >
                  {formatTime(timeRemaining)}
                </span>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFlagQuestion(currentQuestionIndex)}
            >
              <Flag
                className={`w-4 h-4 mr-2 ${
                  flaggedQuestions.has(currentQuestionIndex)
                    ? "fill-current text-yellow-500"
                    : ""
                }`}
              />
              Flag
            </Button>
          </div>
        </div>
      </Card>

      {/* Question */}
      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline">
                  {currentQuestion.type
                    .replace("-", " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </Badge>
                <Badge variant="outline">
                  {currentQuestion.points} point
                  {currentQuestion.points !== 1 ? "s" : ""}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {currentQuestion.difficulty}
                </Badge>
              </div>
              <h3 className="text-lg font-medium mb-6">
                {currentQuestion.question}
              </h3>
            </div>
          </div>

          <div className="space-y-4">{renderQuestion(currentQuestion)}</div>
        </div>
      </Card>

      {/* Navigation */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() =>
              setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))
            }
            disabled={currentQuestionIndex === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-2">
            {currentQuestionIndex === shuffledQuestions.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="min-w-32"
              >
                {isSubmitting ? (
                  <>Submitting...</>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Submit Quiz
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={() =>
                  setCurrentQuestionIndex(
                    Math.min(
                      shuffledQuestions.length - 1,
                      currentQuestionIndex + 1
                    )
                  )
                }
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Question Overview */}
      {shuffledQuestions.length > 1 && (
        <Card className="p-4">
          <h4 className="text-sm font-medium mb-3">Question Overview</h4>
          <div className="grid grid-cols-10 gap-2">
            {shuffledQuestions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`
                  w-8 h-8 text-xs border rounded-md flex items-center justify-center
                  ${
                    index === currentQuestionIndex
                      ? "bg-primary text-primary-foreground border-primary"
                      : answers[shuffledQuestions[index].id]
                      ? "bg-green-100 border-green-300 text-green-700"
                      : "bg-muted border-border"
                  }
                  ${flaggedQuestions.has(index) ? "ring-2 ring-yellow-400" : ""}
                `}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
