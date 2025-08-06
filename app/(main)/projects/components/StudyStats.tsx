"use client";
import React from "react";

interface StudyStatsProps {
  newCards: number;
  learningCards: number;
  reviewCards: number;
  dueCards: number;
}

export function StudyStats({
  newCards,
  learningCards,
  reviewCards,
  dueCards,
}: StudyStatsProps) {
  // Combine due cards and review cards since due cards are just review cards that are ready
  const totalReviewCards = (reviewCards || 0) + (dueCards || 0);

  return (
    <div className="grid grid-cols-3 gap-4 mb-4">
      <div className="bg-base-100 rounded-lg p-3 text-center border">
        <div
          className={`text-lg font-bold ${
            newCards > 0 ? "text-blue-600" : "text-gray-400"
          }`}
        >
          {newCards}
        </div>
        <div className="text-xs text-base-content/70">New</div>
      </div>
      <div className="bg-base-100 rounded-lg p-3 text-center border">
        <div
          className={`text-lg font-bold ${
            learningCards > 0 ? "text-orange-600" : "text-gray-400"
          }`}
        >
          {learningCards}
        </div>
        <div className="text-xs text-base-content/70">Learning</div>
      </div>
      <div className="bg-base-100 rounded-lg p-3 text-center border">
        <div
          className={`text-lg font-bold ${
            totalReviewCards > 0 ? "text-green-600" : "text-gray-400"
          }`}
        >
          {totalReviewCards}
        </div>
        <div className="text-xs text-base-content/70">Review</div>
      </div>
    </div>
  );
}
