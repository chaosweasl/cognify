"use client";
import React from "react";

interface DailyLimitsProgressProps {
  newCardsStudied: number;
  reviewsCompleted: number;
  newCardsPerDay: number;
  maxReviewsPerDay: number;
}

export function DailyLimitsProgress({
  newCardsStudied,
  reviewsCompleted,
  newCardsPerDay,
  maxReviewsPerDay,
}: DailyLimitsProgressProps) {
  const newCardsProgress = (newCardsStudied / newCardsPerDay) * 100;
  const reviewsProgress =
    maxReviewsPerDay > 0 ? (reviewsCompleted / maxReviewsPerDay) * 100 : 0;

  const newCardsLimitReached = newCardsStudied >= newCardsPerDay;
  const reviewsLimitReached =
    maxReviewsPerDay > 0 && reviewsCompleted >= maxReviewsPerDay;

  return (
    <div className="space-y-3 mb-4 p-4 bg-base-100 rounded-lg border border-base-300">
      <h4 className="text-sm font-medium text-base-content">Daily Progress</h4>

      {/* New Cards */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-base-content/70">New cards today</span>
          <span
            className={`font-medium ${
              newCardsLimitReached ? "text-orange-600" : ""
            }`}
          >
            {newCardsStudied} / {newCardsPerDay}
            {newCardsLimitReached && " (Limit reached)"}
          </span>
        </div>
        <div className="w-full bg-base-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              newCardsLimitReached ? "bg-orange-500" : "bg-blue-500"
            }`}
            style={{
              width: `${Math.min(100, newCardsProgress)}%`,
            }}
          />
        </div>
      </div>

      {/* Reviews */}
      {maxReviewsPerDay > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-base-content/70">Reviews today</span>
            <span
              className={`font-medium ${
                reviewsLimitReached ? "text-red-600" : ""
              }`}
            >
              {reviewsCompleted} / {maxReviewsPerDay}
              {reviewsLimitReached && " (Limit reached)"}
            </span>
          </div>
          <div className="w-full bg-base-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                reviewsLimitReached ? "bg-red-500" : "bg-green-500"
              }`}
              style={{
                width: `${Math.min(100, reviewsProgress)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Unlimited reviews message */}
      {maxReviewsPerDay <= 0 && (
        <div className="text-sm text-base-content/70">
          Reviews: {reviewsCompleted} (unlimited)
        </div>
      )}
    </div>
  );
}
