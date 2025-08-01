"use client";
import React from "react";
import { BookOpen } from "lucide-react";

interface SessionStats {
  again: number;
  hard: number;
  good: number;
  easy: number;
  reviewed: number;
  timeSpent: number;
}

interface StudyStats {
  newCards: number;
  learningCards: number;
  reviewCards: number;
}

interface SessionCompleteProps {
  sessionStats: SessionStats;
  studyStats: StudyStats;
  nextReview: number | null;
  onReset: () => void;
}

export function SessionComplete({
  sessionStats,
  studyStats,
  nextReview,
  onReset,
}: SessionCompleteProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="w-full max-w-lg text-center space-y-6">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-success" />
          </div>
        </div>

        {/* Title */}
        <div>
          <h2 className="text-2xl font-bold text-base-content mb-2">
            Study Session Complete!
          </h2>
          <p className="text-base-content/70">
            Great work! You've completed all due cards.
          </p>
        </div>

        {/* Session Stats */}
        <div className="bg-base-100 rounded-xl border border-base-300 p-6">
          <h3 className="text-lg font-semibold text-base-content mb-4">
            Session Summary
          </h3>

          {/* Total Reviewed and Time */}
          <div className="grid grid-cols-2 gap-4 mb-6 pb-4 border-b border-base-300">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">
                {sessionStats.reviewed}
              </div>
              <div className="text-sm text-base-content/70">Cards Reviewed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-info mb-1">
                {sessionStats.timeSpent}m
              </div>
              <div className="text-sm text-base-content/70">Time Spent</div>
            </div>
          </div>

          {/* Rating Breakdown */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-success">
                {sessionStats.easy}
              </div>
              <div className="text-sm text-base-content/70">Easy</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-info">
                {sessionStats.good}
              </div>
              <div className="text-sm text-base-content/70">Good</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-warning">
                {sessionStats.hard}
              </div>
              <div className="text-sm text-base-content/70">Hard</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-error">
                {sessionStats.again}
              </div>
              <div className="text-sm text-base-content/70">Again</div>
            </div>
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
          <button className="btn btn-primary btn-wide" onClick={onReset}>
            Study Again
          </button>
        </div>
      </div>
    </div>
  );
}
