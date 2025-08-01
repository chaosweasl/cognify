"use client";
import React from "react";

interface ProjectSRSStatsProps {
  newCards: number;
  learningCards: number;
  reviewCards: number;
  dueCards: number;
  totalCards: number;
}

export function ProjectSRSStats({
  newCards,
  learningCards,
  reviewCards,
  dueCards,
  totalCards,
}: ProjectSRSStatsProps) {
  if (totalCards === 0) return null;

  const dueBadgeColor =
    dueCards > 0
      ? "bg-red-100 text-red-700 border-red-200"
      : "bg-gray-100 text-gray-500 border-gray-200";
  const newBadgeColor =
    newCards > 0
      ? "bg-blue-100 text-blue-700 border-blue-200"
      : "bg-gray-100 text-gray-500 border-gray-200";

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {/* Due Cards - Most Important */}
      {dueCards > 0 && (
        <div
          className={`px-2 py-1 rounded-full text-xs font-medium border ${dueBadgeColor}`}
        >
          {dueCards} due
        </div>
      )}

      {/* New Cards */}
      {newCards > 0 && (
        <div
          className={`px-2 py-1 rounded-full text-xs font-medium border ${newBadgeColor}`}
        >
          {newCards} new
        </div>
      )}

      {/* Learning Cards */}
      {learningCards > 0 && (
        <div className="px-2 py-1 rounded-full text-xs font-medium border bg-orange-100 text-orange-700 border-orange-200">
          {learningCards} learning
        </div>
      )}

      {/* Review Cards (only show if no due cards) */}
      {dueCards === 0 && reviewCards > 0 && (
        <div className="px-2 py-1 rounded-full text-xs font-medium border bg-green-100 text-green-700 border-green-200">
          {reviewCards} mature
        </div>
      )}

      {/* All caught up message */}
      {dueCards === 0 && newCards === 0 && learningCards === 0 && (
        <div className="px-2 py-1 rounded-full text-xs font-medium border bg-green-100 text-green-700 border-green-200">
          ✓ All caught up
        </div>
      )}
    </div>
  );
}
