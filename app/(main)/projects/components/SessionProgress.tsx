"use client";
import React from "react";

interface SessionProgressProps {
  reviewed: number;
  learningQueueCount: number;
}

export function SessionProgress({
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
            {learningQueueCount} cards in learning queue
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
      </div>
    </>
  );
}
