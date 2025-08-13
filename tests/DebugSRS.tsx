"use client";

import { useState } from "react";
import {
  debugStudyAvailability,
  fixStuckCards,
  createDueCards,
} from "./debug-actions";

interface DebugSRSProps {
  projectId: string;
}

interface DebugData {
  summary: {
    totalFlashcards: number;
    totalSRSStates: number;
    cardsWithoutSRS: number;
    cardsInNewState: number;
    totalNewCards: number;
    availableNewCards: number;
    dueLearningCards: number;
    dueReviewCards: number;
    futureLearningCards: number;
    futureReviewCards: number;
    hasCardsToStudy: boolean;
  };
  dailyProgress: {
    newCardsStudiedToday: number;
    reviewsCompletedToday: number;
    remainingNewCardSlots: number;
    date: string;
  };
  stateBreakdown: Record<string, number>;
  nextDueTimes: {
    nextLearningCard: number | null;
    nextReviewCard: number | null;
  };
}

export default function DebugSRS({ projectId }: DebugSRSProps) {
  const [debugData, setDebugData] = useState<DebugData | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleDebug = async () => {
    setLoading(true);
    setMessage("");
    try {
      const result = await debugStudyAvailability(projectId);
      setDebugData(result);
    } catch (error) {
      setMessage(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFixStuckCards = async () => {
    setLoading(true);
    setMessage("");
    try {
      const result = await fixStuckCards(projectId);
      setMessage(result.message);
      // Refresh debug data
      handleDebug();
    } catch (error) {
      setMessage(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDueCards = async () => {
    setLoading(true);
    setMessage("");
    try {
      const result = await createDueCards(projectId, 5);
      setMessage(result.message);
      // Refresh debug data
      handleDebug();
    } catch (error) {
      setMessage(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: number | null) => {
    if (!timestamp) return "N/A";
    const now = new Date();
    const diffMinutes = Math.round((timestamp - now.getTime()) / (60 * 1000));

    if (diffMinutes < 0) {
      return `${Math.abs(diffMinutes)} minutes ago`;
    } else if (diffMinutes < 60) {
      return `in ${diffMinutes} minutes`;
    } else if (diffMinutes < 1440) {
      return `in ${Math.round(diffMinutes / 60)} hours`;
    } else {
      return `in ${Math.round(diffMinutes / 1440)} days`;
    }
  };

  return (
    <div className="card bg-base-100 shadow-sm border border-base-200 mb-6">
      <div className="card-body">
        <h3 className="card-title text-warning">🔧 SRS Debug Tools</h3>
        <p className="text-sm text-base-content/70 mb-4">
          Use these tools to diagnose and fix issues with card availability.
        </p>

        <div className="flex gap-2 mb-4">
          <button
            className={`btn btn-sm ${loading ? "loading" : ""}`}
            onClick={handleDebug}
            disabled={loading}
          >
            Analyze Cards
          </button>
          <button
            className={`btn btn-sm btn-warning ${loading ? "loading" : ""}`}
            onClick={handleFixStuckCards}
            disabled={loading}
          >
            Fix Stuck Cards
          </button>
          <button
            className={`btn btn-sm btn-secondary ${loading ? "loading" : ""}`}
            onClick={handleCreateDueCards}
            disabled={loading}
          >
            Create Test Cards
          </button>
        </div>

        {message && (
          <div className="alert alert-info alert-sm">
            <span>{message}</span>
          </div>
        )}

        {debugData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="stat bg-base-200 rounded p-3">
                <div className="stat-title text-xs">Total Cards</div>
                <div className="stat-value text-lg">
                  {debugData.summary.totalFlashcards}
                </div>
              </div>
              <div className="stat bg-base-200 rounded p-3">
                <div className="stat-title text-xs">With SRS State</div>
                <div className="stat-value text-lg">
                  {debugData.summary.totalSRSStates}
                </div>
              </div>
              <div className="stat bg-base-200 rounded p-3">
                <div className="stat-title text-xs">In New State</div>
                <div className="stat-value text-lg">
                  {debugData.summary.cardsInNewState}
                </div>
              </div>
              <div className="stat bg-base-200 rounded p-3">
                <div className="stat-title text-xs">Available New</div>
                <div className="stat-value text-lg">
                  {debugData.summary.availableNewCards}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="stat bg-green-100 dark:bg-green-900/20 rounded p-3">
                <div className="stat-title text-xs">Due Learning</div>
                <div className="stat-value text-lg text-green-600">
                  {debugData.summary.dueLearningCards}
                </div>
              </div>
              <div className="stat bg-blue-100 dark:bg-blue-900/20 rounded p-3">
                <div className="stat-title text-xs">Due Review</div>
                <div className="stat-value text-lg text-blue-600">
                  {debugData.summary.dueReviewCards}
                </div>
              </div>
              <div className="stat bg-yellow-100 dark:bg-yellow-900/20 rounded p-3">
                <div className="stat-title text-xs">Future Learning</div>
                <div className="stat-value text-lg text-yellow-600">
                  {debugData.summary.futureLearningCards}
                </div>
              </div>
              <div className="stat bg-purple-100 dark:bg-purple-900/20 rounded p-3">
                <div className="stat-title text-xs">Future Review</div>
                <div className="stat-value text-lg text-purple-600">
                  {debugData.summary.futureReviewCards}
                </div>
              </div>
            </div>

            <div className="alert alert-info">
              <span>
                <strong>Cards available for study:</strong>{" "}
                {debugData.summary.hasCardsToStudy ? "✅ Yes" : "❌ No"}
              </span>
            </div>

            <div className="collapse collapse-arrow bg-base-200">
              <input type="checkbox" />
              <div className="collapse-title text-sm font-medium">
                Daily Progress & Next Due Times
              </div>
              <div className="collapse-content">
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Date:</strong> {debugData.dailyProgress.date}
                  </div>
                  <div>
                    <strong>New cards studied today:</strong>{" "}
                    {debugData.dailyProgress.newCardsStudiedToday}
                  </div>
                  <div>
                    <strong>Reviews completed today:</strong>{" "}
                    {debugData.dailyProgress.reviewsCompletedToday}
                  </div>
                  <div>
                    <strong>Remaining new card slots:</strong>{" "}
                    {debugData.dailyProgress.remainingNewCardSlots}
                  </div>
                  <div>
                    <strong>Next learning card due:</strong>{" "}
                    {formatTime(debugData.nextDueTimes.nextLearningCard)}
                  </div>
                  <div>
                    <strong>Next review card due:</strong>{" "}
                    {formatTime(debugData.nextDueTimes.nextReviewCard)}
                  </div>
                </div>
              </div>
            </div>

            <div className="collapse collapse-arrow bg-base-200">
              <input type="checkbox" />
              <div className="collapse-title text-sm font-medium">
                Card State Breakdown
              </div>
              <div className="collapse-content">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(debugData.stateBreakdown).map(
                    ([state, count]) => (
                      <div key={state} className="flex justify-between">
                        <span className="capitalize">{state}:</span>
                        <span className="font-mono">{count as number}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
