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
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
      <div className="bg-base-100 rounded-lg p-3 text-center border">
        <div className="text-lg font-bold text-blue-600">{newCards}</div>
        <div className="text-xs text-base-content/70">New</div>
      </div>
      <div className="bg-base-100 rounded-lg p-3 text-center border">
        <div className="text-lg font-bold text-orange-600">{learningCards}</div>
        <div className="text-xs text-base-content/70">Learning</div>
      </div>
      <div className="bg-base-100 rounded-lg p-3 text-center border">
        <div className="text-lg font-bold text-green-600">{reviewCards}</div>
        <div className="text-xs text-base-content/70">Review</div>
      </div>
      <div className="bg-base-100 rounded-lg p-3 text-center border">
        <div className="text-lg font-bold text-primary">{dueCards}</div>
        <div className="text-xs text-base-content/70">Due Now</div>
      </div>
    </div>
  );
}
