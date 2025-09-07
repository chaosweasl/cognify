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
  dueCards: number;
}

interface SessionCompleteProps {
  sessionStats: SessionStats;
  studyStats: StudyStats;
  nextReview: number | null;
}

export function SessionComplete({
  sessionStats,
  studyStats,
  nextReview,
}: SessionCompleteProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="w-full max-w-lg text-center space-y-6">
        {/* Enhanced Success Icon with Animation */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-status-success/10 border-2 border-status-success/20 flex items-center justify-center animate-pulse shadow-lg">
            <BookOpen className="w-8 h-8 text-status-success" />
          </div>
        </div>

        {/* Title */}
        <div>
          <h2 className="text-2xl font-bold text-primary mb-2">
            Study Session Complete!
          </h2>
          <p className="text-secondary">
            Great work! You&apos;ve completed all due cards.
          </p>
        </div>

        {/* Enhanced Session Stats */}
        <div className="glass-surface rounded-xl border border-subtle p-6 shadow-brand">
          <h3 className="text-lg font-semibold text-primary mb-4">
            Session Summary
          </h3>

          {/* Total Reviewed and Time */}
          <div className="grid grid-cols-2 gap-4 mb-6 pb-4 border-b border-subtle">
            <div className="text-center">
              <div className="text-2xl font-bold brand-primary mb-1">
                {sessionStats.reviewed}
              </div>
              <div className="text-sm text-secondary">Cards Reviewed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-status-info mb-1">
                {sessionStats.timeSpent}m
              </div>
              <div className="text-sm text-secondary">Time Spent</div>
            </div>
          </div>

          {/* Rating Breakdown with Enhanced Styling */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 surface-elevated rounded-lg border border-subtle hover:border-status-success transition-all transition-normal">
              <div className="text-xl font-bold text-status-success">
                {sessionStats.easy}
              </div>
              <div className="text-sm text-secondary">Easy</div>
            </div>
            <div className="text-center p-3 surface-elevated rounded-lg border border-subtle hover:border-brand-primary transition-all transition-normal">
              <div className="text-xl font-bold brand-primary">
                {sessionStats.good}
              </div>
              <div className="text-sm text-secondary">Good</div>
            </div>
            <div className="text-center p-3 surface-elevated rounded-lg border border-subtle hover:border-status-warning transition-all transition-normal">
              <div className="text-xl font-bold text-status-warning">
                {sessionStats.hard}
              </div>
              <div className="text-sm text-secondary">Hard</div>
            </div>
            <div className="text-center p-3 surface-elevated rounded-lg border border-subtle hover:border-status-error transition-all transition-normal">
              <div className="text-xl font-bold text-status-error">
                {sessionStats.again}
              </div>
              <div className="text-sm text-secondary">Again</div>
            </div>
          </div>
        </div>

        {/* Study Progress Overview */}
        <div className="surface-elevated rounded-lg p-4 space-y-3">
          <div className="text-sm font-medium text-primary">Study Progress</div>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <div className="font-bold brand-primary">
                {studyStats.newCards}
              </div>
              <div className="text-muted">New</div>
            </div>
            <div>
              <div className="font-bold text-status-warning">
                {studyStats.learningCards}
              </div>
              <div className="text-muted">Learning</div>
            </div>
            <div>
              <div className="font-bold text-status-success">
                {studyStats.dueCards}
              </div>
              <div className="text-muted">Due</div>
            </div>
          </div>
        </div>

        {/* Enhanced Next Review Info */}
        {nextReview ? (
          <div className="surface-glass rounded-lg p-4 border border-subtle">
            <div className="text-sm text-secondary mb-1">
              Next review scheduled
            </div>
            <div className="font-medium text-primary">
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
          <div className="surface-glass rounded-lg p-4 border border-subtle">
            <div className="text-sm text-secondary">
              No future reviews scheduled
            </div>
          </div>
        )}

        {/* Enhanced Action Buttons */}
        <div className="pt-2 space-y-3">
          <div className="text-center space-y-2">
            <p className="text-sm text-secondary">
              Daily study session complete! Come back tomorrow or adjust your
              limits in Settings.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <button
                className="surface-glass border-subtle text-primary hover:surface-elevated hover:border-brand interactive-hover px-4 py-2 rounded-md text-sm font-medium transition-all transition-normal"
                onClick={() => (window.location.href = "/projects")}
              >
                Back to Projects
              </button>
              <button
                className="bg-gradient-brand hover:bg-gradient-brand-hover text-white px-4 py-2 rounded-md text-sm font-medium transition-all transition-normal shadow-brand transform hover:scale-[1.02]"
                onClick={() =>
                  (window.location.href = window.location.pathname.replace(
                    "/study",
                    "/edit"
                  ))
                }
              >
                Edit Project
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
