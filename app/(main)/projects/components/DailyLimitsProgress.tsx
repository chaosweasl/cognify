"use client";
import React from "react";
import { SRS_SETTINGS } from "./SRSScheduler";

interface DailyLimitsProgressProps {
  newCardsStudied: number;
  reviewsCompleted: number;
}

export function DailyLimitsProgress({
  newCardsStudied,
  reviewsCompleted,
}: DailyLimitsProgressProps) {
  return (
    <div className="space-y-2 mb-4">
      <div className="flex justify-between items-center text-sm">
        <span className="text-base-content/70">New cards today</span>
        <span className="font-medium">
          {newCardsStudied} / {SRS_SETTINGS.NEW_CARDS_PER_DAY}
        </span>
      </div>
      <div className="w-full bg-base-200 rounded-full h-2">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{
            width: `${Math.min(
              100,
              (newCardsStudied / SRS_SETTINGS.NEW_CARDS_PER_DAY) * 100
            )}%`,
          }}
        />
      </div>

      {SRS_SETTINGS.MAX_REVIEWS_PER_DAY > 0 && (
        <>
          <div className="flex justify-between items-center text-sm">
            <span className="text-base-content/70">Reviews today</span>
            <span className="font-medium">
              {reviewsCompleted} / {SRS_SETTINGS.MAX_REVIEWS_PER_DAY}
            </span>
          </div>
          <div className="w-full bg-base-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(
                  100,
                  (reviewsCompleted / SRS_SETTINGS.MAX_REVIEWS_PER_DAY) * 100
                )}%`,
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
